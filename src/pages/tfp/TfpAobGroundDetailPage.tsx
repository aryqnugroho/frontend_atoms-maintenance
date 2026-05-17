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
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { tfpAobGroundService } from '@/services/tfpAobGroundService';
import { TfpAobGroundSignaturePanel } from './components/TfpAobGroundSignaturePanel';
import { cn } from '@/lib/utils';
import type { TfpAobGroundRecordDetail, TfpAobGroundItem } from '@/types/tfpAobGround';

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

// ─── Helpers ───────────────────────────────────────────────────────────────

const isDisabled = (item: TfpAobGroundItem, colKey: ItemColKey): boolean => {
  return item.is_disabled_map?.[colKey] === true;
};

/** Determine if a parameter row is the "Mode" row */
const isModeRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('mode');

/** Determine if a parameter row is the "Suplai Aktif" row */
const isSuplaiRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('suplai aktif');

/** Determine if a parameter row is a single-value row (KWH Meter, Suhu Eq. Room) */
const isSingleValueRow = (item: TfpAobGroundItem): boolean => {
  const name = item.parameter_name.toLowerCase();
  return name.startsWith('kwh') || name.startsWith('suhu eq');
};

// ─── Cell input component ──────────────────────────────────────────────────

interface CellInputProps {
  item: TfpAobGroundItem;
  colKey: ItemColKey;
  value: string;
  onChange: (val: string) => void;
  isCompleted: boolean;
}

const CellInput: React.FC<CellInputProps> = ({ item, colKey, value, onChange, isCompleted }) => {
  const cellDisabled = isDisabled(item, colKey);
  const disabled = cellDisabled || isCompleted;

  if (disabled) {
    // Disabled cell: parent <td> already has bg-slate-300 for hard-disabled
    // (template-locked) cells. The inner div is just a transparent spacer to
    // keep row height consistent with editable cells.
    return (
      <div
        className={cn(
          'w-full h-8',
          cellDisabled ? '' : 'rounded-sm bg-slate-50',
        )}
        aria-hidden="true"
        title={cellDisabled ? 'Cell tidak diisi (sesuai form resmi)' : undefined}
      />
    );
  }

  // Mode row: dropdown Auto/Manual for COS and ATS only
  if (isModeRow(item)) {
    const isCosInput = colKey === 'panel_cos_a03_input';
    const isAtsInput = colKey === 'panel_ats_a12_input';
    if (!isCosInput && !isAtsInput) {
      return <div className="w-full h-8" aria-hidden="true" />;
    }
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-8 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-medium',
          value === 'Auto'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200'
            : value === 'Manual'
              ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200'
              : 'bg-white border-slate-200 text-slate-700 focus:ring-slate-300',
        )}
      >
        <option value="">—</option>
        <option value="Auto">Auto</option>
        <option value="Manual">Manual</option>
      </select>
    );
  }

  // Suplai Aktif row: PLN/UPS for COS, PLN 1/PLN 2 for ATS
  if (isSuplaiRow(item)) {
    const isCosInput = colKey === 'panel_cos_a03_input';
    const isAtsInput = colKey === 'panel_ats_a12_input';
    if (!isCosInput && !isAtsInput) {
      return <div className="w-full h-8" aria-hidden="true" />;
    }
    const opts = isCosInput ? ['PLN', 'UPS'] : ['PLN 1', 'PLN 2'];
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-8 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-medium',
          value === 'PLN' || value === 'PLN 1'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200'
            : value === 'UPS' || value === 'PLN 2'
              ? 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-200'
              : 'bg-white border-slate-200 text-slate-700 focus:ring-slate-300',
        )}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  // Single-value rows: only panel_cos_a03_input is the active cell
  if (isSingleValueRow(item) && colKey !== 'panel_cos_a03_input') {
    return <div className="w-full h-8" aria-hidden="true" />;
  }

  // Default: free text input
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
    />
  );
};

// ─── Main component ────────────────────────────────────────────────────────

export const TfpAobGroundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<TfpAobGroundRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local editable state for items and facilities
  const [itemValues, setItemValues] = useState<Record<number, Record<ItemColKey, string>>>({});
  const [facilityValues, setFacilityValues] = useState<
    Record<number, { kondisi: string; keterangan: string }>
  >({});

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await tfpAobGroundService.getRecord(Number(id));
      setRecord(data);

      // Initialize local item values
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

      // Initialize local facility values
      const fv: Record<number, { kondisi: string; keterangan: string }> = {};
      data.facilities.forEach((f) => {
        fv[f.id] = {
          kondisi: f.kondisi ?? 'Baik',
          keterangan: f.keterangan ?? '',
        };
      });
      setFacilityValues(fv);
    } catch {
      setErrorMessage('Gagal memuat data form. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  // Refresh on window focus (same pattern as Work Order)
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
        kondisi: facilityValues[f.id]?.kondisi ?? null,
        keterangan: facilityValues[f.id]?.keterangan ?? null,
      }));

      const updated = await tfpAobGroundService.updateRecord(record.id, {
        items: itemsPayload,
        facilities: facilitiesPayload,
      });
      setRecord(updated);
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
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-medium">{record.day_name ?? ''}</span>
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Clock size={13} className="text-slate-400" />
              <span>{record.time_filled ?? '—'}</span>
            </div>
            <ShiftBadge shift={record.shift_type} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi TFP</span>
            </div>
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
              {record.manager?.name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Supervisor TFP
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor?.name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
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
      </div>

      {/* Error / Success messages */}
      {errorMessage && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* ─── Unified table: parameters (left) + facilities (right) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
          <Zap size={16} className="text-amber-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Parameter Kelistrikan & Kondisi Fasilitas
          </h2>
          <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <CheckSquare size={12} className="inline mr-1 -mt-0.5 text-sky-600" />
            Mengikuti format form resmi
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1100px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '36px' }} />   {/* No */}
              <col style={{ width: '160px' }} />  {/* Parameter */}
              <col style={{ width: '60px' }} />   {/* COS Input */}
              <col style={{ width: '60px' }} />   {/* COS Output */}
              <col style={{ width: '60px' }} />   {/* ATS Input */}
              <col style={{ width: '60px' }} />   {/* ATS Output */}
              <col style={{ width: '60px' }} />   {/* UPS A Input */}
              <col style={{ width: '60px' }} />   {/* UPS A Output */}
              <col style={{ width: '60px' }} />   {/* UPS B Input */}
              <col style={{ width: '60px' }} />   {/* UPS B Output */}
              <col style={{ width: '180px' }} />  {/* Nama Fasilitas */}
              <col style={{ width: '120px' }} />  {/* Kondisi */}
              <col style={{ width: '180px' }} />  {/* Keterangan */}
            </colgroup>
            <thead>
              <tr className="bg-slate-800 text-white">
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600 align-middle">
                  No
                </th>
                <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-slate-600 align-middle">
                  Parameter
                </th>
                <th colSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600">
                  Panel COS (A 03)
                </th>
                <th colSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600">
                  Panel ATS (A 12)
                </th>
                <th colSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600">
                  UPS TESCOM A
                </th>
                <th colSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600">
                  UPS TESCOM B
                </th>
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600 align-middle bg-sky-700">
                  Nama Fasilitas
                </th>
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600 align-middle bg-sky-700">
                  Kondisi
                </th>
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-600 align-middle bg-sky-700">
                  Keterangan
                </th>
              </tr>
              <tr className="bg-slate-700 text-slate-200 italic">
                {['Input', 'Output', 'Input', 'Output', 'Input', 'Output', 'Input', 'Output'].map(
                  (lbl, i) => (
                    <th
                      key={i}
                      className="px-1 py-1 text-center font-medium border border-slate-600"
                    >
                      {lbl}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(record.items.length, record.facilities.length) }).map(
                (_, idx) => {
                  const item = record.items[idx] ?? null;
                  const facility = record.facilities[idx] ?? null;
                  const rowKondisi = facility ? facilityValues[facility.id]?.kondisi ?? 'Baik' : '';
                  return (
                    <tr
                      key={`row-${idx}`}
                      className={cn(
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                        item && (isModeRow(item) || isSuplaiRow(item)) ? 'bg-blue-50/60' : '',
                      )}
                    >
                      {/* No */}
                      <td className="px-2 py-1.5 text-slate-400 font-mono text-center border border-slate-200">
                        {item ? idx + 1 : ''}
                      </td>
                      {/* Parameter */}
                      <td className="px-3 py-1.5 font-medium text-slate-700 border border-slate-200">
                        {item ? (
                          <>
                            {item.parameter_name}
                            {item.unit && (
                              <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>
                            )}
                          </>
                        ) : null}
                      </td>
                      {/* 8 panel cells */}
                      {item
                        ? ALL_COL_KEYS.map((colKey) => {
                            const cellHardDisabled = isDisabled(item, colKey);
                            // Compute dynamic-disabled flag for Mode / Suplai / single-value rows
                            const cellDynamicDisabled =
                              (isModeRow(item) &&
                                colKey !== 'panel_cos_a03_input' &&
                                colKey !== 'panel_ats_a12_input') ||
                              (isSuplaiRow(item) &&
                                colKey !== 'panel_cos_a03_input' &&
                                colKey !== 'panel_ats_a12_input') ||
                              (isSingleValueRow(item) && colKey !== 'panel_cos_a03_input');
                            const greyCell = cellHardDisabled || cellDynamicDisabled;
                            return (
                              <td
                                key={colKey}
                                className={cn(
                                  'px-1.5 py-1 border border-slate-200',
                                  greyCell ? 'bg-slate-300' : '',
                                )}
                              >
                                <CellInput
                                  item={item}
                                  colKey={colKey}
                                  value={itemValues[item.id]?.[colKey] ?? ''}
                                  onChange={(val) => setItemCell(item.id, colKey, val)}
                                  isCompleted={isCompleted}
                                />
                              </td>
                            );
                          })
                        : Array.from({ length: 8 }).map((_, i) => (
                            <td key={`pad-${i}`} className="px-1.5 py-1 border border-slate-200" />
                          ))}
                      {/* Nama Fasilitas */}
                      <td className="px-2 py-1.5 text-xs font-medium text-slate-700 border border-slate-200">
                        {facility?.facility_name ?? ''}
                      </td>
                      {/* Kondisi */}
                      <td className="px-1 py-1 border border-slate-200">
                        {facility ? (
                          isCompleted ? (
                            <span
                              className={cn(
                                'text-xs font-semibold text-center block',
                                rowKondisi === 'Baik' || rowKondisi === 'Normal'
                                  ? 'text-emerald-700'
                                  : 'text-red-700',
                              )}
                            >
                              {rowKondisi || '—'}
                            </span>
                          ) : (
                            <select
                              value={rowKondisi}
                              onChange={(e) =>
                                setFacilityField(facility.id, 'kondisi', e.target.value)
                              }
                              className={cn(
                                'w-full h-8 px-1.5 text-xs rounded border-none focus:ring-1 focus:outline-none font-semibold',
                                rowKondisi === 'Baik' || rowKondisi === 'Normal'
                                  ? 'bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                                  : 'bg-red-50 text-red-700 focus:ring-red-200',
                              )}
                            >
                              <option value="Baik">Baik</option>
                              <option value="Normal">Normal</option>
                              <option value="Tidak Baik">Tidak Baik</option>
                            </select>
                          )
                        ) : null}
                      </td>
                      {/* Keterangan */}
                      <td className="px-2 py-1 border border-slate-200">
                        {facility ? (
                          isCompleted ? (
                            <span className="text-xs text-slate-600">
                              {facilityValues[facility.id]?.keterangan || '—'}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={facilityValues[facility.id]?.keterangan ?? ''}
                              onChange={(e) =>
                                setFacilityField(facility.id, 'keterangan', e.target.value)
                              }
                              placeholder="Keterangan..."
                              className="h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none w-full"
                            />
                          )
                        ) : null}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

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
      <TfpAobGroundSignaturePanel
        record={record}
        onUpdated={(updated) => {
          setRecord(updated);
          // Re-sync local state from updated record
          const iv: Record<number, Record<ItemColKey, string>> = {};
          updated.items.forEach((item) => {
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
        }}
      />
    </div>
  );
};
