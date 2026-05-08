import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell, LogOut, Menu, X, Clock,
  LayoutDashboard, FileText, CheckSquare, Activity,
  Plane, Zap, Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { cn } from '@/lib/utils';
import { mockShiftSchedule, mockNotifications } from '@/data/mockData';

// ─── Nav definition ───────────────────────────────────────────
interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard',       path: '/dashboard',    icon: LayoutDashboard, roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'Work Order',      path: '/work-orders',  icon: FileText,        roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'CNSD',            path: '/cnsd',         icon: CheckSquare,     roles: ['Manager Teknik', 'Supervisor CNSD', 'Teknisi CNSD'] },
  { name: 'TFP',             path: '/tfp',          icon: Activity,        roles: ['Manager Teknik', 'Supervisor TFP', 'Teknisi TFP'] },
  { name: 'Ground Check',    path: '/ground-check', icon: Plane,           roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'Grounding',       path: '/grounding',    icon: Zap,             roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
  { name: 'User Management', path: '/admin/users',  icon: Users,           roles: ['Admin'] },
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
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const shift = mockShiftSchedule;
  const unread = unreadCount || mockNotifications.filter((n) => !n.is_read).length;

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const desktopLinkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
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
        <div className="flex items-center h-14 px-2 sm:px-4 md:px-6 gap-1 sm:gap-3">

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
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 shrink-0 select-none"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Surabaya"
              className="h-7 w-auto sm:h-8"
            />
            <div className="flex flex-col">
              <p className="text-xs sm:text-sm font-bold tracking-tight leading-none text-white">
                AirNav Surabaya
              </p>
              <p className="text-[10px] sm:text-[11px] text-white/60 font-medium tracking-wide leading-tight">
                ATOMS-Maintenance
              </p>
            </div>
          </NavLink>

          {/* ── Divider (desktop only) ── */}
          <div className="hidden lg:block w-px h-5 bg-white/20 mx-0.5 shrink-0" />

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none" role="navigation" aria-label="Main navigation">
            {visibleItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={desktopLinkCls}>
                <item.icon size={16} aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* ── Spacer on mobile to push actions right ── */}
          <div className="flex-1 lg:hidden" />

          {/* ── Shift badge (visible on larger mobile + desktop) ── */}
          <div className="hidden min-[400px]:flex shrink-0">
            <ShiftBadge shift={shift.current_shift} />
          </div>

          {/* ── Notification bell ── */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setShowNotif(!showNotif); setMobileOpen(false); }}
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-label="Notifikasi"
              aria-expanded={showNotif}
              aria-haspopup="true"
            >
              <Bell size={19} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center font-bold leading-none" aria-label={`${unread} notifikasi belum dibaca`}>
                  {unread}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden" role="menu" aria-label="Daftar notifikasi">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Notifikasi</h3>
                    <button className="text-xs text-brand-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:rounded">
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {mockNotifications.map((notif) => (
                      <button
                        key={notif.id}
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
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── User info + logout ── */}
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-white/15 shrink-0">
            <div className="hidden md:block text-right">
              <p className="text-[13px] font-semibold leading-tight text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-white/45 leading-tight">{user?.role || 'Guest'}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/20 ring-2 ring-white/10 text-white flex items-center justify-center text-sm font-bold shrink-0" aria-hidden="true">
              {userInitial}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              title="Keluar"
              aria-label="Keluar dari aplikasi"
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

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
              <div className="h-10 w-10 rounded-full bg-white/20 ring-2 ring-white/15 text-white flex items-center justify-center text-base font-bold shrink-0" aria-hidden="true">
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

            {/* Shift badge on mobile */}
            <div className="px-5 py-2.5 border-b border-white/5">
              <ShiftBadge shift={shift.current_shift} />
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

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
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
          </nav>
        </>
      )}
    </>
  );
};
