import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';
import type { TfpCategory } from '@/types';

/**
 * Static catalog of TFP module cards rendered on the index page. Inlined
 * (no longer in mockData) because each card maps 1:1 with a hardcoded
 * frontend route — adding a card requires adding a route.
 */
const TFP_CATEGORIES: TfpCategory[] = [
  { id: 1, code: 'TFP-001', name: 'Performance Check AOB Lantai Ground', location: 'AOB Lantai Ground', is_active_mvp: true, sort_order: 1 },
  { id: 2, code: 'TFP-002', name: 'AOB Lantai 1 & 2',                    location: 'AOB Lantai 1-2',    is_active_mvp: true, sort_order: 2 },
  { id: 3, code: 'TFP-003', name: 'Transmitter (TFP)',                   location: 'Gedung Transmitter', is_active_mvp: true, sort_order: 3 },
  { id: 4, code: 'TFP-004', name: 'Radar (TFP)',                         location: 'Gedung Radar',       is_active_mvp: true, sort_order: 4 },
  { id: 5, code: 'TFP-005', name: 'Tower',                               location: 'ATC Tower',          is_active_mvp: true, sort_order: 5 },
  { id: 6, code: 'TFP-006', name: 'VOR (TFP)',                           location: 'Shelter VOR',        is_active_mvp: true, sort_order: 6 },
  { id: 7, code: 'TFP-007', name: 'Localizer (TFP)',                     location: 'Shelter Localizer',  is_active_mvp: true, sort_order: 7 },
  { id: 8, code: 'TFP-008', name: 'Glide Path (TFP)',                    location: 'Shelter Glide Path', is_active_mvp: true, sort_order: 8 },
];

/**
 * Map TFP category code → frontend route.
 *
 * Only codes listed here are considered "active". Cards whose code is not in
 * this map will fall through to the Coming Soon variant even if their
 * is_active_mvp flag accidentally gets flipped on.
 */
const TFP_ACTIVE_ROUTES: Record<string, string> = {
  'TFP-001': '/tfp/aob-ground',      // Performance Check AOB Lantai Ground
  'TFP-002': '/tfp/aob-lt12',        // Performance Check AOB Lantai 1 & 2
  'TFP-003': '/tfp/transmitter-tx',  // Performance Check Gedung (Transmitter) TX
  'TFP-004': '/tfp/radar-tfp',       // Performance Check Gedung Radar
  'TFP-005': '/tfp/tower',           // Performance Check Gedung Tower
  'TFP-006': '/tfp/dvor',            // Performance Check Gedung DVOR (VOR)
  'TFP-007': '/tfp/localizer',       // Performance Check Gedung Localizer
  'TFP-008': '/tfp/glidepath',       // Performance Check Gedung Glide Path
};

/**
 * TFP index page.
 *
 * Currently active modules:
 *   - TFP-001 "Performance Check AOB Lantai Ground" → /tfp/aob-ground
 *
 * All other TFP cards remain Coming Soon and are intentionally non-clickable.
 */
export const TfpIndexPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Activity}
        iconBg="bg-emerald-100"
        iconColor="text-maintenance-tfp"
        title="TFP Performance Check"
        subtitle="Pemeriksaan Kinerja Fasilitas Teknik & Tenaga Listrik"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TFP_CATEGORIES.map((cat) => {
          const route = TFP_ACTIVE_ROUTES[cat.code];
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
              className="text-left rounded-2xl border-2 border-maintenance-tfp/30 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maintenance-tfp focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-mono text-maintenance-tfp/70">{cat.code}</span>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-maintenance-tfp transition-colors">
                    {cat.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={14} aria-hidden="true" />
                    {cat.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktif
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-slate-400 group-hover:text-maintenance-tfp transition-colors"
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
