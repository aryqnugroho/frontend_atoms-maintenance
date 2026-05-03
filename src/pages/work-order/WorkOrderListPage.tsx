import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Badge } from '@/components/common/Badge';
import { mockWorkOrders } from '@/data/mockData';

export const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  const filtered = mockWorkOrders.filter((wo) => {
    const matchSearch =
      wo.wo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchDivision = divisionFilter === 'all' || wo.division === divisionFilter;
    return matchSearch && matchStatus && matchDivision;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola perintah kerja dan tugas operasional</p>
        </div>
        <Button onClick={() => navigate('/work-orders/create')} className="gap-2">
          <Plus size={16} />
          Buat Work Order
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari WO number atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="all">Semua Divisi</option>
            <option value="CNSD">CNSD</option>
            <option value="TFP">TFP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">No. WO</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Tipe</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Divisi</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Deskripsi</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Shift</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3 bg-gray-50/80">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo) => (
                <tr
                  key={wo.id}
                  onClick={() => navigate(`/work-orders/${wo.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-slate-700 text-xs">{wo.wo_number}</td>
                  <td className="px-6 py-4">
                    <Badge variant={wo.wo_type === 'shift' ? 'shift' : 'personal'}>
                      {wo.wo_type === 'shift' ? '👥 Shift' : '👤 Personal'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={wo.division === 'CNSD' ? 'cnsd' : 'tfp'}>{wo.division}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-xs truncate">{wo.description}</td>
                  <td className="px-6 py-4">
                    <ShiftBadge shift={wo.shift_type} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={wo.status} variant="pill" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada Work Order yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
