import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Check,
  ClipboardCheck,
  Clock,
  Compass,
  Gauge,
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
import { groundCheckDvorService } from '@/services/groundCheckDvorService';
import { GroundCheckDvorSignaturePanel } from './components/GroundCheckDvorSignaturePanel';
import { GroundCheckDvorErrorChart } from './components/GroundCheckDvorErrorChart';
import {
  computeDvorError,
  type GroundCheckDvorBearingPoint,
  type GroundCheckDvorItem,
  type GroundCheckDvorPhoto,
  type GroundCheckDvorRecordDetail,
} from '@/types/groundCheckDvor';
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

interface NavItemEditState {
  ref_tx1_value: string;
  ref_tx2_value: string;
  eq_tx1_value: string;
  eq_tx2_value: string;
}

interface BearingEditState {
  tx1_reading: string;
  tx1_value: string;
  tx2_reading: string;
  tx2_value: string;
}

const currentTimeHHmm = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const TOGGLE_VALUE = '✓';

const parseNum = (s: string): number | null => {
  if (s === '' || s === null || s === undefined) return null;
  const cleaned = s.replace(',', '.').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '+') return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

const fmtNum = (n: number | null, digits = 2): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return n.toFixed(digits);
};

// ─── Cell Widgets ──────────────────────────────────────────────────────────

interface HasilPdCellProps {
  item: GroundCheckDvorItem;
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

export const GroundCheckDvorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<GroundCheckDvorRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('bearing');

  // Editable metadata
  const [equipmentLocation, setEquipmentLocation] = useState('');
  const [equipmentFunction, setEquipmentFunction] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [identification, setIdentification] = useState('');
  const [lastCalibration, setLastCalibration] = useState('');
  const [timeFilled, setTimeFilled] = useState<string>(currentTimeHHmm());

  // Form 1 metadata
  const [vorEquipmentName, setVorEquipmentName] = useState('');
  const [vorFrequency, setVorFrequency] = useState('');
  const [vorStation, setVorStation] = useState('');

  // Form 2 metadata
  const [curveOrganization, setCurveOrganization] = useState('');

  // Form 4 metadata
  const [navAnalyzerTitle, setNavAnalyzerTitle] = useState('');
  const [note, setNote] = useState('');

  // Editable item values
  const [itemValues, setItemValues] = useState<Record<number, ItemEditState>>({});
  const [navItemValues, setNavItemValues] = useState<Record<number, NavItemEditState>>({});
  const [bearingValues, setBearingValues] = useState<Record<number, BearingEditState>>({});

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
      const data = await groundCheckDvorService.getDetail(Number(id));
      setRecord(data);
      setEquipmentLocation(data.equipment_location ?? '');
      setEquipmentFunction(data.equipment_function ?? '');
      setTechnicalData(data.technical_data ?? '');
      setIdentification(data.identification ?? '');
      setLastCalibration(data.last_calibration ?? '');
      setTimeFilled(data.time_filled && data.time_filled.trim() !== '' ? data.time_filled : currentTimeHHmm());
      setVorEquipmentName(data.vor_equipment_name ?? '');
      setVorFrequency(data.vor_frequency ?? '');
      setVorStation(data.vor_station ?? '');
      setCurveOrganization(data.curve_organization ?? '');
      setNavAnalyzerTitle(data.nav_analyzer_title ?? '');
      setNote(data.note ?? '');

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

      const nv: Record<number, NavItemEditState> = {};
      data.nav_items.forEach((n) => {
        nv[n.id] = {
          ref_tx1_value: n.ref_tx1_value ?? '',
          ref_tx2_value: n.ref_tx2_value ?? '',
          eq_tx1_value: n.eq_tx1_value ?? '',
          eq_tx2_value: n.eq_tx2_value ?? '',
        };
      });
      setNavItemValues(nv);

      const bv: Record<number, BearingEditState> = {};
      data.bearing_points.forEach((p) => {
        bv[p.id] = {
          tx1_reading: p.tx1_reading !== null && p.tx1_reading !== undefined ? String(p.tx1_reading) : '',
          tx1_value: p.tx1_value ?? '',
          tx2_reading: p.tx2_reading !== null && p.tx2_reading !== undefined ? String(p.tx2_reading) : '',
          tx2_value: p.tx2_value ?? '',
        };
      });
      setBearingValues(bv);
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

  // Merge in-progress bearing edits into curve preview points (live chart update)
  const livePoints: GroundCheckDvorBearingPoint[] = useMemo(() => {
    if (!record) return [];
    return record.bearing_points.map((p) => {
      const edit = bearingValues[p.id];
      if (!edit) return p;
      const tx1Reading = parseNum(edit.tx1_reading);
      const tx2Reading = parseNum(edit.tx2_reading);
      return {
        ...p,
        tx1_reading: tx1Reading,
        tx1_error: computeDvorError(p.bearing, tx1Reading),
        tx1_value: edit.tx1_value || null,
        tx2_reading: tx2Reading,
        tx2_error: computeDvorError(p.bearing, tx2Reading),
        tx2_value: edit.tx2_value || null,
      };
    });
  }, [record, bearingValues]);

  // Statistics from current edits
  const stats = useMemo(() => {
    const tx1Errors = livePoints.map((p) => p.tx1_error).filter((v): v is number => v !== null);
    const tx2Errors = livePoints.map((p) => p.tx2_error).filter((v): v is number => v !== null);
    const calc = (arr: number[]) => {
      if (arr.length === 0) return { min: null as number | null, max: null as number | null, spread: null as number | null };
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), spread: Number((max - min).toFixed(2)) };
    };
    const tx1 = calc(tx1Errors);
    const tx2 = calc(tx2Errors);
    const differential = tx1.min !== null && tx2.min !== null
      ? Number((Math.abs(tx1.min) - Math.abs(tx2.min)).toFixed(2)) // commonly seen value matches a difference of magnitudes
      : null;
    return { tx1, tx2, differential };
  }, [livePoints]);

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items
        .filter((item) => !item.is_header && !item.is_subheader && !item.is_disabled)
        .map((item) => {
          if (item.is_check_only) {
            return {
              id: item.id,
              calibration_result: itemValues[item.id]?.calibration_result || null,
              tx1_in_tolerance: itemValues[item.id]?.tx1_in_tolerance || null,
              tx1_out_of_tolerance: itemValues[item.id]?.tx1_out_of_tolerance || null,
              tx2_in_tolerance: itemValues[item.id]?.tx2_in_tolerance || null,
              tx2_out_of_tolerance: itemValues[item.id]?.tx2_out_of_tolerance || null,
              keterangan: itemValues[item.id]?.keterangan || null,
            };
          }
          return {
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
          };
        });

      const navPayload = record.nav_items
        .filter((n) => !n.is_section_header)
        .map((n) => ({
          id: n.id,
          ref_tx1_value: navItemValues[n.id]?.ref_tx1_value || null,
          ref_tx2_value: navItemValues[n.id]?.ref_tx2_value || null,
          eq_tx1_value: navItemValues[n.id]?.eq_tx1_value || null,
          eq_tx2_value: navItemValues[n.id]?.eq_tx2_value || null,
        }));

      const bearingPayload = record.bearing_points.map((p) => {
        const edit = bearingValues[p.id];
        const tx1Reading = parseNum(edit?.tx1_reading ?? '');
        const tx2Reading = parseNum(edit?.tx2_reading ?? '');
        return {
          id: p.id,
          tx1_reading: tx1Reading,
          tx1_error: computeDvorError(p.bearing, tx1Reading),
          tx1_value: edit?.tx1_value || null,
          tx2_reading: tx2Reading,
          tx2_error: computeDvorError(p.bearing, tx2Reading),
          tx2_value: edit?.tx2_value || null,
        };
      });

      const result = await groundCheckDvorService.update(record.id, {
        equipment_location: equipmentLocation || null,
        equipment_function: equipmentFunction || null,
        technical_data: technicalData || null,
        identification: identification || null,
        last_calibration: lastCalibration || null,
        time_filled: timeFilled || null,
        vor_equipment_name: vorEquipmentName || null,
        vor_frequency: vorFrequency || null,
        vor_station: vorStation || null,
        curve_organization: curveOrganization || null,
        nav_analyzer_title: navAnalyzerTitle || null,
        note: note || null,
        bearing_points: bearingPayload,
        items: itemsPayload,
        nav_items: navPayload,
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
    setItemValues((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }));
  };
  const setNavField = (itemId: number, field: keyof NavItemEditState, val: string) => {
    setNavItemValues((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }));
  };
  const setBearingField = (pointId: number, field: keyof BearingEditState, val: string) => {
    setBearingValues((prev) => ({ ...prev, [pointId]: { ...prev[pointId], [field]: val } }));
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
      const result = await groundCheckDvorService.uploadPhoto(record.id, file, photoCaption || null);
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
      const result = await groundCheckDvorService.deletePhoto(record.id, photoId);
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

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-slate-500">Form tidak ditemukan.</p>
        <Button onClick={() => navigate('/ground-check/dvor')} className="mt-4">
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
        <button type="button" onClick={() => navigate('/ground-check/dvor')} className="hover:text-slate-700 transition-colors">DVOR</button>
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
                  Pengujian Berkala di Darat — DVOR
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/ground-check/dvor/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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
          <EditableMeta label="Lokasi Peralatan" value={equipmentLocation} onChange={setEquipmentLocation} disabled={isCompleted} placeholder="Contoh: AIRNAV SURABAYA" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableMeta label="Fungsi Peralatan" value={equipmentFunction} onChange={setEquipmentFunction} disabled={isCompleted} placeholder="Contoh: APPROACH" />
          <EditableMeta label="Data Teknis" value={technicalData} onChange={setTechnicalData} disabled={isCompleted} placeholder="Contoh: FREQ. = 113,4 Mhz" />
          <InlineMetaField label="Identification" value={identification} onChange={setIdentification} disabled={isCompleted} placeholder="Contoh: SBR" />
          <EditableMeta label="Kalibrasi Terakhir" value={lastCalibration} onChange={setLastCalibration} disabled={isCompleted} placeholder="Tanggal terakhir kalibrasi" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { key: 'bearing',     label: 'Bearing & Error Curve', icon: <Compass size={15} /> },
          { key: 'pengujian',   label: 'Pengujian Berkala',     icon: <ClipboardCheck size={15} /> },
          { key: 'nav',         label: 'NAV Analyzer',          icon: <Gauge size={15} /> },
          { key: 'photos',      label: `Foto (${record.photos?.length ?? 0})`, icon: <ImagePlus size={15} /> },
        ]}
        defaultKey="bearing"
        onChange={setActiveTab}
      />

      {activeTab === 'bearing' && (
        <BearingSection
          record={record}
          values={bearingValues}
          setField={setBearingField}
          stats={stats}
          livePoints={livePoints}
          vorEquipmentName={vorEquipmentName} setVorEquipmentName={setVorEquipmentName}
          vorFrequency={vorFrequency} setVorFrequency={setVorFrequency}
          vorStation={vorStation} setVorStation={setVorStation}
          curveOrganization={curveOrganization} setCurveOrganization={setCurveOrganization}
          isCompleted={isCompleted}
          isSaving={isSaving}
          onSave={() => void handleSave()}
        />
      )}

      {activeTab === 'pengujian' && (
        <Form3ParameterTable
          record={record}
          itemValues={itemValues}
          setItemField={setItemField}
          isCompleted={isCompleted}
          isSaving={isSaving}
          onSave={() => void handleSave()}
        />
      )}

      {activeTab === 'nav' && (
        <NavAnalyzerSection
          record={record}
          values={navItemValues}
          setField={setNavField}
          navAnalyzerTitle={navAnalyzerTitle} setNavAnalyzerTitle={setNavAnalyzerTitle}
          note={note} setNote={setNote}
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

      <GroundCheckDvorSignaturePanel
        record={record}
        onSignSuccess={(updated) => setRecord(updated)}
      />
    </div>
  );
};

// ─── Form 1 + Form 2: Bearing table & Error Curve ─────────────────────────

interface BearingSectionProps {
  record: GroundCheckDvorRecordDetail;
  values: Record<number, BearingEditState>;
  setField: (pointId: number, field: keyof BearingEditState, val: string) => void;
  stats: {
    tx1: { min: number | null; max: number | null; spread: number | null };
    tx2: { min: number | null; max: number | null; spread: number | null };
    differential: number | null;
  };
  livePoints: GroundCheckDvorBearingPoint[];
  vorEquipmentName: string; setVorEquipmentName: (v: string) => void;
  vorFrequency: string; setVorFrequency: (v: string) => void;
  vorStation: string; setVorStation: (v: string) => void;
  curveOrganization: string; setCurveOrganization: (v: string) => void;
  isCompleted: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const BearingSection: React.FC<BearingSectionProps> = ({
  record, values, setField, stats, livePoints,
  vorEquipmentName, setVorEquipmentName, vorFrequency, setVorFrequency, vorStation, setVorStation,
  curveOrganization, setCurveOrganization,
  isCompleted, isSaving, onSave,
}) => {
  return (
    <div className="space-y-5">
      {/* Header metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Header Form 1 — Ground Check VOR</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Editable: Nama Peralatan, Frequency, Station. Tanggal pelaksanaan otomatis dari header form.
            </p>
          </div>
          {!isCompleted && (
            <Button size="sm" className="gap-2" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
              <Save size={14} /> Simpan Perubahan
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <InlineMetaField label="Nama Peralatan (Form 1)" value={vorEquipmentName} onChange={setVorEquipmentName} disabled={isCompleted} placeholder="DVOR AWA VRB 52 D" />
          <InlineMetaField label="Frequency" value={vorFrequency} onChange={setVorFrequency} disabled={isCompleted} placeholder="113.4 MHZ" />
          <InlineMetaField label="Station" value={vorStation} onChange={setVorStation} disabled={isCompleted} placeholder="SBR" />
        </div>
        <div>
          <InlineMetaField label="Organisasi (Form 2 — Error Curve)" value={curveOrganization} onChange={setCurveOrganization} disabled={isCompleted} placeholder="PERUM LPPNPI KANTOR CABANG BANDARA JUANDA SURABAYA" />
        </div>
      </div>

      {/* Bearing table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800">Form 1 — Pengukuran Bearing (TX I &amp; TX II)</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bearing 0°..360° step 15°. Isi <strong>Reading</strong> manual dari instrumen; Error dihitung otomatis (Bearing − Reading_unwrapped). Min / Max / Spread / Differential di kaki tabel auto-update.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th colSpan={4} className="px-2 py-2 text-center font-semibold border border-slate-200 text-[11px] uppercase tracking-wider">TX I</th>
                <th colSpan={4} className="px-2 py-2 text-center font-semibold border border-slate-200 text-[11px] uppercase tracking-wider">TX II</th>
              </tr>
              <tr className="bg-white text-slate-600">
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[70px]">Bearing</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[90px]">Error</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[100px]">Reading</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[80px]">Value</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[70px]">Bearing</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[90px]">Error</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[100px]">Reading</th>
                <th className="px-1 py-1.5 text-center font-medium border border-slate-200 text-[10px] w-[80px]">Value</th>
              </tr>
            </thead>
            <tbody>
              {record.bearing_points.map((p) => {
                const live = livePoints.find((lp) => lp.id === p.id);
                const v = values[p.id];
                return (
                  <tr key={p.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-1 py-1 text-center border border-slate-100 font-mono text-slate-700">{p.bearing}</td>
                    <td className="px-1 py-1 text-center border border-slate-100 font-mono text-slate-700 bg-slate-50/50">
                      {fmtNum(live?.tx1_error ?? null) || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-1 py-1 border border-slate-100">
                      {isCompleted ? (
                        <span className="block text-center text-xs font-mono text-slate-700">{v?.tx1_reading || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={v?.tx1_reading ?? ''}
                          onChange={(e) => setField(p.id, 'tx1_reading', e.target.value)}
                          placeholder="—"
                          className="w-full h-7 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-1 py-1 border border-slate-100">
                      {isCompleted ? (
                        <span className="block text-center text-xs font-mono text-slate-700">{v?.tx1_value || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={v?.tx1_value ?? ''}
                          onChange={(e) => setField(p.id, 'tx1_value', e.target.value)}
                          placeholder=""
                          className="w-full h-7 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-1 py-1 text-center border border-slate-100 font-mono text-slate-700">{p.bearing}</td>
                    <td className="px-1 py-1 text-center border border-slate-100 font-mono text-slate-700 bg-slate-50/50">
                      {fmtNum(live?.tx2_error ?? null) || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-1 py-1 border border-slate-100">
                      {isCompleted ? (
                        <span className="block text-center text-xs font-mono text-slate-700">{v?.tx2_reading || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={v?.tx2_reading ?? ''}
                          onChange={(e) => setField(p.id, 'tx2_reading', e.target.value)}
                          placeholder="—"
                          className="w-full h-7 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-1 py-1 border border-slate-100">
                      {isCompleted ? (
                        <span className="block text-center text-xs font-mono text-slate-700">{v?.tx2_value || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={v?.tx2_value ?? ''}
                          onChange={(e) => setField(p.id, 'tx2_value', e.target.value)}
                          placeholder=""
                          className="w-full h-7 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Stats footer rows */}
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td className="px-2 py-1.5 text-center border border-slate-200">Min</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx1.min) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
                <td className="px-2 py-1.5 text-center border border-slate-200">Min</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx2.min) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
              </tr>
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td className="px-2 py-1.5 text-center border border-slate-200">Max</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx1.max) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
                <td className="px-2 py-1.5 text-center border border-slate-200">Max</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx2.max) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
              </tr>
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td className="px-2 py-1.5 text-center border border-slate-200">Spread</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx1.spread) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
                <td className="px-2 py-1.5 text-center border border-slate-200">Spread</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.tx2.spread) || '—'}</td>
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
              </tr>
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td colSpan={2} className="px-2 py-1.5 text-center border border-slate-200">Differential</td>
                <td className="px-2 py-1.5 text-center border border-slate-200 font-mono">{fmtNum(stats.differential) || '—'}</td>
                <td colSpan={5} className="px-2 py-1.5 text-center border border-slate-200 text-slate-300"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Error Curves */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Form 2 — Error Curve (auto-generated)</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Grafik di bawah tergenerate live berdasarkan nilai Error TX I / TX II di tabel Form 1.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <GroundCheckDvorErrorChart bearingPoints={livePoints} tx="tx1" />
          </div>
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <GroundCheckDvorErrorChart bearingPoints={livePoints} tx="tx2" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Form 3 Parameter Table ────────────────────────────────────────────────

interface Form3Props {
  record: GroundCheckDvorRecordDetail;
  itemValues: Record<number, ItemEditState>;
  setItemField: (itemId: number, field: keyof ItemEditState, val: string) => void;
  isCompleted: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const Form3ParameterTable: React.FC<Form3Props> = ({ record, itemValues, setItemField, isCompleted, isSaving, onSave }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Form 3 — Parameter Pengujian Berkala</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hasil Kalibrasi pre-filled dari standar (boleh diedit). <span className="font-medium text-slate-700">Hasil PD TX1/TX2</span> diisi manual. Baris check-only (item 8-12): hanya toggle IN/OUT TOL.
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
              <th rowSpan={3} className="px-3 py-2 text-left   font-semibold border border-slate-200 align-middle min-w-[240px] text-[11px] uppercase tracking-wider">Parameter</th>
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
              if (item.is_header) {
                return (
                  <tr key={item.id} className="bg-slate-100">
                    <td colSpan={11} className="px-3 py-2 text-xs font-bold text-slate-800 border-b border-slate-200 uppercase tracking-wider">
                      {item.parameter_name}
                    </td>
                  </tr>
                );
              }
              if (item.is_subheader) {
                return (
                  <tr key={item.id} className="bg-slate-50">
                    <td colSpan={11} className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 italic border-b border-slate-200 pl-6">
                      {item.parameter_name}
                    </td>
                  </tr>
                );
              }

              const isDisabled = item.is_disabled;
              const isCheckOnly = item.is_check_only;
              const rowBase = isDisabled ? 'bg-slate-50/60' : 'bg-white';
              const vals = itemValues[item.id];
              const editDisabled = isCompleted || isDisabled;

              return (
                <tr key={item.id} className={`${rowBase} ${isDisabled ? 'text-slate-400' : 'hover:bg-slate-50 transition-colors'}`}>
                  <td className="px-2 py-1.5 text-slate-400 font-mono text-center border-r border-slate-100">{item.item_code ?? ''}</td>
                  <td className={`px-3 py-1.5 font-medium border-r border-slate-100 ${isDisabled ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                    {item.subsection_name ? <span className="pl-3">{item.parameter_name}</span> : item.parameter_name}
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
                  <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100 whitespace-pre-line text-[10px] leading-tight">
                    {item.tolerance ?? (isDisabled ? '' : '—')}
                  </td>

                  {/* TX1 Hasil PD */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    {isCheckOnly ? (
                      <span className="block text-center text-slate-300 text-xs">—</span>
                    ) : (
                      <HasilPdCell item={item} value={vals?.tx1_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx1_hasil_pd', v)} disabled={editDisabled} />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx1_in_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_in_tolerance', v)} disabled={editDisabled} variant="in" />
                  </td>
                  <td className="px-1 py-1 text-center border-r border-slate-100">
                    <ToggleCell value={vals?.tx1_out_of_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_out_of_tolerance', v)} disabled={editDisabled} variant="out" />
                  </td>

                  {/* TX2 Hasil PD */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    {isCheckOnly ? (
                      <span className="block text-center text-slate-300 text-xs">—</span>
                    ) : (
                      <HasilPdCell item={item} value={vals?.tx2_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx2_hasil_pd', v)} disabled={editDisabled} />
                    )}
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

// ─── Form 4 NAV Analyzer Section ──────────────────────────────────────────

interface NavSectionProps {
  record: GroundCheckDvorRecordDetail;
  values: Record<number, NavItemEditState>;
  setField: (itemId: number, field: keyof NavItemEditState, val: string) => void;
  navAnalyzerTitle: string; setNavAnalyzerTitle: (v: string) => void;
  note: string; setNote: (v: string) => void;
  isCompleted: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const NavAnalyzerSection: React.FC<NavSectionProps> = ({
  record, values, setField,
  navAnalyzerTitle, setNavAnalyzerTitle, note, setNote,
  isCompleted, isSaving, onSave,
}) => {
  return (
    <div className="space-y-5">
      {/* Form 4 metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-bold text-slate-800">NAV Analyzer — Header</h2>
          {!isCompleted && (
            <Button size="sm" className="gap-2" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
              <Save size={14} /> Simpan Perubahan
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 text-xs">
          <InlineMetaField label="Title NAV Analyzer" value={navAnalyzerTitle} onChange={setNavAnalyzerTitle} disabled={isCompleted} placeholder="GROUND CHECK DVOR DENGAN PIR ROHDE & SCHWARZ" />
        </div>
      </div>

      {/* Measurement table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800">Form 4 — Pengukuran NAV Analyzer</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Isi nilai REFF TOWER (TX1/TX2) dan PERALATAN DVOR (TX1/TX2) untuk tiap parameter. Semua kolom dapat diisi; jika ada anomali catat di Note bawah tabel.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th rowSpan={2} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle w-12 text-[11px] uppercase tracking-wider">No</th>
                <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-slate-200 align-middle min-w-[200px] text-[11px] uppercase tracking-wider">Parameter</th>
                <th colSpan={2} className="px-2 py-1 text-center font-semibold border border-slate-200 text-[11px] uppercase tracking-wider">REFF Tower</th>
                <th colSpan={2} className="px-2 py-1 text-center font-semibold border border-slate-200 text-[11px] uppercase tracking-wider">Peralatan DVOR</th>
              </tr>
              <tr className="bg-white text-slate-600">
                <th className="px-2 py-1 text-center font-medium border border-slate-200 min-w-[110px] text-[10px]">Transmitter 1</th>
                <th className="px-2 py-1 text-center font-medium border border-slate-200 min-w-[110px] text-[10px]">Transmitter 2</th>
                <th className="px-2 py-1 text-center font-medium border border-slate-200 min-w-[110px] text-[10px]">Transmitter 1</th>
                <th className="px-2 py-1 text-center font-medium border border-slate-200 min-w-[110px] text-[10px]">Transmitter 2</th>
              </tr>
            </thead>
            <tbody>
              {record.nav_items.map((n) => {
                if (n.is_section_header) {
                  return (
                    <tr key={n.id} className="bg-slate-100">
                      <td colSpan={6} className="px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200">
                        {n.parameter_name}
                      </td>
                    </tr>
                  );
                }
                const v = values[n.id];
                return (
                  <tr key={n.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-1.5 text-slate-400 font-mono text-center border-r border-slate-100">{n.item_code ?? ''}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-700 border-r border-slate-100">{n.parameter_name}</td>
                    {(['ref_tx1_value', 'ref_tx2_value', 'eq_tx1_value', 'eq_tx2_value'] as const).map((field) => (
                      <td key={field} className="px-1 py-1 border-r border-slate-100">
                        {isCompleted ? (
                          <span className="block text-center text-xs font-mono text-slate-700">{v?.[field] || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={v?.[field] ?? ''}
                            onChange={(e) => setField(n.id, field, e.target.value)}
                            placeholder="—"
                            className="w-full h-8 px-1.5 text-center text-xs font-mono rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Note */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Note</label>
          {isCompleted ? (
            <p className="text-xs text-slate-700 whitespace-pre-line">{note || '—'}</p>
          ) : (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Contoh: terjadi anomali hasil pengukuran TX1 dari tower"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none resize-y placeholder:text-slate-300"
            />
          )}
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
  photos: GroundCheckDvorPhoto[];
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
          Lampirkan foto kegiatan ground check (shelter VOR, antena, monitoring, NAV analyzer, dll).
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
          placeholder="Caption foto (opsional) — contoh: Shelter VOR dengan NAV Analyzer"
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
