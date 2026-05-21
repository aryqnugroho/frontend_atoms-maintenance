import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Zap, Plus, Search, X, Filter, Edit2, Trash2, Users, Printer,
  PenLine, CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { useAuth } from '@/hooks/useAuth';
import { groundingReportService } from '@/services/groundingReportService';
import { reportingDamageReportService } from '@/services/reportingDamageReportService';
import { getCurrentShiftDate, getCurrentShiftType } from '@/lib/shiftUtils';
import type { GroundingReportSummary } from '@/types/grounding';
import type { ReportingPerson } from '@/types/reporting';
import type { ShiftType } from '@/types';

const SHIFT_LABELS: Record<string, string> = { pagi: 'Shift Pagi', siang: 'Shift Siang', malam: 'Shift Malam' };
const STATUS_LABELS: Record<string, string> = { ongoing: 'Ongoing', on_hold: 'On Hold', completed: 'Completed' };
const WORK_UNITS = [
  'Cabang Surabaya',
  'Cabang Kediri',
  'Cabang Malang',
  'Cabang Sumenep',
  'Cabang Jember',
  'Cabang Banyuwangi',
  'Cabang Bawean',
] as const;

const getCurrentTimeValue = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) !== '' && norm(a) === norm(b);
};

type SignerBadgeStatus = 'pending' | 'completed' | 'none';

const getSignerStatus = (record: GroundingReportSummary, userName?: string, userRole?: string): SignerBadgeStatus => {
  if (!userName || !userRole) return 'none';
  if (record.status === 'completed') return 'completed';
  if (userRole === 'Manager Teknik' && namesMatch(record.manager_name, userName)) return 'pending';
  if ((userRole === 'Supervisor TFP' || userRole === 'Admin') && namesMatch(record.supervisor_name, userName)) return 'pending';
  if (userRole === 'Teknisi TFP' || userRole === 'Supervisor TFP') {
    if (record.technician_names.some((n) => namesMatch(n, userName))) return 'pending';
  }
  return 'none';
};

// ─── Create Modal ──────────────────────────────────────────────────────────────

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [workUnit, setWorkUnit] = useState<string>(WORK_UNITS[0]);
  const [timeFilled, setTimeFilled] = useState(getCurrentTimeValue);
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentLocation, setEquipmentLocation] = useState('');
  const [managers, setManagers] = useState<ReportingPerson[]>([]);
  const [tfpPersonnel, setTfpPersonnel] = useState<ReportingPerson[]>([]);
  const [managerId, setManagerId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [technicianIds, setTechnicianIds] = useState<string[]>(['']);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isManualSignerMode = workUnit !== WORK_UNITS[0];
  const supervisorOptions = tfpPersonnel.filter((person) => person.role === 'Supervisor TFP');
  const technicianOptions = tfpPersonnel.filter((person) => (
    person.role === 'Teknisi TFP' || person.role === 'Supervisor TFP'
  ));

  useEffect(() => {
    if (!isOpen) return;

    setWorkUnit(WORK_UNITS[0]);
    setTimeFilled(getCurrentTimeValue());
    setEquipmentName('');
    setEquipmentLocation('');
    setManagerId('');
    setSupervisorId('');
    setTechnicianIds(['']);
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isManualSignerMode) return;

    let isActive = true;
    setIsLoadingPersonnel(true);
    Promise.all([
      reportingDamageReportService.getManagers(),
      reportingDamageReportService.getRepairers(undefined, 'TFP'),
    ])
      .then(([managerRows, personnelRows]) => {
        if (!isActive) return;
        setManagers(managerRows);
        setTfpPersonnel(personnelRows);
      })
      .catch(() => {
        if (!isActive) return;
        setError('Gagal memuat daftar penanggung jawab TFP.');
      })
      .finally(() => {
        if (isActive) setIsLoadingPersonnel(false);
      });

    return () => { isActive = false; };
  }, [isManualSignerMode, isOpen]);

  const updateTechnician = (index: number, value: string) => {
    setTechnicianIds((prev) => prev.map((id, rowIndex) => (rowIndex === index ? value : id)));
  };

  const addTechnician = () => {
    setTechnicianIds((prev) => [...prev, '']);
  };

  const removeTechnician = (index: number) => {
    setTechnicianIds((prev) => (prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim() || !equipmentLocation.trim()) {
      setError('Nama Peralatan dan Lokasi Peralatan wajib diisi.');
      return;
    }
    if (!timeFilled) {
      setError('Jam laporan wajib diisi.');
      return;
    }

    const selectedTechnicians = technicianIds
      .filter((id) => id !== '')
      .map((id) => Number(id));

    if (isManualSignerMode) {
      if (!managerId || !supervisorId) {
        setError('Manager Teknik dan Supervisor TFP harus dipilih untuk cabang non-Surabaya.');
        return;
      }
      if (selectedTechnicians.length === 0) {
        setError('Minimal satu pelaksana teknisi harus dipilih.');
        return;
      }
      if (new Set(selectedTechnicians).size !== selectedTechnicians.length) {
        setError('Pelaksana teknisi yang sama tidak boleh dipilih lebih dari sekali.');
        return;
      }
      if (selectedTechnicians.includes(Number(supervisorId))) {
        setError('Supervisor TFP tidak dapat dipilih lagi sebagai pelaksana teknisi.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const record = await groundingReportService.createRecord({
        date: getCurrentShiftDate(),
        shift_type: getCurrentShiftType() as ShiftType,
        equipment_name: equipmentName.trim(),
        equipment_location: equipmentLocation.trim(),
        work_unit: workUnit,
        time_filled: timeFilled,
        ...(isManualSignerMode ? {
          manager_id: Number(managerId),
          supervisor_id: Number(supervisorId),
          technician_ids: selectedTechnicians,
        } : {}),
      });
      onCreated(record.id);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setError(data.message ?? 'Gagal membuat laporan.');
      } else {
        setError('Gagal membuat laporan. Coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Tambah Laporan Grounding</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-6">
          {/* Work Unit */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Kantor Unit Kerja</label>
            <select
              value={workUnit}
              onChange={(e) => setWorkUnit(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {WORK_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Jam Laporan <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={timeFilled}
              onChange={(e) => setTimeFilled(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          {/* Equipment Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Peralatan <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              placeholder="Contoh: GEDUNG AOB / TOWER"
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              autoFocus
            />
          </div>
          {/* Equipment Location */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lokasi Peralatan <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={equipmentLocation}
              onChange={(e) => setEquipmentLocation(e.target.value)}
              placeholder="Contoh: Gedung AOB / Tower"
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          {isManualSignerMode && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Penanggung Jawab TTD</p>
                <p className="text-xs text-slate-500">Dipilih manual untuk kantor unit kerja selain Cabang Surabaya.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Manager Teknik <span className="text-red-500">*</span></label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  disabled={isLoadingPersonnel}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100"
                >
                  <option value="">{isLoadingPersonnel ? 'Memuat daftar manager...' : 'Pilih Manager Teknik'}</option>
                  {managers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Supervisor TFP <span className="text-red-500">*</span></label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  disabled={isLoadingPersonnel}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100"
                >
                  <option value="">{isLoadingPersonnel ? 'Memuat daftar supervisor...' : 'Pilih Supervisor TFP'}</option>
                  {supervisorOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs font-medium text-slate-700">Pelaksana Teknisi <span className="text-red-500">*</span></label>
                  <button type="button" onClick={addTechnician} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-gray-100">
                    <Plus size={12} /> Tambah
                  </button>
                </div>
                {technicianIds.map((technicianId, index) => (
                  <div key={`technician-${index}`} className="flex items-center gap-2">
                    <select
                      value={technicianId}
                      onChange={(e) => updateTechnician(index, e.target.value)}
                      disabled={isLoadingPersonnel}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100"
                    >
                      <option value="">{isLoadingPersonnel ? 'Memuat daftar teknisi...' : `Pilih Pelaksana ${index + 1}`}</option>
                      {technicianOptions
                        .filter((person) => person.id !== Number(supervisorId))
                        .map((person) => (
                          <option key={person.id} value={person.id}>{person.name} - {person.role}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeTechnician(index)}
                      disabled={technicianIds.length === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-slate-300"
                      aria-label={`Hapus pelaksana ${index + 1}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <Plus size={15} /> Buat Laporan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main List Page ────────────────────────────────────────────────────────────

export const GroundingIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin' || user?.role === 'Manager Teknik';
  const canCreate = user?.role === 'Admin' || user?.role === 'Manager Teknik' || user?.role === 'Supervisor TFP' || user?.role === 'Teknisi TFP';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [records, setRecords] = useState<GroundingReportSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    groundingReportService.getYears().then(setAvailableYears).catch(() => setAvailableYears([new Date().getFullYear()]));
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter) params.date = dateFilter;
      if (yearFilter) params.year = yearFilter;
      if (shiftFilter) params.shift_type = shiftFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await groundingReportService.listRecords(params);
      setRecords(response.data ?? []);
      setTotalCount(response.total ?? response.data?.length ?? 0);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat daftar Laporan Grounding.');
      }
      setRecords([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, dateFilter, yearFilter, shiftFilter, statusFilter]);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  const resetFilters = () => { setSearchQuery(''); setDebouncedSearch(''); setDateFilter(''); setYearFilter(''); setShiftFilter(''); setStatusFilter(''); };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus laporan Grounding ini?')) return;
    try { await groundingReportService.deleteRecord(id); void fetchRecords(); } catch { alert('Gagal menghapus laporan.'); }
  };

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (debouncedSearch) activeFilters.push({ key: 'search', label: `"${debouncedSearch}"`, clear: () => { setSearchQuery(''); setDebouncedSearch(''); } });
  if (dateFilter) activeFilters.push({ key: 'date', label: `Tgl: ${dateFilter}`, clear: () => setDateFilter('') });
  if (yearFilter) activeFilters.push({ key: 'year', label: `Tahun: ${yearFilter}`, clear: () => setYearFilter('') });
  if (shiftFilter) activeFilters.push({ key: 'shift', label: SHIFT_LABELS[shiftFilter] ?? shiftFilter, clear: () => setShiftFilter('') });
  if (statusFilter) activeFilters.push({ key: 'status', label: STATUS_LABELS[statusFilter] ?? statusFilter, clear: () => setStatusFilter('') });
  const hasActiveFilters = activeFilters.length > 0;
  const isDBEmpty = !isLoading && !hasActiveFilters && records.length === 0 && !errorMessage;
  const isFilterEmpty = !isLoading && hasActiveFilters && records.length === 0;
  const selectClass = 'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent min-w-0';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Zap}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-700"
        title="Laporan Grounding & Penangkal Petir"
        subtitle="Laporan Grounding & Penangkal Petir Cluster Surabaya"
        actions={canCreate && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0">
            <Plus size={16} /> Tambah Laporan
          </Button>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari nomor laporan, nama peralatan, lokasi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 h-10 rounded-lg border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent" aria-label="Cari laporan grounding" />
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="h-10 flex items-center gap-1.5 px-3 rounded-lg border border-gray-300 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shrink-0" title="Reset semua filter">
              <X size={14} /><span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectClass} aria-label="Filter tanggal" />
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClass} aria-label="Filter tahun">
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className={selectClass} aria-label="Filter shift">
            <option value="">Semua Shift</option>
            <option value="pagi">Shift Pagi</option>
            <option value="siang">Shift Siang</option>
            <option value="malam">Shift Malam</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="Filter status">
            <option value="">Semua Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {hasActiveFilters && (
            <>
              <Filter size={13} className="text-slate-400 shrink-0" />
              {activeFilters.map((f) => (
                <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-0.5">
                  {f.label}
                  <button onClick={f.clear} className="ml-0.5 rounded-full hover:bg-blue-100 transition-colors" aria-label={`Hapus filter ${f.label}`}><X size={11} /></button>
                </span>
              ))}
              <span className="ml-auto text-xs text-slate-400 shrink-0">{!isLoading && `${totalCount} hasil`}</span>
            </>
          )}
          {!hasActiveFilters && !isLoading && <span className="text-xs text-slate-400 ml-auto">{totalCount > 0 ? `${totalCount} Laporan` : ''}</span>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10"><div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div></div>
        ) : isDBEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-yellow-50 flex items-center justify-center"><Zap size={24} className="text-yellow-600/70" /></div>
            <p className="text-base font-semibold text-slate-700">Belum ada Laporan Grounding</p>
            <p className="text-sm text-slate-400 max-w-md">Klik <strong>Tambah Laporan</strong> untuk membuat laporan grounding baru.</p>
            {canCreate && <Button onClick={() => setShowCreateModal(true)} className="gap-2 mt-2"><Plus size={15} /> Tambah Laporan</Button>}
          </div>
        ) : isFilterEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center"><Filter size={22} className="text-amber-400" /></div>
            <p className="text-base font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
            <button onClick={resetFilters} className="mt-2 text-sm text-blue-600 underline hover:no-underline">Reset semua filter</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">No. Laporan</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Unit Kerja</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Nama Peralatan</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Lokasi</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Tanggal</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Shift</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Teknisi</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 w-24">Anda</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const signerStatus = getSignerStatus(r, user?.name, user?.role);
                  return (
                    <tr key={r.id} onClick={() => navigate(`/grounding/reports/${r.id}`)} tabIndex={0} role="button" className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary">
                      <td className="px-6 py-4 font-mono text-slate-700 text-xs whitespace-nowrap">{r.report_number}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">{r.work_unit}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{r.equipment_name}</td>
                      <td className="px-6 py-4 text-slate-500">{r.equipment_location}</td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{r.date}</td>
                      <td className="px-6 py-4"><ShiftBadge shift={r.shift_type as import('@/types').ShiftType} /></td>
                      <td className="px-6 py-4"><div className="inline-flex items-center gap-1 text-slate-700" title={r.technician_names.join(', ')}><Users size={13} className="text-slate-400" /><span className="font-semibold">{r.technicians_count}</span><span className="text-slate-400 text-xs">teknisi</span></div></td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} variant="pill" /></td>
                      <td className="px-6 py-4">
                        {signerStatus === 'pending' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap"><PenLine size={10} /> Perlu TTD</span>}
                        {signerStatus === 'completed' && r.status === 'completed' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap"><CheckCheck size={10} /> Selesai</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => navigate(`/grounding/reports/${r.id}`)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Detail / Edit"><Edit2 size={16} /></button>
                          <button onClick={() => navigate(`/grounding/reports/${r.id}/print`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print PDF"><Printer size={16} /></button>
                          {canDelete && <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => { setShowCreateModal(false); navigate(`/grounding/reports/${id}`); }}
      />
    </div>
  );
};
