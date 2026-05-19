import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Check,
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
import { groundCheckAdcService } from '@/services/groundCheckAdcService';
import { GroundCheckAdcSignaturePanel } from './components/GroundCheckAdcSignaturePanel';
import type {
  GroundCheckAdcInputType,
  GroundCheckAdcItem,
  GroundCheckAdcPhoto,
  GroundCheckAdcRecordDetail,
} from '@/types/groundCheckAdc';
import type { ShiftType } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

interface ItemEditState {
  calibration_result: string;
  tx1_hasil_pd: string;
  tx1_in_tolerance: string;
  tx1_out_of_tolerance: string;
  tx2_hasil_pd: string;
  tx2_in_tolerance: string;
  tx2_out_of_tolerance: string;
  keterangan: string;
}

/** Return current HH:MM in local time, e.g. "14:35". */
const currentTimeHHmm = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const TOGGLE_VALUE = '✓';

const dropdownOptions = (type: GroundCheckAdcInputType): { value: string; label: string }[] => {
  switch (type) {
    case 'dropdown_function':
      return [
        { value: 'Berfungsi', label: 'Berfungsi' },
        { value: 'Tidak Berfungsi', label: 'Tidak Berfungsi' },
      ];
    case 'dropdown_quality':
      return [
        { value: 'Baik', label: 'Baik' },
        { value: 'Tidak Baik', label: 'Tidak Baik' },
      ];
    case 'dropdown_clarity':
      return [
        { value: 'Clear', label: 'Clear' },
        { value: 'Tidak Clear', label: 'Tidak Clear' },
      ];
    default:
      return [];
  }
};

// ─── Cell Widgets ──────────────────────────────────────────────────────────

interface HasilPdCellProps {
  item: GroundCheckAdcItem;
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
  if (
    item.input_type === 'dropdown_function' ||
    item.input_type === 'dropdown_quality' ||
    item.input_type === 'dropdown_clarity'
  ) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-1 text-xs rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none"
      >
        <option value="">—</option>
        {dropdownOptions(item.input_type).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  // text fallback
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
  /** Visual variant for in-tolerance (emerald) vs out-of-tolerance (red). */
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

export const GroundCheckAdcDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<GroundCheckAdcRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable metadata fields
  const [equipmentFunction, setEquipmentFunction] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [lastCalibration, setLastCalibration] = useState('');
  // Time pengisian — default ke real-time saat form dibuka, teknisi boleh edit manual.
  const [timeFilled, setTimeFilled] = useState<string>(currentTimeHHmm());

  // Editable item values
  const [itemValues, setItemValues] = useState<Record<number, ItemEditState>>({});

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
      const data = await groundCheckAdcService.getDetail(Number(id));
      setRecord(data);
      setEquipmentFunction(data.equipment_function ?? '');
      setTechnicalData(data.technical_data ?? '');
      setLastCalibration(data.last_calibration ?? '');
      // Pakai time_filled dari server kalau ada (sudah pernah disimpan), kalau
      // belum ada (record baru / belum pernah disimpan) → real-time saat form dibuka.
      setTimeFilled(data.time_filled && data.time_filled.trim() !== '' ? data.time_filled : currentTimeHHmm());

      const iv: Record<number, ItemEditState> = {};
      data.items.forEach((item) => {
        iv[item.id] = {
          calibration_result: item.calibration_result ?? '',
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

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items
        .filter((item) => !item.is_header)
        .map((item) => ({
          id: item.id,
          calibration_result: itemValues[item.id]?.calibration_result || null,
          tx1_hasil_pd: itemValues[item.id]?.tx1_hasil_pd || null,
          tx1_in_tolerance: itemValues[item.id]?.tx1_in_tolerance || null,
          tx1_out_of_tolerance: itemValues[item.id]?.tx1_out_of_tolerance || null,
          tx2_hasil_pd: itemValues[item.id]?.tx2_hasil_pd || null,
          tx2_in_tolerance: itemValues[item.id]?.tx2_in_tolerance || null,
          tx2_out_of_tolerance: itemValues[item.id]?.tx2_out_of_tolerance || null,
          keterangan: itemValues[item.id]?.keterangan || null,
        }));

      const result = await groundCheckAdcService.update(record.id, {
        equipment_function: equipmentFunction || null,
        technical_data: technicalData || null,
        last_calibration: lastCalibration || null,
        time_filled: timeFilled || null,
        items: itemsPayload,
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

  // ─── Photo handlers ─────────────────────────────────────────────────────

  const handleSelectPhoto = () => {
    fileInputRef.current?.click();
  };

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
      const result = await groundCheckAdcService.uploadPhoto(record.id, file, photoCaption || null);
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
      const result = await groundCheckAdcService.deletePhoto(record.id, photoId);
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
        <Button onClick={() => navigate('/ground-check/adc')} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';
  let itemNumber = 0;

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/ground-check')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Ground Check
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/ground-check/adc')} className="hover:text-slate-700 transition-colors">ADC</button>
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
                  Pengujian Berkala di Darat — ADC
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/ground-check/adc/${record.id}/print`)} className="gap-1.5 text-indigo-600 hover:bg-indigo-50">
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
          <InfoCell label="Lokasi Peralatan" value={record.equipment_location} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <EditableMeta label="Fungsi Peralatan" value={equipmentFunction} onChange={setEquipmentFunction} disabled={isCompleted} placeholder="Contoh: ADC PRIMARY" />
          <EditableMeta label="Data Teknis" value={technicalData} onChange={setTechnicalData} disabled={isCompleted} placeholder="Contoh: FREQ. 118.3 MHz" />
          <EditableMeta label="Kalibrasi Terakhir" value={lastCalibration} onChange={setLastCalibration} disabled={isCompleted} placeholder="Tanggal / informasi kalibrasi terakhir" />
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Parameter Pengujian</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Isi <span className="font-medium text-slate-700">Hasil PD</span> untuk TX1 / TX2. Centang <span className="text-emerald-600 font-semibold">In Tol.</span> bila dalam toleransi, atau <span className="text-red-600 font-semibold">Out Tol.</span> bila di luar toleransi.
            </p>
          </div>
          {!isCompleted && (
            <Button size="sm" className="gap-2" onClick={() => void handleSave()} disabled={isSaving} isLoading={isSaving}>
              <Save size={14} /> Simpan Perubahan
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[960px]">
            <thead>
              {/* Minimalist header — putih/abu-abu terang, teks gelap, border tipis */}
              <tr className="bg-slate-50 text-slate-700">
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle w-10 text-[11px] uppercase tracking-wider">No</th>
                <th rowSpan={3} className="px-3 py-2 text-left   font-semibold border border-slate-200 align-middle min-w-[180px] text-[11px] uppercase tracking-wider">Parameter</th>
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle min-w-[110px] text-[11px] uppercase tracking-wider">Hasil Kalibrasi</th>
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-slate-200 align-middle min-w-[90px]  text-[11px] uppercase tracking-wider">Toleransi</th>
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

                itemNumber++;
                const rowBase = itemNumber % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
                const vals = itemValues[item.id];

                return (
                  <tr key={item.id} className={`${rowBase} hover:bg-slate-50 transition-colors`}>
                    <td className="px-2 py-1.5 text-slate-400 font-mono text-center border-r border-slate-100">{itemNumber}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-700 border-r border-slate-100">
                      <span className="text-[10px] text-slate-400 mr-1">{item.item_code}.</span>
                      {item.parameter_name}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.calibration_result || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={vals?.calibration_result ?? ''}
                          onChange={(e) => setItemField(item.id, 'calibration_result', e.target.value)}
                          placeholder="—"
                          title="Nilai default dari standar awal — boleh diedit jika ada kalibrasi ulang"
                          className="w-full h-8 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:outline-none placeholder:text-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100">{item.tolerance ?? '—'}</td>

                    {/* TX1 */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      <HasilPdCell item={item} value={vals?.tx1_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx1_hasil_pd', v)} disabled={isCompleted} />
                    </td>
                    <td className="px-1 py-1 text-center border-r border-slate-100">
                      <ToggleCell value={vals?.tx1_in_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_in_tolerance', v)} disabled={isCompleted} variant="in" />
                    </td>
                    <td className="px-1 py-1 text-center border-r border-slate-100">
                      <ToggleCell value={vals?.tx1_out_of_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx1_out_of_tolerance', v)} disabled={isCompleted} variant="out" />
                    </td>

                    {/* TX2 */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      <HasilPdCell item={item} value={vals?.tx2_hasil_pd ?? ''} onChange={(v) => setItemField(item.id, 'tx2_hasil_pd', v)} disabled={isCompleted} />
                    </td>
                    <td className="px-1 py-1 text-center border-r border-slate-100">
                      <ToggleCell value={vals?.tx2_in_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx2_in_tolerance', v)} disabled={isCompleted} variant="in" />
                    </td>
                    <td className="px-1 py-1 text-center border-r border-slate-100">
                      <ToggleCell value={vals?.tx2_out_of_tolerance ?? ''} onChange={(v) => setItemField(item.id, 'tx2_out_of_tolerance', v)} disabled={isCompleted} variant="out" />
                    </td>

                    {/* Keterangan */}
                    <td className="px-1 py-1">
                      {isCompleted ? (
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

      {/* Photo upload section */}
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

      {/* Signature Panel */}
      <GroundCheckAdcSignaturePanel
        record={record}
        onSignSuccess={(updated) => setRecord(updated)}
      />
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

interface PhotoSectionProps {
  photos: GroundCheckAdcPhoto[];
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
          Lampirkan foto kegiatan ground check (transmitter, receiver, console, recording, dll).
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
          placeholder="Caption foto (opsional) — contoh: Ground check console di cabin tower"
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
