import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';
import { mockTfpCategories } from '@/data/mockData';

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
        {mockTfpCategories.map((cat) =>
          cat.is_active_mvp ? (
            <button
              key={cat.id}
              onClick={() => navigate('/tfp/aob-ground')}
              className="text-left rounded-xl border-2 border-maintenance-tfp/30 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-mono text-maintenance-tfp/70">{cat.code}</span>
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-maintenance-tfp transition-colors">{cat.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} />
                    {cat.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktif
                  </span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-maintenance-tfp transition-colors" />
                </div>
              </div>
            </button>
          ) : (
            <ComingSoonCard key={cat.id} title={cat.name} location={cat.location} />
          )
        )}
      </div>
    </div>
  );
};
