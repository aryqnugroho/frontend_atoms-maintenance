import React from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

/**
 * LogbookPage — placeholder page for the Logbook module.
 *
 * Logbook akan berisi catatan aktivitas operasional harian per divisi.
 * Fitur ini direncanakan untuk fase pengembangan berikutnya.
 */
export const LogbookPage: React.FC = () => {
  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={BookOpen}
        iconBg="bg-rose-100"
        iconColor="text-rose-700"
        title="Logbook"
        subtitle="Catatan aktivitas operasional harian"
      />

      {/* Empty state / Coming Soon */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center">
            <BookOpen size={32} className="text-rose-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-700">Logbook Belum Tersedia</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Fitur Logbook sedang dalam tahap pengembangan. Logbook akan memuat
              catatan aktivitas operasional harian per divisi CNSD dan TFP.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Direncanakan untuk fase berikutnya
          </span>
        </div>
      </div>
    </div>
  );
};
