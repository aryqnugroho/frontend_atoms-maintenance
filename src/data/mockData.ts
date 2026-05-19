import type {
  ShiftScheduleResponse,
  DashboardChecklistItem,
  WorkOrder,
  CnsdCategory,
  TfpCategory,
  Notification,
} from '@/types';

// ─── Shift Schedule ────────────────────────────────────────
export function getCurrentShift(): 'pagi' | 'siang' | 'malam' {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 13) return 'pagi';
  if (hour >= 13 && hour < 19) return 'siang';
  return 'malam';
}

export const mockShiftSchedule: ShiftScheduleResponse = {
  current_shift: getCurrentShift(),
  shift_start: getCurrentShift() === 'pagi' ? '07:00' : getCurrentShift() === 'siang' ? '13:00' : '19:00',
  shift_end: getCurrentShift() === 'pagi' ? '13:00' : getCurrentShift() === 'siang' ? '19:00' : '07:00',
  date: new Date().toISOString().split('T')[0],
  personnel: [
    { id: 1, name: 'Dudik Fahrudin', role: 'Manager Teknik', division: 'Management' },
    { id: 2, name: 'Moch. Ichsan', role: 'Supervisor CNSD', division: 'CNSD' },
    { id: 3, name: 'Fajar Kusuma W', role: 'Supervisor TFP', division: 'TFP' },
    { id: 4, name: 'Khoirul M.A', role: 'Teknisi CNSD', division: 'CNSD' },
    { id: 6, name: 'Argo Pragolo', role: 'Teknisi CNSD', division: 'CNSD' },
    { id: 5, name: 'Iqbal Mustika', role: 'Teknisi TFP', division: 'TFP' },
    { id: 8, name: 'Andi Wibowo', role: 'Manager Teknik', division: 'Management' },
  ],
};

// ─── Dashboard Checklist ───────────────────────────────────
export const mockChecklist: DashboardChecklistItem[] = [
  { id: 'cnsd-eq1', label: 'Kesiapan Peralatan CNSD', division: 'CNSD', is_active: true, is_completed: true, route: '/cnsd/readiness' },
  { id: 'cnsd-shelter', label: 'Shelter ILS & Transmitter', division: 'CNSD', is_active: false, is_completed: false },
  { id: 'tfp-aob', label: 'Performance Check AOB Lantai Ground', division: 'TFP', is_active: true, is_completed: false, route: '/tfp/aob-ground' },
  { id: 'tfp-pagi', label: 'Performance Check Pagi', division: 'TFP', is_active: false, is_completed: false },
];

// ─── Notifications ─────────────────────────────────────────
export let mockWorkOrders: WorkOrder[] = [
  {
    id: 1,
    wo_number: 'WO-CNSD-12-04-2026-001',
    wo_type: 'shift', // WO for all personnel in shift
    division: 'CNSD',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    description: 'Pemeriksaan VCCS Merk Frequentis dan Voice Recorder. Pastikan server A & B berfungsi normal.',
    output_types: ['meter_reading', 'status_peralatan'],
    personnel: [
      { user_id: 4, name: 'Khoirul M.A', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
      { user_id: 6, name: 'Argo Pragolo', role_label: 'Teknisi 2', signature_url: '/mock-sig.png' },
    ],
    status: 'ongoing',
    manager_name_snapshot: 'Dudik Fahrudin',
    supervisor_name_snapshot: 'Moch. Ichsan',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 2,
    created_at: '2026-04-12T07:15:00Z',
    updated_at: '2026-04-12T07:15:00Z',
    manager: { id: 1, name: 'Dudik Fahrudin' },
    supervisor: { id: 2, name: 'Moch. Ichsan' },
  },
  {
    id: 2,
    wo_number: 'WO-TFP-12-04-2026-001',
    wo_type: 'shift', // WO for all personnel in shift
    division: 'TFP',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    description: 'Pengecekan UPS Tescom A dan B. Verifikasi tegangan battery dan arus battery.',
    output_types: ['meter_reading', 'logbook'],
    personnel: [
      { user_id: 5, name: 'Iqbal Mustika', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'ongoing',
    start_time: '07:30',
    manager_name_snapshot: 'Dudik Fahrudin',
    supervisor_name_snapshot: 'Fajar Kusuma W',
    supervisor_id: 3,
    manager_id: 1,
    created_by: 3,
    created_at: '2026-04-12T07:20:00Z',
    updated_at: '2026-04-12T07:30:00Z',
    manager: { id: 1, name: 'Dudik Fahrudin' },
    supervisor: { id: 3, name: 'Fajar Kusuma W' },
  },
  {
    id: 3,
    wo_number: 'WO-CNSD-11-04-2026-002',
    wo_type: 'shift',
    division: 'CNSD',
    shift_type: 'malam',
    shift_date: '2026-04-11',
    description: 'Perbaikan MSSR Main-Standby switching. Koordinasi dengan tim radar.',
    output_types: ['status_peralatan', 'logbook'],
    personnel: [
      { user_id: 4, name: 'Khoirul M.A', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'on_hold',
    start_time: '19:45',
    end_time: '23:30',
    completion_status: 'belum_selesai_dilanjut',
    notes_kendala: 'Sparepart switching module belum tersedia. Sementara menggunakan manual switching.',
    notes_usulan: 'Segera pesan switching module dari gudang pusat.',
    manager_name_snapshot: 'Dudik Fahrudin',
    supervisor_name_snapshot: 'Moch. Ichsan',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 2,
    created_at: '2026-04-11T19:30:00Z',
    updated_at: '2026-04-11T23:35:00Z',
    manager: { id: 1, name: 'Dudik Fahrudin' },
    supervisor: { id: 2, name: 'Moch. Ichsan' },
  },
  {
    id: 4,
    wo_number: 'WO-CNSD-12-04-2026-P001',
    wo_type: 'personal', // Personal WO for specific technician
    division: 'CNSD',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    assigned_technician_id: 4, // Assigned to Khoirul M.A
    description: 'Kalibrasi CDU Secondary setelah drift frekuensi. Pastikan frekuensi kembali ke toleransi normal.',
    output_types: ['meter_reading', 'status_peralatan'],
    personnel: [
      { user_id: 4, name: 'Khoirul M.A', role_label: 'Teknisi', signature_url: '/mock-sig.png' },
    ],
    status: 'ongoing',
    manager_name_snapshot: 'Dudik Fahrudin',
    supervisor_name_snapshot: 'Moch. Ichsan',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 1, // Created by Manager
    created_at: '2026-04-12T08:00:00Z',
    updated_at: '2026-04-12T08:00:00Z',
    manager: { id: 1, name: 'Dudik Fahrudin' },
    supervisor: { id: 2, name: 'Moch. Ichsan' },
  },
  {
    id: 5,
    wo_number: 'WO-TFP-10-04-2026-001',
    wo_type: 'shift',
    division: 'TFP',
    shift_type: 'siang',
    shift_date: '2026-04-10',
    description: 'Pemeliharaan rutin AC Split Wall 01-04 ruang equipment AOB Ground.',
    output_types: ['logbook', 'other'],
    output_other: 'Laporan pemeliharaan AC',
    personnel: [
      { user_id: 5, name: 'Iqbal Mustika', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'completed',
    start_time: '13:15',
    end_time: '16:00',
    completion_status: 'selesai',
    notes_kendala: 'AC 03 filter perlu diganti dalam 2 minggu ke depan.',
    notes_pemberi_tugas: 'Noted, siapkan SPK pembelian filter AC.',
    manager_name_snapshot: 'Dudik Fahrudin',
    supervisor_name_snapshot: 'Fajar Kusuma W',
    supervisor_id: 3,
    manager_id: 1,
    created_by: 3,
    created_at: '2026-04-10T13:00:00Z',
    updated_at: '2026-04-10T16:30:00Z',
    closed_at: '2026-04-10T16:30:00Z',
    manager: { id: 1, name: 'Dudik Fahrudin' },
    supervisor: { id: 3, name: 'Fajar Kusuma W' },
  },
];

// ─── CNSD Categories ───────────────────────────────────────
export const mockCnsdCategories: CnsdCategory[] = [
  { id: 1, code: 'CNSD-001', name: 'Kesiapan Peralatan CNSD', location: 'Main Equipment Room', is_active_mvp: true, sort_order: 1 },
  { id: 2, code: 'CNSD-002', name: 'Radar', location: 'Gedung Radar', is_active_mvp: true, sort_order: 2 },
  { id: 3, code: 'CNSD-003', name: 'Recorder', location: 'Main Equipment Room', is_active_mvp: true, sort_order: 3 },
  { id: 4, code: 'CNSD-004', name: 'AMSC', location: 'Ruang AMSC', is_active_mvp: true, sort_order: 4 },
  { id: 5, code: 'CNSD-005', name: 'Transmitter', location: 'Gedung Transmitter', is_active_mvp: true, sort_order: 5 },
  { id: 6, code: 'CNSD-006', name: 'Receiver', location: 'Gedung Transmitter', is_active_mvp: true, sort_order: 6 },
  { id: 7, code: 'CNSD-007', name: 'Glide Path', location: 'Shelter Glide Path', is_active_mvp: true, sort_order: 7 },
  { id: 8, code: 'CNSD-008', name: 'Localizer', location: 'Shelter Localizer', is_active_mvp: true, sort_order: 8 },
  { id: 9, code: 'CNSD-009', name: 'T-DME', location: 'Shelter Glide Path', is_active_mvp: true, sort_order: 9 },
  { id: 10, code: 'CNSD-010', name: 'DVOR', location: 'Shelter VOR', is_active_mvp: false, sort_order: 10 },
  { id: 11, code: 'CNSD-011', name: 'DME', location: 'Shelter VOR', is_active_mvp: false, sort_order: 11 },
  { id: 12, code: 'CNSD-012', name: 'ATC System', location: 'Main Equipment Room', is_active_mvp: false, sort_order: 12 },
  { id: 13, code: 'CNSD-013', name: 'ATIS', location: 'Main Equipment Room', is_active_mvp: false, sort_order: 13 },
];

// ─── TFP Categories ────────────────────────────────────────
export const mockTfpCategories: TfpCategory[] = [
  { id: 1, code: 'TFP-001', name: 'Performance Check AOB Lantai Ground', location: 'AOB Lantai Ground', is_active_mvp: true, sort_order: 1 },
  { id: 2, code: 'TFP-002', name: 'AOB Lantai 1 & 2', location: 'AOB Lantai 1-2', is_active_mvp: true, sort_order: 2 },
  { id: 3, code: 'TFP-003', name: 'Transmitter (TFP)', location: 'Gedung Transmitter', is_active_mvp: true, sort_order: 3 },
  { id: 4, code: 'TFP-004', name: 'Radar (TFP)', location: 'Gedung Radar', is_active_mvp: true, sort_order: 4 },
  { id: 5, code: 'TFP-005', name: 'Tower', location: 'ATC Tower', is_active_mvp: true, sort_order: 5 },
  { id: 6, code: 'TFP-006', name: 'VOR (TFP)', location: 'Shelter VOR', is_active_mvp: true, sort_order: 6 },
  { id: 7, code: 'TFP-007', name: 'Localizer (TFP)', location: 'Shelter Localizer', is_active_mvp: true, sort_order: 7 },
  { id: 8, code: 'TFP-008', name: 'Glide Path (TFP)', location: 'Shelter Glide Path', is_active_mvp: true, sort_order: 8 },
];

// ─── Notifications ─────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 1, type: 'WorkOrderCreated', title: 'Work Order Baru', message: 'WO-CNSD-12-04-2026-001 telah dibuat oleh Moch. Ichsan', is_read: false, created_at: '2026-04-12T07:15:00Z' },
  { id: 2, type: 'WorkOrderStatusChanged', title: 'Status WO Berubah', message: 'WO-TFP-12-04-2026-001 sedang In Progress', is_read: false, created_at: '2026-04-12T07:30:00Z' },
  { id: 3, type: 'ReportApprovalNeeded', title: 'Laporan Perlu Persetujuan', message: 'Evaluasi Kinerja Fasilitas Q1 2026 menunggu persetujuan Anda', is_read: false, created_at: '2026-04-05T14:00:00Z' },
  { id: 4, type: 'AbnormalEquipmentDetected', title: 'Peralatan Abnormal', message: 'CDU Secondary menunjukkan frekuensi drift ±0.02 MHz', is_read: true, created_at: '2026-04-12T07:45:00Z' },
  { id: 5, type: 'ReportRejected', title: 'Laporan Ditolak', message: 'Riwayat Pemeliharaan VCCS ditolak oleh Dudik Fahrudin', is_read: true, created_at: '2026-04-07T11:00:00Z' },
];

// ─── Meter Reading Equipment ───────────────────────────────
// NOTE: mockMeterReadingEquipment removed — Ground Check ADC now uses real API.

// ─── Grounding Reports ─────────────────────────────────────
// NOTE: mockGroundingReports removed — Grounding now uses real API.

export const deleteMockWorkOrder = (id: number) => {
  mockWorkOrders = mockWorkOrders.filter((wo) => wo.id !== id);
};
