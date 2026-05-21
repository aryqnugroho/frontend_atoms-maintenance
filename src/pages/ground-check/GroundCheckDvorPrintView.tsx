import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundCheckDvorService } from '@/services/groundCheckDvorService';
import type { GroundCheckDvorRecordDetail } from '@/types/groundCheckDvor';
import { GroundCheckDvorErrorChart } from './components/GroundCheckDvorErrorChart';

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

const monthYearLabel = (record: GroundCheckDvorRecordDetail): string => {
  if (record.report_month && record.report_month.trim() !== '') return record.report_month.toUpperCase();
  try {
    return new Date(record.date).toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric',
    }).toUpperCase();
  } catch {
    return '';
  }
};

const fmt = (n: number | null | undefined, digits = 2): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return n.toFixed(digits);
};

/**
 * GroundCheckDvorPrintView — multi-page A4 print.
 *   PAGE 1 (portrait)  — Form 1 "Ground Check VOR" bearing table
 *   PAGE 2 (portrait)  — Form 2 Error Curves (TX I + TX II)
 *   PAGE 3 (landscape) — Form 3 "Pengujian Berkala di Darat"
 *   PAGE 4 (portrait)  — Form 4 "Ground Check DVOR dengan PIR Rohde & Schwarz" NAV analyzer
 *   PAGE 5+ (portrait) — LAMPIRAN foto dokumentasi
 */
export const GroundCheckDvorPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundCheckDvorRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await groundCheckDvorService.getDetail(Number(id));
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

  // Compute stats for Form 1 bearing footer
  const stats = useMemo(() => {
    if (!record) {
      return { tx1: { min: null, max: null, spread: null }, tx2: { min: null, max: null, spread: null }, differential: null as number | null };
    }
    const tx1Errors = record.bearing_points.map((p) => p.tx1_error).filter((v): v is number => v !== null);
    const tx2Errors = record.bearing_points.map((p) => p.tx2_error).filter((v): v is number => v !== null);
    const calc = (arr: number[]) => {
      if (arr.length === 0) return { min: null as number | null, max: null as number | null, spread: null as number | null };
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), spread: Number((max - min).toFixed(2)) };
    };
    const tx1 = calc(tx1Errors);
    const tx2 = calc(tx2Errors);
    const differential = tx1.min !== null && tx2.min !== null
      ? Number((Math.abs(tx1.min) - Math.abs(tx2.min)).toFixed(2))
      : null;
    return { tx1, tx2, differential };
  }, [record]);

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
        <Button variant="outline" onClick={() => navigate('/ground-check/dvor')}>Kembali</Button>
      </div>
    );
  }

  const technicianSlots = record.technicians;
  const photos = record.photos ?? [];
  const bp = record.bearing_points;

  // Split nav items by section for Form 4 table
  const navBySection = {
    bearing:   record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'bearing'),
    modulasi:  record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'modulasi'),
    ident:     record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'ident'),
    meas_freq: record.nav_items.filter((n) => !n.is_section_header && n.section_code === 'meas_freq'),
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 8mm 8mm; }
            @page landscape { size: A4 landscape; margin: 8mm 8mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hide { display: none !important; }
            .print-page { page-break-after: always; }
            .print-page:last-child { page-break-after: auto; }
            .print-landscape { page: landscape; }
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
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/ground-check/dvor/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — Form 1: Ground Check VOR (bearing table) — PORTRAIT
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="px-4 py-3">
          {/* Header */}
          <div className="text-center mb-2">
            <p className="text-[14px] font-bold underline">GROUND CHECK VOR</p>
          </div>

          {/* Metadata */}
          <table className="gc-meta text-[10px] mb-2" style={{ width: '70%' }}>
            <tbody>
              <tr>
                <td style={{ width: '120px' }} className="font-semibold uppercase">Nama Peralatan</td>
                <td style={{ width: '8px' }}>:</td>
                <td className="uppercase">{text(record.vor_equipment_name)}</td>
              </tr>
              <tr>
                <td className="font-semibold uppercase">Frequency</td>
                <td>:</td>
                <td className="uppercase">{text(record.vor_frequency)}</td>
              </tr>
              <tr>
                <td className="font-semibold uppercase">Station</td>
                <td>:</td>
                <td className="uppercase">{text(record.vor_station)}</td>
              </tr>
              <tr>
                <td className="font-semibold uppercase">Tanggal Pelaksanaan</td>
                <td>:</td>
                <td className="uppercase">{formatPrintDate(record.date)}</td>
              </tr>
            </tbody>
          </table>

          {/* Bearing table */}
          <table className="gc-table text-[9px]">
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={4} className="text-center font-bold">TX I</th>
                <th colSpan={4} className="text-center font-bold">TX II</th>
              </tr>
              <tr>
                <th className="text-center font-bold">Bearing</th>
                <th className="text-center font-bold">Error</th>
                <th className="text-center font-bold">Reading</th>
                <th className="text-center font-bold">Value</th>
                <th className="text-center font-bold">Bearing</th>
                <th className="text-center font-bold">Error</th>
                <th className="text-center font-bold">Reading</th>
                <th className="text-center font-bold">Value</th>
              </tr>
            </thead>
            <tbody>
              {bp.map((p) => (
                <tr key={p.id}>
                  <td className="text-center">{p.bearing}</td>
                  <td className="text-center">{fmt(p.tx1_error)}</td>
                  <td className="text-center">{fmt(p.tx1_reading)}</td>
                  <td className="text-center">{text(p.tx1_value)}</td>
                  <td className="text-center">{p.bearing}</td>
                  <td className="text-center">{fmt(p.tx2_error)}</td>
                  <td className="text-center">{fmt(p.tx2_reading)}</td>
                  <td className="text-center">{text(p.tx2_value)}</td>
                </tr>
              ))}
              {/* spacer row */}
              <tr>
                <td colSpan={8}>&nbsp;</td>
              </tr>
              {/* Min/Max/Spread */}
              <tr>
                <td className="text-center font-bold">Min</td>
                <td className="text-center">{fmt(stats.tx1.min)}</td>
                <td colSpan={2}>&nbsp;</td>
                <td className="text-center font-bold">Min</td>
                <td className="text-center">{fmt(stats.tx2.min)}</td>
                <td colSpan={2}>&nbsp;</td>
              </tr>
              <tr>
                <td className="text-center font-bold">Max</td>
                <td className="text-center">{fmt(stats.tx1.max)}</td>
                <td colSpan={2}>&nbsp;</td>
                <td className="text-center font-bold">Max</td>
                <td className="text-center">{fmt(stats.tx2.max)}</td>
                <td colSpan={2}>&nbsp;</td>
              </tr>
              <tr>
                <td className="text-center font-bold">Spread</td>
                <td className="text-center">{fmt(stats.tx1.spread)}</td>
                <td colSpan={2}>&nbsp;</td>
                <td className="text-center font-bold">Spread</td>
                <td className="text-center">{fmt(stats.tx2.spread)}</td>
                <td colSpan={2}>&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={8}>&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={2}>&nbsp;</td>
                <td className="text-center font-bold">Differential</td>
                <td className="text-center">{fmt(stats.differential)}</td>
                <td colSpan={4}>&nbsp;</td>
              </tr>
              <tr>
                <td className="font-bold">Paraf Teknisi :</td>
                <td colSpan={7}>&nbsp;</td>
              </tr>
            </tbody>
          </table>

          {/* Footer signatures */}
          <table className="text-[10px] mt-3" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', padding: '4px 8px' }}>
                  <div className="font-bold">Teknisi Pelaksana</div>
                  <ol style={{ paddingLeft: '18px', marginTop: '2px' }}>
                    {technicianSlots.map((t) => (
                      <li key={t.id} className="uppercase">{t.technician_name}</li>
                    ))}
                  </ol>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: '4px 8px' }}>
                  <div className="font-bold uppercase">MANAGER TEKNIK</div>
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-16 object-contain my-1" />
                  ) : (
                    <div style={{ height: '52px' }} />
                  )}
                  <div className="font-medium uppercase">{text(record.manager_name)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — Form 2: Error Curve charts — PORTRAIT
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="px-4 py-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-[10px] flex-1">
              <p className="font-bold">PERUM LPPNPI</p>
              <p className="font-bold uppercase">{text(record.curve_organization)}</p>
            </div>
            <div className="text-[10px] text-right">
              <p>NAMA PERALATAN : <span className="uppercase">{text(record.vor_equipment_name)}</span></p>
              <p>FREQUENCY  : <span className="uppercase">{text(record.vor_frequency)}</span></p>
              <p>STATION  : <span className="uppercase">{text(record.vor_station)}</span></p>
            </div>
          </div>

          <p className="text-[10px] mb-3">
            <span className="font-semibold">Tanggal</span> : {formatPrintDate(record.date)}
          </p>

          {/* TX I chart */}
          <div className="border border-black p-2 mb-4" style={{ height: '90mm' }}>
            <GroundCheckDvorErrorChart bearingPoints={bp} tx="tx1" printMode width={730} height={300} />
          </div>

          {/* TX II chart */}
          <div className="border border-black p-2 mb-4" style={{ height: '90mm' }}>
            <GroundCheckDvorErrorChart bearingPoints={bp} tx="tx2" printMode width={730} height={300} />
          </div>

          {/* Footer signatures */}
          <table className="text-[10px] mt-3" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', padding: '4px 8px' }}>
                  <div className="font-bold">Teknisi Pelaksana</div>
                  <ol style={{ paddingLeft: '18px', marginTop: '2px' }}>
                    {technicianSlots.map((t) => (
                      <li key={t.id} className="uppercase">{t.technician_name}</li>
                    ))}
                  </ol>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: '4px 8px' }}>
                  <div className="font-bold uppercase">MANAGER TEKNIK</div>
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-16 object-contain my-1" />
                  ) : (
                    <div style={{ height: '52px' }} />
                  )}
                  <div className="font-medium uppercase">{text(record.manager_name)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — Form 3: Pengujian Berkala di Darat — LANDSCAPE
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page print-landscape mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '297mm', minHeight: '210mm' }}>
        <div className="border border-black">
          <div className="text-center py-1.5 border-b border-black">
            <p className="text-[12px] font-bold tracking-wide">PENGUJIAN BERKALA DI DARAT PERALATAN FASLEKTRIK PENERBANGAN</p>
          </div>

          <div className="px-3 py-2 border-b border-black flex justify-between gap-4">
            <table className="gc-meta text-[10px]" style={{ width: '60%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '140px' }} className="uppercase font-semibold">LAPORAN BULAN</td>
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
                  <td className="uppercase font-semibold">LOKASI PERALATAN</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.equipment_location)}</td>
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
            <table className="gc-meta text-[10px]" style={{ width: '40%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '120px' }} className="uppercase font-semibold">IDENTIFICATION</td>
                  <td style={{ width: '10px' }}>:</td>
                  <td className="uppercase">{text(record.identification)}</td>
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

          {/* Footer: TEKNISI PELAKSANA + MANAGER TEKNIK */}
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
                  <div className="font-bold uppercase">MANAGER TEKNIK</div>
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
          PAGE 4 — Form 4: NAV Analyzer (REFF TOWER + PERALATAN DVOR)
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="px-4 py-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-[10px] flex-1">
              <p className="font-bold">PERUM LPPNPI</p>
              <p className="font-bold uppercase">{text(record.curve_organization)}</p>
            </div>
            <div className="text-[10px] text-right">
              <p className="uppercase">{text(record.vor_equipment_name)}</p>
              <p className="uppercase">FREQUENCY  {text(record.vor_frequency)}</p>
              <p className="uppercase">STATION  : {text(record.vor_station)}</p>
            </div>
          </div>

          <p className="text-[10px] mb-2">
            <span className="font-semibold">Tanggal :</span> : {formatPrintDate(record.date)}
          </p>

          <p className="text-center text-[12px] font-bold mb-2">
            {text(record.nav_analyzer_title)}
          </p>

          <table className="gc-table text-[9px]">
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className="text-center font-bold align-middle">NO</th>
                <th rowSpan={2} className="text-center font-bold align-middle">PARAMETER</th>
                <th colSpan={2} className="text-center font-bold">REFF TOWER</th>
                <th colSpan={2} className="text-center font-bold">PERALATAN DVOR</th>
              </tr>
              <tr>
                <th className="text-center font-bold">TRANSMITTER 1</th>
                <th className="text-center font-bold">TRANSMITTER 2</th>
                <th className="text-center font-bold">TRANSMITTER 1</th>
                <th className="text-center font-bold">TRANSMITTER 2</th>
              </tr>
            </thead>
            <tbody>
              {/* BEARING section */}
              <tr><td colSpan={6} className="font-bold uppercase text-[10px]" style={{ backgroundColor: '#f3f4f6' }}>BEARING</td></tr>
              {navBySection.bearing.map((n) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.ref_tx1_value)}</td>
                  <td className="text-center">{text(n.ref_tx2_value)}</td>
                  <td className="text-center">{text(n.eq_tx1_value)}</td>
                  <td className="text-center">{text(n.eq_tx2_value)}</td>
                </tr>
              ))}

              {/* MODULASI section */}
              <tr><td colSpan={6} className="font-bold uppercase text-[10px]" style={{ backgroundColor: '#f3f4f6' }}>MODULASI</td></tr>
              {navBySection.modulasi.map((n) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.ref_tx1_value)}</td>
                  <td className="text-center">{text(n.ref_tx2_value)}</td>
                  <td className="text-center">{text(n.eq_tx1_value)}</td>
                  <td className="text-center">{text(n.eq_tx2_value)}</td>
                </tr>
              ))}

              {/* IDENT INFORMATION */}
              <tr><td colSpan={6} className="font-bold uppercase text-[10px]" style={{ backgroundColor: '#f3f4f6' }}>IDENT INFORMATION</td></tr>
              {navBySection.ident.map((n) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.ref_tx1_value)}</td>
                  <td className="text-center">{text(n.ref_tx2_value)}</td>
                  <td className="text-center">{text(n.eq_tx1_value)}</td>
                  <td className="text-center">{text(n.eq_tx2_value)}</td>
                </tr>
              ))}

              {/* MEASUREMENT FREQ */}
              <tr><td colSpan={6} className="font-bold uppercase text-[10px]" style={{ backgroundColor: '#f3f4f6' }}>MEASUREMENT FREQ</td></tr>
              {navBySection.meas_freq.map((n) => (
                <tr key={n.id}>
                  <td className="text-center">{n.item_code ?? ''}</td>
                  <td>{text(n.parameter_name)}</td>
                  <td className="text-center">{text(n.ref_tx1_value)}</td>
                  <td className="text-center">{text(n.ref_tx2_value)}</td>
                  <td className="text-center">{text(n.eq_tx1_value)}</td>
                  <td className="text-center">{text(n.eq_tx2_value)}</td>
                </tr>
              ))}

              {/* PERSONIL */}
              <tr><td colSpan={6} className="font-bold uppercase text-[10px]" style={{ backgroundColor: '#f3f4f6' }}>PERSONIL</td></tr>
              <tr>
                <td colSpan={2} className="align-top">
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
                <td colSpan={4} className="text-center align-middle">
                  <div className="text-[10px]">Mengetahui,</div>
                  <div className="font-bold uppercase">MANAGER TEKNIK</div>
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

          {/* Note */}
          {record.note && (
            <p className="text-[10px] mt-3">
              <span className="font-semibold">note :</span> <span className="whitespace-pre-line">{text(record.note)}</span>
            </p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 5+ — LAMPIRAN foto dokumentasi
         ═══════════════════════════════════════════════════════════ */}
      {photos.length > 0 && (
        <div className="print-page mt-4 mx-auto bg-white font-sans text-[11px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="px-4 py-3">
            <p className="text-[14px] font-bold uppercase">LAMPIRAN :</p>
            <p className="text-[11px] uppercase mt-0.5">
              FOTO FOTO KEGIATAN GROUND CHECK {text(record.equipment_name)}
            </p>

            <table className="gc-table mt-3 text-[10px]">
              <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '55%' }} />
              </colgroup>
              <tbody>
                {photos.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center align-middle" style={{ height: '50mm' }}>
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={p.caption ?? p.original_name ?? 'Foto'}
                          className="mx-auto object-contain"
                          style={{ maxHeight: '48mm', maxWidth: '95%' }}
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
