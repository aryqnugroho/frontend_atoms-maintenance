import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { mockShiftSchedule, mockWorkOrders, updateMockWorkOrder, createMockWorkOrder } from '@/data/mockData';
import { workOrderService } from '@/services/workOrderService';
import type { OutputType, WorkOrder } from '@/types';

const outputOptions: { label: string; value: OutputType }[] = [
  { label: 'Meter Reading / Pengukuran', value: 'meter_reading' },
  { label: 'Status Peralatan', value: 'status_peralatan' },
  { label: 'Logbook', value: 'logbook' },
  { label: 'Lainnya', value: 'other' },
];

interface WorkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number | null; // null means create mode
}

export const WorkOrderFormModal: React.FC<WorkOrderFormModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  
  const [woType, setWoType] = useState<'shift' | 'personal'>('shift');
  const [division, setDivision] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [description, setDescription] = useState('');
  const [outputs, setOutputs] = useState<OutputType[]>([]);
  const [outputOther, setOutputOther] = useState('');
  const [notesKendala, setNotesKendala] = useState('');
  const [notesUsulan, setNotesUsulan] = useState('');
  const [notesPemberiTugas, setNotesPemberiTugas] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shift = mockShiftSchedule;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen) {
      if (workOrderId !== null) {
        // Edit Mode
        const wo = mockWorkOrders.find((w) => w.id === workOrderId);
        if (wo) {
          setWorkOrder(wo);
          const isPersonal = wo.personnel.length === 1;
          setWoType(isPersonal ? 'personal' : 'shift');
          setDivision(wo.division);
          setSelectedTechnician(isPersonal ? wo.personnel[0].user_id.toString() : '');
          setDescription(wo.description);
          setOutputs(wo.output_types);
          setOutputOther(wo.output_other || '');
          setNotesKendala(wo.notes_kendala || '');
          setNotesUsulan(wo.notes_usulan || '');
          setNotesPemberiTugas(wo.notes_pemberi_tugas || '');
        }
      } else {
        // Create Mode
        setWorkOrder(null);
        setWoType('shift');
        setDivision('');
        setSelectedTechnician('');
        setDescription('');
        setOutputs([]);
        setOutputOther('');
        setNotesKendala('');
        setNotesUsulan('');
        setNotesPemberiTugas('');
      }
    } else {
      setWorkOrder(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, workOrderId]);

  // We don't return early if !workOrder because we support Create mode
  // if (!workOrder) return null;

  const toggleOutput = (val: OutputType) => {
    setOutputs((prev) =>
      prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Determine personnel array
    let updatedPersonnel: { user_id: number; name: string; role_label: string }[] = workOrder?.personnel || [];
    
    const technicians = shift.personnel.filter((p) => {
      if (division === 'CNSD') return p.role === 'Teknisi CNSD';
      if (division === 'TFP') return p.role === 'Teknisi TFP';
      return false;
    });

    if (woType === 'personal' && selectedTechnician) {
      const tech = technicians.find(t => t.id === Number(selectedTechnician));
      if (tech) {
        updatedPersonnel = [{ user_id: tech.id, name: tech.name, role_label: tech.role }];
      }
    } else if (woType === 'shift' && division !== workOrder?.division) {
       updatedPersonnel = technicians.map(p => ({ user_id: p.id, name: p.name, role_label: p.role }));
    }

    const isEdit = workOrderId !== null;
    const superv = shift.personnel.find((p) => p.role === `Supervisor ${division}`);
    const mgr = shift.personnel.find((p) => p.role === 'Manager Teknik');

    try {
      if (isEdit && workOrder) {
        // Try API first
        await workOrderService.updateWorkOrder(workOrder.id, {
          wo_type: woType,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
          personnel: updatedPersonnel.map(p => ({ user_id: p.user_id, role_label: p.role_label })),
        });
      } else {
        // Try API first
        await workOrderService.createWorkOrder({
          wo_type: woType,
          shift_date: new Date().toISOString().split('T')[0],
          shift_type: shift.current_shift,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
          manager_id: mgr?.id,
          supervisor_id: superv?.id,
          assigned_technician_id: woType === 'personal' ? Number(selectedTechnician) : undefined,
          personnel: updatedPersonnel.map(p => ({ user_id: p.user_id, role_label: p.role_label })),
        });
      }
    } catch {
      // Fallback to mock data if API unavailable
      if (isEdit && workOrder) {
        const updatedWO: WorkOrder = {
          ...workOrder,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala,
          notes_usulan: notesUsulan,
          notes_pemberi_tugas: notesPemberiTugas,
          personnel: updatedPersonnel,
        };
        updateMockWorkOrder(updatedWO);
      } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        createMockWorkOrder({
          wo_type: woType,
          shift_date: now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
          shift_type: shift.current_shift,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala,
          notes_usulan: notesUsulan,
          notes_pemberi_tugas: notesPemberiTugas,
          personnel: updatedPersonnel,
          start_time: timeStr,
          supervisor_id: superv?.id,
          supervisor_name_snapshot: superv?.name,
          manager_name_snapshot: mgr?.name,
          created_by: 1,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
      }
    }
    
    setIsSubmitting(false);
    onClose();
  };

  const availableTechnicians = shift.personnel.filter((p) => {
    if (division === 'CNSD') return p.role === 'Teknisi CNSD';
    if (division === 'TFP') return p.role === 'Teknisi TFP';
    return false;
  });

  const isEdit = workOrderId !== null;
  const displayShift = isEdit && workOrder ? workOrder.shift_type : shift.current_shift;
  const displayDate = isEdit && workOrder ? workOrder.shift_date : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const displayStatus = isEdit && workOrder ? workOrder.status.replace('_', ' ') : 'ONGOING';
  const modalTitle = isEdit ? `Edit Work Order: ${workOrder?.wo_number}` : 'Buat Work Order Baru';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Read-only Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Shift Dinas</p>
            <div className="flex items-center gap-2">
              <ShiftBadge shift={displayShift} />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
            <p className="text-sm font-medium text-slate-700">{displayDate}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500 mb-0.5">Status</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              {displayStatus}
            </p>
          </div>
        </div>

        {/* Manual input */}
        <div className="space-y-4">
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
                  woType === 'shift' ? 'border-brand-primary' : 'border-gray-300'
                }`}>
                  {woType === 'shift' && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div className="text-left">
                  <span className={`text-sm font-semibold block leading-tight ${
                    woType === 'shift' ? 'text-brand-primary' : 'text-slate-700'
                  }`}>
                    WO Shift
                  </span>
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
                  woType === 'personal' ? 'border-brand-primary' : 'border-gray-300'
                }`}>
                  {woType === 'personal' && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div className="text-left">
                  <span className={`text-sm font-semibold block leading-tight ${
                    woType === 'personal' ? 'text-brand-primary' : 'text-slate-700'
                  }`}>
                    WO Personal
                  </span>
                </div>
              </button>
            </div>
          </div>

          <Select
            label="Fasilitas / Tertuju Kepada (Divisi)"
            options={[
              { label: 'CNSD', value: 'CNSD' },
              { label: 'TFP', value: 'TFP' },
            ]}
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setSelectedTechnician('');
            }}
            placeholder="Pilih Divisi..."
          />

          {/* Technician Selection (only for personal WO) */}
          {woType === 'personal' && division && availableTechnicians.length > 0 && (
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
                {availableTechnicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} - {tech.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Textarea
            label="Deskripsi Perintah"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tuliskan perintah kerja yang harus dilaksanakan..."
            rows={3}
            required
          />

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Output Yang Diharapkan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Catatan Tambahan</h3>
            
            <Textarea
              label="Catatan/Kendala"
              value={notesKendala}
              onChange={(e) => setNotesKendala(e.target.value)}
              placeholder="Opsional: Tuliskan kendala saat pelaksanaan..."
              rows={2}
            />
            
            <Textarea
              label="Usulan"
              value={notesUsulan}
              onChange={(e) => setNotesUsulan(e.target.value)}
              placeholder="Opsional: Tuliskan usulan tindak lanjut..."
              rows={2}
            />

            <Input
              label="Catatan Pemberi Tugas"
              value={notesPemberiTugas}
              onChange={(e) => setNotesPemberiTugas(e.target.value)}
              placeholder="Opsional: Tuliskan instruksi khusus..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
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
            className="gap-2 bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
          >
            <Save size={16} />
            {isEdit ? 'Simpan Perubahan' : 'Buat Work Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
