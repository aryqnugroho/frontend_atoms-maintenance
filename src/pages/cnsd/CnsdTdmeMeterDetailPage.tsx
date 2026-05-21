import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Save,
  Satellite as TdmeIcon,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { cnsdTdmeMeterService } from '@/services/cnsdTdmeMeterService';
import { CnsdTdmeMeterSignaturePanel } from './components/CnsdTdmeMeterSignaturePanel';
import type { ShiftType } from '@/types';
import type {
  CnsdTdmeMeterItem,
  CnsdTdmeMeterRecordDetail,
} from '@/types/cnsdTdme';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const TX_MODE_OPTIONS = ['MAIN', 'STANDBY'];

interface SectionMeta {
  code: string;
  name: string;
  inputs_layout: string;
  groups: Array<{ number: number | null; name: string | null }>;
}

/**
 * CNSD T-DME Meter Reading — detail / edit page (FORM N-5).
 *
 * Mirrors paper 009_T-DME. Layout similar to GlidePath/Localizer (Section A with
 * 7 groups using per-item single/dual hasil layouts) plus T-DME-specific
 * tx1_mode / tx2_mode (MAIN / STANDBY) shown next to the form code.
 */
export const CnsdTdmeMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdTdmeMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdTdmeMeterItem>>>({});
  const [activeSectionCode, setActiveSectionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [merk, setMerk] = useState('');
  const [type, setType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [tx1Mode, setTx1Mode] = useState('');
  const [tx2Mode, setTx2Mode] = useState('');

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
      const data = await cnsdTdmeMeterService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
      setMerk(data.merk ?? '');
      setType(data.type ?? '');
      setSerialNumber(data.serial_number ?? '');
      setTx1Mode(data.tx1_mode ?? '');
      setTx2Mode(data.tx2_mode ?? '');
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
    const map: Record<string, CnsdTdmeMeterItem[]> = {};
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
    serialNumber !== (record.serial_number ?? '') ||
    tx1Mode !== (record.tx1_mode ?? '') ||
    tx2Mode !== (record.tx2_mode ?? '')
  );
  const hasChanges = Object.keys(editedItems).length > 0 || metadataDirty;

  const updateField = (itemId: number, field: keyof CnsdTdmeMeterItem, value: string | null) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [field]: value === '' ? null : value },
    }));
  };

  const getValue = (item: CnsdTdmeMeterItem, field: keyof CnsdTdmeMeterItem): string => {
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
      hasil_1:    'hasil_1'    in patch ? patch.hasil_1    ?? null : undefined,
      hasil_2:    'hasil_2'    in patch ? patch.hasil_2    ?? null : undefined,
      keterangan: 'keterangan' in patch ? patch.keterangan ?? null : undefined,
    }));
    try {
      const updated = await cnsdTdmeMeterService.updateRecord(record.id, {
        merk: metadataDirty ? merk || null : undefined,
        type: metadataDirty ? type || null : undefined,
        serial_number: metadataDirty ? serialNumber || null : undefined,
        tx1_mode: metadataDirty ? tx1Mode || null : undefined,
        tx2_mode: metadataDirty ? tx2Mode || null : undefined,
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
        <Button variant="outline" onClick={() => navigate('/cnsd/tdme-meter')} className="gap-2">
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
        <button type="button" onClick={() => navigate('/cnsd/tdme-meter')} className="hover:text-slate-700 transition-colors">
          T-DME Meter Reading
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <TdmeIcon size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Meter Reading — T-DME</h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CNSD &nbsp;·&nbsp;<span className="font-mono">{record.form_number}</span>
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/tdme-meter/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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
          <EditableMetaField label="Merk" value={merk} onChange={setMerk} disabled={!!isReadOnly || !canEditMetadata} placeholder="MOPENS" />
          <EditableMetaField label="Type" value={type} onChange={setType} disabled={!!isReadOnly || !canEditMetadata} placeholder="—" />
          <EditableMetaField label="Serial Number" value={serialNumber} onChange={setSerialNumber} disabled={!!isReadOnly || !canEditMetadata} placeholder="—" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
          <EditableSelectField label="Tx 1 Mode" value={tx1Mode} onChange={setTx1Mode} options={TX_MODE_OPTIONS} disabled={!!isReadOnly || !canEditMetadata} />
          <EditableSelectField label="Tx 2 Mode" value={tx2Mode} onChange={setTx2Mode} options={TX_MODE_OPTIONS} disabled={!!isReadOnly || !canEditMetadata} />
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
        <TdmeSectionPanel
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

      <CnsdTdmeMeterSignaturePanel record={record} onSignSuccess={(r) => setRecord(r)} />
    </div>
  );
};

interface TdmeSectionPanelProps {
  sectionMeta: SectionMeta;
  items: CnsdTdmeMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdTdmeMeterItem, field: keyof CnsdTdmeMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdTdmeMeterItem, value: string | null) => void;
}

const TdmeSectionPanel: React.FC<TdmeSectionPanelProps> = ({
  sectionMeta, items, isReadOnly, getValue, onChange,
}) => {
  const groups = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, CnsdTdmeMeterItem[]> = {};
    items.forEach((it) => {
      if (it.is_header) return;
      const key = `${it.group_number ?? '0'}::${it.group_name ?? '__'}`;
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(it);
    });
    return order.map((key) => {
      const first = items.find((i) => `${i.group_number ?? '0'}::${i.group_name ?? '__'}` === key);
      return { number: first?.group_number ?? null, name: first?.group_name ?? null, items: map[key] };
    });
  }, [items]);

  const isMeterReading = sectionMeta.inputs_layout === 'meter_reading';
  const colCount = 6;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {sectionMeta.code}. {sectionMeta.name}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isMeterReading
              ? 'FRONT PANEL → TX1/TX2. PARAMETER / Pulse Shape / Frequency → M1/M2. POWER SUPPLY → single HASIL.'
              : 'Isi kolom HASIL PEMERIKSAAN untuk tiap kegiatan lingkungan.'}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">{items.filter((i) => !i.is_header).length} item</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-12 text-[11px] uppercase tracking-wider">No</th>
              <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 min-w-[240px] text-[11px] uppercase tracking-wider">
                {isMeterReading ? 'Pembacaan Meter Reading' : 'Kegiatan'}
              </th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">
                {isMeterReading ? 'Standart' : 'Nominal'}
              </th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">
                {isMeterReading ? 'TX1 / M1 / Hasil' : 'Hasil'}
              </th>
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">TX2 / M2</th>
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
                  {group.name && isMeterReading && (
                    <tr className="bg-slate-100">
                      <td colSpan={colCount} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                        {group.number ? `${group.number}. ` : ''}{group.name}
                      </td>
                    </tr>
                  )}
                  {group.items.map((item) => (
                    <TdmeItemRow key={item.id} item={item} isReadOnly={isReadOnly} getValue={getValue} onChange={onChange} />
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

interface TdmeItemRowProps {
  item: CnsdTdmeMeterItem;
  isReadOnly: boolean;
  getValue: (item: CnsdTdmeMeterItem, field: keyof CnsdTdmeMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdTdmeMeterItem, value: string | null) => void;
}

const TdmeItemRow: React.FC<TdmeItemRowProps> = ({ item, isReadOnly, getValue, onChange }) => {
  const inputClass = 'w-full h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500';
  const isDual = item.hasil_layout === 'dual';

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px] align-middle">&nbsp;</td>
      <td className="px-3 py-2 align-middle text-slate-800 font-medium">{item.item_name}</td>
      <td className={cn('px-2 py-2 align-middle text-center text-slate-600 text-[11px]', !item.nominal && 'text-slate-300')}>
        {item.nominal || '—'}
      </td>
      {isDual ? (
        <>
          <td className="px-2 py-2 align-middle">
            <input type="text" className={inputClass} placeholder="TX1 / M1" value={getValue(item, 'hasil_1')} onChange={(e) => onChange(item.id, 'hasil_1', e.target.value)} disabled={isReadOnly} />
          </td>
          <td className="px-2 py-2 align-middle">
            <input type="text" className={inputClass} placeholder="TX2 / M2" value={getValue(item, 'hasil_2')} onChange={(e) => onChange(item.id, 'hasil_2', e.target.value)} disabled={isReadOnly} />
          </td>
        </>
      ) : (
        <td colSpan={2} className="px-2 py-2 align-middle">
          <input type="text" className={inputClass} placeholder="..." value={getValue(item, 'hasil_1')} onChange={(e) => onChange(item.id, 'hasil_1', e.target.value)} disabled={isReadOnly} />
        </td>
      )}
      <td className="px-2 py-2 align-middle">
        <input type="text" className={inputClass} placeholder="Catatan" value={getValue(item, 'keterangan')} onChange={(e) => onChange(item.id, 'keterangan', e.target.value)} disabled={isReadOnly} />
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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none placeholder:text-slate-300"
        maxLength={60} />
    )}
  </div>
);

interface EditableSelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled: boolean;
}

const EditableSelectField: React.FC<EditableSelectFieldProps> = ({ label, value, onChange, options, disabled }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
    {disabled ? (
      <p className="text-xs text-slate-700 font-medium">{value || '—'}</p>
    ) : (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none">
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )}
  </div>
);
