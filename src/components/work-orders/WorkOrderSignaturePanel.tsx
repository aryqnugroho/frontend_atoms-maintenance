import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { PenLine, Lock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { SignatureDisplay } from '@/components/shared/SignatureDisplay';
import { workOrderService } from '@/services/workOrderService';
import { useAuth } from '@/hooks/useAuth';
import type { WorkOrder, WorkOrderSignatureInfo, WorkOrderSignatureRole } from '@/types';

interface WorkOrderSignaturePanelProps {
  workOrder: WorkOrder;
  onWorkOrderUpdated: (workOrder: WorkOrder) => void;
}

interface SignatureColumn {
  role: WorkOrderSignatureRole;
  label: string;
  signerName: string;
  info?: WorkOrderSignatureInfo;
  isNotRequired?: boolean;
}

const roleLabels: Record<WorkOrderSignatureRole, string> = {
  mt: 'Manager Teknik',
  supervisor: 'Supervisor',
  technician: 'Teknisi',
};

/**
 * Tolerant name comparison that mirrors the backend WorkOrderService::namesMatch.
 * Trim, collapse whitespace, case-insensitive.
 */
const namesMatch = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const na = norm(a);
  const nb = norm(b);
  return na !== '' && na === nb;
};

const resolveValidationMessage = (data: unknown) => {
  if (!data || typeof data !== 'object') return null;

  const response = data as { message?: string; errors?: Record<string, string[] | string> };
  if (response.message) return response.message;

  const firstError = response.errors ? Object.values(response.errors)[0] : null;
  if (Array.isArray(firstError)) return firstError[0] ?? null;
  return firstError ?? null;
};

export const WorkOrderSignaturePanel: React.FC<WorkOrderSignaturePanelProps> = ({
  workOrder,
  onWorkOrderUpdated,
}) => {
  const { user } = useAuth();
  const [activeRole, setActiveRole] = useState<WorkOrderSignatureRole | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingSignatures = workOrder.pending_signatures ?? [];

  const columns = useMemo<SignatureColumn[]>(() => [
    {
      role: 'mt',
      label: roleLabels.mt,
      signerName: workOrder.signatures?.mt?.name ?? workOrder.mt_name ?? workOrder.manager_name_snapshot ?? 'Manager Teknik',
      info: workOrder.signatures?.mt,
    },
    {
      role: 'supervisor',
      label: roleLabels.supervisor,
      signerName: workOrder.signatures?.supervisor?.name ?? workOrder.supervisor_name ?? workOrder.supervisor_name_snapshot ?? 'Supervisor',
      info: workOrder.signatures?.supervisor,
      isNotRequired: workOrder.has_supervisor === false,
    },
    {
      role: 'technician',
      label: roleLabels.technician,
      signerName: workOrder.signatures?.technician?.name ?? workOrder.technician_name ?? workOrder.personnel[0]?.name ?? 'Teknisi',
      info: workOrder.signatures?.technician,
    },
  ], [workOrder]);

  /**
   * The current user is the authorized signer for `column` only when:
   *  1. Their maintenance role matches the column role (MT / Supervisor / Teknisi).
   *  2. Their name matches the cached signer name on the WO (tolerant compare).
   *
   * For Teknisi (shift WOs), the user is also authorized when their name matches
   * any person listed in workOrder.personnel.
   */
  /**
   * Role-based delegation authorization.
   * - Manager Teknik: can sign mt (own), supervisor (all), technician (all)
   * - Supervisor: can sign supervisor (own), technician (all)
   * - Teknisi: can sign technician (all)
   */
  const isAuthorizedSigner = (column: SignatureColumn) => {
    if (!user?.name || !user?.role) return false;

    const slotRole = column.role; // 'mt' | 'supervisor' | 'technician'

    if (user.role === 'Manager Teknik') {
      // Manager can sign all slots; mt slot requires own name match
      if (slotRole === 'mt') return namesMatch(column.signerName, user.name);
      return true; // supervisor + technician: delegation allowed
    }

    if (user.role === 'Supervisor CNSD' || user.role === 'Supervisor TFP') {
      if (slotRole === 'mt') return false;
      if (slotRole === 'supervisor') return namesMatch(column.signerName, user.name);
      return true; // technician: delegation allowed
    }

    if (user.role === 'Teknisi CNSD' || user.role === 'Teknisi TFP') {
      if (slotRole !== 'technician') return false;
      return true; // any technician slot
    }

    return false;
  };

  const canSign = (column: SignatureColumn) => {
    if (workOrder.status === 'completed' || column.isNotRequired) return false;
    if (column.info?.signature) return false; // already signed → immutable
    if (!isAuthorizedSigner(column)) return false;
    if (pendingSignatures.length > 0) return pendingSignatures.includes(column.role);
    return true;
  };

  const handleSign = async (signature: string) => {
    if (!activeRole) return;

    setIsSigning(true);
    setErrorMessage(null);

    try {
      const result = await workOrderService.signWorkOrder(workOrder.id, activeRole, signature);
      onWorkOrderUpdated(result.record);
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        setErrorMessage('Koneksi gagal, coba lagi');
        return;
      }

      if (!error.response) {
        setErrorMessage('Koneksi gagal, coba lagi');
        return;
      }

      const serverMessage = resolveValidationMessage(error.response.data);

      if (error.response.status === 409) {
        setErrorMessage(serverMessage ?? 'Tanda tangan sudah ada untuk role ini');
        return;
      }

      if (error.response.status === 403) {
        setErrorMessage(serverMessage ?? 'Anda tidak berhak menandatangani role ini');
        return;
      }

      if (error.response.status === 422) {
        setErrorMessage(serverMessage ?? 'Data tanda tangan tidak valid');
        return;
      }

      setErrorMessage(serverMessage ?? 'Koneksi gagal, coba lagi');
    } finally {
      setIsSigning(false);
      setActiveRole(null);
    }
  };

  const activeColumn = columns.find((column) => column.role === activeRole);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base text-slate-900">Tanda Tangan</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Tanda tangan disimpan permanen dan hanya dapat dilakukan oleh penanda tangan yang berwenang.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {workOrder.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((column) => {
            const pending = !column.info?.signature && !column.isNotRequired;
            const showSignButton = canSign(column);
            const isAlreadySigned = Boolean(column.info?.signature);
            const showLockedNote =
              !showSignButton &&
              !isAlreadySigned &&
              !column.isNotRequired &&
              workOrder.status !== 'completed' &&
              user?.name && !namesMatch(column.signerName, user.name);

            return (
              <div key={column.role} className="space-y-3">
                <SignatureDisplay
                  signerName={column.signerName}
                  signedAt={column.info?.signed_at ?? null}
                  signatureImage={column.info?.signature ?? null}
                  role={column.label}
                  isPending={pending}
                  isNotRequired={column.isNotRequired}
                />
                {showSignButton && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setActiveRole(column.role)}
                    disabled={isSigning}
                  >
                    <PenLine size={16} />
                    Tanda Tangan
                  </Button>
                )}
                {showLockedNote && (
                  <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                    <Lock size={12} className="mt-0.5 text-slate-400 shrink-0" />
                    <span>Tanda tangan hanya dapat dilakukan oleh <span className="font-semibold text-slate-800">{column.signerName}</span></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <SignatureCanvas
        isOpen={Boolean(activeRole)}
        onClose={() => {
          if (!isSigning) setActiveRole(null);
        }}
        onConfirm={(base64) => {
          void handleSign(base64);
        }}
        signerName={activeColumn?.signerName ?? user?.name ?? ''}
        role={activeColumn?.label ?? ''}
        isLoading={isSigning}
      />
    </Card>
  );
};
