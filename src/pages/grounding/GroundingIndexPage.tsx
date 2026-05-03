import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';

export const GroundingIndexPage: React.FC = () => {
  const navigate = useNavigate();

  // Placeholder untuk kategori Grounding yang akan datang
  const groundingCategories = [
    {
      id: 'lightning-protection',
      code: 'GRD-01',
      title: 'Lightning Protection System',
      description: 'Pemeriksaan sistem penangkal petir',
      icon: '⚡',
    },
    {
      id: 'grounding-measurement',
      code: 'GRD-02',
      title: 'Grounding Measurement',
      description: 'Pengukuran nilai tahanan grounding',
      icon: '📏',
    },
    {
      id: 'earth-pit-inspection',
      code: 'GRD-03',
      title: 'Earth Pit Inspection',
      description: 'Pemeriksaan kondisi sumur grounding',
      icon: '🔍',
    },
    {
      id: 'grounding-report',
      code: 'GRD-04',
      title: 'Grounding Report',
      description: 'Laporan hasil pemeriksaan grounding',
      icon: '📋',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Kembali
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Grounding System
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modul pemeriksaan dan pelaporan sistem grounding penangkal petir
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">
              Fitur Dalam Pengembangan
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Modul Grounding System sedang dalam tahap pengembangan dan akan tersedia pada update berikutnya. 
              Fitur ini akan mencakup pemeriksaan sistem penangkal petir, pengukuran tahanan grounding, dan pembuatan laporan.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groundingCategories.map((category) => (
          <ComingSoonCard
            key={category.id}
            title={category.title}
            description={category.description}
            icon={category.icon}
          />
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-yellow-600" />
          <h3 className="text-base font-bold text-gray-800">
            Fitur yang Akan Tersedia
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Pemeriksaan Sistem Penangkal Petir
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspeksi visual kondisi air terminal, down conductor, dan grounding electrode
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Pengukuran Tahanan Grounding
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pengukuran nilai tahanan grounding dengan earth tester dan pencatatan hasil
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Inspeksi Sumur Grounding
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pemeriksaan kondisi fisik earth pit, elektroda, dan koneksi
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Laporan Grounding
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pembuatan laporan hasil pemeriksaan dengan grafik tren dan rekomendasi
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Photo Documentation
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload foto kondisi sistem grounding untuk dokumentasi dan analisis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">
          📖 Standar Referensi
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• PUIL 2011 (Persyaratan Umum Instalasi Listrik)</li>
          <li>• SNI 03-7015-2004 (Sistem Proteksi Petir pada Bangunan Gedung)</li>
          <li>• IEC 62305 (Protection Against Lightning)</li>
          <li>• IEEE Std 142 (Grounding of Industrial and Commercial Power Systems)</li>
        </ul>
      </div>
    </div>
  );
};
