import React from 'react';
import { UserCheck } from 'lucide-react';

interface SignatureDisplayProps {
  signatureUrl?: string | null;
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signatureUrl,
  name,
  role,
  size = 'md',
}) => {
  const imgHeight = size === 'sm' ? 'h-10' : size === 'md' ? 'h-16' : 'h-20';
  
  return (
    <div className="flex flex-col items-center text-center gap-1">
      {signatureUrl ? (
        <div className={`${imgHeight} w-auto border border-gray-200 rounded bg-white p-1 flex items-center justify-center`}>
          <img src={signatureUrl} alt={`TTD ${name}`} className="h-full w-auto object-contain" data-no-transition />
        </div>
      ) : (
        <div className={`${imgHeight} w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50`}>
          <div className="flex flex-col items-center text-slate-400">
            <UserCheck size={size === 'sm' ? 14 : 18} />
            <span className="text-[9px] mt-0.5">(belum ada)</span>
          </div>
        </div>
      )}
      <p className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{name}</p>
      {role && <p className="text-[10px] text-slate-500">{role}</p>}
    </div>
  );
};
