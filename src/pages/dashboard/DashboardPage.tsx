import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  CheckSquare,
  Activity,
  ClipboardList,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Bell,
  Users,
  Clock,
  ChevronRight,
  Plane,
  Zap,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  mockChecklist,
  mockTroubleEquipment,
  mockNotifications,
} from '@/data/mockData';
import { workOrderService } from '@/services/workOrderService';
import { getCurrentShiftType, getCurrentShiftDate, getShiftLabel } from '@/lib/shiftUtils';
import type { ShiftContextResponse, WorkOrder } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Quick Navigation ──────────────────────────────────────
const quickNavItems = [
  { label: 'Work Order', icon: FileText, path: '/work-orders', color: 'text-blue-700', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
  { label: 'CNSD', icon: CheckSquare, path: '/cnsd', color: 'text-sky-700', bgColor: 'bg-sky-50', hoverColor: 'hover:bg-sky-100' },
  { label: 'TFP', icon: Activity, path: '/tfp', color: 'text-emerald-700', bgColor: 'bg-emerald-50', hoverColor: 'hover:bg-emerald-100' },
  { label: 'Ground Check', icon: Plane, path: '/ground-check', color: 'text-indigo-700', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100' },
  { label: 'Grounding', icon: Zap, path: '/grounding', color: 'text-yellow-700', bgColor: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100' },
  { label: 'Reporting', icon: ClipboardList, path: '/reporting', color: 'text-purple-700', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
  { label: 'Logbook', icon: BookOpen, path: '/logbooks', color: 'text-rose-700', bgColor: 'bg-rose-50', hoverColor: 'hover:bg-rose-100' },
];

// ─── Helper: map employee_type → division label ────────────
function toDivision(employeeType: string): string {
  if (employeeType === 'CNS') return 'CNSD';
  if (employeeType === 'Support') return 'TFP';
  return 'Management';
}

// ─── Helper: format relative time ──────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

interface DisplayPerson {
  id: number;
  name: string;
  role: string;
  division: 'Management' | 'CNSD' | 'TFP';
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // ─── Rostering shift context state ────────────────────────
  const [shiftCtx, setShiftCtx] = useState<ShiftContextResponse | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [shiftError, setShiftError] = useState(false);

  // Compute filter from CLIENT clock — backend runs in UTC and cannot be trusted to auto-detect
  const filterShiftType = getCurrentShiftType();
  const filterDate = getCurrentShiftDate();

  const fetchShiftContext = useCallback(async () => {
    setShiftLoading(true);
    setShiftError(false);
    try {
      const authToken = token || sessionStorage.getItem('auth_token');
      const res = await axios.get(`${API_URL}/v1/personnel/shift-today`, {
        headers: { Authorization: `Bearer ${authToken}` },
        // Filter by BOTH date and shift — never date alone
        params: { date: filterDate, shift_type: filterShiftType },
      });
      setShiftCtx(res.data.data as ShiftContextResponse);
    } catch {
      setShiftError(true);
    } finally {
      setShiftLoading(false);
    }
  }, [token, filterDate, filterShiftType]);

  useEffect(() => {
    fetchShiftContext();
  }, [fetchShiftContext]);

  // ─── Derived shift display values ─────────────────────────
  const shiftInfo = getShiftLabel(shiftCtx?.shift_type ?? filterShiftType);

  const shiftStart = shiftCtx?.shift_times
    ? shiftCtx.shift_times.start_time.slice(0, 5)
    : shiftInfo.start;
  const shiftEnd = shiftCtx?.shift_times
    ? shiftCtx.shift_times.end_time.slice(0, 5)
    : shiftInfo.end;

  // Build personnel list per division.
  // Management row: Manager Teknik
  // CNSD row     : Supervisor CNSD (if any) + CNS technicians
  // TFP row      : Supervisor TFP (if any) + Support technicians
  const supervisorIds = new Set<number>();
  const displayPersonnel: DisplayPerson[] = [];

  if (shiftCtx?.roster_available) {
    if (shiftCtx.manager) {
      displayPersonnel.push({
        id: shiftCtx.manager.user_id,
        name: shiftCtx.manager.name,
        role: 'Manager Teknik',
        division: 'Management',
      });
    }
    if (shiftCtx.supervisor_cnsd) {
      supervisorIds.add(shiftCtx.supervisor_cnsd.user_id);
      displayPersonnel.push({
        id: shiftCtx.supervisor_cnsd.user_id,
        name: shiftCtx.supervisor_cnsd.name,
        role: 'Supervisor CNSD',
        division: 'CNSD',
      });
    }
    if (shiftCtx.supervisor_tfp) {
      supervisorIds.add(shiftCtx.supervisor_tfp.user_id);
      displayPersonnel.push({
        id: shiftCtx.supervisor_tfp.user_id,
        name: shiftCtx.supervisor_tfp.name,
        role: 'Supervisor TFP',
        division: 'TFP',
      });
    }
    shiftCtx.personnel.forEach((p) => {
      if (supervisorIds.has(p.user_id)) return;
      // Skip the manager if (unlikely) they appear in personnel as well
      if (shiftCtx.manager && p.user_id === shiftCtx.manager.user_id) return;
      displayPersonnel.push({
        id: p.user_id,
        name: p.name,
        role: p.employee_type === 'CNS' ? 'Teknisi CNSD' : 'Teknisi TFP',
        division: toDivision(p.employee_type) as DisplayPerson['division'],
      });
    });
  }

  // ─── Work Order Aktif (real API) ──────────────────────────
  const [activeWOs, setActiveWOs] = useState<WorkOrder[]>([]);
  const [woLoading, setWoLoading] = useState(true);

  const fetchActiveWOs = useCallback(async () => {
    setWoLoading(true);
    try {
      const response = await workOrderService.getWorkOrders({ per_page: 10, sort_by: 'created_at', sort_dir: 'desc' });
      // Show all WOs that are not completed (ongoing + on_hold)
      const all = response.data ?? [];
      setActiveWOs(all.filter((wo) => wo.status !== 'completed'));
    } catch {
      setActiveWOs([]);
    } finally {
      setWoLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActiveWOs();
  }, [fetchActiveWOs]);

  const completedActive = mockChecklist.filter((c) => c.is_active && c.is_completed).length;
  const totalActive = mockChecklist.filter((c) => c.is_active).length;
  const progressPercent = totalActive > 0 ? Math.round((completedActive / totalActive) * 100) : 0;

  // ─── Welcome Popup ─────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(false);
  const pendingChecklist = mockChecklist.filter((c) => c.is_active && !c.is_completed);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('atoms_welcome_shown');
    if (!hasShown) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        sessionStorage.setItem('atoms_welcome_shown', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ─── Welcome Popup Modal ─────────────────────── */}
      <Modal isOpen={showWelcome} onClose={() => setShowWelcome(false)} size="sm" hideCloseButton>
        {/* Gradient Navy Header */}
        <div className="-mx-6 -mt-4 px-6 pt-6 pb-5 bg-gradient-to-br from-[#222E6A] to-[#454D7C] text-white mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div>
              <p className="text-white/70 text-sm">Selamat datang kembali 👋</p>
              <h2 className="text-white font-bold text-lg leading-tight">{user?.name}</h2>
              <p className="text-white/80 text-sm">{user?.role}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-lg">{shiftInfo.emoji}</span>
            <span className="text-white text-sm font-medium">
              {shiftInfo.label} — {shiftStart} s/d {shiftEnd} WIB
            </span>
          </div>
        </div>

        {/* Body: Checklist Reminder */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span>📋</span> Checklist shift ini yang perlu diselesaikan:
          </p>
          <div className="space-y-2">
            {pendingChecklist.length > 0 ? (
              pendingChecklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="ml-auto text-xs text-amber-600 font-medium">Belum</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-600 text-center py-2">✅ Semua checklist sudah selesai!</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Data checklist diperbarui secara real-time
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowWelcome(false)}>
            Tutup
          </Button>
          <Button
            className="flex-1 bg-[#222E6A] hover:bg-[#454D7C] text-white"
            onClick={() => {
              setShowWelcome(false);
              if (pendingChecklist.length > 0 && pendingChecklist[0].route) {
                navigate(pendingChecklist[0].route);
              }
            }}
          >
            Mulai Pengecekan →
          </Button>
        </div>
      </Modal>

      {/* ─── Page Header ─────────────────────────────────────── */}
      <PageHeader
        icon={LayoutDashboard}
        iconBg="bg-blue-100"
        iconColor="text-blue-700"
        title="Dashboard Operasional"
        subtitle={`Selamat datang, ${user?.name} • ${shiftInfo.label}`}
        actions={
          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-slate-500">Jam Shift</p>
            <p className="text-sm font-bold text-blue-700">
              {shiftStart} – {shiftEnd} WIB
            </p>
          </div>
        }
      />

      {/* ─── Quick Navigation (Compact) ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {quickNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 sm:px-4 sm:py-3 ${item.hoverColor} transition-all duration-200 shadow-sm hover:shadow group min-h-[80px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2`}
          >
            <item.icon size={20} className={item.color} aria-hidden="true" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700 text-center sm:text-left">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Row: Shift Aktif + Checklist ─────────────────── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Shift Aktif */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-700" />
                <h3 className="text-base font-bold text-slate-800">Personel Bertugas</h3>
              </div>
              <div className="flex items-center gap-2">
                {shiftCtx?.roster_available && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    ● Roster aktif
                  </span>
                )}
                {!shiftLoading && !shiftCtx?.roster_available && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    ● Roster belum dipublish
                  </span>
                )}
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {shiftLoading ? '…' : displayPersonnel.length} orang
                </span>
                <button
                  onClick={fetchShiftContext}
                  disabled={shiftLoading}
                  className="p-1.5 rounded hover:bg-slate-100 transition-colors disabled:opacity-40"
                  title="Refresh data roster"
                >
                  <RefreshCw size={14} className={`text-slate-500 ${shiftLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(shiftCtx?.date ?? filterDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              <span className="mx-1.5">•</span>
              <span className="font-medium text-slate-600">{shiftInfo.label}</span>
            </p>
          </div>
          <div className="p-6">
            {shiftLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Memuat data roster…</span>
              </div>
            ) : shiftError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-500 mb-2">Gagal memuat data roster dari atoms-rostering.</p>
                <button onClick={fetchShiftContext} className="text-xs text-blue-600 underline">Coba lagi</button>
              </div>
            ) : !shiftCtx?.roster_available ? (
              <div className="text-center py-8">
                <p className="text-sm text-amber-600 font-medium mb-1">Roster belum dipublish untuk shift ini.</p>
                <p className="text-xs text-slate-400">Publish roster di atoms-rostering untuk melihat personel bertugas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Manager Teknik */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Manager Teknik</p>
                  {displayPersonnel.filter((p) => p.role === 'Manager Teknik').length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayPersonnel.filter((p) => p.role === 'Manager Teknik').map((p) => (
                        <div key={p.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-gray-200">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Manager Teknik tidak tersedia pada shift ini
                    </p>
                  )}
                </div>
                {/* CNSD */}
                {displayPersonnel.filter((p) => p.division === 'CNSD').length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Divisi CNSD</p>
                    <div className="flex flex-wrap gap-2">
                      {displayPersonnel.filter((p) => p.division === 'CNSD').map((p) => (
                        <div key={p.id} className="flex items-center gap-2 bg-sky-50 rounded-lg px-3 py-2 border border-sky-200">
                          <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* TFP */}
                {displayPersonnel.filter((p) => p.division === 'TFP').length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Divisi TFP</p>
                    <div className="flex flex-wrap gap-2">
                      {displayPersonnel.filter((p) => p.division === 'TFP').map((p) => (
                        <div key={p.id} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Checklist Pengecekan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className="text-blue-700" />
                <h3 className="text-base font-bold text-slate-800">Checklist Pengecekan</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{completedActive}/{totalActive} selesai</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-2 mb-5">
              {mockChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.is_active && !item.is_completed && item.route && navigate(item.route)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors border ${
                    item.is_active && !item.is_completed
                      ? 'hover:bg-blue-50 cursor-pointer border-gray-200'
                      : item.is_active && item.is_completed
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'opacity-50 cursor-not-allowed border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.is_completed ? (
                      <span className="text-emerald-600 text-xl">✅</span>
                    ) : item.is_active ? (
                      <span className="text-blue-500 text-xl">⬜</span>
                    ) : (
                      <span className="text-slate-400 text-xl">🔜</span>
                    )}
                    <div className="flex-1">
                      <span className={`text-sm block ${item.is_active ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                      <span className={`text-xs ${item.is_active ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.division}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.is_completed && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">Selesai</span>
                    )}
                    {!item.is_active && (
                      <span className="text-xs text-slate-400 font-medium">Coming Soon</span>
                    )}
                    {item.is_active && !item.is_completed && (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold">Progress Shift</span>
                <span className="font-bold text-blue-700">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row: Active WO + Trouble Equipment ─────────── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Work Order Aktif */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-700" />
                <h3 className="text-base font-bold text-slate-800">Work Order Aktif</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')} className="text-xs gap-1 text-blue-700 hover:text-blue-800">
                Lihat semua <ArrowRight size={14} />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {woLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <RefreshCw size={15} className="animate-spin" />
                <span className="text-sm">Memuat Work Order…</span>
              </div>
            ) : activeWOs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <FileText size={28} className="text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Work Order belum ada</p>
                <p className="text-xs text-slate-400">Belum ada Work Order yang aktif saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWOs.map((wo) => (
                  <div
                    key={wo.id}
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-gray-200"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-slate-500">{wo.wo_number}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          wo.division === 'CNSD'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {wo.division}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{wo.description}</p>
                    </div>
                    <div className="ml-4 shrink-0">
                      <StatusBadge status={wo.status} variant="pill" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Peralatan Trouble */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <h3 className="text-base font-bold text-slate-800">Peralatan Trouble</h3>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{mockTroubleEquipment.length} item</span>
            </div>
          </div>
          <div className="p-6">
            {mockTroubleEquipment.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Tidak ada peralatan trouble saat ini.</p>
            ) : (
              <div className="space-y-3">
                {mockTroubleEquipment.map((eq) => (
                  <div key={eq.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{eq.equipment_name}</p>
                      <p className="text-xs text-red-600 mt-1 font-medium">{eq.parameter}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        <span className={`font-medium ${eq.division === 'CNSD' ? 'text-sky-700' : 'text-emerald-700'}`}>{eq.division}</span>
                        <span className="mx-1.5">•</span>
                        Shift {eq.shift}
                        <span className="mx-1.5">•</span>
                        {eq.reported_by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Notifications (Vertical Timeline) ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-700" />
            <h3 className="text-base font-bold text-slate-800">Notifikasi Terbaru</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200" />
            
            <div className="space-y-4">
              {mockNotifications.slice(0, 5).map((notif, index) => (
                <div key={notif.id} className="relative flex gap-4">
                  {/* Timeline Dot */}
                  <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    !notif.is_read 
                      ? 'bg-blue-600 ring-4 ring-blue-100' 
                      : 'bg-slate-300'
                  }`}>
                    {!notif.is_read && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 pb-4 ${index === mockNotifications.slice(0, 5).length - 1 ? '' : 'border-b border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${!notif.is_read ? 'text-slate-800' : 'text-slate-600'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {notif.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                        <Clock size={12} />
                        {timeAgo(notif.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
