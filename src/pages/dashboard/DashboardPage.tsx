import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/contexts/AuthContext';
import {
  mockShiftSchedule,
  mockChecklist,
  mockWorkOrders,
  mockTroubleEquipment,
  mockNotifications,
} from '@/data/mockData';

// ─── Quick Navigation ──────────────────────────────────────
const quickNavItems = [
  { label: 'Work Order', icon: FileText, path: '/work-orders', color: 'text-blue-700', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
  { label: 'CNSD', icon: CheckSquare, path: '/cnsd', color: 'text-sky-700', bgColor: 'bg-sky-50', hoverColor: 'hover:bg-sky-100' },
  { label: 'TFP', icon: Activity, path: '/tfp', color: 'text-emerald-700', bgColor: 'bg-emerald-50', hoverColor: 'hover:bg-emerald-100' },
  { label: 'Ground Check', icon: Plane, path: '/ground-check', color: 'text-indigo-700', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100' },
  { label: 'Grounding', icon: Zap, path: '/grounding', color: 'text-yellow-700', bgColor: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100' },
  { label: 'Reporting', icon: ClipboardList, path: '/reports', color: 'text-purple-700', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
  { label: 'Logbook', icon: BookOpen, path: '/logbooks', color: 'text-rose-700', bgColor: 'bg-rose-50', hoverColor: 'hover:bg-rose-100' },
];

// ─── Shift detection ──────────────────────────────────────
function getCurrentShiftInfo() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 13) return { label: 'Shift Pagi', start: '07:00', end: '13:00', emoji: '☀️' };
  if (hour >= 13 && hour < 19) return { label: 'Shift Siang', start: '13:00', end: '19:00', emoji: '🌤️' };
  return { label: 'Shift Malam', start: '19:00', end: '07:00', emoji: '🌙' };
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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shift = mockShiftSchedule;
  const activeWOs = mockWorkOrders.filter((wo) => wo.status !== 'closed');
  const completedActive = mockChecklist.filter((c) => c.is_active && c.is_completed).length;
  const totalActive = mockChecklist.filter((c) => c.is_active).length;
  const progressPercent = totalActive > 0 ? Math.round((completedActive / totalActive) * 100) : 0;

  // ─── R4: Welcome Popup ─────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(false);
  const shiftInfo = getCurrentShiftInfo();
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
      {/* ─── R4: Welcome Popup Modal ─────────────────────── */}
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
              {shiftInfo.label} — {shiftInfo.start} s/d {shiftInfo.end} WIB
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Operasional</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500">
              Selamat datang, <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{getCurrentShiftInfo().emoji}</span>
              <span className="text-sm font-medium text-slate-600">{getCurrentShiftInfo().label}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Shift Aktif</p>
          <p className="text-sm font-bold text-blue-700">
            {shift.shift_start} - {shift.shift_end} WIB
          </p>
        </div>
      </div>

      {/* ─── Quick Navigation (Compact) ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 ${item.hoverColor} transition-all duration-200 shadow-sm hover:shadow group`}
          >
            <item.icon size={18} className={item.color} />
            <span className="text-sm font-semibold text-slate-700">{item.label}</span>
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
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {shift.personnel.length} orang
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(shift.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Management */}
              {shift.personnel.filter((p) => p.division === 'Management').length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Management</p>
                  <div className="flex flex-wrap gap-2">
                    {shift.personnel.filter((p) => p.division === 'Management').map((p) => (
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
                </div>
              )}
              {/* CNSD */}
              {shift.personnel.filter((p) => p.division === 'CNSD').length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Divisi CNSD</p>
                  <div className="flex flex-wrap gap-2">
                    {shift.personnel.filter((p) => p.division === 'CNSD').map((p) => (
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
              {shift.personnel.filter((p) => p.division === 'TFP').length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Divisi TFP</p>
                  <div className="flex flex-wrap gap-2">
                    {shift.personnel.filter((p) => p.division === 'TFP').map((p) => (
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
            {activeWOs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Belum ada Work Order aktif untuk shift ini.</p>
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
