import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { mockShiftSchedule } from '@/data/mockData';
import type { OutputType } from '@/types';

const outputOptions: { label: string; value: OutputType }[] = [
  { label: 'Meter Reading / Pengukuran', value: 'meter_reading' },
  { label: 'Status Peralatan', value: 'status_peralatan' },
  { label: 'Logbook', value: 'logbook' },
  { label: 'Lainnya', value: 'other' },
];

export const WorkOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const shift = mockShiftSchedule;

  // WO Type: 'shift' for all personnel, 'personal' for specific technician
  const [woType, setWoType] = useState<'shift' | 'personal'>('shift');
  const [division, setDivision] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [description, setDescription] = useState('');
  const [outputs, setOutputs] = useState<OutputType[]>([]);
  const [outputOther, setOutputOther] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleOutput = (val: OutputType) => {
    setOutputs((prev) =>
      prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock submit with notification for personal WO
    if (woType === 'personal') {
      console.log('Creating Personal WO for technician:', selectedTechnician);
      console.log('Notification will be sent to:', technicians.find(t => t.id === Number(selectedTechnician))?.name);
    } else {
      console.log('Creating Shift WO for all personnel in division:', division);
    }
    
    setTimeout(() => {
      navigate('/work-orders');
    }, 1500);
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Get technicians for selected division
  const technicians = shift.personnel.filter((p) => {
    if (division === 'CNSD') return p.role === 'Teknisi CNSD';
    if (division === 'TFP') return p.role === 'Teknisi TFP';
    return false;
  });

  const supervisor = shift.personnel.find((p) => {
    if (division === 'CNSD') return p.role === 'Supervisor CNSD';
    if (division === 'TFP') return p.role === 'Supervisor TFP';
    return false;
  });

  const manager = shift.personnel.find((p) => p.role === 'Manager Teknik');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')} className="gap-1">
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <h1 className="text-xl font-bold text-slate-900">Buat Work Order Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-filled fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-brand-primary">Informasi Otomatis</CardTitle>
            <p className="text-xs text-slate-500">Field berikut terisi otomatis dari sistem.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">No. Work Order</p>
                <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded-md border border-gray-200 text-slate-400">
                  WO-{division || '???'}-{now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}-XXX
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Shift Dinas</p>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-gray-200">
                  <ShiftBadge shift={shift.current_shift} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
                <p className="text-sm bg-slate-50 px-3 py-2 rounded-md border border-gray-200 text-slate-700">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Jam</p>
                <p className="text-sm bg-slate-50 px-3 py-2 rounded-md border border-gray-200 text-slate-700">{formattedTime}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Personel Dinas</p>
                <div className="bg-slate-50 px-3 py-2.5 rounded-md border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {shift.personnel.map(p => (
                      <span key={p.id} className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-gray-200 shadow-sm">
                        {p.name} <span className="ml-1.5 text-[10px] text-slate-500 font-normal border-l border-gray-200 pl-1.5">{p.role}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-maintenance-wo">Perintah Kerja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* WO Type Selection */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Jenis Work Order <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWoType('shift');
                    setSelectedTechnician('');
                  }}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    woType === 'shift'
                      ? 'bg-blue-50 border-brand-primary'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center ${
                    woType === 'shift' 
                      ? 'border-brand-primary' 
                      : 'border-gray-300'
                  }`}>
                    {woType === 'shift' && (
                      <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-semibold block leading-tight ${
                      woType === 'shift' 
                        ? 'text-brand-primary' 
                        : 'text-slate-700'
                    }`}>
                      WO Shift
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Untuk seluruh personel dalam shift
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWoType('personal')}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    woType === 'personal'
                      ? 'bg-blue-50 border-brand-primary'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center ${
                    woType === 'personal'
                      ? 'border-brand-primary'
                      : 'border-gray-300'
                  }`}>
                    {woType === 'personal' && (
                      <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-semibold block leading-tight ${
                      woType === 'personal'
                        ? 'text-brand-primary'
                        : 'text-slate-700'
                    }`}>
                      WO Personal
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Untuk satu teknisi tertentu
                    </p>
                  </div>
                </button>
              </div>
              {woType === 'personal' && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <span className="text-base">💡</span>
                    <span>WO Personal akan dikirim ke notifikasi teknisi yang dipilih dan hanya teknisi tersebut yang dapat memberikan feedback.</span>
                  </p>
                </div>
              )}
            </div>

            <Select
              label="Tertuju Kepada (Divisi)"
              options={[
                { label: 'CNSD', value: 'CNSD' },
                { label: 'TFP', value: 'TFP' },
              ]}
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setSelectedTechnician(''); // Reset technician when division changes
              }}
              placeholder="Pilih Divisi..."
            />

            {/* Technician Selection (only for personal WO) */}
            {woType === 'personal' && division && technicians.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Pilih Teknisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  required
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} - {tech.role}
                    </option>
                  ))}
                </select>
                {selectedTechnician && (
                  <p className="mt-1.5 text-xs text-blue-600">
                    ✓ Notifikasi akan dikirim ke: {technicians.find(t => t.id === Number(selectedTechnician))?.name}
                  </p>
                )}
              </div>
            )}

            <Textarea
              label="Deskripsi Perintah"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan perintah kerja yang harus dilaksanakan..."
              rows={4}
              required
            />

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Output Yang Diharapkan</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                {outputOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={outputs.includes(opt.value)}
                        onChange={() => toggleOutput(opt.value)}
                        className="peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
                      />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
              {outputs.includes('other') && (
                <Input
                  label="Keterangan Output Lainnya"
                  value={outputOther}
                  onChange={(e) => setOutputOther(e.target.value)}
                  placeholder="Sebutkan..."
                  className="mt-3"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personnel preview */}
        {division && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personel</CardTitle>
              <p className="text-xs text-slate-500">
                {woType === 'shift' 
                  ? 'Ditentukan otomatis dari jadwal shift saat ini.' 
                  : 'Hanya teknisi yang dipilih yang akan menerima WO ini.'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {manager && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{manager.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{manager.name}</p>
                      <p className="text-xs text-slate-500">Manager Teknik</p>
                    </div>
                  </div>
                )}
                {supervisor && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
                    <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">{supervisor.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{supervisor.name}</p>
                      <p className="text-xs text-slate-500">Supervisor</p>
                    </div>
                  </div>
                )}
                {woType === 'shift' ? (
                  technicians.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">{t.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-500">Teknisi {t.division}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  selectedTechnician && technicians.find(t => t.id === Number(selectedTechnician)) && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{technicians.find(t => t.id === Number(selectedTechnician))!.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{technicians.find(t => t.id === Number(selectedTechnician))!.name}</p>
                        <p className="text-xs text-slate-500">Teknisi {technicians.find(t => t.id === Number(selectedTechnician))!.division}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/work-orders')}>
            Batal
          </Button>
          <Button 
            type="submit" 
            isLoading={isSubmitting} 
            disabled={
              !division || 
              !description || 
              (woType === 'personal' && !selectedTechnician)
            } 
            className="gap-2"
          >
            <Save size={16} />
            Simpan Work Order
          </Button>
        </div>
      </form>
    </div>
  );
};
