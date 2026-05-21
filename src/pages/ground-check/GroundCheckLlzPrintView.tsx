import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundCheckLlzService } from '@/services/groundCheckLlzService';
import { GroundCheckLlzPerformanceChart } from './components/GroundCheckLlzPerformanceChart';
import type { GroundCheckLlzRecordDetail } from '@/types/groundCheckLlz';

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

const monthYearLabel = (record: GroundCheckLlzRecordDetail): string => {
  if (record.report_month && record.report_month.trim() !== '') return record.report_month.toUpperCase();
  try {
    return new Date(record.date).toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric',
    }).toUpperCase();
  } catch {
    return '';
  }
};

const fmtNum = (v: number | null, digits = 2): string => {
  if (v == null || Number.isNaN(v)) return '';
  return v.toFixed(digits);
};

/**
 * GroundCheckLlzPrintView — multi-page A4 portrait print.
 *   PAGE 1 — Form 1 "Pengujian Berkala di Darat"
 *   PAGE 2 — Form 2 "Groundcheck Performance Curve" (measurement table)
 *   PAGE 3 — Auto-generated TX1 + TX2 Ground Performance Curve charts
 *   PAGE 4+ — LAMPIRAN foto dokumentasi (if any)
 */
export const GroundCheckLlzPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundCheckLlzRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await groundCheckLlzService.getDetail(Number(id));
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
        <Button variant="outline" onClick={() => navigate('/ground-check/llz')}>Kembali</Button>
      </div>
    );
  }

  const technicianSlots = record.technicians;
  const photos = record.photos ?? [];

  const points90  = record.curve_points.filter((p) => p.side === '90hz');
  const pointCtr  = record.curve_points.filter((p) => p.side === 'center');
  const points150 = record.curve_points.filter((p) => p.side === '150hz');

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hide { display: none !important; }
            .print-page { page-break-after: always; }
            .print-page:last-child { page-break-after: auto; }
            tr, td, th { page-break-inside: avoid; }
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .gc-table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          .gc-table th, .gc-table td { border: 1px solid #000; padding: 2px 3px; vertical-align: middle; }
          .gc-meta td { border: 0; padding: 1px 0; vertical-align: top; }
          .gc-tick { font-family: 'Times New Roman', serif; font-size: 11px; }
        `}
      </style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/ground-check/llz/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — Form 1: Pengujian Berkala di Darat
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mx-auto bg-white font-sans text-[9px] leading-tight print:mx-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="border border-black">
          <div className="text-center py-1 border-b border-black">
            <p className="text-[11px] font-bold tracking-wide">PENGUJIAN BERKALA DI DARAT PERALATAN FASLEKTRIK PENERBANGAN</p>
          </div>

          <div className="px-2 py-1.5 border-b border-black">
            <table className="gc-meta text-[9px]" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '100px' }} className="uppercase font-semibold">LAPORAN BULAN</td>
                  <td style={{ width: '8px' }}>:</td>
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
                  <td className="uppercase">{text(record.technical_data)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">IDENTIFICATION</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.identification)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">KALIBRASI AKHIR</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.last_calibration)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Main parameter table */}
          <table className="gc-table text-[8px]">
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
                <th colSpan={6} className="text-center font-bold">PENGUJIAN DI DARAT</th>
                <th rowSpan={3} className="text-center font-bold align-middle">KETERANGAN</th>
              </tr>
              <tr>
                <th colSpan={6} className="text-center font-bold">{formatPrintDate(record.date)}</th>
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
                <th className="border-0" />
                <th className="border-0" />
                <th className="border-0" />
                <th className="border-0" />
                <th className="border-0" />
              </tr>
            </thead>
            <tbody>
              {record.items.map((item) => {
                if (item.is_header) {
                  return (
                    <tr key={item.id}>
                      <td className="text-center font-bold align-middle">&nbsp;</td>
                      <td colSpan={10} className="font-bold uppercase">{item.parameter_name}</td>
                    </tr>
                  );
                }
                if (item.is_subheader) {
                  return (
                    <tr key={item.id}>
                      <td className="text-center align-middle">&nbsp;</td>
                      <td colSpan={10} className="font-bold uppercase pl-2">{item.parameter_name}</td>
                    </tr>
                  );
                }
                const tx1In  = item.tx1_in_tolerance  ? '√' : '';
                const tx1Out = item.tx1_out_of_tolerance ? '√' : '';
                const tx2In  = item.tx2_in_tolerance  ? '√' : '';
                const tx2Out = item.tx2_out_of_tolerance ? '√' : '';

                const rowBg = item.is_disabled ? { backgroundColor: '#e5e7eb' } : undefined;

                return (
                  <tr key={item.id} style={rowBg}>
                    <td className="text-center align-middle">{item.item_code ?? ''}</td>
                    <td className="align-middle leading-tight">{text(item.parameter_name)}</td>
                    <td className="text-center align-middle">{text(item.calibration_result)}</td>
                    <td className="text-center align-middle whitespace-pre-line leading-tight">{text(item.tolerance)}</td>
                    <td className="text-center align-middle">{text(item.tx1_hasil_pd)}</td>
                    <td className="text-center align-middle gc-tick">{tx1In}</td>
                    <td className="text-center align-middle gc-tick">{tx1Out}</td>
                    <td className="text-center align-middle">{text(item.tx2_hasil_pd)}</td>
                    <td className="text-center align-middle gc-tick">{tx2In}</td>
                    <td className="text-center align-middle gc-tick">{tx2Out}</td>
                    <td className="align-middle leading-tight">{text(item.keterangan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer: TEKNISI PELAKSANA + PH MANAGER TEKNIK 1 */}
          <table className="gc-table text-[9px]">
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td rowSpan={Math.max(technicianSlots.length, 1) + 1} className="text-center font-bold uppercase align-middle">TEKNISI PELAKSANA</td>
                <td className="text-center font-bold">1</td>
                <td className="font-medium">{technicianSlots[0]?.technician_name ?? ''}</td>
                <td rowSpan={Math.max(technicianSlots.length, 1) + 1} className="text-center align-middle">
                  {/* combined technician signatures */}
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    {technicianSlots.map((t) => (
                      t.technician_signature ? <img key={t.id} src={t.technician_signature} alt="ttd" className="max-h-8 object-contain" /> : null
                    ))}
                  </div>
                </td>
                <td rowSpan={Math.max(technicianSlots.length, 1) + 1} className="text-center align-middle">
                  <div className="font-bold uppercase">PH MANAGER TEKNIK 1</div>
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-12 object-contain my-1" />
                  ) : (
                    <div style={{ height: '32px' }} />
                  )}
                  <div className="font-medium uppercase">{text(record.manager_name)}</div>
                </td>
              </tr>
              {technicianSlots.slice(1).map((t, i) => (
                <tr key={t.id}>
                  <td className="text-center font-bold">{i + 2}</td>
                  <td className="font-medium">{t.technician_name}</td>
                </tr>
              ))}
              {technicianSlots.length === 0 && (
                <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — Form 2: Groundcheck Performance Curve (table)
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[8px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="px-2 py-2">
          {/* Header */}
          <div className="text-center mb-3">
            <p className="text-[10px] font-bold">PERUM LPPNPI</p>
            <p className="text-[10px] font-bold">KANTOR CABANG SURABAYA</p>
            <p className="text-[11px] font-bold underline">GROUNDCHECK PERFORMANCE CURVE</p>
          </div>

          {/* Metadata */}
          <table className="gc-meta text-[9px] mb-2" style={{ width: '60%' }}>
            <tbody>
              <tr>
                <td style={{ width: '80px' }} className="font-semibold">Tanggal</td>
                <td style={{ width: '8px' }}>:</td>
                <td>{formatPrintDate(record.date)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Fasilitas</td>
                <td>:</td>
                <td>{text(record.curve_facility)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Merk</td>
                <td>:</td>
                <td>{text(record.curve_merk)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Ident-Freq</td>
                <td>:</td>
                <td>{text(record.curve_ident_freq)}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[9px] font-bold mb-1">JARAK DARI ANT : {text(record.curve_jarak_ant)}</p>

          {/* Curve measurement table */}
          <table className="gc-table text-[7.5px]">
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className="text-center font-bold">SIDE</th>
                <th rowSpan={2} className="text-center font-bold">JARAK<br/>(M)</th>
                <th rowSpan={2} className="text-center font-bold">DEGRESS<br/>(°)</th>
                <th colSpan={6} className="text-center font-bold">TX 1</th>
                <th colSpan={6} className="text-center font-bold">TX 2</th>
              </tr>
              <tr>
                <th className="text-center font-bold leading-tight">DDM<br/>(%)</th>
                <th className="text-center font-bold leading-tight">DDM<br/>(µA)</th>
                <th className="text-center font-bold leading-tight">SUM<br/>(%)</th>
                <th className="text-center font-bold leading-tight">MOD<br/>90 Hz</th>
                <th className="text-center font-bold leading-tight">MOD<br/>150 Hz</th>
                <th className="text-center font-bold leading-tight">RF<br/>LEVEL<br/>(dB)</th>
                <th className="text-center font-bold leading-tight">DDM<br/>(%)</th>
                <th className="text-center font-bold leading-tight">DDM<br/>(µA)</th>
                <th className="text-center font-bold leading-tight">SUM<br/>(%)</th>
                <th className="text-center font-bold leading-tight">MOD<br/>90 Hz</th>
                <th className="text-center font-bold leading-tight">MOD<br/>150 Hz</th>
                <th className="text-center font-bold leading-tight">RF<br/>LEVEL<br/>(dB)</th>
              </tr>
            </thead>
            <tbody>
              {points90.map((p, idx) => (
                <tr key={p.id}>
                  {idx === 0 && (
                    <td rowSpan={points90.length} className="text-center font-bold align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      90 HZ SIDE
                    </td>
                  )}
                  <td className="text-center">{Number(p.jarak_m).toFixed(p.jarak_m % 1 === 0 ? 0 : 1)}</td>
                  <td className="text-center">{Number(p.degrees).toFixed(p.degrees % 1 === 0 ? 0 : 2)}°</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx1_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_rf_level_db)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx2_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_rf_level_db)}</td>
                </tr>
              ))}
              {pointCtr.map((p) => (
                <tr key={p.id}>
                  <td className="text-center font-bold">—</td>
                  <td className="text-center">{Number(p.jarak_m).toFixed(0)}</td>
                  <td className="text-center">0°</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx1_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_rf_level_db)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx2_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_rf_level_db)}</td>
                </tr>
              ))}
              {points150.map((p, idx) => (
                <tr key={p.id}>
                  {idx === 0 && (
                    <td rowSpan={points150.length} className="text-center font-bold align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      150 HZ SIDE
                    </td>
                  )}
                  <td className="text-center">{Number(p.jarak_m).toFixed(p.jarak_m % 1 === 0 ? 0 : 1)}</td>
                  <td className="text-center">{Number(p.degrees).toFixed(p.degrees % 1 === 0 ? 0 : 2)}°</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx1_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx1_rf_level_db)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_ddm_ua, 1)}</td>
                  <td className="text-center">{fmtNum(p.tx2_sum_pct)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_90hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_mod_150hz)}</td>
                  <td className="text-center">{fmtNum(p.tx2_rf_level_db)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer: Teknisi on Duty + Paraf + PH Manager */}
          <table className="gc-table text-[9px] mt-2">
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="font-bold">TEKNISI ON DUTY :</td>
                <td className="font-bold text-center">PARAF :</td>
                <td className="text-center font-bold">PH MANAGER TEKNIK 1</td>
              </tr>
              <tr>
                <td className="align-top">
                  <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', margin: 0 }}>
                    {technicianSlots.map((t) => (
                      <li key={t.id} className="font-medium">{t.technician_name}</li>
                    ))}
                  </ol>
                </td>
                <td className="align-top">
                  <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', margin: 0 }}>
                    {technicianSlots.map((t) => (
                      <li key={t.id} style={{ height: '16px' }}>
                        {t.technician_signature ? <img src={t.technician_signature} alt="ttd" style={{ maxHeight: '14px', display: 'inline-block' }} /> : ''}
                      </li>
                    ))}
                  </ol>
                </td>
                <td className="text-center align-middle">
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-16 object-contain" />
                  ) : (
                    <div style={{ height: '40px' }} />
                  )}
                  <div className="font-medium uppercase mt-1">{text(record.manager_name)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — Auto-generated TX1 + TX2 Charts
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="px-4 py-4 space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase mb-2 text-center">TX 1 Ground Performance Curve</p>
            <GroundCheckLlzPerformanceChart
              curvePoints={record.curve_points}
              tx="tx1"
              title=""
              distance={record.curve_jarak_ant ?? '300 Meter'}
              printMode
              width={680}
              height={240}
            />
          </div>
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase mb-2 text-center">TX 2 Ground Performance Curve</p>
            <GroundCheckLlzPerformanceChart
              curvePoints={record.curve_points}
              tx="tx2"
              title=""
              distance={record.curve_jarak_ant ?? '300 Meter'}
              printMode
              width={680}
              height={240}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 4+ — LAMPIRAN foto dokumentasi
         ═══════════════════════════════════════════════════════════ */}
      {photos.length > 0 && (
        <div className="print-page mt-4 mx-auto bg-white font-sans text-[11px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="px-4 py-3">
            <p className="text-[13px] font-bold uppercase">LAMPIRAN :</p>
            <p className="text-[11px] uppercase mt-0.5">
              FOTO FOTO KEGIATAN GROUND CHECK {text(record.equipment_name)}
            </p>

            <table className="gc-table mt-3 text-[10px]">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '60%' }} />
              </colgroup>
              <tbody>
                {photos.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center align-middle" style={{ height: '40mm' }}>
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={p.caption ?? p.original_name ?? 'Foto'}
                          className="mx-auto object-contain"
                          style={{ maxHeight: '38mm', maxWidth: '95%' }}
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
