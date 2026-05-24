import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Printer,
  X,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Badge } from '@/components/common/Badge';
import { WorkOrderFormModal } from '@/pages/work-order/components/WorkOrderFormModal';
import { WorkOrderGmDirectiveModal } from '@/pages/work-order/components/WorkOrderGmDirectiveModal';
import { workOrderService } from '@/services/workOrderService';
import { useAuth } from '@/hooks/useAuth';
import type { WorkOrder } from '@/types';

// ─── Helpers ──────────────────────────────────────────────
const SHIFT_LABELS: Record<string, string> = {
  pagi: 'Shift Pagi',
  siang: 'Shift Siang',
  malam: 'Shift Malam',
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Ongoing',
  on_hold: 'On Hold',
  completed: 'Completed',
};

export const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGm = user?.role === 'General Manager';
  const isTeknisi = user?.role === 'Teknisi CNSD' || user?.role === 'Teknisi TFP';
  // Admin / Manager Teknik / Supervisor (MT-equivalent) can delete any WO.
  // General Manager can delete only their own ongoing gm_directive WOs.
  // Teknisi cannot delete.
  const canDeleteAny =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';
  // Teknisi cannot create WO. Everyone else with WO access can.
  const canCreateWo = !!user?.role && !isTeknisi;

  // ── Filter state ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── API data state ─────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // ── Modal state ────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWoId, setEditingWoId] = useState<number | null>(null);

  // Debounce ref for search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // ── Load available years once ─────────────────────────
  useEffect(() => {
    workOrderService.getYears().then((years) => {
      setAvailableYears(years);
    }).catch(() => {
      const currentYear = new Date().getFullYear();
      setAvailableYears([currentYear]);
    });
  }, []);

  // ── Fetch work orders ──────────────────────────────────
  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { per_page: '100' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter) params.shift_date = dateFilter;
      if (yearFilter) params.year = yearFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (shiftFilter) params.shift_type = shiftFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await workOrderService.getWorkOrders(params);
      const data = response.data ?? [];
      setWorkOrders(data);
      setTotalCount(response.total ?? data.length);
      setLoadError(null);
    } catch {
      setWorkOrders([]);
      setTotalCount(0);
      setLoadError('Gagal memuat daftar Work Order. Periksa koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, dateFilter, yearFilter, divisionFilter, shiftFilter, statusFilter]);

  useEffect(() => {
    void fetchWorkOrders();
  }, [fetchWorkOrders]);

  // ── Reset all filters ─────────────────────────────────
  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDateFilter('');
    setYearFilter('');
    setDivisionFilter('');
    setShiftFilter('');
    setStatusFilter('');
  };

  // ── Modal handlers ────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingWoId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    setEditingWoId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Work Order ini?')) return;
    try {
      await workOrderService.deleteWorkOrder(id);
      void fetchWorkOrders();
    } catch {
      alert('Gagal menghapus Work Order.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    void fetchWorkOrders();
  };

  // ── Active filter chips ───────────────────────────────
  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (debouncedSearch) activeFilters.push({ key: 'search', label: `"${debouncedSearch}"`, clear: () => { setSearchQuery(''); setDebouncedSearch(''); } });
  if (dateFilter) activeFilters.push({ key: 'date', label: `Tgl: ${dateFilter}`, clear: () => setDateFilter('') });
  if (yearFilter) activeFilters.push({ key: 'year', label: `Tahun: ${yearFilter}`, clear: () => setYearFilter('') });
  if (divisionFilter) activeFilters.push({ key: 'division', label: `Divisi: ${divisionFilter}`, clear: () => setDivisionFilter('') });
  if (shiftFilter) activeFilters.push({ key: 'shift', label: SHIFT_LABELS[shiftFilter] ?? shiftFilter, clear: () => setShiftFilter('') });
  if (statusFilter) activeFilters.push({ key: 'status', label: STATUS_LABELS[statusFilter] ?? statusFilter, clear: () => setStatusFilter('') });
  const hasActiveFilters = activeFilters.length > 0;

  // All filtering is server-side via getWorkOrders params.
  const displayed = workOrders;
  const resultCount = totalCount ?? displayed.length;
  const isDBEmpty = !isLoading && !loadError && !hasActiveFilters && displayed.length === 0;
  const isFilterEmpty = !isLoading && !loadError && hasActiveFilters && displayed.length === 0;

  const selectClass = 'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent min-w-0';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* ─── Page Header ─────────────────────────────────── */}
      <PageHeader
        icon={FileText}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        title="Work Order"
        subtitle="Kelola perintah kerja dan tugas operasional"
        actions={
          canCreateWo ? (
            <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
              <Plus size={16} />
              Buat Work Order
            </Button>
          ) : undefined
        }
      />

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
        </div>
      )}

      {/* ─── Filter Bar ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* Search + reset row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor WO atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              aria-label="Cari Work Order"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="h-10 flex items-center gap-1.5 px-3 rounded-lg border border-gray-300 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
              title="Reset semua filter"
            >
              <X size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Date */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={selectClass}
            title="Filter berdasarkan tanggal"
            aria-label="Filter tanggal"
          />

          {/* Year */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter tahun"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          {/* Division */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter divisi"
          >
            <option value="">Semua Divisi</option>
            <option value="CNSD">CNSD</option>
            <option value="TFP">TFP</option>
          </select>

          {/* Shift */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter shift"
          >
            <option value="">Semua Shift</option>
            <option value="pagi">Shift Pagi</option>
            <option value="siang">Shift Siang</option>
            <option value="malam">Shift Malam</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Active filter chips + result count */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {hasActiveFilters && (
            <>
              <Filter size={13} className="text-slate-400 shrink-0" />
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-0.5"
                >
                  {f.label}
                  <button
                    onClick={f.clear}
                    className="ml-0.5 rounded-full hover:bg-blue-100 transition-colors"
                    aria-label={`Hapus filter ${f.label}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <span className="ml-auto text-xs text-slate-400 shrink-0">
                {!isLoading && `${resultCount} hasil`}
              </span>
            </>
          )}
          {!hasActiveFilters && !isLoading && (
            <span className="text-xs text-slate-400 ml-auto">
              {resultCount !== null ? `${resultCount} Work Order` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10">
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        ) : isDBEmpty ? (
          /* Empty state — database is genuinely empty */
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center">
              <FileText size={24} className="text-indigo-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Belum ada Work Order</p>
            <p className="text-sm text-slate-400 max-w-xs">
              {canCreateWo
                ? <>Klik tombol <strong>Buat Work Order</strong> di atas untuk membuat data pertama.</>
                : 'Belum ada perintah kerja yang dibuat untuk divisi Anda.'}
            </p>
            {canCreateWo && (
              <Button onClick={handleOpenCreate} className="gap-2 mt-2">
                <Plus size={15} />
                Buat Work Order
              </Button>
            )}
          </div>
        ) : isFilterEmpty ? (
          /* Empty state — filter produced no results */
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Filter size={22} className="text-amber-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Tidak ada Work Order yang sesuai filter</p>
            <p className="text-sm text-slate-400 max-w-xs">
              Coba ubah atau hapus beberapa filter di atas.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 text-sm text-blue-600 underline hover:no-underline"
            >
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">No. WO</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Tipe</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Fasilitas</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Deskripsi</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Shift</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Status</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/work-orders/${wo.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                  >
                    <td className="px-6 py-4 font-mono text-slate-700 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{wo.wo_number}</span>
                        {wo.creator?.role === 'General Manager' && (
                          <Badge variant="gm" className="text-[10px]">Dari GM</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {wo.wo_type === 'gm_directive' ? (
                        <Badge variant="gm">Directive GM</Badge>
                      ) : wo.wo_type === 'shift' ? (
                        <Badge variant="shift">Shift</Badge>
                      ) : (
                        <Badge variant="personal">Personal</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={wo.division === 'CNSD' ? 'cnsd' : 'tfp'}>{wo.division}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      <span title={wo.description}>{wo.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <ShiftBadge shift={wo.shift_type} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={wo.status} variant="pill" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(!isGm ||
                          (wo.wo_type === 'gm_directive'
                            && wo.created_by === user?.id
                            && wo.status === 'ongoing')) && (
                          <button
                            onClick={() => handleOpenEdit(wo.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title={isGm ? 'Edit Directive' : 'Tambah Perintah'}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/work-orders/${wo.id}/print`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Print PDF"
                        >
                          <Printer size={16} />
                        </button>
                        {(canDeleteAny ||
                          (isGm
                            && wo.wo_type === 'gm_directive'
                            && wo.created_by === user?.id
                            && wo.status === 'ongoing')) && (
                          <button
                            onClick={() => handleDelete(wo.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isGm ? (
        <WorkOrderGmDirectiveModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          workOrderId={editingWoId}
        />
      ) : (
        <WorkOrderFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          workOrderId={editingWoId}
        />
      )}
    </div>
  );
};
