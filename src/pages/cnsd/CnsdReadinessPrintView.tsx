import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdReadinessService } from '@/services/cnsdReadinessService';
import type {
  CnsdReadinessItem,
  CnsdReadinessRecordDetail,
  CnsdReadinessSectionMeta,
} from '@/types/cnsd';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const formatDateID = (v?: string | null): string => {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return v;
  }
};

const val = (v: string | null | undefined): string =>
  v == null || v === '' ? '' : v;

// ─── Section block in the print table ─────────────────────────

interface PrintSectionBlockProps {
  index: number;
  meta: CnsdReadinessSectionMeta;
  items: CnsdReadinessItem[];
}

const PrintSectionBlock: React.FC<PrintSectionBlockProps> = ({ index, meta, items }) => {
  if (items.length === 0) {
    return (
      <>
        <tr>
          <td colSpan={6} className="gc-section-bar">
            {index}. {meta.name}
          </td>
        </tr>
        <tr>
          <td colSpan={6} className="text-center text-[9px] italic py-1.5">— belum ada baris —</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {/* Section bar — gray fill */}
      <tr>
        <td className="gc-section-bar text-center">{index}</td>
        <td className="gc-section-bar">{meta.name}</td>
        {/* For section bar, sub-columns of KONDISI OPERASIONAL spell the column labels */}
        <td className="gc-section-bar text-center">{/* Status column header is just bar */}</td>
        <td className="gc-section-bar text-center">{val(meta.columns_label_1)}</td>
        <td className="gc-section-bar text-center">{val(meta.columns_label_2)}</td>
        <td className="gc-section-bar">{/* Keterangan */}</td>
      </tr>

      {items.map((item, rowIdx) => (
        <tr key={item.id} className="text-[10px]">
          <td className="text-center font-mono">{item.item_number ?? rowIdx + 1}</td>
          <td>
            <div className="flex items-center justify-between gap-1 leading-tight">
              <span className="font-medium">{item.equipment_name}</span>
              {item.sub_equipment_name && (
                <span className="text-[9px] font-semibold uppercase pl-2">{item.sub_equipment_name}</span>
              )}
            </div>
          </td>
          <td className="text-center font-medium">
            {item.status_peralatan ?? 'Normal / Tidak Normal'}
          </td>
          <td className="text-center">{val(item.kondisi_operasional_1)}</td>
          <td className="text-center font-medium">{val(item.kondisi_operasional_2)}</td>
          <td>{val(item.keterangan)}</td>
        </tr>
      ))}
    </>
  );
};

/**
 * CNSD Readiness Print View — Form EQ-1 (B&W, single page A4 portrait).
 *
 * Layout matches the official "Kesiapan Peralatan" paper form:
 *   - Header band: AirNav logo (left) + PERUM LPPNPI address block (right)
 *   - Title KESIAPAN PERALATAN, metadata grid (LOKASI / TGL/JAM / FASILITAS / FORM EQ-1)
 *   - One continuous table with 5 gray section bars (KOMUNIKASI / RADIO / NAVIGASI / PENGAMATAN / AUTOMASI)
 *   - Footer: TEKNISI list with Paraf | SUPERVISOR | MANAGER TEKNIK
 *
 * Per user request: no form_number displayed anywhere.
 */
export const CnsdReadinessPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdReadinessRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await cnsdReadinessService.getRecord(Number(id));
        setRecord(data);
      } catch {
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRecord();
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
        <Button variant="outline" onClick={() => navigate('/cnsd/readiness')}>Kembali</Button>
      </div>
    );
  }

  // Group items by section, preserving the order from sections_meta.
  const itemsBySection: Record<string, CnsdReadinessItem[]> = {};
  record.items.forEach((it) => {
    if (!itemsBySection[it.section_name]) itemsBySection[it.section_name] = [];
    itemsBySection[it.section_name].push(it);
  });

  const tanggalJam = `${formatDateID(record.date)}  /  ${SHIFT_TIME_LABELS[record.shift_type] ?? record.shift_type}`;

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 7mm 7mm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          tr, td, th { page-break-inside: avoid; }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .gc-paper {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          color: #000;
        }
        .gc-table { border-collapse: collapse; width: 100%; }
        .gc-table th, .gc-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
        .gc-section-bar {
          background-color: #d1d5db !important;
          font-weight: 700;
          padding: 3px 6px !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .gc-meta td { border: 0; padding: 0; vertical-align: top; }
        .gc-status-cell { background-color: #f3f4f6 !important; }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/cnsd/readiness/${record.id}`)}>
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* A4 paper */}
      <div
        className="gc-paper mx-auto bg-white print:mx-0 print:w-full print:max-w-none"
        style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}
      >
        {/* ── Kop ── */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              style={{ height: '38px', width: 'auto' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <div className="text-[11px] font-bold">AirNav Indonesia</div>
            </div>
          </div>
          <div className="text-right leading-tight text-[9px]">
            <div className="font-bold text-[10px]">Perum LPPNPI</div>
            <div>KANTOR CABANG SURABAYA</div>
            <div>Telp (031) 8688543 Fax. (031) 8688535</div>
            <div>email : info@airnavindonesia.co.id</div>
            <div>Web : www.airnavindonesia.co.id</div>
          </div>
        </div>

        {/* Title band + metadata band */}
        <table className="gc-table mb-0">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center font-bold text-[14px] py-1">
                KESIAPAN PERALATAN
              </td>
            </tr>
            <tr>
              <td rowSpan={2} className="align-top leading-tight">
                <table className="gc-meta">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '60px' }}>LOKASI</td>
                      <td className="px-0.5">:</td>
                      <td className="uppercase">{val(record.location)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TGL/JAM</td>
                      <td className="px-0.5">:</td>
                      <td>{tanggalJam}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td rowSpan={2} className="gc-section-bar text-center font-bold">
                FASILITAS
              </td>
              <td className="text-[9px] leading-tight">
                COMMUNICATION NAVIGATION SURVEILLANCE AND DATA PROCESSING
              </td>
            </tr>
            <tr>
              <td className="text-center font-bold text-[11px]">FORM EQ-1</td>
            </tr>
          </tbody>
        </table>

        {/* Items table */}
        <table className="gc-table">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr className="text-center font-bold gc-section-bar">
              <th className="border border-black py-1">NO</th>
              <th className="border border-black py-1">NAMA PERALATAN</th>
              <th className="border border-black py-1 leading-tight">STATUS<br/>PERALATAN</th>
              <th colSpan={2} className="border border-black py-1">KONDISI OPERASIONAL</th>
              <th className="border border-black py-1">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {record.sections_meta.map((meta, idx) => (
              <PrintSectionBlock
                key={meta.name + idx}
                index={idx + 1}
                meta={meta}
                items={itemsBySection[meta.name] ?? []}
              />
            ))}
          </tbody>
        </table>

        {/* Footer signatures */}
        <table className="gc-table">
          <colgroup>
            <col style={{ width: '44%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '28%' }} />
          </colgroup>
          <thead>
            <tr className="text-center font-bold gc-section-bar">
              <th className="border border-black py-1">TEKNISI</th>
              <th className="border border-black py-1">SUPERVISOR</th>
              <th className="border border-black py-1">MANAGER TEKNIK</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Teknisi sub-table */}
              <td className="align-top p-0">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '12%', border: '1px solid #000', padding: '2px', fontWeight: 700, textAlign: 'center' }}>No</th>
                      <th style={{ width: '58%', border: '1px solid #000', padding: '2px', fontWeight: 700, textAlign: 'center' }}>Nama</th>
                      <th style={{ width: '30%', border: '1px solid #000', padding: '2px', fontWeight: 700, textAlign: 'center' }}>Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.technicians.map((t, idx) => (
                      <tr key={t.id}>
                        <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '2px' }} className="uppercase">{t.technician_name}</td>
                        <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', height: '26px' }}>
                          {t.signature ? (
                            <img src={t.signature} alt="ttd" style={{ maxHeight: '20px', display: 'inline-block' }} />
                          ) : ''}
                        </td>
                      </tr>
                    ))}
                    {record.technicians.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                          —
                        </td>
                      </tr>
                    )}
                    {/* Fill remaining rows to keep visual consistency with paper form */}
                    {record.technicians.length > 0 && record.technicians.length < 6 && (
                      Array.from({ length: 6 - record.technicians.length }).map((_, i) => (
                        <tr key={`empty-tech-${i}`}>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', height: '22px' }}>&nbsp;</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>&nbsp;</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>&nbsp;</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </td>

              {/* Supervisor */}
              <td className="text-center align-top" style={{ minHeight: '120px' }}>
                <div style={{ minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {record.supervisor?.signature ? (
                    <img src={record.supervisor.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">
                  {val(record.supervisor?.name) || '—'}
                </div>
              </td>

              {/* Manager Teknik */}
              <td className="text-center align-top" style={{ minHeight: '120px' }}>
                <div style={{ minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {record.manager?.signature ? (
                    <img src={record.manager.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">
                  {val(record.manager?.name) || '—'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
