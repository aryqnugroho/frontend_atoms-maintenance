import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Edit2,
  Filter,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { logbookCnsdService } from '@/services/logbookCnsdService';
import type { LogbookCnsdSummary } from '@/types/logbookCnsd';

// ─── Shift accent palette ─────────────────────────────────
const SHIFT_BADGE: Record<'pagi' | 'siang' | 'malam', string> = {
  pagi: 'bg-amber-50 text-amber-700 border-amber-200',
  siang: 'bg-sky-50 text-sky-700 border-sky-200',
  malam: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};
const SHIFT_DOT: Record<'pagi' | 'siang' | 'malam', string> = {
  pagi: 'bg-amber-400',
  siang: 'bg-sky-400',
  malam: 'bg-indigo-400',
};

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr: string): string => {
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

// ─── Create Modal ──────────────────────────────────────────
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Tanggal harus dipilih.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const logbook = await logbookCnsdService.createLogbook(date);
      onCreated(logbook.id);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        const msg = data.message ?? 'Gagal membuat logbook.';
        if (msg.includes('SQLSTATE') || msg.includes('duplicate key') || msg.includes('unique constraint')) {
          setError('Logbook untuk tanggal ini sudah ada. Pilih tanggal lain atau buka logbook yang sudah ada.');
        } else {
          setError(msg);
        }
      } else {
        setError('Gagal membuat logbook. Coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-logbook-cnsd-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="create-logbook-cnsd-title" className="text-base font-semibold text-slate-800">
            Buat Logbook CNSD
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tanggal Logbook <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Boleh pilih tanggal lampau untuk backfill logbook yang belum diisi.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <Plus size={15} /> Buat Logbook
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main List Page ────────────────────────────────────────
export const LogbookCnsd: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Supervisor is MT-equivalent (lintas divisi) → either supervisor can create
  // a CNSD logbook. Teknisi TFP cannot create here.
  const canCreate =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP' ||
    user?.role === 'Teknisi CNSD';

  const canDelete =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';

  const [yearFilter, setYearFilter] = useState('');
  const [signedFilter, setSignedFilter] = useState('');

  const [logbooks, setLogbooks] = useState<LogbookCnsdSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    logbookCnsdService.getYears().then(setAvailableYears).catch(() => {
      setAvailableYears([new Date().getFullYear()]);
    });
  }, []);

  const fetchLogbooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 100 };
      if (yearFilter) params.year = yearFilter;
      if (signedFilter) params.signed = signedFilter;

      const response = await logbookCnsdService.listLogbooks(params);
      setLogbooks(response.data ?? []);
      setTotalCount(response.total ?? response.data?.length ?? 0);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat daftar Logbook CNSD.');
      }
      setLogbooks([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [yearFilter, signedFilter]);

  useEffect(() => {
    void fetchLogbooks();
  }, [fetchLogbooks]);

  const resetFilters = () => {
    setYearFilter('');
    setSignedFilter('');
  };

  const handleDelete = async (lb: LogbookCnsdSummary) => {
    const wasSigned = lb.signed_count > 0;
    const message = wasSigned
      ? `Logbook tanggal ${lb.date} sudah memiliki ${lb.signed_count}/3 tanda tangan. Hapus logbook ini dan SEMUA tanda tangan?\n\nIni tidak dapat dibatalkan, namun Anda bisa membuat ulang logbook pada tanggal yang sama.`
      : `Hapus logbook tanggal ${lb.date}?`;
    if (!confirm(message)) return;
    try {
      await logbookCnsdService.deleteLogbook(lb.id);
      void fetchLogbooks();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        alert(data.message ?? 'Gagal menghapus logbook.');
      } else {
        alert('Gagal menghapus logbook.');
      }
    }
  };

  const hasActiveFilters = !!(yearFilter || signedFilter);
  const isDBEmpty = !isLoading && !hasActiveFilters && logbooks.length === 0 && !errorMessage;
  const isFilterEmpty = !isLoading && hasActiveFilters && logbooks.length === 0;

  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent min-w-0';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/logbooks')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Logbook
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">CNSD</span>
      </div>

      <PageHeader
        icon={CheckSquare}
        iconBg="bg-sky-100"
        iconColor="text-sky-600"
        title="Logbook Fasilitas CNSD"
        subtitle="Pencatatan status peralatan dan aktivitas operasional harian CNS & Automation"
        actions={
          canCreate && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0">
              <Plus size={16} /> Buat Logbook
            </Button>
          )
        }
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mr-1">
            <Filter size={13} className="text-slate-400" />
            <span className="hidden sm:inline">Filter</span>
          </div>

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

          <select
            value={signedFilter}
            onChange={(e) => setSignedFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter status tanda tangan"
          >
            <option value="">Semua Status TTD</option>
            <option value="yes">Sudah TTD</option>
            <option value="no">Belum TTD</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="h-10 flex items-center gap-1.5 px-3 rounded-lg border border-gray-300 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              title="Reset filter"
            >
              <X size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {!isLoading && (
            <span className="ml-auto self-center text-xs text-slate-400">
              {totalCount > 0 ? `${totalCount} logbook` : ''}
            </span>
          )}
        </div>

        {hasActiveFilters && (yearFilter || signedFilter) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
            <span className="text-[11px] text-slate-400 mr-1">Aktif:</span>
            {yearFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium px-2 py-0.5">
                Tahun {yearFilter}
                <button onClick={() => setYearFilter('')} className="ml-0.5 rounded-full hover:bg-blue-100"><X size={10} /></button>
              </span>
            )}
            {signedFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium px-2 py-0.5">
                {signedFilter === 'yes' ? 'Sudah TTD' : 'Belum TTD'}
                <button onClick={() => setSignedFilter('')} className="ml-0.5 rounded-full hover:bg-blue-100"><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10">
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
            </div>
          </div>
        ) : isDBEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-sky-50 flex items-center justify-center">
              <CheckSquare size={24} className="text-sky-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Belum ada Logbook CNSD</p>
            <p className="text-sm text-slate-400 max-w-md">
              Klik <strong>Buat Logbook</strong> untuk membuat logbook harian CNSD.
            </p>
            {canCreate && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2 mt-2">
                <Plus size={15} /> Buat Logbook
              </Button>
            )}
          </div>
        ) : isFilterEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Filter size={22} className="text-amber-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Tidak ada logbook yang sesuai filter</p>
            <button onClick={resetFilters} className="mt-2 text-sm text-blue-600 underline hover:no-underline">
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Tanggal</span>
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                    Manager Teknik On Duty
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                    Status
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {logbooks.map((lb) => {
                  const status = lb.is_fully_signed
                    ? 'completed'
                    : (lb.signed_count > 0 || lb.notes_count > 0)
                      ? 'on_hold'
                      : 'ongoing';
                  return (
                    <tr
                      key={lb.id}
                      onClick={() => navigate(`/logbooks/cnsd/${lb.id}`)}
                      tabIndex={0}
                      role="button"
                      className="border-b border-gray-50 hover:bg-sky-50/30 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">{formatDateShort(lb.date)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(lb.date).split(',')[0]}</p>
                      </td>

                      <td className="px-6 py-4">
                        {lb.managers_on_duty && lb.managers_on_duty.length > 0 ? (
                          <div className="space-y-1">
                            {lb.managers_on_duty.map((mgr) => (
                              <div key={`${mgr.shift}-${mgr.user_id}`} className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${SHIFT_BADGE[mgr.shift]}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${SHIFT_DOT[mgr.shift]}`} />
                                  {mgr.shift}
                                </span>
                                <span className="text-xs font-medium text-slate-700 leading-tight">
                                  {mgr.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Roster belum dipublish</span>
                        )}
                        {lb.notes_count > 0 && (
                          <p className="inline-flex items-center gap-1 mt-2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5">
                            {lb.notes_count} catatan
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={status} variant="pill" />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {lb.signed_count}/3 shift TTD
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/logbooks/cnsd/${lb.id}`)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit / Detail"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/logbooks/cnsd/${lb.id}/print`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Print PDF"
                          >
                            <Printer size={16} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(lb)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={lb.signed_count > 0 ? `Hapus (akan menghapus ${lb.signed_count} TTD)` : 'Hapus'}
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

      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          setShowCreateModal(false);
          navigate(`/logbooks/cnsd/${id}`);
        }}
      />
    </div>
  );
};
