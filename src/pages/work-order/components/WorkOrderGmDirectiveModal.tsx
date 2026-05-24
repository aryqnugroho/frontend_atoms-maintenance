import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { workOrderService, type PersonnelItem } from '@/services/workOrderService';
import { getCurrentShiftDate, getCurrentShiftType } from '@/lib/shiftUtils';
import type { ShiftType, WorkOrder } from '@/types';

interface WorkOrderGmDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided, the modal opens in edit mode for that WO. */
  workOrderId?: number | null;
}

/**
 * Modal khusus untuk General Manager menerbitkan Work Order directive.
 *
 * Bedanya dari WO Shift/Personal:
 *  - Tidak ada picker teknisi.
 *  - GM memilih Manager Teknik (wajib) + Supervisor (opsional).
 *  - Tidak ada output_types — directive tidak menuntut output spesifik.
 *  - shift_date + shift_type adalah target shift directive.
 */
export const WorkOrderGmDirectiveModal: React.FC<WorkOrderGmDirectiveModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
}) => {
  const isEdit = workOrderId != null;

  // Form fields
  const [division, setDivision] = useState<'CNSD' | 'TFP' | ''>('');
  const [shiftType, setShiftType] = useState<ShiftType>(getCurrentShiftType());
  const [shiftDate, setShiftDate] = useState<string>(getCurrentShiftDate());
  const [managerId, setManagerId] = useState<string>('');
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [notesPemberiTugas, setNotesPemberiTugas] = useState('');

  // Personnel data
  const [managers, setManagers] = useState<PersonnelItem[]>([]);
  const [supervisors, setSupervisors] = useState<PersonnelItem[]>([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Reset / preload on open
  useEffect(() => {
    if (!isOpen) {
      setSubmitError(null);
      return;
    }

    if (!isEdit) {
      setDivision('');
      setShiftType(getCurrentShiftType());
      setShiftDate(getCurrentShiftDate());
      setManagerId('');
      setSupervisorId('');
      setDescription('');
      setNotesPemberiTugas('');
      setSubmitError(null);
    } else if (workOrderId != null) {
      void workOrderService.getWorkOrder(workOrderId).then((wo: WorkOrder) => {
        setDivision(wo.division);
        setShiftType(wo.shift_type);
        setShiftDate(wo.shift_date);
        setManagerId(wo.manager_id ? String(wo.manager_id) : '');
        setSupervisorId(wo.supervisor_id ? String(wo.supervisor_id) : '');
        setDescription(wo.description ?? '');
        setNotesPemberiTugas(wo.notes_pemberi_tugas ?? '');
      }).catch(() => {
        setSubmitError('Gagal memuat data Work Order.');
      });
    }
  }, [isOpen, isEdit, workOrderId]);

  // Load Manager Teknik list on open
  useEffect(() => {
    if (!isOpen) return;
    setPersonnelLoading(true);
    workOrderService.getPersonnel({ role: 'Manager Teknik' })
      .then((items) => setManagers(items))
      .catch(() => setManagers([]))
      .finally(() => setPersonnelLoading(false));
  }, [isOpen]);

  // Load Supervisor list when division changes
  useEffect(() => {
    if (!isOpen || !division) {
      setSupervisors([]);
      return;
    }
    const role = division === 'CNSD' ? 'Supervisor CNSD' : 'Supervisor TFP';
    workOrderService.getPersonnel({ role })
      .then((items) => setSupervisors(items))
      .catch(() => setSupervisors([]));
  }, [isOpen, division]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const managerOptions = useMemo(
    () => managers.map((m) => ({ label: m.name, value: String(m.id) })),
    [managers]
  );
  const supervisorOptions = useMemo(
    () => [
      { label: '— Tanpa Supervisor —', value: '' },
      ...supervisors.map((s) => ({ label: s.name, value: String(s.id) })),
    ],
    [supervisors]
  );

  const missingFields: string[] = [];
  if (!division) missingFields.push('Divisi');
  if (!managerId) missingFields.push('Manager Teknik');
  if (!description.trim()) missingFields.push('Deskripsi');

  const focusError = () => {
    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
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

    if (!division) {
      setSubmitError('Pilih divisi tujuan directive.');
      focusError();
      return;
    }
    if (!managerId) {
      setSubmitError('Manager Teknik wajib dipilih.');
      focusError();
      return;
    }
    if (!description.trim()) {
      setSubmitError('Deskripsi directive wajib diisi.');
      focusError();
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && workOrderId != null) {
        await workOrderService.updateWorkOrder(workOrderId, {
          description,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
        });
      } else {
        await workOrderService.createWorkOrder({
          wo_type: 'gm_directive',
          division: division as 'CNSD' | 'TFP',
          shift_type: shiftType,
          shift_date: shiftDate,
          description,
          manager_id: Number(managerId),
          supervisor_id: supervisorId ? Number(supervisorId) : undefined,
          has_supervisor: supervisorId !== '',
          notes_pemberi_tugas: notesPemberiTugas || undefined,
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
      setIsSubmitting(false);
      focusError();
    }
  };

  const descriptionLines = description.split('\n').filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Directive GM' : 'Terbitkan Work Order Directive'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Info banner */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-800">
          <p className="font-semibold mb-0.5">Directive General Manager</p>
          <p className="text-xs text-rose-700/80">
            Work Order ini diterbitkan langsung dari Grand Manager kepada Manager Teknik
            (opsional disertai Supervisor). Tidak ada penugasan teknisi —
            Manager Teknik akan menindaklanjuti.
          </p>
        </div>

        {/* Target shift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Target Shift</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as ShiftType)}
              disabled={isEdit}
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-60"
            >
              <option value="pagi">Shift Pagi</option>
              <option value="siang">Shift Siang</option>
              <option value="malam">Shift Malam</option>
            </select>
            <div className="mt-2"><ShiftBadge shift={shiftType} /></div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tanggal Target</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              disabled={isEdit}
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-60"
            />
          </div>
          <div>
            <Select
              label="Divisi Tujuan"
              options={[
                { label: 'CNSD', value: 'CNSD' },
                { label: 'TFP', value: 'TFP' },
              ]}
              value={division}
              onChange={(e) => {
                setDivision(e.target.value as 'CNSD' | 'TFP' | '');
                setSupervisorId('');
              }}
              placeholder="Pilih Divisi..."
              disabled={isEdit}
            />
          </div>
        </div>

        {/* Penerima directive */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Penerima Directive</h3>

          <Select
            label="Manager Teknik"
            options={managerOptions}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            placeholder={personnelLoading ? 'Memuat...' : 'Pilih Manager Teknik...'}
            disabled={isEdit || personnelLoading}
            required
          />

          <Select
            label={`Supervisor ${division || ''} (opsional)`}
            options={supervisorOptions}
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            placeholder={division ? 'Pilih Supervisor (opsional)...' : 'Pilih divisi dulu...'}
            disabled={isEdit || !division}
          />
          {!division && (
            <p className="text-xs text-slate-400 -mt-2">
              Pilih divisi terlebih dahulu untuk memuat daftar supervisor.
            </p>
          )}
        </div>

        {/* Description as bullet list */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Isi Directive <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Tambahkan poin-poin perintah satu per satu (format bullet).
          </p>

          {descriptionLines.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {descriptionLines.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 group">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700">{item}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const lines = descriptionLines.slice();
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

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik poin directive lalu Enter atau klik +"
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
              id="gm-desc-input"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gm-desc-input') as HTMLInputElement | null;
                const val = input?.value?.trim();
                if (val) {
                  setDescription((prev) => prev ? prev + '\n' + val : val);
                  if (input) {
                    input.value = '';
                    input.focus();
                  }
                }
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-300 bg-white text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-colors"
              title="Tambah poin"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className={`mt-1 text-xs ${descriptionLines.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {descriptionLines.length} poin directive
          </p>
        </div>

        {/* Notes */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <Textarea
            label="Catatan Pemberi Tugas (opsional)"
            value={notesPemberiTugas}
            onChange={(e) => setNotesPemberiTugas(e.target.value)}
            placeholder="Tuliskan instruksi tambahan, prioritas, atau batas waktu..."
            rows={2}
          />
          <Input
            label="Tanggal Pemberian"
            value={new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            readOnly
            className="bg-slate-50"
          />
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          {missingFields.length > 0 && (
            <p className="text-xs text-slate-500 sm:mr-auto" aria-live="polite">
              <span className="font-medium text-slate-600">Belum lengkap:</span>{' '}
              {missingFields.join(', ')}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="gap-2 bg-rose-500 hover:bg-rose-600 focus:ring-rose-500"
            >
              <Save size={16} />
              {isEdit ? 'Simpan Perubahan' : 'Terbitkan Directive'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
