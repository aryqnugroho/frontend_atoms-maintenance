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
  Network as AmscIcon,
  Printer,
  Save,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { cnsdAmscMeterService } from '@/services/cnsdAmscMeterService';
import { CnsdAmscMeterSignaturePanel } from './components/CnsdAmscMeterSignaturePanel';
import type {
  CnsdAmscMeterItem,
  CnsdAmscMeterRecordDetail,
  CnsdAmscMeterSectionMeta,
} from '@/types/cnsdAmsc';

// ─── Constants ────────────────────────────────────────────────

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

// ─── Main component ───────────────────────────────────────────

/**
 * CNSD AMSC Meter Reading — detail / edit page.
 *
 * AMSC has 4 distinct layouts handled per-section:
 *   1. dual_ab      → FRONT PANEL (NO | PEMBACAAN | NOMINAL | HASIL A | HASIL B | KET)
 *   2. single_hasil → POWER SUPPLY UNIT (NO | PEMBACAAN | (blocked NOMINAL) | HASIL | KET)
 *   3. channel      → CHANNEL AMSC (NO | PEMBACAAN | ADDRESS | STATUS | CCT | KET)
 *   4. environment  → LINGKUNGAN KERJA (NO | KEGIATAN | NOMINAL | HASIL | KET)
 *
 * UI follows EQ-1 / Radar Meter Reading standard:
 *   - GP-style header card with status pill + date / shift / facility / teknisi badges
 *   - Info Peralatan card with editable Merk / Type / SN (Manager/Supervisor)
 *   - Tabs per section
 *   - Signature panel at the bottom
 */
export const CnsdAmscMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdAmscMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdAmscMeterItem>>>({});
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
      const data = await cnsdAmscMeterService.getRecord(recordId);
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
    const map: Record<string, CnsdAmscMeterItem[]> = {};
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

  const updateField = (itemId: number, field: keyof CnsdAmscMeterItem, value: string | null) => {
    if (isReadOnly) return;
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? {}),
        [field]: value === '' ? null : value,
      },
    }));
  };

  const getValue = (item: CnsdAmscMeterItem, field: keyof CnsdAmscMeterItem): string => {
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
      hasil_a:      'hasil_a'      in patch ? patch.hasil_a      ?? null : undefined,
      hasil_b:      'hasil_b'      in patch ? patch.hasil_b      ?? null : undefined,
      hasil:        'hasil'        in patch ? patch.hasil        ?? null : undefined,
      status_value: 'status_value' in patch ? patch.status_value ?? null : undefined,
      cct:          'cct'          in patch ? patch.cct          ?? null : undefined,
      keterangan:   'keterangan'   in patch ? patch.keterangan   ?? null : undefined,
    }));

    try {
      const updated = await cnsdAmscMeterService.updateRecord(record.id, {
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
        <Button variant="outline" onClick={() => navigate('/cnsd/amsc-meter')} className="gap-2">
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
        <button type="button" onClick={() => navigate('/cnsd/amsc-meter')} className="hover:text-slate-700 transition-colors">
          AMSC Meter Reading
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <AmscIcon size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">Meter Reading — AMSC</h1>
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/cnsd/amsc-meter/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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
          <EditableMetaField label="Merk" value={merk} onChange={setMerk} disabled={isReadOnly || !canEditMetadata} placeholder="ELSA" />
          <EditableMetaField label="Type" value={type} onChange={setType} disabled={isReadOnly || !canEditMetadata} placeholder="1003Qi+" />
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
        <AmscSectionPanel
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

      {/* Signature panel — refetches on success */}
      <CnsdAmscMeterSignaturePanel record={record} onSignSuccess={() => void fetchRecord()} />
    </div>
  );
};

// ─── Section panel ────────────────────────────────────────────

interface AmscSectionPanelProps {
  sectionMeta: CnsdAmscMeterSectionMeta;
  items: CnsdAmscMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdAmscMeterItem, field: keyof CnsdAmscMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdAmscMeterItem, value: string | null) => void;
}

const AmscSectionPanel: React.FC<AmscSectionPanelProps> = ({
  sectionMeta, items, isReadOnly, getValue, onChange,
}) => {
  const layout = sectionMeta.inputs_layout;
  const isDualAB = layout === 'dual_ab';
  const isChannel = layout === 'channel';
  const isSingleHasil = layout === 'single_hasil';
  const isEnv = layout === 'environment';

  // Column count depends on layout
  const colCount = isEnv ? 5 : 6;

  const description = (() => {
    switch (layout) {
      case 'dual_ab':      return 'Isi nilai HASIL A dan HASIL B untuk masing-masing item front panel.';
      case 'single_hasil': return 'Isi nilai HASIL untuk masing-masing tegangan. Kolom NOMINAL tidak digunakan.';
      case 'channel':      return 'Isi STATUS dan CCT untuk tiap channel. ADDRESS dan keterangan default sudah terisi dari template.';
      case 'environment':  return 'Isi kolom HASIL PEMERIKSAAN untuk tiap kegiatan lingkungan.';
      default:             return '';
    }
  })();

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
              <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 w-24 text-[11px] uppercase tracking-wider">No</th>
              <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 min-w-[200px] text-[11px] uppercase tracking-wider">
                {isEnv ? 'Kegiatan' : 'Pembacaan Meter Reading'}
              </th>
              {isChannel ? (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[110px] text-[11px] uppercase tracking-wider">Address</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">CCT</th>
                </>
              ) : isDualAB ? (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[120px] text-[11px] uppercase tracking-wider">Nominal</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Hasil A</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Hasil B</th>
                </>
              ) : isSingleHasil ? (
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider bg-slate-700/10">Nominal</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider" colSpan={2}>Hasil</th>
                </>
              ) : (
                // environment
                <>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[100px] text-[11px] uppercase tracking-wider">Nominal</th>
                  <th className="px-2 py-2 text-center font-semibold border-b border-slate-200 min-w-[140px] text-[11px] uppercase tracking-wider">Hasil Pemeriksaan</th>
                </>
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
              items.map((item) => (
                <AmscItemRow
                  key={item.id}
                  item={item}
                  layout={layout}
                  isReadOnly={isReadOnly}
                  getValue={getValue}
                  onChange={onChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Item row ─────────────────────────────────────────────────

interface AmscItemRowProps {
  item: CnsdAmscMeterItem;
  layout: string;
  isReadOnly: boolean;
  getValue: (item: CnsdAmscMeterItem, field: keyof CnsdAmscMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdAmscMeterItem, value: string | null) => void;
}

const AmscItemRow: React.FC<AmscItemRowProps> = ({
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
      {layout === 'channel' ? (
        <>
          <td className="px-2 py-2 align-middle text-center text-slate-600 text-[11px]">
            {item.address ?? '—'}
          </td>
          <td className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'status_value')}
              onChange={(e) => onChange(item.id, 'status_value', e.target.value)}
              disabled={disabled}
            />
          </td>
          <td className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'cct')}
              onChange={(e) => onChange(item.id, 'cct', e.target.value)}
              disabled={disabled}
            />
          </td>
        </>
      ) : layout === 'dual_ab' ? (
        <>
          <td className={cn('px-2 py-2 align-middle text-center text-slate-600 text-[11px]', !item.nominal && 'text-slate-300')}>
            {item.nominal || '—'}
          </td>
          <td className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'hasil_a')}
              onChange={(e) => onChange(item.id, 'hasil_a', e.target.value)}
              disabled={disabled}
            />
          </td>
          <td className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'hasil_b')}
              onChange={(e) => onChange(item.id, 'hasil_b', e.target.value)}
              disabled={disabled}
            />
          </td>
        </>
      ) : layout === 'single_hasil' ? (
        <>
          <td className="px-2 py-2 align-middle text-center bg-slate-200 text-slate-400">
            <LockIcon size={10} className="inline" />
          </td>
          <td colSpan={2} className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'hasil')}
              onChange={(e) => onChange(item.id, 'hasil', e.target.value)}
              disabled={disabled}
            />
          </td>
        </>
      ) : (
        // environment
        <>
          <td className="px-2 py-2 align-middle text-center text-slate-600 text-[11px]">
            {item.nominal ?? '—'}
          </td>
          <td className="px-2 py-2 align-middle">
            <input
              type="text"
              className={inputClass}
              placeholder="..."
              value={getValue(item, 'hasil')}
              onChange={(e) => onChange(item.id, 'hasil', e.target.value)}
              disabled={disabled}
            />
          </td>
        </>
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
