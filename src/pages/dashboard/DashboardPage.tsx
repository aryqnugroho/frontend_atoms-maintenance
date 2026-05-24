import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  CheckSquare,
  Activity,
  ClipboardList,
  BookOpen,
  ArrowRight,
  Bell,
  Users,
  Clock,
  ChevronRight,
  ChevronDown,
  Plane,
  Zap,
  LayoutDashboard,
  RefreshCw,
  Gauge,
  AlertTriangle,
  Check,
  Settings,
} from 'lucide-react';
import type { ShiftType } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { workOrderService } from '@/services/workOrderService';
import { reportingDamageReportService } from '@/services/reportingDamageReportService';
import { dashboardService, type ChecklistItem, type ShiftChecklistResponse, type LogbookSummaryResponse } from '@/services/dashboardService';
import { dashboardChecklistService, type ChecklistItem as EditableChecklistItem } from '@/services/dashboardChecklistService';
import { dashboardMonthlyService, type MonthlySummary } from '@/services/dashboardMonthlyService';
import { MonthlyReminderCard } from './components/MonthlyReminderCard';
import { getCurrentShiftType, getCurrentShiftDate, getShiftLabel } from '@/lib/shiftUtils';
import type { Notification, ShiftContextResponse, WorkOrder } from '@/types';
import type { ReportingDamageReportSummary } from '@/types/reporting';
import { OBSTACLE_CODE_LABELS } from '@/types/reporting';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Daily Reminder Catalog ────────────────────────────────
// Friendly reminders only — not enforced. The "Wajib di setiap shift" and
// current-shift sections are driven by /dashboard/shift-checklist (with real
// has_record). The collapsed OTHER-shifts sections are driven by
// /dashboard/checklist/items (full editable catalog without has_record).
//
// Both sources come from the editable dashboard_checklist_items table —
// MT/Supervisor edits propagate here automatically. See /settings/checklist.
interface ReminderItem { label: string; route: string; }

// ─── Quick Navigation ──────────────────────────────────────
// `roles` controls who sees the card. Omit `roles` to show for everyone.
// General Manager only sees: Work Order, Reporting, Logbook (oversight only —
// no equipment-form pages).
const quickNavItems: Array<{
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  path: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  hideForRoles?: string[];
}> = [
  { label: 'Work Order', icon: FileText, path: '/work-orders', color: 'text-blue-700', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
  { label: 'CNSD', icon: CheckSquare, path: '/cnsd', color: 'text-sky-700', bgColor: 'bg-sky-50', hoverColor: 'hover:bg-sky-100', hideForRoles: ['General Manager'] },
  { label: 'TFP', icon: Activity, path: '/tfp', color: 'text-emerald-700', bgColor: 'bg-emerald-50', hoverColor: 'hover:bg-emerald-100', hideForRoles: ['General Manager'] },
  { label: 'Ground Check', icon: Plane, path: '/ground-check', color: 'text-indigo-700', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100', hideForRoles: ['General Manager'] },
  { label: 'Grounding', icon: Zap, path: '/grounding', color: 'text-yellow-700', bgColor: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100', hideForRoles: ['General Manager'] },
  { label: 'Reporting', icon: ClipboardList, path: '/reporting', color: 'text-purple-700', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
  { label: 'Logbook', icon: BookOpen, path: '/logbooks', color: 'text-rose-700', bgColor: 'bg-rose-50', hoverColor: 'hover:bg-rose-100' },
];

// ─── Helper: map employee_type → division label ────────────
function toDivision(employeeType: string): string {
  if (employeeType === 'CNS') return 'CNSD';
  if (employeeType === 'Support') return 'TFP';
  return 'Management';
}

// ─── Helper: which divisions can this role see in the checklist? ──
function visibleDivisionsFor(role?: string): Set<'CNSD' | 'TFP'> {
  if (role === 'Supervisor CNSD' || role === 'Teknisi CNSD') {
    return new Set(['CNSD']);
  }
  if (role === 'Supervisor TFP' || role === 'Teknisi TFP') {
    return new Set(['TFP']);
  }
  // Admin, Manager Teknik, unknown → see both
  return new Set(['CNSD', 'TFP']);
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
  const { notifications, markAsRead } = useNotification();

  const handleNotifClick = (notif: Notification) => {
    if (!notif.is_read) {
      void markAsRead(notif.id);
    }
    // Same deep-link priority as the topbar dropdown: explicit data.route
    // first (CNSD Meter Reading), then data.wo_id (Work Order family).
    const explicitRoute = typeof notif.data?.route === 'string' ? notif.data.route : null;
    if (explicitRoute) {
      navigate(explicitRoute);
      return;
    }
    const woId = notif.data?.wo_id;
    if (woId) {
      navigate(`/work-orders/${woId}`);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

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

  // ─── Work Order Aktif (real API) — max 3 ─────────────────
  const [activeWOs, setActiveWOs] = useState<WorkOrder[]>([]);
  const [woLoading, setWoLoading] = useState(true);

  const fetchActiveWOs = useCallback(async () => {
    setWoLoading(true);
    try {
      // Fetch ongoing + on_hold only, max 3 items
      const response = await workOrderService.getWorkOrders({
        per_page: 10,
        sort_by: 'created_at',
        sort_dir: 'desc',
      });
      const all = response.data ?? [];
      // Priority: ongoing first, then on_hold, exclude completed
      const active = all.filter((wo) => wo.status === 'ongoing' || wo.status === 'on_hold');
      setActiveWOs(active.slice(0, 3));
    } catch {
      setActiveWOs([]);
    } finally {
      setWoLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActiveWOs();
  }, [fetchActiveWOs]);

  // ─── Laporan Kerusakan Terbaru (real API) — max 3 ─────────
  const [recentReports, setRecentReports] = useState<ReportingDamageReportSummary[]>([]);
  const [reportLoading, setReportLoading] = useState(true);

  const fetchRecentReports = useCallback(async () => {
    setReportLoading(true);
    try {
      // Fetch ongoing + on_hold first
      const response = await reportingDamageReportService.listReports({
        per_page: 10,
        sort_by: 'report_date',
        sort_dir: 'desc',
      });
      const all = response.data ?? [];
      // Priority: ongoing/on_hold first, then completed if nothing else
      const active = all.filter((r) => r.status === 'ongoing' || r.status === 'on_hold');
      const result = active.length > 0 ? active.slice(0, 3) : all.slice(0, 3);
      setRecentReports(result);
    } catch {
      setRecentReports([]);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecentReports();
  }, [fetchRecentReports]);

  // ─── Daily reminder card state ─────────────────────────
  const currentShift = shiftCtx?.shift_type ?? filterShiftType;
  // Track which non-active shifts the user has expanded. Default: collapsed.
  const [expandedShifts, setExpandedShifts] = useState<Set<ShiftType>>(new Set());
  const toggleShift = (s: ShiftType) => {
    setExpandedShifts((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  };
  const otherShifts: ShiftType[] = (['pagi', 'siang', 'malam'] as const).filter((s) => s !== currentShift);

  // ─── Shift checklist (real-time has_record per form) ───
  const [checklist, setChecklist] = useState<ShiftChecklistResponse | null>(null);
  const visibleDivisions = visibleDivisionsFor(user?.role);

  const fetchChecklist = useCallback(async () => {
    try {
      const data = await dashboardService.getShiftChecklist(filterDate, currentShift);
      setChecklist(data);
    } catch {
      setChecklist(null);
    }
  }, [filterDate, currentShift]);

  useEffect(() => {
    void fetchChecklist();
    const interval = setInterval(() => { void fetchChecklist(); }, 60_000);
    const onFocus = () => { void fetchChecklist(); };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchChecklist]);

  // Per-section filtered + role-filtered item lists derived from the checklist.
  // Used to render WAJIB + CURRENT-SHIFT sections with real has_record state.
  const wajibItems: ChecklistItem[] = (checklist?.items ?? [])
    .filter((i) => i.category === 'wajib' && visibleDivisions.has(i.division));
  const currentShiftItems: ChecklistItem[] = (checklist?.items ?? [])
    .filter((i) => i.category === 'shift' && i.shift === currentShift && visibleDivisions.has(i.division));

  // ─── Full editable catalog (for collapsed other-shift sections) ───
  // /dashboard/shift-checklist only returns items for the *active* shift, so
  // for the collapsed "other shifts" preview we need the full list. Fetched
  // once on mount; refreshed when the user opens /settings/checklist and
  // navigates back (window focus listener picks it up).
  const [allItems, setAllItems] = useState<EditableChecklistItem[]>([]);
  const fetchAllItems = useCallback(async () => {
    try {
      const its = await dashboardChecklistService.listItems();
      setAllItems(its);
    } catch {
      setAllItems([]);
    }
  }, []);
  useEffect(() => {
    void fetchAllItems();
    const onFocus = () => { void fetchAllItems(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAllItems]);

  // Group active items by shift_type → ReminderItem[]. Filtered by role
  // visibility (same rule used for the active shift). Drives the collapsed
  // "other shift" preview rows.
  const shiftRemindersByShift = useMemo(() => {
    const map: Record<ShiftType, ReminderItem[]> = { pagi: [], siang: [], malam: [] };
    for (const item of allItems) {
      if (item.category !== 'shift' || !item.shift_type || !item.is_active) continue;
      if (item.module_missing || !item.route || !item.division) continue;
      if (!visibleDivisions.has(item.division)) continue;
      map[item.shift_type as ShiftType].push({ label: item.label, route: item.route });
    }
    return map;
  }, [allItems, visibleDivisions]);

  // ─── Can the current user edit the reminder catalog? ───
  const canEditChecklist =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';

  // ─── Monthly summary (current calendar month) ───
  // Loaded once on mount + refreshed every 5 minutes (monthly counters change
  // slowly — no need for the 60s cadence used by the shift checklist).
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const fetchMonthly = useCallback(async () => {
    try {
      const m = await dashboardMonthlyService.getSummary();
      setMonthly(m);
    } catch {
      setMonthly(null);
    }
  }, []);
  useEffect(() => {
    void fetchMonthly();
    const interval = setInterval(() => { void fetchMonthly(); }, 5 * 60_000);
    const onFocus = () => { void fetchMonthly(); };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchMonthly]);

  // Filter monthly items by the user's visible divisions (role-based).
  const monthlyItems = (monthly?.items ?? []).filter((i) => visibleDivisions.has(i.division));
  const monthlyMet = monthlyItems.filter((i) => i.met).length;

  // ─── Logbook summary card (combined CNSD + TFP timeline) ───
  const [logbookSummary, setLogbookSummary] = useState<LogbookSummaryResponse | null>(null);
  const [logbookLoading, setLogbookLoading] = useState(true);

  const fetchLogbookSummary = useCallback(async () => {
    try {
      const data = await dashboardService.getLogbookSummary(filterDate, 8);
      setLogbookSummary(data);
    } catch {
      setLogbookSummary(null);
    } finally {
      setLogbookLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    void fetchLogbookSummary();
    const interval = setInterval(() => { void fetchLogbookSummary(); }, 60_000);
    const onFocus = () => { void fetchLogbookSummary(); };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchLogbookSummary]);

  // ─── Welcome Popup (removed — now handled by WelcomeModal in AppShell) ───

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
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

      {/* ─── Quick Navigation (Compact, role-aware) ────────────────────── */}
      {/* Filter out cards hidden for the current role. GM only sees Work Order,
          Reporting, and Logbook — the equipment-form pages aren't relevant. */}
      {(() => {
        const visibleNav = quickNavItems.filter(
          (item) => !item.hideForRoles?.includes(user?.role ?? '')
        );
        // Adaptive grid: fit available items without leaving awkward gaps when
        // GM has only 3 cards while teknisi/MT have 7.
        const lgCols =
          visibleNav.length >= 7 ? 'lg:grid-cols-7'
          : visibleNav.length === 6 ? 'lg:grid-cols-6'
          : visibleNav.length === 5 ? 'lg:grid-cols-5'
          : visibleNav.length === 4 ? 'lg:grid-cols-4'
          : 'lg:grid-cols-3';
        return (
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${lgCols} gap-3`}>
            {visibleNav.map((item) => (
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
        );
      })()}

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

        {/* Pengingat Pengecekan Harian */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className="text-blue-700" />
                <h3 className="text-base font-bold text-slate-800">Pengingat Pengecekan Harian</h3>
              </div>
              <div className="flex items-center gap-2">
                {canEditChecklist && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings/checklist')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    title="Kelola modul yang muncul di pengingat ini"
                  >
                    <Settings size={13} aria-hidden="true" /> Kelola
                  </button>
                )}
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Reminder</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pengingat saja — pengecekan tidak dibatasi oleh shift.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Wajib semua shift — items with real has_record from API */}
            {wajibItems.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200/70">
                  <AlertTriangle size={14} className="text-amber-700" aria-hidden="true" />
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Wajib di setiap shift
                  </p>
                </div>
                <ul className="divide-y divide-amber-100">
                  {wajibItems.map((item) => {
                    const done = item.has_record;
                    const targetRoute = done && item.record_id
                      ? `${item.route}/${item.record_id}`
                      : item.route;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => navigate(targetRoute)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-amber-100/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                              done ? 'bg-emerald-100' : 'bg-amber-100'
                            }`}>
                              {done
                                ? <Check size={14} className="text-emerald-700" aria-hidden="true" />
                                : <CheckSquare size={14} className="text-amber-700" aria-hidden="true" />}
                            </span>
                            <span className={`text-sm font-medium truncate ${
                              done ? 'text-slate-500' : 'text-slate-800'
                            }`}>
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {done && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                <Check size={11} aria-hidden="true" /> Sudah
                              </span>
                            )}
                            <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Current shift — expanded, with real has_record from API */}
            {currentShiftItems.length > 0 && (
              <section className="rounded-xl border border-blue-200 bg-blue-50/40">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-200/70">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{getShiftLabel(currentShift).emoji}</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      {getShiftLabel(currentShift).label}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-700/80">
                    {currentShiftItems.filter((i) => i.has_record).length}/{currentShiftItems.length} item
                  </span>
                </div>
                <ul className="divide-y divide-blue-100">
                  {currentShiftItems.map((item) => {
                    const done = item.has_record;
                    const targetRoute = done && item.record_id
                      ? `${item.route}/${item.record_id}`
                      : item.route;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => navigate(targetRoute)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-100/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                              done ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              {done
                                ? <Check size={14} className="text-emerald-700" aria-hidden="true" />
                                : <Gauge size={14} className="text-blue-700" aria-hidden="true" />}
                            </span>
                            <span className={`text-sm font-medium truncate ${
                              done ? 'text-slate-500' : 'text-slate-800'
                            }`}>
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {done && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                <Check size={11} aria-hidden="true" /> Sudah
                              </span>
                            )}
                            <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Other shifts — collapsed by default, role-filtered, no status indicator */}
            <div className="space-y-2">
              {otherShifts.map((shift) => {
                // Items per shift come from the editable catalog (DB-backed,
                // already role-filtered in shiftRemindersByShift).
                const items = shiftRemindersByShift[shift];
                if (items.length === 0) return null;
                const meta = getShiftLabel(shift);
                const open = expandedShifts.has(shift);
                return (
                  <section
                    key={shift}
                    className="rounded-xl border border-gray-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleShift(shift)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                    >
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">{meta.emoji}</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          {meta.label}
                        </p>
                        <span className="text-[11px] font-medium text-slate-500">
                          ({items.length} item)
                        </span>
                      </div>
                      {open
                        ? <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
                        : <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />}
                    </button>
                    {open && (
                      <ul className="divide-y divide-gray-100 border-t border-gray-100">
                        {items.map((item) => (
                          <li key={item.route}>
                            <button
                              type="button"
                              onClick={() => navigate(item.route)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                  <Gauge size={14} className="text-slate-500" aria-hidden="true" />
                                </span>
                                <span className="text-sm text-slate-700 truncate">{item.label}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Empty state — when role filter hides everything */}
            {wajibItems.length === 0 && currentShiftItems.length === 0 && !visibleDivisions.has('CNSD') && (
              <div className="text-center py-6 text-sm text-slate-400">
                Tidak ada pengingat untuk role Anda pada shift ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Pengingat Pengecekan Bulanan ─────────── */}
      <MonthlyReminderCard
        monthly={monthly}
        items={monthlyItems}
        metCount={monthlyMet}
        canEdit={canEditChecklist}
        onNavigate={navigate}
      />

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
          <div className="p-4">
            {woLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <RefreshCw size={15} className="animate-spin" />
                <span className="text-sm">Memuat Work Order…</span>
              </div>
            ) : activeWOs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <FileText size={28} className="text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Tidak ada Work Order aktif</p>
                <p className="text-xs text-slate-400">Semua Work Order sudah selesai atau belum ada data.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeWOs.map((wo) => (
                  <div
                    key={wo.id}
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    className="px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-gray-200 space-y-1.5"
                  >
                    {/* Row 1: WO number + division + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-xs font-mono text-slate-500 shrink-0">{wo.wo_number}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                          wo.division === 'CNSD'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {wo.division}
                        </span>
                      </div>
                      <StatusBadge status={wo.status} variant="pill" />
                    </div>
                    {/* Row 2: Description */}
                    <p className="text-sm font-semibold text-slate-800 truncate">{wo.description}</p>
                    {/* Row 3: Shift + Creator */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="capitalize">
                        Shift {wo.shift_type}
                      </span>
                      {wo.creator?.name && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">Oleh: {wo.creator.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Laporan Kerusakan Terbaru */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={20} className="text-purple-600" />
                <h3 className="text-base font-bold text-slate-800">Laporan Kerusakan Terbaru</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reporting')} className="text-xs gap-1 text-purple-700 hover:text-purple-800">
                Lihat semua <ArrowRight size={14} />
              </Button>
            </div>
          </div>
          <div className="p-4">
            {reportLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <RefreshCw size={15} className="animate-spin" />
                <span className="text-sm">Memuat laporan…</span>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <ClipboardList size={28} className="text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Belum ada Laporan Kerusakan</p>
                <p className="text-xs text-slate-400">Laporan kerusakan akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/reporting/damage-reports/${r.id}`)}
                    className="px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-gray-200 space-y-1.5"
                  >
                    {/* Row 1: Nomor surat + kategori + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-xs font-mono text-slate-500 shrink-0">{r.report_number}</p>
                        <DamageCategoryBadge category={r.damage_category} />
                      </div>
                      <StatusBadge status={r.status} variant="pill" />
                    </div>
                    {/* Row 2: Nama peralatan */}
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.equipment_name}</p>
                    {/* Row 3: Fasilitas + kode hambatan + manager */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="truncate max-w-[100px]">{r.facility}</span>
                      {r.obstacle_code && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span
                            className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600"
                            title={OBSTACLE_CODE_LABELS[r.obstacle_code]}
                          >
                            {r.obstacle_code}
                          </span>
                        </>
                      )}
                      {r.manager_name && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">MT: {r.manager_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Ringkasan Logbook (Combined CNSD + TFP timeline) ──────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-rose-700" />
            <h3 className="text-base font-bold text-slate-800">Ringkasan Logbook</h3>
            {logbookSummary?.is_fallback && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Shift {logbookSummary.fallback_shift} kemarin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!logbookLoading && logbookSummary && (logbookSummary.cnsd_count + logbookSummary.tfp_count) > 0 && (
              <span className="text-[11px] text-slate-500">
                <span className="font-semibold text-sky-700">{logbookSummary.cnsd_count}</span> CNSD ·{' '}
                <span className="font-semibold text-emerald-700">{logbookSummary.tfp_count}</span> TFP
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('/logbooks')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 inline-flex items-center gap-0.5"
            >
              Lihat semua <ChevronRight size={12} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {logbookLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !logbookSummary || logbookSummary.notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <BookOpen size={28} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Belum ada catatan logbook hari ini</p>
              <p className="text-xs text-slate-400">
                Catatan akan muncul otomatis saat form diisi atau ditambahkan manual dari halaman Logbook.
              </p>
              <button
                type="button"
                onClick={() => navigate('/logbooks')}
                className="mt-2 text-xs font-semibold text-rose-700 hover:underline"
              >
                Buka Logbook →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {logbookSummary.notes.map((note) => {
                const targetRoute = note.division === 'CNSD'
                  ? `/logbooks/cnsd/${note.logbook_id}`
                  : `/logbooks/tfp/${note.logbook_id}`;
                const shiftMeta = getShiftLabel(note.shift);
                const divisionChip = note.division === 'CNSD'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-emerald-100 text-emerald-800';

                return (
                  <li key={`${note.division}-${note.note_id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(targetRoute)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 text-left rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-inset"
                    >
                      {/* Shift indicator (emoji + time stacked) */}
                      <div className="flex flex-col items-center w-14 shrink-0">
                        <span className="text-base leading-none" aria-hidden="true">{shiftMeta.emoji}</span>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {note.time ?? '--:--'}
                        </span>
                      </div>

                      {/* Division chip + activity text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${divisionChip}`}>
                            {note.division}
                          </span>
                          {note.is_auto && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Auto
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {shiftMeta.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 truncate">
                          {note.is_auto
                            ? note.activity.replace(/^\[Auto\]\s*/, '')
                            : note.activity}
                        </p>
                      </div>

                      <ChevronRight size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ─── Recent Notifications (Vertical Timeline) ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-700" />
            <h3 className="text-base font-bold text-slate-800">Notifikasi Terbaru</h3>
          </div>
          <span className="text-xs text-slate-400">Diperbarui otomatis</span>
        </div>
        <div className="p-6">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Bell size={28} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Belum ada notifikasi</p>
              <p className="text-xs text-slate-400">Notifikasi work order akan muncul di sini secara real-time.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {recentNotifications.map((notif, index) => {
                  const isClickable = !!notif.data?.wo_id || typeof notif.data?.route === 'string';
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotifClick(notif)}
                      disabled={!isClickable}
                      className={`relative flex gap-4 w-full text-left ${
                        isClickable ? 'cursor-pointer hover:bg-slate-50/60 rounded-lg -mx-2 px-2' : 'cursor-default'
                      } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:rounded-lg`}
                    >
                      {/* Timeline Dot */}
                      <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        !notif.is_read
                          ? 'bg-blue-600 ring-4 ring-blue-100'
                          : 'bg-slate-300'
                      }`}>
                        {!notif.is_read && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-4 ${index === recentNotifications.length - 1 ? '' : 'border-b border-slate-100'}`}>
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helper: Damage Category Badge ────────────────────────
const DamageCategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, string> = {
    Ringan: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Sedang: 'bg-amber-50 text-amber-700 border-amber-200',
    Berat: 'bg-red-50 text-red-700 border-red-200',
  };
  const cls = map[category] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${cls}`}>
      {category}
    </span>
  );
};
