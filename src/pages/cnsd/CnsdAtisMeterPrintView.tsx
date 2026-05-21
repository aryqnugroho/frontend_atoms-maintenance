import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdAtisMeterService } from '@/services/cnsdAtisMeterService';
import type {
  CnsdAtisMeterItem,
  CnsdAtisMeterRecordDetail,
} from '@/types/cnsdAtis';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const formatDateID = (v?: string | null): string => {
  if (!v) return '';
  try { return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return v; }
};

const text = (v: string | null | undefined): string => v == null || v === '' ? '' : String(v);

interface SectionMeta {
  code: string;
  name: string;
  inputs_layout: string;
  groups: Array<{ number: number | null; name: string | null }>;
}

interface PrintBlockProps {
  meta: SectionMeta;
  items: CnsdAtisMeterItem[];
}

const PrintBlock: React.FC<PrintBlockProps> = ({ meta, items }) => {
  const totalCols = 5;

  const groups: { number: number | null; name: string | null; items: CnsdAtisMeterItem[] }[] = [];
  items.forEach((it) => {
    if (it.is_header) return;
    const key = `${it.group_number ?? '0'}::${it.group_name ?? ''}`;
    const last = groups[groups.length - 1];
    const lastKey = last ? `${last.number ?? '0'}::${last.name ?? ''}` : null;
    if (lastKey === key && last) last.items.push(it);
    else groups.push({ number: it.group_number ?? null, name: it.group_name ?? null, items: [it] });
  });

  return (
    <>
      <tr>
        <td className="gc-section-bar text-center" style={{ verticalAlign: 'middle' }}>{meta.code}</td>
        <td colSpan={totalCols - 1} className="gc-section-bar font-bold uppercase">{meta.name}</td>
      </tr>
      {groups.map((group, gIdx) => (
        <React.Fragment key={`${meta.code}-grp-${gIdx}`}>
          <tr>
            <td className="text-center font-bold gc-group-bar">{group.number ?? ''}</td>
            <td colSpan={totalCols - 1} className="gc-group-bar font-bold uppercase">{group.name}</td>
          </tr>
          {group.items.map((item, idx) => (
            <tr key={item.id} className="text-[10px]">
              <td className="text-center">{idx + 1}.</td>
              <td className="pl-2">- {item.item_name}</td>
              <td className="text-center">{text(item.nominal)}</td>
              <td className="text-center">{text(item.reading)}</td>
              <td>{text(item.keterangan)}</td>
            </tr>
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * CNSD ATIS Meter Reading Print View — A4 portrait, B&W. Mirrors paper 013_ATIS.
 */
export const CnsdAtisMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdAtisMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try { setRecord(await cnsdAtisMeterService.getRecord(Number(id))); }
      catch { setRecord(null); }
      finally { setIsLoading(false); }
    };
    void fetchRecord();
  }, [id]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdAtisMeterItem[]> = {};
    record?.items.forEach((it) => {
      const code = it.section_code ?? 'A';
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
        <Button variant="outline" onClick={() => navigate('/cnsd/atis-meter')}>Kembali</Button>
      </div>
    );
  }

  const tanggalLabel = `${formatDateID(record.date)}  /  ${SHIFT_TIME_LABELS[record.shift_type] ?? record.shift_type}`;

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
        .gc-section-bar { background-color: #d1d5db !important; font-weight: 700; padding: 3px 6px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .gc-group-bar { background-color: #e5e7eb !important; font-weight: 700; padding: 2px 4px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .gc-meta td { border: 0; padding: 0; vertical-align: top; }
      `}</style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/cnsd/atis-meter/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      <div className="gc-paper mx-auto bg-white print:mx-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <img src="/assets/icon/logoairnav.svg" alt="AirNav Indonesia" style={{ height: '38px', width: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
          </div>
        </div>

        <table className="gc-table mb-0">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '26%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center font-bold text-[14px] py-1">METER READING</td>
            </tr>
            <tr>
              <td className="align-top leading-tight">
                <table className="gc-meta">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '60px' }}>LOKASI</td>
                      <td className="px-0.5">:</td>
                      <td className="uppercase">{text(record.location)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TGL/JAM</td>
                      <td className="px-0.5">:</td>
                      <td>{tanggalLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="gc-section-bar text-center font-bold uppercase text-[12px]">REPRODUCER ATIS</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td colSpan={3} className="align-top leading-tight">
                <table className="gc-meta text-[10px]" style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '40px' }}>MERK</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.merk) || 'TERMA'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TYPE</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.type) || '-'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">S N</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.serial_number) || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="gc-table">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr className="text-center font-bold gc-section-bar">
              <th className="border border-black py-1">NO</th>
              <th className="border border-black py-1">PEMERIKSAAN</th>
              <th className="border border-black py-1">NOMINAL</th>
              <th className="border border-black py-1">READING</th>
              <th className="border border-black py-1">KETERANGAN</th>
            </tr>
            <tr className="text-center font-bold text-[9px]" style={{ backgroundColor: '#e5e7eb' }}>
              <th className="border border-black">1</th>
              <th className="border border-black">2</th>
              <th className="border border-black">3</th>
              <th className="border border-black">4</th>
              <th className="border border-black">5</th>
            </tr>
          </thead>
          <tbody>
            {record.sections_meta.map((meta) => (
              <PrintBlock key={meta.code} meta={meta} items={itemsBySection[meta.code] ?? []} />
            ))}
          </tbody>
        </table>

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
                          {t.signature ? (<img src={t.signature} alt="ttd" style={{ maxHeight: '20px', display: 'inline-block' }} />) : ''}
                        </td>
                      </tr>
                    ))}
                    {record.technicians.length === 0 && (
                      <tr><td colSpan={3} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>—</td></tr>
                    )}
                    {record.technicians.length > 0 && record.technicians.length < 5 && (
                      Array.from({ length: 5 - record.technicians.length }).map((_, i) => (
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
                  {record.supervisor?.signature ? (<img src={record.supervisor.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />) : (<span>&nbsp;</span>)}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">{text(record.supervisor?.name) || '—'}</div>
              </td>

              <td className="text-center align-top" style={{ minHeight: '120px' }}>
                <div style={{ minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {record.manager?.signature ? (<img src={record.manager.signature} alt="ttd" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />) : (<span>&nbsp;</span>)}
                </div>
                <div className="font-semibold uppercase border-t border-black pt-1 px-1">{text(record.manager?.name) || '—'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
