import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, ArrowLeft, Save, Printer, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { groundingReportService } from '@/services/groundingReportService';
import { GroundingReportSignaturePanel } from './components/GroundingReportSignaturePanel';
import type { GroundingReportDetail, GroundingReportItem } from '@/types/grounding';
import type { ShiftType } from '@/types';

export const GroundingReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<GroundingReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<GroundingReportItem[]>([]);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await groundingReportService.getRecord(Number(id));
      setRecord(data);
      setLocalItems(data.items);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data laporan Grounding.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  const handleItemChange = (itemId: number, field: 'availability' | 'condition' | 'notes', value: string | null) => {
    setLocalItems((prev) => prev.map((it) => it.id === itemId ? { ...it, [field]: value } : it));
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload = localItems.map((it) => ({
        id: it.id,
        availability: it.availability,
        condition: it.condition,
        notes: it.notes,
      }));
      const updated = await groundingReportService.updateRecord(record.id, { items: payload });
      setRecord(updated);
      setLocalItems(updated.items);
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordUpdate = (updated: GroundingReportDetail) => {
    setRecord(updated);
    setLocalItems(updated.items);
  };

  const isCompleted = record?.status === 'completed';
  const visualItems = localItems.filter((it) => it.section_name === 'VISUAL');
  const measurementItems = localItems.filter((it) => it.section_name === 'PENGUKURAN');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-red-600">{errorMessage ?? 'Laporan tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/grounding')} className="mt-4">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/grounding')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Laporan Grounding
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{record.report_number}</span>
      </div>

      {/* Header */}
      <PageHeader
        icon={Zap}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-700"
        title={`Laporan Grounding — ${record.report_number}`}
        subtitle={`${record.equipment_name} | ${record.equipment_location}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/grounding/reports/${record.id}/print`)} className="gap-2">
              <Printer size={15} /> Print
            </Button>
            {!isCompleted && (
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={15} /> Simpan Perubahan
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
      {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={12} /> Tanggal</div>
          <p className="text-sm font-semibold text-slate-800">{record.date}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="text-xs text-slate-500">Shift</div>
          <ShiftBadge shift={record.shift_type as ShiftType} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} /> Kantor Unit Kerja</div>
          <p className="text-sm font-medium text-slate-800">{record.work_unit}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Users size={12} /> Teknisi TFP</div>
          <p className="text-sm font-semibold text-slate-800">{record.technicians.length} orang</p>
        </div>
      </div>

      {/* Status + personnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <StatusBadge status={record.status} variant="pill" />
        {record.time_filled && <span className="text-xs text-slate-500">Jam: <strong className="text-slate-700">{record.time_filled}</strong></span>}
        <span className="text-xs text-slate-500">Manager: <strong className="text-slate-700">{record.manager?.name ?? 'Tidak ditugaskan'}</strong></span>
        <span className="text-xs text-slate-500">Supervisor: <strong className="text-slate-700">{record.supervisor?.name ?? 'Tidak ditugaskan'}</strong></span>
      </div>

      {/* Checklist Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-slate-800">Checklist Fasilitas dan Peralatan</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pemeliharaan Sistem Penangkal Petir dan Sistem Pembumian</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="border border-gray-200 px-3 py-2 text-center w-10 text-xs font-medium text-slate-500 uppercase">No</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item Pemeriksaan</th>
                <th className="border border-gray-200 px-3 py-2 text-center w-32 text-xs font-medium text-slate-500 uppercase">Ketersediaan</th>
                <th className="border border-gray-200 px-3 py-2 text-center w-32 text-xs font-medium text-slate-500 uppercase">Kondisi</th>
                <th className="border border-gray-200 px-3 py-2 text-left w-48 text-xs font-medium text-slate-500 uppercase">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {/* VISUAL section */}
              <tr>
                <td colSpan={5} className="bg-green-50 border border-gray-200 px-4 py-2 text-xs font-bold text-green-800 uppercase tracking-wider">
                  VISUAL
                </td>
              </tr>
              {visualItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center text-slate-500">{item.item_number}</td>
                  <td className="border border-gray-200 px-3 py-2 text-slate-700">{item.item_name}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <select
                      value={item.availability ?? ''}
                      onChange={(e) => handleItemChange(item.id, 'availability', e.target.value || null)}
                      disabled={isCompleted}
                      className="w-full h-8 rounded border border-gray-200 text-xs text-center bg-white disabled:bg-gray-50 disabled:text-slate-400"
                    >
                      <option value="">—</option>
                      <option value="Ada">Ada</option>
                      <option value="Tidak Ada">Tidak Ada</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <select
                      value={item.condition ?? ''}
                      onChange={(e) => handleItemChange(item.id, 'condition', e.target.value || null)}
                      disabled={isCompleted}
                      className="w-full h-8 rounded border border-gray-200 text-xs text-center bg-white disabled:bg-gray-50 disabled:text-slate-400"
                    >
                      <option value="">—</option>
                      <option value="Baik">Baik</option>
                      <option value="Tidak Baik">Tidak Baik</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={item.notes ?? ''}
                      onChange={(e) => handleItemChange(item.id, 'notes', e.target.value || null)}
                      disabled={isCompleted}
                      className="w-full h-8 rounded border border-gray-200 text-xs px-2 bg-white disabled:bg-gray-50 disabled:text-slate-400"
                      placeholder="Keterangan..."
                    />
                  </td>
                </tr>
              ))}

              {/* PENGUKURAN section */}
              <tr>
                <td colSpan={5} className="bg-green-50 border border-gray-200 px-4 py-2 text-xs font-bold text-green-800 uppercase tracking-wider">
                  PENGUKURAN
                </td>
              </tr>
              {/* Sub-header for measurement */}
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-slate-500">No</td>
                <td className="border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-500">Item Pemeriksaan</td>
                <td className="border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-slate-500">Standard</td>
                <td className="border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-slate-500">Kondisi</td>
                <td className="border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-500">Catatan / Keterangan</td>
              </tr>
              {measurementItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center text-slate-500">{item.item_number}</td>
                  <td className="border border-gray-200 px-3 py-2 text-slate-700">{item.item_name}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-500 font-mono">{item.standard ?? '—'}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <select
                      value={item.condition ?? ''}
                      onChange={(e) => handleItemChange(item.id, 'condition', e.target.value || null)}
                      disabled={isCompleted}
                      className="w-full h-8 rounded border border-gray-200 text-xs text-center bg-white disabled:bg-gray-50 disabled:text-slate-400"
                    >
                      <option value="">—</option>
                      <option value="Baik">Baik</option>
                      <option value="Tidak Baik">Tidak Baik</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={item.notes ?? ''}
                      onChange={(e) => handleItemChange(item.id, 'notes', e.target.value || null)}
                      disabled={isCompleted}
                      className="w-full h-8 rounded border border-gray-200 text-xs px-2 bg-white disabled:bg-gray-50 disabled:text-slate-400"
                      placeholder="Keterangan..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Panel */}
      <GroundingReportSignaturePanel record={record} onUpdated={handleRecordUpdate} />
    </div>
  );
};
