import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  Printer,
  Users,
  Calendar,
  Clock,
  Zap,
  CheckSquare,
  Pencil,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings2,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { tfpAobGroundService } from '@/services/tfpAobGroundService';
import { TfpAobGroundSignaturePanel } from './components/TfpAobGroundSignaturePanel';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type {
  TfpAobGroundRecordDetail,
  TfpAobGroundItem,
  TfpAobGroundFacility,
} from '@/types/tfpAobGround';

// ─── Column definitions ────────────────────────────────────────────────────

type ItemColKey =
  | 'panel_cos_a03_input'
  | 'panel_cos_a03_output'
  | 'panel_ats_a12_input'
  | 'panel_ats_a12_output'
  | 'ups_tescom_a_input'
  | 'ups_tescom_a_output'
  | 'ups_tescom_b_input'
  | 'ups_tescom_b_output';

const ALL_COL_KEYS: ItemColKey[] = [
  'panel_cos_a03_input',
  'panel_cos_a03_output',
  'panel_ats_a12_input',
  'panel_ats_a12_output',
  'ups_tescom_a_input',
  'ups_tescom_a_output',
  'ups_tescom_b_input',
  'ups_tescom_b_output',
];

// Kondisi options for facility rows — per task spec.
const KONDISI_OPTIONS = ['Baik', 'Rusak', 'Tidak Ada'] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────

const isDisabled = (item: TfpAobGroundItem, colKey: ItemColKey): boolean =>
  item.is_disabled_map?.[colKey] === true;

const isModeRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('mode');

const isSuplaiRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('suplai aktif');

const isSingleValueRow = (item: TfpAobGroundItem): boolean => {
  const name = item.parameter_name.toLowerCase();
  return name.startsWith('kwh') || name.startsWith('suhu eq');
};

// ─── ToggleButtonGroup — 2-state pill toggle (Mode/Suplai cells) ──────────
// Click an option to select it. Click the active option again to clear.

interface ToggleButtonGroupProps {
  options: readonly string[];
  value: string;
  onChange: (val: string) => void;
  variant?: 'default' | 'mode' | 'suplai';
  disabled?: boolean;
}

const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  options, value, onChange, variant = 'default', disabled,
}) => {
  const palette = (val: string, active: boolean) => {
    if (!active) return 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200';
    if (variant === 'mode') {
      return val === 'Auto'
        ? 'bg-emerald-600 text-white border-emerald-600'
        : 'bg-amber-500 text-white border-amber-500';
    }
    if (variant === 'suplai') {
      return val === 'PLN' || val === 'PLN 1'
        ? 'bg-emerald-600 text-white border-emerald-600'
        : 'bg-sky-600 text-white border-sky-600';
    }
    return 'bg-slate-700 text-white border-slate-700';
  };

  return (
    <div className="inline-flex rounded-md border border-slate-200 overflow-hidden shadow-sm">
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? '' : opt)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-semibold transition-colors border-r border-slate-200 last:border-r-0 disabled:opacity-50 disabled:cursor-not-allowed',
              palette(opt, active),
              i === 0 ? 'rounded-l-md' : '',
              i === options.length - 1 ? 'rounded-r-md' : '',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ─── Plain cell input (rows 1–17) ──────────────────────────────────────────

interface CellInputProps {
  item: TfpAobGroundItem;
  colKey: ItemColKey;
  value: string;
  onChange: (val: string) => void;
  isCompleted: boolean;
}

const CellInput: React.FC<CellInputProps> = ({ item, colKey, value, onChange, isCompleted }) => {
  if (isDisabled(item, colKey)) {
    return <div className="w-full h-7 rounded" aria-hidden="true" />;
  }
  if (isCompleted) {
    return <span className="text-xs text-slate-700">{value || '—'}</span>;
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-7 px-2 text-center text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none"
    />
  );
};

// ─── Inline structure-edit popover for parameter rename ───────────────────

interface ParamEditFormProps {
  item: TfpAobGroundItem;
  onSave: (patch: { parameter_number?: string | null; parameter_name?: string; unit?: string | null }) => Promise<void>;
  onCancel: () => void;
}

const ParamEditForm: React.FC<ParamEditFormProps> = ({ item, onSave, onCancel }) => {
  const [num, setNum] = useState(item.parameter_number ?? '');
  const [name, setName] = useState(item.parameter_name);
  const [unit, setUnit] = useState(item.unit ?? '');
  const [busy, setBusy] = useState(false);

  return (
    <div className="px-3 py-2 bg-amber-50 border-y border-amber-200 grid grid-cols-1 sm:grid-cols-[60px_1fr_90px_auto] gap-2 items-center">
      <input
        type="text" value={num} onChange={(e) => setNum(e.target.value)} placeholder="No"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
      />
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama parameter"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
      />
      <input
        type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
      />
      <div className="flex gap-1.5">
        <button
          type="button" disabled={busy || !name.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave({
                parameter_number: num.trim() || null,
                parameter_name: name.trim(),
                unit: unit.trim() || null,
              });
            } finally { setBusy(false); }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={13} /> Simpan
        </button>
        <button
          type="button" onClick={onCancel}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          <X size={13} /> Batal
        </button>
      </div>
    </div>
  );
};

// ─── Inline "add parameter" form ───────────────────────────────────────────

interface AddParameterFormProps {
  onSave: (data: { parameter_name: string; parameter_number?: string | null; unit?: string | null }) => Promise<void>;
}

const AddParameterForm: React.FC<AddParameterFormProps> = ({ onSave }) => {
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({
        parameter_name: name.trim(),
        parameter_number: num.trim() || null,
        unit: unit.trim() || null,
      });
      setNum(''); setName(''); setUnit('');
    } finally { setBusy(false); }
  };

  return (
    <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-[60px_1fr_90px_auto] gap-2 items-center bg-slate-50/40">
      <input
        type="text" value={num} onChange={(e) => setNum(e.target.value)} placeholder="No"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none"
      />
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama parameter baru"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
      />
      <input
        type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none"
      />
      <button
        type="button" disabled={busy || !name.trim()} onClick={() => void submit()}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Plus size={13} /> Tambah
      </button>
    </div>
  );
};

// ─── Row-action button (pencil, trash, up, down) ───────────────────────────

const RowActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, variant = 'default', disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={cn(
      'inline-flex items-center justify-center h-6 w-6 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
      variant === 'danger'
        ? 'text-red-500 hover:bg-red-50'
        : 'text-slate-500 hover:bg-slate-100',
    )}
  >
    {children}
  </button>
);

// ─── Main component ────────────────────────────────────────────────────────

export const TfpAobGroundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Edit Mode permission — only roles that own structural changes can toggle it.
  // Teknisi can still edit values + sign, just not rename/add/delete/reorder.
  const canEditStructure =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor TFP';

  const [record, setRecord] = useState<TfpAobGroundRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local editable state for value cells
  const [itemValues, setItemValues] = useState<Record<number, Record<ItemColKey, string>>>({});
  const [facilityValues, setFacilityValues] = useState<
    Record<number, { kondisi: string; keterangan: string }>
  >({});

  // Editable jam pengisian. Default = server-current time_filled (or now() if blank).
  const [timeFilled, setTimeFilled] = useState<string>('');

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);
  const [editingParamId, setEditingParamId] = useState<number | null>(null);
  const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);
  const [editingFacilityName, setEditingFacilityName] = useState('');

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await tfpAobGroundService.getRecord(Number(id));
      hydrate(data);
    } catch {
      setErrorMessage('Gagal memuat data form. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Centralized hydration so all callers (initial fetch, save, sign, structure ops)
  // re-seed local state consistently from the server payload.
  const hydrate = (data: TfpAobGroundRecordDetail) => {
    setRecord(data);
    // Seed editable time from server snapshot. Falls back to current HH:MM when unset.
    setTimeFilled(data.time_filled ?? new Date().toTimeString().slice(0, 5));
    const iv: Record<number, Record<ItemColKey, string>> = {};
    data.items.forEach((item) => {
      iv[item.id] = {
        panel_cos_a03_input: item.panel_cos_a03_input ?? '',
        panel_cos_a03_output: item.panel_cos_a03_output ?? '',
        panel_ats_a12_input: item.panel_ats_a12_input ?? '',
        panel_ats_a12_output: item.panel_ats_a12_output ?? '',
        ups_tescom_a_input: item.ups_tescom_a_input ?? '',
        ups_tescom_a_output: item.ups_tescom_a_output ?? '',
        ups_tescom_b_input: item.ups_tescom_b_input ?? '',
        ups_tescom_b_output: item.ups_tescom_b_output ?? '',
      };
    });
    setItemValues(iv);

    const fv: Record<number, { kondisi: string; keterangan: string }> = {};
    data.facilities.forEach((f) => {
      fv[f.id] = {
        kondisi: f.kondisi ?? '',
        keterangan: f.keterangan ?? '',
      };
    });
    setFacilityValues(fv);
  };

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  useEffect(() => {
    const onFocus = () => void fetchRecord();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchRecord]);

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items.map((item) => ({
        id: item.id,
        ...itemValues[item.id],
      }));
      const facilitiesPayload = record.facilities.map((f) => ({
        id: f.id,
        kondisi: facilityValues[f.id]?.kondisi || null,
        keterangan: facilityValues[f.id]?.keterangan || null,
      }));

      // Only send time_filled when it actually parses to HH:MM — backend rejects malformed.
      const isValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeFilled.trim());

      const updated = await tfpAobGroundService.updateRecord(record.id, {
        items: itemsPayload,
        facilities: facilitiesPayload,
        time_filled: isValidTime ? timeFilled.trim() : null,
      });
      hydrate(updated);
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan perubahan.');
      } else {
        setErrorMessage('Gagal menyimpan perubahan. Coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setItemCell = (itemId: number, colKey: ItemColKey, val: string) => {
    setItemValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [colKey]: val },
    }));
  };

  const setFacilityField = (facilityId: number, field: 'kondisi' | 'keterangan', val: string) => {
    setFacilityValues((prev) => ({
      ...prev,
      [facilityId]: { ...prev[facilityId], [field]: val },
    }));
  };

  // ─── Structure ops (Edit Mode) ─────────────────────────────────────────
  // All ops refresh from the server payload so sort_order + ids stay accurate.
  // Errors surface as a top-of-page banner; the action button is its own
  // try/catch boundary to keep the rest of the table interactive.

  const withStructureError = async (fn: () => Promise<TfpAobGroundRecordDetail>) => {
    setErrorMessage(null);
    try {
      const updated = await fn();
      hydrate(updated);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Operasi gagal.');
      } else {
        setErrorMessage('Operasi gagal. Coba lagi.');
      }
    }
  };

  const handleAddParameter = (data: { parameter_name: string; parameter_number?: string | null; unit?: string | null }) =>
    withStructureError(() => tfpAobGroundService.addParameter(record!.id, data));

  const handleUpdateParameter = (paramId: number, patch: { parameter_number?: string | null; parameter_name?: string; unit?: string | null }) =>
    withStructureError(() => tfpAobGroundService.updateParameter(record!.id, paramId, patch));

  const handleDeleteParameter = (paramId: number, name: string) => {
    if (!window.confirm(`Hapus parameter "${name}"? Data nilai yang sudah diisi akan ikut hilang.`)) return;
    void withStructureError(() => tfpAobGroundService.deleteParameter(record!.id, paramId));
  };

  const handleMoveParameter = (idx: number, dir: -1 | 1) => {
    if (!record) return;
    const ids = record.items.map((it) => it.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    void withStructureError(() => tfpAobGroundService.reorderParameters(record.id, ids));
  };

  const handleAddFacility = (name: string) =>
    withStructureError(() => tfpAobGroundService.addFacility(record!.id, { facility_name: name }));

  const handleUpdateFacility = (facilityId: number, name: string) =>
    withStructureError(() => tfpAobGroundService.updateFacility(record!.id, facilityId, { facility_name: name }));

  const handleDeleteFacility = (facilityId: number, name: string) => {
    if (!window.confirm(`Hapus fasilitas "${name}"?`)) return;
    void withStructureError(() => tfpAobGroundService.deleteFacility(record!.id, facilityId));
  };

  const handleMoveFacility = (idx: number, dir: -1 | 1) => {
    if (!record) return;
    const ids = record.facilities.map((f) => f.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    void withStructureError(() => tfpAobGroundService.reorderFacilities(record.id, ids));
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-slate-500">Form tidak ditemukan.</p>
        <Button onClick={() => navigate('/tfp/aob-ground')} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';
  const showStructureControls = editMode && canEditStructure && !isCompleted;

  // Width of "Aksi" column when Edit Mode is on
  const aksiColWidth = showStructureControls ? 132 : 0;

  return (
    <div className="max-w-full space-y-6 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/tfp')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          TFP
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/tfp/aob-ground')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          Performance Check AOB Ground
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tfp/aob-ground')}
              className="hover:bg-slate-100 mt-0.5"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">
                  Performance Check AOB Lantai Ground
                </h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                TFP — Cabang Surabaya &nbsp;·&nbsp;
                <span className="font-mono">{record.form_number}</span>
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-medium">{record.day_name ?? ''}</span>
              <span>{record.date}</span>
            </div>
            {/* Editable jam pengisian — default = server time, user dapat ubah HH:MM */}
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <Clock size={13} className="text-slate-400" />
                <span>{record.time_filled ?? '—'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg" title="Klik untuk ubah jam pengisian (HH:MM)">
                <Clock size={13} className="text-slate-400" />
                <input
                  type="time"
                  value={timeFilled}
                  onChange={(e) => setTimeFilled(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none w-[68px]"
                />
                <button
                  type="button"
                  onClick={() => setTimeFilled(new Date().toTimeString().slice(0, 5))}
                  title="Reset ke waktu sekarang"
                  className="text-[10px] text-slate-400 hover:text-sky-600 transition-colors"
                >
                  Now
                </button>
              </div>
            )}
            <ShiftBadge shift={record.shift_type} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi TFP</span>
            </div>

            {/* Edit Mode toggle — Manager/Supervisor/Admin only, hidden when completed */}
            {canEditStructure && !isCompleted && (
              <button
                type="button"
                onClick={() => {
                  setEditMode((v) => !v);
                  setEditingParamId(null);
                  setEditingFacilityId(null);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                  editMode
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
                )}
                title="Aktifkan Edit Mode untuk mengubah struktur parameter & fasilitas"
              >
                <Settings2 size={14} />
                {editMode ? 'Selesai Edit' : 'Edit Mode'}
              </button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tfp/aob-ground/${record.id}/print`)}
              className="gap-1.5 text-indigo-600 hover:bg-indigo-50"
            >
              <Printer size={15} />
              Print
            </Button>
          </div>
        </div>

        {/* Personnel summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Manager Teknik
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.manager?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Supervisor TFP
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Pelaksana Teknisi TFP
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.technicians.map((t) => t.technician_name).join(', ') || (
                <span className="text-slate-400 italic">—</span>
              )}
            </p>
          </div>
        </div>

        {/* Edit Mode hint banner */}
        {showStructureControls && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
            <Settings2 size={13} className="text-amber-600 shrink-0" />
            <span>
              <strong>Edit Mode aktif.</strong> Manager/Supervisor dapat rename, tambah, hapus, dan reorder parameter & fasilitas.
              Pengisian nilai cell tidak dinonaktifkan.
            </span>
          </div>
        )}
      </div>

      {/* Error / Success messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* ─── Two-panel layout ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── Parameter Pengukuran ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <Zap size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">Parameter Pengukuran</h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {record.items.length} parameter
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[800px]" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '32px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                <col style={{ width: '62px' }} />
                {showStructureControls && <col style={{ width: `${aksiColWidth}px` }} />}
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th rowSpan={2} className="px-2 py-2 text-center font-semibold border-b border-slate-200 align-middle text-[10px] uppercase tracking-wider">No</th>
                  <th rowSpan={2} className="px-3 py-2 text-left font-semibold border-b border-slate-200 align-middle text-[10px] uppercase tracking-wider">Parameter</th>
                  <th colSpan={2} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 text-[10px] uppercase tracking-wider">Panel COS (A 03)</th>
                  <th colSpan={2} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 text-[10px] uppercase tracking-wider">Panel ATS (A 12)</th>
                  <th colSpan={2} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 text-[10px] uppercase tracking-wider">UPS TESCOM A</th>
                  <th colSpan={2} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 text-[10px] uppercase tracking-wider">UPS TESCOM B</th>
                  {showStructureControls && (
                    <th rowSpan={2} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 align-middle text-[10px] uppercase tracking-wider">Aksi</th>
                  )}
                </tr>
                <tr className="bg-slate-50 text-slate-500">
                  {['Input', 'Output', 'Input', 'Output', 'Input', 'Output', 'Input', 'Output'].map((lbl, i) => (
                    <th
                      key={i}
                      className={cn(
                        'px-1 py-1.5 text-center font-medium border-b border-slate-200 text-[10px] uppercase tracking-wider',
                        i % 2 === 0 ? 'border-l' : '',
                      )}
                    >
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.items.map((item, idx) => {
                  const rowBase = 'bg-white hover:bg-slate-50/60 transition-colors';
                  const isFirstRow = idx === 0;
                  const isLastRow = idx === record.items.length - 1;

                  // Render structure-edit row inline above the actual row when active
                  const editRow = editingParamId === item.id ? (
                    <tr key={`${item.id}-edit`}>
                      <td colSpan={10 + (showStructureControls ? 1 : 0)} className="p-0">
                        <ParamEditForm
                          item={item}
                          onSave={async (patch) => {
                            await handleUpdateParameter(item.id, patch);
                            setEditingParamId(null);
                          }}
                          onCancel={() => setEditingParamId(null)}
                        />
                      </td>
                    </tr>
                  ) : null;

                  const actionCell = showStructureControls ? (
                    <td className="px-1.5 py-1.5 border-b border-l border-slate-100">
                      <div className="flex items-center justify-center gap-0.5">
                        <RowActionBtn
                          title="Pindah atas" disabled={isFirstRow}
                          onClick={() => handleMoveParameter(idx, -1)}
                        ><ChevronUp size={14} /></RowActionBtn>
                        <RowActionBtn
                          title="Pindah bawah" disabled={isLastRow}
                          onClick={() => handleMoveParameter(idx, 1)}
                        ><ChevronDown size={14} /></RowActionBtn>
                        <RowActionBtn
                          title="Rename"
                          onClick={() => setEditingParamId(editingParamId === item.id ? null : item.id)}
                        ><Pencil size={12} /></RowActionBtn>
                        <RowActionBtn
                          title="Hapus" variant="danger"
                          onClick={() => handleDeleteParameter(item.id, item.parameter_name)}
                        ><Trash2 size={12} /></RowActionBtn>
                      </div>
                    </td>
                  ) : null;

                  // Shared cell classes for consistency across all row variants
                  const tdNo = 'px-2 py-2 text-slate-500 font-mono text-center text-[11px] border-b border-slate-100';
                  const tdName = 'px-3 py-2 font-medium text-slate-700 text-xs border-b border-slate-100';
                  const tdCell = 'px-1.5 py-1.5 border-b border-l border-slate-100';

                  // ── Row 18: Mode ──
                  if (isModeRow(item)) {
                    const cosVal = itemValues[item.id]?.panel_cos_a03_input ?? '';
                    const atsVal = itemValues[item.id]?.panel_ats_a12_input ?? '';
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={rowBase}>
                          <td className={tdNo}>{idx + 1}</td>
                          <td className={tdName}>
                            {item.parameter_name}
                            <span className="text-slate-400 ml-1 text-[10px]">(Auto/Manual)</span>
                          </td>
                          <td colSpan={2} className={cn(tdCell, 'text-center')}>
                            {isCompleted ? (
                              <span className="text-xs text-slate-700 font-semibold">{cosVal || '—'}</span>
                            ) : (
                              <ToggleButtonGroup
                                options={['Auto', 'Manual']} value={cosVal} variant="mode"
                                onChange={(v) => setItemCell(item.id, 'panel_cos_a03_input', v)}
                              />
                            )}
                          </td>
                          <td colSpan={2} className={cn(tdCell, 'text-center')}>
                            {isCompleted ? (
                              <span className="text-xs text-slate-700 font-semibold">{atsVal || '—'}</span>
                            ) : (
                              <ToggleButtonGroup
                                options={['Auto', 'Manual']} value={atsVal} variant="mode"
                                onChange={(v) => setItemCell(item.id, 'panel_ats_a12_input', v)}
                              />
                            )}
                          </td>
                          <td colSpan={2} className={cn(tdCell, 'bg-slate-100')} />
                          <td colSpan={2} className={cn(tdCell, 'bg-slate-100')} />
                          {actionCell}
                        </tr>
                        {editRow}
                      </React.Fragment>
                    );
                  }

                  // ── Row 19: Suplai Aktif ──
                  if (isSuplaiRow(item)) {
                    const cosVal = itemValues[item.id]?.panel_cos_a03_input ?? '';
                    const atsVal = itemValues[item.id]?.panel_ats_a12_input ?? '';
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={rowBase}>
                          <td className={tdNo}>{idx + 1}</td>
                          <td className={tdName}>{item.parameter_name}</td>
                          <td colSpan={2} className={cn(tdCell, 'text-center')}>
                            {isCompleted ? (
                              <span className="text-xs text-slate-700 font-semibold">{cosVal || '—'}</span>
                            ) : (
                              <ToggleButtonGroup
                                options={['PLN', 'UPS']} value={cosVal} variant="suplai"
                                onChange={(v) => setItemCell(item.id, 'panel_cos_a03_input', v)}
                              />
                            )}
                          </td>
                          <td colSpan={2} className={cn(tdCell, 'text-center')}>
                            {isCompleted ? (
                              <span className="text-xs text-slate-700 font-semibold">{atsVal || '—'}</span>
                            ) : (
                              <ToggleButtonGroup
                                options={['PLN 1', 'PLN 2']} value={atsVal} variant="suplai"
                                onChange={(v) => setItemCell(item.id, 'panel_ats_a12_input', v)}
                              />
                            )}
                          </td>
                          <td colSpan={2} className={cn(tdCell, 'bg-slate-100')} />
                          <td colSpan={2} className={cn(tdCell, 'bg-slate-100')} />
                          {actionCell}
                        </tr>
                        {editRow}
                      </React.Fragment>
                    );
                  }

                  // ── Rows 20-21: KWH / Suhu Eq. Room ──
                  if (isSingleValueRow(item)) {
                    const val = itemValues[item.id]?.panel_cos_a03_input ?? '';
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={rowBase}>
                          <td className={tdNo}>{idx + 1}</td>
                          <td className={tdName}>
                            {item.parameter_name}
                            {item.unit && <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>}
                          </td>
                          <td colSpan={8} className={cn(tdCell, 'px-3')}>
                            {isCompleted ? (
                              <span className="text-xs text-slate-700">{val || '—'}</span>
                            ) : (
                              <input
                                type="text" inputMode="decimal" value={val}
                                onChange={(e) => setItemCell(item.id, 'panel_cos_a03_input', e.target.value)}
                                className="w-48 h-7 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none"
                              />
                            )}
                          </td>
                          {actionCell}
                        </tr>
                        {editRow}
                      </React.Fragment>
                    );
                  }

                  // ── Rows 1–17: normal cells ──
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={rowBase}>
                        <td className={tdNo}>{idx + 1}</td>
                        <td className={tdName}>
                          {item.parameter_name}
                          {item.unit && <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>}
                        </td>
                        {ALL_COL_KEYS.map((colKey) => (
                          <td key={colKey} className={cn(tdCell, isDisabled(item, colKey) ? 'bg-slate-100' : '')}>
                            <CellInput
                              item={item} colKey={colKey}
                              value={itemValues[item.id]?.[colKey] ?? ''}
                              onChange={(val) => setItemCell(item.id, colKey, val)}
                              isCompleted={isCompleted}
                            />
                          </td>
                        ))}
                        {actionCell}
                      </tr>
                      {editRow}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inline "Add Parameter" form (Edit Mode only) */}
          {showStructureControls && (
            <div className="border-t border-slate-200">
              <AddParameterForm onSave={handleAddParameter} />
            </div>
          )}
        </div>

        {/* ── Kondisi Fasilitas ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <CheckSquare size={16} className="text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800">Kondisi Fasilitas</h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {record.facilities.length} fasilitas
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Column headers */}
            <div className={cn(
              'grid gap-2 px-4 py-2 bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase tracking-wider items-center border-b border-slate-200',
              showStructureControls
                ? 'grid-cols-[1fr_90px_1fr_88px]'
                : 'grid-cols-[1fr_90px_1fr]',
            )}>
              <span>Nama Fasilitas</span>
              <span className="text-center">Kondisi</span>
              <span>Keterangan</span>
              {showStructureControls && <span className="text-center">Aksi</span>}
            </div>

            {record.facilities.map((facility, idx) => (
              <FacilityRow
                key={facility.id}
                facility={facility}
                idx={idx}
                total={record.facilities.length}
                isCompleted={isCompleted}
                showStructureControls={showStructureControls}
                kondisi={facilityValues[facility.id]?.kondisi ?? ''}
                keterangan={facilityValues[facility.id]?.keterangan ?? ''}
                onKondisiChange={(v) => setFacilityField(facility.id, 'kondisi', v)}
                onKeteranganChange={(v) => setFacilityField(facility.id, 'keterangan', v)}
                isEditingStructure={editingFacilityId === facility.id}
                editingName={editingFacilityName}
                onStartEdit={() => {
                  setEditingFacilityId(facility.id);
                  setEditingFacilityName(facility.facility_name);
                }}
                onCancelEdit={() => {
                  setEditingFacilityId(null);
                  setEditingFacilityName('');
                }}
                onChangeEditingName={setEditingFacilityName}
                onSaveEdit={async () => {
                  if (!editingFacilityName.trim()) return;
                  await handleUpdateFacility(facility.id, editingFacilityName.trim());
                  setEditingFacilityId(null);
                  setEditingFacilityName('');
                }}
                onMove={(dir) => handleMoveFacility(idx, dir)}
                onDelete={() => handleDeleteFacility(facility.id, facility.facility_name)}
              />
            ))}
          </div>

          {/* Inline "Add Facility" form (Edit Mode only) */}
          {showStructureControls && (
            <div className="border-t border-slate-200">
              <AddFacilityForm onSave={handleAddFacility} />
            </div>
          )}
        </div>

      </div>{/* end grid */}

      {/* Save button */}
      {!isCompleted && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-100"
          >
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      )}

      {/* Signature panel */}
      <TfpAobGroundSignaturePanel record={record} onUpdated={hydrate} />
    </div>
  );
};

// ─── FacilityRow — extracted to keep the main component readable ───────────

interface FacilityRowProps {
  facility: TfpAobGroundFacility;
  idx: number;
  total: number;
  isCompleted: boolean;
  showStructureControls: boolean;
  kondisi: string;
  keterangan: string;
  onKondisiChange: (v: string) => void;
  onKeteranganChange: (v: string) => void;
  isEditingStructure: boolean;
  editingName: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditingName: (v: string) => void;
  onSaveEdit: () => Promise<void>;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

const FacilityRow: React.FC<FacilityRowProps> = ({
  facility, idx, total, isCompleted, showStructureControls,
  kondisi, keterangan, onKondisiChange, onKeteranganChange,
  isEditingStructure, editingName, onStartEdit, onCancelEdit,
  onChangeEditingName, onSaveEdit, onMove, onDelete,
}) => {
  const palette = (() => {
    if (kondisi === 'Baik') return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300';
    if (kondisi === 'Rusak') return 'bg-red-50 text-red-700 border-red-200 focus:ring-red-300';
    if (kondisi === 'Tidak Ada') return 'bg-slate-100 text-slate-600 border-slate-300 focus:ring-slate-400';
    return 'bg-white text-slate-500 border-slate-300 focus:ring-brand-primary';
  })();

  return (
    <div
      className={cn(
        'gap-2 px-4 py-2 items-center grid bg-white hover:bg-slate-50/60 transition-colors',
        showStructureControls
          ? 'grid-cols-[1fr_90px_1fr_88px]'
          : 'grid-cols-[1fr_90px_1fr]',
      )}
    >
      {isEditingStructure ? (
        <input
          autoFocus type="text" value={editingName}
          onChange={(e) => onChangeEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="h-8 px-2 text-xs rounded border border-amber-400 bg-amber-50 focus:ring-1 focus:ring-amber-400 focus:outline-none"
        />
      ) : (
        <span className="text-xs font-medium text-slate-700">{facility.facility_name}</span>
      )}

      {isCompleted ? (
        <span className={cn('text-xs font-semibold text-center', kondisi === 'Baik' ? 'text-emerald-700' : kondisi === 'Rusak' ? 'text-red-700' : 'text-slate-500')}>
          {kondisi || '—'}
        </span>
      ) : (
        <select
          value={kondisi} onChange={(e) => onKondisiChange(e.target.value)}
          className={cn(
            'w-full h-8 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-semibold',
            palette,
          )}
        >
          <option value="">—</option>
          {KONDISI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}

      {isCompleted ? (
        <span className="text-xs text-slate-600">{keterangan || '—'}</span>
      ) : (
        <input
          type="text" value={keterangan}
          onChange={(e) => onKeteranganChange(e.target.value)}
          placeholder="Keterangan..."
          className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none w-full"
        />
      )}

      {showStructureControls && (
        <div className="flex items-center justify-center gap-0.5">
          {isEditingStructure ? (
            <>
              <RowActionBtn title="Simpan" onClick={() => void onSaveEdit()}><Check size={12} /></RowActionBtn>
              <RowActionBtn title="Batal" onClick={onCancelEdit}><X size={12} /></RowActionBtn>
            </>
          ) : (
            <>
              <RowActionBtn title="Pindah atas" disabled={idx === 0} onClick={() => onMove(-1)}><ChevronUp size={14} /></RowActionBtn>
              <RowActionBtn title="Pindah bawah" disabled={idx === total - 1} onClick={() => onMove(1)}><ChevronDown size={14} /></RowActionBtn>
              <RowActionBtn title="Rename" onClick={onStartEdit}><Pencil size={12} /></RowActionBtn>
              <RowActionBtn title="Hapus" variant="danger" onClick={onDelete}><Trash2 size={12} /></RowActionBtn>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Inline "add facility" form ────────────────────────────────────────────

const AddFacilityForm: React.FC<{ onSave: (name: string) => Promise<void> }> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave(name.trim());
      setName('');
    } finally { setBusy(false); }
  };

  return (
    <div className="px-4 py-2 flex items-center gap-2 bg-slate-50/40">
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
        placeholder="Nama fasilitas baru"
        className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none"
      />
      <button
        type="button" disabled={busy || !name.trim()} onClick={() => void submit()}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Plus size={13} /> Tambah
      </button>
    </div>
  );
};
