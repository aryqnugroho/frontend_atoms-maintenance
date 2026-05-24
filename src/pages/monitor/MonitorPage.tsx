import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Users,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  BookOpen,
  Clock,
  Check,
  Cog,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { monitorService, type MonitorSnapshot, type MonitorLogbookNote } from '@/services/monitorService';
import { MonitorPasswordGate } from './MonitorPasswordGate';

const POLL_INTERVAL_MS = 60_000;

/**
 * Workshop TV monitor — kiosk view at /monitor.
 *
 * Renders a single-page dashboard sized for a 1920x1080 landscape TV viewed
 * from 2-3m. NO scroll, NO navigation, NO action buttons. Refreshes every
 * 60 seconds via polling (snapshot endpoint already aggregates everything in
 * one round trip).
 *
 * Auth: bypasses the normal SSO flow. A separate password modal gates the
 * screen; once verified, sessionStorage carries the unlocked state until the
 * tab closes.
 */
export const MonitorPage: React.FC = () => {
  const [unlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem('monitor_unlocked') === '1'
  );

  if (!unlocked) {
    return <MonitorPasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <MonitorContent />;
};

const MonitorContent: React.FC = () => {
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const fetchSnapshot = useCallback(async () => {
    try {
      const data = await monitorService.getSnapshot();
      setSnapshot(data);
      setError(null);
    } catch (err) {
      // If the snapshot endpoint goes down, surface a small banner but keep
      // showing the last good payload so the kiosk doesn't go blank.
      const status = (axios.isAxiosError(err) && err.response?.status) || 0;
      setError(status === 0 ? 'Tidak terhubung ke server.' : 'Gagal memuat data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshot();
    const interval = setInterval(() => { void fetchSnapshot(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  // Real-time wall clock (ticks every second so the header time looks live)
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (isLoading && !snapshot) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          <span className="text-base font-medium">Memuat data monitor...</span>
        </div>
      </div>
    );
  }

  const dateLong = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  // Two clocks displayed side-by-side in the header:
  //   HH:MM:SS WIB  |  HH:MM:SS UTC
  // WIB uses local time formatting (browser is configured to Asia/Jakarta on
  // the workshop TV). UTC is computed via toLocaleTimeString with timeZone=UTC.
  const timeWib = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const timeUtc = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    timeZone: 'UTC',
  });

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-900 flex flex-col bg-[#EEF1F8]">
      {/* ─── Header — three columns: brand | clocks (centered) | shift ──── */}
      <header className="relative shrink-0 h-[76px] px-6 grid grid-cols-3 items-center bg-white border-b border-gray-200">
        {/* LEFT: logo + brand */}
        <div className="flex items-center gap-3 justify-self-start">
          <img
            src="/assets/icon/logoairnav.svg"
            alt="AirNav Surabaya"
            className="h-11 w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="leading-tight border-l border-slate-200 pl-3">
            <p className="text-[15px] font-bold text-slate-900 tracking-tight">
              AirNav Surabaya
            </p>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              ATOMS-Maintenance · Workshop Monitor
            </p>
          </div>
        </div>

        {/* CENTER: dual clock WIB | UTC */}
        <div className="justify-self-center text-center leading-none">
          <p className="text-[11px] text-slate-500 font-medium mb-1">{dateLong}</p>
          <div className="flex items-baseline gap-2.5">
            <ClockUnit value={timeWib} label="WIB" tone="brand" />
            <span className="text-slate-300 text-2xl font-light leading-none">|</span>
            <ClockUnit value={timeUtc} label="UTC" tone="muted" />
          </div>
        </div>

        {/* RIGHT: shift badge (+ optional error banner) */}
        <div className="justify-self-end flex items-center gap-3">
          {error && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5">
              <AlertTriangle size={12} /> {error}
            </span>
          )}
          {snapshot && (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Shift Aktif
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1 ring-1 ring-blue-200">
                {snapshot.shift.label.replace('Shift ', '')}
                {snapshot.shift.start_time && snapshot.shift.end_time && (
                  <span className="font-medium text-blue-600 text-[11px]">
                    {snapshot.shift.start_time.slice(0, 5)}–{snapshot.shift.end_time.slice(0, 5)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ─── Content grid (fills remaining viewport, no scroll) ──────────── */}
      <main className="flex-1 grid grid-cols-12 grid-rows-2 gap-4 p-4 overflow-hidden">
        {snapshot && (
          <>
            <PersonnelCard snapshot={snapshot} />
            <RemindersCard snapshot={snapshot} />
            <WorkOrdersCard snapshot={snapshot} />
            <DamageReportsCard snapshot={snapshot} />
            <LogbookCard snapshot={snapshot} />
          </>
        )}
      </main>
    </div>
  );
};

// ─── Header dual-clock unit ──────────────────────────────────────────────────

const ClockUnit: React.FC<{
  value: string;
  label: string;
  tone: 'brand' | 'muted';
}> = ({ value, label, tone }) => {
  const valueCls = tone === 'brand'
    ? 'text-slate-900'
    : 'text-slate-500';
  const labelCls = tone === 'brand'
    ? 'text-blue-700 bg-blue-50 ring-blue-200'
    : 'text-slate-500 bg-slate-100 ring-slate-200';
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-[28px] font-bold tabular-nums tracking-tight leading-none ${valueCls}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${labelCls}`}
      >
        {label}
      </span>
    </div>
  );
};

// ─── Card chrome (consistent across widgets) ─────────────────────────────────
//
// Toned-down to match the main /dashboard look: plain white card, gray-200
// border, subtle shadow, NO rainbow accent strips. Per-widget identity comes
// from the icon color + iconBg only. Keeps the kiosk feeling "alive" via
// clearly distinct icons + counter pills without veering into a busy/garish
// dashboard.

const Card: React.FC<{
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  accent: string;   // text color class for the icon
  iconBg: string;   // bg color class for the icon container
  className?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}> = ({ icon: Icon, title, accent, iconBg, className = '', children, rightSlot }) => (
  <section
    className={`bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden ${className}`}
  >
    <header className="shrink-0 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={accent} />
        </div>
        <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      {rightSlot}
    </header>
    <div className="flex-1 overflow-hidden">{children}</div>
  </section>
);

/** Uniform counter pill used in card headers (slate, role-agnostic). */
const HeaderPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5">
    {children}
  </span>
);

// ─── Widget: Personel Bertugas ───────────────────────────────────────────────

const PersonnelCard: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const p = snapshot.personnel;
  const cnsdCount = p.cnsd.length;
  const tfpCount = p.tfp.length;
  const total = cnsdCount + tfpCount;

  return (
    <Card
      icon={Users}
      title="Personel Bertugas"
      accent="text-blue-700"
      iconBg="bg-blue-50"
      className="col-span-4 row-span-1"
      rightSlot={<HeaderPill>{total} orang</HeaderPill>}
    >
      <div className="h-full px-5 py-3 grid grid-cols-1 gap-3 overflow-y-auto">
        {/* Manager + Supervisors row */}
        <div className="grid grid-cols-3 gap-2">
          <PersonChip label="MT" name={p.manager?.name} variant="manager" />
          <PersonChip label="SV CNSD" name={p.supervisor_cnsd?.name} variant="cnsd" />
          <PersonChip label="SV TFP" name={p.supervisor_tfp?.name} variant="tfp" />
        </div>

        {/* Two division columns */}
        <div className="grid grid-cols-2 gap-3 min-h-0 flex-1">
          <DivisionList
            title="CNSD"
            people={p.cnsd}
            accent="text-sky-700"
            accentBg="bg-sky-50"
            ring="ring-sky-200"
          />
          <DivisionList
            title="TFP"
            people={p.tfp}
            accent="text-emerald-700"
            accentBg="bg-emerald-50"
            ring="ring-emerald-200"
          />
        </div>

        {!p.roster_available && (
          <p className="text-xs text-amber-600 text-center font-medium">
            ● Roster belum dipublikasikan
          </p>
        )}
      </div>
    </Card>
  );
};

const PersonChip: React.FC<{
  label: string;
  name?: string;
  variant: 'manager' | 'cnsd' | 'tfp';
}> = ({ label, name, variant }) => {
  const colors = {
    manager: 'bg-amber-50 border-amber-200 text-amber-800',
    cnsd:    'bg-sky-50 border-sky-200 text-sky-800',
    tfp:     'bg-emerald-50 border-emerald-200 text-emerald-800',
  }[variant];
  return (
    <div className={`rounded-lg border ${colors} px-2.5 py-1.5 leading-tight`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p>
      <p className="text-[13px] font-semibold truncate">{name ?? '—'}</p>
    </div>
  );
};

const DivisionList: React.FC<{
  title: string;
  people: { name: string }[];
  accent: string;
  accentBg: string;
  ring: string;
}> = ({ title, people, accent, accentBg, ring }) => (
  <div className="flex flex-col min-h-0">
    <div className="flex items-center justify-between mb-1.5">
      <span className={`text-xs font-bold uppercase tracking-wider ${accent}`}>{title}</span>
      <span className="text-[10px] text-slate-400 font-semibold">{people.length} orang</span>
    </div>
    <div className="flex-1 overflow-y-auto pr-1 space-y-1">
      {people.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Tidak ada personel.</p>
      ) : (
        people.map((person, idx) => (
          <div
            key={`${person.name}-${idx}`}
            className={`flex items-center gap-2 ${accentBg} rounded-md px-2 py-1.5 ring-1 ${ring}`}
          >
            <span className={`h-6 w-6 rounded-full bg-white ${accent} flex items-center justify-center text-[11px] font-bold shrink-0`}>
              {person.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-[13px] font-semibold text-slate-800 truncate">{person.name}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─── Widget: Pengingat Pengecekan (Auto-Rotate Daily ⇄ Monthly) ─────────────
//
// The kiosk slot is too small (col-span-3, half-viewport height) to host both
// the daily checklist AND a monthly compliance card simultaneously without
// shrinking fonts or scrolling. Instead, the same slot auto-rotates between
// the two views every ROTATION_INTERVAL_MS so a passive observer sees both
// over time. Header shows a small pair of dots indicating which view is
// active; clicking is not supported (kiosks are non-interactive).
//
// When the monthly view has no configured targets, rotation is suppressed
// and the slot stays on daily — no point flashing an empty card.

const ROTATION_INTERVAL_MS = 20_000;

type ReminderView = 'daily' | 'monthly';

const RemindersCard: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const hasMonthly = snapshot.monthly && snapshot.monthly.items.length > 0;
  const [view, setView] = useState<ReminderView>('daily');

  // Rotate views on a fixed interval. Skip rotation entirely when monthly
  // is empty (otherwise the slot would flash a useless empty state).
  useEffect(() => {
    if (!hasMonthly) {
      setView('daily');
      return;
    }
    const interval = setInterval(() => {
      setView((prev) => (prev === 'daily' ? 'monthly' : 'daily'));
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasMonthly]);

  const { wajib_total, wajib_done, shift_total, shift_done } = snapshot.checklist;
  const monthly = snapshot.monthly;

  const cardIcon = view === 'daily' ? ClipboardCheck : Calendar;
  const cardTitle = view === 'daily' ? 'Pengingat Harian' : 'Pengingat Bulanan';
  const cardAccent = view === 'daily' ? 'text-violet-700' : 'text-rose-700';
  const cardIconBg = view === 'daily' ? 'bg-violet-50' : 'bg-rose-50';

  const headerPill = view === 'daily'
    ? <HeaderPill>{wajib_done + shift_done}/{wajib_total + shift_total}</HeaderPill>
    : <HeaderPill>{monthly.targets_met}/{monthly.targets_total} terpenuhi</HeaderPill>;

  return (
    <Card
      icon={cardIcon}
      title={cardTitle}
      accent={cardAccent}
      iconBg={cardIconBg}
      className="col-span-3 row-span-1"
      rightSlot={
        <div className="flex items-center gap-2">
          {headerPill}
          {hasMonthly && <RotationDots view={view} />}
        </div>
      }
    >
      {view === 'daily'
        ? <DailyView snapshot={snapshot} />
        : <MonthlyView monthly={monthly} />}
    </Card>
  );
};

/**
 * Tiny pair of dots in the card header that signals "this card rotates
 * between two views." Active view has a filled dot; the other is hollow.
 * Subtle enough not to distract from the data, visible enough that an
 * observer learns the rotation pattern.
 */
const RotationDots: React.FC<{ view: ReminderView }> = ({ view }) => (
  <span
    className="flex items-center gap-0.5"
    aria-label={`Tampilan: ${view === 'daily' ? 'harian' : 'bulanan'} (rotasi otomatis)`}
    title="Auto-rotate harian ⇄ bulanan"
  >
    <span className={`h-1.5 w-1.5 rounded-full ${view === 'daily' ? 'bg-violet-500' : 'bg-slate-300'}`} />
    <span className={`h-1.5 w-1.5 rounded-full ${view === 'monthly' ? 'bg-rose-500' : 'bg-slate-300'}`} />
  </span>
);

// ─── Daily view (was previously the whole ChecklistCard body) ───────────────

const DailyView: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const { items, wajib_total, wajib_done, shift_total, shift_done } = snapshot.checklist;
  const wajibItems = items.filter((i) => i.category === 'wajib');
  const shiftItems = items.filter((i) => i.category === 'shift');

  return (
    <div className="h-full px-5 py-3 flex flex-col gap-3 overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Wajib Setiap Shift
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {wajib_done}/{wajib_total}
          </span>
        </div>
        <div className="space-y-1">
          {wajibItems.map((item) => (
            <ChecklistRow key={item.key} label={item.label} division={item.division} done={item.has_record} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Shift {snapshot.shift.type.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {shift_done}/{shift_total}
          </span>
        </div>
        <div className="space-y-1">
          {shiftItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Tidak ada item.</p>
          ) : (
            shiftItems.map((item) => (
              <ChecklistRow key={item.key} label={item.label} division={item.division} done={item.has_record} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ChecklistRow: React.FC<{ label: string; division: 'CNSD' | 'TFP'; done: boolean }> = ({
  label, division, done,
}) => {
  const divColors = division === 'CNSD' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
  return (
    <div
      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 border ${
        done ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${divColors} shrink-0`}>
          {division}
        </span>
        <span className={`text-[13px] truncate ${done ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}`}>
          {label}
        </span>
      </div>
      {done ? (
        <Check size={16} className="text-emerald-500 shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
      )}
    </div>
  );
};

// ─── Monthly view ──────────────────────────────────────────────────────────

const MonthlyView: React.FC<{ monthly: MonitorSnapshot['monthly'] }> = ({ monthly }) => (
  <div className="h-full px-5 py-3 flex flex-col gap-2 overflow-y-auto">
    <div className="flex items-center justify-between mb-0.5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {monthly.month_label}
      </span>
      <span className="text-[10px] text-slate-400 font-semibold">
        target bulan ini
      </span>
    </div>

    {monthly.items.length === 0 ? (
      <p className="text-xs text-slate-400 italic">Belum ada target bulanan dikonfigurasi.</p>
    ) : (
      <div className="space-y-1.5">
        {monthly.items.map((item) => (
          <MonthlyRow key={item.id} item={item} />
        ))}
      </div>
    )}
  </div>
);

const MonthlyRow: React.FC<{ item: MonitorSnapshot['monthly']['items'][number] }> = ({ item }) => {
  const divColors = item.division === 'CNSD' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
  const tone = item.met
    ? 'bg-emerald-50/60 border-emerald-200'
    : 'bg-amber-50/60 border-amber-200';
  const progressColor = item.met ? 'text-emerald-700' : 'text-amber-700';

  return (
    <div className={`rounded-md border px-2.5 py-1.5 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${divColors} shrink-0 mt-0.5`}>
            {item.division}
          </span>
          <span className="text-[12px] font-medium text-slate-800 leading-tight">
            {item.label}
          </span>
        </div>
        <div className={`text-[13px] font-bold tabular-nums shrink-0 ${progressColor}`}>
          {item.current_count}<span className="text-slate-400 text-[11px]">/{item.min_count}</span>
        </div>
      </div>
      {item.records.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-0.5 pl-7 leading-snug truncate" title={item.records.map((r) => r.date).join(', ')}>
          Tgl: {formatMonthlyDates(item.records.map((r) => r.date))}
        </p>
      )}
    </div>
  );
};

/**
 * Compact day-list for the kiosk row, e.g. ['2026-05-05','2026-05-18'] → "5, 18".
 * Drops month name (already shown in card header) to save space.
 */
function formatMonthlyDates(dates: string[]): string {
  return dates.map((d) => new Date(d).getDate()).join(', ');
}

// ─── Widget: Work Orders Aktif ───────────────────────────────────────────────

/**
 * Renders today's ongoing WOs plus every on_hold WO regardless of date
 * (on_hold = signature backlog the workshop needs to clear).
 *
 * Each row shows three mini per-role TTD badges (TEK / SV / MT) so MT in
 * the workshop can see at a glance which signature is still pending without
 * opening the WO. Gray = not required (e.g. SV when has_supervisor=false,
 * or all three for a GM directive). Emerald = signed. Red = pending.
 */
const WorkOrdersCard: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const onHoldCount = snapshot.work_orders.filter((w) => w.status === 'on_hold').length;

  return (
  <Card
    icon={FileText}
    title="Work Order Aktif"
    accent="text-sky-700"
    iconBg="bg-sky-50"
    className="col-span-5 row-span-1"
    rightSlot={
      <div className="flex items-center gap-1.5">
        {onHoldCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5">
            {onHoldCount} on hold
          </span>
        )}
        <HeaderPill>{snapshot.work_orders.length} aktif</HeaderPill>
      </div>
    }
  >
    <div className="h-full px-5 py-3 overflow-y-auto">
      {snapshot.work_orders.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-2.5 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <Check size={28} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Semua Work Order Tuntas</p>
            <p className="text-xs text-slate-400 mt-0.5">Tidak ada WO ongoing maupun on hold yang menunggu tanda tangan.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {snapshot.work_orders.map((wo) => {
            const statusColors = wo.status === 'on_hold'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800';
            const divColors = wo.division === 'CNSD'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-emerald-100 text-emerald-700';
            return (
              <div
                key={wo.id}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${statusColors}`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0 w-[78px]">
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    {wo.wo_number.slice(-8)}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${divColors}`}>
                    {wo.division}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {wo.description || '(tanpa deskripsi)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                    {wo.manager_name && (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-slate-600">MT:</span> {wo.manager_name}
                      </span>
                    )}
                    {wo.is_gm_directive && (
                      <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5">
                        Dari GM
                      </span>
                    )}
                    <SignatureBadges sig={wo.signature_status} />
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    wo.status === 'on_hold'
                      ? 'bg-amber-200/60 text-amber-900'
                      : 'bg-blue-200/60 text-blue-900'
                  }`}
                >
                  {wo.status === 'on_hold' ? 'On Hold' : 'Ongoing'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </Card>
  );
};

/**
 * Per-role signature pills for a single WO row. Shows TEK / SV / MT side
 * by side, colored by status:
 *   emerald (✓) = sudah TTD
 *   red     (×) = belum TTD
 *   slate   (–) = tidak diperlukan untuk WO ini (mis. SV ketika has_supervisor=false)
 *
 * If all 3 roles are null (gm_directive), the whole strip is hidden.
 */
const SignatureBadges: React.FC<{
  sig: { technician: boolean | null; supervisor: boolean | null; mt: boolean | null };
}> = ({ sig }) => {
  const allHidden = sig.technician === null && sig.supervisor === null && sig.mt === null;
  if (allHidden) return null;

  return (
    <span className="inline-flex items-center gap-1" aria-label="Status tanda tangan">
      <SigPill label="TEK" status={sig.technician} />
      <SigPill label="SV"  status={sig.supervisor} />
      <SigPill label="MT"  status={sig.mt} />
    </span>
  );
};

const SigPill: React.FC<{ label: string; status: boolean | null }> = ({ label, status }) => {
  if (status === null) {
    // Role not required for this WO — render a muted strikethrough hint.
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded bg-slate-100 text-slate-400 text-[9px] font-bold px-1 py-0.5"
        title={`${label}: tidak diperlukan`}
      >
        {label} <span className="opacity-60">–</span>
      </span>
    );
  }
  if (status) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1 py-0.5"
        title={`${label}: sudah ditandatangani`}
      >
        {label} <Check size={9} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold px-1 py-0.5"
      title={`${label}: belum ditandatangani`}
    >
      {label} <span className="leading-none">×</span>
    </span>
  );
};

// ─── Widget: Laporan Kerusakan Terbaru ───────────────────────────────────────

const DamageReportsCard: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const formatTanggal = (s: string): string => {
    try {
      return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return s;
    }
  };
  const damageColor = (cat: string) => {
    const n = cat.trim();
    if (n === '3') return 'bg-red-50 border-red-200 text-red-700';
    if (n === '2') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  return (
    <Card
      icon={AlertTriangle}
      title="Laporan Kerusakan Terbaru"
      accent="text-orange-700"
      iconBg="bg-orange-50"
      className="col-span-5 row-span-1"
      rightSlot={<HeaderPill>{snapshot.damage_reports.length} laporan</HeaderPill>}
    >
      <div className="h-full px-5 py-3 overflow-y-auto">
        {snapshot.damage_reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2.5 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check size={28} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Tidak Ada Laporan</p>
              <p className="text-xs text-slate-400 mt-0.5">Semua peralatan dalam kondisi baik.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {snapshot.damage_reports.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className={`shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center text-[14px] font-bold ${damageColor(r.damage_category)}`}>
                  {r.damage_category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-slate-800 truncate">
                      {r.equipment_name}
                    </p>
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      r.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : r.status === 'on_hold'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {r.status === 'on_hold' ? 'On Hold' : r.status === 'completed' ? 'Selesai' : 'Ongoing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono">{r.report_number}</span>
                    <span>·</span>
                    <span className="truncate">{r.location}</span>
                    <span>·</span>
                    <span>{formatTanggal(r.report_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Widget: Ringkasan Logbook ───────────────────────────────────────────────

const LogbookCard: React.FC<{ snapshot: MonitorSnapshot }> = ({ snapshot }) => {
  const { notes, cnsd_count, tfp_count, total_count, is_fallback, source_date } = snapshot.logbook;

  const grouped = useMemo(() => {
    const byShift: Record<string, MonitorLogbookNote[]> = { malam: [], siang: [], pagi: [] };
    for (const n of notes) {
      if (!byShift[n.shift]) byShift[n.shift] = [];
      byShift[n.shift].push(n);
    }
    return byShift;
  }, [notes]);

  const shiftOrder = ['malam', 'siang', 'pagi'] as const;
  const shiftLabels: Record<string, string> = {
    pagi: 'Pagi', siang: 'Siang', malam: 'Malam',
  };

  return (
    <Card
      icon={BookOpen}
      title="Ringkasan Logbook"
      accent="text-rose-700"
      iconBg="bg-rose-50"
      className="col-span-7 row-span-1"
      rightSlot={
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 font-bold px-2 py-0.5">
            CNSD {cnsd_count}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5">
            TFP {tfp_count}
          </span>
          <HeaderPill>{total_count} catatan</HeaderPill>
        </div>
      }
    >
      <div className="h-full px-5 py-3 overflow-y-auto">
        {is_fallback && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-1">
            <Clock size={11} />
            Belum ada catatan hari ini · menampilkan shift malam dari {source_date}
          </div>
        )}

        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2.5 text-center">
            <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center">
              <BookOpen size={26} className="text-rose-400" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan</p>
              <p className="text-xs text-slate-400 mt-0.5">Catatan akan muncul saat teknisi mengisi logbook atau form.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 h-full">
            {shiftOrder.map((s) => {
              const list = grouped[s] ?? [];
              if (list.length === 0) return (
                <div key={s} className="flex flex-col min-h-0">
                  <ShiftHeader shift={s} label={shiftLabels[s]} count={0} />
                  <p className="text-xs text-slate-400 italic mt-2">Tidak ada catatan.</p>
                </div>
              );
              return (
                <div key={s} className="flex flex-col min-h-0">
                  <ShiftHeader shift={s} label={shiftLabels[s]} count={list.length} />
                  <div className="flex-1 overflow-y-auto pr-1 mt-1 space-y-1.5">
                    {list.map((n, idx) => (
                      <LogbookNoteRow key={`${s}-${idx}`} note={n} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

const ShiftHeader: React.FC<{ shift: string; label: string; count: number }> = ({ shift, label, count }) => {
  const colors: Record<string, string> = {
    pagi:  'bg-amber-50 border-amber-200 text-amber-800',
    siang: 'bg-orange-50 border-orange-200 text-orange-800',
    malam: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  };
  return (
    <div className={`shrink-0 flex items-center justify-between rounded-md border px-2 py-1 ${colors[shift]}`}>
      <span className="text-xs font-bold uppercase tracking-wider">Shift {label}</span>
      <span className="text-[10px] font-semibold opacity-75">{count}</span>
    </div>
  );
};

const LogbookNoteRow: React.FC<{ note: MonitorLogbookNote }> = ({ note }) => {
  const divColors = note.division === 'CNSD'
    ? 'bg-sky-100 text-sky-700'
    : 'bg-emerald-100 text-emerald-700';
  return (
    <div className={`rounded-md border px-2 py-1.5 leading-snug ${
      note.is_auto ? 'border-dashed border-slate-200 bg-slate-50/40' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${divColors}`}>
          {note.division}
        </span>
        {note.time && (
          <span className="text-[10px] font-mono font-semibold text-slate-500">
            {note.time}
          </span>
        )}
        {note.is_auto && (
          <Cog size={9} className="text-slate-400" aria-label="Catatan otomatis" />
        )}
      </div>
      <p className={`text-[12px] ${note.is_auto ? 'text-slate-500 italic' : 'text-slate-800'}`}>
        {note.activity}
      </p>
    </div>
  );
};

