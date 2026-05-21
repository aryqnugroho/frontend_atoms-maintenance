import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, ChevronRight, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';

/**
 * Ground Check equipment cards.
 * Only ADC is active for now; others are Coming Soon.
 */
const GROUND_CHECK_EQUIPMENT = [
  { id: 1, code: 'GC-001', name: 'ADC', location: 'Gedung TX, RX dan Tower', is_active: true },
  { id: 2, code: 'GC-002', name: 'VHF', location: 'Gedung TX, RX dan Tower', is_active: true },
  { id: 3, code: 'GC-003', name: 'Localizer', location: 'Shelter Localizer', is_active: true },
  { id: 4, code: 'GC-004', name: 'Glide Path', location: 'Shelter Glide Path', is_active: true },
  { id: 5, code: 'GC-005', name: 'DVOR', location: 'Shelter VOR', is_active: true },
];

const GC_ACTIVE_ROUTES: Record<string, string> = {
  'GC-001': '/ground-check/adc',
  'GC-002': '/ground-check/vhf',
  'GC-003': '/ground-check/llz',
  'GC-004': '/ground-check/gp',
  'GC-005': '/ground-check/dvor',
};

export const GroundCheckIndexPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Radar}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-700"
        title="Ground Check"
        subtitle="Pengujian Berkala di Darat — Peralatan Faselektrik Penerbangan"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GROUND_CHECK_EQUIPMENT.map((eq) => {
          const route = GC_ACTIVE_ROUTES[eq.code];
          const isActive = eq.is_active && !!route;

          if (!isActive) {
            return <ComingSoonCard key={eq.id} title={eq.name} location={eq.location} />;
          }

          return (
            <button
              key={eq.id}
              onClick={() => navigate(route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(route);
                }
              }}
              className="text-left rounded-2xl border-2 border-indigo-500/30 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-mono text-indigo-500/70">{eq.code}</span>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {eq.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={14} aria-hidden="true" />
                    {eq.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktif
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-slate-400 group-hover:text-indigo-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
