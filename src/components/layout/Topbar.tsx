import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, LogOut, Menu, X, Clock,
  LayoutDashboard, FileText, CheckSquare, Activity,
  Plane, Zap, Users, ClipboardList, BookOpen, Inbox,
  Monitor as MonitorIcon, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { cn } from '@/lib/utils';
import { MonitorSettingsModal } from '@/components/layout/MonitorSettingsModal';
import type { Notification } from '@/types';

// Roles allowed to rotate the kiosk monitor password (must match backend
// route middleware: `role:Admin,Manager Teknik,Supervisor CNSD,Supervisor TFP`).
const MONITOR_SETTINGS_ROLES = [
  'Admin',
  'Manager Teknik',
  'Supervisor CNSD',
  'Supervisor TFP',
];

// ─── Env ──────────────────────────────────────────────────────
// ─── Nav definition ───────────────────────────────────────────
interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
  roles: string[];
}

// Nav visibility per role:
//   Admin / Manager Teknik / Supervisor (both)  → all menus (Supervisor is MT-equivalent)
//   General Manager                              → Dashboard + WO + Reporting + Logbook (read-only)
//   Teknisi CNSD                                 → Dashboard + WO + CNSD + Ground Check + Reporting + Logbook
//   Teknisi TFP                                  → Dashboard + WO + TFP + Grounding + Reporting + Logbook
// Note: Ground Check is a CNSD-side module; Grounding is a TFP-side module.
// Previous nav showed both to both teknisi roles — fixed.
const navItems: NavItem[] = [
  { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard, roles: ['Admin', 'General Manager', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'Work Order',   path: '/work-orders',  icon: FileText,        roles: ['General Manager', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'CNSD',         path: '/cnsd',         icon: CheckSquare,     roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD'] },
  { name: 'TFP',          path: '/tfp',          icon: Activity,        roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi TFP'] },
  { name: 'Ground Check', path: '/ground-check', icon: Plane,           roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD'] },
  { name: 'Grounding',    path: '/grounding',    icon: Zap,             roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi TFP'] },
  { name: 'Reporting',    path: '/reporting',    icon: ClipboardList,   roles: ['Admin', 'General Manager', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'Logbook',      path: '/logbooks',     icon: BookOpen,        roles: ['Admin', 'General Manager', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'User Mgmt',    path: '/admin/users',  icon: Users,           roles: ['Admin'] },
];

// ─── Helpers ───────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  return `${Math.floor(diff / 86400)}h`;
}

// ─── Topbar ────────────────────────────────────────────────────
export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMonitorSettings, setShowMonitorSettings] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Close the account dropdown when clicking outside.
  useEffect(() => {
    if (!showAccountMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showAccountMenu]);

  const canOpenMonitorSettings = !!user?.role && MONITOR_SETTINGS_ROLES.includes(user.role);

  const unread = unreadCount;

  // Show up to 8 newest items in the dropdown — full history lives on a
  // future /notifications page; for now the dropdown is the primary surface.
  const visibleNotifications = notifications.slice(0, 8);

  const handleNotifClick = (notif: Notification) => {
    if (!notif.is_read) {
      void markAsRead(notif.id);
    }
    setShowNotif(false);

    // Deep-link priority: data.route (explicit full path — used by CNSD
    // Meter Reading notifications) > data.wo_id (Work Order family). Skipping
    // navigation is fine; the bell badge already updated above.
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

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const desktopLinkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      // Compact: icon + short label, tight padding
      'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
      isActive
        ? 'bg-white/20 text-white'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    );

  const mobileLinkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset',
      isActive
        ? 'bg-white/15 text-white border-l-2 border-white/70'
        : 'text-white/70 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
    );

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* Main Topbar                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-sidebar border-b border-[#1a2456] shadow-md" role="banner">
        <div className="flex items-center h-14 px-3 sm:px-4 md:px-5 gap-2">

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setShowNotif(false); }}
            className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* ── Logo + Brand ── */}
          {/* Fixed min-width so brand never squishes into nav links */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 shrink-0 select-none min-w-[140px] sm:min-w-[160px]"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/assets/icon/Logo-White-AirNav.png"
              alt="AirNav Surabaya"
              className="h-7 w-auto sm:h-8 shrink-0"
            />
            <div className="flex flex-col justify-center leading-none">
              <p className="text-[13px] font-bold tracking-tight text-white leading-tight">
                AirNav Surabaya
              </p>
              {/* Hide subtitle on very small screens to save space */}
              <p className="hidden sm:block text-[10px] text-white/55 font-medium tracking-wide leading-tight mt-0.5">
                ATOMS-Maintenance
              </p>
            </div>
          </NavLink>

          {/* ── Divider (desktop only) ── */}
          <div className="hidden lg:block w-px h-5 bg-white/20 shrink-0" />

          {/* ── Desktop nav links ── */}
          {/* overflow-x-auto + scrollbar-none as safety net, but compact sizing should prevent overflow */}
          <nav
            className="hidden lg:flex items-center gap-0 flex-1 overflow-x-auto scrollbar-none"
            role="navigation"
            aria-label="Main navigation"
          >
            {visibleItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={desktopLinkCls}>
                <item.icon size={14} aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* ── Spacer on mobile to push actions right ── */}
          <div className="flex-1 lg:hidden" />

          {/* ── Right action cluster ── */}
          {/* Shift badge REMOVED from topbar — visible in Dashboard page header instead */}

          {/* ── Notification bell ── */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setShowNotif(!showNotif); setMobileOpen(false); }}
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-label="Notifikasi"
              aria-expanded={showNotif}
              aria-haspopup="true"
            >
              <Bell size={18} aria-hidden="true" />
              {unread > 0 && (
                <span
                  className="absolute top-1 right-1 bg-red-500 text-white text-[9px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center font-bold leading-none"
                  aria-label={`${unread} notifikasi belum dibaca`}
                >
                  {unread}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} aria-hidden="true" />
                <div
                  className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                  role="menu"
                  aria-label="Daftar notifikasi"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Notifikasi</h3>
                    <button
                      onClick={() => void markAllAsRead()}
                      disabled={unread === 0}
                      className="text-xs text-brand-primary hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:rounded"
                    >
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {visibleNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
                        <Inbox size={28} className="text-slate-300" aria-hidden="true" />
                        <p className="text-sm font-medium text-slate-500">Tidak ada notifikasi</p>
                        <p className="text-xs text-slate-400">Notifikasi baru akan muncul di sini.</p>
                      </div>
                    ) : (
                      visibleNotifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`w-full text-left px-4 py-3 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary ${
                            !notif.is_read ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                          role="menuitem"
                        >
                          <div className="flex items-start gap-2.5">
                            {!notif.is_read && (
                              <span className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" aria-label="Belum dibaca" />
                            )}
                            <div className={`flex-1 min-w-0 ${notif.is_read ? 'pl-[18px]' : ''}`}>
                              <p className="text-sm font-medium text-slate-800 leading-snug">{notif.title}</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                <Clock size={10} aria-hidden="true" />
                                {timeAgo(notif.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Account dropdown (avatar + name → menu with Monitor Settings + Logout) ── */}
          <div className="relative shrink-0 pl-1.5 border-l border-white/15" ref={accountMenuRef}>
            <button
              onClick={() => { setShowAccountMenu((v) => !v); setShowNotif(false); }}
              className="flex items-center gap-1.5 px-1 py-1 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-label="Menu akun"
              aria-expanded={showAccountMenu}
              aria-haspopup="menu"
            >
              <div className="hidden md:block text-right">
                <p className="text-[12px] font-semibold leading-tight text-white truncate max-w-[100px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-white/45 leading-tight truncate max-w-[100px]">
                  {user?.role || 'Guest'}
                </p>
              </div>
              <div
                className="h-7 w-7 rounded-full bg-white/20 ring-2 ring-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0"
                aria-hidden="true"
              >
                {userInitial}
              </div>
              <ChevronDown size={13} className={cn(
                'text-white/55 transition-transform hidden md:block',
                showAccountMenu && 'rotate-180'
              )} aria-hidden="true" />
            </button>

            {showAccountMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                role="menu"
                aria-label="Menu akun"
              >
                {/* User identity (mirror of the trigger, with full text) */}
                <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/60">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.role || 'Guest'}
                  </p>
                </div>

                {canOpenMonitorSettings && (
                  <button
                    onClick={() => { setShowAccountMenu(false); setShowMonitorSettings(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50"
                    role="menuitem"
                  >
                    <MonitorIcon size={15} className="text-slate-400" />
                    Monitor Settings
                  </button>
                )}

                <button
                  onClick={() => { setShowAccountMenu(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 focus-visible:outline-none focus-visible:bg-red-50"
                  role="menuitem"
                >
                  <LogOut size={15} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <MonitorSettingsModal
        isOpen={showMonitorSettings}
        onClose={() => setShowMonitorSettings(false)}
      />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Mobile nav drawer                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <>
          {/* Dim overlay */}
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <nav
            id="mobile-navigation"
            className="fixed top-14 left-0 w-[260px] bottom-0 z-30 bg-sidebar shadow-2xl lg:hidden flex flex-col border-r border-[#1a2456]"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {/* User identity block */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <div
                className="h-10 w-10 rounded-full bg-white/20 ring-2 ring-white/15 text-white flex items-center justify-center text-base font-bold shrink-0"
                aria-hidden="true"
              >
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-white/50 leading-tight truncate">
                  {user?.role || 'Guest'}
                </p>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-2">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={mobileLinkCls}
                >
                  <item.icon size={17} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Footer: app version + logout */}
            <div className="px-5 py-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/30">ATOMS-Maintenance v2.0</p>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:rounded"
                  aria-label="Keluar dari aplikasi"
                >
                  <LogOut size={13} aria-hidden="true" />
                  Keluar
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
};
