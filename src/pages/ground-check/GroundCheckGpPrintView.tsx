import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundCheckGpService } from '@/services/groundCheckGpService';
import type { GroundCheckGpRecordDetail } from '@/types/groundCheckGp';

const text = (v: string | null | undefined): string => (v == null || v === '' ? '' : String(v));

const formatPrintDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).toUpperCase();
  } catch {
    return dateStr;
  }
};

const monthYearLabel = (record: GroundCheckGpRecordDetail): string => {
  if (record.report_month && record.report_month.trim() !== '') return record.report_month.toUpperCase();
  try {
    return new Date(record.date).toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric',
    }).toUpperCase();
  } catch {
    return '';
  }
};

/**
 * GroundCheckGpPrintView — multi-page A4 landscape print.
 *   PAGE 1 — Form 1 "Pengujian Berkala di Darat"
 *   PAGE 2 — Form 2 "Ground Check Glide Path dengan PIR Rohde & Schwarz EVSG1000 NAV Analyzer"
 *   PAGE 3+ — LAMPIRAN foto dokumentasi (if any)
 */
export const GroundCheckGpPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundCheckGpRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await groundCheckGpService.getDetail(Number(id));
        if (!cancelled) setRecord(data);
      } catch {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchRecord();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Form tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/ground-check/gp')}>Kembali</Button>
      </div>
    );
  }

  const technicianSlots = record.technicians;
  const photos = record.photos ?? [];

  // Split NAV items by section
  const nfItems   = record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'nf');
  const rcmsItems = record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'rcms');

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 8mm 8mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hide { display: none !important; }
            .print-page { page-break-after: always; }
            .print-page:last-child { page-break-after: auto; }
            tr, td, th { page-break-inside: avoid; }
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .gc-table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          .gc-table th, .gc-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
          .gc-meta td { border: 0; padding: 1px 0; vertical-align: top; }
          .gc-tick { font-family: 'Times New Roman', serif; font-size: 12px; }
          .gc-disabled td { background-color: #d1d5db; }
        `}
      </style>

      <div className="print-hide mx-auto mb-4 flex max-w-[297mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/ground-check/gp/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — Form 1: Pengujian Berkala di Darat
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:w-full print:max-w-none" style={{ width: '297mm', minHeight: '210mm' }}>
        <div className="border border-black">
          <div className="text-center py-1.5 border-b border-black">
            <p className="text-[12px] font-bold tracking-wide">PENGUJIAN BERKALA DI DARAT PERALATAN FASLEKTRIK PENERBANGAN</p>
          </div>

          <div className="px-3 py-2 border-b border-black">
            <table className="gc-meta text-[10px]" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '120px' }} className="uppercase font-semibold">LAPORAN BULAN</td>
                  <td style={{ width: '10px' }}>:</td>
                  <td className="uppercase">{monthYearLabel(record)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">BANDARA</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.airport)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">NAMA PERALATAN</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.equipment_name)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">FUNGSI PERALATAN</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.equipment_function)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">DATA TEKNIS</td>
                  <td>:</td>
                  <td>{text(record.technical_data)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">KALIBRASI TERAKHIR</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.last_calibration)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Main parameter table */}
          <table className="gc-table text-[9px]">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={3} className="text-center font-bold align-middle">NO.</th>
                <th rowSpan={3} className="text-center font-bold align-middle">PARAMETER</th>
                <th rowSpan={3} className="text-center font-bold align-middle leading-tight">HASIL<br/>PENGUKURAN<br/>SETELAH<br/>KALIBRASI</th>
                <th rowSpan={3} className="text-center font-bold align-middle">TOLERANSI</th>
                <th colSpan={6} className="text-center font-bold">
                  PENGUJIAN DI DARAT<br/>TANGGAL : {formatPrintDate(record.date)}
                </th>
                <th rowSpan={3} className="text-center font-bold align-middle">KETERANGAN</th>
              </tr>
              <tr>
                <th colSpan={3} className="text-center font-bold">TX1</th>
                <th colSpan={3} className="text-center font-bold">TX2</th>
              </tr>
              <tr>
                <th className="text-center font-bold leading-tight">HASIL PD</th>
                <th className="text-center font-bold leading-tight">IN TOLERANCE</th>
                <th className="text-center font-bold leading-tight">OUT OF TOLERANCE</th>
                <th className="text-center font-bold leading-tight">HASIL PD</th>
                <th className="text-center font-bold leading-tight">IN TOLERANCE</th>
                <th className="text-center font-bold leading-tight">OUT OF TOLERANCE</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item) => {
                if (item.is_header) {
                  return (
                    <tr key={item.id}>
                      <td colSpan={11} className="font-bold uppercase text-[10px]">{item.parameter_name}</td>
                    </tr>
                  );
                }
                if (item.is_subheader) {
                  return (
                    <tr key={item.id}>
                      <td className="text-center align-middle">&nbsp;</td>
                      <td colSpan={10} className="italic pl-2 text-[9px]">{item.parameter_name}</td>
                    </tr>
                  );
                }
                const isDisabled = item.is_disabled;
                const isCheckOnly = item.is_check_only;
                const tx1In  = item.tx1_in_tolerance  ? '√' : '';
                const tx1Out = item.tx1_out_of_tolerance ? '√' : '';
                const tx2In  = item.tx2_in_tolerance  ? '√' : '';
                const tx2Out = item.tx2_out_of_tolerance ? '√' : '';

                const rowClass = isDisabled ? 'gc-disabled' : '';

                return (
                  <tr key={item.id} className={rowClass}>
                    <td className="text-center align-middle">{item.item_code ?? ''}</td>
                    <td className="align-middle leading-tight">{text(item.parameter_name)}</td>
                    <td className="text-center align-middle">{text(item.calibration_result)}</td>
                    <td className="text-center align-middle whitespace-pre-line leading-tight text-[8px]">{text(item.tolerance)}</td>
                    <td className="text-center align-middle">{isCheckOnly ? '' : text(item.tx1_hasil_pd)}</td>
                    <td className="text-center align-middle gc-tick">{tx1In}</td>
                    <td className="text-center align-middle gc-tick">{tx1Out}</td>
                    <td className="text-center align-middle">{isCheckOnly ? '' : text(item.tx2_hasil_pd)}</td>
                    <td className="text-center align-middle gc-tick">{tx2In}</td>
                    <td className="text-center align-middle gc-tick">{tx2Out}</td>
                    <td className="align-middle leading-tight">{text(item.keterangan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer: TEKNISI PELAKSANA + PH MANAGER TEKNIK 1 */}
          <table className="gc-table text-[10px]">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '40%' }} />
              <col style={{ width: '40%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="font-bold uppercase align-top">TEKNISI PELAKSANA :</td>
                <td className="align-top">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {technicianSlots.map((t, idx) => (
                        <tr key={t.id}>
                          <td style={{ width: '20%', border: '0', padding: '2px 4px' }}>{idx + 1}.</td>
                          <td style={{ width: '50%', border: '0', padding: '2px 4px' }} className="font-medium uppercase">{t.technician_name}</td>
                          <td style={{ width: '30%', border: '0', padding: '2px 4px', textAlign: 'center' }}>
                            {t.technician_signature ? (
                              <img src={t.technician_signature} alt="ttd" style={{ maxHeight: '24px', display: 'inline-block' }} />
                            ) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td className="text-center align-middle">
                  <div className="font-bold uppercase">PH MANAGER TEKNIK 1</div>
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-16 object-contain my-1" />
                  ) : (
                    <div style={{ height: '48px' }} />
                  )}
                  <div className="font-medium uppercase">{text(record.manager_name)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — Form 2: NAV Analyzer
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '297mm', minHeight: '210mm' }}>
        <div className="px-3 py-3">
          {/* Header */}
          <div className="text-center mb-3">
            <p className="text-[11px] font-bold">PERUM LPPNPI</p>
            <p className="text-[12px] font-bold">{text(record.nav_organization) || 'CABANG SURABAYA'}</p>
          </div>

          {/* Metadata */}
          <table className="gc-meta text-[10px] mb-3" style={{ width: '40%' }}>
            <tbody>
              <tr>
                <td style={{ width: '80px' }} className="font-semibold">Tanggal</td>
                <td style={{ width: '10px' }}>:</td>
                <td>{formatPrintDate(record.date)}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-center text-[11px] font-bold mb-3 underline">
            {text(record.nav_analyzer_title)}
          </p>

          {/* Section 1: NF */}
          <table className="gc-table text-[10px]">
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '19%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className="text-center font-bold align-middle">NO</th>
                <th rowSpan={2} className="text-center font-bold align-middle">PARAMETER</th>
                <th className="text-center font-bold">TRANSMITER 1</th>
                <th className="text-center font-bold">TRANSMITER 2</th>
                <th rowSpan={2} className="text-center font-bold align-middle">KETERANGAN</th>
              </tr>
              <tr>
                <th className="text-center font-semibold">NF</th>
                <th className="text-center font-semibold">NF</th>
              </tr>
            </thead>
            <tbody>
              {nfItems.map((n) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.tx1_value)}</td>
                  <td className="text-center">{text(n.tx2_value)}</td>
                  <td>{text(n.keterangan)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Spacing */}
          <div style={{ height: '12mm' }} />

          {/* Section 2: RCMS */}
          <table className="gc-table text-[10px]">
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '19%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-center font-bold">NO</th>
                <th className="text-center font-bold">PARAMETER</th>
                <th className="text-center font-bold">&nbsp;</th>
                <th className="text-center font-bold">&nbsp;</th>
                <th className="text-center font-bold">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {rcmsItems.map((n, idx) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.tx1_value)}</td>
                  <td className="text-center">{text(n.tx2_value)}</td>
                  {idx === 0 ? (
                    <td rowSpan={rcmsItems.length} className="text-center align-middle leading-tight font-medium">
                      {text(record.nav_items.find((x) => x.section_code === 'rcms')?.section_keterangan) || 'PEMBACAAN DI RCMS TRANSMITTER SETTING'}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Personnel footer */}
          <table className="gc-table text-[10px] mt-4">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="font-bold py-1">PERSONIL</td>
                <td className="text-right py-1">&nbsp;</td>
              </tr>
              <tr>
                <td className="align-top">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <td style={{ width: '60%', border: '0', padding: '4px', fontWeight: 'bold' }}>TEKNISI</td>
                        <td style={{ width: '40%', border: '0', padding: '4px', fontWeight: 'bold', textAlign: 'center' }}>PARAF</td>
                      </tr>
                    </thead>
                    <tbody>
                      {technicianSlots.map((t, idx) => (
                        <tr key={t.id}>
                          <td style={{ border: '0', padding: '2px 4px' }} className="uppercase font-medium">{idx + 1}. {t.technician_name}</td>
                          <td style={{ border: '0', padding: '2px 4px', textAlign: 'center' }}>
                            {t.technician_signature ? (
                              <img src={t.technician_signature} alt="ttd" style={{ maxHeight: '20px', display: 'inline-block' }} />
                            ) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td className="text-center align-middle">
                  <div className="text-[10px]">Mengetahui,</div>
                  <div className="font-bold uppercase">PH MANAGER TEKNIK 1</div>
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-14 object-contain my-1" />
                  ) : (
                    <div style={{ height: '40px' }} />
                  )}
                  <div className="font-medium uppercase">{text(record.manager_name)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3+ — LAMPIRAN foto dokumentasi
         ═══════════════════════════════════════════════════════════ */}
      {photos.length > 0 && (
        <div className="print-page mt-4 mx-auto bg-white font-sans text-[11px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '297mm', minHeight: '210mm' }}>
          <div className="px-4 py-3">
            <p className="text-[14px] font-bold uppercase">LAMPIRAN :</p>
            <p className="text-[11px] uppercase mt-0.5">
              FOTO FOTO KEGIATAN GROUND CHECK {text(record.equipment_name)}
            </p>

            <table className="gc-table mt-3 text-[10px]">
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '65%' }} />
              </colgroup>
              <tbody>
                {photos.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center align-middle" style={{ height: '38mm' }}>
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={p.caption ?? p.original_name ?? 'Foto'}
                          className="mx-auto object-contain"
                          style={{ maxHeight: '36mm', maxWidth: '95%' }}
                        />
                      ) : (
                        <span className="text-slate-400">[foto tidak tersedia]</span>
                      )}
                    </td>
                    <td className="align-middle text-left px-3 text-[11px] font-medium uppercase">
                      {p.caption || p.original_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
