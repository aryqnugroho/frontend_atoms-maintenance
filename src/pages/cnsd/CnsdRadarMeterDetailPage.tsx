import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Radar as RadarIcon,
  MapPin,
  Printer,
  Save,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { cnsdRadarMeterService } from '@/services/cnsdRadarMeterService';
import { CnsdRadarMeterSignaturePanel } from '@/pages/cnsd/components/CnsdRadarMeterSignaturePanel';
import { cn } from '@/lib/utils';
import type {
  CnsdRadarMeterItem,
  CnsdRadarMeterRecordDetail,
  CnsdRadarMeterSectionMeta,
} from '@/types/cnsdRadar';

/**
 * Detail / edit page for a single CNSD Radar Meter record.
 *
 * Section A (TERMONITOR DI LCMS) renders TX I + TX II columns inside groups.
 * Section C (LINGKUNGAN KERJA) renders a single HASIL column.
 *
 * Completed records render as read-only.
 */
export const CnsdRadarMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recordId = Number(id);

  const [record, setRecord] = useState<CnsdRadarMeterRecordDetail | null>(null);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<CnsdRadarMeterItem>>>({});
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
      const data = await cnsdRadarMeterService.getRecord(recordId);
      setRecord(data);
      setEditedItems({});
      if (data.sections_meta.length > 0 && !activeSectionCode) {
        setActiveSectionCode(data.sections_meta[0].code);
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
  }, [recordId, activeSectionCode]);

  useEffect(() => {
    void fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  // Group items by section_code, preserving template order from sections_meta
  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdRadarMeterItem[]> = {};
    if (!record) return map;
    record.items.forEach((it) => {
      const code = it.section_code ?? 'A';
      if (!map[code]) map[code] = [];
      map[code].push(it);
    });
    return map;
  }, [record]);
  const isCompleted = record?.status === 'completed';
  const isReadOnly = isCompleted;
  const hasChanges = Object.keys(editedItems).length > 0;

  const updateField = (
    itemId: number,
    field: keyof CnsdRadarMeterItem,
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

  const getValue = (item: CnsdRadarMeterItem, field: keyof CnsdRadarMeterItem): string => {
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
      kondisi_teknis_tx1: 'kondisi_teknis_tx1' in patch ? patch.kondisi_teknis_tx1 ?? null : undefined,
      kondisi_teknis_tx2: 'kondisi_teknis_tx2' in patch ? patch.kondisi_teknis_tx2 ?? null : undefined,
      hasil:              'hasil'              in patch ? patch.hasil              ?? null : undefined,
      keterangan:         'keterangan'         in patch ? patch.keterangan         ?? null : undefined,
    }));

    try {
      const updated = await cnsdRadarMeterService.updateRecord(record.id, { items });
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
        <Button variant="outline" onClick={() => navigate('/cnsd/radar-meter')} className="gap-2">
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const activeSection = record.sections_meta.find((m) => m.code === activeSectionCode) ?? null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/cnsd')}
          className="hover:text-slate-700 transition-colors"
        >
          CNSD
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/cnsd/radar-meter')}
          className="hover:text-slate-700 transition-colors"
        >
          Meter Reading Radar
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium font-mono">{record.form_number}</span>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cnsd/radar-meter')}
                className="gap-1.5 -ml-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <RadarIcon size={18} className="text-maintenance-cnsd" />
                  <h1 className="text-xl font-bold text-slate-900">Meter Reading Radar</h1>
                  <StatusBadge status={record.status} variant="pill" />
                </div>
                <p className="text-xs font-mono text-slate-500">{record.form_number}</p>
                <p className="text-sm text-slate-500">
                  {record.location} — Merk {record.merk} / Type {record.type}
                  {record.serial_number && ` — SN: ${record.serial_number}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <Calendar size={14} className="text-slate-400" />
                {record.date}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <ShiftBadge shift={record.shift_type} />
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <MapPin size={14} className="text-slate-400" />
                {record.facility}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <Users size={14} className="text-slate-400" />
                {record.technicians.length} Teknisi
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/cnsd/radar-meter/${record.id}/print`)}
                className="gap-1.5 shrink-0"
                title="Print / Cetak Form Meter Reading Radar"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager Teknik</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {record.manager?.name ?? <span className="text-slate-400 font-normal">Tidak ditugaskan</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor CNSD</p>
              <p className="mt-0.5 text-slate-800 font-medium">
                {record.supervisor?.name ?? <span className="text-slate-400 font-normal">Tidak ditugaskan</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teknisi CNSD</p>
              <p className="mt-0.5 text-slate-800 font-medium truncate" title={record.technicians.map((t) => t.technician_name).join(', ')}>
                {record.technicians.map((t) => t.technician_name).join(', ') || <span className="text-slate-400 font-normal">—</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Section tabs */}
      <div className="grid grid-cols-2 gap-2">
        {record.sections_meta.map((s) => (
          <button
            key={s.code}
            onClick={() => setActiveSectionCode(s.code)}
            className={cn(
              'rounded-xl border-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 text-center',
              activeSectionCode === s.code
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-700'
            )}
          >
            {s.code}. {s.name}
          </button>
        ))}
      </div>

      {/* Active section table */}
      {activeSection && (
        activeSection.inputs_layout === 'tx_dual' ? (
          <RadarTxDualSection
            sectionMeta={activeSection}
            items={itemsBySection[activeSection.code] ?? []}
            isReadOnly={isReadOnly}
            getValue={getValue}
            onChange={updateField}
          />
        ) : (
          <RadarEnvironmentSection
            sectionMeta={activeSection}
            items={itemsBySection[activeSection.code] ?? []}
            isReadOnly={isReadOnly}
            getValue={getValue}
            onChange={updateField}
          />
        )
      )}

      {/* Save button */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
      <CnsdRadarMeterSignaturePanel record={record} onUpdated={(r) => setRecord(r)} />
    </div>
  );
};

// ────────────────────────────────────────────────────────
// Section renderers

interface SectionProps {
  sectionMeta: CnsdRadarMeterSectionMeta;
  items: CnsdRadarMeterItem[];
  isReadOnly: boolean;
  getValue: (item: CnsdRadarMeterItem, field: keyof CnsdRadarMeterItem) => string;
  onChange: (itemId: number, field: keyof CnsdRadarMeterItem, value: string | null) => void;
}

/**
 * Detect a sub-header marker row (item_name starts with "* ").
 * Sub-headers were seeded as inline group titles inside SSR EXTRACTOR / AILAN /
 * RADAR CONTROL. They should be rendered as a labeled separator, not as an
 * editable row.
 * NOTE: "Antenna" in RADAR CONTROL is NOT a sub-header — it is an editable
 * row where users type the actual RPM values for TX I and TX II.
 */
const isSubHeader = (it: CnsdRadarMeterItem): boolean => it.item_name.trim().startsWith('* ');

const inputClass = 'w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500';

/** True when this item is the Antenna row (input RPM, not Green checkbox) */
const isAntennaRpmRow = (it: CnsdRadarMeterItem): boolean =>
  it.item_name.trim().toLowerCase() === 'antenna';

/**
 * True when the item should use a Green/Red dropdown instead of free text.
 * Rule: standard === 'Green' (exact match, case-sensitive per template).
 * Items with other standards (e.g. ">2500 W", "+- 0", "5,6", "Max 22°C")
 * keep their free-text inputs.
 */
const isGreenStandard = (it: CnsdRadarMeterItem): boolean => it.standard === 'Green';

const GREEN_OPTIONS = ['', 'Green', 'Red'] as const;

/**
 * Shared input renderer for a single TX field (TX I or TX II).
 * Uses a styled dropdown when standard === 'Green', otherwise free text.
 */
const TxInput: React.FC<{
  item: CnsdRadarMeterItem;
  field: keyof CnsdRadarMeterItem;
  value: string;
  placeholder: string;
  isReadOnly: boolean;
  onChange: (itemId: number, field: keyof CnsdRadarMeterItem, value: string | null) => void;
}> = ({ item, field, value, placeholder, isReadOnly, onChange }) => {
  if (isGreenStandard(item)) {
    const colorCls =
      value === 'Green'
        ? 'bg-emerald-50 text-emerald-700'
        : value === 'Red'
        ? 'bg-red-50 text-red-700'
        : 'bg-white text-slate-700';

    return (
      <select
        className={`w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-50 disabled:text-slate-500 ${colorCls}`}
        value={value}
        onChange={(e) => onChange(item.id, field, e.target.value === '' ? null : e.target.value)}
        disabled={isReadOnly}
      >
        {GREEN_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt === '' ? '—' : opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      className={inputClass}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(item.id, field, e.target.value)}
      disabled={isReadOnly}
    />
  );
};

/**
 * Section A — Termonitor di LCMS. Renders TX I + TX II columns inside groups.
 */
const RadarTxDualSection: React.FC<SectionProps> = ({ sectionMeta, items, isReadOnly, getValue, onChange }) => {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-slate-400">
          Tidak ada item pada section ini.
        </CardContent>
      </Card>
    );
  }

  // Group items by group_number, preserving order
  const groups: { number: number | null; name: string | null; items: CnsdRadarMeterItem[] }[] = [];
  items.forEach((it) => {
    const last = groups[groups.length - 1];
    if (last && last.number === it.group_number && last.name === it.group_name) {
      last.items.push(it);
    } else {
      groups.push({ number: it.group_number, name: it.group_name, items: [it] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider">
            {sectionMeta.code}. {sectionMeta.name}
          </CardTitle>
          <span className="text-xs font-medium text-slate-400">{items.length} item</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <th className="px-4 py-3 text-left w-10">No</th>
              <th className="px-4 py-3 text-left w-72">Pemeriksaan</th>
              <th className="px-4 py-3 text-left w-36">Standart</th>
              <th className="px-4 py-3 text-left">{sectionMeta.columns_label_1 ?? 'TX I'}</th>
              <th className="px-4 py-3 text-left">{sectionMeta.columns_label_2 ?? 'TX II'}</th>
              <th className="px-4 py-3 text-left w-48">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map((g, gIdx) => (
              <React.Fragment key={`group-${gIdx}`}>
                {(g.number !== null || g.name !== null) && (
                  <tr className="bg-emerald-50/40 border-y border-emerald-100">
                    <td className="px-4 py-2 text-xs font-bold text-emerald-800">{g.number ?? '—'}</td>
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      {g.name}
                    </td>
                  </tr>
                )}
                {g.items.map((item, iIdx) => {
                  if (isSubHeader(item)) {
                    return (
                      <tr key={item.id} className="bg-slate-50/60">
                        <td className="px-4 py-2 text-slate-400 font-mono text-xs">—</td>
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {item.item_name}
                        </td>
                      </tr>
                    );
                  }

                  // Antenna row: show "10 RPM / 15 RPM" as standard label and
                  // RPM-specific placeholders to prompt the user to enter the
                  // actual measured RPM value for TX I and TX II.
                  const rpmPlaceholder = isAntennaRpmRow(item) ? '... RPM' : '...';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {item.item_number || iIdx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-semibold">{item.item_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{item.standard ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <TxInput
                          item={item}
                          field="kondisi_teknis_tx1"
                          value={getValue(item, 'kondisi_teknis_tx1')}
                          placeholder={isAntennaRpmRow(item) ? '... RPM' : rpmPlaceholder}
                          isReadOnly={isReadOnly}
                          onChange={onChange}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <TxInput
                          item={item}
                          field="kondisi_teknis_tx2"
                          value={getValue(item, 'kondisi_teknis_tx2')}
                          placeholder={isAntennaRpmRow(item) ? '... RPM' : rpmPlaceholder}
                          isReadOnly={isReadOnly}
                          onChange={onChange}
                        />
                      </td>
                      <td className="px-4 py-3">
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
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

/**
 * Section B — Lingkungan Kerja. Renders single HASIL column.
 * Tabel ini berdiri sendiri (terpisah dari section A) dengan header berwarna
 * amber sesuai paper form referensi.
 */
const RadarEnvironmentSection: React.FC<SectionProps> = ({ sectionMeta, items, isReadOnly, getValue, onChange }) => {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-slate-400">
          Tidak ada item pada section ini.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-amber-50 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider text-amber-900">
            {sectionMeta.code}. {sectionMeta.name}
          </CardTitle>
          <span className="text-xs font-medium text-amber-700">{items.length} item</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-200 text-[10px] text-amber-800 font-bold uppercase tracking-widest">
              <th className="px-4 py-3 text-center w-14 border-r border-amber-200">No</th>
              <th className="px-4 py-3 text-left border-r border-amber-200">Kegiatan</th>
              <th className="px-4 py-3 text-center w-32 border-r border-amber-200">Standart</th>
              <th className="px-4 py-3 text-center w-36 border-r border-amber-200">
                {sectionMeta.columns_label_1 ?? 'Hasil'}
              </th>
              <th className="px-4 py-3 text-left w-56">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs border-r border-slate-100">
                  {item.item_number || idx + 1}
                </td>
                <td className="px-4 py-3 border-r border-slate-100">
                  <div className="text-slate-800 font-medium">{item.item_name}</div>
                </td>
                <td className="px-4 py-3 text-center border-r border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {item.standard ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 border-r border-slate-100">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Isi hasil"
                    value={getValue(item, 'hasil')}
                    onChange={(e) => onChange(item.id, 'hasil', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td className="px-4 py-3">
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
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
