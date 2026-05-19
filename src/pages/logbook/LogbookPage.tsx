import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, CheckSquare, Activity } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

/**
 * LogbookPage — landing page for the Logbook module.
 *
 * Menampilkan dua card navigasi:
 *   1. Logbook Fasilitas CNSD  → /logbooks/cnsd
 *   2. Logbook Fasilitas TFP   → /logbooks/tfp
 *
 * Desain card selaras dengan TfpIndexPage / CnsdIndexPage: border tipis,
 * rounded, soft hover lift, accent kategori (sky untuk CNSD, emerald untuk TFP).
 */

interface LogbookCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.FC<{ size?: number; className?: string }>;
  borderColor: string;
  hoverTitleColor: string;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  focusRing: string;
}

const LOGBOOK_CARDS: LogbookCard[] = [
  {
    id: 'cnsd',
    title: 'Logbook Fasilitas CNSD',
    description: 'Pencatatan status peralatan dan aktivitas operasional harian CNSD.',
    route: '/logbooks/cnsd',
    icon: CheckSquare,
    borderColor: 'border-sky-200',
    hoverTitleColor: 'group-hover:text-sky-700',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    focusRing: 'focus-visible:ring-sky-400',
  },
  {
    id: 'tfp',
    title: 'Logbook Fasilitas Penunjang (TFP)',
    description: 'Pencatatan status peralatan dan aktivitas operasional harian TFP.',
    route: '/logbooks/tfp',
    icon: Activity,
    borderColor: 'border-emerald-200',
    hoverTitleColor: 'group-hover:text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    focusRing: 'focus-visible:ring-emerald-400',
  },
];

export const LogbookPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={BookOpen}
        iconBg="bg-rose-100"
        iconColor="text-rose-700"
        title="Logbook"
        subtitle="Catatan aktivitas operasional harian per divisi"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {LOGBOOK_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.route);
                }
              }}
              className={`text-left rounded-2xl border ${card.borderColor} bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${card.focusRing}`}
            >
              <div className="flex items-start gap-4">
                <div className={`h-11 w-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={22} className={card.iconColor} aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`text-sm font-semibold text-slate-800 ${card.hoverTitleColor} transition-colors leading-tight`}>
                      {card.title}
                    </h3>
                    <ChevronRight
                      size={18}
                      className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${card.badgeColor}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    Tersedia
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};