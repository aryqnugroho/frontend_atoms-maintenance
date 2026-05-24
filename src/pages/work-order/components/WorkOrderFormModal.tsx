import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Plus, X } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { workOrderService } from '@/services/workOrderService';
import { getCurrentShiftType, getCurrentShiftDate } from '@/lib/shiftUtils';
import type { OutputType, WorkOrder, ShiftContextResponse, ShiftType } from '@/types';

const outputOptions: { label: string; value: OutputType }[] = [
  { label: 'Meter Reading / Pengukuran', value: 'meter_reading' },
  { label: 'Status Peralatan', value: 'status_peralatan' },
  { label: 'Logbook', value: 'logbook' },
  { label: 'Lainnya', value: 'other' },
];

interface WorkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number | null; // null means create mode
}

export const WorkOrderFormModal: React.FC<WorkOrderFormModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  const [woType, setWoType] = useState<'shift' | 'personal'>('shift');
  const [division, setDivision] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [description, setDescription] = useState('');
  const [outputs, setOutputs] = useState<OutputType[]>([]);
  const [outputOther, setOutputOther] = useState('');
  const [notesKendala, setNotesKendala] = useState('');
  const [notesUsulan, setNotesUsulan] = useState('');
  const [notesPemberiTugas, setNotesPemberiTugas] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);

  // ── Rostering shift context ─────────────────────────────────────────────
  // Loaded from GET /api/v1/personnel/shift-today on modal open.
  // - Create mode: filter by client-derived current date+shift
  // - Edit mode  : filter by the WO's own shift_date+shift_type so we always
  //                see the personnel that were actually on that shift.
  const [shiftContext, setShiftContext] = useState<ShiftContextResponse | null>(null);
  const [shiftContextLoading, setShiftContextLoading] = useState(false);

  // Initialize form state on open. Edit mode fetches the WO from the API.
  useEffect(() => {
    if (!isOpen) {
      setWorkOrder(null);
      setShiftContext(null);
      setSubmitError(null);
      return;
    }

    setSubmitError(null);

    if (workOrderId === null) {
      // Create mode
      setWorkOrder(null);
      setWoType('shift');
      setDivision('');
      setSelectedTechnician('');
      setDescription('');
      setOutputs([]);
      setOutputOther('');
      setNotesKendala('');
      setNotesUsulan('');
      setNotesPemberiTugas('');

      void loadShiftContext(getCurrentShiftType(), getCurrentShiftDate());
      return;
    }

    // Edit mode — fetch the real WO from the API
    let cancelled = false;

    const populateFromWo = (wo: WorkOrder) => {
      if (cancelled) return;
      setWorkOrder(wo);
      const isPersonal = wo.wo_type === 'personal'
        || (wo.wo_type !== 'shift' && wo.personnel.length === 1);
      setWoType(isPersonal ? 'personal' : 'shift');
      setDivision(wo.division);
      setSelectedTechnician(
        isPersonal && wo.personnel[0]?.user_id ? String(wo.personnel[0].user_id) : ''
      );
      setDescription(wo.description ?? '');
      setOutputs(wo.output_types ?? []);
      setOutputOther(wo.output_other ?? '');
      setNotesKendala(wo.notes_kendala ?? '');
      setNotesUsulan(wo.notes_usulan ?? '');
      setNotesPemberiTugas(wo.notes_pemberi_tugas ?? '');

      void loadShiftContext(wo.shift_type, wo.shift_date);
    };

    (async () => {
      try {
        const wo = await workOrderService.getWorkOrder(workOrderId);
        populateFromWo(wo);
      } catch {
        if (!cancelled) setSubmitError('Gagal memuat data Work Order.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workOrderId]);

  const loadShiftContext = async (shiftType: ShiftType, date: string) => {
    setShiftContextLoading(true);
    try {
      const ctx = await workOrderService.getShiftContext(shiftType, date);
      setShiftContext(ctx);
    } catch {
      setShiftContext(null);
    } finally {
      setShiftContextLoading(false);
    }
  };

  // Roster is the ONLY source of shift context — no mock fallback.
  const rosterAvailable = shiftContext?.roster_available ?? false;

  const toggleOutput = (val: OutputType) => {
    setOutputs((prev) =>
      prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]
    );
  };

  /** Pick the supervisor matching the chosen division from the roster. */
  const supervisorForDivision = (div: string) => {
    if (!shiftContext) return null;
    if (div === 'CNSD') return shiftContext.supervisor_cnsd ?? null;
    if (div === 'TFP') return shiftContext.supervisor_tfp ?? null;
    return null;
  };

  /** Available technicians in the chosen division, on this shift.
   *  When roster is unavailable, returns empty — backend will auto-fill from
   *  rostering when the WO is created (see WorkOrderService autoFillShift...). */
  const getAvailableTechnicians = (div: string): Array<{ id: number; name: string; role: string }> => {
    if (rosterAvailable && shiftContext && shiftContext.personnel.length > 0) {
      const empType = div === 'CNSD' ? 'CNS' : 'Support';
      return shiftContext.personnel
        .filter((p) => p.employee_type === empType)
        .map((p) => ({ id: p.user_id, name: p.name, role: p.employee_type }));
    }
    return [];
  };

  /** Build personnel array. Shift WO = all techs in division, Personal WO = the one selected. */
  const buildPersonnelArray = (div: string): { user_id: number; role_label: string }[] => {
    if (woType === 'personal' && selectedTechnician) {
      const techs = getAvailableTechnicians(div);
      const tech = techs.find((t) => t.id === Number(selectedTechnician));
      if (tech) return [{ user_id: tech.id, role_label: 'Teknisi' }];
      return [];
    }
    const techs = getAvailableTechnicians(div);
    return techs.map((t, i) => ({ user_id: t.id, role_label: `Teknisi ${i + 1}` }));
  };

  const extractErrorMessage = (err: unknown): string => {
    const fallback = 'Gagal menyimpan Work Order. Coba lagi.';
    if (typeof err !== 'object' || err === null) return fallback;
    const maybe = err as { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } };
    const data = maybe.response?.data;
    if (!data) return fallback;
    if (data.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === 'string') return first;
    }
    return data.message ?? fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isEdit = workOrderId !== null;

    // Frontend pre-validation — must mirror backend rules so we surface a clear
    // message before the request fires (and avoid silent 422s the user can't see).
    if (!isEdit) {
      if (!division) {
        setSubmitError('Pilih divisi tujuan Work Order.');
        focusError();
        return;
      }
      if (!description.trim()) {
        setSubmitError('Deskripsi perintah wajib diisi.');
        focusError();
        return;
      }
      if (outputs.length === 0) {
        setSubmitError('Pilih minimal satu output yang diharapkan.');
        focusError();
        return;
      }
      if (outputs.includes('other') && !outputOther.trim()) {
        setSubmitError('Tuliskan keterangan untuk output "Lainnya".');
        focusError();
        return;
      }
      if (woType === 'personal' && !selectedTechnician) {
        setSubmitError('Pilih satu teknisi untuk Work Order Personal.');
        focusError();
        return;
      }
    } else {
      // Edit mode — description and outputs still required
      if (!description.trim()) {
        setSubmitError('Deskripsi perintah wajib diisi.');
        focusError();
        return;
      }
      if (outputs.length === 0) {
        setSubmitError('Pilih minimal satu output yang diharapkan.');
        focusError();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isEdit && workOrder) {
        await workOrderService.updateWorkOrder(workOrder.id, {
          // Fields that the backend allows on update.
          // wo_type / division / personnel are intentionally NOT sent — those are
          // immutable on update by current backend rules.
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
        });
      } else {
        const personnelArray = buildPersonnelArray(division);

        if (import.meta.env.DEV) {
          // Safe payload summary for debugging — never logs token / signature.
          // eslint-disable-next-line no-console
          console.log('[WO submit] payload summary', {
            wo_type: woType,
            division,
            shift_type: shiftContext?.shift_type ?? getCurrentShiftType(),
            shift_date: getCurrentShiftDate(),
            description_len: description.length,
            output_types: outputs,
            personnel_count: personnelArray.length,
            roster_available: rosterAvailable,
          });
        }

        // Create. Send rostering_user_ids — backend resolves to local_users.id.
        // Backend auto-fills personnel from rostering when this array is empty
        // (shift WO with no roster personnel cached client-side).
        await workOrderService.createWorkOrder({
          wo_type: woType,
          shift_date: getCurrentShiftDate(),
          shift_type: shiftContext?.shift_type ?? getCurrentShiftType(),
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
          assigned_technician_id: woType === 'personal' ? Number(selectedTechnician) : undefined,
          personnel: personnelArray,
          // manager_id / supervisor_id intentionally omitted — backend
          // auto-resolves from rostering when roster is published.
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setSubmitError(msg);
      setIsSubmitting(false);
      focusError();
    }
  };

  const focusError = () => {
    // Defer to next paint so the banner is rendered before scrolling.
    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const availableTechnicians = getAvailableTechnicians(division);
  const isEdit = workOrderId !== null;
  const currentShiftType = shiftContext?.shift_type ?? getCurrentShiftType();
  const displayShift = isEdit && workOrder ? workOrder.shift_type : currentShiftType;
  const displayDate = isEdit && workOrder
    ? workOrder.shift_date
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const displayStatus = isEdit && workOrder ? workOrder.status.replace('_', ' ') : 'ONGOING';
  const modalTitle = isEdit ? `Edit Work Order: ${workOrder?.wo_number ?? ''}` : 'Buat Work Order Baru';

  // Resolved manager / supervisor for the read-only info card
  const resolvedManager = rosterAvailable ? shiftContext?.manager ?? null : null;
  const resolvedSupervisor = division ? supervisorForDivision(division) : null;

  // Collect "what is still missing" for the inline hint near the submit button.
  // Same predicates as the handleSubmit pre-validation — single source of truth.
  const missingFields: string[] = [];
  if (!isEdit && !division) missingFields.push('Divisi');
  if (!description.trim()) missingFields.push('Deskripsi');
  if (outputs.length === 0) missingFields.push('Output');
  if (outputs.includes('other') && !outputOther.trim()) missingFields.push('Keterangan output Lainnya');
  if (!isEdit && woType === 'personal' && !selectedTechnician) missingFields.push('Teknisi');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error banner */}
        {submitError && (
          <div
            ref={errorBannerRef}
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {submitError}
          </div>
        )}

        {/* Read-only Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Shift Dinas</p>
            <div className="flex items-center gap-2">
              <ShiftBadge shift={displayShift} />
              {/* Roster status indicator */}
              {shiftContextLoading ? (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Memuat roster...
                </span>
              ) : rosterAvailable ? (
                <span className="text-xs text-emerald-600 font-medium">● Roster aktif</span>
              ) : (
                <span className="text-xs text-amber-500 font-medium">● Roster belum dipublish</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
            <p className="text-sm font-medium text-slate-700">{displayDate}</p>
          </div>
          {!isEdit && rosterAvailable && resolvedManager && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Manager Teknik (dari Roster)</p>
              <p className="text-sm font-medium text-slate-700">{resolvedManager.name}</p>
            </div>
          )}
          {!isEdit && rosterAvailable && division && resolvedSupervisor && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Supervisor {division} (dari Roster)</p>
              <p className="text-sm font-medium text-slate-700">{resolvedSupervisor.name}</p>
            </div>
          )}
          <div className={(!isEdit && rosterAvailable && (resolvedManager || resolvedSupervisor)) ? '' : 'md:col-span-2'}>
            <p className="text-xs text-slate-500 mb-0.5">Status</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              {displayStatus}
            </p>
          </div>
        </div>

        {/* Edit-mode lock note: type/division/personnel are not editable */}
        {isEdit && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Tipe Work Order, divisi, dan daftar personel tidak dapat diubah setelah Work Order dibuat.
            Edit terbatas pada deskripsi, output, dan catatan.
          </div>
        )}

        {/* Manual input */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Jenis Work Order <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isEdit}
                onClick={() => {
                  if (isEdit) return;
                  setWoType('shift');
                  setSelectedTechnician('');
                }}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  woType === 'shift'
                    ? 'bg-blue-50 border-brand-primary'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center ${
                  woType === 'shift' ? 'border-brand-primary' : 'border-gray-300'
                }`}>
                  {woType === 'shift' && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div className="text-left">
                  <span className={`text-sm font-semibold block leading-tight ${
                    woType === 'shift' ? 'text-brand-primary' : 'text-slate-700'
                  }`}>
                    WO Shift
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={isEdit}
                onClick={() => {
                  if (isEdit) return;
                  setWoType('personal');
                }}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  woType === 'personal'
                    ? 'bg-blue-50 border-brand-primary'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center ${
                  woType === 'personal' ? 'border-brand-primary' : 'border-gray-300'
                }`}>
                  {woType === 'personal' && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div className="text-left">
                  <span className={`text-sm font-semibold block leading-tight ${
                    woType === 'personal' ? 'text-brand-primary' : 'text-slate-700'
                  }`}>
                    WO Personal
                  </span>
                </div>
              </button>
            </div>
          </div>

          <Select
            label="Fasilitas / Tertuju Kepada (Divisi)"
            options={[
              { label: 'CNSD', value: 'CNSD' },
              { label: 'TFP', value: 'TFP' },
            ]}
            value={division}
            onChange={(e) => {
              if (isEdit) return;
              setDivision(e.target.value);
              setSelectedTechnician('');
            }}
            placeholder="Pilih Divisi..."
            disabled={isEdit}
          />

          {/* Personnel preview when division is chosen on a roster shift */}
          {division && rosterAvailable && availableTechnicians.length > 0 && !isEdit && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3">
              <p className="text-xs uppercase tracking-wider text-sky-700 font-semibold mb-2">
                Teknisi {division} pada shift ini
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTechnicians.map((tech) => (
                  <span
                    key={tech.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-sky-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold">
                      {tech.name.charAt(0)}
                    </span>
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technician Selection (only for personal WO, create mode) */}
          {!isEdit && woType === 'personal' && division && availableTechnicians.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pilih Teknisi <span className="text-red-500">*</span>
                {rosterAvailable && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">(dari roster aktif)</span>
                )}
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
              >
                <option value="">-- Pilih Teknisi --</option>
                {availableTechnicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Deskripsi Perintah <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Tambahkan perintah kerja satu per satu (format bullet list)</p>
            {/* Existing items */}
            {description.split('\n').filter(Boolean).length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {description.split('\n').filter(Boolean).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 group">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                    <span className="flex-1 text-sm text-slate-700">{item}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = description.split('\n').filter(Boolean);
                        lines.splice(idx, 1);
                        setDescription(lines.join('\n'));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                      title="Hapus item"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Add new item input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik perintah baru, lalu tekan Enter atau klik +"
                className="flex-1 h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const val = input.value.trim();
                    if (val) {
                      setDescription((prev) => prev ? prev + '\n' + val : val);
                      input.value = '';
                    }
                  }
                }}
                id="wo-desc-input"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('wo-desc-input') as HTMLInputElement;
                  const val = input?.value?.trim();
                  if (val) {
                    setDescription((prev) => prev ? prev + '\n' + val : val);
                    input.value = '';
                    input.focus();
                  }
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-300 bg-white text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-colors"
                title="Tambah perintah"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className={`mt-1 text-xs ${
              description.trim().length > 0 ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {description.split('\n').filter(Boolean).length} item perintah
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Output Yang Diharapkan <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outputOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={outputs.includes(opt.value)}
                      onChange={() => toggleOutput(opt.value)}
                      className="peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
                    />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {outputs.includes('other') && (
              <Input
                label="Keterangan Output Lainnya"
                value={outputOther}
                onChange={(e) => setOutputOther(e.target.value)}
                placeholder="Sebutkan..."
                className="mt-3"
              />
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Catatan Tambahan</h3>

            <Textarea
              label="Catatan/Kendala"
              value={notesKendala}
              onChange={(e) => setNotesKendala(e.target.value)}
              placeholder="Opsional: Tuliskan kendala saat pelaksanaan..."
              rows={2}
            />

            <Textarea
              label="Usulan"
              value={notesUsulan}
              onChange={(e) => setNotesUsulan(e.target.value)}
              placeholder="Opsional: Tuliskan usulan tindak lanjut..."
              rows={2}
            />

            <Input
              label="Catatan Pemberi Tugas"
              value={notesPemberiTugas}
              onChange={(e) => setNotesPemberiTugas(e.target.value)}
              placeholder="Opsional: Tuliskan instruksi khusus..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          {/* Inline missing-field summary — helps the user see why submit cannot proceed */}
          {!isEdit && missingFields.length > 0 && (
            <p className="text-xs text-slate-500 sm:mr-auto" aria-live="polite">
              <span className="font-medium text-slate-600">Belum lengkap:</span>{' '}
              {missingFields.join(', ')}
            </p>
          )}
          {isEdit && missingFields.length > 0 && (
            <p className="text-xs text-slate-500 sm:mr-auto" aria-live="polite">
              <span className="font-medium text-slate-600">Belum lengkap:</span>{' '}
              {missingFields.join(', ')}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            {/* Button is intentionally NOT disabled by missing fields — clicking
                surfaces the validation error in the banner above (with scroll
                into view), which is far less confusing than a silently inert
                button. Only block clicks while an in-flight request is pending. */}
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="gap-2 bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
            >
              <Save size={16} />
              {isEdit ? 'Simpan Perubahan' : 'Buat Work Order'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
