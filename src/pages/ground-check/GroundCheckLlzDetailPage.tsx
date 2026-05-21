import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Check,
  ClipboardCheck,
  Clock,
  ImagePlus,
  Loader2,
  Printer,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Tabs } from '@/components/common/Tabs';
import { groundCheckLlzService } from '@/services/groundCheckLlzService';
import { GroundCheckLlzSignaturePanel } from './components/GroundCheckLlzSignaturePanel';
import { GroundCheckLlzPerformanceChart } from './components/GroundCheckLlzPerformanceChart';
import type {
  GroundCheckLlzCurvePoint,
  GroundCheckLlzItem,
  GroundCheckLlzPhoto,
  GroundCheckLlzRecordDetail,
} from '@/types/groundCheckLlz';
import type { ShiftType } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

interface ItemEditState {
  calibration_result: string;
  tolerance: string;
  tx1_hasil_pd: string;
  tx1_in_tolerance: string;
  tx1_out_of_tolerance: string;
  tx2_hasil_pd: string;
  tx2_in_tolerance: string;
  tx2_out_of_tolerance: string;
  keterangan: string;
}

type CurveTxField =
  | 'ddm_pct' | 'ddm_ua' | 'sum_pct' | 'mod_90hz' | 'mod_150hz' | 'rf_level_db';
const CURVE_FIELDS: CurveTxField[] = ['ddm_pct', 'ddm_ua', 'sum_pct', 'mod_90hz', 'mod_150hz', 'rf_level_db'];
const CURVE_FIELD_LABELS: Record<CurveTxField, string> = {
  ddm_pct:     'DDM (%)',
  ddm_ua:      'DDM (µA)',
  sum_pct:     'SUM (%)',
  mod_90hz:    'MOD 90 Hz',
  mod_150hz:   'MOD 150 Hz',
  rf_level_db: 'RF LEVEL (dB)',
};

type CurveEditState = Record<CurveTxField, string>;

interface CurvePointEditState {
  tx1: CurveEditState;
  tx2: CurveEditState;
}

const currentTimeHHmm = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const TOGGLE_VALUE = '✓';

// ─── Cell Widgets ──────────────────────────────────────────────────────────

interface HasilPdCellProps {
  item: GroundCheckLlzItem;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

const HasilPdCell: React.FC<HasilPdCellProps> = ({ item, value, onChange, disabled }) => {
  if (disabled) {
    return <span className="text-xs text-slate-700">{value || '—'}</span>;
  }
  if (item.input_type === 'numeric') {
    return (
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full h-8 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className="w-full h-8 px-1.5 text-xs rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
    />
  );
};

interface ToggleCellProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  variant: 'in' | 'out';
}

const ToggleCell: React.FC<ToggleCellProps> = ({ value, onChange, disabled, variant }) => {
  const active = value === TOGGLE_VALUE;
  const colors = variant === 'in'
    ? (active ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600')
    : (active ? 'bg-red-500 border-red-600 text-white shadow-sm'        : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600');

  if (disabled && !active) return <span className="inline-block w-7 h-7 text-slate-300 text-xs leading-7 text-center">—</span>;
  if (disabled && active) return <Check size={14} className="mx-auto text-emerald-600" />;

  return (
    <button
      type="button"
      onClick={() => onChange(active ? '' : TOGGLE_VALUE)}
      title={active ? 'Klik untuk hapus' : 'Klik untuk centang'}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-400 ${colors}`}
    >
      {active ? '✓' : '—'}
    </button>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

export const GroundCheckLlzDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<GroundCheckLlzRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pengujian');

  // Editable metadata
  const [equipmentLocation, setEquipmentLocation] = useState('');
  const [equipmentFunction, setEquipmentFunction] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [identification, setIdentification] = useState('');
  const [lastCalibration, setLastCalibration] = useState('');
  const [timeFilled, setTimeFilled] = useState<string>(currentTimeHHmm());

  // Form 2 metadata
  const [curveFacility, setCurveFacility] = useState('');
  const [curveMerk, setCurveMerk] = useState('');
  const [curveIdentFreq, setCurveIdentFreq] = useState('');
  const [curveJarakAnt, setCurveJarakAnt] = useState('');

  // Editable item values (Form 1)
  const [itemValues, setItemValues] = useState<Record<number, ItemEditState>>({});
  // Editable curve point values (Form 2)
  const [curveValues, setCurveValues] = useState<Record<number, CurvePointEditState>>({});

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await groundCheckLlzService.getDetail(Number(id));
      setRecord(data);
      setEquipmentLocation(data.equipment_location ?? '');
      setEquipmentFunction(data.equipment_function ?? '');
      setTechnicalData(data.technical_data ?? '');
      setIdentification(data.identification ?? '');
      setLastCalibration(data.last_calibration ?? '');
      setTimeFilled(data.time_filled && data.time_filled.trim() !== '' ? data.time_filled : currentTimeHHmm());
      setCurveFacility(data.curve_facility ?? '');
      setCurveMerk(data.curve_merk ?? '');
      setCurveIdentFreq(data.curve_ident_freq ?? '');
      setCurveJarakAnt(data.curve_jarak_ant ?? '');

      const iv: Record<number, ItemEditState> = {};
      data.items.forEach((item) => {
        iv[item.id] = {
          calibration_result: item.calibration_result ?? '',
          tolerance: item.tolerance ?? '',
          tx1_hasil_pd: item.tx1_hasil_pd ?? '',
          tx1_in_tolerance: item.tx1_in_tolerance ?? '',
          tx1_out_of_tolerance: item.tx1_out_of_tolerance ?? '',
          tx2_hasil_pd: item.tx2_hasil_pd ?? '',
          tx2_in_tolerance: item.tx2_in_tolerance ?? '',
          tx2_out_of_tolerance: item.tx2_out_of_tolerance ?? '',
          keterangan: item.keterangan ?? '',
        };
      });
      setItemValues(iv);

      const cv: Record<number, CurvePointEditState> = {};
      data.curve_points.forEach((p) => {
        cv[p.id] = {
          tx1: {
            ddm_pct:     p.tx1_ddm_pct     != null ? String(p.tx1_ddm_pct)     : '',
            ddm_ua:      p.tx1_ddm_ua      != null ? String(p.tx1_ddm_ua)      : '',
            sum_pct:     p.tx1_sum_pct     != null ? String(p.tx1_sum_pct)     : '',
            mod_90hz:    p.tx1_mod_90hz    != null ? String(p.tx1_mod_90hz)    : '',
            mod_150hz:   p.tx1_mod_150hz   != null ? String(p.tx1_mod_150hz)   : '',
            rf_level_db: p.tx1_rf_level_db != null ? String(p.tx1_rf_level_db) : '',
          },
          tx2: {
            ddm_pct:     p.tx2_ddm_pct     != null ? String(p.tx2_ddm_pct)     : '',
            ddm_ua:      p.tx2_ddm_ua      != null ? String(p.tx2_ddm_ua)      : '',
            sum_pct:     p.tx2_sum_pct     != null ? String(p.tx2_sum_pct)     : '',
            mod_90hz:    p.tx2_mod_90hz    != null ? String(p.tx2_mod_90hz)    : '',
            mod_150hz:   p.tx2_mod_150hz   != null ? String(p.tx2_mod_150hz)   : '',
            rf_level_db: p.tx2_rf_level_db != null ? String(p.tx2_rf_level_db) : '',
          },
        };
      });
      setCurveValues(cv);
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

  /**
   * Build a live preview record by merging server state with in-progress edits.
   * Used so the chart updates in real-time as the user types.
   */
  const livePreview = useMemo((): GroundCheckLlzRecordDetail | null => {
    if (!record) return null;
    const parseNum = (s: string): number | null => {
      if (!s.trim()) return null;
      const n = parseFloat(s.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    return {
      ...record,
      curve_points: record.curve_points.map((p) => {
        const v = curveValues[p.id];
        if (!v) return p;
        return {
          ...p,
          tx1_ddm_pct:     parseNum(v.tx1.ddm_pct),
          tx1_ddm_ua:      parseNum(v.tx1.ddm_ua),
          tx1_sum_pct:     parseNum(v.tx1.sum_pct),
          tx1_mod_90hz:    parseNum(v.tx1.mod_90hz),
          tx1_mod_150hz:   parseNum(v.tx1.mod_150hz),
          tx1_rf_level_db: parseNum(v.tx1.rf_level_db),
          tx2_ddm_pct:     parseNum(v.tx2.ddm_pct),
          tx2_ddm_ua:      parseNum(v.tx2.ddm_ua),
          tx2_sum_pct:     parseNum(v.tx2.sum_pct),
          tx2_mod_90hz:    parseNum(v.tx2.mod_90hz),
          tx2_mod_150hz:   parseNum(v.tx2.mod_150hz),
          tx2_rf_level_db: parseNum(v.tx2.rf_level_db),
        };
      }),
    };
  }, [record, curveValues]);

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items
        .filter((item) => !item.is_header && !item.is_subheader && !item.is_disabled)
        .map((item) => ({
          id: item.id,
          calibration_result: itemValues[item.id]?.calibration_result || null,
          tolerance: itemValues[item.id]?.tolerance || null,
          tx1_hasil_pd: itemValues[item.id]?.tx1_hasil_pd || null,
          tx1_in_tolerance: itemValues[item.id]?.tx1_in_tolerance || null,
          tx1_out_of_tolerance: itemValues[item.id]?.tx1_out_of_tolerance || null,
          tx2_hasil_pd: itemValues[item.id]?.tx2_hasil_pd || null,
          tx2_in_tolerance: itemValues[item.id]?.tx2_in_tolerance || null,
          tx2_out_of_tolerance: itemValues[item.id]?.tx2_out_of_tolerance || null,
          keterangan: itemValues[item.id]?.keterangan || null,
        }));

      const parseNum = (s: string): number | null => {
        if (!s.trim()) return null;
        const n = parseFloat(s.replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      };

      const curvePayload = record.curve_points.map((p) => {
        const v = curveValues[p.id];
        return {
          id: p.id,
          tx1_ddm_pct:     parseNum(v?.tx1.ddm_pct ?? ''),
          tx1_ddm_ua:      parseNum(v?.tx1.ddm_ua ?? ''),
          tx1_sum_pct:     parseNum(v?.tx1.sum_pct ?? ''),
          tx1_mod_90hz:    parseNum(v?.tx1.mod_90hz ?? ''),
          tx1_mod_150hz:   parseNum(v?.tx1.mod_150hz ?? ''),
          tx1_rf_level_db: parseNum(v?.tx1.rf_level_db ?? ''),
          tx2_ddm_pct:     parseNum(v?.tx2.ddm_pct ?? ''),
          tx2_ddm_ua:      parseNum(v?.tx2.ddm_ua ?? ''),
          tx2_sum_pct:     parseNum(v?.tx2.sum_pct ?? ''),
          tx2_mod_90hz:    parseNum(v?.tx2.mod_90hz ?? ''),
          tx2_mod_150hz:   parseNum(v?.tx2.mod_150hz ?? ''),
          tx2_rf_level_db: parseNum(v?.tx2.rf_level_db ?? ''),
        };
      });

      const result = await groundCheckLlzService.update(record.id, {
        equipment_location: equipmentLocation || null,
        equipment_function: equipmentFunction || null,
        technical_data: technicalData || null,
        identification: identification || null,
        last_calibration: lastCalibration || null,
        time_filled: timeFilled || null,
        curve_facility: curveFacility || null,
        curve_merk: curveMerk || null,
        curve_ident_freq: curveIdentFreq || null,
        curve_jarak_ant: curveJarakAnt || null,
        items: itemsPayload,
        curve_points: curvePayload,
      });
      setRecord(result.data);
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

  const setItemField = (itemId: number, field: keyof ItemEditState, val: string) => {
    setItemValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: val },
    }));
  };

  const setCurveField = (pointId: number, tx: 'tx1' | 'tx2', field: CurveTxField, val: string) => {
    setCurveValues((prev) => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [tx]: { ...prev[pointId][tx], [field]: val },
      },
    }));
  };

  // ─── Photo handlers ─────────────────────────────────────────────────────

  const handleSelectPhoto = () => { fileInputRef.current?.click(); };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record) return;

    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('File harus berupa gambar (JPG/PNG).');
      e.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Ukuran file maksimal 8 MB.');
      e.target.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const result = await groundCheckLlzService.uploadPhoto(record.id, file, photoCaption || null);
      setRecord(result.data);
      setPhotoCaption('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setPhotoError(data.message ?? 'Gagal mengunggah foto.');
      } else {
        setPhotoError('Gagal mengunggah foto. Coba lagi.');
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!record) return;
    if (!confirm('Hapus foto ini?')) return;
    setDeletingPhotoId(photoId);
    setPhotoError(null);
    try {
      const result = await groundCheckLlzService.deletePhoto(record.id, photoId);
      setRecord(result.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setPhotoError(data.message ?? 'Gagal menghapus foto.');
      } else {
        setPhotoError('Gagal menghapus foto.');
      }
    } finally {
      setDeletingPhotoId(null);
    }
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

  if (!record || !livePreview) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-slate-500">Form tidak ditemukan.</p>
        <Button onClick={() => navigate('/ground-check/llz')} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/ground-check')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Ground Check
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/ground-check/llz')} className="hover:text-slate-700 transition-colors">Localizer</button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">
                  Pengujian Berkala di Darat — ILS LOCALIZER
                </h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ground Check &nbsp;·&nbsp;
                <span className="font-mono">{record.form_number}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-medium">{record.day_name ?? ''}</span>
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg" title="Waktu pengisian — boleh diedit manual">
              <Clock size={13} className="text-slate-400" />
              {isCompleted ? (
                <span>{record.time_filled ?? '—'}</span>
              ) : (
                <input
                  type="time"
                  value={timeFilled}
                  onChange={(e) => setTimeFilled(e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-medium text-slate-700 focus:outline-none focus:ring-0 w-[58px]"
                  aria-label="Waktu pengisian"
                />
              )}
            </div>
            <ShiftBadge shift={record.shift_type as ShiftType} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/ground-check/llz/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
              <Printer size={15} /> Print
            </Button>
            {!isCompleted && (
              <Button size="sm" className="gap-1.5" onClick={() => void handleSave()} disabled={isSaving} isLoading={isSaving}>
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
              {record.manager_name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Supervisor</span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor_name ?? <span className="text-slate-400 italic">Tidak ditugaskan</span>}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Teknisi Pelaksana</span>
            <p className="mt-0.5 font-medium text-slate-700">
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

      {/* Metadata section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Informasi Peralatan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <InfoCell label="Laporan Bulan" value={record.report_month} />
          <InfoCell label="Bandara" value={record.airport} />
          <InfoCell label="Nama Peralatan" value={record.equipment_name} />
          <EditableMeta label="Lokasi Peralatan" value={equipmentLocation} onChange={setEquipmentLocation} disabled={isCompleted} placeholder="Contoh: SHELTER LOCALIZER" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableMeta label="Fungsi Peralatan" value={equipmentFunction} onChange={setEquipmentFunction} disabled={isCompleted} />
          <EditableMeta label="Data Teknis" value={technicalData} onChange={setTechnicalData} disabled={isCompleted} placeholder="Contoh: ALAT BANTU" />
          <EditableMeta label="Identification" value={identification} onChange={setIdentification} disabled={isCompleted} placeholder="Contoh: ISBY" />
          <EditableMeta label="Kalibrasi Terakhir" value={lastCalibration} onChange={setLastCalibration} disabled={isCompleted} placeholder="Tanggal terakhir kalibrasi" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { key: 'pengujian',   label: 'Pengujian Berkala',  icon: <ClipboardCheck size={15} /> },
          { key: 'curve',       label: 'Performance Curve',  icon: <Activity size={15} /> },
          { key: 'photos',      label: `Foto (${record.photos?.length ?? 0})`, icon: <ImagePlus size={15} /> },
        ]}
        defaultKey="pengujian"
        onChange={setActiveTab}
      />

      {activeTab === 'pengujian' && (
        <Form1ParameterTable
          record={record}
          itemValues={itemValues}
          setItemField={setItemField}
          isCompleted={isCompleted}
          isSaving={isSaving}
          onSave={() => void handleSave()}
        />
      )}

      {activeTab === 'curve' && (
        <PerformanceCurveSection
          record={livePreview}
          curveValues={curveValues}
          setCurveField={setCurveField}
          curveFacility={curveFacility} setCurveFacility={setCurveFacility}
          curveMerk={curveMerk} setCurveMerk={setCurveMerk}
          curveIdentFreq={curveIdentFreq} setCurveIdentFreq={setCurveIdentFreq}
          curveJarakAnt={curveJarakAnt} setCurveJarakAnt={setCurveJarakAnt}
          isCompleted={isCompleted}
          isSaving={isSaving}
          onSave={() => void handleSave()}
        />
      )}

      {activeTab === 'photos' && (
        <PhotoSection
          photos={record.photos ?? []}
          canEdit={!isCompleted}
          isUploading={isUploadingPhoto}
          deletingPhotoId={deletingPhotoId}
          caption={photoCaption}
          setCaption={setPhotoCaption}
          onSelect={handleSelectPhoto}
          onDelete={handleDeletePhoto}
          error={photoError}
          fileInputRef={fileInputRef}
          onFileChange={handlePhotoFileChange}
        />
      )}

      <GroundCheckLlzSignaturePanel
        record={record}
        onSignSuccess={(updated) => setRecord(updated)}
      />
    </div>
  );
};

// ─── Form 1 Parameter Table ────────────────────────────────────────────────

interface Form1Props {
  record: GroundCheckLlzRecordDetail;
  itemValues: Record<number, ItemEditState>;
  setItemField: (itemId: number, field: keyof ItemEditState, val: string) => void;
  isCompleted: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const Form1ParameterTable: React.FC<Form1Props> = ({ record, itemValues, setItemField, isCompleted, isSaving, onSave }) => {
  let itemNumber = 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Form 1 — Parameter Pengujian Berkala</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hasil Kalibrasi sudah diisi dari standar awal (boleh diedit). <span className="font-medium text-slate-700">Hasil PD TX1/TX2</span> diisi manual.
          </p>
        </div>
        {!isCompleted && (
          <Button size="sm" className="gap-2" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
            <Save size={14} /> Simpan Perubahan
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle w-10 text-[11px] uppercase tracking-wider">No</th>
              <th rowSpan={3} className="px-3 py-2 text-left   font-semibold border border-slate-200 align-middle min-w-[260px] text-[11px] uppercase tracking-wider">Parameter</th>
              <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle min-w-[120px] text-[11px] uppercase tracking-wider">Hasil Pengukuran<br/>Setelah Kalibrasi</th>
              <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle min-w-[120px] text-[11px] uppercase tracking-wider">Toleransi</th>
              <th colSpan={6} className="px-2 py-1 text-center font-semibold border border-slate-200 text-[11px] uppercase tracking-wider">Pengujian di Darat</th>
              <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle min-w-[120px] text-[11px] uppercase tracking-wider">Keterangan</th>
            </tr>
            <tr className="bg-white text-slate-600">
              <th colSpan={3} className="px-2 py-1 text-center font-medium border border-slate-200 text-[11px] tracking-wider">TX1</th>
              <th colSpan={3} className="px-2 py-1 text-center font-medium border border-slate-200 text-[11px] tracking-wider">TX2</th>
            </tr>
            <tr className="bg-slate-50/70 text-slate-500">
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[90px]">Hasil PD</th>
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[56px]">In Tol.</th>
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[56px]">Out Tol.</th>
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[90px]">Hasil PD</th>
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[56px]">In Tol.</th>
              <th className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[56px]">Out Tol.</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((item) => {
              // Top section banner
              if (item.is_header) {
                return (
                  <tr key={item.id} className="bg-slate-100">
                    <td colSpan={11} className="px-3 py-2 text-xs font-bold text-slate-800 border-b border-slate-200 uppercase tracking-wider">
                      {item.parameter_name}
                    </td>
                  </tr>
                );
              }
              // Sub-section banner (BUILT IN TEST / SENSITIVITY / RADIATION)
              if (item.is_subheader) {
                return (
                  <tr key={item.id} className="bg-slate-50">
                    <td colSpan={11} className="px-3 py-1.5 text-xs font-semibold text-slate-700 italic border-b border-slate-200 uppercase tracking-wide pl-6">
                      {item.parameter_name}
                    </td>
                  </tr>
                );
              }

              const isDisabled = item.is_disabled;
              if (!isDisabled) itemNumber++;
              const rowBase = isDisabled ? 'bg-slate-50/60' : (itemNumber % 2 === 0 ? 'bg-white' : 'bg-slate-50/40');
              const vals = itemValues[item.id];
              const editDisabled = isCompleted || isDisabled;

              return (
                <tr key={item.id} className={`${rowBase} ${isDisabled ? 'text-slate-400' : 'hover:bg-slate-50 transition-colors'}`}>
                  <td className="px-2 py-1.5 text-slate-400 font-mono text-center border-r border-slate-100">{item.item_code ?? ''}</td>
                  <td className={`px-3 py-1.5 font-medium border-r border-slate-100 ${isDisabled ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                    {item.parameter_name}
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    {editDisabled ? (
                      <span className="text-xs">{vals?.calibration_result || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={vals?.calibration_result ?? ''}
                        onChange={(e) => setItemField(item.id, 'calibration_result', e.target.value)}
                        placeholder="—"
                        className="w-full h-8 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100 whitespace-pre-line text-[10px]">{item.tolerance ?? '—'}</td>

                  {/* TX1 */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <HasilPdCell item={item} value={vals?.tx1_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx1_hasil_pd', v)} disabled={editDisabled} />
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx1_in_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_in_tolerance', v)} disabled={editDisabled} variant="in" />
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx1_out_of_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_out_of_tolerance', v)} disabled={editDisabled} variant="out" />
                  </td>

                  {/* TX2 */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <HasilPdCell item={item} value={vals?.tx2_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx2_hasil_pd', v)} disabled={editDisabled} />
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx2_in_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx2_in_tolerance', v)} disabled={editDisabled} variant="in" />
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx2_out_of_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx2_out_of_tolerance', v)} disabled={editDisabled} variant="out" />
                  </td>

                  <td className="px-1 py-1">
                    {editDisabled ? (
                      <span className="text-xs text-slate-700">{vals?.keterangan || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={vals?.keterangan ?? ''}
                        onChange={(e) => setItemField(item.id, 'keterangan', e.target.value)}
                        className="w-full h-8 px-1.5 text-xs rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Form 2 Performance Curve Section ─────────────────────────────────────

interface CurveSectionProps {
  record: GroundCheckLlzRecordDetail;
  curveValues: Record<number, CurvePointEditState>;
  setCurveField: (pointId: number, tx: 'tx1' | 'tx2', field: CurveTxField, val: string) => void;
  curveFacility: string;    setCurveFacility: (v: string) => void;
  curveMerk: string;        setCurveMerk: (v: string) => void;
  curveIdentFreq: string;   setCurveIdentFreq: (v: string) => void;
  curveJarakAnt: string;    setCurveJarakAnt: (v: string) => void;
  isCompleted: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const PerformanceCurveSection: React.FC<CurveSectionProps> = ({
  record, curveValues, setCurveField,
  curveFacility, setCurveFacility, curveMerk, setCurveMerk,
  curveIdentFreq, setCurveIdentFreq, curveJarakAnt, setCurveJarakAnt,
  isCompleted, isSaving, onSave,
}) => {
  const sideGroups: { side: '90hz' | 'center' | '150hz'; label: string; points: GroundCheckLlzCurvePoint[] }[] = [
    { side: '90hz',   label: '90 HZ SIDE',  points: record.curve_points.filter((p) => p.side === '90hz') },
    { side: 'center', label: 'CENTER (0°)', points: record.curve_points.filter((p) => p.side === 'center') },
    { side: '150hz',  label: '150 HZ SIDE', points: record.curve_points.filter((p) => p.side === '150hz') },
  ];

  return (
    <div className="space-y-5">
      {/* Form 2 metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-bold text-slate-800">Groundcheck Performance Curve — Header</h2>
          {!isCompleted && (
            <Button size="sm" className="gap-2" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
              <Save size={14} /> Simpan Perubahan
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <InlineMetaField label="Fasilitas"        value={curveFacility}  onChange={setCurveFacility}  disabled={isCompleted} />
          <InlineMetaField label="Merk"             value={curveMerk}      onChange={setCurveMerk}      disabled={isCompleted} placeholder="Mopiens 520" />
          <InlineMetaField label="Ident-Freq"       value={curveIdentFreq} onChange={setCurveIdentFreq} disabled={isCompleted} placeholder="ISBY - 110.10 MHz" />
          <InlineMetaField label="Jarak Dari Ant"   value={curveJarakAnt}  onChange={setCurveJarakAnt}  disabled={isCompleted} placeholder="300 M" />
        </div>
      </div>

      {/* Measurement table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800">Form 2 — Hasil Pengukuran TX1 / TX2</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            JARAK & DEGRESS adalah titik pengukuran standar (read-only). Isi nilai TX1 & TX2 di tiap baris.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-200 w-14 uppercase tracking-wider">JARAK<br/>(M)</th>
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-200 w-16 uppercase tracking-wider">DEGRESS<br/>(°)</th>
                <th colSpan={6} className="px-2 py-1 text-center font-semibold border border-slate-200 uppercase tracking-wider">TX 1</th>
                <th colSpan={6} className="px-2 py-1 text-center font-semibold border border-slate-200 uppercase tracking-wider">TX 2</th>
              </tr>
              <tr className="bg-slate-50/70 text-slate-500">
                {CURVE_FIELDS.map((f) => (
                  <th key={`tx1-${f}`} className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[68px]">{CURVE_FIELD_LABELS[f]}</th>
                ))}
                {CURVE_FIELDS.map((f) => (
                  <th key={`tx2-${f}`} className="px-1 py-1 text-center font-medium border border-slate-200 text-[10px] min-w-[68px]">{CURVE_FIELD_LABELS[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sideGroups.map((grp) => (
                <React.Fragment key={grp.side}>
                  <tr className="bg-slate-100">
                    <td colSpan={14} className="px-3 py-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200">
                      {grp.label}
                    </td>
                  </tr>
                  {grp.points.map((p) => {
                    const v = curveValues[p.id];
                    return (
                      <tr key={p.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-1 text-center font-mono text-slate-700 border-r border-slate-100">{Number(p.jarak_m).toFixed(p.jarak_m % 1 === 0 ? 0 : 1)}</td>
                        <td className="px-2 py-1 text-center font-mono text-slate-700 border-r border-slate-100">{Number(p.degrees).toFixed(p.degrees % 1 === 0 ? 0 : 2)}°</td>
                        {CURVE_FIELDS.map((f) => (
                          <td key={`tx1-${p.id}-${f}`} className="px-1 py-1 border-r border-slate-100">
                            {isCompleted ? (
                              <span className="text-[11px] font-mono text-slate-700 block text-center">{v?.tx1[f] || '—'}</span>
                            ) : (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={v?.tx1[f] ?? ''}
                                onChange={(e) => setCurveField(p.id, 'tx1', f, e.target.value)}
                                placeholder="—"
                                className="w-full h-7 px-1 text-center text-[11px] font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                              />
                            )}
                          </td>
                        ))}
                        {CURVE_FIELDS.map((f) => (
                          <td key={`tx2-${p.id}-${f}`} className="px-1 py-1 border-r border-slate-100">
                            {isCompleted ? (
                              <span className="text-[11px] font-mono text-slate-700 block text-center">{v?.tx2[f] || '—'}</span>
                            ) : (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={v?.tx2[f] ?? ''}
                                onChange={(e) => setCurveField(p.id, 'tx2', f, e.target.value)}
                                placeholder="—"
                                className="w-full h-7 px-1 text-center text-[11px] font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-generated charts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Ground Performance Curve (auto-generated)</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Plot otomatis dari kolom <span className="font-mono font-semibold">DDM (%)</span> di tabel Form 2.
            X-axis = sudut bertanda (negatif untuk 90 Hz SIDE, positif untuk 150 Hz SIDE), Y-axis = nilai DDM (%).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/30">
            <GroundCheckLlzPerformanceChart curvePoints={record.curve_points} tx="tx1" distance={record.curve_jarak_ant ?? '300 Meter'} />
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/30">
            <GroundCheckLlzPerformanceChart curvePoints={record.curve_points} tx="tx2" distance={record.curve_jarak_ant ?? '300 Meter'} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Small subcomponents ───────────────────────────────────────────────────

const InfoCell: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div>
    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{label}</span>
    <p className="mt-0.5 font-medium text-slate-700">{value ?? '—'}</p>
  </div>
);

interface EditableMetaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const EditableMeta: React.FC<EditableMetaProps> = ({ label, value, onChange, disabled, placeholder }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
    {disabled ? (
      <p className="text-xs text-slate-700">{value || '—'}</p>
    ) : (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none resize-y placeholder:text-slate-300"
      />
    )}
  </div>
);

interface InlineMetaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const InlineMetaField: React.FC<InlineMetaFieldProps> = ({ label, value, onChange, disabled, placeholder }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
    {disabled ? (
      <p className="text-xs text-slate-700">{value || '—'}</p>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
      />
    )}
  </div>
);

interface PhotoSectionProps {
  photos: GroundCheckLlzPhoto[];
  canEdit: boolean;
  isUploading: boolean;
  deletingPhotoId: number | null;
  caption: string;
  setCaption: (v: string) => void;
  onSelect: () => void;
  onDelete: (photoId: number) => void;
  error: string | null;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  photos, canEdit, isUploading, deletingPhotoId, caption, setCaption,
  onSelect, onDelete, error, fileInputRef, onFileChange,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-sm font-bold text-slate-800">Foto Dokumentasi Ground Check</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Lampirkan foto kegiatan ground check (shelter localizer, antena, monitoring, dll).
          Maks. 8 MB per foto, format JPG/PNG.
        </p>
      </div>
      {photos.length > 0 && (
        <span className="text-[11px] text-slate-500">{photos.length} foto</span>
      )}
    </div>

    {error && (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
    )}

    {canEdit && (
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption foto (opsional) — contoh: Shelter Localizer di ujung runway"
          maxLength={255}
          className="flex-1 h-10 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          onClick={onSelect}
          isLoading={isUploading}
          disabled={isUploading}
          className="gap-2 shrink-0"
        >
          {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {isUploading ? 'Mengunggah...' : 'Upload Foto'}
        </Button>
      </div>
    )}

    {photos.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
          <ImagePlus size={20} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">Belum ada foto dokumentasi.</p>
        {canEdit && <p className="text-[11px] text-slate-400 mt-1">Klik tombol Upload Foto di atas untuk menambah lampiran.</p>}
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="group relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div className="aspect-[4/3] bg-slate-100">
              {p.url ? (
                <img src={p.url} alt={p.caption ?? p.original_name ?? 'Foto'} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No preview</div>
              )}
            </div>
            <div className="px-2 py-1.5 text-[11px] text-slate-600 bg-white border-t border-slate-100">
              <p className="line-clamp-2 leading-snug">{p.caption || p.original_name || '—'}</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                disabled={deletingPhotoId === p.id}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 text-slate-500 hover:text-red-600 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                title="Hapus foto"
              >
                {deletingPhotoId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
