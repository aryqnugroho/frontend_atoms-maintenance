import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { reportingDamageReportService } from '@/services/reportingDamageReportService';
import {
  DAMAGE_CATEGORY_LABELS,
  DAMAGE_CATEGORY_ORDER,
  OBSTACLE_CODE_LABELS,
  OBSTACLE_CODE_ORDER,
  normalizeDamageCategory,
} from '@/types/reporting';
import type {
  CreateReportingDamageReportPayload,
  DamageCategory,
  ObstacleCode,
  RepairByType,
  ReportingDamageReportDetail,
  ReportingPerson,
} from '@/types/reporting';
import { ReportingDamageSignaturePanel } from './components/ReportingDamageSignaturePanel';

interface FormState {
  // Section 1
  report_date: string;
  location: string;
  facility: string;
  equipment_name: string;
  equipment_module: string;
  damage_category: DamageCategory;
  // Section 2
  damage_description: string;
  damage_cause: string;
  // Section 3
  repair_action: string;
  repair_by_type: RepairByType | '';
  // Section 4
  damage_started_at: string;   // datetime-local string YYYY-MM-DDTHH:MM
  repair_finished_at: string;
  downtime_hours: string;
  // Section 5
  obstacle_code: ObstacleCode | '';
  obstacle_description: string;
  // Section 6
  manager_id: number | null;
  repairers: Array<{
    id?: number | null;
    person_id: number | null;
    person_name: string;
    person_role: string | null;
    person_division: string | null;
  }>;
}

const defaultFormState = (): FormState => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return {
    report_date: `${yyyy}-${mm}-${dd}`,
    location: '',
    facility: '',
    equipment_name: '',
    equipment_module: '',
    damage_category: '1',
    damage_description: '',
    damage_cause: '',
    repair_action: '',
    repair_by_type: 'lokasi',
    damage_started_at: '',
    repair_finished_at: '',
    downtime_hours: '',
    obstacle_code: '',
    obstacle_description: '',
    manager_id: null,
    repairers: [],
  };
};

const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const fromDateTimeLocal = (v: string): string | null => {
  if (!v) return null;
  // Browser already returns local time; pass as-is, backend will parse
  return v;
};

export const ReportingDamageFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(defaultFormState());
  const [record, setRecord] = useState<ReportingDamageReportDetail | null>(null);
  const [managers, setManagers] = useState<ReportingPerson[]>([]);
  const [repairerOptions, setRepairerOptions] = useState<ReportingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing record for edit mode
  const loadRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await reportingDamageReportService.getReport(Number(id));
      setRecord(data);
      setForm({
        report_date: data.report_date,
        location: data.location ?? '',
        facility: data.facility ?? '',
        equipment_name: data.equipment_name ?? '',
        equipment_module: data.equipment_module ?? '',
        damage_category: normalizeDamageCategory(data.damage_category),
        damage_description: data.damage_description ?? '',
        damage_cause: data.damage_cause ?? '',
        repair_action: data.repair_action ?? '',
        repair_by_type: (data.repair_by_type ?? '') as RepairByType | '',
        damage_started_at: toDateTimeLocal(data.damage_started_at),
        repair_finished_at: toDateTimeLocal(data.repair_finished_at),
        downtime_hours: data.downtime_hours !== null && data.downtime_hours !== undefined
          ? String(data.downtime_hours)
          : '',
        obstacle_code: (data.obstacle_code ?? '') as ObstacleCode | '',
        obstacle_description: data.obstacle_description ?? '',
        manager_id: data.manager?.id ?? null,
        repairers: data.repairers.map((r) => ({
          id: r.id,
          person_id: r.person_id,
          person_name: r.person_name,
          person_role: r.person_role,
          person_division: r.person_division,
        })),
      });
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data laporan.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) void loadRecord();
  }, [isEdit, loadRecord]);

  // Load personnel selectors
  useEffect(() => {
    void (async () => {
      try {
        const [m, r] = await Promise.all([
          reportingDamageReportService.getManagers(),
          reportingDamageReportService.getRepairers(),
        ]);
        setManagers(m);
        setRepairerOptions(r);
      } catch {
        // Non-fatal — selectors will be empty, free-text fallback
      }
    })();
  }, []);

  // Auto-calc downtime when both timestamps present (only on create or unsaved edits)
  useEffect(() => {
    if (form.damage_started_at && form.repair_finished_at) {
      const start = new Date(form.damage_started_at);
      const end = new Date(form.repair_finished_at);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        // Only auto-fill if downtime_hours is empty or matches the previous auto-calc
        // Allow manual override: don't recalc if user already typed something
        setForm((prev) => {
          if (prev.downtime_hours === '') {
            return { ...prev, downtime_hours: hours.toFixed(2) };
          }
          return prev;
        });
      }
    }
  }, [form.damage_started_at, form.repair_finished_at]);

  const isCompleted = record?.status === 'completed';

  const usedPersonIds = useMemo(
    () => new Set(form.repairers.map((r) => r.person_id).filter((v): v is number => !!v)),
    [form.repairers],
  );

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRepairer = () => {
    setForm((prev) => ({
      ...prev,
      repairers: [
        ...prev.repairers,
        { id: null, person_id: null, person_name: '', person_role: null, person_division: null },
      ],
    }));
  };

  const handleSelectRepairer = (idx: number, personId: number) => {
    const person = repairerOptions.find((p) => p.id === personId);
    if (!person) return;
    setForm((prev) => ({
      ...prev,
      repairers: prev.repairers.map((r, i) =>
        i === idx
          ? {
              ...r,
              person_id: person.id,
              person_name: person.name,
              person_role: person.role,
              person_division: person.division,
            }
          : r,
      ),
    }));
  };

  const handleRemoveRepairer = (idx: number) => {
    const target = form.repairers[idx];
    if (target?.id && record?.repairers.find((r) => r.id === target.id && r.signature)) {
      alert('Pelaksana yang sudah menandatangani tidak dapat dihapus.');
      return;
    }
    setForm((prev) => ({ ...prev, repairers: prev.repairers.filter((_, i) => i !== idx) }));
  };

  const validate = (): string | null => {
    if (!form.report_date) return 'Tanggal laporan wajib diisi.';
    if (!form.location.trim()) return 'Lokasi wajib diisi.';
    if (!form.facility.trim()) return 'Fasilitas wajib diisi.';
    if (!form.equipment_name.trim()) return 'Nama peralatan wajib diisi.';
    if (!form.damage_category) return 'Kategori kerusakan wajib dipilih.';
    if (!form.damage_description.trim()) return 'Uraian kerusakan wajib diisi.';
    if (!form.manager_id) return 'Manager Teknik wajib dipilih.';
    if (form.repairers.length === 0) return 'Minimal satu pelaksana perbaikan harus ditambahkan.';
    for (const r of form.repairers) {
      if (!r.person_name.trim()) return 'Setiap pelaksana harus memiliki nama.';
    }
    if (form.obstacle_code === 'AL' && !form.obstacle_description.trim()) {
      return 'Alasan Lain wajib diisi ketika Kode Hambatan = AL.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const v = validate();
    if (v) {
      setErrorMessage(v);
      return;
    }

    setIsSaving(true);
    try {
      const downtime = form.downtime_hours.trim() === '' ? null : Number(form.downtime_hours);
      const payload: CreateReportingDamageReportPayload = {
        report_date: form.report_date,
        location: form.location.trim(),
        facility: form.facility.trim(),
        equipment_name: form.equipment_name.trim(),
        equipment_module: form.equipment_module.trim() || null,
        damage_category: form.damage_category,
        damage_description: form.damage_description.trim(),
        damage_cause: form.damage_cause.trim() || null,
        repair_action: form.repair_action.trim() || null,
        repair_by_type: form.repair_by_type || null,
        damage_started_at: fromDateTimeLocal(form.damage_started_at),
        repair_finished_at: fromDateTimeLocal(form.repair_finished_at),
        downtime_hours: Number.isFinite(downtime as number) ? (downtime as number) : null,
        obstacle_code: form.obstacle_code || null,
        obstacle_description: form.obstacle_description.trim() || null,
        manager_id: form.manager_id!,
        repairers: form.repairers.map((r) => ({
          person_id: r.person_id,
          person_name: r.person_name.trim(),
          person_role: r.person_role,
          person_division: r.person_division,
        })),
      };

      if (isEdit && record) {
        // Update payload: include repairer ids
        const updated = await reportingDamageReportService.updateReport(record.id, {
          ...payload,
          repairers: form.repairers.map((r) => ({
            id: r.id ?? null,
            person_id: r.person_id,
            person_name: r.person_name.trim(),
            person_role: r.person_role,
            person_division: r.person_division,
          })),
        });
        setRecord(updated);
        setSuccessMessage('Perubahan berhasil disimpan.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const created = await reportingDamageReportService.createReport(payload);
        navigate(`/reporting/damage-reports/${created.id}`, { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan laporan.');
      } else {
        setErrorMessage('Gagal menyimpan laporan. Coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignatureUpdate = (updated: ReportingDamageReportDetail) => {
    setRecord(updated);
    setForm((prev) => ({
      ...prev,
      repairers: updated.repairers.map((r) => ({
        id: r.id,
        person_id: r.person_id,
        person_name: r.person_name,
        person_role: r.person_role,
        person_division: r.person_division,
      })),
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/reporting')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} /> Reporting
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">
          {isEdit ? record?.report_number : 'Laporan Baru'}
        </span>
      </div>

      <PageHeader
        icon={ClipboardList}
        iconBg="bg-purple-100"
        iconColor="text-purple-700"
        title={isEdit ? `Laporan Kerusakan — ${record?.report_number ?? ''}` : 'Laporan Kerusakan'}
        subtitle={
          isEdit
            ? `${record?.equipment_name ?? ''} | ${record?.location ?? ''}`
            : 'Buat laporan kerusakan peralatan baru'
        }
        actions={
          <div className="flex items-center gap-2">
            {isEdit && record && (
              <Button
                variant="outline"
                onClick={() => navigate(`/reporting/damage-reports/${record.id}/print`)}
                className="gap-2"
              >
                <Printer size={15} /> Print
              </Button>
            )}
            {!isCompleted && (
              <Button onClick={handleSubmit} isLoading={isSaving} className="gap-2">
                <Save size={15} /> {isEdit ? 'Simpan Perubahan' : 'Buat Laporan'}
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Status badge for edit mode */}
      {isEdit && record && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
          <StatusBadge status={record.status} variant="pill" />
          <span className="text-xs text-slate-500">
            Tanggal: <strong className="text-slate-700">{record.day_name ?? '-'}, {record.report_date}</strong>
          </span>
          <span className="text-xs text-slate-500">
            Manager: <strong className="text-slate-700">{record.manager?.name ?? '—'}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Data Laporan */}
        <FormSection
          number={1}
          title="Data Laporan"
          subtitle="Identitas peralatan dan jenis kerusakan"
        >
          <Row>
            <Field label="Tanggal Laporan" required>
              <input
                type="date"
                value={form.report_date}
                onChange={(e) => setField('report_date', e.target.value)}
                disabled={isCompleted || isEdit}
                className={inputCls}
              />
              {isEdit && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Tanggal laporan tidak dapat diubah setelah laporan dibuat.
                </p>
              )}
            </Field>
            <Field label="Kategori Kerusakan" required>
              <select
                value={form.damage_category}
                onChange={(e) => setField('damage_category', e.target.value as DamageCategory)}
                disabled={isCompleted}
                className={inputCls}
              >
                {DAMAGE_CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Keterangan: 1 = {DAMAGE_CATEGORY_LABELS['1']}, 2 = {DAMAGE_CATEGORY_LABELS['2']}, 3 = {DAMAGE_CATEGORY_LABELS['3']}.
              </p>
            </Field>
          </Row>
          <Row>
            <Field label="Lokasi" required>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                disabled={isCompleted}
                placeholder="Contoh: Surabaya / Juanda"
                className={inputCls}
              />
            </Field>
            <Field label="Fasilitas" required>
              <input
                type="text"
                value={form.facility}
                onChange={(e) => setField('facility', e.target.value)}
                disabled={isCompleted}
                placeholder="Contoh: ATC / TWR"
                className={inputCls}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Nama Peralatan" required>
              <input
                type="text"
                value={form.equipment_name}
                onChange={(e) => setField('equipment_name', e.target.value)}
                disabled={isCompleted}
                placeholder="Contoh: VHF Recorder"
                className={inputCls}
              />
            </Field>
            <Field label="Bagian/Modul Peralatan">
              <input
                type="text"
                value={form.equipment_module}
                onChange={(e) => setField('equipment_module', e.target.value)}
                disabled={isCompleted}
                placeholder="Contoh: Power Supply Unit"
                className={inputCls}
              />
            </Field>
          </Row>
        </FormSection>

        {/* Section 2: Detail Kerusakan */}
        <FormSection
          number={2}
          title="Detail Kerusakan"
          subtitle="Uraian dan penyebab kerusakan"
        >
          <Field label="Uraian Kerusakan" required>
            <textarea
              value={form.damage_description}
              onChange={(e) => setField('damage_description', e.target.value)}
              disabled={isCompleted}
              rows={4}
              placeholder="Jelaskan secara rinci kerusakan yang terjadi..."
              className={`${inputCls} h-auto`}
            />
          </Field>
          <Field label="Penyebab Kerusakan">
            <textarea
              value={form.damage_cause}
              onChange={(e) => setField('damage_cause', e.target.value)}
              disabled={isCompleted}
              rows={3}
              placeholder="Penyebab kerusakan (jika diketahui)..."
              className={`${inputCls} h-auto`}
            />
          </Field>
        </FormSection>

        {/* Section 3: Tindakan Perbaikan */}
        <FormSection
          number={3}
          title="Tindakan Perbaikan"
          subtitle="Langkah perbaikan yang dilakukan"
        >
          <Field label="Tindakan Perbaikan">
            <textarea
              value={form.repair_action}
              onChange={(e) => setField('repair_action', e.target.value)}
              disabled={isCompleted}
              rows={4}
              placeholder="Jelaskan tindakan perbaikan yang dilakukan..."
              className={`${inputCls} h-auto`}
            />
          </Field>
          <Field label="Dikerjakan Oleh">
            <div className="flex gap-4 mt-1">
              {(['lokasi', 'pusat'] as const).map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="repair_by_type"
                    value={opt}
                    checked={form.repair_by_type === opt}
                    onChange={() => setField('repair_by_type', opt)}
                    disabled={isCompleted}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="capitalize">{opt}</span>
                </label>
              ))}
            </div>
          </Field>
        </FormSection>

        {/* Section 4: Waktu Kerusakan */}
        <FormSection
          number={4}
          title="Waktu Kerusakan dan Perbaikan"
          subtitle="Catat waktu mulai dan selesai perbaikan"
        >
          <Row>
            <Field label="Tanggal & Jam Kerusakan">
              <input
                type="datetime-local"
                value={form.damage_started_at}
                onChange={(e) => setField('damage_started_at', e.target.value)}
                disabled={isCompleted}
                className={inputCls}
              />
            </Field>
            <Field label="Tanggal & Jam Selesai Perbaikan">
              <input
                type="datetime-local"
                value={form.repair_finished_at}
                onChange={(e) => setField('repair_finished_at', e.target.value)}
                disabled={isCompleted}
                className={inputCls}
              />
            </Field>
          </Row>
          <Field label="Jumlah Jam Operasi Terputus">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.downtime_hours}
              onChange={(e) => setField('downtime_hours', e.target.value)}
              disabled={isCompleted}
              placeholder="Contoh: 2.5"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Otomatis terisi dari selisih waktu jika kosong. Boleh ditimpa manual.
            </p>
          </Field>
        </FormSection>

        {/* Section 5: Kode Hambatan */}
        <FormSection
          number={5}
          title="Kode Hambatan"
          subtitle="Pilih kode hambatan yang sesuai (opsional)"
        >
          <Field label="Kode Hambatan">
            <select
              value={form.obstacle_code}
              onChange={(e) => setField('obstacle_code', e.target.value as ObstacleCode | '')}
              disabled={isCompleted}
              className={inputCls}
            >
              <option value="">— Tidak ada —</option>
              {OBSTACLE_CODE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {code} - {OBSTACLE_CODE_LABELS[code]}
                </option>
              ))}
            </select>
          </Field>
          {form.obstacle_code === 'AL' && (
            <Field label="Alasan Lain" required>
              <textarea
                value={form.obstacle_description}
                onChange={(e) => setField('obstacle_description', e.target.value)}
                disabled={isCompleted}
                rows={3}
                placeholder="Jelaskan alasan lain..."
                className={`${inputCls} h-auto`}
              />
            </Field>
          )}
        </FormSection>

        {/* Section 6: Tanda Tangan */}
        <FormSection
          number={6}
          title="Penanggung Jawab"
          subtitle="Pilih Manager Teknik dan tambahkan Pelaksana Perbaikan secara manual"
        >
          <Field label="Manager Teknik" required>
            <select
              value={form.manager_id ?? ''}
              onChange={(e) => setField('manager_id', e.target.value ? Number(e.target.value) : null)}
              disabled={isCompleted || !!record?.manager?.signature}
              className={inputCls}
            >
              <option value="">— Pilih Manager Teknik —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {record?.manager?.signature && (
              <p className="text-[11px] text-amber-600 mt-1">
                Manager Teknik sudah menandatangani — pilihan tidak dapat diubah.
              </p>
            )}
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-700">
                Pelaksana Perbaikan <span className="text-red-500">*</span>
                <span className="ml-1 text-[11px] text-slate-400 font-normal">
                  (Teknisi/Supervisor CNSD atau TFP, fleksibel)
                </span>
              </label>
              {!isCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRepairer}
                  className="gap-1"
                >
                  <Plus size={13} /> Tambah Pelaksana
                </Button>
              )}
            </div>

            {form.repairers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
                <p className="text-sm text-slate-500">
                  Belum ada pelaksana. Klik <strong>Tambah Pelaksana</strong> untuk menambahkan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.repairers.map((r, idx) => {
                  const hasSignature = !!record?.repairers.find((x) => x.id === r.id && x.signature);
                  return (
                    <div
                      key={`${r.id ?? 'new'}-${idx}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <span className="text-xs font-mono text-slate-400 w-6 shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
                        <select
                          value={r.person_id ?? ''}
                          onChange={(e) =>
                            handleSelectRepairer(idx, Number(e.target.value))
                          }
                          disabled={isCompleted || hasSignature}
                          className={`${inputCls} text-xs`}
                        >
                          <option value="">— Pilih Personel —</option>
                          {repairerOptions
                            .filter((p) => p.id === r.person_id || !usedPersonIds.has(p.id))
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.role})
                              </option>
                            ))}
                        </select>
                        <span
                          className={`inline-flex items-center justify-center rounded-md border text-[11px] font-semibold px-2 py-1.5 whitespace-nowrap ${
                            r.person_division === 'CNSD'
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : r.person_division === 'TFP'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {r.person_role ?? '—'}
                        </span>
                      </div>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRepairer(idx)}
                          disabled={hasSignature}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          title={hasSignature ? 'Sudah TTD, tidak dapat dihapus' : 'Hapus'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FormSection>

        {/* Bottom Save button */}
        {!isCompleted && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="gap-2">
              <Save size={15} /> {isEdit ? 'Simpan Perubahan' : 'Buat Laporan'}
            </Button>
          </div>
        )}
      </form>

      {/* Signature panel (only shown after record exists) */}
      {isEdit && record && (
        <ReportingDamageSignaturePanel
          record={record}
          onUpdated={handleSignatureUpdate}
        />
      )}
    </div>
  );
};

// ─── Helper components ─────────────────────────────────────

const inputCls =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

const FormSection: React.FC<{
  number: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ number, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-transparent">
      <div className="flex items-baseline gap-3">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#222E6A] text-white text-xs font-bold shrink-0">
          {number}
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);
