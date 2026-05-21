import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Lock as LockIcon,
  MapPin,
  Printer,
  Radio as TransmitterIcon,
  Save,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils';
import { cnsdTransmitterMeterService } from '@/services/cnsdTransmitterMeterService';
import { CnsdTransmitterMeterSignaturePanel } from './components/CnsdTransmitterMeterSignaturePanel';
import type { ShiftType } from '@/types';
import type {
  CnsdTransmitterMeterItem,
  CnsdTransmitterMeterRecordDetail,
  CnsdTransmitterSectionMeta,
} from '@/types/cnsdTransmitter';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const STATUS_OPTIONS_ON_AIR  = ['On Air', 'STBY'];
const STATUS_OPTIONS_ONLINE  = ['Online', 'Offline'];

/**
 * CNSD Transmitter Meter Reading — detail / edit page (FORM C-1).
 *
 * Layout per paper form 005_Transmitter:
 *   - Section 1 (TRANSMITTER / TX RADIO): NO | FREQUENCY | MERK | STATUS |
 *     POWER O/P | MODULASI | KETERANGAN. Groups 1-8 use TX 1 / TX 2 rows under
 *     each frequency sub-banner. Group 9 (Back Up Radio) has no TX label and
 *     the STATUS column is BLOCKED (dark grey) per paper.
 *   - Section 2 (LINGKUNGAN KERJA): NO | KEGIATAN | NOMINAL | HASIL | KETERANGAN.
 *
 * Transmitter has no equipment-level merk/type/sn (those are per item).
 */
export const CnsdTransmitterMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdTransmitterMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdTransmitterMeterItem>>>({});
  const [activeSectionCode, setActiveSectionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!recordId || Number.isNaN(recordId)) {
      setErrorMessage('ID form tidak valid.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cnsdTransmitterMeterService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
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

  useEffect(() => { void fetchRecord(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recordId]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdTransmitterMeterItem[]> = {};
    if (!record) return map;
    record.items.forEach((it) => {
      const code = it.section_code ?? '1';
      if (!map[code]) map[code] = [];
      map[code].push(it);
    });
    return map;
  }, [record]);

  const isReadOnly = record?.status === 'completed';
  const hasChanges = Object.keys(editedItems).length > 0;

  const updateField = (itemId: number, field: keyof CnsdTransmitterMeterItem, value: string | null) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [field]: value === '' ? null : value },
    }));
  };

  const getValue = (item: CnsdTransmitterMeterItem, field: keyof CnsdTransmitterMeterItem): string => {
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
      status_value: 'status_value' in patch ? patch.status_value ?? null : undefined,
      power_output: 'power_output' in patch ? patch.power_output ?? null : undefined,
      modulasi:     'modulasi'     in patch ? patch.modulasi     ?? null : undefined,
      hasil:        'hasil'        in patch ? patch.hasil        ?? null : undefined,
      keterangan:   'keterangan'   in patch ? patch.keterangan   ?? null : undefined,
    }));
    try {
      const updated = await cnsdTransmitterMeterService.updateRecord(record.id, { items });
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
        <Button variant="outline" onClick={() => navigate('/cnsd/transmitter-meter')} className="gap-2">
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
        <button type="button" onClick={() => navigate('/cnsd/transmitter-meter')} className="hover:text-slate-700 transition-colors">
          Transmitter Meter Reading
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <TransmitterIcon size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Meter Reading — Transmitter</h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CNSD &nbsp;·&nbsp;
                <span className="font-mono">{record.form_number}</span>
                {record.form_code && <> &nbsp;·&nbsp; <span className="font-mono">{record.form_code}</span></>}
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/transmitter-meter/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      )}

      {/* Info Peralatan card (Transmitter has no editable equipment metadata) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Informasi Peralatan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <InfoCell label="Lokasi" value={record.location} />
          <InfoCell label="Fasilitas" value={record.facility} />
          <InfoCell label="Shift" value={SHIFT_TIME_LABELS[record.shift_type] ?? null} />
          <InfoCell label="Tanggal" value={record.date} />
        </div>
        <p className="text-[10px] text-slate-400 italic mt-3">
          Identifikasi peralatan (Merk) tercatat per channel di tabel frekuensi.
        </p>
      </div>

      {record.sections_meta.length > 0 && (
        <Tabs
          items={record.sections_meta.map((s) => ({ key: s.code, label: `${s.code}. ${s.name}` }))}
          defaultKey={activeSectionCode ?? record.sections_meta[0]?.code}
          onChange={setActiveSectionCode}
        />
      )}

      {activeSectionMeta && (
        <TransmitterSectionPanel
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
              {Object.keys(editedItems).length} item belum disimpan
            </span>
          )}
          <Button onClick={() => void handleSave()} disabled={!hasChanges} isLoading={isSaving} className="gap-2">
            <Save size={16} /> Simpan Perubahan
          </Button>
        </div>
      )}

      <CnsdTransmitterMeterSignaturePanel record={record} onRecordUpdate={(r) => setRecord(r)} />
    </div>
  );
};

// ─── Section panel ────────────────────────────────────────────

interface TransmitterSectionPanelProps {
  sectionMeta: CnsdTransmitterSectionMeta;
  items: CnsdTransmitterMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdTransmitterMeterItem, field: keyof CnsdTransmitterMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdTransmitterMeterItem, value: string | null) => void;
}

const TransmitterSectionPanel: React.FC<TransmitterSectionPanelProps> = ({
  sectionMeta, items, isReadOnly, getValue, onChange,
}) => {
  const isTx = sectionMeta.inputs_layout === 'transmitter';

  // Group items by group_name (skip header rows)
  const groups = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, CnsdTransmitterMeterItem[]> = {};
    items.forEach((it) => {
      if (it.is_header) return;
      const key = it.group_name ?? '__ungrouped__';
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(it);
    });
    return order.map((key) => ({
      number: items.find((i) => (i.group_name ?? '__ungrouped__') === key)?.group_number ?? null,
      name: key === '__ungrouped__' ? null : key,
      items: map[key],
    }));
  }, [items]);

  const colCount = isTx ? 7 : 5;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {sectionMeta.code}. {sectionMeta.name}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isTx
              ? 'Isi STATUS (On Air/STBY/Online/Offline), POWER O/P, MODULASI per TX. Back Up Radio status diblok per form.'
              : 'Isi kolom HASIL untuk tiap kegiatan pemeriksaan lingkungan.'}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">{items.filter((i) => !i.is_header).length} item</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-12 text-[11px] uppercase tracking-wider">No</th>
              <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 min-w-[200px] text-[11px] uppercase tracking-wider">
                {isTx ? 'Frequency' : 'Kegiatan'}
              </th>
              {isTx ? (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[80px] text-[11px] uppercase tracking-wider">Merk</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[120px] text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Power O/P</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Modulasi</th>
                </>
              ) : (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Nominal</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">Hasil</th>
                </>
              )}
              <th className="px-2 py-2 text-left font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Belum ada baris pada section ini.
                </td>
              </tr>
            ) : (
              groups.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {group.name && (
                    <tr className="bg-slate-100">
                      <td colSpan={colCount} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                        {group.number ? `${group.number}. ` : ''}{group.name}
                      </td>
                    </tr>
                  )}
                  {isTx
                    ? renderTransmitterGroupRows(group.items, isReadOnly, getValue, onChange)
                    : group.items.map((item) => (
                        <EnvItemRow key={item.id} item={item} isReadOnly={isReadOnly} getValue={getValue} onChange={onChange} />
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

// Renders rows for Section 1 (TRANSMITTER): inserts a frequency sub-banner
// whenever frequency_label changes.
function renderTransmitterGroupRows(
  items: CnsdTransmitterMeterItem[],
  isReadOnly: boolean,
  getValue: (item: CnsdTransmitterMeterItem, field: keyof CnsdTransmitterMeterItem) => string,
  onChange: (itemId: number, field: keyof CnsdTransmitterMeterItem, value: string | null) => void,
): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  let lastFreq: string | null = null;

  items.forEach((item) => {
    const isBackup = !item.tx_label; // Back Up Radio: no TX label
    const freq = item.frequency_label ?? '';

    // Insert frequency sub-banner only for TX groups when freq changes
    if (!isBackup && freq && freq !== lastFreq) {
      rows.push(
        <tr key={`freq-${item.id}`} className="bg-emerald-50/40">
          <td className="px-2 py-1.5 text-center text-[10px]">&nbsp;</td>
          <td className="px-3 py-1.5 text-[11px] font-bold text-slate-700">{freq}</td>
          <td className="px-2 py-1.5 text-center text-[10px] font-bold text-slate-600">{item.merk ?? ''}</td>
          <td colSpan={4} className="border-b border-slate-100">&nbsp;</td>
        </tr>
      );
      lastFreq = freq;
    }

    rows.push(
      <TransmitterItemRow
        key={item.id}
        item={item}
        isBackup={isBackup}
        isReadOnly={isReadOnly}
        getValue={getValue}
        onChange={onChange}
      />
    );
  });

  return rows;
}

// ─── Row components ───────────────────────────────────────────

interface TransmitterItemRowProps {
  item: CnsdTransmitterMeterItem;
  isBackup: boolean;
  isReadOnly: boolean;
  getValue: (item: CnsdTransmitterMeterItem, field: keyof CnsdTransmitterMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdTransmitterMeterItem, value: string | null) => void;
}

const TransmitterItemRow: React.FC<TransmitterItemRowProps> = ({
  item, isBackup, isReadOnly, getValue, onChange,
}) => {
  const inputClass = 'w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500';
  const selectClass = inputClass + ' appearance-none cursor-pointer';
  const disabled = isReadOnly;
  // Status options pick: items in "on_air_stby" groups (orange/peach merk PAE) vs online/offline
  // Simpler: present full union list. Backend stores free text.
  const statusOptions = isBackup ? [] : [...STATUS_OPTIONS_ON_AIR, ...STATUS_OPTIONS_ONLINE];

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px] align-middle">&nbsp;</td>
      <td className="px-3 py-2 align-middle text-slate-800 font-medium">
        {isBackup ? item.frequency_label : (item.tx_label ?? '')}
      </td>
      <td className="px-2 py-2 align-middle text-center text-slate-600 text-[11px]">
        {isBackup ? (item.merk ?? '—') : ''}
      </td>
      {item.is_blocked ? (
        <td className="px-2 py-2 align-middle text-center bg-slate-200 text-slate-500" title={item.block_reason ?? 'Blocked'}>
          <LockIcon size={12} className="inline" />
        </td>
      ) : (
        <td className="px-2 py-2 align-middle">
          <select
            className={selectClass}
            value={getValue(item, 'status_value')}
            onChange={(e) => onChange(item.id, 'status_value', e.target.value || null)}
            disabled={disabled}
          >
            <option value="">—</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </td>
      )}
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="..."
          value={getValue(item, 'power_output')}
          onChange={(e) => onChange(item.id, 'power_output', e.target.value)}
          disabled={disabled}
        />
      </td>
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="..."
          value={getValue(item, 'modulasi')}
          onChange={(e) => onChange(item.id, 'modulasi', e.target.value)}
          disabled={disabled}
        />
      </td>
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

interface EnvItemRowProps {
  item: CnsdTransmitterMeterItem;
  isReadOnly: boolean;
  getValue: (item: CnsdTransmitterMeterItem, field: keyof CnsdTransmitterMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdTransmitterMeterItem, value: string | null) => void;
}

const EnvItemRow: React.FC<EnvItemRowProps> = ({ item, isReadOnly, getValue, onChange }) => {
  const inputClass = 'w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500';

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px] align-middle">{item.group_number ?? ''}</td>
      <td className="px-3 py-2 align-middle text-slate-800 font-medium">{item.frequency_label ?? item.group_name ?? ''}</td>
      <td className={cn('px-2 py-2 align-middle text-center text-slate-600 text-[11px]', !item.nominal && 'text-slate-300')}>
        {item.nominal || '—'}
      </td>
      <td className="px-2 py-2 align-middle">
        <input
          type="text"
          className={inputClass}
          placeholder="..."
          value={getValue(item, 'hasil')}
          onChange={(e) => onChange(item.id, 'hasil', e.target.value)}
          disabled={isReadOnly}
        />
      </td>
      <td className="px-2 py-2 align-middle">
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
};

const InfoCell: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div>
    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{label}</span>
    <p className="mt-0.5 font-medium text-slate-700">{value ?? '—'}</p>
  </div>
);
