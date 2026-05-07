import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, Zap,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { mockGroundingReports } from '@/data/mockData';

type SortField = 'lokasiKerja' | 'tanggal' | null;
type SortDirection = 'asc' | 'desc';

// ─── SortIcon defined outside component to satisfy react-hooks/static-components ───
function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400" />;
  return sortDirection === 'asc'
    ? <ArrowUp size={14} className="text-brand-primary" />
    : <ArrowDown size={14} className="text-brand-primary" />;
}

export const GroundingIndexPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = [...new Set(mockGroundingReports.map(r => r.lokasiKerja))];
    return locs.sort();
  }, []);

  // Filtered + sorted data
  const filteredReports = useMemo(() => {
    let data = [...mockGroundingReports];

    if (filterLokasi) {
      data = data.filter(r => r.lokasiKerja === filterLokasi);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r =>
        r.namaPeralatan.toLowerCase().includes(q) ||
        r.lokasiPeralatan.toLowerCase().includes(q) ||
        r.lokasiKerja.toLowerCase().includes(q) ||
        r.dibuatOleh.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      data.sort((a, b) => {
        const valA = sortField === 'tanggal' ? a.tanggal : a.lokasiKerja;
        const valB = sortField === 'tanggal' ? b.tanggal : b.lokasiKerja;
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return data;
  }, [searchQuery, filterLokasi, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };


  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Zap}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-700"
        title="Laporan Grounding & Penangkal Petir"
        subtitle="Laporan Grounding & Penangkal Petir Cluster Surabaya"
        actions={
          <Button onClick={() => navigate('/grounding/create')} className="gap-2">
            <Plus size={16} />
            Tambah Laporan
          </Button>
        }
      />

      {/* Filter Bar — matching WO inline filter */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama peralatan, lokasi, atau pembuat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <select
            value={filterLokasi}
            onChange={(e) => setFilterLokasi(e.target.value)}
            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Semua Lokasi</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table — matching WO table style */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  onClick={() => handleSort('lokasiKerja')}
                  className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Lokasi Kerja
                    <SortIcon field="lokasiKerja" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                  Nama Peralatan
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                  Lokasi Peralatan
                </th>
                <th
                  onClick={() => handleSort('tanggal')}
                  className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80 cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Tanggal Laporan
                    <SortIcon field="tanggal" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-700">{report.lokasiKerja}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{report.namaPeralatan}</td>
                    <td className="px-6 py-4 text-slate-500">{report.lokasiPeralatan}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(report.tanggal)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Lihat"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
