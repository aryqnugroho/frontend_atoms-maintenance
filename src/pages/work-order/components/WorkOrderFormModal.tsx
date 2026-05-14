import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { mockShiftSchedule, mockWorkOrders, updateMockWorkOrder, createMockWorkOrder } from '@/data/mockData';
import { workOrderService } from '@/services/workOrderService';
import type { OutputType, WorkOrder, ShiftContextResponse, ShiftType } from '@/types';

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

  // â”€â”€ Rostering shift context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Loaded from GET /api/v1/personnel/shift-today on modal open.
  // Falls back to mockShiftSchedule if API unavailable or roster not published.
  const [shiftContext, setShiftContext] = useState<ShiftContextResponse | null>(null);
  const [shiftContextLoading, setShiftContextLoading] = useState(false);

  // Derive current shift from time (same logic as backend)
  const getCurrentShiftType = (): ShiftType => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 13) return 'pagi';
    if (hour >= 13 && hour < 19) return 'siang';
    return 'malam';
  };

  // Load real shift context from rostering when modal opens in create mode
  useEffect(() => {
    if (isOpen && workOrderId === null) {
      const loadContext = async () => {
        setShiftContextLoading(true);
        try {
          const ctx = await workOrderService.getShiftContext(getCurrentShiftType());
          setShiftContext(ctx);
        } catch {
          setShiftContext(null); // silently fall back to mock
        } finally {
          setShiftContextLoading(false);
        }
      };
      void loadContext();
    }
  }, [isOpen, workOrderId]);

  // Resolve shift data: prefer rostering context, fall back to mock
  const shift = mockShiftSchedule;
  const rosterAvailable = shiftContext?.roster_available ?? false;

  useEffect(() => {
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
      setShiftContext(null);
    }
  }, [isOpen, workOrderId]);

  const toggleOutput = (val: OutputType) => {
    setOutputs((prev) =>
      prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]
    );
  };

  /**
   * Resolve manager_id for WO creation.
   * Priority: rostering context â†’ mock shift schedule.
   */
  const resolveManagerId = (): number | undefined => {
    if (rosterAvailable && shiftContext?.manager) {
      // Find local_users entry by rostering_user_id match via name (best effort)
      // The backend will also auto-resolve via rostering DB if manager_id is omitted
      return undefined; // Let backend auto-resolve from rostering
    }
    return shift.personnel.find((p) => p.role === 'Manager Teknik')?.id;
  };

  /**
   * Resolve supervisor_id for WO creation.
   * Priority: rostering context â†’ mock shift schedule.
   */
  const resolveSupervisorId = (div: string): number | undefined => {
    if (rosterAvailable && shiftContext !== null) {
      // Backend will auto-resolve supervisor from rostering if omitted
      return undefined;
    }
    return shift.personnel.find((p) => p.role === `Supervisor ${div}`)?.id;
  };

  /**
   * Get available technicians for personal WO selection.
   * Priority: rostering context personnel â†’ mock shift schedule.
   */
  const getAvailableTechnicians = (div: string) => {
    if (rosterAvailable && shiftContext && shiftContext.personnel.length > 0) {
      // Filter rostering personnel by division
      const empType = div === 'CNSD' ? 'CNS' : 'Support';
      return shiftContext.personnel
        .filter((p) => p.employee_type === empType)
        .map((p) => ({ id: p.user_id, name: p.name, role: p.employee_type }));
    }
    // Fallback to mock
    return shift.personnel.filter((p) => {
      if (div === 'CNSD') return p.role === 'Teknisi CNSD';
      if (div === 'TFP') return p.role === 'Teknisi TFP';
      return false;
    });
  };

  /**
   * Build personnel array for WO creation.
   * For shift WO: all technicians in the division.
   * For personal WO: only the selected technician.
   */
  const buildPersonnelArray = (div: string): { user_id: number; role_label: string }[] => {
    if (woType === 'personal' && selectedTechnician) {
      const techs = getAvailableTechnicians(div);
      const tech = techs.find((t) => t.id === Number(selectedTechnician));
      if (tech) return [{ user_id: tech.id, role_label: 'Teknisi' }];
      return [];
    }
    // Shift WO: all technicians in division
    const techs = getAvailableTechnicians(div);
    return techs.map((t, i) => ({ user_id: t.id, role_label: `Teknisi ${i + 1}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isEdit = workOrderId !== null;
    const mgr = shift.personnel.find((p) => p.role === 'Manager Teknik');
    const superv = shift.personnel.find((p) => p.role === `Supervisor ${division}`);

    try {
      if (isEdit && workOrder) {
        await workOrderService.updateWorkOrder(workOrder.id, {
          wo_type: woType,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
          personnel: buildPersonnelArray(division),
        });
      } else {
        // Create: manager_id/supervisor_id omitted when roster available
        // so backend auto-resolves from rostering DB
        await workOrderService.createWorkOrder({
          wo_type: woType,
          shift_date: new Date().toISOString().split('T')[0],
          shift_type: shiftContext?.shift_type ?? shift.current_shift,
          division: division as 'CNSD' | 'TFP',
          description,
          output_types: outputs,
          output_other: outputs.includes('other') ? outputOther : undefined,
          notes_kendala: notesKendala || undefined,
          notes_usulan: notesUsulan || undefined,
          notes_pemberi_tugas: notesPemberiTugas || undefined,
          // Only pass IDs when roster is NOT available (manual fallback)
          manager_id: rosterAvailable ? undefined : resolveManagerId(),
          supervisor_id: rosterAvailable ? undefined : resolveSupervisorId(division),
          assigned_technician_id: woType === 'personal' ? Number(selectedTechnician) : undefined,
          personnel: buildPersonnelArray(division),
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
          personnel: (workOrder.personnel || []),
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
          personnel: buildPersonnelArray(division).map((p) => ({
            user_id: p.user_id,
            name: '',
            role_label: p.role_label,
          })),
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

  const availableTechnicians = getAvailableTechnicians(division);
  const isEdit = workOrderId !== null;
  const currentShiftType = shiftContext?.shift_type ?? shift.current_shift;
  const displayShift = isEdit && workOrder ? workOrder.shift_type : currentShiftType;
  const displayDate = isEdit && workOrder
    ? workOrder.shift_date
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
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
              {/* Roster status indicator */}
              {!isEdit && (
                shiftContextLoading ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> Memuat roster...
                  </span>
                ) : rosterAvailable ? (
                  <span className="text-xs text-emerald-600 font-medium">â— Roster aktif</span>
                ) : (
                  <span className="text-xs text-amber-500 font-medium">â— Roster belum dipublish</span>
                )
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
            <p className="text-sm font-medium text-slate-700">{displayDate}</p>
          </div>
          {/* Show resolved MT and supervisor when roster is available */}
          {!isEdit && rosterAvailable && shiftContext && (
            <>
              {shiftContext.manager && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Manager Teknik (dari Roster)</p>
                  <p className="text-sm font-medium text-slate-700">{shiftContext.manager.name}</p>
                </div>
              )}
              {shiftContext.supervisor && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Supervisor (dari Roster)</p>
                  <p className="text-sm font-medium text-slate-700">{shiftContext.supervisor.name}</p>
                </div>
              )}
            </>
          )}
          <div className={(!isEdit && rosterAvailable && shiftContext?.manager) ? '' : 'md:col-span-2'}>
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
                {rosterAvailable && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">(dari roster aktif)</span>
                )}
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

