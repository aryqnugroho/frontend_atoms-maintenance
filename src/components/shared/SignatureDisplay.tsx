import React from 'react';
import { CheckCircle2, Clock3, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureDisplayProps {
  signerName: string;
  signedAt: string | null;
  signatureImage: string | null;
  role: string;
  isPending: boolean;
  isNotRequired?: boolean;
  /** If the signature was delegated, show the actual signer's name */
  delegatedByName?: string | null;
}

const formatSignedAt = (value: string | null) => {
  if (!value) return null;

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signerName,
  signedAt,
  signatureImage,
  role,
  isPending,
  isNotRequired = false,
  delegatedByName,
}) => {
  const signedTime = formatSignedAt(signedAt);

  if (isNotRequired) {
    return (
      <div className="flex min-h-[168px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Tidak Ada</p>
          </div>
          <MinusCircle className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-4 flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-xs font-medium text-slate-400">
          Tidak diwajibkan
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[168px] flex-col rounded-lg border p-4',
        signatureImage ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{signerName || '-'}</p>
        </div>
        {signatureImage ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Clock3 className="h-5 w-5 text-amber-500" aria-hidden="true" />
        )}
      </div>

      <div className="mt-4 flex h-20 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-3">
        {signatureImage ? (
          <img src={signatureImage} alt={`Tanda tangan ${role}`} className="max-h-16 max-w-full object-contain" />
        ) : (
          <span className="text-xs font-medium text-slate-400">
            {isPending ? 'Menunggu Tanda Tangan' : 'Belum tersedia'}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {signedTime ? `Ditandatangani ${signedTime}` : 'Belum ditandatangani'}
      </p>
      {delegatedByName && signatureImage && (
        <p className="mt-1 text-[11px] text-amber-600 font-medium">
          Diwakili oleh {delegatedByName}
        </p>
      )}
    </div>
  );
};
