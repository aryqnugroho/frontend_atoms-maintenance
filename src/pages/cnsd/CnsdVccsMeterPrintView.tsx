import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdVccsMeterService } from '@/services/cnsdVccsMeterService';
import type {
  CnsdVccsMeterItem,
  CnsdVccsMeterRecordDetail,
  CnsdVccsMeterSectionMeta,
} from '@/types/cnsdVccs';

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

const text = (v: string | null | undefined): string =>
  v == null || v === '' ? '' : String(v);

interface PrintSectionBlockProps {
  meta: CnsdVccsMeterSectionMeta;
  items: CnsdVccsMeterItem[];
}

/**
 * Render a single VCCS section as a series of table rows: section bar +
 * column sub-headers + items + optional group separators.
 *
 * VCCS layouts handled:
 *   - dual_adaptive  (FRONT PANEL):  Standart | Server A | Server B
 *   - dual_toggle_nf (MSC & RCMS / CWP): Content | Normal | Fault, with group bars
 *   - environment   (LINGKUNGAN KERJA): Nominal | Hasil Pemeriksaan (colspan 2)
 */
const PrintSectionBlock: React.FC<PrintSectionBlockProps> = ({ meta, items }) => {
  const layout = meta.inputs_layout;
  const totalCols = 6;

  // Group items by group_name for sections with sub-groups (Frame 1/2)
  const groupedItems = useMemo(() => {
    const groups: { name: string | null; items: CnsdVccsMeterItem[] }[] = [];
    let current: { name: string | null; items: CnsdVccsMeterItem[] } | null = null;
    for (const it of items) {
      const gName = it.group_name ?? null;
      if (!current || current.name !== gName) {
        current = { name: gName, items: [] };
        groups.push(current);
      }
      current.items.push(it);
    }
    return groups;
  }, [items]);
  const hasMultipleGroups = groupedItems.length > 1;

  return (
    <>
      {/* Section sub-header bar with column sub-labels */}
      {layout === 'dual_adaptive' && (
        <tr>
          <td className="text-center font-bold gc-group-bar">{meta.code}</td>
          <td className="gc-group-bar font-bold uppercase">{meta.name}</td>
          <td className="gc-group-bar text-center font-bold">Standart</td>
          <td className="gc-group-bar text-center font-bold">{meta.columns_label_1 ?? 'Server A'}</td>
          <td className="gc-group-bar text-center font-bold">{meta.columns_label_2 ?? 'Server B'}</td>
          <td className="gc-group-bar font-bold">{/* KETERANGAN */}</td>
        </tr>
      )}
      {layout === 'dual_toggle_nf' && (
        <tr>
          <td className="text-center font-bold gc-group-bar">{meta.code}</td>
          <td className="gc-group-bar font-bold uppercase">{meta.name}</td>
          <td className="gc-group-bar text-center font-bold">Content</td>
          <td className="gc-group-bar text-center font-bold">{meta.columns_label_1 ?? 'Normal'}</td>
          <td className="gc-group-bar text-center font-bold">{meta.columns_label_2 ?? 'Fault'}</td>
          <td className="gc-group-bar font-bold">{/* KETERANGAN */}</td>
        </tr>
      )}
      {layout === 'environment' && (
        <>
          <tr>
            <td colSpan={totalCols} className="gc-section-bar font-bold uppercase">
              {meta.code} &nbsp;&nbsp;{meta.name}
            </td>
          </tr>
          <tr>
            <td className="text-center font-bold gc-group-bar">NO</td>
            <td className="gc-group-bar font-bold">KEGIATAN</td>
            <td className="gc-group-bar text-center font-bold">Nominal</td>
            <td colSpan={2} className="gc-group-bar text-center font-bold">HASIL PEMERIKSAAN</td>
            <td className="gc-group-bar font-bold">KETERANGAN</td>
          </tr>
        </>
      )}

      {groupedItems.map((group) => (
        <React.Fragment key={group.name ?? '__nogroup__'}>
          {hasMultipleGroups && group.name && layout === 'dual_toggle_nf' && (
            <tr>
              <td className="text-center" />
              <td className="pl-1 font-bold uppercase">{group.name}</td>
              <td colSpan={4} />
            </tr>
          )}
          {group.items.map((item) => {
            const rowNo = item.item_number && item.item_number.trim() !== '' ? item.item_number : '';
            if (layout === 'dual_adaptive') {
              return (
                <tr key={item.id} className="text-[10px]">
                  <td className="text-center">{rowNo}</td>
                  <td className="pl-1">{item.item_name}</td>
                  <td className="text-center">{text(item.nominal)}</td>
                  <td className="text-center">{text(item.hasil_a)}</td>
                  <td className="text-center">{text(item.hasil_b)}</td>
                  <td>{text(item.keterangan)}</td>
                </tr>
              );
            }
            if (layout === 'dual_toggle_nf') {
              return (
                <tr key={item.id} className="text-[10px]">
                  <td className="text-center" />
                  <td className="pl-1">{item.item_name}</td>
                  <td className="text-center">{text(item.nominal)}</td>
                  <td className="text-center font-bold">{text(item.hasil_a)}</td>
                  <td className="text-center font-bold">{text(item.hasil_b)}</td>
                  <td>{text(item.keterangan)}</td>
                </tr>
              );
            }
            // environment
            return (
              <tr key={item.id} className="text-[10px]">
                <td className="text-center">{rowNo}</td>
                <td className="pl-1">{item.item_name}</td>
                <td className="text-center">{text(item.nominal)}</td>
                <td colSpan={2} className="text-center">{text(item.hasil)}</td>
                <td>{text(item.keterangan)}</td>
              </tr>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * CNSD VCCS LES Meter Reading Print View — A4 portrait, B&W.
 *
 * Layout mirrors the official "METER READING — VCCS" paper form 014_VCCS:
 *   - Kop band: AirNav logo + "FAS CNS & OTOMASI" (left), Perum LPPNPI (right)
 *   - Title METER READING centered, VCCS gray bar middle
 *   - Metadata band: LOKASI/TANGGAL (left) · VCCS (center) · MERK/TYPE/SN (right)
 *   - Section A. PERALATAN bar + 3 sub-sections (FRONT PANEL / MSC & RCMS / CWP)
 *   - Section B. LINGKUNGAN KERJA bar
 *   - Footer 3-col: TEKNISI sub-table | SUPERVISOR | MANAGER TEKNIK
 *
 * Per project standard: NO form_number on print. Grayscale only.
 */
export const CnsdVccsMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdVccsMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await cnsdVccsMeterService.getRecord(Number(id));
        setRecord(data);
      } catch {
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRecord();
  }, [id]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdVccsMeterItem[]> = {};
    record?.items.forEach((it) => {
      const code = it.section_code ?? '1';
      if (!map[code]) map[code] = [];
      map[code].push(it);
    });
    return map;
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
        <Button variant="outline" onClick={() => navigate('/cnsd/vccs-meter')}>Kembali</Button>
      </div>
    );
  }

  const tanggalLabel = `${formatDateID(record.date)}  /  ${SHIFT_TIME_LABELS[record.shift_type] ?? record.shift_type}`;

  // Partition: section A sub-sections (codes 1/2/3) and environment (code 4).
  // The paper form uses "A. PERALATAN" as the umbrella header for sections 1-3,
  // then "B. LINGKUNGAN KERJA" as its own block.
  const peralatanSections = record.sections_meta.filter((s) => s.code === '1' || s.code === '2' || s.code === '3');
  const envSection = record.sections_meta.find((s) => s.code === '4');

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
        .gc-paper { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #000; }
        .gc-table { border-collapse: collapse; width: 100%; }
        .gc-table th, .gc-table td { border: 1px solid #000; padding: 1.5px 3px; vertical-align: middle; }
        .gc-section-bar {
          background-color: #d1d5db !important;
          font-weight: 700; padding: 3px 6px !important;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .gc-group-bar {
          background-color: #e5e7eb !important;
          font-weight: 700; padding: 2px 4px !important;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .gc-meta td { border: 0; padding: 0; vertical-align: top; }
      `}</style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/cnsd/vccs-meter/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      <div
        className="gc-paper mx-auto bg-white print:mx-0 print:w-full print:max-w-none"
        style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}
      >
        {/* Kop */}
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
              <div className="text-[8px] font-semibold uppercase">FAS CNS &amp; OTOMASI</div>
            </div>
          </div>
          <div className="text-right leading-tight text-[9px]">
            <div className="font-bold text-[10px]">Perum LPPNPI</div>
            <div>KANTOR CABANG SURABAYA</div>
            <div>Telp (031) 8688456 Fax. (031) 8688536</div>
            <div>email : sub@airnavindonesia.co.id</div>
            <div>Web : www.airnavindonesia.co.id</div>
          </div>
        </div>

        {/* Title band */}
        <table className="gc-table mb-0">
          <colgroup>
            <col style={{ width: '36%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center font-bold text-[14px] py-1">METER READING</td>
            </tr>
            <tr>
              <td rowSpan={2} className="align-top leading-tight">
                <table className="gc-meta">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '60px' }}>LOKASI</td>
                      <td className="px-0.5">:</td>
                      <td className="uppercase">{text(record.location)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TGL / JAM</td>
                      <td className="px-0.5">:</td>
                      <td>{tanggalLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td rowSpan={2} className="gc-section-bar text-center font-bold uppercase text-[12px]">
                VCCS
              </td>
              <td className="align-top leading-tight">
                <table className="gc-meta text-[10px]">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '40px' }}>MERK</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.merk) || 'LES'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TYPE</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.type) || ''}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">S N</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.serial_number) || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td className="text-center font-semibold text-[9px] leading-tight">
                COMMUNICATION NAVIGATION SURVEILLANCE AND DATA PROCESSING
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items table — 6 cols */}
        <table className="gc-table">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <tr className="text-center font-bold gc-section-bar">
              <th className="border border-black py-1">NO</th>
              <th className="border border-black py-1">PEMBACAAN METER READING</th>
              <th className="border border-black py-1">NOMINAL</th>
              <th colSpan={2} className="border border-black py-1">HASIL PEMERIKSAAN</th>
              <th className="border border-black py-1">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {/* A. PERALATAN umbrella bar */}
            {peralatanSections.length > 0 && (
              <tr>
                <td colSpan={6} className="gc-section-bar font-bold uppercase">
                  A.&nbsp;&nbsp;PERALATAN
                </td>
              </tr>
            )}
            {peralatanSections.map((meta) => (
              <PrintSectionBlock
                key={meta.code}
                meta={meta}
                items={itemsBySection[meta.code] ?? []}
              />
            ))}

            {/* B. LINGKUNGAN KERJA */}
            {envSection && (
              <PrintSectionBlock
                meta={{ ...envSection, code: 'B' }}
                items={itemsBySection[envSection.code] ?? []}
              />
            )}
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
                        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>—</td>
                      </tr>
                    )}
                    {record.technicians.length > 0 && record.technicians.length < 4 && (
                      Array.from({ length: 4 - record.technicians.length }).map((_, i) => (
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

              <td className="text-center align-top" style={{ minHeight: '120px' }}>
                <div style={{ minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {record.supervisor?.signature ? (
                    <img src={record.supervisor.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">
                  {text(record.supervisor?.name) || '—'}
                </div>
              </td>

              <td className="text-center align-top" style={{ minHeight: '120px' }}>
                <div style={{ minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {record.manager?.signature ? (
                    <img src={record.manager.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">
                  {text(record.manager?.name) || '—'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
