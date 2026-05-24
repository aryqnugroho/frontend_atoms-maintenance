import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { workOrderService } from '@/services/workOrderService';
import { getShiftLabel } from '@/lib/shiftUtils';
import type { WorkOrder, WorkOrderSignatureInfo, WorkOrderSignatureRole, ShiftType } from '@/types';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatShiftRange = (shift?: ShiftType | string) => {
  if (!shift) return '-';
  const s = shift as ShiftType;
  if (s !== 'pagi' && s !== 'siang' && s !== 'malam') return String(shift).toUpperCase();
  const { start, end } = getShiftLabel(s);
  return `${s.toUpperCase()} (${start} - ${end})`;
};

/** Get shift start/end times */
const getShiftTimes = (shift?: ShiftType | string) => {
  if (!shift) return { start: '..............', end: '..............' };
  const s = shift as ShiftType;
  if (s !== 'pagi' && s !== 'siang' && s !== 'malam') return { start: '..............', end: '..............' };
  const info = getShiftLabel(s);
  return { start: info.start, end: info.end };
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
  <td className="wo-cell align-top" style={{ width: '33.33%', verticalAlign: 'top', padding: '8px 6px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
        {isNotRequired ? (
          <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b' }}>Tidak Ada</span>
        ) : signature?.signature ? (
          <img src={signature.signature} alt={`TTD ${label}`} style={{ maxHeight: '56px', maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '96px', height: '48px', border: '1px dashed #94a3b8' }} />
        )}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
        ({isNotRequired ? 'Tidak Ada' : signerName || '....................'})
      </div>
      {signature?.signed_at && (
        <div style={{ fontSize: '9px', color: '#64748b' }}>{formatDateTime(signature.signed_at)}</div>
      )}
    </div>
  </td>
);

interface CheckboxInlineProps {
  checked: boolean;
  label: string;
}

const CheckboxInline: React.FC<CheckboxInlineProps> = ({ checked, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
    <span style={{ display: 'inline-flex', width: '12px', height: '12px', border: '1px solid #000', alignItems: 'center', justifyContent: 'center', fontSize: '9px', lineHeight: 1 }}>
      {checked ? '✓' : ''}
    </span>
    <span>{label}</span>
  </span>
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
        setWorkOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPrintData();
  }, [id]);

  const signatures = useMemo(() => workOrder?.signatures ?? {}, [workOrder]);

  const signatureColumns = useMemo<
    Array<{
      role: WorkOrderSignatureRole;
      label: string;
      signerName: string;
      isNotRequired?: boolean;
    }>
  >(() => {
    if (!workOrder) return [];

    return [
      {
        role: 'technician',
        label: 'PELAKSANA',
        signerName:
          signatures.technician?.name ??
          workOrder.technician_name ??
          workOrder.personnel[0]?.name ??
          'Teknisi',
      },
      {
        role: 'supervisor',
        label: 'SUPERVISOR',
        signerName:
          signatures.supervisor?.name ??
          workOrder.supervisor_name ??
          workOrder.supervisor_name_snapshot ??
          'Supervisor',
        isNotRequired: workOrder.has_supervisor === false,
      },
      {
        role: 'mt',
        label: 'MANAGER TEKNIK',
        signerName:
          signatures.mt?.name ?? workOrder.mt_name ?? workOrder.manager_name_snapshot ?? 'Manager Teknik',
      },
    ];
  }, [signatures, workOrder]);

  const personnelRows = useMemo(() => {
    const rows = workOrder?.personnel?.slice(0, 6) ?? [];
    while (rows.length < 6) {
      rows.push({ user_id: -rows.length - 1, name: '', role_label: '', signature_url: undefined } as never);
    }
    const left = rows.slice(0, 3);
    const right = rows.slice(3, 6);
    return { left, right };
  }, [workOrder]);

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

  const shiftTimes = getShiftTimes(workOrder.shift_type);

  const renderSignatureBlock = () => (
    <table className="wo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          {signatureColumns.map((column) => (
            <SignaturePrintColumn
              key={column.role}
              label={column.label}
              signerName={column.signerName}
              signature={signatures[column.role]}
              isNotRequired={column.isNotRequired}
            />
          ))}
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 8mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hide { display: none !important; }
          }
          .wo-table { border-collapse: collapse; width: 100%; }
          .wo-cell { border: 1px solid #000 !important; }
          @media print {
            .wo-cell { border: 1px solid #000 !important; }
          }
        `}
      </style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/work-orders')}>
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* Main form — using inline table with explicit borders for print reliability */}
      <table className="wo-table" style={{ maxWidth: '210mm', margin: '0 auto', backgroundColor: '#fff', fontFamily: 'sans-serif', fontSize: '12px', color: '#000' }}>
        <tbody>
          {/* Header: Logo + Title */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td className="wo-cell" style={{ width: '35%', padding: '12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/assets/icon/logoairnav.svg" alt="AirNav" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
                        <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: 1.3 }}>
                          <div>PERUM LPPNPI</div>
                          <div>Cabang Surabaya</div>
                        </div>
                      </div>
                    </td>
                    <td className="wo-cell" style={{ width: '65%', textAlign: 'center', verticalAlign: 'middle', padding: '12px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        MAINTENANCE REQUEST &amp; WORK ORDER
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Tertuju bar */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', backgroundColor: '#e5e7eb' }}>
              Tertuju : {workOrder.division}
            </td>
          </tr>

          {/* Top section: Shift + Personel | Tanggal + Jam */}
          <tr>
            <td className="wo-cell" style={{ width: '60%', padding: '8px', verticalAlign: 'top', fontSize: '11px' }}>
              <div>
                <span style={{ fontWeight: 600 }}>Shift Dinas : </span>
                <span style={{ fontWeight: 700 }}>{workOrder.shift_type?.toUpperCase() || '-'}</span>
              </div>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>Nama Personel :</div>
              <table style={{ width: '100%', marginTop: '4px', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  {[0, 1, 2].map((rowIdx) => (
                    <tr key={rowIdx}>
                      <td style={{ padding: '2px 0', width: '50%' }}>
                        <span style={{ display: 'inline-block', width: '16px', textAlign: 'right' }}>{rowIdx + 1}.</span>{' '}
                        <span style={{ borderBottom: '1px dotted #64748b', display: 'inline-block', minWidth: '120px' }}>
                          {personnelRows.left[rowIdx]?.name || '\u00A0'}
                        </span>
                      </td>
                      <td style={{ padding: '2px 0', width: '50%' }}>
                        <span style={{ display: 'inline-block', width: '16px', textAlign: 'right' }}>{rowIdx + 4}.</span>{' '}
                        <span style={{ borderBottom: '1px dotted #64748b', display: 'inline-block', minWidth: '120px' }}>
                          {personnelRows.right[rowIdx]?.name || '\u00A0'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
            <td className="wo-cell" style={{ width: '40%', padding: '8px', verticalAlign: 'top', fontSize: '11px' }}>
              <div>
                <span style={{ fontWeight: 600 }}>Tanggal</span>
                <span style={{ marginLeft: '12px' }}>: {formatDate(workOrder.shift_date)}</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontWeight: 600 }}>Jam</span>
                <span style={{ marginLeft: '32px' }}>: {formatShiftRange(workOrder.shift_type)}</span>
              </div>
            </td>
          </tr>

          {/* Deskripsi Perintah */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Diskripsi Perintah :</div>
              <div style={{ marginTop: '4px', minHeight: '110px', fontSize: '12px', lineHeight: 1.5, paddingLeft: '4px' }}>
                {workOrder.description && workOrder.description.includes('\n') ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                    {workOrder.description.split('\n').filter(Boolean).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{workOrder.description}</span>
                )}
              </div>
            </td>
          </tr>

          {/* Output row */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '8px', fontSize: '11px' }}>
              <div style={{ fontWeight: 600 }}>Output :</div>
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                <CheckboxInline checked={workOrder.output_types?.includes('meter_reading' as never)} label="Lembar Meter Reading" />
                <CheckboxInline checked={workOrder.output_types?.includes('status_peralatan' as never)} label="Status Peralatan" />
                <CheckboxInline checked={workOrder.output_types?.includes('logbook' as never)} label="Pencatatan Logbook" />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ display: 'inline-flex', width: '12px', height: '12px', border: '1px solid #000', alignItems: 'center', justifyContent: 'center', fontSize: '9px', lineHeight: 1 }}>
                    {workOrder.output_types?.includes('other' as never) ? '✓' : ''}
                  </span>
                  <span>{workOrder.output_other || '..........................................'}</span>
                </span>
              </div>
            </td>
          </tr>

          {/* FIRST SIGNATURE BLOCK */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: 0 }}>
              {renderSignatureBlock()}
            </td>
          </tr>

          {/* Pelaksanaan bar */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 12px', backgroundColor: '#e5e7eb' }}>
              PELAKSANAAN
            </td>
          </tr>

          {/* Jam Mulai / Jam Selesai */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td className="wo-cell" style={{ width: '50%', padding: '6px 8px', fontSize: '11px' }}>
                      <span style={{ fontWeight: 600 }}>Jam Mulai : </span>
                      <span>{shiftTimes.start}</span>
                    </td>
                    <td className="wo-cell" style={{ width: '50%', padding: '6px 8px', fontSize: '11px' }}>
                      <span style={{ fontWeight: 600 }}>Jam Selesai : </span>
                      <span>{shiftTimes.end}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Completion status checkboxes */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '6px 8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                <CheckboxInline checked={workOrder.completion_status === 'selesai'} label="Selesai" />
                <CheckboxInline checked={workOrder.completion_status === 'belum_selesai_dilanjut'} label="Belum Selesai dilanjut shift berikutnya" />
                <CheckboxInline checked={workOrder.completion_status === 'tidak_bisa'} label="Tidak bisa dilaksanakan" />
              </div>
            </td>
          </tr>

          {/* Catatan/Kendala */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Catatan/Kendala :</div>
              <div style={{ marginTop: '4px', minHeight: '60px', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.5, paddingLeft: '4px' }}>
                {workOrder.notes_kendala || ''}
              </div>
            </td>
          </tr>

          {/* Usulan */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Usulan :</div>
              <div style={{ marginTop: '4px', minHeight: '50px', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.5, paddingLeft: '4px' }}>
                {workOrder.notes_usulan || ''}
              </div>
            </td>
          </tr>

          {/* Catatan Pemberi Tugas */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Catatan Pemberi Tugas :</div>
              <div style={{ marginTop: '4px', minHeight: '50px', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.5, paddingLeft: '4px' }}>
                {workOrder.notes_pemberi_tugas || ''}
              </div>
            </td>
          </tr>

          {/* SECOND SIGNATURE BLOCK */}
          <tr>
            <td className="wo-cell" colSpan={2} style={{ padding: 0 }}>
              {renderSignatureBlock()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
