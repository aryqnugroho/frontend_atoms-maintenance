import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Filter,
  Edit2,
  Trash2,
  Printer,
  Users,
  PenLine,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { reportingDamageReportService } from '@/services/reportingDamageReportService';
import {
  DAMAGE_CATEGORY_LABELS,
  DAMAGE_CATEGORY_ORDER,
  OBSTACLE_CODE_LABELS,
  OBSTACLE_CODE_ORDER,
  normalizeDamageCategory,
} from '@/types/reporting';
import type {
  ReportingDamageReportSummary,
  ObstacleCode,
} from '@/types/reporting';

// ─── Helpers ──────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Ongoing',
  on_hold: 'On Hold',
  completed: 'Completed',
};

const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) !== '' && norm(a) === norm(b);
};

type SignerBadgeStatus = 'pending' | 'completed' | 'none';

const getSignerStatus = (
  record: ReportingDamageReportSummary,
  userName?: string,
  userRole?: string,
): SignerBadgeStatus => {
  if (!userName || !userRole) return 'none';
  if (record.status === 'completed') return 'completed';

  if (userRole === 'Manager Teknik' && namesMatch(record.manager_name, userName)) {
    return 'pending';
  }
  // Repairer roles can match by name in repairer_names
  const isRepairerRole = ['Teknisi CNSD', 'Teknisi TFP', 'Supervisor CNSD', 'Supervisor TFP', 'Admin']
    .includes(userRole);
  if (isRepairerRole && record.repairer_names.some((n) => namesMatch(n, userName))) {
    return 'pending';
  }
  return 'none';
};

const formatTanggalLong = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const ReportingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Supervisor is MT-equivalent (lintas divisi) → can delete reports.
  const canDelete =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';
  const canCreate =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP' ||
    user?.role === 'Teknisi CNSD' ||
    user?.role === 'Teknisi TFP';

  // ── Filter state ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [damageCategoryFilter, setDamageCategoryFilter] = useState('');
  const [obstacleCodeFilter, setObstacleCodeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Data state ─────────────────────────────────────────
  const [records, setRecords] = useState<ReportingDamageReportSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    reportingDamageReportService
      .getYears()
      .then(setAvailableYears)
      .catch(() => setAvailableYears([new Date().getFullYear()]));
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter) params.date = dateFilter;
      if (yearFilter) params.year = yearFilter;
      if (damageCategoryFilter) params.damage_category = damageCategoryFilter;
      if (obstacleCodeFilter) params.obstacle_code = obstacleCodeFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await reportingDamageReportService.listReports(params);
      setRecords(response.data ?? []);
      setTotalCount(response.total ?? response.data?.length ?? 0);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat daftar Laporan Kerusakan.');
      }
      setRecords([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, dateFilter, yearFilter, damageCategoryFilter, obstacleCodeFilter, statusFilter]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDateFilter('');
    setYearFilter('');
    setDamageCategoryFilter('');
    setObstacleCodeFilter('');
    setStatusFilter('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus Laporan Kerusakan ini?')) return;
    try {
      await reportingDamageReportService.deleteReport(id);
      void fetchRecords();
    } catch {
      alert('Gagal menghapus laporan.');
    }
  };

  // ── Active filter chips ─────────────────────────────────
  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (debouncedSearch)
    activeFilters.push({
      key: 'search',
      label: `"${debouncedSearch}"`,
      clear: () => {
        setSearchQuery('');
        setDebouncedSearch('');
      },
    });
  if (dateFilter) activeFilters.push({ key: 'date', label: `Tgl: ${dateFilter}`, clear: () => setDateFilter('') });
  if (yearFilter) activeFilters.push({ key: 'year', label: `Tahun: ${yearFilter}`, clear: () => setYearFilter('') });
  if (damageCategoryFilter)
    activeFilters.push({
      key: 'damage_category',
      label: `Kerusakan: ${damageCategoryFilter}`,
      clear: () => setDamageCategoryFilter(''),
    });
  if (obstacleCodeFilter)
    activeFilters.push({
      key: 'obstacle_code',
      label: `Hambatan: ${obstacleCodeFilter}`,
      clear: () => setObstacleCodeFilter(''),
    });
  if (statusFilter)
    activeFilters.push({
      key: 'status',
      label: STATUS_LABELS[statusFilter] ?? statusFilter,
      clear: () => setStatusFilter(''),
    });
  const hasActiveFilters = activeFilters.length > 0;

  const isDBEmpty = !isLoading && !hasActiveFilters && records.length === 0 && !errorMessage;
  const isFilterEmpty = !isLoading && hasActiveFilters && records.length === 0;

  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent min-w-0';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={ClipboardList}
        iconBg="bg-purple-100"
        iconColor="text-purple-700"
        title="Reporting"
        subtitle="Kelola laporan kerusakan peralatan"
        actions={
          canCreate && (
            <Button
              onClick={() => navigate('/reporting/damage-reports/new')}
              className="gap-2 shrink-0"
            >
              <Plus size={16} /> Tambah Laporan
            </Button>
          )
        }
      />

      {errorMessage && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor surat, nama peralatan, lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              aria-label="Cari laporan kerusakan"
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter tanggal"
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter tahun"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={damageCategoryFilter}
            onChange={(e) => setDamageCategoryFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter kategori kerusakan"
          >
            <option value="">Semua Kerusakan</option>
            {DAMAGE_CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={obstacleCodeFilter}
            onChange={(e) => setObstacleCodeFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter kode hambatan"
          >
            <option value="">Semua Hambatan</option>
            {OBSTACLE_CODE_ORDER.map((code) => (
              <option key={code} value={code}>
                {code} - {OBSTACLE_CODE_LABELS[code]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${selectClass} col-span-2 sm:col-span-1 lg:col-span-2`}
            aria-label="Filter status"
          >
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
                {!isLoading && `${totalCount} hasil`}
              </span>
            </>
          )}
          {!hasActiveFilters && !isLoading && (
            <span className="text-xs text-slate-400 ml-auto">
              {totalCount > 0 ? `${totalCount} Laporan` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
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
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center">
              <ClipboardList size={24} className="text-purple-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Belum ada Laporan Kerusakan</p>
            <p className="text-sm text-slate-400 max-w-md">
              Klik <strong>Tambah Laporan</strong> untuk membuat Laporan Kerusakan baru.
            </p>
            {canCreate && (
              <Button
                onClick={() => navigate('/reporting/damage-reports/new')}
                className="gap-2 mt-2"
              >
                <Plus size={15} /> Tambah Laporan
              </Button>
            )}
          </div>
        ) : isFilterEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Filter size={22} className="text-amber-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
            <button
              onClick={resetFilters}
              className="mt-2 text-sm text-blue-600 underline hover:no-underline"
            >
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Nomor Surat</Th>
                  <Th>Hari/Tanggal</Th>
                  <Th>Nama Peralatan</Th>
                  <Th>Fasilitas</Th>
                  <Th>Lokasi</Th>
                  <Th>Kategori Kerusakan</Th>
                  <Th>Kode Hambatan</Th>
                  <Th>Manager Teknik</Th>
                  <Th>Pelaksana</Th>
                  <Th>Status</Th>
                  <Th>Anda</Th>
                  <Th align="center" className="w-28">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const signerStatus = getSignerStatus(r, user?.name, user?.role);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/reporting/damage-reports/${r.id}`)}
                      tabIndex={0}
                      role="button"
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                    >
                      <td className="px-4 py-3 font-mono text-slate-700 text-xs whitespace-nowrap">
                        {r.report_number}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs text-slate-500">{r.day_name ?? '-'}</span>
                          <span>{formatTanggalLong(r.report_date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{r.equipment_name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.facility}</td>
                      <td className="px-4 py-3 text-slate-500">{r.location}</td>
                      <td className="px-4 py-3">
                        <DamageBadge category={r.damage_category} />
                      </td>
                      <td className="px-4 py-3">
                        {r.obstacle_code ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700"
                            title={OBSTACLE_CODE_LABELS[r.obstacle_code as ObstacleCode]}
                          >
                            {r.obstacle_code}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {r.manager_name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="inline-flex items-center gap-1 text-slate-700"
                          title={r.repairer_names.join(', ')}
                        >
                          <Users size={13} className="text-slate-400" />
                          <span className="font-semibold">{r.repairers_count}</span>
                          <span className="text-slate-400 text-xs">orang</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} variant="pill" />
                      </td>
                      <td className="px-4 py-3">
                        {signerStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            <PenLine size={10} /> Perlu TTD
                          </span>
                        )}
                        {signerStatus === 'completed' && r.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            <CheckCheck size={10} /> Selesai
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/reporting/damage-reports/${r.id}`)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Detail / Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/reporting/damage-reports/${r.id}/print`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Print PDF"
                          >
                            <Printer size={16} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
    </div>
  );
};

const Th: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}> = ({ children, align = 'left', className = '' }) => (
  <th
    className={`text-${align} text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 bg-gray-50/80 ${className}`}
  >
    {children}
  </th>
);

const DamageBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, string> = {
    '1': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '2': 'bg-amber-50 text-amber-700 border-amber-200',
    '3': 'bg-red-50 text-red-700 border-red-200',
  };
  const normalized = normalizeDamageCategory(category);
  const cls = map[normalized] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
      title={DAMAGE_CATEGORY_LABELS[normalized]}
    >
      {normalized}
    </span>
  );
};
