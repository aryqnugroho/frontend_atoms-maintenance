import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Ban,
  MoveHorizontal,
  Columns,
  ColumnsIcon,
  Eraser,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { tfpAobLt12Service } from '@/services/tfpAobLt12Service';
import { TfpAobLt12SignaturePanel } from './components/TfpAobLt12SignaturePanel';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type {
  TfpAobLt12RecordDetail,
  TfpAobLt12Item,
  TfpAobLt12Facility,
  TfpAobLt12ColumnsConfig,
  TfpAobLt12Panel,
} from '@/types/tfpAobLt12';

// ─── Helpers ───────────────────────────────────────────────────────────────

const cellKeyOf = (panelId: string, subKey: string) => `${panelId}.${subKey}`;

interface FlatCell {
  panel: TfpAobLt12Panel;
  subKey: string;
  subLabel: string;
  key: string;
  index: number;
}

const flattenColumns = (config: TfpAobLt12ColumnsConfig): FlatCell[] => {
  const out: FlatCell[] = [];
  let i = 0;
  for (const panel of config) {
    for (const sub of panel.sub_columns) {
      out.push({
        panel,
        subKey: sub.key,
        subLabel: sub.label,
        key: cellKeyOf(panel.id, sub.key),
        index: i++,
      });
    }
  }
  return out;
};

const isModeRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().startsWith('mode');

const isSuplaiRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().startsWith('suplai aktif');

const KONDISI_OPTIONS = ['Baik', 'Rusak', 'Tidak Ada'] as const;

const slugify = (raw: string): string =>
  raw.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

// ─── ToggleButtonGroup (Mode / Suplai cells) ──────────────────────────────

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

// ─── Cell value input ──────────────────────────────────────────────────────

interface CellInputProps {
  isDisabled: boolean;
  isCompleted: boolean;
  value: string;
  onChange: (val: string) => void;
}

const CellInput: React.FC<CellInputProps> = ({ isDisabled, isCompleted, value, onChange }) => {
  if (isDisabled) return <div className="w-full h-7 rounded" aria-hidden="true" />;
  if (isCompleted) return <span className="text-xs text-slate-700">{value || '—'}</span>;
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

// ─── Edit Mode cell ────────────────────────────────────────────────────────

interface EditCellProps {
  isDisabled: boolean;
  isSelected: boolean;
  colspan: number;
  onClick: () => void;
  label?: React.ReactNode;
}

const EditCell: React.FC<EditCellProps> = ({ isDisabled, isSelected, colspan, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full min-h-[28px] text-[10px] font-medium rounded transition-all flex items-center justify-center gap-1',
      isDisabled
        ? 'bg-slate-200 text-slate-400 hover:bg-slate-300'
        : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200',
      isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : '',
    )}
    title={isDisabled ? 'Klik untuk aktifkan cell' : 'Klik untuk disable cell'}
  >
    {colspan > 1 && <MoveHorizontal size={10} />}
    {label ?? (isDisabled ? <Ban size={10} /> : <Check size={10} />)}
    {colspan > 1 && <span className="font-bold">×{colspan}</span>}
  </button>
);

// ─── Inline param edit + add forms ────────────────────────────────────────

interface ParamEditFormProps {
  item: TfpAobLt12Item;
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
      <input type="text" value={num} onChange={(e) => setNum(e.target.value)} placeholder="No"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none" />
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama parameter"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none" />
      <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-amber-400 focus:outline-none" />
      <div className="flex gap-1.5">
        <button type="button" disabled={busy || !name.trim()}
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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
          <Check size={13} /> Simpan
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-50">
          <X size={13} /> Batal
        </button>
      </div>
    </div>
  );
};

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
      <input type="text" value={num} onChange={(e) => setNum(e.target.value)} placeholder="No"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none" />
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama parameter baru"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} />
      <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
        className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none" />
      <button type="button" disabled={busy || !name.trim()} onClick={() => void submit()}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
        <Plus size={13} /> Tambah
      </button>
    </div>
  );
};

const RowActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, variant = 'default', disabled, children }) => (
  <button type="button" onClick={onClick} title={title} disabled={disabled}
    className={cn(
      'inline-flex items-center justify-center h-6 w-6 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
      variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100',
    )}>
    {children}
  </button>
);

// ─── Add panel modal ──────────────────────────────────────────────────────

interface AddPanelModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (panel: TfpAobLt12Panel) => void;
  existingIds: string[];
}

const AddPanelModal: React.FC<AddPanelModalProps> = ({ open, onClose, onAdd, existingIds }) => {
  const [label, setLabel] = useState('');
  const [subs, setSubs] = useState<{ label: string }[]>([{ label: 'Nilai' }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(''); setSubs([{ label: 'Nilai' }]); setError(null);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    setError(null);
    const trimmedLabel = label.trim();
    if (!trimmedLabel) { setError('Nama panel wajib diisi.'); return; }

    const id = slugify(trimmedLabel);
    if (!id) { setError('Nama panel tidak valid (harus mengandung huruf/angka).'); return; }
    if (existingIds.includes(id)) { setError(`Panel dengan id "${id}" sudah ada.`); return; }

    const cleanSubs = subs.map((s) => ({ label: s.label.trim() })).filter((s) => s.label !== '');
    if (cleanSubs.length === 0) { setError('Minimal 1 sub-kolom.'); return; }

    const subKeysSeen = new Set<string>();
    const finalSubs: { key: string; label: string }[] = [];
    for (const s of cleanSubs) {
      let k = slugify(s.label) || 'col';
      const base = k; let n = 1;
      while (subKeysSeen.has(k)) { k = `${base}_${++n}`; }
      subKeysSeen.add(k);
      finalSubs.push({ key: k, label: s.label });
    }

    onAdd({ id, label: trimmedLabel, sub_columns: finalSubs });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Columns size={16} className="text-sky-600" />
            Tambah Panel Baru
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">Nama Panel</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus
              placeholder="misal: Panel A 23 Server Room"
              className="w-full h-9 px-3 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-sky-400 focus:outline-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Sub-Kolom</label>
              <button type="button" onClick={() => setSubs([...subs, { label: '' }])}
                className="text-[11px] text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                <Plus size={11} /> Tambah sub-kolom
              </button>
            </div>
            <div className="space-y-1.5">
              {subs.map((s, i) => (
                <div key={i} className="flex gap-1.5">
                  <input type="text" value={s.label}
                    onChange={(e) => { const next = [...subs]; next[i].label = e.target.value; setSubs(next); }}
                    placeholder={`Sub-kolom ${i + 1}`}
                    className="flex-1 h-8 px-2.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-sky-400 focus:outline-none" />
                  {subs.length > 1 && (
                    <button type="button" onClick={() => setSubs(subs.filter((_, j) => j !== i))}
                      className="h-8 w-8 rounded text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-50">
            Batal
          </button>
          <button type="button" onClick={submit}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus size={13} className="inline mr-1" /> Tambah Panel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Panel header (Edit Mode) ─────────────────────────────────────────────

interface PanelHeaderEditProps {
  panel: TfpAobLt12Panel;
  onRename: (newLabel: string) => void;
  onDelete: () => void;
  onAddSub: () => void;
  canDeletePanel: boolean;
}

const PanelHeaderEdit: React.FC<PanelHeaderEditProps> = ({
  panel, onRename, onDelete, onAddSub, canDeletePanel,
}) => {
  const [editingPanel, setEditingPanel] = useState(false);
  const [panelDraft, setPanelDraft] = useState(panel.label);

  return (
    <th colSpan={panel.sub_columns.length} className="px-2 py-2 text-center font-semibold border-b border-l border-amber-300 text-[10px] uppercase tracking-wider bg-amber-100 text-amber-900">
      {editingPanel ? (
        <div className="flex gap-1 items-center justify-center">
          <input autoFocus value={panelDraft} onChange={(e) => setPanelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(panelDraft.trim()); setEditingPanel(false); }
              if (e.key === 'Escape') { setEditingPanel(false); setPanelDraft(panel.label); }
            }}
            className="h-7 px-2 text-[11px] rounded border border-amber-400 bg-white text-slate-700 focus:outline-none w-32" />
          <button type="button" onClick={() => { onRename(panelDraft.trim()); setEditingPanel(false); }} className="text-emerald-600 hover:bg-emerald-100 rounded p-0.5"><Check size={12} /></button>
          <button type="button" onClick={() => { setEditingPanel(false); setPanelDraft(panel.label); }} className="text-slate-500 hover:bg-slate-100 rounded p-0.5"><X size={12} /></button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1">
          <span>{panel.label}</span>
          <button type="button" title="Rename panel"
            onClick={() => { setPanelDraft(panel.label); setEditingPanel(true); }}
            className="text-amber-700 hover:bg-amber-200 rounded p-0.5"><Pencil size={10} /></button>
          <button type="button" title="Tambah sub-kolom" onClick={onAddSub}
            className="text-sky-700 hover:bg-sky-100 rounded p-0.5"><Plus size={11} /></button>
          {canDeletePanel && (
            <button type="button" title="Hapus panel" onClick={onDelete}
              className="text-red-500 hover:bg-red-100 rounded p-0.5"><Trash2 size={10} /></button>
          )}
        </div>
      )}
    </th>
  );
};

// ─── Sub-column header (Edit Mode) ────────────────────────────────────────

const SubColumnHeader: React.FC<{
  label: string;
  onRename: (lbl: string) => void;
  onDelete: () => void;
}> = ({ label, onRename, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRename(draft.trim()); setEditing(false); }
            if (e.key === 'Escape') { setDraft(label); setEditing(false); }
          }}
          className="h-6 px-1 text-[10px] rounded border border-amber-400 bg-white text-slate-700 focus:outline-none w-16" />
        <button type="button" onClick={() => { onRename(draft.trim()); setEditing(false); }} className="text-emerald-600 hover:bg-emerald-100 rounded p-0.5"><Check size={10} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 justify-center group">
      <span>{label}</span>
      <button type="button" title="Rename" onClick={() => { setDraft(label); setEditing(true); }}
        className="text-amber-600 hover:bg-amber-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={9} />
      </button>
      <button type="button" title="Hapus sub-kolom" onClick={onDelete}
        className="text-red-500 hover:bg-red-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={9} />
      </button>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

export const TfpAobLt12DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEditStructure =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor TFP';

  const [record, setRecord] = useState<TfpAobLt12RecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [itemValues, setItemValues] = useState<Record<number, Record<string, string>>>({});
  const [facilityValues, setFacilityValues] = useState<Record<number, { kondisi: string; keterangan: string }>>({});
  const [timeFilled, setTimeFilled] = useState<string>('');

  const [editMode, setEditMode] = useState(false);
  const [editingParamId, setEditingParamId] = useState<number | null>(null);
  const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);
  const [editingFacilityName, setEditingFacilityName] = useState('');

  const [draftConfig, setDraftConfig] = useState<TfpAobLt12ColumnsConfig | null>(null);
  const [draftItemMeta, setDraftItemMeta] = useState<Record<number, {
    is_disabled_map: Record<string, boolean>;
    merge_map: Record<string, number>;
  }>>({});
  const [showAddPanel, setShowAddPanel] = useState(false);

  // ─── Data loading ───────────────────────────────────────────────────────

  const hydrate = (data: TfpAobLt12RecordDetail) => {
    setRecord(data);
    setTimeFilled(data.time_filled ?? new Date().toTimeString().slice(0, 5));

    const iv: Record<number, Record<string, string>> = {};
    data.items.forEach((item) => { iv[item.id] = { ...(item.values ?? {}) }; });
    setItemValues(iv);

    const fv: Record<number, { kondisi: string; keterangan: string }> = {};
    data.facilities.forEach((f) => {
      fv[f.id] = { kondisi: f.kondisi ?? '', keterangan: f.keterangan ?? '' };
    });
    setFacilityValues(fv);

    setDraftConfig(null);
    setDraftItemMeta({});
  };

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await tfpAobLt12Service.getRecord(Number(id));
      hydrate(data);
    } catch {
      setErrorMessage('Gagal memuat data form. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  useEffect(() => {
    const onFocus = () => void fetchRecord();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchRecord]);

  // ─── Computed: effective config + meta ─────────────────────────────────

  const effectiveConfig: TfpAobLt12ColumnsConfig = useMemo(
    () => draftConfig ?? record?.columns_config ?? [],
    [draftConfig, record],
  );

  const flatCells = useMemo(() => flattenColumns(effectiveConfig), [effectiveConfig]);
  const flatKeys = useMemo(() => flatCells.map((c) => c.key), [flatCells]);

  // Hide sub-column header row when all panels have exactly one sub-column —
  // keeps the table compact for forms like AOB Lt 1&2 with single-value panels.
  const hasMultiSubCols = useMemo(
    () => effectiveConfig.some((p) => p.sub_columns.length > 1),
    [effectiveConfig],
  );

  const getItemDisabled = (itemId: number, cellKey: string): boolean => {
    const draft = draftItemMeta[itemId];
    if (draft) return draft.is_disabled_map[cellKey] === true;
    const item = record?.items.find((it) => it.id === itemId);
    return item?.is_disabled_map?.[cellKey] === true;
  };

  const getItemMerge = (itemId: number, cellKey: string): number => {
    const draft = draftItemMeta[itemId];
    if (draft) return draft.merge_map[cellKey] ?? 1;
    const item = record?.items.find((it) => it.id === itemId);
    return item?.merge_map?.[cellKey] ?? 1;
  };

  const mutateItemMeta = (itemId: number, fn: (m: { is_disabled_map: Record<string, boolean>; merge_map: Record<string, number> }) => void) => {
    setDraftItemMeta((prev) => {
      const existing = prev[itemId] ?? (() => {
        const it = record?.items.find((x) => x.id === itemId);
        return {
          is_disabled_map: { ...(it?.is_disabled_map ?? {}) },
          merge_map: { ...(it?.merge_map ?? {}) },
        };
      })();
      const next = {
        is_disabled_map: { ...existing.is_disabled_map },
        merge_map: { ...existing.merge_map },
      };
      fn(next);
      return { ...prev, [itemId]: next };
    });
  };

  // ─── Save (value entry) ────────────────────────────────────────────────

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items.map((item) => ({
        id: item.id,
        values: itemValues[item.id] ?? {},
      }));
      const facilitiesPayload = record.facilities.map((f) => ({
        id: f.id,
        kondisi: facilityValues[f.id]?.kondisi || null,
        keterangan: facilityValues[f.id]?.keterangan || null,
      }));

      const isValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeFilled.trim());

      const updated = await tfpAobLt12Service.updateRecord(record.id, {
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

  // ─── Structure save (batch) ────────────────────────────────────────────

  const isStructureDirty = draftConfig !== null || Object.keys(draftItemMeta).length > 0;

  const handleSaveStructure = async () => {
    if (!record || !isStructureDirty) return;
    setIsSavingStructure(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const config = draftConfig ?? record.columns_config;
      const itemPatches = record.items.map((it) => {
        const draft = draftItemMeta[it.id];
        return {
          id: it.id,
          is_disabled_map: draft?.is_disabled_map ?? it.is_disabled_map ?? {},
          merge_map: draft?.merge_map ?? it.merge_map ?? {},
        };
      });
      const updated = await tfpAobLt12Service.saveStructure(record.id, {
        columns_config: config,
        items: itemPatches,
      });
      hydrate(updated);
      setSuccessMessage('Struktur tabel berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan struktur.');
      } else {
        setErrorMessage('Gagal menyimpan struktur. Coba lagi.');
      }
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleResetStructure = () => {
    setDraftConfig(null);
    setDraftItemMeta({});
  };

  // ─── Edit Mode actions ─────────────────────────────────────────────────

  const toggleCellDisabled = (itemId: number, cellKey: string) => {
    mutateItemMeta(itemId, (m) => {
      if (m.is_disabled_map[cellKey]) {
        delete m.is_disabled_map[cellKey];
      } else {
        m.is_disabled_map[cellKey] = true;
        delete m.merge_map[cellKey];
      }
    });
  };

  const mergeCellRight = (itemId: number, cellKey: string) => {
    const idx = flatKeys.indexOf(cellKey);
    if (idx < 0) return;

    const draft = draftItemMeta[itemId] ?? {
      is_disabled_map: { ...(record?.items.find((x) => x.id === itemId)?.is_disabled_map ?? {}) },
      merge_map: { ...(record?.items.find((x) => x.id === itemId)?.merge_map ?? {}) },
    };
    const currentSpan = draft.merge_map[cellKey] ?? 1;
    const nextIdx = idx + currentSpan;
    if (nextIdx >= flatKeys.length) return;

    const nextKey = flatKeys[nextIdx];
    if (draft.is_disabled_map[nextKey]) return;
    if (draft.merge_map[nextKey]) return;

    mutateItemMeta(itemId, (m) => { m.merge_map[cellKey] = currentSpan + 1; });
  };

  const unmergeCell = (itemId: number, cellKey: string) => {
    mutateItemMeta(itemId, (m) => { delete m.merge_map[cellKey]; });
  };

  const mutateConfig = (fn: (cfg: TfpAobLt12ColumnsConfig) => TfpAobLt12ColumnsConfig) => {
    setDraftConfig((prev) => {
      const base = prev ?? (record?.columns_config ?? []);
      return fn(JSON.parse(JSON.stringify(base)));
    });
  };

  const handleRenamePanel = (panelId: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    mutateConfig((cfg) => cfg.map((p) => p.id === panelId ? { ...p, label: newLabel.trim() } : p));
  };

  const handleDeletePanel = (panelId: string) => {
    if (!window.confirm('Hapus panel ini dan semua sub-kolomnya? Nilai yang sudah diisi pada panel ini akan ikut hilang setelah Simpan Struktur.')) return;
    mutateConfig((cfg) => cfg.filter((p) => p.id !== panelId));
  };

  const handleAddSubColumn = (panelId: string) => {
    const label = window.prompt('Nama sub-kolom baru:');
    if (!label || !label.trim()) return;
    mutateConfig((cfg) => cfg.map((p) => {
      if (p.id !== panelId) return p;
      const seen = new Set(p.sub_columns.map((s) => s.key));
      let k = slugify(label) || 'col';
      const base = k; let n = 1;
      while (seen.has(k)) { k = `${base}_${++n}`; }
      return { ...p, sub_columns: [...p.sub_columns, { key: k, label: label.trim() }] };
    }));
  };

  const handleRenameSubColumn = (panelId: string, subKey: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    mutateConfig((cfg) => cfg.map((p) => {
      if (p.id !== panelId) return p;
      return { ...p, sub_columns: p.sub_columns.map((s) => s.key === subKey ? { ...s, label: newLabel.trim() } : s) };
    }));
  };

  const handleAddPanel = (panel: TfpAobLt12Panel) => {
    mutateConfig((cfg) => [...cfg, panel]);
  };

  // ─── Existing structure ops ────────────────────────────────────────────

  const withStructureError = async (fn: () => Promise<TfpAobLt12RecordDetail>) => {
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
    withStructureError(() => tfpAobLt12Service.addParameter(record!.id, data));

  const handleUpdateParameter = (paramId: number, patch: { parameter_number?: string | null; parameter_name?: string; unit?: string | null }) =>
    withStructureError(() => tfpAobLt12Service.updateParameter(record!.id, paramId, patch));

  const handleDeleteParameter = (paramId: number, name: string) => {
    if (!window.confirm(`Hapus parameter "${name}"? Data nilai yang sudah diisi akan ikut hilang.`)) return;
    void withStructureError(() => tfpAobLt12Service.deleteParameter(record!.id, paramId));
  };

  const handleMoveParameter = (idx: number, dir: -1 | 1) => {
    if (!record) return;
    const ids = record.items.map((it) => it.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    void withStructureError(() => tfpAobLt12Service.reorderParameters(record.id, ids));
  };

  const handleAddFacility = (name: string) =>
    withStructureError(() => tfpAobLt12Service.addFacility(record!.id, { facility_name: name }));

  const handleUpdateFacility = (facilityId: number, name: string) =>
    withStructureError(() => tfpAobLt12Service.updateFacility(record!.id, facilityId, { facility_name: name }));

  const handleDeleteFacility = (facilityId: number, name: string) => {
    if (!window.confirm(`Hapus fasilitas "${name}"?`)) return;
    void withStructureError(() => tfpAobLt12Service.deleteFacility(record!.id, facilityId));
  };

  const handleMoveFacility = (idx: number, dir: -1 | 1) => {
    if (!record) return;
    const ids = record.facilities.map((f) => f.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    void withStructureError(() => tfpAobLt12Service.reorderFacilities(record.id, ids));
  };

  const setItemCell = (itemId: number, cellKey: string, val: string) => {
    setItemValues((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [cellKey]: val } }));
  };

  const setFacilityField = (facilityId: number, field: 'kondisi' | 'keterangan', val: string) => {
    setFacilityValues((prev) => ({ ...prev, [facilityId]: { ...prev[facilityId], [field]: val } }));
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
        <Button onClick={() => navigate('/tfp/aob-lt12')} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';
  const showStructureControls = editMode && canEditStructure && !isCompleted;

  const totalCellCount = flatCells.length;
  const aksiColWidth = showStructureControls ? 132 : 0;

  return (
    <div className="max-w-full space-y-6 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/tfp')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">TFP</button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/tfp/aob-lt12')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">Performance Check AOB Lantai 1 &amp; 2</button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tfp/aob-lt12')} className="hover:bg-slate-100 mt-0.5">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Performance Check AOB Lantai 1 &amp; 2</h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                TFP — Cabang Surabaya &nbsp;·&nbsp;<span className="font-mono">{record.form_number}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-medium">{record.day_name ?? ''}</span>
              <span>{record.date}</span>
            </div>

            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <Clock size={13} className="text-slate-400" />
                <span>{record.time_filled ?? '—'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg" title="Klik untuk ubah jam pengisian (HH:MM)">
                <Clock size={13} className="text-slate-400" />
                <input type="time" value={timeFilled} onChange={(e) => setTimeFilled(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none w-[68px]" />
                <button type="button"
                  onClick={() => setTimeFilled(new Date().toTimeString().slice(0, 5))}
                  title="Reset ke waktu sekarang"
                  className="text-[10px] text-slate-400 hover:text-sky-600 transition-colors">
                  Now
                </button>
              </div>
            )}

            <ShiftBadge shift={record.shift_type} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi TFP</span>
            </div>

            {canEditStructure && !isCompleted && (
              <button type="button"
                onClick={() => {
                  setEditMode((v) => !v);
                  setEditingParamId(null);
                  setEditingFacilityId(null);
                  if (editMode) handleResetStructure();
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                  editMode
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
                )}
                title="Edit Mode: ubah struktur tabel seperti Excel">
                <Settings2 size={14} />
                {editMode ? 'Selesai Edit' : 'Edit Mode'}
              </button>
            )}

            <Button variant="ghost" size="sm"
              onClick={() => navigate(`/tfp/aob-lt12/${record.id}/print`)}
              className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
              <Printer size={15} />
              Print
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Manager Teknik</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.manager?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Supervisor TFP</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Pelaksana Teknisi TFP</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.technicians.map((t) => t.technician_name).join(', ') || <span className="text-slate-400 italic">—</span>}
            </p>
          </div>
        </div>

        {showStructureControls && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 flex-wrap">
            <Settings2 size={13} className="text-amber-600 shrink-0" />
            <span className="flex-1 min-w-[200px]">
              <strong>Edit Mode aktif (mirip Excel).</strong> Klik cell untuk disable/enable, tombol <MoveHorizontal size={11} className="inline" /> untuk merge ke kanan, atau klik header panel untuk rename / tambah sub-kolom.
            </span>
            {isStructureDirty && (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={handleResetStructure} disabled={isSavingStructure}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  <Eraser size={11} /> Batal
                </button>
                <button type="button" onClick={handleSaveStructure} disabled={isSavingStructure}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                  <Save size={11} /> {isSavingStructure ? 'Menyimpan…' : 'Simpan Struktur'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Parameter Pengukuran */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <Zap size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">Parameter Pengukuran</h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {record.items.length} parameter · {effectiveConfig.length} panel
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: Math.max(800, 220 + totalCellCount * 90 + aksiColWidth) }}>
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th rowSpan={hasMultiSubCols ? 2 : 1} className="px-2 py-2 text-center font-semibold border-b border-slate-200 align-middle text-[10px] uppercase tracking-wider w-[40px]">No</th>
                  <th rowSpan={hasMultiSubCols ? 2 : 1} className="px-3 py-2 text-left font-semibold border-b border-slate-200 align-middle text-[10px] uppercase tracking-wider w-[180px]">Parameter</th>
                  {effectiveConfig.map((panel) => (
                    showStructureControls ? (
                      <PanelHeaderEdit key={panel.id} panel={panel}
                        onRename={(lbl) => handleRenamePanel(panel.id, lbl)}
                        onDelete={() => handleDeletePanel(panel.id)}
                        onAddSub={() => handleAddSubColumn(panel.id)}
                        canDeletePanel={effectiveConfig.length > 1} />
                    ) : (
                      <th key={panel.id} colSpan={panel.sub_columns.length}
                        className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 text-[10px] uppercase tracking-wider">
                        {panel.label}
                      </th>
                    )
                  ))}
                  {showStructureControls && (
                    <th rowSpan={hasMultiSubCols ? 2 : 1} className="px-2 py-2 text-center font-semibold border-b border-l border-slate-200 align-middle text-[10px] uppercase tracking-wider" style={{ width: aksiColWidth }}>Aksi</th>
                  )}
                </tr>
                {hasMultiSubCols && (
                  <tr className="bg-slate-50 text-slate-500">
                    {effectiveConfig.flatMap((panel) =>
                      panel.sub_columns.map((sub, si) => (
                        <th key={cellKeyOf(panel.id, sub.key)}
                          className={cn(
                            'px-1 py-1.5 text-center font-medium border-b border-slate-200 text-[10px] uppercase tracking-wider',
                            si === 0 ? 'border-l' : '',
                          )}>
                          {showStructureControls && panel.sub_columns.length > 1 ? (
                            <SubColumnHeader label={sub.label}
                              onRename={(lbl) => handleRenameSubColumn(panel.id, sub.key, lbl)}
                              onDelete={() => {
                                if (!window.confirm(`Hapus sub-kolom "${sub.label}"?`)) return;
                                mutateConfig((cfg) => cfg.map((p) => p.id === panel.id
                                  ? { ...p, sub_columns: p.sub_columns.filter((s) => s.key !== sub.key) }
                                  : p));
                              }} />
                          ) : sub.label}
                        </th>
                      ))
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {record.items.map((item, idx) => {
                  const rowBase = 'bg-white hover:bg-slate-50/60 transition-colors';
                  const isFirstRow = idx === 0;
                  const isLastRow = idx === record.items.length - 1;

                  const tdNo = 'px-2 py-2 text-slate-500 font-mono text-center text-[11px] border-b border-slate-100 align-middle';
                  const tdName = 'px-3 py-2 font-medium text-slate-700 text-xs border-b border-slate-100 align-middle';
                  const tdCell = 'px-1.5 py-1.5 border-b border-l border-slate-100 align-middle';

                  const editRow = editingParamId === item.id ? (
                    <tr key={`${item.id}-edit`}>
                      <td colSpan={2 + totalCellCount + (showStructureControls ? 1 : 0)} className="p-0">
                        <ParamEditForm item={item}
                          onSave={async (patch) => { await handleUpdateParameter(item.id, patch); setEditingParamId(null); }}
                          onCancel={() => setEditingParamId(null)} />
                      </td>
                    </tr>
                  ) : null;

                  const actionCell = showStructureControls ? (
                    <td className="px-1.5 py-1.5 border-b border-l border-slate-100">
                      <div className="flex items-center justify-center gap-0.5">
                        <RowActionBtn title="Pindah atas" disabled={isFirstRow} onClick={() => handleMoveParameter(idx, -1)}><ChevronUp size={14} /></RowActionBtn>
                        <RowActionBtn title="Pindah bawah" disabled={isLastRow} onClick={() => handleMoveParameter(idx, 1)}><ChevronDown size={14} /></RowActionBtn>
                        <RowActionBtn title="Rename" onClick={() => setEditingParamId(editingParamId === item.id ? null : item.id)}><Pencil size={12} /></RowActionBtn>
                        <RowActionBtn title="Hapus" variant="danger" onClick={() => handleDeleteParameter(item.id, item.parameter_name)}><Trash2 size={12} /></RowActionBtn>
                      </div>
                    </td>
                  ) : null;

                  const skipKeys = new Set<string>();
                  const renderedCells: React.ReactNode[] = [];
                  const modeRow = isModeRow(item);
                  const suplaiRow = isSuplaiRow(item);

                  flatCells.forEach((cell) => {
                    if (skipKeys.has(cell.key)) return;

                    const colspan = getItemMerge(item.id, cell.key);
                    const disabled = getItemDisabled(item.id, cell.key);

                    for (let k = 1; k < colspan; k++) {
                      const nxt = flatCells[cell.index + k];
                      if (nxt) skipKeys.add(nxt.key);
                    }

                    if (showStructureControls) {
                      renderedCells.push(
                        <td key={cell.key} colSpan={colspan} className={tdCell}>
                          <div className="flex items-center gap-0.5 justify-center">
                            <EditCell isDisabled={disabled} isSelected={false} colspan={colspan}
                              onClick={() => toggleCellDisabled(item.id, cell.key)} />
                            {!disabled && (
                              <div className="flex gap-0.5">
                                <button type="button" title="Merge dengan cell di kanan"
                                  onClick={() => mergeCellRight(item.id, cell.key)}
                                  className="h-5 w-5 rounded text-slate-500 hover:bg-amber-100 hover:text-amber-700 inline-flex items-center justify-center">
                                  <MoveHorizontal size={10} />
                                </button>
                                {colspan > 1 && (
                                  <button type="button" title="Pisah cell (unmerge)"
                                    onClick={() => unmergeCell(item.id, cell.key)}
                                    className="h-5 w-5 rounded text-slate-500 hover:bg-sky-100 hover:text-sky-700 inline-flex items-center justify-center">
                                    <ColumnsIcon size={10} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                      return;
                    }

                    const val = itemValues[item.id]?.[cell.key] ?? '';

                    if ((modeRow || suplaiRow) && !disabled) {
                      let options: readonly string[];
                      const variant: 'mode' | 'suplai' = modeRow ? 'mode' : 'suplai';
                      if (modeRow) options = ['Auto', 'Manual'];
                      else options = ['PLN', 'UPS'];

                      renderedCells.push(
                        <td key={cell.key} colSpan={colspan} className={cn(tdCell, 'text-center', disabled && 'bg-slate-100')}>
                          {isCompleted ? (
                            <span className="text-xs text-slate-700 font-semibold">{val || '—'}</span>
                          ) : (
                            <ToggleButtonGroup options={options} value={val} variant={variant}
                              onChange={(v) => setItemCell(item.id, cell.key, v)} />
                          )}
                        </td>
                      );
                      return;
                    }

                    renderedCells.push(
                      <td key={cell.key} colSpan={colspan} className={cn(tdCell, disabled && 'bg-slate-100')}>
                        <CellInput isDisabled={disabled} isCompleted={isCompleted}
                          value={val} onChange={(v) => setItemCell(item.id, cell.key, v)} />
                      </td>
                    );
                  });

                  return (
                    <React.Fragment key={item.id}>
                      <tr className={rowBase}>
                        <td className={tdNo}>{idx + 1}</td>
                        <td className={tdName}>
                          {item.parameter_name}
                          {item.unit && <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>}
                        </td>
                        {renderedCells}
                        {actionCell}
                      </tr>
                      {editRow}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showStructureControls && (
            <>
              <div className="border-t border-slate-200">
                <AddParameterForm onSave={handleAddParameter} />
              </div>
              <div className="border-t border-slate-200 px-3 py-2 flex items-center justify-between bg-sky-50/40">
                <span className="text-[11px] text-sky-700 font-medium flex items-center gap-1.5">
                  <Columns size={12} /> Butuh panel baru? Tambahkan unit panel di sini.
                </span>
                <button type="button" onClick={() => setShowAddPanel(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 text-white hover:bg-sky-700">
                  <Plus size={13} /> Tambah Panel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Kondisi Fasilitas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <CheckSquare size={16} className="text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800">Kondisi Fasilitas</h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {record.facilities.length} fasilitas
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            <div className={cn(
              'grid gap-2 px-4 py-2 bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase tracking-wider items-center border-b border-slate-200',
              showStructureControls ? 'grid-cols-[1fr_90px_1fr_88px]' : 'grid-cols-[1fr_90px_1fr]',
            )}>
              <span>Nama Fasilitas</span>
              <span className="text-center">Kondisi</span>
              <span>Keterangan</span>
              {showStructureControls && <span className="text-center">Aksi</span>}
            </div>

            {record.facilities.map((facility, idx) => (
              <FacilityRow key={facility.id} facility={facility} idx={idx}
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
                onCancelEdit={() => { setEditingFacilityId(null); setEditingFacilityName(''); }}
                onChangeEditingName={setEditingFacilityName}
                onSaveEdit={async () => {
                  if (!editingFacilityName.trim()) return;
                  await handleUpdateFacility(facility.id, editingFacilityName.trim());
                  setEditingFacilityId(null);
                  setEditingFacilityName('');
                }}
                onMove={(dir) => handleMoveFacility(idx, dir)}
                onDelete={() => handleDeleteFacility(facility.id, facility.facility_name)} />
            ))}
          </div>

          {showStructureControls && (
            <div className="border-t border-slate-200">
              <AddFacilityForm onSave={handleAddFacility} />
            </div>
          )}
        </div>

      </div>

      {!isCompleted && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button onClick={handleSave} isLoading={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-100">
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      )}

      <TfpAobLt12SignaturePanel record={record} onUpdated={hydrate} />

      <AddPanelModal open={showAddPanel} onClose={() => setShowAddPanel(false)}
        onAdd={handleAddPanel} existingIds={effectiveConfig.map((p) => p.id)} />
    </div>
  );
};

// ─── FacilityRow ─────────────────────────────────────────────────────────

interface FacilityRowProps {
  facility: TfpAobLt12Facility;
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
    <div className={cn(
      'gap-2 px-4 py-2 items-center grid bg-white hover:bg-slate-50/60 transition-colors',
      showStructureControls ? 'grid-cols-[1fr_90px_1fr_88px]' : 'grid-cols-[1fr_90px_1fr]',
    )}>
      {isEditingStructure ? (
        <input autoFocus type="text" value={editingName}
          onChange={(e) => onChangeEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="h-8 px-2 text-xs rounded border border-amber-400 bg-amber-50 focus:ring-1 focus:ring-amber-400 focus:outline-none" />
      ) : (
        <span className="text-xs font-medium text-slate-700">{facility.facility_name}</span>
      )}

      {isCompleted ? (
        <span className={cn('text-xs font-semibold text-center', kondisi === 'Baik' ? 'text-emerald-700' : kondisi === 'Rusak' ? 'text-red-700' : 'text-slate-500')}>
          {kondisi || '—'}
        </span>
      ) : (
        <select value={kondisi} onChange={(e) => onKondisiChange(e.target.value)}
          className={cn('w-full h-8 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-semibold', palette)}>
          <option value="">—</option>
          {KONDISI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}

      {isCompleted ? (
        <span className="text-xs text-slate-600">{keterangan || '—'}</span>
      ) : (
        <input type="text" value={keterangan}
          onChange={(e) => onKeteranganChange(e.target.value)}
          placeholder="Keterangan..."
          className="h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none w-full" />
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
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
        placeholder="Nama fasilitas baru"
        className="flex-1 h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-400 focus:outline-none" />
      <button type="button" disabled={busy || !name.trim()} onClick={() => void submit()}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
        <Plus size={13} /> Tambah
      </button>
    </div>
  );
};
