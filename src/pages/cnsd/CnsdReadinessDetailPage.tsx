import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { useAuth } from '@/hooks/useAuth';
import { cnsdReadinessService } from '@/services/cnsdReadinessService';
import { CnsdReadinessSignaturePanel } from '@/pages/cnsd/components/CnsdReadinessSignaturePanel';
import { cn } from '@/lib/utils';
import type {
  CnsdReadinessItem,
  CnsdReadinessRecordDetail,
  CnsdReadinessSectionMeta,
} from '@/types/cnsd';

// ─── Helpers / constants ────────────────────────────────────────

// Fixed shift time labels (mirrors atoms-rostering official shift windows).
const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

// Section keys flagged for the REDUNDANT / MAIN-STANDBY toggle on kondisi_2.
// Detection is by `columns_label_2` so renames preserve toggle behavior as
// long as the label stays the same.
const isDualStateColumn = (label: string | null | undefined): boolean =>
  (label ?? '').trim().toUpperCase() === 'DUAL STATE';

const STATUS_OPTIONS = ['NORMAL', 'TIDAK NORMAL'] as const;
const DUAL_STATE_OPTIONS = ['REDUNDANT', 'MAIN-STANDBY'] as const;

const isPlaceholderSection = (s: CnsdReadinessSectionMeta): boolean =>
  !!(s.name && s.name.trim() !== '');

// ─── Statement toggle ──────────────────────────────────────────

interface StatementToggleProps {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  variant?: 'status' | 'state' | 'neutral';
}

/**
 * Pill-style toggle group used for binary fields (Normal/Tidak Normal,
 * Redundant/Main-Standby). Click the active option again to clear it.
 */
const StatementToggle: React.FC<StatementToggleProps> = ({
  value, options, onChange, disabled, size = 'sm', variant = 'neutral',
}) => {
  const padding = size === 'sm' ? 'h-7 px-2.5 text-[10px]' : 'h-9 px-3 text-xs';
  return (
    <div className="inline-flex items-center gap-1">
      {options.map((opt) => {
        const isActive = value === opt;
        let cls = 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50';
        if (isActive) {
          if (variant === 'status') {
            cls = opt === 'NORMAL'
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
              : 'bg-red-500 text-white border-red-600 shadow-sm';
          } else if (variant === 'state') {
            cls = opt === 'REDUNDANT'
              ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
              : 'bg-amber-500 text-white border-amber-600 shadow-sm';
          } else {
            cls = 'bg-slate-800 text-white border-slate-900 shadow-sm';
          }
        }
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isActive ? '' : opt)}
            className={cn(
              'inline-flex items-center justify-center rounded-md border font-semibold uppercase tracking-wider transition-all',
              padding,
              cls,
              disabled && 'opacity-60 cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ─── Section rename modal ──────────────────────────────────────

interface SectionRenameModalProps {
  open: boolean;
  initial: CnsdReadinessSectionMeta | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; columns_label_1: string; columns_label_2: string }) => Promise<void>;
}

const SectionRenameModal: React.FC<SectionRenameModalProps> = ({ open, initial, onClose, onSubmit }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [c1, setC1] = useState(initial?.columns_label_1 ?? '');
  const [c2, setC2] = useState(initial?.columns_label_2 ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setC1(initial.columns_label_1 ?? '');
      setC2(initial.columns_label_2 ?? '');
      setErr(null);
    }
  }, [open, initial]);

  if (!open || !initial) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErr('Nama section tidak boleh kosong.');
      return;
    }
    setIsSaving(true);
    setErr(null);
    try {
      await onSubmit({ name: name.trim(), columns_label_1: c1.trim(), columns_label_2: c2.trim() });
      onClose();
    } catch (e) {
      const fallback = 'Gagal menyimpan perubahan section.';
      if (axios.isAxiosError(e) && e.response) {
        const data = e.response.data as { message?: string };
        setErr(data.message ?? fallback);
      } else {
        setErr(fallback);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Edit Section</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Ganti nama section dan label kolom kondisi.</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X size={16} />
          </button>
        </div>

        {err && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Section</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              maxLength={60}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Label Kolom 1</label>
            <input
              type="text"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              placeholder="Contoh: SERVER AKTIF / TX OPERASI / CHANNEL AKTIF"
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Label Kolom 2</label>
            <input
              type="text"
              value={c2}
              onChange={(e) => setC2(e.target.value)}
              placeholder="Contoh: DUAL STATE / FREQUENCY / WORKSTATION STATE"
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              maxLength={80}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Label "DUAL STATE" otomatis menampilkan toggle REDUNDANT / MAIN-STANDBY.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button size="sm" onClick={() => void handleSubmit()} isLoading={isSaving} className="gap-1.5">
            <Save size={14} /> Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Add-item form (inline at bottom of section) ───────────────

interface AddItemFormProps {
  sectionMeta: CnsdReadinessSectionMeta;
  onSubmit: (payload: {
    item_number?: string | null;
    equipment_name: string;
    sub_equipment_name?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ sectionMeta, onSubmit, onCancel }) => {
  const [itemNumber, setItemNumber] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [subEquipmentName, setSubEquipmentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!equipmentName.trim()) {
      setErr('Nama peralatan wajib diisi.');
      return;
    }
    setIsSaving(true);
    setErr(null);
    try {
      await onSubmit({
        item_number: itemNumber.trim() || null,
        equipment_name: equipmentName.trim(),
        sub_equipment_name: subEquipmentName.trim() || null,
      });
      setItemNumber(''); setEquipmentName(''); setSubEquipmentName('');
    } catch (e) {
      const fallback = 'Gagal menambahkan baris.';
      if (axios.isAxiosError(e) && e.response) {
        const data = e.response.data as { message?: string };
        setErr(data.message ?? fallback);
      } else {
        setErr(fallback);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Tambah baris ke {sectionMeta.name}</p>
        <button onClick={onCancel} className="text-[11px] text-slate-500 hover:text-slate-700">Batal</button>
      </div>
      {err && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">{err}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_140px_auto] gap-2">
        <input
          type="text"
          value={itemNumber}
          onChange={(e) => setItemNumber(e.target.value)}
          placeholder="No"
          maxLength={10}
          className="h-9 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <input
          type="text"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          placeholder="Nama peralatan"
          maxLength={255}
          className="h-9 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <input
          type="text"
          value={subEquipmentName}
          onChange={(e) => setSubEquipmentName(e.target.value)}
          placeholder="Sub (PRIMARY/SECONDARY)"
          maxLength={60}
          className="h-9 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <Button size="sm" onClick={() => void handleSubmit()} isLoading={isSaving} className="gap-1.5">
          <Plus size={13} /> Simpan
        </Button>
      </div>
    </div>
  );
};

// ─── Main detail page ──────────────────────────────────────────

/**
 * CNSD Equipment Readiness — Form EQ-1 detail page.
 *
 * Layout mirrors Ground Check detail pages so CNSD users get the same
 * navigation/feel when crossing between modules:
 *   - Breadcrumb → header card → metadata card → Tabs → table → signature
 *
 * Per-record sections_meta lets Manager Teknik / Supervisor CNSD rename
 * section headings and edit column labels without touching the template.
 * Teknisi can only edit row values (status, kondisi, keterangan).
 */
export const CnsdReadinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdReadinessRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdReadinessItem>>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Structural-edit UI state
  const [editingSection, setEditingSection] = useState<CnsdReadinessSectionMeta | null>(null);
  const [showAddItemForSection, setShowAddItemForSection] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null); // for inline equipment_name edit

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager Teknik';
  const isSupervisor = user?.role === 'Supervisor CNSD';
  const canEditStructure = isAdmin || isManager || isSupervisor;

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
      if (data.sections_meta.length > 0) {
        const stillExists = activeSection && data.sections_meta.some((s) => s.name === activeSection);
        if (!stillExists) {
          setActiveSection(data.sections_meta[0].name);
        }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

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

  const getValue = (item: CnsdReadinessItem, field: keyof CnsdReadinessItem): string => {
    const edited = editedItems[item.id];
    if (edited && field in edited) {
      const v = edited[field];
      return v == null ? '' : String(v);
    }
    const original = item[field];
    return original == null ? '' : String(original);
  };

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

  // ─── Save (value updates) ─────────────────────────────
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

  // ─── Structural handlers ──────────────────────────────

  const handleAddItem = async (
    sectionName: string,
    payload: { item_number?: string | null; equipment_name: string; sub_equipment_name?: string | null },
  ) => {
    if (!record) return;
    const updated = await cnsdReadinessService.addItem(record.id, {
      section_name: sectionName,
      item_number: payload.item_number ?? null,
      equipment_name: payload.equipment_name,
      sub_equipment_name: payload.sub_equipment_name ?? null,
    });
    setRecord(updated);
    setShowAddItemForSection(null);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!record) return;
    if (!confirm('Hapus baris ini? Tindakan ini tidak dapat diurungkan.')) return;
    try {
      const updated = await cnsdReadinessService.deleteItem(record.id, itemId);
      setRecord(updated);
      setEditedItems((prev) => {
        const { [itemId]: _omit, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      const fallback = 'Gagal menghapus baris.';
      if (axios.isAxiosError(e) && e.response) {
        const data = e.response.data as { message?: string };
        setErrorMessage(data.message ?? fallback);
      } else {
        setErrorMessage(fallback);
      }
    }
  };

  const handleSaveItemStructure = async (
    itemId: number,
    payload: { item_number?: string | null; equipment_name?: string | null; sub_equipment_name?: string | null },
  ) => {
    if (!record) return;
    try {
      const updated = await cnsdReadinessService.updateItemStructure(record.id, itemId, payload);
      setRecord(updated);
      setEditingItemId(null);
    } catch (e) {
      const fallback = 'Gagal menyimpan struktur baris.';
      if (axios.isAxiosError(e) && e.response) {
        const data = e.response.data as { message?: string };
        setErrorMessage(data.message ?? fallback);
      } else {
        setErrorMessage(fallback);
      }
    }
  };

  const handleRenameSection = async (
    oldName: string,
    payload: { name: string; columns_label_1: string; columns_label_2: string },
  ) => {
    if (!record) return;
    const updated = await cnsdReadinessService.renameSection(record.id, {
      old_name: oldName,
      name: payload.name,
      columns_label_1: payload.columns_label_1 || null,
      columns_label_2: payload.columns_label_2 || null,
    });
    setRecord(updated);
    setActiveSection(payload.name);
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

  const activeSectionMeta = activeSection
    ? record.sections_meta.find((s) => s.name === activeSection) ?? null
    : null;

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/cnsd')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} /> CNSD
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
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header card (GP-style) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <CheckSquare size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">
                  Form {record.form_type} — Kesiapan Peralatan
                </h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CNSD &nbsp;·&nbsp;
                <span className="font-mono">{record.form_number}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg" title="Rentang waktu shift">
              <Clock size={13} className="text-slate-400" />
              <span className="font-medium font-mono">{SHIFT_TIME_LABELS[record.shift_type] ?? '—'}</span>
            </div>
            <ShiftBadge shift={record.shift_type} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <MapPin size={13} className="text-slate-400" />
              <span>{record.facility}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/readiness/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
              <Printer size={15} /> Print
            </Button>
            {!isReadOnly && (
              <Button size="sm" className="gap-1.5" onClick={() => void handleSave()} disabled={!hasChanges || isSaving} isLoading={isSaving}>
                <Save size={14} /> Simpan
              </Button>
            )}
          </div>
        </div>

        {/* Personnel summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Manager Teknik</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.manager?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Supervisor CNSD</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Teknisi CNSD</span>
            <p className="mt-0.5 font-medium text-slate-700 truncate" title={record.technicians.map((t) => t.technician_name).join(', ')}>
              {record.technicians.map((t) => t.technician_name).join(', ') || <span className="text-slate-400 italic">—</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      )}

      {/* Info Peralatan card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Informasi Peralatan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <InfoCell label="Lokasi" value={record.location} />
          <InfoCell label="Ruangan" value={record.room} />
          <InfoCell label="Fasilitas" value={record.facility} />
          <InfoCell label="Shift" value={SHIFT_TIME_LABELS[record.shift_type] ?? null} />
        </div>
      </div>

      {/* Tabs */}
      {record.sections_meta.length > 0 && (
        <Tabs
          items={record.sections_meta.filter(isPlaceholderSection).map((s) => ({
            key: s.name,
            label: s.name,
          }))}
          defaultKey={activeSection ?? record.sections_meta[0]?.name}
          onChange={setActiveSection}
        />
      )}

      {/* Active section content */}
      {activeSection && activeSectionMeta && (
        <SectionPanel
          sectionMeta={activeSectionMeta}
          items={itemsBySection[activeSection] ?? []}
          isReadOnly={isReadOnly}
          canEditStructure={canEditStructure && !isReadOnly}
          getValue={getValue}
          onChange={updateField}
          onEditSectionMeta={() => setEditingSection(activeSectionMeta)}
          onAddItemClick={() => setShowAddItemForSection(activeSection)}
          showAddForm={showAddItemForSection === activeSection}
          onAddSubmit={(payload) => handleAddItem(activeSection, payload)}
          onAddCancel={() => setShowAddItemForSection(null)}
          editingItemId={editingItemId}
          onStartItemEdit={(itemId) => setEditingItemId(itemId)}
          onCancelItemEdit={() => setEditingItemId(null)}
          onSaveItemStructure={handleSaveItemStructure}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {/* Pending-changes indicator */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-2">
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

      {/* Section-rename modal */}
      <SectionRenameModal
        open={!!editingSection}
        initial={editingSection}
        onClose={() => setEditingSection(null)}
        onSubmit={async (payload) => {
          if (!editingSection) return;
          await handleRenameSection(editingSection.name, payload);
        }}
      />
    </div>
  );
};

// ─── Section panel ─────────────────────────────────────────────

interface SectionPanelProps {
  sectionMeta: CnsdReadinessSectionMeta;
  items: CnsdReadinessItem[];
  isReadOnly: boolean;
  canEditStructure: boolean;
  getValue: (item: CnsdReadinessItem, field: keyof CnsdReadinessItem) => string;
  onChange: (itemId: number, field: keyof CnsdReadinessItem, value: string | null) => void;
  onEditSectionMeta: () => void;
  onAddItemClick: () => void;
  showAddForm: boolean;
  onAddSubmit: (payload: { item_number?: string | null; equipment_name: string; sub_equipment_name?: string | null }) => Promise<void>;
  onAddCancel: () => void;
  editingItemId: number | null;
  onStartItemEdit: (itemId: number) => void;
  onCancelItemEdit: () => void;
  onSaveItemStructure: (
    itemId: number,
    payload: { item_number?: string | null; equipment_name?: string | null; sub_equipment_name?: string | null },
  ) => Promise<void>;
  onDeleteItem: (itemId: number) => void;
}

const SectionPanel: React.FC<SectionPanelProps> = ({
  sectionMeta, items, isReadOnly, canEditStructure,
  getValue, onChange,
  onEditSectionMeta, onAddItemClick,
  showAddForm, onAddSubmit, onAddCancel,
  editingItemId, onStartItemEdit, onCancelItemEdit, onSaveItemStructure, onDeleteItem,
}) => {
  const col2IsToggle = isDualStateColumn(sectionMeta.columns_label_2);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{sectionMeta.name}</h2>
          {canEditStructure && (
            <button
              type="button"
              onClick={onEditSectionMeta}
              className="p-1 text-slate-400 hover:text-brand-primary rounded transition-colors"
              title="Edit nama section & label kolom"
            >
              <Pencil size={13} />
            </button>
          )}
          <span className="text-xs font-medium text-slate-400">· {items.length} item</span>
        </div>
        {canEditStructure && !showAddForm && (
          <Button variant="ghost" size="sm" onClick={onAddItemClick} className="gap-1.5 text-brand-primary">
            <Plus size={13} /> Tambah Baris
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-12 text-[11px] uppercase tracking-wider">No</th>
              <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 min-w-[220px] text-[11px] uppercase tracking-wider">Nama Peralatan</th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-44 text-[11px] uppercase tracking-wider">Status</th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">
                {sectionMeta.columns_label_1 ?? '—'}
              </th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[180px] text-[11px] uppercase tracking-wider">
                {sectionMeta.columns_label_2 ?? '—'}
              </th>
              <th className="px-2 py-2 text-left font-semibold border-b border-slate-200 min-w-[160px] text-[11px] uppercase tracking-wider">Keterangan</th>
              {canEditStructure && (
                <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-16 text-[11px] uppercase tracking-wider">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={canEditStructure ? 7 : 6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Belum ada baris pada section ini.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isReadOnly={isReadOnly}
                  canEditStructure={canEditStructure}
                  col2IsToggle={col2IsToggle}
                  getValue={getValue}
                  onChange={onChange}
                  isEditingStructure={editingItemId === item.id}
                  onStartItemEdit={() => onStartItemEdit(item.id)}
                  onCancelItemEdit={onCancelItemEdit}
                  onSaveItemStructure={(payload) => onSaveItemStructure(item.id, payload)}
                  onDeleteItem={() => onDeleteItem(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add-row form (inline) */}
      {canEditStructure && showAddForm && (
        <AddItemForm
          sectionMeta={sectionMeta}
          onSubmit={onAddSubmit}
          onCancel={onAddCancel}
        />
      )}
    </div>
  );
};

// ─── Item row ──────────────────────────────────────────────────

interface ItemRowProps {
  item: CnsdReadinessItem;
  isReadOnly: boolean;
  canEditStructure: boolean;
  col2IsToggle: boolean;
  getValue: (item: CnsdReadinessItem, field: keyof CnsdReadinessItem) => string;
  onChange: (itemId: number, field: keyof CnsdReadinessItem, value: string | null) => void;
  isEditingStructure: boolean;
  onStartItemEdit: () => void;
  onCancelItemEdit: () => void;
  onSaveItemStructure: (payload: { item_number?: string | null; equipment_name?: string | null; sub_equipment_name?: string | null }) => Promise<void>;
  onDeleteItem: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item, isReadOnly, canEditStructure, col2IsToggle,
  getValue, onChange,
  isEditingStructure, onStartItemEdit, onCancelItemEdit, onSaveItemStructure, onDeleteItem,
}) => {
  // Local state for the inline structure-edit form
  const [draftItemNumber, setDraftItemNumber] = useState(item.item_number ?? '');
  const [draftEquipName, setDraftEquipName] = useState(item.equipment_name);
  const [draftSubName, setDraftSubName] = useState(item.sub_equipment_name ?? '');
  const [savingStructure, setSavingStructure] = useState(false);

  useEffect(() => {
    if (isEditingStructure) {
      setDraftItemNumber(item.item_number ?? '');
      setDraftEquipName(item.equipment_name);
      setDraftSubName(item.sub_equipment_name ?? '');
    }
  }, [isEditingStructure, item]);

  const submitStructure = async () => {
    setSavingStructure(true);
    try {
      await onSaveItemStructure({
        item_number: draftItemNumber.trim() || null,
        equipment_name: draftEquipName.trim() || null,
        sub_equipment_name: draftSubName.trim() || null,
      });
    } finally {
      setSavingStructure(false);
    }
  };

  const inputClass = 'w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent';
  const statusVal = getValue(item, 'status_peralatan');
  const kondisi1 = getValue(item, 'kondisi_operasional_1');
  const kondisi2 = getValue(item, 'kondisi_operasional_2');
  const keterangan = getValue(item, 'keterangan');

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
      {/* No */}
      <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px] align-middle">
        {isEditingStructure ? (
          <input
            type="text"
            value={draftItemNumber}
            onChange={(e) => setDraftItemNumber(e.target.value)}
            maxLength={10}
            className={cn(inputClass, 'text-center')}
          />
        ) : (
          item.item_number ?? ''
        )}
      </td>

      {/* Nama Peralatan */}
      <td className="px-3 py-2 align-middle">
        {isEditingStructure ? (
          <div className="space-y-1">
            <input
              type="text"
              value={draftEquipName}
              onChange={(e) => setDraftEquipName(e.target.value)}
              placeholder="Nama peralatan"
              maxLength={255}
              className={inputClass}
            />
            <input
              type="text"
              value={draftSubName}
              onChange={(e) => setDraftSubName(e.target.value)}
              placeholder="Sub (PRIMARY/SECONDARY)"
              maxLength={60}
              className={inputClass}
            />
            <div className="flex items-center gap-1 pt-0.5">
              <Button size="sm" onClick={() => void submitStructure()} isLoading={savingStructure} className="gap-1 h-7 px-2 text-[11px]">
                <Save size={11} /> Simpan
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelItemEdit} className="h-7 px-2 text-[11px]">
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div>
              <div className="text-slate-800 font-semibold">{item.equipment_name}</div>
              {item.sub_equipment_name && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {item.sub_equipment_name}
                </div>
              )}
            </div>
            {canEditStructure && (
              <button
                type="button"
                onClick={onStartItemEdit}
                className="ml-1 p-0.5 text-slate-300 hover:text-brand-primary rounded transition-colors"
                title="Edit nama peralatan"
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-2 py-2 align-middle text-center">
        <StatementToggle
          value={statusVal}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange(item.id, 'status_peralatan', v)}
          disabled={isReadOnly}
          variant="status"
        />
      </td>

      {/* Kondisi 1 — always free text */}
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="..."
          value={kondisi1}
          onChange={(e) => onChange(item.id, 'kondisi_operasional_1', e.target.value)}
          disabled={isReadOnly}
        />
      </td>

      {/* Kondisi 2 — toggle for DUAL STATE, free text otherwise */}
      <td className="px-2 py-2 align-middle text-center">
        {col2IsToggle ? (
          <StatementToggle
            value={kondisi2}
            options={DUAL_STATE_OPTIONS}
            onChange={(v) => onChange(item.id, 'kondisi_operasional_2', v)}
            disabled={isReadOnly}
            variant="state"
          />
        ) : (
          <input
            type="text"
            className={inputClass}
            placeholder="..."
            value={kondisi2}
            onChange={(e) => onChange(item.id, 'kondisi_operasional_2', e.target.value)}
            disabled={isReadOnly}
          />
        )}
      </td>

      {/* Keterangan */}
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="Catatan"
          value={keterangan}
          onChange={(e) => onChange(item.id, 'keterangan', e.target.value)}
          disabled={isReadOnly}
        />
      </td>

      {/* Action */}
      {canEditStructure && (
        <td className="px-2 py-2 align-middle text-center">
          <button
            type="button"
            onClick={onDeleteItem}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Hapus baris"
          >
            <Trash2 size={13} />
          </button>
        </td>
      )}
    </tr>
  );
};

// ─── Small subcomponents ───────────────────────────────────────

const InfoCell: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div>
    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{label}</span>
    <p className="mt-0.5 font-medium text-slate-700">{value ?? '—'}</p>
  </div>
);
