import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Edit2, Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { Badge } from '@/components/common/Badge';
import { WorkOrderFormModal } from '@/pages/work-order/components/WorkOrderFormModal';
import { mockWorkOrders } from '@/data/mockData';
import { workOrderService } from '@/services/workOrderService';
import type { WorkOrder } from '@/types';

export const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWoId, setEditingWoId] = useState<number | null>(null);

  // API state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  /**
   * Fetch work orders from the backend API.
   * Falls back to mock data if the API is unreachable.
   */
  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { per_page: '50' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (divisionFilter !== 'all') params.division = divisionFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await workOrderService.getWorkOrders(params);
      setWorkOrders(response.data);
      setIsApiAvailable(true);
    } catch {
      // Fallback to mock data if API is unreachable
      if (!isApiAvailable) {
        setWorkOrders(mockWorkOrders);
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, divisionFilter, searchQuery, isApiAvailable]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

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
      fetchWorkOrders();
    } catch {
      alert('Gagal menghapus Work Order.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Refresh data after modal closes (in case WO was created/updated)
    fetchWorkOrders();
  };

  // Client-side filtering for mock data fallback
  const filtered = isApiAvailable
    ? workOrders
    : workOrders.filter((wo) => {
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
      <PageHeader
        icon={FileText}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        title="Work Order"
        subtitle="Kelola perintah kerja dan tugas operasional"
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus size={16} />
            Buat Work Order
          </Button>
        }
      />

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
              className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="all">Semua Divisi</option>
            <option value="CNSD">CNSD</option>
            <option value="TFP">TFP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
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
                {filtered.map((wo) => (
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenEdit(wo.id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => navigate(`/work-orders/${wo.id}/print`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print PDF">
                          <Printer size={16} />
                        </button>
                        <button onClick={() => handleDelete(wo.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      Tidak ada Work Order yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WorkOrderFormModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        workOrderId={editingWoId} 
      />
    </div>
  );
};
