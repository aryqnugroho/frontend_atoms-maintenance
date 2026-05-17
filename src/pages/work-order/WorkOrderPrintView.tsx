import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { mockWorkOrders } from '@/data/mockData';
import { workOrderService } from '@/services/workOrderService';
import type { WorkOrder, WorkOrderSignatureInfo, WorkOrderSignatureRole } from '@/types';

const outputLabels: Record<string, string> = {
  meter_reading: 'Lembar Meter Reading',
  status_peralatan: 'Status Peralatan',
  logbook: 'Pencatatan Logbook',
  other: 'Lainnya',
};

const roleLabels: Record<WorkOrderSignatureRole, string> = {
  mt: 'MANAGER TEKNIK',
  supervisor: 'SUPERVISOR',
  technician: 'TEKNISI',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface SignaturePrintColumnProps {
  label: string;
  signerName: string;
  signature?: WorkOrderSignatureInfo;
  isNotRequired?: boolean;
}

const SignaturePrintColumn: React.FC<SignaturePrintColumnProps> = ({
  label,
  signerName,
  signature,
  isNotRequired = false,
}) => (
  <div className="flex min-h-[130px] flex-1 flex-col items-center border-r border-black p-2 text-center last:border-r-0">
    <div className="text-[11px] font-bold">{label}</div>
    <div className="mt-2 flex h-16 w-full items-center justify-center">
      {isNotRequired ? (
        <span className="text-[10px] text-slate-500">Tidak Ada</span>
      ) : signature?.signature ? (
        <img src={signature.signature} alt={`Tanda tangan ${label}`} className="max-h-16 max-w-full object-contain" />
      ) : (
        <div className="h-14 w-28 border border-dashed border-slate-400" />
      )}
    </div>
    <div className="mt-auto text-[11px] font-semibold">{isNotRequired ? 'Tidak Ada' : signerName || '-'}</div>
    <div className="text-[10px] text-slate-600">{formatDateTime(signature?.signed_at)}</div>
  </div>
);

export const WorkOrderPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        const data = await workOrderService.getWorkOrderPrintData(Number(id));
        setWorkOrder(data.work_order);
      } catch {
        setWorkOrder(mockWorkOrders.find((w) => w.id === Number(id)) ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPrintData();
  }, [id]);

  const signatures = useMemo(() => workOrder?.signatures ?? {}, [workOrder]);
  const signatureColumns = useMemo(() => {
    if (!workOrder) return [];

    return [
      {
        role: 'mt' as const,
        signerName: signatures.mt?.name ?? workOrder.mt_name ?? workOrder.manager_name_snapshot ?? 'Manager Teknik',
      },
      {
        role: 'supervisor' as const,
        signerName: signatures.supervisor?.name ?? workOrder.supervisor_name ?? workOrder.supervisor_name_snapshot ?? 'Supervisor',
        isNotRequired: workOrder.has_supervisor === false,
      },
      {
        role: 'technician' as const,
        signerName: signatures.technician?.name ?? workOrder.technician_name ?? workOrder.personnel[0]?.name ?? 'Teknisi',
      },
    ];
  }, [signatures, workOrder]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Work Order tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate('/work-orders')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`@media print {
          @page { size: A4; margin: 10mm; }
          body { background: white !important; }
        }`}
      </style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/work-orders')}>
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-sm print:mx-0 print:w-full print:max-w-none print:border-0">
        <div className="flex border-b border-black">
          <div className="flex w-[30%] items-center justify-center border-r border-black p-4">
            <img src="/assets/icon/logoairnav.svg" alt="AirNav" className="h-16" />
            <div className="ml-2 text-[10px] font-bold leading-tight">
              <div>PERUM LPPNPI</div>
              <div>Cabang Surabaya</div>
            </div>
          </div>
          <div className="flex w-[70%] flex-col items-center justify-center px-4 text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide">Maintenance Request & Work Order</h1>
            <p className="mt-1 text-xs font-semibold">{workOrder.wo_number}</p>
          </div>
        </div>

        <div className="border-b border-black bg-gray-200 py-1 text-center text-xs font-bold">
          Tertuju: {workOrder.division}
        </div>

        <div className="grid grid-cols-[60%_40%] border-b border-black text-xs">
          <div className="border-r border-black p-2">
            <div className="font-bold">Shift Dinas: {workOrder.shift_type.toUpperCase()}</div>
            <div className="mt-2 font-bold">Personel Shift:</div>
            <table className="mt-1 w-full border border-black text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-10 border-r border-black px-1 py-1">No</th>
                  <th className="px-1 py-1 text-left">Nama</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.personnel.length > 0 ? workOrder.personnel.map((person, index) => (
                  <tr key={`${person.user_id}-${index}`}>
                    <td className="border-r border-t border-black px-1 py-1 text-center">{index + 1}</td>
                    <td className="border-t border-black px-1 py-1">{person.name}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="border-r border-t border-black px-1 py-1 text-center">1</td>
                    <td className="border-t border-black px-1 py-1">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-2 font-bold">
            <div className="grid grid-cols-[82px_1fr] gap-1">
              <div>Tanggal</div>
              <div>: {formatDate(workOrder.shift_date)}</div>
            </div>
            <div className="grid grid-cols-[82px_1fr] gap-1">
              <div>Jam Mulai</div>
              <div>: {workOrder.start_time || '.......'}</div>
            </div>
            <div className="grid grid-cols-[82px_1fr] gap-1">
              <div>Jam Selesai</div>
              <div>: {workOrder.end_time || '.......'}</div>
            </div>
            <div className="grid grid-cols-[82px_1fr] gap-1">
              <div>Status</div>
              <div>: {workOrder.status}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-black p-2">
          <div className="text-xs font-bold">Deskripsi Perintah:</div>
          <div className="mt-2 min-h-[130px] whitespace-pre-wrap px-2 text-sm">{workOrder.description}</div>
        </div>

        <div className="border-b border-black p-2 text-xs">
          <div className="font-bold">Output:</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(outputLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="flex h-3 w-3 items-center justify-center border border-black text-[10px] leading-none">
                  {workOrder.output_types.includes(key as never) ? '✓' : ''}
                </span>
                <span>{key === 'other' && workOrder.output_other ? workOrder.output_other : label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-black bg-gray-200 py-1 text-center text-xs font-bold">
          Pelaksanaan
        </div>

        <div className="grid grid-cols-3 border-b border-black text-xs font-bold">
          <div className="border-r border-black p-2 flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center border border-black text-[10px] leading-none">
              {workOrder.completion_status === 'selesai' ? '✓' : ''}
            </span>
            <span>Selesai</span>
          </div>
          <div className="border-r border-black p-2 flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center border border-black text-[10px] leading-none">
              {workOrder.completion_status === 'belum_selesai_dilanjut' ? '✓' : ''}
            </span>
            <span>Dilanjutkan</span>
          </div>
          <div className="p-2 flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center border border-black text-[10px] leading-none">
              {workOrder.completion_status === 'tidak_bisa' ? '✓' : ''}
            </span>
            <span>Tidak Bisa</span>
          </div>
        </div>

        <div className="border-b border-black p-2">
          <div className="text-xs font-bold">Catatan/Kendala:</div>
          <div className="mt-1 min-h-[70px] whitespace-pre-wrap px-2 text-sm">{workOrder.notes_kendala || ''}</div>
        </div>

        <div className="border-b border-black p-2">
          <div className="text-xs font-bold">Usulan:</div>
          <div className="mt-1 min-h-[55px] whitespace-pre-wrap px-2 text-sm">{workOrder.notes_usulan || ''}</div>
        </div>

        <div className="border-b border-black p-2">
          <div className="text-xs font-bold">Catatan Pemberi Tugas:</div>
          <div className="mt-1 min-h-[55px] whitespace-pre-wrap px-2 text-sm">{workOrder.notes_pemberi_tugas || ''}</div>
        </div>

        <div className="flex">
          {signatureColumns.map((column) => (
            <SignaturePrintColumn
              key={column.role}
              label={roleLabels[column.role]}
              signerName={column.signerName}
              signature={signatures[column.role]}
              isNotRequired={column.isNotRequired}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
