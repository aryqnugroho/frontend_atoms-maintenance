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
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { groundCheckAdcService } from '@/services/groundCheckAdcService';
import { GroundCheckAdcSignaturePanel } from './components/GroundCheckAdcSignaturePanel';
import type { GroundCheckAdcRecordDetail } from '@/types/groundCheckAdc';
import type { ShiftType } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

interface ItemEditState {
  tx1_hasil_pd: string;
  tx1_in_tolerance: string;
  tx1_out_of_tolerance: string;
  tx2_hasil_pd: string;
  tx2_in_tolerance: string;
  tx2_out_of_tolerance: string;
  keterangan: string;
}

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

  // Editable item values
  const [itemValues, setItemValues] = useState<Record<number, ItemEditState>>({});

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await groundCheckAdcService.getDetail(Number(id));
      setRecord(data);
      setEquipmentFunction(data.equipment_function ?? '');
      setTechnicalData(data.technical_data ?? '');
      setLastCalibration(data.last_calibration ?? '');

      const iv: Record<number, ItemEditState> = {};
      data.items.forEach((item) => {
        iv[item.id] = {
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

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  // Refresh on window focus
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

  // Count items (non-header) for numbering
  let itemNumber = 0;

  return (
    <div className="max-w-full space-y-6 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/ground-check')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          Ground Check
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/ground-check/adc')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          ADC
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
              onClick={() => navigate('/ground-check/adc')}
              className="hover:bg-slate-100 mt-0.5"
            >
              <ArrowLeft size={20} />
            </Button>
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
            <ShiftBadge shift={record.shift_type as ShiftType} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/ground-check/adc/${record.id}/print`)}
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
              {record.manager_name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Supervisor
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor_name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Teknisi Pelaksana
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

      {/* Metadata section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Informasi Peralatan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Laporan Bulan
            </span>
            <p className="mt-0.5 font-medium text-slate-700">{record.report_month ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Bandara
            </span>
            <p className="mt-0.5 font-medium text-slate-700">{record.airport ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Nama Peralatan
            </span>
            <p className="mt-0.5 font-medium text-slate-700">{record.equipment_name ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Lokasi Peralatan
            </span>
            <p className="mt-0.5 font-medium text-slate-700">{record.equipment_location ?? '—'}</p>
          </div>
        </div>

        {/* Editable metadata fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Fungsi Peralatan
            </label>
            {isCompleted ? (
              <p className="text-xs text-slate-700">{equipmentFunction || '—'}</p>
            ) : (
              <textarea
                value={equipmentFunction}
                onChange={(e) => setEquipmentFunction(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none resize-y"
                placeholder="Fungsi peralatan..."
              />
            )}
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Data Teknis
            </label>
            {isCompleted ? (
              <p className="text-xs text-slate-700">{technicalData || '—'}</p>
            ) : (
              <textarea
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none resize-y"
                placeholder="Data teknis..."
              />
            )}
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Kalibrasi Terakhir
            </label>
            {isCompleted ? (
              <p className="text-xs text-slate-700">{lastCalibration || '—'}</p>
            ) : (
              <textarea
                value={lastCalibration}
                onChange={(e) => setLastCalibration(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none resize-y"
                placeholder="Kalibrasi terakhir..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800">Parameter Pengujian</h2>
          {!isCompleted && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => void handleSave()}
              disabled={isSaving}
              isLoading={isSaving}
            >
              <Save size={14} />
              Simpan Perubahan
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-sky-800 text-white">
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-sky-700 align-middle w-10">
                  No
                </th>
                <th rowSpan={3} className="px-3 py-2 text-left font-semibold border border-sky-700 align-middle min-w-[160px]">
                  Parameter
                </th>
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-sky-700 align-middle min-w-[100px]">
                  Hasil Pengukuran Setelah Kalibrasi
                </th>
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-sky-700 align-middle min-w-[80px]">
                  Toleransi
                </th>
                <th colSpan={6} className="px-2 py-1 text-center font-semibold border border-sky-700">
                  Pengujian di Darat
                </th>
                <th rowSpan={3} className="px-2 py-2 text-center font-semibold border border-sky-700 align-middle min-w-[100px]">
                  Keterangan
                </th>
              </tr>
              <tr className="bg-sky-700 text-sky-100">
                <th colSpan={3} className="px-2 py-1 text-center font-medium border border-sky-600 text-[11px]">
                  TX1
                </th>
                <th colSpan={3} className="px-2 py-1 text-center font-medium border border-sky-600 text-[11px]">
                  TX2
                </th>
              </tr>
              <tr className="bg-sky-600 text-sky-100">
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[70px]">
                  Hasil PD
                </th>
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[60px]">
                  In Tol.
                </th>
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[60px]">
                  Out Tol.
                </th>
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[70px]">
                  Hasil PD
                </th>
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[60px]">
                  In Tol.
                </th>
                <th className="px-1 py-1 text-center font-medium border border-sky-500 text-[10px] min-w-[60px]">
                  Out Tol.
                </th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item) => {
                // Section header row
                if (item.is_header) {
                  return (
                    <tr key={item.id} className="bg-slate-100">
                      <td
                        colSpan={11}
                        className="px-3 py-2 text-xs font-bold text-slate-800 border-b border-slate-200"
                      >
                        {item.parameter_name}
                      </td>
                    </tr>
                  );
                }

                itemNumber++;
                const rowBase = itemNumber % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
                const vals = itemValues[item.id];

                return (
                  <tr key={item.id} className={rowBase}>
                    <td className="px-2 py-1.5 text-slate-400 font-mono text-center border-r border-slate-100">
                      {itemNumber}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-slate-700 border-r border-slate-100">
                      {item.parameter_name}
                    </td>
                    <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100">
                      {item.calibration_result ?? '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100">
                      {item.tolerance ?? '—'}
                    </td>
                    {/* TX1 Hasil PD */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx1_hasil_pd || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={vals?.tx1_hasil_pd ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx1_hasil_pd', e.target.value)}
                          className="w-full h-7 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        />
                      )}
                    </td>
                    {/* TX1 In Tolerance */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx1_in_tolerance || ''}</span>
                      ) : (
                        <select
                          value={vals?.tx1_in_tolerance ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx1_in_tolerance', e.target.value)}
                          className="w-full h-7 px-1 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        >
                          <option value="">—</option>
                          <option value="√">√</option>
                        </select>
                      )}
                    </td>
                    {/* TX1 Out of Tolerance */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx1_out_of_tolerance || ''}</span>
                      ) : (
                        <select
                          value={vals?.tx1_out_of_tolerance ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx1_out_of_tolerance', e.target.value)}
                          className="w-full h-7 px-1 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        >
                          <option value="">—</option>
                          <option value="√">√</option>
                        </select>
                      )}
                    </td>
                    {/* TX2 Hasil PD */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx2_hasil_pd || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={vals?.tx2_hasil_pd ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx2_hasil_pd', e.target.value)}
                          className="w-full h-7 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        />
                      )}
                    </td>
                    {/* TX2 In Tolerance */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx2_in_tolerance || ''}</span>
                      ) : (
                        <select
                          value={vals?.tx2_in_tolerance ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx2_in_tolerance', e.target.value)}
                          className="w-full h-7 px-1 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        >
                          <option value="">—</option>
                          <option value="√">√</option>
                        </select>
                      )}
                    </td>
                    {/* TX2 Out of Tolerance */}
                    <td className="px-1 py-1 border-r border-slate-100">
                      {isCompleted ? (
                        <span className="text-xs text-slate-700">{vals?.tx2_out_of_tolerance || ''}</span>
                      ) : (
                        <select
                          value={vals?.tx2_out_of_tolerance ?? ''}
                          onChange={(e) => setItemField(item.id, 'tx2_out_of_tolerance', e.target.value)}
                          className="w-full h-7 px-1 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        >
                          <option value="">—</option>
                          <option value="√">√</option>
                        </select>
                      )}
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
                          className="w-full h-7 px-1.5 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
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

      {/* Signature Panel */}
      <GroundCheckAdcSignaturePanel
        record={record}
        onSignSuccess={(updated) => setRecord(updated)}
      />
    </div>
  );
};
