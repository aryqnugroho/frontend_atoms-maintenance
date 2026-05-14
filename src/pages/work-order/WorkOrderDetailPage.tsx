import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Clock, Calendar, Users as UsersIcon, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Badge } from '@/components/common/Badge';
import { Textarea } from '@/components/common/Textarea';
import { WorkOrderSignaturePanel } from '@/components/work-orders/WorkOrderSignaturePanel';
import { mockWorkOrders } from '@/data/mockData';
import { workOrderService, type UpdateWorkOrderPayload } from '@/services/workOrderService';
import { useAuth } from '@/hooks/useAuth';
import type { WorkOrder, CompletionStatus } from '@/types';

const outputLabels: Record<string, string> = {
  meter_reading: 'Meter Reading / Pengukuran',
  status_peralatan: 'Status Peralatan',
  logbook: 'Logbook',
  other: 'Lainnya',
};

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // API state
  const [wo, setWo] = useState<WorkOrder | undefined>(
    mockWorkOrders.find((w) => w.id === Number(id))
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await workOrderService.getWorkOrder(Number(id));
        setWo(data);
      } catch {
        // Fallback to mock data
        setWo(mockWorkOrders.find((w) => w.id === Number(id)));
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  // Check if user is a technician
  const isTechnician = user?.role === 'Teknisi CNSD' || user?.role === 'Teknisi TFP';
  
  // Feedback form state (for technicians)
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | ''>('');
  const [notesKendala, setNotesKendala] = useState('');
  const [notesUsulan, setNotesUsulan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!wo) return;
    setIsSaving(true);
    try {
      const updateData: UpdateWorkOrderPayload = {};
      if (completionStatus) updateData.completion_status = completionStatus;
      if (notesKendala) updateData.notes_kendala = notesKendala;
      if (notesUsulan) updateData.notes_usulan = notesUsulan;

      const updated = await workOrderService.updateWorkOrder(wo.id, updateData);
      setWo(updated);
      alert('Feedback berhasil disimpan!');
    } catch {
      alert('Gagal menyimpan feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !wo) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-slate-500">Work Order tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate('/work-orders')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')} className="gap-1">
            <ArrowLeft size={16} />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{wo.wo_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={wo.wo_type === 'shift' ? 'shift' : 'personal'}>
                {wo.wo_type === 'shift' ? '👥 WO Shift' : '👤 WO Personal'}
              </Badge>
              <Badge variant={wo.division === 'CNSD' ? 'cnsd' : 'tfp'}>{wo.division}</Badge>
              <StatusBadge status={wo.status} variant="pill" />
              <ShiftBadge shift={wo.shift_type} />
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/work-orders/${wo.id}/print`)}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* Section 1: Perintah */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-brand-primary">Bagian Atas — Perintah Kerja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Tertuju Kepada (Divisi)</p>
              <p className="text-sm font-medium text-slate-800">{wo.division}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Shift Dinas</p>
              <ShiftBadge shift={wo.shift_type} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Tanggal & Jam</p>
              <p className="text-sm flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {new Date(wo.shift_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Supervisor</p>
              <p className="text-sm font-medium text-slate-800">{wo.supervisor_name_snapshot || 'Tidak Ada'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-0.5">Deskripsi Perintah</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-gray-100">
              {wo.description}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Output Yang Diharapkan</p>
            <div className="flex flex-wrap gap-2">
              {wo.output_types.map((ot) => (
                <Badge key={ot} variant="default">{outputLabels[ot] || ot}</Badge>
              ))}
              {wo.output_other && <Badge variant="warning">{wo.output_other}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <WorkOrderSignaturePanel workOrder={wo} onWorkOrderUpdated={setWo} />

      {/* Section 2: Pelaksanaan (if any) */}
      {(wo.start_time || wo.completion_status || wo.notes_kendala) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-maintenance-wo">Bagian Bawah — Pelaksanaan / Catatan Pelaksana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wo.start_time && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Jam Mulai</p>
                  <p className="text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    {wo.start_time}
                  </p>
                </div>
              )}
              {wo.end_time && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Jam Selesai</p>
                  <p className="text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    {wo.end_time}
                  </p>
                </div>
              )}
              {wo.completion_status && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Hasil Pelaksanaan</p>
                  <StatusBadge
                    status={wo.completion_status === 'selesai' ? 'completed' : wo.completion_status === 'belum_selesai_dilanjut' ? 'on_hold' : 'abnormal'}
                    variant="pill"
                  />
                </div>
              )}
            </div>

            {wo.notes_kendala && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Catatan / Kendala</p>
                <div className="bg-amber-50 rounded-lg p-3 text-sm text-slate-700 border border-amber-100">
                  {wo.notes_kendala}
                </div>
              </div>
            )}
            {wo.notes_usulan && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Usulan</p>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-700 border border-blue-100">
                  {wo.notes_usulan}
                </div>
              </div>
            )}
            {wo.notes_pemberi_tugas && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Catatan Pemberi Tugas</p>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-slate-700 border border-green-100">
                  {wo.notes_pemberi_tugas}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 2.5: Technician Feedback Form (only for technicians) */}
      {isTechnician && wo.status !== 'completed' && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-600">Form Feedback Teknisi</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Isi form ini untuk memberikan feedback tentang pelaksanaan work order
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status Penyelesaian <span className="text-red-500">*</span>
              </label>
              <select
                value={completionStatus}
                onChange={(e) => setCompletionStatus(e.target.value as CompletionStatus)}
                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">-- Pilih Status --</option>
                <option value="selesai">✅ Selesai</option>
                <option value="belum_selesai_dilanjut">⏳ Belum Selesai (Dilanjutkan)</option>
                <option value="tidak_bisa">❌ Tidak Dapat Diselesaikan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Catatan Kendala
              </label>
              <Textarea
                value={notesKendala}
                onChange={(e) => setNotesKendala(e.target.value)}
                placeholder="Jelaskan kendala yang dihadapi saat mengerjakan work order ini..."
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Usulan / Saran
              </label>
              <Textarea
                value={notesUsulan}
                onChange={(e) => setNotesUsulan(e.target.value)}
                placeholder="Berikan usulan atau saran untuk perbaikan..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSubmitFeedback}
                disabled={!completionStatus || isSaving}
                isLoading={isSaving}
                className="gap-2"
              >
                <Save size={16} />
                Simpan Feedback
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCompletionStatus('');
                  setNotesKendala('');
                  setNotesUsulan('');
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Personnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon size={18} className="text-slate-400" />
            Personel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Manager */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                {(wo.manager_name_snapshot || 'M').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{wo.manager_name_snapshot || 'Manager'}</p>
                <p className="text-xs text-slate-500">Manager Teknik</p>
              </div>
            </div>
            {/* Supervisor */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
              <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">
                {(wo.supervisor_name_snapshot || 'S').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{wo.supervisor_name_snapshot || 'Supervisor'}</p>
                <p className="text-xs text-slate-500">Supervisor</p>
              </div>
            </div>
            {/* Personnel */}
            {wo.personnel.map((p) => (
              <div key={p.user_id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.role_label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
