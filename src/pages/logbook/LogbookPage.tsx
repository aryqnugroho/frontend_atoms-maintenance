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
 * Desain card mengikuti pola CnsdIndexPage (border tipis, rounded, soft shadow,
 * chevron kanan, hover lift).
 */

interface LogbookCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accentColor: string;   // Tailwind border/text color token
  badgeColor: string;    // Tailwind badge bg/text classes
  iconBg: string;
  iconColor: string;
}

const LOGBOOK_CARDS: LogbookCard[] = [
  {
    id: 'cnsd',
    title: 'Logbook Fasilitas CNSD',
    description: 'Pencatatan status peralatan dan aktivitas operasional harian CNSD.',
    route: '/logbooks/cnsd',
    icon: CheckSquare,
    accentColor: 'border-sky-300',
    badgeColor: 'bg-sky-50 text-sky-700',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'tfp',
    title: 'Logbook Fasilitas Penunjang (TFP)',
    description: 'Pencatatan status peralatan dan aktivitas operasional harian TFP.',
    route: '/logbooks/tfp',
    icon: Activity,
    accentColor: 'border-emerald-300',
    badgeColor: 'bg-emerald-50 text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
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
              className={`text-left rounded-2xl border-2 ${card.accentColor} bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: icon + text */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`h-11 w-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={22} className={card.iconColor} aria-hidden="true" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-snug">
                      {card.description}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${card.badgeColor}`}>
                      Tersedia
                    </span>
                  </div>
                </div>

                {/* Right: chevron */}
                <ChevronRight
                  size={20}
                  className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 mt-1"
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
