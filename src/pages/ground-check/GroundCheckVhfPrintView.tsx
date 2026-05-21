import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundCheckVhfService } from '@/services/groundCheckVhfService';
import type { GroundCheckVhfRecordDetail } from '@/types/groundCheckVhf';

// ─── Helpers ──────────────────────────────────────────────────
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

const formatPrintDateShort = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const monthYearLabel = (record: GroundCheckVhfRecordDetail): string => {
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
 * GroundCheckVhfPrintView — multi-page A4 landscape print:
 *   PAGE 1: Form 1 "Pengujian Berkala di Darat" (mirrors ADC layout)
 *   PAGE 2: Form 2 "Pelaksanaan Kegiatan Pemeliharaan Pencegahan"
 *   PAGE 3+: LAMPIRAN foto dokumentasi (if any)
 */
export const GroundCheckVhfPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundCheckVhfRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await groundCheckVhfService.getDetail(Number(id));
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
        <Button variant="outline" onClick={() => navigate('/ground-check/vhf')}>Kembali</Button>
      </div>
    );
  }

  // Form 1 item numbering
  let itemNumber = 0;

  // Always 6 technician slots on the printed footer
  const technicianSlots = Array.from({ length: 6 }, (_, i) => record.technicians[i] ?? null);
  const photos = record.photos ?? [];

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
        `}
      </style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[297mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/ground-check/vhf/${record.id}`)}>
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

          {/* Title block */}
          <div className="text-center py-1.5 border-b border-black">
            <p className="text-[13px] font-bold tracking-wide">PENGUJIAN BERKALA DI DARAT</p>
            <p className="text-[12px] font-bold tracking-wide">PERALATAN FASLEKTRIK PENERBANGAN</p>
          </div>

          {/* Metadata block */}
          <div className="px-3 py-2 border-b border-black">
            <table className="gc-meta text-[10px]" style={{ width: '60%' }}>
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
                  <td className="uppercase">{text(record.technical_data)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">KALIBRASI TERAKHIR</td>
                  <td>:</td>
                  <td className="uppercase">TANGGAL = {text(record.last_calibration)}</td>
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
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={3} className="text-center font-bold align-middle">NO</th>
                <th rowSpan={3} className="text-center font-bold align-middle">PARAMETER</th>
                <th rowSpan={3} className="text-center font-bold align-middle leading-tight">
                  HASIL<br />PENGUKURAN<br />SETELAH<br />KALIBRASI
                </th>
                <th rowSpan={3} className="text-center font-bold align-middle">TOLERANSI</th>
                <th colSpan={6} className="text-center font-bold">
                  PENGUJIAN DIDARAT
                </th>
                <th rowSpan={3} className="text-center font-bold align-middle">KETERANGAN</th>
              </tr>
              <tr>
                <th colSpan={6} className="text-center font-bold">
                  TANGGAL : {formatPrintDate(record.date)}
                </th>
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
                      <td colSpan={10} className="font-bold uppercase text-[10px] leading-tight">
                        {item.parameter_name}
                      </td>
                    </tr>
                  );
                }

                itemNumber++;
                const tx1In  = item.tx1_in_tolerance  ? '√' : '';
                const tx1Out = item.tx1_out_of_tolerance ? '√' : '';
                const tx2In  = item.tx2_in_tolerance  ? '√' : '';
                const tx2Out = item.tx2_out_of_tolerance ? '√' : '';

                return (
                  <tr key={item.id}>
                    <td className="text-center align-middle">{item.item_code ?? itemNumber}.</td>
                    <td className="align-middle leading-tight">{text(item.parameter_name)}</td>
                    <td className="text-center align-middle">{text(item.calibration_result)}</td>
                    <td className="text-center align-middle">{text(item.tolerance)}</td>
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

          {/* Footer: TEKNISI PELAKSANA / SUPERVISOR / MANAGER TEKNIK */}
          <table className="gc-table text-[10px]">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td rowSpan={6} className="text-center font-bold uppercase align-middle">
                  TEKNISI PELAKSANA
                </td>
                <td className="font-medium">{technicianSlots[0] ? `1. ${technicianSlots[0].technician_name}` : '1.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[0]?.technician_signature ? (
                    <img src={technicianSlots[0].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
                <td className="text-center font-bold uppercase align-middle">SUPERVISOR</td>
                <td className="text-center font-bold uppercase align-middle">MANAGER TEKNIK</td>
              </tr>
              <tr>
                <td className="font-medium">{technicianSlots[1] ? `2. ${technicianSlots[1].technician_name}` : '2.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[1]?.technician_signature ? (
                    <img src={technicianSlots[1].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
                <td rowSpan={5} className="text-center align-middle">
                  {record.supervisor_signature ? (
                    <img src={record.supervisor_signature} alt="ttd supervisor" className="mx-auto max-h-16 object-contain" />
                  ) : ''}
                </td>
                <td rowSpan={5} className="text-center align-middle">
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-16 object-contain" />
                  ) : ''}
                </td>
              </tr>
              <tr>
                <td className="font-medium">{technicianSlots[2] ? `3. ${technicianSlots[2].technician_name}` : '3.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[2]?.technician_signature ? (
                    <img src={technicianSlots[2].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
              </tr>
              <tr>
                <td className="font-medium">{technicianSlots[3] ? `4. ${technicianSlots[3].technician_name}` : '4.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[3]?.technician_signature ? (
                    <img src={technicianSlots[3].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
              </tr>
              <tr>
                <td className="font-medium">{technicianSlots[4] ? `5. ${technicianSlots[4].technician_name}` : '5.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[4]?.technician_signature ? (
                    <img src={technicianSlots[4].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
              </tr>
              <tr>
                <td className="font-medium">{technicianSlots[5] ? `6. ${technicianSlots[5].technician_name}` : '6.'}</td>
                <td className="text-center align-middle">
                  {technicianSlots[5]?.technician_signature ? (
                    <img src={technicianSlots[5].technician_signature} alt="ttd" className="mx-auto max-h-9 object-contain" />
                  ) : ''}
                </td>
              </tr>
              <tr>
                <td colSpan={3} />
                <td className="text-center font-medium uppercase">{text(record.supervisor_name) || ' '}</td>
                <td className="text-center font-medium uppercase">{text(record.manager_name) || ' '}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — Form 2: Pelaksanaan Kegiatan Pemeliharaan Pencegahan
         ═══════════════════════════════════════════════════════════ */}
      <div className="print-page mt-4 mx-auto bg-white font-sans text-[10px] leading-tight print:mx-0 print:mt-0 print:w-full print:max-w-none" style={{ width: '297mm', minHeight: '210mm' }}>
        <div className="border border-black">

          {/* Title */}
          <div className="text-center py-1.5 border-b border-black">
            <p className="text-[13px] font-bold tracking-wide">PELAKSANAAN KEGIATAN PEMELIHARAAN PENCEGAHAN</p>
            <p className="text-[10px]">(BULANAN)</p>
          </div>

          {/* Top metadata: Fasilitas / Peralatan + Merk / Bulan */}
          <div className="px-3 py-2 border-b border-black">
            <table className="gc-meta text-[10px]" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '100px' }} className="uppercase font-semibold">Fasilitas</td>
                  <td style={{ width: '10px' }}>:</td>
                  <td style={{ width: '40%' }} className="uppercase">Communication</td>
                  <td style={{ width: '100px' }} className="uppercase font-semibold">Merk / Tipe</td>
                  <td style={{ width: '10px' }}>:</td>
                  <td className="uppercase">{text(record.technical_data)}</td>
                </tr>
                <tr>
                  <td className="uppercase font-semibold">Peralatan</td>
                  <td>:</td>
                  <td className="uppercase">{text(record.equipment_function) || text(record.equipment_name)}</td>
                  <td className="uppercase font-semibold">Bulan</td>
                  <td>:</td>
                  <td className="uppercase">{monthYearLabel(record)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Maintenance items table */}
          <table className="gc-table text-[9px]">
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '36%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className="text-center font-bold align-middle">NO</th>
                <th rowSpan={2} className="text-center font-bold align-middle">URAIAN KEGIATAN</th>
                <th rowSpan={2} className="text-center font-bold align-middle">TOLERANSI</th>
                <th rowSpan={2} className="text-center font-bold align-middle">INTERFACE</th>
                <th colSpan={2} className="text-center font-bold">
                  HASIL PEMELIHARAAN<br />{formatPrintDateShort(record.date)}
                </th>
                <th rowSpan={2} className="text-center font-bold align-middle">KETERANGAN</th>
              </tr>
              <tr>
                <th className="text-center font-bold">TX 1</th>
                <th className="text-center font-bold">TX 2</th>
              </tr>
            </thead>
            <tbody>
              {record.maintenance_items.map((m) => {
                if (m.is_section_header) {
                  return (
                    <tr key={m.id}>
                      <td className="text-center font-bold align-middle">{m.section_number}</td>
                      <td colSpan={6} className="font-bold leading-tight">
                        {m.section_label}
                      </td>
                    </tr>
                  );
                }
                if (m.is_subsection_header) {
                  return (
                    <tr key={m.id}>
                      <td className="text-center align-middle">{m.item_code ?? ''}</td>
                      <td colSpan={6} className="font-semibold italic leading-tight">
                        {m.parameter_name}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={m.id}>
                    <td className="text-center align-middle">{m.item_code ?? ''}</td>
                    <td className="align-middle leading-tight">{text(m.parameter_name)}</td>
                    <td className="text-center align-middle">{text(m.toleransi)}</td>
                    <td className="text-center align-middle">{text(m.interface_value)}</td>
                    <td className="text-center align-middle">{text(m.tx1_value)}</td>
                    <td className="text-center align-middle">{text(m.tx2_value)}</td>
                    <td className="align-middle leading-tight">{text(m.keterangan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer: Teknisi Pelaksana & Paraf / Manager Teknik & Paraf */}
          <table className="gc-table text-[10px] mt-0">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="text-center font-bold uppercase py-1">Teknisi Pelaksana &amp; Paraf</td>
                <td className="text-center font-bold uppercase py-1">Manager Teknik &amp; Paraf</td>
              </tr>
              <tr>
                <td className="align-top" style={{ height: '32mm' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {technicianSlots.map((t, idx) => (
                        <tr key={idx}>
                          <td style={{ width: '8%', border: '0', padding: '2px' }}>{idx + 1}.</td>
                          <td style={{ width: '52%', border: '0', padding: '2px' }}>{t?.technician_name ?? ''}</td>
                          <td style={{ width: '40%', border: '0', padding: '2px', textAlign: 'center' }}>
                            {t?.technician_signature ? (
                              <img src={t.technician_signature} alt="ttd" style={{ maxHeight: '20px', display: 'inline-block' }} />
                            ) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td className="text-center align-middle">
                  {record.manager_signature ? (
                    <img src={record.manager_signature} alt="ttd manager" className="mx-auto max-h-20 object-contain" />
                  ) : ''}
                  <div className="mt-1 font-medium uppercase">{text(record.manager_name) || ' '}</div>
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
              FOTO FOTO KEGIATAN GROUND CHECK {text(record.equipment_function) || `VHF ${text(record.equipment_name)}`}
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
