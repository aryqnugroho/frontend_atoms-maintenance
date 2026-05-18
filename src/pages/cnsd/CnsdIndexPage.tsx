import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ChevronRight, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';
import { mockCnsdCategories } from '@/data/mockData';

/**
 * Map CNSD category code → frontend route.
 *
 * Only codes listed here are considered "active". Cards whose code is not in
 * this map will fall through to the Coming Soon variant even if their
 * is_active_mvp flag accidentally gets flipped on.
 */
const CNSD_ACTIVE_ROUTES: Record<string, string> = {
  'CNSD-001': '/cnsd/readiness',     // Kesiapan Peralatan CNSD (Form EQ-1)
  'CNSD-002': '/cnsd/radar-meter',   // Radar Meter Reading (Form RADAR-METER)
  'CNSD-003': '/cnsd/recorder-meter',// Recorder Meter Reading (FORM C-3)
  'CNSD-004': '/cnsd/amsc-meter',    // AMSC Meter Reading
};

/**
 * CNSD index page.
 *
 * Currently active modules:
 *   - CNSD-001 "Kesiapan Peralatan CNSD" → /cnsd/readiness (Form EQ-1)
 *   - CNSD-002 "Radar"                   → /cnsd/radar-meter (Meter Reading Radar)
 *   - CNSD-003 "Recorder"                → /cnsd/recorder-meter (Meter Reading Recorder, FORM C-3)
 *
 * All other CNSD cards remain Coming Soon and are intentionally non-clickable.
 */
export const CnsdIndexPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={CheckSquare}
        iconBg="bg-sky-100"
        iconColor="text-maintenance-cnsd"
        title="CNSD Equipment Readiness"
        subtitle="Kesiapan Peralatan Komunikasi, Navigasi, Surveilans & Data"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mockCnsdCategories.map((cat) => {
          const route = CNSD_ACTIVE_ROUTES[cat.code];
          const isActive = cat.is_active_mvp && !!route;

          if (!isActive) {
            return <ComingSoonCard key={cat.id} title={cat.name} location={cat.location} />;
          }

          return (
            <button
              key={cat.id}
              onClick={() => navigate(route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(route);
                }
              }}
              className="text-left rounded-2xl border-2 border-maintenance-cnsd/30 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maintenance-cnsd focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-mono text-maintenance-cnsd/70">{cat.code}</span>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-maintenance-cnsd transition-colors">{cat.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={14} aria-hidden="true" />
                    {cat.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktif
                  </span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-maintenance-cnsd transition-colors" aria-hidden="true" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
