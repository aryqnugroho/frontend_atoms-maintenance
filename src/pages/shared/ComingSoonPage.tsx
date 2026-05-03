import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Construction } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <Construction size={40} className="text-gray-400" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-700">Coming Soon</h1>
        <p className="text-sm text-gray-500 max-w-md">
          Fitur ini sedang dalam tahap pengembangan dan akan tersedia pada update berikutnya.
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock size={14} />
        Direncanakan untuk fase berikutnya
      </div>
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft size={16} />
        Kembali
      </Button>
    </div>
  );
};
