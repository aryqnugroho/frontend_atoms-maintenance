import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Bell, AlertTriangle, Check, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { getCurrentShiftType, getCurrentShiftDate, getShiftLabel } from '@/lib/shiftUtils';
import { dashboardService, type ShiftChecklistResponse } from '@/services/dashboardService';

// ─── Helpers ────────────────────────────────────────────────

/**
 * Map the current user's role to which divisions they should see in the
 * modal. Admin & Manager Teknik see both (rendered as separate sections);
 * CNSD/TFP supervisors and technicians see only their own.
 */
function visibleDivisionsFor(role?: string): Array<'CNSD' | 'TFP'> {
  if (role === 'Supervisor CNSD' || role === 'Teknisi CNSD') return ['CNSD'];
  if (role === 'Supervisor TFP' || role === 'Teknisi TFP') return ['TFP'];
  return ['CNSD', 'TFP'];
}

interface DisplayItem {
  key: string;
  label: string;
  route: string;
  done: boolean;
  recordId: number | null;
}

interface DivisionGroup {
  division: 'CNSD' | 'TFP';
  items: DisplayItem[];
}

export const WelcomeModal: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [checklist, setChecklist] = useState<ShiftChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentShift = getCurrentShiftType();
  const shiftInfo = getShiftLabel(currentShift);
  const currentDate = getCurrentShiftDate();

  // Show modal on every page load when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsOpen(true);
    }
  }, [isAuthenticated, user]);

  // Fetch checklist (real-time status from backend) — also polls every 60s
  // and refetches when the user returns to the tab, mirroring the dashboard
  // Pengingat card.
  const fetchChecklist = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const data = await dashboardService.getShiftChecklist(currentDate, currentShift);
      setChecklist(data);
    } catch {
      setChecklist(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, currentDate, currentShift]);

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

  if (!isOpen || !user) return null;

  // ─── Build per-division grouped checklist for the modal ──────
  // Each division section combines: (1) Work Order shift status, (2) all
  // forms relevant to this shift (wajib items + currentShift items) for that
  // division. Items that have been done show with a checkmark + dimmed style.
  const divisions = visibleDivisionsFor(user.role);

  const groups: DivisionGroup[] = divisions.map((division) => {
    const items: DisplayItem[] = [];

    // Work Order row (always shown, status from work_orders.{division} summary)
    const woSummary = checklist?.work_orders[division.toLowerCase() as 'cnsd' | 'tfp'];
    const woDone = !!woSummary?.has_shift_wo;
    items.push({
      key: `wo-${division.toLowerCase()}`,
      label: `Work Order ${division}`,
      route: woDone && woSummary?.shift_wo_id
        ? `/work-orders/${woSummary.shift_wo_id}`
        : '/work-orders',
      done: woDone,
      recordId: woSummary?.shift_wo_id ?? null,
    });

    // Wajib items for this division (CNSD readiness + TFP AOB forms)
    (checklist?.items ?? [])
      .filter((i) => i.category === 'wajib' && i.division === division)
      .forEach((i) => {
        items.push({
          key: i.key,
          label: i.label,
          route: i.has_record && i.record_id ? `${i.route}/${i.record_id}` : i.route,
          done: i.has_record,
          recordId: i.record_id,
        });
      });

    // Current-shift items for this division (CNSD meter readings on their
    // assigned shift; nothing for TFP at the moment since TFP has no per-shift
    // catalog in SHIFT_REMINDERS, but the filter still works for both).
    (checklist?.items ?? [])
      .filter((i) => i.category === 'shift' && i.shift === currentShift && i.division === division)
      .forEach((i) => {
        items.push({
          key: i.key,
          label: i.label,
          route: i.has_record && i.record_id ? `${i.route}/${i.record_id}` : i.route,
          done: i.has_record,
          recordId: i.record_id,
        });
      });

    return { division, items };
  });

  // Pick a sensible default route for the "Mulai Pengecekan" CTA — first
  // pending item across all visible groups, or dashboard if everything's done.
  const firstPending: DisplayItem | undefined = groups
    .flatMap((g) => g.items)
    .find((it) => !it.done);
  const ctaRoute = firstPending?.route ?? '/dashboard';

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  const doneCount = groups.reduce((sum, g) => sum + g.items.filter((it) => it.done).length, 0);
  const allDone = totalCount > 0 && doneCount === totalCount;

  const shiftEmoji = currentShift === 'pagi' ? '☀️' : currentShift === 'siang' ? '🌤️' : '🌙';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Selamat Datang">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in">
        {/* Header — navy gradient */}
        <div className="bg-gradient-to-br from-[#1a2555] to-[#2d3a7a] px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">Selamat datang kembali 👋</p>
              <p className="text-lg font-bold leading-tight truncate">{user.name}</p>
              <p className="text-sm text-white/70">{user.role}</p>
            </div>
            <button
              onClick={() => void fetchChecklist()}
              className="p-1.5 rounded hover:bg-white/10 transition-colors shrink-0"
              title="Refresh status checklist"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={`text-white/80 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
            <span>{shiftEmoji}</span>
            <span className="font-medium">
              {shiftInfo.label} — {shiftInfo.start} s/d {shiftInfo.end} WIB
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
          {/* Unread notifications */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
              <Bell size={16} className="text-blue-600 shrink-0" />
              <span className="text-sm text-blue-800">
                Anda memiliki <strong>{unreadCount}</strong> notifikasi belum dibaca
              </span>
            </div>
          )}

          {/* Checklist heading */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-slate-600" />
              <span className="text-sm font-semibold text-slate-800">
                Checklist shift ini
              </span>
            </div>
            {!isLoading && totalCount > 0 && (
              <span className="text-[11px] font-semibold text-slate-500">
                {doneCount}/{totalCount} selesai
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : allDone ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>Semua tugas shift ini sudah selesai!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                if (group.items.length === 0) return null;
                const groupDone = group.items.filter((it) => it.done).length;
                const tone = group.division === 'CNSD'
                  ? { ring: 'border-sky-200', chip: 'bg-sky-100 text-sky-800' }
                  : { ring: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-800' };

                return (
                  <section key={group.division} className={`rounded-lg border ${tone.ring} bg-white overflow-hidden`}>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/60 border-b border-slate-100">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tone.chip}`}>
                        {group.division}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {groupDone}/{group.items.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {group.items.map((item) => {
                        const isWO = item.key.startsWith('wo-');
                        return (
                          <li key={item.key}>
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate(item.route);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${
                                  item.done ? 'bg-emerald-100' : isWO ? 'bg-blue-50' : 'bg-amber-50'
                                }`}>
                                  {item.done ? (
                                    <Check size={12} className="text-emerald-700" aria-hidden="true" />
                                  ) : isWO ? (
                                    <FileText size={12} className="text-blue-600" aria-hidden="true" />
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  )}
                                </span>
                                <span className={`text-sm truncate ${
                                  item.done ? 'text-slate-500' : 'text-slate-800 font-medium'
                                }`}>
                                  {item.label}
                                </span>
                              </div>
                              <span className={`text-[11px] font-semibold shrink-0 ml-2 ${
                                item.done ? 'text-emerald-700' : 'text-red-500'
                              }`}>
                                {item.done ? 'Sudah' : 'Belum'}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              {/* Ongoing WO callout — only when there are open WOs on shift */}
              {checklist && (checklist.work_orders.cnsd.ongoing_count + checklist.work_orders.tfp.ongoing_count) > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800">
                    Ada{' '}
                    {divisions.includes('CNSD') && checklist.work_orders.cnsd.ongoing_count > 0 && (
                      <strong>{checklist.work_orders.cnsd.ongoing_count} WO CNSD</strong>
                    )}
                    {divisions.includes('CNSD') && checklist.work_orders.cnsd.ongoing_count > 0 && divisions.includes('TFP') && checklist.work_orders.tfp.ongoing_count > 0 && ' & '}
                    {divisions.includes('TFP') && checklist.work_orders.tfp.ongoing_count > 0 && (
                      <strong>{checklist.work_orders.tfp.ongoing_count} WO TFP</strong>
                    )}
                    {' '}masih berlangsung di shift ini.
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 text-center italic pt-1">
            Data checklist diperbarui setiap 60 detik
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 h-10 rounded-xl border border-gray-300 bg-white text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(ctaRoute);
            }}
            className="flex-1 h-10 rounded-xl bg-[#222E6A] text-sm font-medium text-white hover:bg-[#1a2555] transition-colors"
          >
            {allDone ? 'Ke Dashboard →' : 'Mulai Pengecekan →'}
          </button>
        </div>
      </div>
    </div>
  );
};
