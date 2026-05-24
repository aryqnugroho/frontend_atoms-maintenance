import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  Lock,
  PenLine,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { SignatureDisplay } from '@/components/shared/SignatureDisplay';
import { useAuth } from '@/hooks/useAuth';
import { logbookTfpService } from '@/services/logbookTfpService';
import type {
  LogbookTfpDetail as LogbookTfpDetailType,
  LogbookTfpItem,
  PersonnelShiftInfo,
  ShiftKey,
} from '@/types/logbookTfp';

const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) !== '' && norm(a) === norm(b);
};

// ─── Helpers ──────────────────────────────────────────────
const formatDateLong = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// ─── Status Toggle ─────────────────────────────────────────
type ShiftStatus = 'S' | 'US' | null;

interface StatusToggleProps {
  value: ShiftStatus;
  onChange: (v: ShiftStatus) => void;
  disabled?: boolean;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ value, onChange, disabled }) => {
  const cycle = () => {
    if (disabled) return;
    if (value === null) onChange('S');
    else if (value === 'S') onChange('US');
    else onChange(null);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      title={value === null ? 'Klik untuk set S' : value === 'S' ? 'Klik untuk set U/S' : 'Klik untuk reset'}
      className={`
        inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold transition-all duration-150 border
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${value === 'S'
          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
          : value === 'US'
          ? 'bg-red-500 border-red-600 text-white shadow-sm'
          : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
        }
      `}
    >
      {value === 'S' ? 'S' : value === 'US' ? 'U/S' : '—'}
    </button>
  );
};

// ─── Equipment Row ─────────────────────────────────────────
interface EquipmentRowProps {
  item: LogbookTfpItem;
  localStatus: { status_pagi: ShiftStatus; status_siang: ShiftStatus; status_malam: ShiftStatus };
  onStatusChange: (shift: 'status_pagi' | 'status_siang' | 'status_malam', value: ShiftStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  disabled: boolean;
}

interface EquipmentRowPerShiftLockProps extends EquipmentRowProps {
  shiftLocked: { pagi: boolean; siang: boolean; malam: boolean };
}

/** Per-shift lock variant — locks individual shift cells once that shift is signed. */
const EquipmentRowPerShiftLock: React.FC<EquipmentRowPerShiftLockProps> = ({
  item, localStatus, onStatusChange, onEdit, onDelete, canManage, disabled, shiftLocked,
}) => (
  <div className="grid grid-cols-[1fr_auto] gap-2 items-center px-4 py-2.5 hover:bg-slate-50/50 transition-colors group">
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm text-slate-700 leading-tight truncate">{item.equipment_name}</span>
      {canManage && !disabled && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button type="button" onClick={onEdit} className="p-1 rounded text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Edit nama peralatan">
            <Edit2 size={12} />
          </button>
          <button type="button" onClick={onDelete} className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Hapus peralatan">
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
    <div className="flex gap-2">
      <StatusToggle value={localStatus.status_pagi}  onChange={(v) => onStatusChange('status_pagi', v)}  disabled={disabled || shiftLocked.pagi} />
      <StatusToggle value={localStatus.status_siang} onChange={(v) => onStatusChange('status_siang', v)} disabled={disabled || shiftLocked.siang} />
      <StatusToggle value={localStatus.status_malam} onChange={(v) => onStatusChange('status_malam', v)} disabled={disabled || shiftLocked.malam} />
    </div>
  </div>
);

// ─── Accordion Category ────────────────────────────────────
interface CategoryAccordionProps {
  category: string;
  items: LogbookTfpItem[];
  localItems: Record<number, { status_pagi: ShiftStatus; status_siang: ShiftStatus; status_malam: ShiftStatus }>;
  onStatusChange: (itemId: number, shift: 'status_pagi' | 'status_siang' | 'status_malam', value: ShiftStatus) => void;
  onEditItem: (item: LogbookTfpItem) => void;
  onDeleteItem: (itemId: number) => void;
  onAddItem: (category: string) => void;
  canManage: boolean;
  disabled: boolean;
  /** Per-shift disabled flags — when true, that column's StatusToggle is locked. */
  shiftLocked: { pagi: boolean; siang: boolean; malam: boolean };
  defaultOpen?: boolean;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  category, items, localItems, onStatusChange, onEditItem, onDeleteItem, onAddItem,
  canManage, disabled, shiftLocked, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors text-left border-b border-gray-100"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{category}</span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-slate-500 px-2 py-0.5">
            {items.length} item
          </span>
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {/* Sub-header */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-1.5 bg-gray-50/40">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nama Peralatan</span>
            <div className="flex gap-2">
              {(['Pagi', 'Siang', 'Malam'] as const).map((s) => (
                <span key={s} className="w-12 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s}</span>
              ))}
            </div>
          </div>


          {items.map((item) => {
            const local = localItems[item.id] ?? {
              status_pagi: item.status_pagi,
              status_siang: item.status_siang,
              status_malam: item.status_malam,
            };
            return (
              <EquipmentRowPerShiftLock
                key={item.id}
                item={item}
                localStatus={local}
                onStatusChange={(shift, v) => onStatusChange(item.id, shift, v)}
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item.id)}
                canManage={canManage}
                disabled={disabled}
                shiftLocked={shiftLocked}
              />
            );
          })}

          {/* Add item button */}
          {canManage && !disabled && (
            <div className="px-4 py-2">
              <button
                type="button"
                onClick={() => onAddItem(category)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <Plus size={12} /> Tambah peralatan ke {category}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Personnel Block ───────────────────────────────────────
const SHIFT_ACCENT: Record<'pagi' | 'siang' | 'malam', { dot: string; ring: string; label: string }> = {
  pagi: { dot: 'bg-amber-400', ring: 'ring-amber-100', label: 'text-amber-700' },
  siang: { dot: 'bg-sky-400', ring: 'ring-sky-100', label: 'text-sky-700' },
  malam: { dot: 'bg-indigo-400', ring: 'ring-indigo-100', label: 'text-indigo-700' },
};

const PersonnelBlock: React.FC<{
  shiftKey: 'pagi' | 'siang' | 'malam';
  label: string;
  range: string;
  info: PersonnelShiftInfo | undefined;
}> = ({ shiftKey, label, range, info }) => {
  if (!info) return null;
  const all = [
    ...(info.manager ? [{ name: info.manager.name, role: 'Manager Teknik' }] : []),
    ...(info.supervisor ? [{ name: info.supervisor.name, role: 'Supervisor TFP' }] : []),
    ...info.technicians.map((t) => ({ name: t.name, role: 'Teknisi TFP' })),
  ];
  const accent = SHIFT_ACCENT[shiftKey];

  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent.dot} ring-4 ${accent.ring}`} />
        <p className={`text-[11px] font-bold uppercase tracking-wider ${accent.label}`}>{label}</p>
        <span className="text-[10px] text-slate-400 font-medium ml-auto">{range}</span>
      </div>

      {!info.roster_available ? (
        <p className="text-xs text-slate-400 italic">Roster belum dipublish</p>
      ) : all.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Tidak ada personel</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {all.map((p, i) => (
            <span
              key={i}
              title={p.role}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                p.role === 'Manager Teknik' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                p.role === 'Supervisor TFP' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Edit Equipment Modal ──────────────────────────────────
interface EditEquipmentModalProps {
  isOpen: boolean;
  item: LogbookTfpItem | null;
  onClose: () => void;
  onSave: (name: string, category: string) => void;
  isSaving: boolean;
}

const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({ isOpen, item, onClose, onSave, isSaving }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.equipment_name);
      setCategory('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Edit Peralatan</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Peralatan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
            <Button type="button" isLoading={isSaving} onClick={() => onSave(name, category)} disabled={!name.trim()}>
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Add Equipment Modal ───────────────────────────────────
interface AddEquipmentModalProps {
  isOpen: boolean;
  defaultCategory: string;
  onClose: () => void;
  onAdd: (name: string, category: string) => void;
  isSaving: boolean;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ isOpen, defaultCategory, onClose, onAdd, isSaving }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);

  useEffect(() => { setCategory(defaultCategory); setName(''); }, [defaultCategory, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Tambah Peralatan</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kategori</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Peralatan <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: UPS Baru"
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
            <Button type="button" isLoading={isSaving} onClick={() => onAdd(name, category)} disabled={!name.trim() || !category.trim()} className="gap-1.5">
              <Plus size={14} /> Tambah
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Detail Page ──────────────────────────────────────
export const LogbookTfpDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState<LogbookTfpDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  /** Which shift is currently in the sign canvas (null = closed). */
  const [signShift, setSignShift] = useState<ShiftKey | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bulkPendingShift, setBulkPendingShift] = useState<ShiftKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Equipment management state
  const [editingItem, setEditingItem] = useState<LogbookTfpItem | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [isEquipmentSaving, setIsEquipmentSaving] = useState(false);

  // Local item state (S/US toggles)
  const [localItems, setLocalItems] = useState<
    Record<number, { status_pagi: ShiftStatus; status_siang: ShiftStatus; status_malam: ShiftStatus }>
  >({});

  // Note form state
  const [noteShift, setNoteShift] = useState<'pagi' | 'siang' | 'malam'>('pagi');
  const [noteTime, setNoteTime] = useState(getCurrentTime());
  const [noteActivity, setNoteActivity] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await logbookTfpService.getLogbook(Number(id));
      setRecord(data);
      const init: typeof localItems = {};
      Object.values(data.items_by_category).flat().forEach((item) => {
        init[item.id] = {
          status_pagi: item.status_pagi,
          status_siang: item.status_siang,
          status_malam: item.status_malam,
        };
      });
      setLocalItems(init);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data logbook.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadRecord(); }, [loadRecord]);

  // ── Read-only role gates ─────────────────────────────────────────────────
  // General Manager always sees this page read-only for oversight.
  // Teknisi CNSD can READ a TFP logbook but must not be able to write to it
  //   (their write scope is CNSD logbook only).
  const isGmReadOnly = user?.role === 'General Manager';
  const isCrossDivisionTeknisi = user?.role === 'Teknisi CNSD';
  const isReadOnlyViewer = isGmReadOnly || isCrossDivisionTeknisi;

  const isFullySigned = !!record?.is_fully_signed;
  const isLocked = isFullySigned || isReadOnlyViewer;
  const shiftLocked = {
    pagi: !!record?.is_signed_pagi || isReadOnlyViewer,
    siang: !!record?.is_signed_siang || isReadOnlyViewer,
    malam: !!record?.is_signed_malam || isReadOnlyViewer,
  };
  const canSign = user?.role === 'Manager Teknik';
  // Delete logbook: Admin / MT / Supervisor (lintas divisi, MT-equivalent).
  const canDelete =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';
  // Equipment management (add/edit/delete equipment rows) — same as canDelete:
  // never includes teknisi, supervisor included lintas divisi.
  const canManageEquipment =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';

  const handleStatusChange = (
    itemId: number,
    shift: 'status_pagi' | 'status_siang' | 'status_malam',
    value: ShiftStatus,
  ) => {
    setLocalItems((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [shift]: value },
    }));
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const items = Object.entries(localItems).map(([idStr, s]) => ({
        id: Number(idStr),
        status_pagi: s.status_pagi,
        status_siang: s.status_siang,
        status_malam: s.status_malam,
      }));
      const updated = await logbookTfpService.updateItems(record.id, items);
      setRecord(updated);
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan perubahan.');
      } else {
        setErrorMessage('Gagal menyimpan perubahan.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !noteActivity.trim()) return;
    setIsAddingNote(true);
    setErrorMessage(null);
    try {
      const updated = await logbookTfpService.addNote(record.id, {
        shift: noteShift,
        time: noteTime || null,
        activity: noteActivity.trim(),
      });
      setRecord(updated);
      setNoteActivity('');
      setNoteTime(getCurrentTime());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menambah catatan.');
      } else {
        setErrorMessage('Gagal menambah catatan.');
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!record || !confirm('Hapus catatan ini?')) return;
    try {
      const updated = await logbookTfpService.deleteNote(record.id, noteId);
      setRecord(updated);
    } catch {
      setErrorMessage('Gagal menghapus catatan.');
    }
  };

  // ── Equipment management ───────────────────────────────
  const handleEditEquipment = async (name: string, _category: string) => {
    if (!record || !editingItem) return;
    setIsEquipmentSaving(true);
    try {
      const updated = await logbookTfpService.editEquipment(record.id, editingItem.id, { name });
      setRecord(updated);
      // Re-init local items for new item ids
      const init: typeof localItems = { ...localItems };
      Object.values(updated.items_by_category).flat().forEach((item) => {
        if (!init[item.id]) {
          init[item.id] = { status_pagi: item.status_pagi, status_siang: item.status_siang, status_malam: item.status_malam };
        }
      });
      setLocalItems(init);
      setEditingItem(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal mengubah peralatan.');
      } else {
        setErrorMessage('Gagal mengubah peralatan.');
      }
    } finally {
      setIsEquipmentSaving(false);
    }
  };

  const handleDeleteEquipment = async (itemId: number) => {
    if (!record || !confirm('Hapus peralatan ini dari logbook?')) return;
    try {
      const updated = await logbookTfpService.removeEquipment(record.id, itemId);
      setRecord(updated);
      setLocalItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menghapus peralatan.');
      } else {
        setErrorMessage('Gagal menghapus peralatan.');
      }
    }
  };

  const handleAddEquipment = async (name: string, category: string) => {
    if (!record) return;
    setIsEquipmentSaving(true);
    try {
      const updated = await logbookTfpService.addEquipment(record.id, name, category);
      setRecord(updated);
      const init: typeof localItems = { ...localItems };
      Object.values(updated.items_by_category).flat().forEach((item) => {
        if (!init[item.id]) {
          init[item.id] = { status_pagi: item.status_pagi, status_siang: item.status_siang, status_malam: item.status_malam };
        }
      });
      setLocalItems(init);
      setAddingCategory(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menambah peralatan.');
      } else {
        setErrorMessage('Gagal menambah peralatan.');
      }
    } finally {
      setIsEquipmentSaving(false);
    }
  };

  const handleSign = async (base64: string) => {
    if (!record || !signShift) return;
    setIsSigning(true);
    setErrorMessage(null);
    try {
      const updated = await logbookTfpService.signLogbook(record.id, signShift, base64);
      setRecord(updated);
      setSuccessMessage(`Tanda tangan shift ${signShift} berhasil disimpan.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan tanda tangan.');
      } else {
        setErrorMessage('Gagal menyimpan tanda tangan.');
      }
    } finally {
      setIsSigning(false);
      setSignShift(null);
    }
  };

  /** Mark-all-S — bulk-set every item in the given shift column to S. */
  const handleBulkMarkS = async (shift: ShiftKey) => {
    if (!record || shiftLocked[shift]) return;
    setBulkPendingShift(shift);
    setErrorMessage(null);
    try {
      const updated = await logbookTfpService.bulkSetShiftStatus(record.id, { shift, status: 'S', overwrite: true });
      setRecord(updated);
      // Sync local state so toggles reflect the new values immediately
      const next: typeof localItems = {};
      Object.values(updated.items_by_category).flat().forEach((item) => {
        next[item.id] = {
          status_pagi: item.status_pagi,
          status_siang: item.status_siang,
          status_malam: item.status_malam,
        };
      });
      setLocalItems(next);
      setSuccessMessage(`Semua peralatan shift ${shift} diset Serviceable.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menerapkan auto-fill.');
      } else {
        setErrorMessage('Gagal menerapkan auto-fill.');
      }
    } finally {
      setBulkPendingShift(null);
    }
  };

  /** Reset all items in the given shift column (set to null). */
  const handleBulkReset = async (shift: ShiftKey) => {
    if (!record || shiftLocked[shift]) return;
    if (!confirm(`Reset semua status peralatan shift ${shift}?`)) return;
    setBulkPendingShift(shift);
    try {
      const updated = await logbookTfpService.bulkSetShiftStatus(record.id, { shift, status: null, overwrite: true });
      setRecord(updated);
      const next: typeof localItems = {};
      Object.values(updated.items_by_category).flat().forEach((item) => {
        next[item.id] = {
          status_pagi: item.status_pagi,
          status_siang: item.status_siang,
          status_malam: item.status_malam,
        };
      });
      setLocalItems(next);
    } catch {
      setErrorMessage('Gagal mereset shift.');
    } finally {
      setBulkPendingShift(null);
    }
  };

  /** Delete logbook — allowed even when signed. Caller already confirmed. */
  const handleDeleteLogbook = async () => {
    if (!record) return;
    const wasSigned = record.is_signed_pagi || record.is_signed_siang || record.is_signed_malam;
    const message = wasSigned
      ? `Logbook tanggal ${record.date} sudah memiliki tanda tangan. Hapus logbook ini dan SEMUA tanda tangan?\n\nIni tidak dapat dibatalkan, namun Anda bisa membuat ulang logbook pada tanggal yang sama.`
      : `Hapus logbook tanggal ${record.date}?`;
    if (!confirm(message)) return;
    setIsDeleting(true);
    try {
      await logbookTfpService.deleteLogbook(record.id);
      navigate('/logbooks/tfp');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menghapus logbook.');
      } else {
        setErrorMessage('Gagal menghapus logbook.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────
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

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-red-600">{errorMessage ?? 'Logbook tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/logbooks/tfp')} className="mt-4">Kembali</Button>
      </div>
    );
  }

  const categories = Object.keys(record.items_by_category);

  const notesByShift = {
    pagi: record.notes.filter((n) => n.shift === 'pagi'),
    siang: record.notes.filter((n) => n.shift === 'siang'),
    malam: record.notes.filter((n) => n.shift === 'malam'),
  };

  const shiftColors = {
    pagi: 'bg-amber-50 border-amber-200 text-amber-700',
    siang: 'bg-sky-50 border-sky-200 text-sky-700',
    malam: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  /** Per-shift manager assignment from roster. Used by the signature block + sign authorization. */
  const shiftManagers: Record<ShiftKey, { name: string; user_id: number } | null> = {
    pagi:  record.personnel_on_duty?.pagi?.manager ?? null,
    siang: record.personnel_on_duty?.siang?.manager ?? null,
    malam: record.personnel_on_duty?.malam?.manager ?? null,
  };

  const SHIFT_LABEL: Record<ShiftKey, string> = { pagi: 'Pagi', siang: 'Siang', malam: 'Malam' };
  const SHIFT_RANGE: Record<ShiftKey, string> = { pagi: '07:00–13:00', siang: '13:00–19:00', malam: '19:00–07:00' };

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/logbooks')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Logbook
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/logbooks/tfp')} className="hover:text-slate-700 transition-colors">TFP</button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{record.date}</span>
      </div>

      {/* Page Header */}
      <PageHeader
        icon={Activity}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        title={`Logbook TFP — ${formatDateLong(record.date)}`}
        subtitle="Log Book Fasilitas Penunjang"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 border ${
              isFullySigned
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : (record.is_signed_pagi || record.is_signed_siang || record.is_signed_malam)
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <CheckCircle2 size={13} />
              {isFullySigned ? 'Semua Shift Sudah TTD' : `${[record.is_signed_pagi, record.is_signed_siang, record.is_signed_malam].filter(Boolean).length}/3 Shift TTD`}
            </span>
            {!isFullySigned && (
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={15} /> Simpan Perubahan
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" onClick={handleDeleteLogbook} isLoading={isDeleting} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 size={15} /> Hapus Logbook
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      {/* Personnel On Duty */}
      {record.personnel_on_duty && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Personel On Duty</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PersonnelBlock shiftKey="pagi" label="Shift Pagi" range="07:00–13:00" info={record.personnel_on_duty.pagi} />
            <PersonnelBlock shiftKey="siang" label="Shift Siang" range="13:00–19:00" info={record.personnel_on_duty.siang} />
            <PersonnelBlock shiftKey="malam" label="Shift Malam" range="19:00–07:00" info={record.personnel_on_duty.malam} />
          </div>
        </div>
      )}

      {/* ── Split View ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[7fr_5fr] gap-5">

        {/* ── LEFT: Checklist Peralatan ─────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Status Peralatan</h3>
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] text-slate-500 shadow-sm">
              <span className="inline-flex items-center gap-1 pr-2 border-r border-gray-200">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="font-semibold text-slate-700">S</span>
                <span className="text-slate-400">Serviceable</span>
              </span>
              <span className="inline-flex items-center gap-1 pl-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span className="font-semibold text-slate-700">U/S</span>
                <span className="text-slate-400">Unserviceable</span>
              </span>
            </div>
          </div>

          {canManageEquipment && !isFullySigned && (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hover pada nama peralatan untuk edit/hapus. Klik <span className="text-slate-500 font-medium">+ Tambah peralatan</span> di bawah kategori untuk menambah baris baru.
            </p>
          )}

          {/* Mark-all-S quick action bar */}
          {!isFullySigned && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Auto-fill:</span>
              {(['pagi', 'siang', 'malam'] as ShiftKey[]).map((shift) => (
                <div key={shift} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleBulkMarkS(shift)}
                    disabled={shiftLocked[shift] || bulkPendingShift === shift}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-1 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={shiftLocked[shift] ? `Shift ${shift} sudah TTD` : `Tandai semua peralatan shift ${shift} sebagai Serviceable`}
                  >
                    <CheckSquare size={12} /> Semua S — {SHIFT_LABEL[shift]}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkReset(shift)}
                    disabled={shiftLocked[shift] || bulkPendingShift === shift}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white text-slate-500 text-[11px] font-medium px-1.5 py-1 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Reset shift ${shift}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-slate-400 text-sm">
              Tidak ada data peralatan.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <CategoryAccordion
                  key={cat}
                  category={cat}
                  items={record.items_by_category[cat]}
                  localItems={localItems}
                  onStatusChange={handleStatusChange}
                  onEditItem={setEditingItem}
                  onDeleteItem={handleDeleteEquipment}
                  onAddItem={setAddingCategory}
                  canManage={canManageEquipment}
                  disabled={isLocked}
                  shiftLocked={shiftLocked}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          )}

          {/* Add to new category */}
          {canManageEquipment && !isFullySigned && (
            <button
              type="button"
              onClick={() => setAddingCategory('')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors px-1"
            >
              <Plus size={13} /> Tambah peralatan ke kategori baru
            </button>
          )}
        </div>

        {/* ── RIGHT: Timeline Catatan ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Catatan Kegiatan</h3>
            {record.notes.length > 0 && (
              <span className="text-[11px] text-slate-400">
                {record.notes.length} entri
              </span>
            )}
          </div>

          {!shiftLocked[noteShift] && (
            <form onSubmit={handleAddNote} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Shift</label>
                  <select
                    value={noteShift}
                    onChange={(e) => setNoteShift(e.target.value as 'pagi' | 'siang' | 'malam')}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="pagi">Pagi</option>
                    <option value="siang">Siang</option>
                    <option value="malam">Malam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Jam</label>
                  <input
                    type="time"
                    value={noteTime}
                    onChange={(e) => setNoteTime(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Kegiatan / Catatan</label>
                <textarea
                  value={noteActivity}
                  onChange={(e) => setNoteActivity(e.target.value)}
                  rows={3}
                  placeholder="Tulis kegiatan atau catatan operasional..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" isLoading={isAddingNote} disabled={!noteActivity.trim()} size="sm" className="gap-1.5">
                  <Plus size={14} /> Tambah Catatan
                </Button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {record.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Clock size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Belum ada catatan kegiatan.</p>
                {!isFullySigned && <p className="text-xs text-slate-400 mt-1">Tambahkan catatan menggunakan form di atas.</p>}
              </div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto">
                {(['pagi', 'siang', 'malam'] as const).map((shift) => {
                  const notes = notesByShift[shift];
                  if (notes.length === 0) return null;
                  return (
                    <div key={shift}>
                      <div className={`sticky top-0 z-10 px-4 py-1.5 border-b border-gray-100 ${shiftColors[shift]} backdrop-blur-sm bg-opacity-95`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider capitalize">
                          Shift {shift} · {notes.length} catatan
                        </span>
                      </div>
                      <div className="relative pl-6 pr-3 py-2">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[14px] top-3 bottom-3 w-px bg-gray-200" aria-hidden="true" />
                        {notes.map((note) => (
                          <div key={note.id} className="relative flex items-start gap-3 py-2 hover:bg-slate-50/50 rounded-lg -ml-3 pl-3 pr-2 group">
                            {/* Timeline dot */}
                            <div className="relative flex items-center justify-center shrink-0 mt-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-white border-2 border-emerald-400 group-hover:border-emerald-500 group-hover:scale-110 transition-all" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {note.time && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mb-1">
                                  <Clock size={10} className="text-slate-400" />
                                  {note.time}
                                </span>
                              )}
                              <p className="text-sm text-slate-700 leading-snug">{note.activity}</p>
                            </div>
                            {!shiftLocked[note.shift] && (
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 mt-1"
                                title="Hapus catatan"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Signature Block — 3 slot per shift ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Tanda Tangan Manager Teknik</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiap shift punya slot tanda tangan tersendiri. Hanya Manager Teknik yang bertugas pada shift tersebut yang dapat menandatangani.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['pagi', 'siang', 'malam'] as ShiftKey[]).map((shift) => {
            const sig = record.manager_signatures[shift];
            const assignedMgr = shiftManagers[shift];
            const isSigned = !!sig?.signature;
            const isCurrentUser = canSign && assignedMgr && namesMatch(user?.name, assignedMgr.name);
            const showLockedNote = !isSigned && !!assignedMgr && !isCurrentUser;

            return (
              <div key={shift} className="space-y-3 border border-gray-100 rounded-xl p-3 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Shift {SHIFT_LABEL[shift]}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">{SHIFT_RANGE[shift]}</span>
                </div>

                <SignatureDisplay
                  signerName={sig?.signed_by_name ?? assignedMgr?.name ?? 'Belum ditugaskan'}
                  signedAt={sig?.signed_at ?? null}
                  signatureImage={sig?.signature ?? null}
                  role={`Manager Teknik — ${SHIFT_LABEL[shift]}`}
                  isPending={!isSigned && !!assignedMgr}
                  isNotRequired={!assignedMgr}
                />

                {!isSigned && isCurrentUser && (
                  <Button type="button" size="sm" className="w-full gap-2" onClick={() => setSignShift(shift)}>
                    <PenLine size={15} /> Tanda Tangan
                  </Button>
                )}

                {showLockedNote && (
                  <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600">
                    <Lock size={12} className="mt-0.5 text-slate-400 shrink-0" />
                    <span>Hanya dapat ditandatangani oleh <span className="font-semibold text-slate-800">{assignedMgr?.name}</span></span>
                  </div>
                )}

                {!isSigned && !assignedMgr && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                    <Lock size={12} className="mt-0.5 shrink-0" />
                    <span>Manager Teknik shift ini belum ditugaskan di roster.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment modals */}
      <EditEquipmentModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleEditEquipment}
        isSaving={isEquipmentSaving}
      />
      <AddEquipmentModal
        isOpen={addingCategory !== null}
        defaultCategory={addingCategory ?? ''}
        onClose={() => setAddingCategory(null)}
        onAdd={handleAddEquipment}
        isSaving={isEquipmentSaving}
      />

      {/* Signature Canvas Modal */}
      <SignatureCanvas
        isOpen={!!signShift}
        onClose={() => { if (!isSigning) setSignShift(null); }}
        onConfirm={(base64) => void handleSign(base64)}
        signerName={user?.name ?? 'Manager Teknik'}
        role={signShift ? `Manager Teknik — Shift ${SHIFT_LABEL[signShift]}` : 'Manager Teknik'}
        isLoading={isSigning}
      />
    </div>
  );
};
