import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Headphones as VccsFreqIcon,
  MapPin,
  Printer,
  Save,
  Users,
  X as XIcon,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { cnsdVccsFreqMeterService } from '@/services/cnsdVccsFreqMeterService';
import { CnsdVccsFreqMeterSignaturePanel } from './components/CnsdVccsFreqMeterSignaturePanel';
import type {
  CnsdVccsFreqInputsLayout,
  CnsdVccsFreqMeterItem,
  CnsdVccsFreqMeterRecordDetail,
  CnsdVccsFreqMeterSectionMeta,
} from '@/types/cnsdVccsFreq';

// ─── Constants ────────────────────────────────────────────────

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

/**
 * Parse the nominal text from the paper form and decide what input shape to
 * render for the FRONT PANEL adaptive cell.
 *
 *   "Normal / Alrm"  → toggle 'NORMAL' / 'ALARM'
 *   "√ / -" variants → toggle '√' / '-'
 *   numeric / other  → free-text input
 */
type AdaptiveShape = { kind: 'toggle'; options: [string, string] } | { kind: 'text' };
const parseAdaptiveShape = (nominal: string | null): AdaptiveShape => {
  if (!nominal) return { kind: 'text' };
  const u = nominal.trim().toUpperCase().replace(/\s+/g, ' ');
  if (u === 'NORMAL / ALRM' || u === 'NORMAL/ALRM' || u === 'NORMAL / ALARM' || u === 'NORMAL/ALARM') {
    return { kind: 'toggle', options: ['NORMAL', 'ALARM'] };
  }
  if (u === '√ / -' || u === '√/-' || u === '√ /-' || u === '√/ -') {
    return { kind: 'toggle', options: ['√', '-'] };
  }
  return { kind: 'text' };
};

// ─── Main component ───────────────────────────────────────────

/**
 * CNSD VCCS Frequentis Meter Reading — detail / edit page.
 *
 * Layouts handled per-section:
 *   1. single_adaptive → FRONT PANEL (1 cell "Redundant Server", adapts per nominal)
 *   2. dual_toggle_nf  → MSC & RCMS / CWP, two √/- toggles labeled Normal | Fault
 *   3. environment     → LINGKUNGAN KERJA (single result column)
 *
 * UI mirrors VCCS LES (CNSD-014) detail page convention.
 */
export const CnsdVccsFreqMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdVccsFreqMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdVccsFreqMeterItem>>>({});
  const [activeSectionCode, setActiveSectionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [merk, setMerk] = useState('');
  const [type, setType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const canEditMetadata =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD';

  // ─── Fetch ──────────────────────────────────────────────────
  const fetchRecord = useCallback(async () => {
    if (!recordId || Number.isNaN(recordId)) {
      setErrorMessage('ID form tidak valid.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cnsdVccsFreqMeterService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
      setMerk(data.merk ?? '');
      setType(data.type ?? '');
      setSerialNumber(data.serial_number ?? '');
      if (data.sections_meta.length > 0) {
        const stillExists = activeSectionCode && data.sections_meta.some((s) => s.code === activeSectionCode);
        if (!stillExists) {
          setActiveSectionCode(data.sections_meta[0].code);
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

  // ─── Derived ────────────────────────────────────────────────
  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdVccsFreqMeterItem[]> = {};
    if (!record) return map;
    record.items.forEach((it) => {
      const code = it.section_code ?? '1';
      if (!map[code]) map[code] = [];
      map[code].push(it);
    });
    return map;
  }, [record]);

  const isCompleted = record?.status === 'completed';
  const isReadOnly = isCompleted;
  const metadataDirty =
    !!record &&
    (merk !== (record.merk ?? '') ||
      type !== (record.type ?? '') ||
      serialNumber !== (record.serial_number ?? ''));
  const hasChanges = Object.keys(editedItems).length > 0 || metadataDirty;

  const updateField = (itemId: number, field: keyof CnsdVccsFreqMeterItem, value: string | null) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? {}),
        [field]: value === '' ? null : value,
      },
    }));
  };

  const getValue = (item: CnsdVccsFreqMeterItem, field: keyof CnsdVccsFreqMeterItem): string => {
    const edited = editedItems[item.id];
    if (edited && field in edited) {
      const v = edited[field];
      return v == null ? '' : String(v);
    }
    const original = item[field];
    return original == null ? '' : String(original);
  };

  // ─── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!record || !hasChanges) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const items = Object.entries(editedItems).map(([rawId, patch]) => ({
      id: Number(rawId),
      hasil_a:     'hasil_a'    in patch ? patch.hasil_a    ?? null : undefined,
      hasil_b:     'hasil_b'    in patch ? patch.hasil_b    ?? null : undefined,
      hasil:       'hasil'      in patch ? patch.hasil      ?? null : undefined,
      keterangan:  'keterangan' in patch ? patch.keterangan ?? null : undefined,
    }));

    try {
      const updated = await cnsdVccsFreqMeterService.updateRecord(record.id, {
        merk: metadataDirty ? merk || null : undefined,
        type: metadataDirty ? type || null : undefined,
        serial_number: metadataDirty ? serialNumber || null : undefined,
        items: items.length > 0 ? items : undefined,
      });
      setRecord(updated);
      setEditedItems({});
      const parts: string[] = [];
      if (items.length > 0) parts.push(`${items.length} item`);
      if (metadataDirty) parts.push('metadata peralatan');
      setSuccessMessage(`${parts.join(' + ')} disimpan.`);
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

  // ─── Render ─────────────────────────────────────────────────
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
        <Button variant="outline" onClick={() => navigate('/cnsd/vccs-freq-meter')} className="gap-2">
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const activeSectionMeta = activeSectionCode
    ? record.sections_meta.find((s) => s.code === activeSectionCode) ?? null
    : null;

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/cnsd')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> CNSD
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/cnsd/vccs-freq-meter')} className="hover:text-slate-700 transition-colors">
          VCCS (Frequentis) Meter Reading
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <VccsFreqIcon size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Meter Reading — VCCS (Frequentis)</h1>
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/vccs-freq-meter/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Informasi Peralatan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <InfoCell label="Lokasi" value={record.location} />
          <InfoCell label="Fasilitas" value={record.facility} />
          <InfoCell label="Shift" value={SHIFT_TIME_LABELS[record.shift_type] ?? null} />
          <InfoCell label="Tanggal" value={record.date} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
          <EditableMetaField label="Merk" value={merk} onChange={setMerk} disabled={isReadOnly || !canEditMetadata} placeholder="FREQUENTIS" />
          <EditableMetaField label="Type" value={type} onChange={setType} disabled={isReadOnly || !canEditMetadata} placeholder="—" />
          <EditableMetaField label="Serial Number" value={serialNumber} onChange={setSerialNumber} disabled={isReadOnly || !canEditMetadata} placeholder="—" />
        </div>
        {!canEditMetadata && !isReadOnly && (
          <p className="text-[10px] text-slate-400 italic">
            Hanya Manager Teknik / Supervisor CNSD yang dapat mengubah identifikasi peralatan.
          </p>
        )}
      </div>

      {/* Tabs */}
      {record.sections_meta.length > 0 && (
        <Tabs
          items={record.sections_meta.map((s) => ({ key: s.code, label: `${s.code}. ${s.name}` }))}
          defaultKey={activeSectionCode ?? record.sections_meta[0]?.code}
          onChange={setActiveSectionCode}
        />
      )}

      {/* Section content */}
      {activeSectionMeta && (
        <VccsFreqSectionPanel
          sectionMeta={activeSectionMeta}
          items={itemsBySection[activeSectionMeta.code] ?? []}
          isReadOnly={isReadOnly}
          getValue={getValue}
          onChange={updateField}
        />
      )}

      {/* Pending-changes indicator */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 font-medium">
              {Object.keys(editedItems).length > 0 && `${Object.keys(editedItems).length} item`}
              {Object.keys(editedItems).length > 0 && metadataDirty && ' + '}
              {metadataDirty && 'metadata'}
              {' belum disimpan'}
            </span>
          )}
          <Button onClick={() => void handleSave()} disabled={!hasChanges} isLoading={isSaving} className="gap-2">
            <Save size={16} /> Simpan Perubahan
          </Button>
        </div>
      )}

      <CnsdVccsFreqMeterSignaturePanel record={record} onSignSuccess={() => void fetchRecord()} />
    </div>
  );
};

// ─── Section panel ────────────────────────────────────────────

interface VccsFreqSectionPanelProps {
  sectionMeta: CnsdVccsFreqMeterSectionMeta;
  items: CnsdVccsFreqMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdVccsFreqMeterItem, field: keyof CnsdVccsFreqMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdVccsFreqMeterItem, value: string | null) => void;
}

const VccsFreqSectionPanel: React.FC<VccsFreqSectionPanelProps> = ({
  sectionMeta, items, isReadOnly, getValue, onChange,
}) => {
  const layout: CnsdVccsFreqInputsLayout = sectionMeta.inputs_layout;
  const isSingleAdaptive = layout === 'single_adaptive';
  const isDualToggleNf   = layout === 'dual_toggle_nf';
  const isEnv            = layout === 'environment';

  const description = (() => {
    switch (layout) {
      case 'single_adaptive': return 'Isi Redundant Server — toggle untuk Normal/Alarm dan √/-, input bebas untuk angka tegangan.';
      case 'dual_toggle_nf':  return 'Pilih centang (√) pada kolom Normal jika berfungsi normal, atau pada kolom Fault jika ada gangguan.';
      case 'environment':     return 'Isi kolom Hasil Pemeriksaan untuk tiap kegiatan lingkungan kerja.';
      default:                return '';
    }
  })();

  const groupedItems = useMemo(() => {
    const groups: { name: string | null; items: CnsdVccsFreqMeterItem[] }[] = [];
    let current: { name: string | null; items: CnsdVccsFreqMeterItem[] } | null = null;
    for (const it of items) {
      const gName = it.group_name ?? null;
      if (!current || current.name !== gName) {
        current = { name: gName, items: [] };
        groups.push(current);
      }
      current.items.push(it);
    }
    return groups;
  }, [items]);
  const hasMultipleGroups = groupedItems.length > 1;

  // Column count: single_adaptive = 5 (No, PEMBACAAN, Nominal, Hasil, Keterangan)
  //               dual_toggle_nf  = 6 (No, PEMBACAAN, Content, Normal, Fault, Keterangan)
  //               environment     = 5 (No, Kegiatan, Nominal, Hasil, Keterangan)
  const colCount = isDualToggleNf ? 6 : 5;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {sectionMeta.code}. {sectionMeta.name}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-medium text-slate-400">{items.length} item</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-16 text-[11px] uppercase tracking-wider">No</th>
              <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 min-w-[200px] text-[11px] uppercase tracking-wider">
                {isEnv ? 'Kegiatan' : 'Pembacaan Meter Reading'}
              </th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">
                {isEnv ? 'Nominal' : (isSingleAdaptive ? 'Standart' : (sectionMeta.code === '3' ? 'Name' : 'Indicator'))}
              </th>
              {isSingleAdaptive ? (
                <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[180px] text-[11px] uppercase tracking-wider">
                  {sectionMeta.columns_label_1 ?? 'Redundant Server'}
                </th>
              ) : isDualToggleNf ? (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">
                    {sectionMeta.columns_label_1 ?? 'Normal'}
                  </th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">
                    {sectionMeta.columns_label_2 ?? 'Fault'}
                  </th>
                </>
              ) : (
                <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">
                  {sectionMeta.columns_label_1 ?? 'Hasil Pemeriksaan'}
                </th>
              )}
              <th className="px-2 py-2 text-left font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Belum ada baris pada section ini.
                </td>
              </tr>
            ) : (
              groupedItems.map((group) => (
                <React.Fragment key={group.name ?? '__nogroup__'}>
                  {hasMultipleGroups && group.name && (
                    <tr className="bg-slate-100/80">
                      <td colSpan={colCount} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {group.name}
                      </td>
                    </tr>
                  )}
                  {group.items.map((item) => (
                    <VccsFreqItemRow
                      key={item.id}
                      item={item}
                      layout={layout}
                      isReadOnly={isReadOnly}
                      getValue={getValue}
                      onChange={onChange}
                    />
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Item row ─────────────────────────────────────────────────

interface VccsFreqItemRowProps {
  item: CnsdVccsFreqMeterItem;
  layout: CnsdVccsFreqInputsLayout;
  isReadOnly: boolean;
  getValue: (item: CnsdVccsFreqMeterItem, field: keyof CnsdVccsFreqMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdVccsFreqMeterItem, value: string | null) => void;
}

const VccsFreqItemRow: React.FC<VccsFreqItemRowProps> = ({
  item, layout, isReadOnly, getValue, onChange,
}) => {
  const inputClass = 'w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500';
  const disabled = isReadOnly || item.is_blocked;

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px] align-middle">
        {item.item_number ?? ''}
      </td>
      <td className="px-3 py-2 align-middle text-slate-800 font-medium">
        {item.item_name}
      </td>
      <td className="px-2 py-2 align-middle text-center text-slate-600 text-[11px]">
        {item.nominal || '—'}
      </td>
      {layout === 'single_adaptive' ? (
        <td className="px-2 py-2 align-middle">
          <AdaptiveCell
            nominal={item.nominal}
            value={getValue(item, 'hasil_a')}
            onChange={(v) => onChange(item.id, 'hasil_a', v)}
            disabled={disabled}
            inputClass={inputClass}
          />
        </td>
      ) : layout === 'dual_toggle_nf' ? (
        <>
          <td className="px-2 py-2 align-middle">
            <CheckToggleCell
              variant="normal"
              checked={getValue(item, 'hasil_a') === '√'}
              onToggle={(checked) => onChange(item.id, 'hasil_a', checked ? '√' : null)}
              disabled={disabled}
            />
          </td>
          <td className="px-2 py-2 align-middle">
            <CheckToggleCell
              variant="fault"
              checked={getValue(item, 'hasil_b') === '√'}
              onToggle={(checked) => onChange(item.id, 'hasil_b', checked ? '√' : null)}
              disabled={disabled}
            />
          </td>
        </>
      ) : (
        // environment
        <td className="px-2 py-2 align-middle">
          <EnvironmentCell
            nominal={item.nominal}
            value={getValue(item, 'hasil')}
            onChange={(v) => onChange(item.id, 'hasil', v)}
            disabled={disabled}
            inputClass={inputClass}
          />
        </td>
      )}
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="Catatan"
          value={getValue(item, 'keterangan')}
          onChange={(e) => onChange(item.id, 'keterangan', e.target.value)}
          disabled={disabled}
        />
      </td>
    </tr>
  );
};

// ─── Adaptive cell (FRONT PANEL Redundant Server) ─────────────

interface AdaptiveCellProps {
  nominal: string | null;
  value: string;
  onChange: (v: string | null) => void;
  disabled: boolean;
  inputClass: string;
}

const AdaptiveCell: React.FC<AdaptiveCellProps> = ({ nominal, value, onChange, disabled, inputClass }) => {
  const shape = parseAdaptiveShape(nominal);

  if (shape.kind === 'toggle') {
    return <BinaryToggle options={shape.options} value={value} onChange={onChange} disabled={disabled} />;
  }

  return (
    <input
      type="text"
      className={cn(inputClass, 'text-center')}
      placeholder={nominal ?? '...'}
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    />
  );
};

interface BinaryToggleProps {
  options: [string, string];
  value: string;
  onChange: (v: string | null) => void;
  disabled: boolean;
}

const BinaryToggle: React.FC<BinaryToggleProps> = ({ options, value, onChange, disabled }) => {
  const [leftOpt, rightOpt] = options;
  const isLeft  = value === leftOpt;
  const isRight = value === rightOpt;

  const leftActive  = 'bg-emerald-600 text-white border-emerald-600';
  const rightActive = leftOpt === 'NORMAL' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-600 text-white border-slate-600';
  const idle = 'bg-white text-slate-600 border-slate-300 hover:border-slate-400';

  const click = (opt: string) => {
    if (disabled) return;
    onChange(value === opt ? null : opt);
  };

  return (
    <div className="inline-flex rounded-md overflow-hidden border border-slate-300 select-none w-full justify-center">
      <button
        type="button"
        className={cn('flex-1 px-2 py-1 text-[11px] font-semibold transition-colors border-r border-slate-300', isLeft ? leftActive : idle, disabled && 'opacity-50 cursor-not-allowed')}
        onClick={() => click(leftOpt)}
        disabled={disabled}
      >
        {leftOpt}
      </button>
      <button
        type="button"
        className={cn('flex-1 px-2 py-1 text-[11px] font-semibold transition-colors', isRight ? rightActive : idle, disabled && 'opacity-50 cursor-not-allowed')}
        onClick={() => click(rightOpt)}
        disabled={disabled}
      >
        {rightOpt}
      </button>
    </div>
  );
};

// ─── Single-check toggle cell (MSC & RCMS / CWP) ──────────────

interface CheckToggleCellProps {
  variant: 'normal' | 'fault';
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled: boolean;
}

const CheckToggleCell: React.FC<CheckToggleCellProps> = ({ variant, checked, onToggle, disabled }) => {
  const active = variant === 'normal'
    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
    : 'bg-red-100 border-red-400 text-red-700';
  const idle = 'bg-white border-slate-300 text-slate-300 hover:border-slate-400 hover:text-slate-500';

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      title={checked ? 'Klik lagi untuk hapus centang' : 'Klik untuk centang'}
      className={cn(
        'mx-auto flex h-8 w-12 items-center justify-center rounded-md border-2 transition-colors',
        checked ? active : idle,
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {checked ? <Check size={16} strokeWidth={3} /> : <XIcon size={14} className="opacity-40" />}
    </button>
  );
};

// ─── Environment cell ─────────────────────────────────────────

interface EnvironmentCellProps {
  nominal: string | null;
  value: string;
  onChange: (v: string | null) => void;
  disabled: boolean;
  inputClass: string;
}

const EnvironmentCell: React.FC<EnvironmentCellProps> = ({ nominal, value, onChange, disabled, inputClass }) => {
  const isCheckNominal = nominal && nominal.trim() === '√';

  if (isCheckNominal) {
    return (
      <CheckToggleCell
        variant="normal"
        checked={value === '√'}
        onToggle={(checked) => onChange(checked ? '√' : null)}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type="text"
      className={cn(inputClass, 'text-center')}
      placeholder={nominal ?? '...'}
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    />
  );
};

// ─── Small subcomponents ──────────────────────────────────────

const InfoCell: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div>
    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{label}</span>
    <p className="mt-0.5 font-medium text-slate-700">{value ?? '—'}</p>
  </div>
);

interface EditableMetaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const EditableMetaField: React.FC<EditableMetaFieldProps> = ({ label, value, onChange, disabled, placeholder }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
    {disabled ? (
      <p className="text-xs text-slate-700 font-medium">{value || '—'}</p>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none placeholder:text-slate-300"
        maxLength={60}
      />
    )}
  </div>
);
