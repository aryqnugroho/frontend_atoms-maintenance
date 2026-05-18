import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity as TfpIcon, Plus, Search, X, Filter, Edit2, Trash2, Users, ArrowLeft, Printer, PenLine, CheckCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { tfpDvorService } from '@/services/tfpDvorService';
import { getCurrentShiftDate, getCurrentShiftType } from '@/lib/shiftUtils';
import type { TfpDvorRecordDetail, TfpDvorRecordSummary } from '@/types/tfpDvor';

const SHIFT_LABELS: Record<string, string> = { pagi: 'Shift Pagi', siang: 'Shift Siang', malam: 'Shift Malam' };
const STATUS_LABELS: Record<string, string> = { ongoing: 'Ongoing', on_hold: 'On Hold', completed: 'Completed' };

const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) !== '' && norm(a) === norm(b);
};

type SignerBadgeStatus = 'pending' | 'completed' | 'none';

const getSignerStatus = (record: TfpDvorRecordSummary, userName?: string, userRole?: string): SignerBadgeStatus => {
  if (!userName || !userRole) return 'none';
  if (record.status === 'completed') return 'completed';
  if (userRole === 'Manager Teknik' && namesMatch(record.manager_name, userName)) return 'pending';
  if ((userRole === 'Supervisor TFP' || userRole === 'Admin') && namesMatch(record.supervisor_name, userName)) return 'pending';
  if (userRole === 'Teknisi TFP' || userRole === 'Supervisor TFP') {
    if (record.technician_names.some((n) => namesMatch(n, userName))) return 'pending';
  }
  return 'none';
};

export const TfpDvorListPage: React.FC = () => {
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
  const [records, setRecords] = useState<TfpDvorRecordSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    tfpDvorService.getYears().then(setAvailableYears).catch(() => setAvailableYears([new Date().getFullYear()]));
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter)      params.date = dateFilter;
      if (yearFilter)      params.year = yearFilter;
      if (shiftFilter)     params.shift_type = shiftFilter;
      if (statusFilter)    params.status = statusFilter;
      const response = await tfpDvorService.listRecords(params);
      setRecords(response.data ?? []);
      setTotalCount(response.total ?? response.data?.length ?? 0);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat daftar Performance Check Gedung DVOR.');
      }
      setRecords([]); setTotalCount(0);
    } finally { setIsLoading(false); }
  }, [debouncedSearch, dateFilter, yearFilter, shiftFilter, statusFilter]);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  const resetFilters = () => { setSearchQuery(''); setDebouncedSearch(''); setDateFilter(''); setYearFilter(''); setShiftFilter(''); setStatusFilter(''); };

  const handleCreate = async () => {
    setIsCreating(true); setErrorMessage(null);
    try {
      const record: TfpDvorRecordDetail = await tfpDvorService.createRecord({ date: getCurrentShiftDate(), shift_type: getCurrentShiftType() });
      navigate(`/tfp/dvor/${record.id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string; errors?: { existing_record?: { id: number } } };
        if (err.response.status === 409 && data.errors?.existing_record) { navigate(`/tfp/dvor/${data.errors.existing_record.id}`); return; }
        if (err.response.status === 422) { setErrorMessage(data.message ?? 'Tidak ada teknisi TFP yang bertugas pada shift ini.'); return; }
        setErrorMessage(data.message ?? 'Gagal membuat Performance Check Gedung DVOR.');
        return;
      }
      setErrorMessage('Gagal membuat Performance Check Gedung DVOR. Coba lagi.');
    } finally { setIsCreating(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus form ini? Tindakan ini tidak dapat diurungkan.')) return;
    try { await tfpDvorService.deleteRecord(id); void fetchRecords(); }
    catch { alert('Gagal menghapus form.'); }
  };

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (debouncedSearch) activeFilters.push({ key: 'search', label: `"${debouncedSearch}"`, clear: () => { setSearchQuery(''); setDebouncedSearch(''); } });
  if (dateFilter)   activeFilters.push({ key: 'date',   label: `Tgl: ${dateFilter}`,                        clear: () => setDateFilter('') });
  if (yearFilter)   activeFilters.push({ key: 'year',   label: `Tahun: ${yearFilter}`,                      clear: () => setYearFilter('') });
  if (shiftFilter)  activeFilters.push({ key: 'shift',  label: SHIFT_LABELS[shiftFilter] ?? shiftFilter,    clear: () => setShiftFilter('') });
  if (statusFilter) activeFilters.push({ key: 'status', label: STATUS_LABELS[statusFilter] ?? statusFilter, clear: () => setStatusFilter('') });
  const hasActiveFilters = activeFilters.length > 0;
  const isDBEmpty     = !isLoading && !hasActiveFilters && records.length === 0 && !errorMessage;
  const isFilterEmpty = !isLoading && hasActiveFilters && records.length === 0;
  const selectClass   = 'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent min-w-0';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/tfp')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} />TFP
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">Performance Check Gedung DVOR</span>
      </div>

      <PageHeader icon={TfpIcon} iconBg="bg-emerald-100" iconColor="text-maintenance-tfp"
        title="Performance Check Gedung DVOR"
        subtitle="TFP — Teknik Fasilitas Penunjang, Cabang Surabaya"
        actions={canCreate && (
          <Button onClick={handleCreate} className="gap-2 shrink-0" isLoading={isCreating}>
            <Plus size={16} />Buat Performance Check
          </Button>
        )}
      />

      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari nomor form, manager, atau supervisor..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              aria-label="Cari Performance Check Gedung DVOR" />
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
          {hasActiveFilters && (<>
            <Filter size={13} className="text-slate-400 shrink-0" />
            {activeFilters.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-0.5">
                {f.label}
                <button onClick={f.clear} className="ml-0.5 rounded-full hover:bg-blue-100 transition-colors" aria-label={`Hapus filter ${f.label}`}><X size={11} /></button>
              </span>
            ))}
            <span className="ml-auto text-xs text-slate-400 shrink-0">{!isLoading && `${totalCount} hasil`}</span>
          </>)}
          {!hasActiveFilters && !isLoading && <span className="text-xs text-slate-400 ml-auto">{totalCount > 0 ? `${totalCount} Form` : ''}</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10"><div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div></div>
        ) : isDBEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center"><TfpIcon size={24} className="text-maintenance-tfp/70" /></div>
            <p className="text-base font-semibold text-slate-700">Belum ada Performance Check Gedung DVOR</p>
            <p className="text-sm text-slate-400 max-w-md">Klik <strong>Buat Performance Check</strong> untuk membuat form baru untuk shift hari ini.</p>
            {canCreate && <Button onClick={handleCreate} className="gap-2 mt-2" isLoading={isCreating}><Plus size={15} />Buat Performance Check</Button>}
          </div>
        ) : isFilterEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center"><Filter size={22} className="text-amber-400" /></div>
            <p className="text-base font-semibold text-slate-700">Tidak ada Form yang sesuai filter</p>
            <button onClick={resetFilters} className="mt-2 text-sm text-blue-600 underline hover:no-underline">Reset semua filter</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['No. Form', 'Tanggal', 'Jam', 'Shift', 'Teknisi TFP', 'Supervisor', 'Manager', 'Status', 'Anda', 'Aksi'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const signerStatus = getSignerStatus(r, user?.name, user?.role);
                  return (
                    <tr key={r.id} onClick={() => navigate(`/tfp/dvor/${r.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/tfp/dvor/${r.id}`); } }}
                      tabIndex={0} role="button"
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary">
                      <td className="px-6 py-4 font-mono text-slate-700 text-xs whitespace-nowrap">{r.form_number}</td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{r.date}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">{r.time_filled ?? '—'}</td>
                      <td className="px-6 py-4"><ShiftBadge shift={r.shift_type} /></td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 text-slate-700" title={r.technician_names.join(', ')}>
                          <Users size={13} className="text-slate-400" />
                          <span className="font-semibold">{r.technicians_count}</span>
                          <span className="text-slate-400 text-xs">teknisi</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {r.supervisor_name ? <Badge variant="tfp" className="text-xs">{r.supervisor_name}</Badge> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{r.manager_name ?? <span className="text-xs text-slate-400">—</span>}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} variant="pill" /></td>
                      <td className="px-6 py-4">
                        {signerStatus === 'pending' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap"><PenLine size={10} />Perlu TTD</span>}
                        {signerStatus === 'completed' && r.status === 'completed' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap"><CheckCheck size={10} />Selesai</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => navigate(`/tfp/dvor/${r.id}`)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Detail / Edit"><Edit2 size={16} /></button>
                          <button onClick={() => navigate(`/tfp/dvor/${r.id}/print`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print"><Printer size={16} /></button>
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
    </div>
  );
};
