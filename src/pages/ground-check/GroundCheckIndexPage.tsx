import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ComingSoonCard } from '@/components/common/ComingSoonCard';

export const GroundCheckIndexPage: React.FC = () => {
  const navigate = useNavigate();

  // Placeholder untuk kategori Ground Check yang akan datang
  const groundCheckCategories = [
    {
      id: 'runway-inspection',
      code: 'RWY-01',
      title: 'Runway Inspection',
      description: 'Pemeriksaan kondisi runway dan marking',
      icon: '🛫',
    },
    {
      id: 'taxiway-inspection',
      code: 'TWY-01',
      title: 'Taxiway Inspection',
      description: 'Pemeriksaan kondisi taxiway dan signage',
      icon: '🛬',
    },
    {
      id: 'apron-inspection',
      code: 'APR-01',
      title: 'Apron Inspection',
      description: 'Pemeriksaan area apron dan parking stand',
      icon: '✈️',
    },
    {
      id: 'lighting-system',
      code: 'LGT-01',
      title: 'Lighting System',
      description: 'Pemeriksaan sistem penerangan landasan',
      icon: '💡',
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
            Ground Check
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modul pemeriksaan kondisi area operasional bandara
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
              Modul Ground Check sedang dalam tahap pengembangan dan akan tersedia pada update berikutnya. 
              Fitur ini akan mencakup pemeriksaan runway, taxiway, apron, dan sistem penerangan.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groundCheckCategories.map((category) => (
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
        <h3 className="text-base font-bold text-gray-800 mb-4">
          Fitur yang Akan Tersedia
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Runway Inspection
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pemeriksaan kondisi permukaan runway, marking, dan threshold
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Taxiway & Apron Check
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pemeriksaan kondisi taxiway, apron, dan parking stand
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Lighting System Check
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pemeriksaan sistem penerangan runway, taxiway, dan approach
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
                Upload foto kondisi area untuk dokumentasi dan pelaporan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
