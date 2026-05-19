import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Lock, PenLine } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { SignatureDisplay } from '@/components/shared/SignatureDisplay';
import { useAuth } from '@/hooks/useAuth';
import { tfpGlidepathService } from '@/services/tfpGlidepathService';
import type { TfpGlidepathRecordDetail, TfpGlidepathRoleKey, TfpGlidepathSignerInfo, TfpGlidepathTechnicianRow } from '@/types/tfpGlidepath';

interface Props {
  record: TfpGlidepathRecordDetail;
  onUpdated: (record: TfpGlidepathRecordDetail) => void;
}

const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) !== '' && norm(a) === norm(b);
};

const resolveValidationMessage = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const r = data as { message?: string; errors?: Record<string, string[] | string> };
  if (r.message) return r.message;
  const first = r.errors ? Object.values(r.errors)[0] : null;
  if (Array.isArray(first)) return first[0] ?? null;
  return (typeof first === 'string' ? first : null) ?? null;
};

interface PendingSign {
  role: TfpGlidepathRoleKey;
  label: string;
  signerName: string;
  technicianRowId?: number;
}

export const TfpGlidepathSignaturePanel: React.FC<Props> = ({ record, onUpdated }) => {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingSign | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userName = user?.name ?? '';
  const userRole = user?.role;
  const isCompleted = record.status === 'completed';

  type Column =
    | { kind: 'manager' | 'supervisor'; label: string; info: TfpGlidepathSignerInfo | null }
    | { kind: 'technician'; label: string; row: TfpGlidepathTechnicianRow };

  const columns: Column[] = useMemo(() => {
    const cols: Column[] = [
      { kind: 'manager', label: 'Manager Teknik', info: record.manager },
      { kind: 'supervisor', label: 'Supervisor TFP', info: record.supervisor },
    ];
    record.technicians.forEach((t, idx) => cols.push({ kind: 'technician', label: `Pelaksana Teknisi ${idx + 1}`, row: t }));
    return cols;
  }, [record]);

  const canSignManager = userRole === 'Manager Teknik';
  const canSignSupervisor = userRole === 'Supervisor TFP' || userRole === 'Manager Teknik' || userRole === 'Admin';
  const canSignTechnician = userRole === 'Teknisi TFP' || userRole === 'Supervisor TFP' || userRole === 'Manager Teknik' || userRole === 'Admin';

  const handleSign = async (signature: string) => {
    if (!pending) return;
    setIsSigning(true); setErrorMessage(null);
    try {
      const result = await tfpGlidepathService.signRecord(record.id, pending.role, signature, pending.technicianRowId);
      onUpdated(result.record);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrorMessage(resolveValidationMessage(err.response.data) ?? 'Gagal menyimpan tanda tangan.');
      } else { setErrorMessage('Koneksi gagal, coba lagi.'); }
    } finally { setIsSigning(false); setPending(null); }
  };

  const renderColumn = (col: Column, idx: number): React.ReactElement => {
    if (col.kind === 'manager' || col.kind === 'supervisor') {
      const info = col.info;
      const expectedName = info?.name ?? '';
      const isSigned = !!info?.signature;
      const requiredRoleOk = col.kind === 'manager' ? canSignManager : canSignSupervisor;
      const isAuthorized = col.kind === 'manager'
              ? (!!expectedName && namesMatch(expectedName, userName) && requiredRoleOk)
              : (!!expectedName && requiredRoleOk); // Supervisor slot: Manager can delegate
      const showLockedNote = !isSigned && !isCompleted && !!expectedName && !isAuthorized;
      return (
        <div key={`${col.kind}-${idx}`} className="space-y-3">
          <SignatureDisplay signerName={expectedName || '—'} signedAt={info?.signed_at ?? null} signatureImage={info?.signature ?? null} role={col.label} isPending={!isSigned && !!expectedName} isNotRequired={!expectedName} />
          {!isSigned && isAuthorized && !isCompleted && (
            <Button type="button" size="sm" className="w-full gap-2" onClick={() => setPending({ role: col.kind, label: col.label, signerName: expectedName })}>
              <PenLine size={16} />Tanda Tangan
            </Button>
          )}
          {showLockedNote && (
            <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
              <Lock size={12} className="mt-0.5 text-slate-400 shrink-0" />
              <span>Tanda tangan hanya dapat dilakukan oleh <span className="font-semibold text-slate-800">{expectedName}</span></span>
            </div>
          )}
        </div>
      );
    }
    if (col.kind !== 'technician') return <div key={idx} />;
    const row = col.row;
    const isSigned = !!row.signature;
    const isAuthorized = canSignTechnician; // Role-based delegation: any authorized role can sign any tech row
    const showLockedNote = !isSigned && !isCompleted && !isAuthorized;
    return (
      <div key={`tech-${row.id}`} className="space-y-3">
        <SignatureDisplay signerName={row.technician_name} signedAt={row.signed_at} signatureImage={row.signature} role={col.label} isPending={!isSigned} />
        {!isSigned && isAuthorized && !isCompleted && (
          <Button type="button" size="sm" className="w-full gap-2" onClick={() => setPending({ role: 'technician', label: col.label, signerName: row.technician_name, technicianRowId: row.id })}>
            <PenLine size={16} />Tanda Tangan
          </Button>
        )}
        {showLockedNote && (
          <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
            <Lock size={12} className="mt-0.5 text-slate-400 shrink-0" />
            <span>Tanda tangan hanya dapat dilakukan oleh <span className="font-semibold text-slate-800">{row.technician_name}</span></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base text-slate-900">Tanda Tangan</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Tanda tangan disimpan permanen, tidak dapat diubah, dan tidak boleh diwakilkan.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{record.status}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {columns.map(renderColumn)}
        </div>
      </CardContent>
      <SignatureCanvas isOpen={!!pending} onClose={() => { if (!isSigning) setPending(null); }} onConfirm={(base64) => void handleSign(base64)} signerName={pending?.signerName ?? userName} role={pending?.label ?? ''} isLoading={isSigning} />
    </Card>
  );
};
