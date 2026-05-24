import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ChevronRight, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';
import type { CnsdCategory } from '@/types';

/**
 * Static catalog of CNSD module cards rendered on the index page.
 *
 * This is the source of truth for "which CNSD modules exist in the app";
 * each entry is paired with a frontend route via CNSD_ACTIVE_ROUTES below.
 * Kept inline (not in a service or a mock-data file) because the list maps
 * 1:1 with hardcoded React routes — adding a card requires adding a route.
 */
const CNSD_CATEGORIES: CnsdCategory[] = [
  { id: 1,  code: 'CNSD-001', name: 'Kesiapan Peralatan CNSD', location: 'Main Equipment Room', is_active_mvp: true, sort_order: 1 },
  { id: 2,  code: 'CNSD-002', name: 'Radar',                   location: 'Gedung Radar',         is_active_mvp: true, sort_order: 2 },
  { id: 3,  code: 'CNSD-003', name: 'Recorder',                location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 3 },
  { id: 4,  code: 'CNSD-004', name: 'AMSC',                    location: 'Ruang AMSC',           is_active_mvp: true, sort_order: 4 },
  { id: 5,  code: 'CNSD-005', name: 'Transmitter',             location: 'Gedung Transmitter',   is_active_mvp: true, sort_order: 5 },
  { id: 6,  code: 'CNSD-006', name: 'Receiver',                location: 'Gedung Transmitter',   is_active_mvp: true, sort_order: 6 },
  { id: 7,  code: 'CNSD-007', name: 'Glide Path',              location: 'Shelter Glide Path',   is_active_mvp: true, sort_order: 7 },
  { id: 8,  code: 'CNSD-008', name: 'Localizer',               location: 'Shelter Localizer',    is_active_mvp: true, sort_order: 8 },
  { id: 9,  code: 'CNSD-009', name: 'T-DME',                   location: 'Shelter Glide Path',   is_active_mvp: true, sort_order: 9 },
  { id: 10, code: 'CNSD-010', name: 'DVOR',                    location: 'Shelter VOR',          is_active_mvp: true, sort_order: 10 },
  { id: 11, code: 'CNSD-011', name: 'DME',                     location: 'Shelter VOR',          is_active_mvp: true, sort_order: 11 },
  { id: 12, code: 'CNSD-012', name: 'ATC System',              location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 12 },
  { id: 13, code: 'CNSD-013', name: 'ATIS',                    location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 13 },
  { id: 14, code: 'CNSD-014', name: 'VCCS (LES)',               location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 14 },
  { id: 15, code: 'CNSD-015', name: 'VCCS (Frequentis)',        location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 15 },
  { id: 16, code: 'CNSD-016', name: 'ASMGCS (SAAB)',             location: 'Main Equipment Room',  is_active_mvp: true, sort_order: 16 },
];

/**
 * Map CNSD category code → frontend route.
 *
 * Only codes listed here are considered "active". Cards whose code is not in
 * this map will fall through to the Coming Soon variant even if their
 * is_active_mvp flag accidentally gets flipped on.
 */
const CNSD_ACTIVE_ROUTES: Record<string, string> = {
  'CNSD-001': '/cnsd/readiness',          // Kesiapan Peralatan CNSD (Form EQ-1)
  'CNSD-002': '/cnsd/radar-meter',        // Radar Meter Reading (Form RADAR-METER)
  'CNSD-003': '/cnsd/recorder-meter',     // Recorder Meter Reading (FORM C-3)
  'CNSD-004': '/cnsd/amsc-meter',         // AMSC Meter Reading
  'CNSD-005': '/cnsd/transmitter-meter',  // Transmitter Meter Reading (FORM C-1)
  'CNSD-006': '/cnsd/receiver-meter',     // Receiver Meter Reading (FORM C-2)
  'CNSD-007': '/cnsd/glidepath-meter',    // Glide Path Meter Reading (ILS-GP)
  'CNSD-008': '/cnsd/localizer-meter',    // Localizer Meter Reading (ILS-LLZ)
  'CNSD-009': '/cnsd/tdme-meter',         // T-DME Meter Reading (FORM N-5)
  'CNSD-010': '/cnsd/dvor-meter',         // DVOR Meter Reading (FORM N-5)
  'CNSD-011': '/cnsd/dme-meter',          // DME Meter Reading (FORM N-5)
  'CNSD-012': '/cnsd/atc-system-meter',   // ATC SYSTEM Meter Reading (FORM A-1)
  'CNSD-013': '/cnsd/atis-meter',         // ATIS Meter Reading (Reproducer ATIS)
  'CNSD-014': '/cnsd/vccs-meter',         // VCCS LES Meter Reading
  'CNSD-015': '/cnsd/vccs-freq-meter',    // VCCS Frequentis Meter Reading
  'CNSD-016': '/cnsd/asmgcs-meter',       // ASMGCS (SAAB) Meter Reading
};

/**
 * CNSD index page.
 *
 * Currently active modules:
 *   - CNSD-001 "Kesiapan Peralatan CNSD" → /cnsd/readiness (Form EQ-1)
 *   - CNSD-002 "Radar"                   → /cnsd/radar-meter (Meter Reading Radar)
 *   - CNSD-003 "Recorder"                → /cnsd/recorder-meter (Meter Reading Recorder, FORM C-3)
 *   - CNSD-014 "VCCS (LES)"              → /cnsd/vccs-meter
 *   - CNSD-015 "VCCS (Frequentis)"       → /cnsd/vccs-freq-meter
 *   - CNSD-016 "ASMGCS (SAAB)"           → /cnsd/asmgcs-meter
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
        {CNSD_CATEGORIES.map((cat) => {
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
