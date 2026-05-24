import React from 'react';
import { Calendar, CheckCircle2, Circle, Settings } from 'lucide-react';
import type { MonthlySummary, MonthlySummaryItem } from '@/services/dashboardMonthlyService';

interface Props {
  monthly: MonthlySummary | null;
  items: MonthlySummaryItem[];
  metCount: number;
  canEdit: boolean;
  onNavigate: (path: string) => void;
}

/**
 * Dashboard card listing every monthly equipment-check target with progress
 * for the current calendar month. Drives the "Pengingat Pengecekan Bulanan"
 * section. Each row shows:
 *   - Equipment label + division badge + module group
 *   - Progress: actual / minimum (emerald when met, amber when not)
 *   - List of dates already done (deep-linked to the form record)
 *
 * Hidden when there are no configured targets and the user can't edit
 * (showing an empty card with no actionable CTA is just visual noise).
 */
export const MonthlyReminderCard: React.FC<Props> = ({ monthly, items, metCount, canEdit, onNavigate }) => {
  // Don't render anything if there's nothing to show and the user can't add.
  if (items.length === 0 && !canEdit) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-rose-700" />
            <h3 className="text-base font-bold text-slate-800">Pengingat Pengecekan Bulanan</h3>
            {monthly && (
              <span className="inline-flex items-center rounded-md bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 ring-1 ring-rose-200">
                {monthly.month_label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <span className={`inline-flex items-center rounded-full text-xs font-bold px-2.5 py-0.5 ${
                metCount === items.length
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {metCount}/{items.length} terpenuhi
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onNavigate('/settings/checklist?tab=monthly')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                title="Atur target bulanan"
              >
                <Settings size={13} aria-hidden="true" /> Kelola
              </button>
            )}
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Reminder</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Minimum pengecekan per bulan untuk peralatan tertentu — dihitung dari form yang sudah ditandatangani lengkap.
        </p>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Calendar size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Belum ada target bulanan</p>
            {canEdit ? (
              <p className="text-xs text-slate-400">
                Klik <button onClick={() => onNavigate('/settings/checklist?tab=monthly')} className="text-rose-700 font-semibold hover:underline">Kelola</button> untuk menambah target
                (contoh: Ground Check VHF minimum 2× per bulan).
              </p>
            ) : (
              <p className="text-xs text-slate-400">Manager Teknik / Supervisor dapat menambahkan target dari pengaturan.</p>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <MonthlyRow key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ─── Single target row ─────────────────────────────────────────────────────

const MonthlyRow: React.FC<{
  item: MonthlySummaryItem;
  onNavigate: (path: string) => void;
}> = ({ item, onNavigate }) => {
  const tone = item.met
    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
    : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70';
  const StatusIcon = item.met ? CheckCircle2 : Circle;
  const statusColor = item.met ? 'text-emerald-600' : 'text-amber-600';

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavigate(item.route)}
        className={`w-full rounded-xl border ${tone} px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
      >
        <div className="flex items-start gap-3">
          <StatusIcon size={18} className={`${statusColor} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                item.division === 'CNSD' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {item.division}
              </span>
              <span className="text-[11px] text-slate-400">{item.group}</span>
            </div>

            {/* Dates done */}
            <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Sudah dilakukan:
              </span>
              {item.records.length === 0 ? (
                <span className="text-[12px] text-slate-400 italic">Belum ada bulan ini</span>
              ) : (
                <span className="text-[12px] text-slate-700">
                  {formatDateList(item.records.map((r) => r.date))}
                </span>
              )}
            </div>
          </div>

          {/* Progress badge */}
          <div className="shrink-0 text-right">
            <div className={`inline-flex items-baseline gap-0.5 text-base font-bold tabular-nums ${
              item.met ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              <span>{item.current_count}</span>
              <span className="text-slate-400 text-sm">/</span>
              <span className="text-slate-500 text-sm">{item.min_count}</span>
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              item.met ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {item.met ? 'Terpenuhi' : 'Belum'}
            </p>
          </div>
        </div>
      </button>
    </li>
  );
};

/**
 * Format YYYY-MM-DD dates as a comma-list of day numbers + abbreviated month.
 * Example: ['2026-05-05', '2026-05-18'] → "5, 18 Mei".
 * Spans-multiple-months edge case: shows full date for clarity.
 */
function formatDateList(dates: string[]): string {
  if (dates.length === 0) return '';
  const parsed = dates.map((d) => new Date(d));
  const months = new Set(parsed.map((d) => d.getMonth()));
  if (months.size === 1) {
    const monthLabel = parsed[0].toLocaleDateString('id-ID', { month: 'short' });
    return `${parsed.map((d) => d.getDate()).join(', ')} ${monthLabel}`;
  }
  return parsed.map((d) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })).join(', ');
}
