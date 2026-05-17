import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  MapPin,
  Printer,
  Save,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { cnsdReadinessService } from '@/services/cnsdReadinessService';
import { CnsdReadinessSignaturePanel } from '@/pages/cnsd/components/CnsdReadinessSignaturePanel';
import { cn } from '@/lib/utils';
import type {
  CnsdReadinessItem,
  CnsdReadinessRecordDetail,
  CnsdReadinessSectionMeta,
} from '@/types/cnsd';

/**
 * Detail / edit page for a single CNSD readiness record.
 *
 * Flow:
 *   1. Fetch record by ID; render header (form_number, date, shift, location,
 *      manager, supervisor, technician count).
 *   2. Render section tabs. Each section is a table of items where status,
 *      kondisi_operasional_1, kondisi_operasional_2, and keterangan are editable.
 *   3. "Simpan Perubahan" calls PUT /api/v1/cnsd/readiness/{id} with the dirty
 *      items only.
 *   4. Signature panel sits below the editable items.
 *
 * Completed records render as read-only.
 */
export const CnsdReadinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdReadinessRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdReadinessItem>>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────
  const fetchRecord = useCallback(async () => {
    if (!recordId || Number.isNaN(recordId)) {
      setErrorMessage('ID form tidak valid.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cnsdReadinessService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
      if (data.sections_meta.length > 0 && !activeSection) {
        setActiveSection(data.sections_meta[0].name);
      }
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMessage('Form tidak ditemukan.');
      } else {
        setErrorMessage('Gagal memuat data form.');
      }
      setRecord(null);
    } finally {
      setIsLoading(false);
    }
  }, [recordId, activeSection]);

  useEffect(() => {
    void fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  // ─── Derived ──────────────────────────────────────────
  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdReadinessItem[]> = {};
    if (!record) return map;
    record.items.forEach((it) => {
      if (!map[it.section_name]) map[it.section_name] = [];
      map[it.section_name].push(it);
    });
    return map;
  }, [record]);

  const isCompleted = record?.status === 'completed';
  const isReadOnly = isCompleted;
  const hasChanges = Object.keys(editedItems).length > 0;

  // ─── Item editing ─────────────────────────────────────
  const updateField = (
    itemId: number,
    field: keyof CnsdReadinessItem,
    value: string | null,
  ) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? {}),
        [field]: value === '' ? null : value,
      },
    }));
  };

  const getValue = (item: CnsdReadinessItem, field: keyof CnsdReadinessItem): string => {
    const edited = editedItems[item.id];
    if (edited && field in edited) {
      const v = edited[field];
      return v == null ? '' : String(v);
    }
    const original = item[field];
    return original == null ? '' : String(original);
  };

  // ─── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!record || !hasChanges) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const items = Object.entries(editedItems).map(([rawId, patch]) => ({
      id: Number(rawId),
      status_peralatan:      'status_peralatan'      in patch ? patch.status_peralatan ?? null : undefined,
      kondisi_operasional_1: 'kondisi_operasional_1' in patch ? patch.kondisi_operasional_1 ?? null : undefined,
      kondisi_operasional_2: 'kondisi_operasional_2' in patch ? patch.kondisi_operasional_2 ?? null : undefined,
      keterangan:            'keterangan'            in patch ? patch.keterangan ?? null : undefined,
    }));

    try {
      const updated = await cnsdReadinessService.updateRecord(record.id, { items });
      setRecord(updated);
      setEditedItems({});
      setSuccessMessage(`${items.length} item disimpan.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan perubahan.');
      } else {
        setErrorMessage('Koneksi gagal, coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-700">{errorMessage ?? 'Form tidak ditemukan.'}</h2>
        <Button variant="outline" onClick={() => navigate('/cnsd/readiness')} className="gap-2">
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/cnsd')}
          className="hover:text-slate-700 transition-colors"
        >
          CNSD
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/cnsd/readiness')}
          className="hover:text-slate-700 transition-colors"
        >
          Kesiapan Peralatan
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium font-mono">{record.form_number}</span>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cnsd/readiness')}
                className="gap-1.5 -ml-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-maintenance-cnsd" />
                  <h1 className="text-xl font-bold text-slate-900">Form {record.form_type}: Kesiapan Peralatan</h1>
                  <StatusBadge status={record.status} variant="pill" />
                </div>
                <p className="text-xs font-mono text-slate-500">{record.form_number}</p>
                <p className="text-sm text-slate-500">
                  {record.location}{record.room ? ` — ${record.room}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <Calendar size={14} className="text-slate-400" />
                {record.date}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <ShiftBadge shift={record.shift_type} />
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <MapPin size={14} className="text-slate-400" />
                {record.facility}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <Users size={14} className="text-slate-400" />
                {record.technicians.length} Teknisi
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/cnsd/readiness/${record.id}/print`)}
                className="gap-1.5 shrink-0"
                title="Print / Cetak Form EQ-1"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager Teknik</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {record.manager?.name ?? <span className="text-slate-400 font-normal">Tidak ditugaskan</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor CNSD</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {record.supervisor?.name ?? <span className="text-slate-400 font-normal">Tidak ditugaskan</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teknisi CNSD</p>
              <p className="mt-0.5 text-slate-800 font-medium truncate" title={record.technicians.map((t) => t.technician_name).join(', ')}>
                {record.technicians.map((t) => t.technician_name).join(', ') || <span className="text-slate-400 font-normal">—</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Section tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {record.sections_meta.map((s) => (
          <button
            key={s.name}
            onClick={() => setActiveSection(s.name)}
            className={cn(
              'rounded-xl border-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 text-center',
              activeSection === s.name
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-700'
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Active section table */}
      {activeSection && (
        <CnsdSectionTable
          sectionMeta={record.sections_meta.find((m) => m.name === activeSection) ?? null}
          items={itemsBySection[activeSection] ?? []}
          isReadOnly={isReadOnly}
          getValue={getValue}
          onChange={updateField}
        />
      )}

      {/* Save button */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {hasChanges && (
            <span className="text-xs text-amber-600 font-medium">
              {Object.keys(editedItems).length} item belum disimpan
            </span>
          )}
          <Button
            onClick={() => void handleSave()}
            disabled={!hasChanges}
            isLoading={isSaving}
            className="gap-2"
          >
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      )}

      {/* Signature panel */}
      <CnsdReadinessSignaturePanel record={record} onUpdated={(r) => setRecord(r)} />
    </div>
  );
};

// ────────────────────────────────────────────────────────
// Internal: section table

interface SectionTableProps {
  sectionMeta: CnsdReadinessSectionMeta | null;
  items: CnsdReadinessItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdReadinessItem, field: keyof CnsdReadinessItem) => string;
  onChange: (itemId: number, field: keyof CnsdReadinessItem, value: string | null) => void;
}

const STATUS_OPTIONS = ['', 'NORMAL', 'TIDAK NORMAL'];

const CnsdSectionTable: React.FC<SectionTableProps> = ({
  sectionMeta,
  items,
  isReadOnly,
  getValue,
  onChange,
}) => {
  if (!sectionMeta || items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-slate-400">
          Tidak ada item pada section ini.
        </CardContent>
      </Card>
    );
  }

  const inputClass = 'w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider">{sectionMeta.name}</CardTitle>
          <span className="text-xs font-medium text-slate-400">{items.length} item</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <th className="px-4 py-3 text-left w-12">No</th>
              <th className="px-4 py-3 text-left w-56">Nama Peralatan</th>
              <th className="px-4 py-3 text-left w-32">Status</th>
              <th className="px-4 py-3 text-left">{sectionMeta.columns_label_1 ?? '—'}</th>
              <th className="px-4 py-3 text-left">{sectionMeta.columns_label_2 ?? '—'}</th>
              <th className="px-4 py-3 text-left w-56">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const status = getValue(item, 'status_peralatan');
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                    {item.item_number ?? idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800 font-semibold">{item.equipment_name}</div>
                    {item.sub_equipment_name && (
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {item.sub_equipment_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={cn(inputClass, 'font-bold',
                        status === 'NORMAL' && 'bg-emerald-50 text-emerald-700',
                        status === 'TIDAK NORMAL' && 'bg-red-50 text-red-700',
                      )}
                      value={status}
                      onChange={(e) => onChange(item.id, 'status_peralatan', e.target.value)}
                      disabled={isReadOnly}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt === '' ? '—' : opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="..."
                      value={getValue(item, 'kondisi_operasional_1')}
                      onChange={(e) => onChange(item.id, 'kondisi_operasional_1', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="..."
                      value={getValue(item, 'kondisi_operasional_2')}
                      onChange={(e) => onChange(item.id, 'kondisi_operasional_2', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Catatan"
                      value={getValue(item, 'keterangan')}
                      onChange={(e) => onChange(item.id, 'keterangan', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
