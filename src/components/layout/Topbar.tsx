import React, { useState } from 'react';
import { Bell, LogOut, Menu, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { mockShiftSchedule, mockNotifications } from '@/data/mockData';

interface TopbarProps {
  onMenuToggle: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  return `${Math.floor(diff / 86400)}h`;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const [showNotif, setShowNotif] = useState(false);
  const shift = mockShiftSchedule;

  const unread = unreadCount || mockNotifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-14 shrink-0 bg-white backdrop-blur-sm border-b border-gray-200 shadow-sm flex items-center justify-between px-4 md:px-6 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
          <Menu size={22} />
        </button>

        {/* Logo */}
        <img src="/assets/icon/logoairnav.svg" alt="Airnav Logo" className="h-8 w-auto" data-no-transition />
        <div className="hidden md:block">
          <h1 className="text-[15px] font-bold tracking-tight leading-none text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>AirNav Indonesia</h1>
          <p className="text-[10px] text-slate-500 font-normal tracking-wide">ATOMS-Maintenance System</p>
        </div>

        {/* Shift Badge */}
        <div className="hidden sm:flex ml-3">
          <ShiftBadge shift={shift.current_shift} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-scale-up overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Notifikasi</h3>
                  <button className="text-xs text-brand-primary hover:underline">
                    Tandai semua dibaca
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.is_read && <span className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                            <Clock size={10} />
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2 ml-1 border-l border-gray-200 pl-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500">{user?.role || 'Guest'}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-sidebar text-white flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
