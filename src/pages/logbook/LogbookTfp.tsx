import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';

/**
 * LogbookTfp — placeholder page for TFP Logbook.
 *
 * Task berikutnya: Merancang UI Form Logbook (Dynamic Timeline)
 * dan Migration Database Laravel untuk TFP.
 */
export const LogbookTfp: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/logbooks')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Logbook
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">TFP</span>
      </div>

      <PageHeader
        icon={Activity}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        title="Logbook Fasilitas Penunjang (TFP)"
        subtitle="Pencatatan status peralatan dan aktivitas operasional harian TFP"
        actions={
          <Button variant="outline" onClick={() => navigate('/logbooks')} className="gap-2">
            <ArrowLeft size={15} />
            Kembali
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Activity size={32} className="text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-700">Halaman Form Logbook TFP</h1>
            <p className="text-sm text-slate-500 max-w-sm">
              Form logbook TFP sedang dalam tahap perancangan. Akan memuat
              dynamic timeline pencatatan aktivitas operasional harian.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Dalam Perancangan
          </span>
        </div>
      </div>
    </div>
  );
};
