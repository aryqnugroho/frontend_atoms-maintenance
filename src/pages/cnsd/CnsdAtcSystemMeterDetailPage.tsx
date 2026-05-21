import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MonitorCog,
  Printer,
  Save,
  Users,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { cnsdAtcSystemMeterService } from '@/services/cnsdAtcSystemMeterService';
import { CnsdAtcSystemMeterSignaturePanel } from './components/CnsdAtcSystemMeterSignaturePanel';
import type { ShiftType } from '@/types';
import type {
  CnsdAtcSystemMeterItem,
  CnsdAtcSystemMeterRecordDetail,
} from '@/types/cnsdAtcSystem';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const CPU_STATUS_FLAGS = ['C', 'M', 'F', 'O', 'A', 'N', 'L'] as const;

interface SectionMeta {
  code: string;
  name: string;
  inputs_layout: string;
  groups: Array<{ number: number | null; name: string | null }>;
}

/** Parse "OK / NO", "O / F / I" etc into option array. */
const parseToggleOptions = (nominal: string | null): string[] | null => {
  if (!nominal) return null;
  const trimmed = nominal.trim();
  if (!trimmed.includes('/')) return null;
  if (/^\d/.test(trimmed)) return null;        // skip numeric ranges
  if (trimmed.toLowerCase().startsWith('max')) return null;
  const parts = trimmed.split('/').map((p) => p.trim().replace(/^all\s+/i, '').toUpperCase()).filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return null;
  // de-duplicate while preserving order
  return Array.from(new Set(parts));
};

const isTimeNominal = (nominal: string | null): boolean =>
  !!nominal && nominal.trim().toLowerCase() === 'time';

const isNumericNominal = (nominal: string | null): boolean =>
  !!nominal && /^\d+(\.\d+)?$/.test(nominal.trim());

export const CnsdAtcSystemMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdAtcSystemMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdAtcSystemMeterItem>>>({});
  const [activeSectionCode, setActiveSectionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [merk, setMerk] = useState('');
  const [type, setType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const canEditMetadata =
    user?.role === 'Admin' || user?.role === 'Manager Teknik' || user?.role === 'Supervisor CNSD';

  const fetchRecord = useCallback(async () => {
    if (!recordId || Number.isNaN(recordId)) {
      setErrorMessage('ID form tidak valid.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cnsdAtcSystemMeterService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
      setMerk(data.merk ?? '');
      setType(data.type ?? '');
      setSerialNumber(data.serial_number ?? '');
      if (data.sections_meta.length > 0) {
        const stillExists = activeSectionCode && data.sections_meta.some((s) => s.code === activeSectionCode);
        if (!stillExists) setActiveSectionCode(data.sections_meta[0].code);
      }
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) setErrorMessage('Form tidak ditemukan.');
      else setErrorMessage('Gagal memuat data form.');
      setRecord(null);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  useEffect(() => { void fetchRecord(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recordId]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdAtcSystemMeterItem[]> = {};
    if (!record) return map;
    record.items.forEach((it) => {
      const code = it.section_code ?? 'A';
      if (!map[code]) map[code] = [];
      map[code].push(it);
    });
    return map;
  }, [record]);

  const isReadOnly = record?.status === 'completed';
  const metadataDirty = !!record && (
    merk !== (record.merk ?? '') ||
    type !== (record.type ?? '') ||
    serialNumber !== (record.serial_number ?? '')
  );
  const hasChanges = Object.keys(editedItems).length > 0 || metadataDirty;

  const updateField = (itemId: number, field: keyof CnsdAtcSystemMeterItem, value: string | null) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [field]: value === '' ? null : value },
    }));
  };

  const getValue = (item: CnsdAtcSystemMeterItem, field: keyof CnsdAtcSystemMeterItem): string => {
    const edited = editedItems[item.id];
    if (edited && field in edited) {
      const v = edited[field];
      return v == null ? '' : String(v);
    }
    const original = item[field];
    return original == null ? '' : String(original);
  };

  const handleSave = async () => {
    if (!record || !hasChanges) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const items = Object.entries(editedItems).map(([rawId, patch]) => ({
      id: Number(rawId),
      value_1:      'value_1'      in patch ? patch.value_1      ?? null : undefined,
      value_2:      'value_2'      in patch ? patch.value_2      ?? null : undefined,
      value_3:      'value_3'      in patch ? patch.value_3      ?? null : undefined,
      value_4:      'value_4'      in patch ? patch.value_4      ?? null : undefined,
      status_flags: 'status_flags' in patch ? patch.status_flags ?? null : undefined,
      keterangan:   'keterangan'   in patch ? patch.keterangan   ?? null : undefined,
    }));
    try {
      const updated = await cnsdAtcSystemMeterService.updateRecord(record.id, {
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
        <Button variant="outline" onClick={() => navigate('/cnsd/atc-system-meter')} className="gap-2">
          <ArrowLeft size={16} /> Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const activeSectionMeta = activeSectionCode ? record.sections_meta.find((s) => s.code === activeSectionCode) ?? null : null;

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-12">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/cnsd')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> CNSD
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/cnsd/atc-system-meter')} className="hover:text-slate-700 transition-colors">
          ATC SYSTEM Meter Reading
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <MonitorCog size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Meter Reading — ATC SYSTEM</h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CNSD &nbsp;·&nbsp;Approach System / Tern ATS System &nbsp;·&nbsp;<span className="font-mono">{record.form_number}</span>
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
            <ShiftBadge shift={record.shift_type as ShiftType} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <MapPin size={13} className="text-slate-400" />
              <span>{record.facility}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/atc-system-meter/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
              <Printer size={15} /> Print
            </Button>
            {!isReadOnly && (
              <Button size="sm" className="gap-1.5" onClick={() => void handleSave()} disabled={!hasChanges || isSaving} isLoading={isSaving}>
                <Save size={14} /> Simpan
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Manager Teknik</span>
            <p className="mt-0.5 font-medium text-slate-700">{record.manager?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Supervisor CNSD</span>
            <p className="mt-0.5 font-medium text-slate-700">{record.supervisor?.name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Teknisi CNSD</span>
            <p className="mt-0.5 font-medium text-slate-700 truncate" title={record.technicians.map((t) => t.technician_name).join(', ')}>
              {record.technicians.map((t) => t.technician_name).join(', ') || <span className="text-slate-400 italic">—</span>}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Informasi Peralatan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <InfoCell label="Lokasi" value={record.location} />
          <InfoCell label="Fasilitas" value={record.facility} />
          <InfoCell label="Shift" value={SHIFT_TIME_LABELS[record.shift_type] ?? null} />
          <InfoCell label="Tanggal" value={record.date} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
          <EditableMetaField label="Merk" value={merk} onChange={setMerk} disabled={!!isReadOnly || !canEditMetadata} placeholder="TERA" />
          <EditableMetaField label="Type" value={type} onChange={setType} disabled={!!isReadOnly || !canEditMetadata} placeholder="TAS" />
          <EditableMetaField label="Serial Number" value={serialNumber} onChange={setSerialNumber} disabled={!!isReadOnly || !canEditMetadata} placeholder="—" />
        </div>
        {!canEditMetadata && !isReadOnly && (
          <p className="text-[10px] text-slate-400 italic">
            Hanya Manager Teknik / Supervisor CNSD yang dapat mengubah identifikasi peralatan.
          </p>
        )}
      </div>

      {record.sections_meta.length > 0 && (
        <Tabs
          items={record.sections_meta.map((s) => ({ key: s.code, label: `${s.code}. ${s.name}` }))}
          defaultKey={activeSectionCode ?? record.sections_meta[0]?.code}
          onChange={setActiveSectionCode}
        />
      )}

      {activeSectionMeta && (
        <AtcSectionPanel
          sectionMeta={activeSectionMeta}
          items={itemsBySection[activeSectionMeta.code] ?? []}
          isReadOnly={!!isReadOnly}
          getValue={getValue}
          onChange={updateField}
        />
      )}

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

      <CnsdAtcSystemMeterSignaturePanel record={record} onSignSuccess={(r) => setRecord(r)} />
    </div>
  );
};

// ─── Reusable subcomponents ────────────────────────────────────────────────

interface InfoCellProps { label: string; value: string | null; }
const InfoCell: React.FC<InfoCellProps> = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
    <p className="mt-0.5 font-medium text-slate-800">{value ?? <span className="text-slate-400">—</span>}</p>
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
    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
    {disabled ? (
      <p className="font-medium text-slate-800">{value || <span className="text-slate-400">{placeholder ?? '—'}</span>}</p>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
      />
    )}
  </div>
);

// ─── Section panel + per-layout row renderer ────────────────────────────────

interface SectionPanelProps {
  sectionMeta: SectionMeta;
  items: CnsdAtcSystemMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdAtcSystemMeterItem, field: keyof CnsdAtcSystemMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdAtcSystemMeterItem, value: string | null) => void;
}

const AtcSectionPanel: React.FC<SectionPanelProps> = ({ sectionMeta, items, isReadOnly, getValue, onChange }) => {
  const layout = sectionMeta.inputs_layout;
  const visibleItems = items;        // headers are rendered inline (not skipped)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          {sectionMeta.code}. {sectionMeta.name}
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">{describeLayout(layout)}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>{renderHeader(layout)}</thead>
          <tbody>
            {visibleItems.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                rowNumber={visibleNumberFor(visibleItems, idx)}
                layout={layout}
                isReadOnly={isReadOnly}
                getValue={getValue}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {sectionMeta.code === 'K' && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 space-y-1">
          <p>* COUNT(*) 1 : Jumlah data yang terbaca</p>
          <p>* COUNT(*) 2 : Jumlah data yang terbaca sebelum di hapus</p>
        </div>
      )}
    </div>
  );
};

const describeLayout = (layout: string): string => {
  switch (layout) {
    case 'maintenance':     return 'Isi kolom READING sesuai NOMINAL. Toggle untuk OK/NO, time picker untuk Time.';
    case 'source_data':     return 'Pilih status LINE 1 dan LINE 2 (O = On, F = Off, I = Idle).';
    case 'cpu_status':      return 'Isi PROCESS RUNNING (angka) dan pilih CPU STATUS yang menyala.';
    case 'network_status':  return 'Pilih SWITCH STATUS (D/A/N) dan toggle ALL PORT OK?';
    case 'server_dual_ab':  return 'Isi reading untuk REC A dan REC B (toggle untuk OK/NO, time picker untuk Time).';
    case 'rbp_count':       return 'Isi 4 kolom COUNT(*) untuk RBP-A dan RBP-B.';
    case 'environment':     return 'Isi hasil pemeriksaan lingkungan kerja.';
    default:                return '';
  }
};

const renderHeader = (layout: string): React.ReactElement => {
  const th = (label: string, extra = '') =>
    <th className={cn('px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] bg-slate-100', extra)}>{label}</th>;
  switch (layout) {
    case 'maintenance':
      return (<tr>{th('NO', 'w-12 text-center')}{th('PEMERIKSAAN', 'min-w-[200px]')}{th('NOMINAL', 'w-32')}{th('READING', 'min-w-[180px]')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'source_data':
      return (<tr>{th('NO', 'w-12 text-center')}{th('ITEM', 'min-w-[160px]')}{th('LINE 1', 'w-28 text-center')}{th('LINE 2', 'w-28 text-center')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'cpu_status':
      return (<tr>{th('NO', 'w-12 text-center')}{th('ITEM', 'min-w-[160px]')}{th('NOMINAL', 'w-24 text-center')}{th('PROCESS RUNNING', 'w-32 text-center')}{th('CPU STATUS', 'min-w-[200px]')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'network_status':
      return (<tr>{th('NO', 'w-12 text-center')}{th('ITEM', 'min-w-[160px]')}{th('SWITCH STATUS', 'w-32 text-center')}{th('ALL PORT OK ?', 'w-32 text-center')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'server_dual_ab':
      return (<tr>{th('NO', 'w-12 text-center')}{th('PEMERIKSAAN', 'min-w-[220px]')}{th('NOMINAL', 'w-24 text-center')}{th('REC A', 'min-w-[140px]')}{th('REC B', 'min-w-[140px]')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'rbp_count':
      return (<tr>{th('NO', 'w-12 text-center')}{th('KEGIATAN', 'min-w-[200px]')}{th('RBP-A C(*) 1', 'w-24 text-center')}{th('RBP-A C(*) 2', 'w-24 text-center')}{th('RBP-B C(*) 1', 'w-24 text-center')}{th('RBP-B C(*) 2', 'w-24 text-center')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    case 'environment':
      return (<tr>{th('NO', 'w-12 text-center')}{th('KEGIATAN', 'min-w-[220px]')}{th('PARAMETER', 'w-32 text-center')}{th('HASIL', 'min-w-[180px]')}{th('KETERANGAN', 'min-w-[140px]')}</tr>);
    default:
      return (<tr>{th('NO')}{th('ITEM')}{th('NILAI')}{th('KETERANGAN')}</tr>);
  }
};

/** Re-compute visible (non-header) row numbers so headers don't consume numbers. */
const visibleNumberFor = (allItems: CnsdAtcSystemMeterItem[], idx: number): number => {
  let n = 0;
  for (let i = 0; i <= idx; i++) {
    if (!allItems[i].is_header) n++;
  }
  return n;
};

interface RowProps extends Omit<SectionPanelProps, 'sectionMeta' | 'items'> {
  item: CnsdAtcSystemMeterItem;
  rowNumber: number;
  layout: string;
}

const ItemRow: React.FC<RowProps> = ({ item, rowNumber, layout, isReadOnly, getValue, onChange }) => {
  if (item.is_header) {
    // Group header — render as gray spanning row.
    const colSpan = layoutColumnCount(layout);
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-1.5 bg-slate-200/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {item.item_name}
        </td>
      </tr>
    );
  }

  const td = (children: React.ReactNode, extra = '') =>
    <td className={cn('px-3 py-2 border-b border-slate-100 align-top', extra)}>{children}</td>;

  // Common cells
  const noCell = td(<span className="text-slate-500">{rowNumber}</span>, 'text-center font-mono text-[11px] text-slate-500');
  const nameCell = (
    <td className="px-3 py-2 border-b border-slate-100 align-top">
      {item.sub_item_label
        ? <span className="text-slate-700 pl-3">{item.sub_item_label}</span>
        : <span className="font-medium text-slate-800">{item.item_name}</span>}
    </td>
  );
  const nominalCell = td(<span className="font-mono text-[11px] text-slate-600 whitespace-pre">{item.nominal || '—'}</span>, 'text-center');
  const keteranganCell = td(
    <input type="text" value={getValue(item, 'keterangan')} onChange={(e) => onChange(item.id, 'keterangan', e.target.value)} disabled={isReadOnly}
      placeholder="—" className="w-full h-7 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
  );

  switch (layout) {
    // ─── A. MAINTENANCE — adaptive reading ──────────────────────────
    case 'maintenance':
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {nominalCell}
          {td(<AdaptiveReadingCell item={item} field="value_1" nominal={item.nominal} isReadOnly={isReadOnly} getValue={getValue} onChange={onChange} />)}
          {keteranganCell}
        </tr>
      );

    // ─── B. SOURCE DATA — LINE 1 + LINE 2 select ────────────────────
    case 'source_data': {
      const opts = parseToggleOptions(item.nominal) ?? ['O', 'F', 'I'];
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {td(<SelectToggle options={opts} value={getValue(item, 'value_1')} onChange={(v) => onChange(item.id, 'value_1', v)} disabled={isReadOnly} />, 'text-center')}
          {td(<SelectToggle options={opts} value={getValue(item, 'value_2')} onChange={(v) => onChange(item.id, 'value_2', v)} disabled={isReadOnly} />, 'text-center')}
          {keteranganCell}
        </tr>
      );
    }

    // ─── C/E/F/G/H/I — CPU STATUS ───────────────────────────────────
    case 'cpu_status':
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {nominalCell}
          {td(
            <input type="number" min="0" value={getValue(item, 'value_1')} onChange={(e) => onChange(item.id, 'value_1', e.target.value)} disabled={isReadOnly}
              className="w-20 h-7 px-2 rounded border border-slate-300 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />,
            'text-center'
          )}
          {td(<CpuStatusMultiSelect value={item.status_flags} editedValue={getValue(item, 'status_flags')} onChange={(v) => onChange(item.id, 'status_flags', v)} disabled={isReadOnly} />)}
          {keteranganCell}
        </tr>
      );

    // ─── D. NETWORK — Switch Status + All Port OK ───────────────────
    case 'network_status': {
      const switchOpts = ['D', 'A', 'N'];
      const portOpts = ['OK', 'NO'];
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {td(<SelectToggle options={switchOpts} value={getValue(item, 'value_1')} onChange={(v) => onChange(item.id, 'value_1', v)} disabled={isReadOnly} />, 'text-center')}
          {td(<SelectToggle options={portOpts} value={getValue(item, 'value_2')} onChange={(v) => onChange(item.id, 'value_2', v)} disabled={isReadOnly} variant="okno" />, 'text-center')}
          {keteranganCell}
        </tr>
      );
    }

    // ─── J. RECORDING — REC A + REC B adaptive ──────────────────────
    case 'server_dual_ab':
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {nominalCell}
          {td(<AdaptiveReadingCell item={item} field="value_1" nominal={item.nominal} isReadOnly={isReadOnly} getValue={getValue} onChange={onChange} />)}
          {td(<AdaptiveReadingCell item={item} field="value_2" nominal={item.nominal} isReadOnly={isReadOnly} getValue={getValue} onChange={onChange} />)}
          {keteranganCell}
        </tr>
      );

    // ─── K. RBP COUNT — 4 number inputs ─────────────────────────────
    case 'rbp_count':
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {td(<NumberInput value={getValue(item, 'value_1')} onChange={(v) => onChange(item.id, 'value_1', v)} disabled={isReadOnly} />, 'text-center')}
          {td(<NumberInput value={getValue(item, 'value_2')} onChange={(v) => onChange(item.id, 'value_2', v)} disabled={isReadOnly} />, 'text-center')}
          {td(<NumberInput value={getValue(item, 'value_3')} onChange={(v) => onChange(item.id, 'value_3', v)} disabled={isReadOnly} />, 'text-center')}
          {td(<NumberInput value={getValue(item, 'value_4')} onChange={(v) => onChange(item.id, 'value_4', v)} disabled={isReadOnly} />, 'text-center')}
          {keteranganCell}
        </tr>
      );

    // ─── L. LINGKUNGAN KERJA ────────────────────────────────────────
    case 'environment':
      return (
        <tr className="hover:bg-slate-50/60">
          {noCell}
          {nameCell}
          {nominalCell}
          {td(
            <input type="text" value={getValue(item, 'value_1')} onChange={(e) => onChange(item.id, 'value_1', e.target.value)} disabled={isReadOnly}
              placeholder="Hasil" className="w-full h-7 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
          )}
          {keteranganCell}
        </tr>
      );

    default:
      return (
        <tr><td colSpan={5} className="px-3 py-2 text-slate-400 italic">Layout '{layout}' belum didukung.</td></tr>
      );
  }
};

const layoutColumnCount = (layout: string): number => {
  switch (layout) {
    case 'maintenance':    return 5;
    case 'source_data':    return 5;
    case 'cpu_status':     return 6;
    case 'network_status': return 5;
    case 'server_dual_ab': return 6;
    case 'rbp_count':      return 7;
    case 'environment':    return 5;
    default:               return 5;
  }
};

// ─── Reading cells ──────────────────────────────────────────────────────────

interface AdaptiveCellProps {
  item: CnsdAtcSystemMeterItem;
  field: keyof CnsdAtcSystemMeterItem;
  nominal: string | null;
  isReadOnly: boolean;
  getValue: (item: CnsdAtcSystemMeterItem, field: keyof CnsdAtcSystemMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdAtcSystemMeterItem, value: string | null) => void;
}

const AdaptiveReadingCell: React.FC<AdaptiveCellProps> = ({ item, field, nominal, isReadOnly, getValue, onChange }) => {
  const value = getValue(item, field);

  if (isTimeNominal(nominal)) {
    return (
      <div className="flex items-center gap-1.5">
        <input type="time" step={1} value={value} onChange={(e) => onChange(item.id, field, e.target.value)} disabled={isReadOnly}
          className="h-7 px-2 rounded border border-slate-300 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
        {!isReadOnly && (
          <button type="button" title="Isi waktu sekarang"
            onClick={() => onChange(item.id, field, new Date().toTimeString().slice(0, 8))}
            className="h-7 w-7 rounded border border-slate-300 text-slate-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 transition-colors flex items-center justify-center">
            <Timer size={13} />
          </button>
        )}
      </div>
    );
  }

  const toggleOpts = parseToggleOptions(nominal);
  if (toggleOpts) {
    return <SelectToggle options={toggleOpts} value={value} onChange={(v) => onChange(item.id, field, v)} disabled={isReadOnly} variant="okno" />;
  }

  if (isNumericNominal(nominal)) {
    return (
      <input type="number" value={value} onChange={(e) => onChange(item.id, field, e.target.value)} disabled={isReadOnly}
        placeholder="0" className="w-full h-7 px-2 rounded border border-slate-300 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
    );
  }

  return (
    <input type="text" value={value} onChange={(e) => onChange(item.id, field, e.target.value)} disabled={isReadOnly}
      placeholder="—" className="w-full h-7 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
  );
};

// ─── Toggle pill button (logbook-style) ─────────────────────────────────────

interface SelectToggleProps {
  options: string[];
  value: string;
  onChange: (v: string | null) => void;
  disabled: boolean;
  variant?: 'okno' | 'neutral';
}

const SelectToggle: React.FC<SelectToggleProps> = ({ options, value, onChange, disabled, variant = 'neutral' }) => {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
      {options.map((opt) => {
        const active = value.toUpperCase() === opt.toUpperCase();
        const tone = variant === 'okno'
          ? (opt === 'OK' ? 'bg-emerald-500 text-white' : opt === 'NO' ? 'bg-red-500 text-white' : 'bg-slate-700 text-white')
          : 'bg-slate-700 text-white';
        return (
          <button key={opt} type="button" disabled={disabled}
            onClick={() => onChange(active ? null : opt)}
            className={cn('px-2.5 h-7 text-[11px] font-semibold transition-colors uppercase tracking-wider',
              active ? tone : 'text-slate-600 hover:bg-slate-200',
              disabled && 'opacity-50 cursor-not-allowed')}>
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ─── CPU STATUS multi-select pill bar ───────────────────────────────────────

interface CpuStatusProps {
  value: string | null;                 // original from server
  editedValue: string;                  // from edited state (may be empty)
  onChange: (v: string | null) => void;
  disabled: boolean;
}

const CpuStatusMultiSelect: React.FC<CpuStatusProps> = ({ value, editedValue, onChange, disabled }) => {
  const current = (editedValue || value || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const has = (flag: string) => current.includes(flag);
  const toggle = (flag: string) => {
    const next = has(flag) ? current.filter((f) => f !== flag) : [...current, flag];
    onChange(next.length === 0 ? null : next.join(','));
  };
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
      {CPU_STATUS_FLAGS.map((flag) => {
        const active = has(flag);
        return (
          <button key={flag} type="button" disabled={disabled}
            onClick={() => toggle(flag)}
            className={cn('w-7 h-7 text-[11px] font-bold transition-colors border-l border-slate-200 first:border-l-0',
              active ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-200',
              disabled && 'opacity-50 cursor-not-allowed')}>
            {flag}
          </button>
        );
      })}
    </div>
  );
};

interface NumberInputProps { value: string; onChange: (v: string) => void; disabled: boolean; }
const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, disabled }) => (
  <input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
    placeholder="0" className="w-20 h-7 px-2 rounded border border-slate-300 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500" />
);
