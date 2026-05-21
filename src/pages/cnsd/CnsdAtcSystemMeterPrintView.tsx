import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdAtcSystemMeterService } from '@/services/cnsdAtcSystemMeterService';
import type {
  CnsdAtcSystemMeterItem,
  CnsdAtcSystemMeterRecordDetail,
} from '@/types/cnsdAtcSystem';

const SHIFT_TIME_LABELS: Record<string, string> = {
  pagi:  '07:00 — 13:00',
  siang: '13:00 — 19:00',
  malam: '19:00 — 07:00',
};

const CPU_STATUS_FLAGS = ['C', 'M', 'F', 'O', 'A', 'N', 'L'] as const;

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

/** CPU STATUS flags renderer — show all 7 letters; bold the ones in status_flags */
const renderCpuStatusCell = (flags: string | null): React.ReactElement => {
  const active = new Set((flags || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
      {CPU_STATUS_FLAGS.map((f) => (
        <span key={f} style={{
          fontWeight: active.has(f) ? 700 : 400,
          color: active.has(f) ? '#000' : '#9ca3af',
        }}>{f}</span>
      ))}
    </span>
  );
};

interface SectionBlockProps {
  meta: SectionMeta;
  items: CnsdAtcSystemMeterItem[];
}

const PrintSectionBlock: React.FC<SectionBlockProps> = ({ meta, items }) => {
  const layout = meta.inputs_layout;
  let rowIdx = 0;

  const header = (() => {
    switch (layout) {
      case 'maintenance':
        return (<tr><th colSpan={5} style={{ border: '1px solid #000', padding: '2px 6px', backgroundColor: '#d1d5db', fontWeight: 700, fontSize: '10px', textAlign: 'left' }}>{meta.code}. {meta.name}</th></tr>);
      case 'source_data':
      case 'cpu_status':
      case 'network_status':
      case 'server_dual_ab':
      case 'environment':
        return (<tr><th colSpan={layoutColumnCount(layout)} style={{ border: '1px solid #000', padding: '2px 6px', backgroundColor: '#d1d5db', fontWeight: 700, fontSize: '10px', textAlign: 'left' }}>{meta.code}. {meta.name}</th></tr>);
      case 'rbp_count':
        return (<tr><th colSpan={7} style={{ border: '1px solid #000', padding: '2px 6px', backgroundColor: '#d1d5db', fontWeight: 700, fontSize: '10px', textAlign: 'left' }}>{meta.code}. {meta.name}</th></tr>);
      default:
        return (<tr><th colSpan={5} style={{ border: '1px solid #000', padding: '2px 6px', backgroundColor: '#d1d5db', fontWeight: 700, fontSize: '10px', textAlign: 'left' }}>{meta.code}. {meta.name}</th></tr>);
    }
  })();

  const subHeader = (() => {
    const th = (label: string) =>
      <th style={{ border: '1px solid #000', padding: '2px 4px', backgroundColor: '#e5e7eb', fontWeight: 700, fontSize: '8.5px', textAlign: 'center' }}>{label}</th>;
    switch (layout) {
      case 'maintenance':
        return (<tr>{th('NO')}{th('PEMERIKSAAN')}{th('NOMINAL')}{th('READING')}{th('KETERANGAN')}</tr>);
      case 'source_data':
        return (<tr>{th('NO')}{th('ITEM')}{th('LINE 1')}{th('LINE 2')}{th('KETERANGAN')}</tr>);
      case 'cpu_status':
        return (<tr>{th('NO')}{th('ITEM')}{th('NOMINAL')}{th('PROC RUN')}{th('CPU STATUS (C M F O A N L)')}{th('KETERANGAN')}</tr>);
      case 'network_status':
        return (<tr>{th('NO')}{th('ITEM')}{th('SW STATUS')}{th('ALL PORT OK')}{th('KETERANGAN')}</tr>);
      case 'server_dual_ab':
        return (<tr>{th('NO')}{th('PEMERIKSAAN')}{th('NOMINAL')}{th('REC A')}{th('REC B')}{th('KETERANGAN')}</tr>);
      case 'rbp_count':
        return (<tr>{th('NO')}{th('KEGIATAN')}{th('RBP-A C(*)1')}{th('RBP-A C(*)2')}{th('RBP-B C(*)1')}{th('RBP-B C(*)2')}{th('KETERANGAN')}</tr>);
      case 'environment':
        return (<tr>{th('NO')}{th('KEGIATAN')}{th('PARAMETER')}{th('HASIL')}{th('KETERANGAN')}</tr>);
      default:
        return null;
    }
  })();

  const td = (children: React.ReactNode, extra: React.CSSProperties = {}) =>
    <td style={{ border: '1px solid #000', padding: '1.5px 4px', fontSize: '9.5px', verticalAlign: 'middle', ...extra }}>{children}</td>;

  const renderRow = (item: CnsdAtcSystemMeterItem, no: number): React.ReactElement | null => {
    if (item.is_header) {
      return (
        <tr key={item.id}>
          <td colSpan={layoutColumnCount(layout)} style={{ border: '1px solid #000', padding: '2px 6px', backgroundColor: '#f3f4f6', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
            {item.item_name}
          </td>
        </tr>
      );
    }
    const itemLabel = item.sub_item_label
      ? <span style={{ paddingLeft: '12px' }}>- {item.sub_item_label}</span>
      : <span>{item.item_name}</span>;

    switch (layout) {
      case 'maintenance':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '40%' })}
            {td(text(item.nominal), { textAlign: 'center', width: '15%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '18%' })}
            {td(text(item.keterangan), { width: '22%' })}
          </tr>
        );
      case 'source_data':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '30%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '15%', fontWeight: 700 })}
            {td(text(item.value_2), { textAlign: 'center', width: '15%', fontWeight: 700 })}
            {td(text(item.keterangan), { width: '35%' })}
          </tr>
        );
      case 'cpu_status':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '22%' })}
            {td(text(item.nominal), { textAlign: 'center', width: '10%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '12%' })}
            {td(renderCpuStatusCell(item.status_flags), { textAlign: 'center', width: '23%' })}
            {td(text(item.keterangan), { width: '28%' })}
          </tr>
        );
      case 'network_status':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '25%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '15%', fontWeight: 700 })}
            {td(text(item.value_2), { textAlign: 'center', width: '15%', fontWeight: 700 })}
            {td(text(item.keterangan), { width: '40%' })}
          </tr>
        );
      case 'server_dual_ab':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '38%' })}
            {td(text(item.nominal), { textAlign: 'center', width: '12%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '15%' })}
            {td(text(item.value_2), { textAlign: 'center', width: '15%' })}
            {td(text(item.keterangan), { width: '15%' })}
          </tr>
        );
      case 'rbp_count':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '25%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '12%' })}
            {td(text(item.value_2), { textAlign: 'center', width: '12%' })}
            {td(text(item.value_3), { textAlign: 'center', width: '12%' })}
            {td(text(item.value_4), { textAlign: 'center', width: '12%' })}
            {td(text(item.keterangan), { width: '22%' })}
          </tr>
        );
      case 'environment':
        return (
          <tr key={item.id}>
            {td(no, { textAlign: 'center', width: '5%' })}
            {td(itemLabel, { width: '38%' })}
            {td(text(item.nominal), { textAlign: 'center', width: '15%' })}
            {td(text(item.value_1), { textAlign: 'center', width: '20%' })}
            {td(text(item.keterangan), { width: '22%' })}
          </tr>
        );
      default:
        return null;
    }
  };

  return (
    <table className="gc-table" style={{ marginBottom: '0', borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        {header}
        {subHeader}
      </thead>
      <tbody>
        {items.map((item) => {
          if (!item.is_header) rowIdx++;
          return renderRow(item, rowIdx);
        })}
      </tbody>
    </table>
  );
};

const layoutColumnCount = (layout: string): number => {
  switch (layout) {
    case 'maintenance':    return 5;
    case 'source_data':    return 5;
    case 'cpu_status':     return 6;
    case 'network_status': return 5;
    case 'server_dual_ab': return 6;
    case 'rbp_count':      return 7;
    case 'environment':    return 5;
    default:               return 5;
  }
};

export const CnsdAtcSystemMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdAtcSystemMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try { setRecord(await cnsdAtcSystemMeterService.getRecord(Number(id))); }
      catch { setRecord(null); }
      finally { setIsLoading(false); }
    };
    void fetchRecord();
  }, [id]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, CnsdAtcSystemMeterItem[]> = {};
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
        <Button variant="outline" onClick={() => navigate('/cnsd/atc-system-meter')}>Kembali</Button>
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
          table.gc-table { page-break-inside: auto; }
        }
        .gc-paper { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #000; }
        .gc-table { border-collapse: collapse; width: 100%; }
        .gc-table th, .gc-table td { border: 1px solid #000; padding: 1.5px 4px; vertical-align: middle; }
        .gc-section-bar { background-color: #d1d5db !important; font-weight: 700; padding: 3px 6px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .gc-meta td { border: 0; padding: 0; vertical-align: top; }
      `}</style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/cnsd/atc-system-meter/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      <div className="gc-paper mx-auto bg-white print:mx-0 print:w-full print:max-w-none" style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}>
        {/* KOP BAND */}
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

        {/* TITLE + META */}
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
              <td className="gc-section-bar text-center font-bold uppercase text-[12px]">
                ATC SYSTEM
                <div className="text-[8.5px] font-semibold mt-0.5">APPROACH SYSTEM / TERN ATS SYSTEM</div>
              </td>
              <td className="align-top leading-tight">
                <table className="gc-meta">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-1" style={{ width: '40px' }}>MERK</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.merk) || 'TERA'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">TYPE</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.type) || 'TAS'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-1">S/N</td>
                      <td className="px-0.5">:</td>
                      <td>{text(record.serial_number) || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* SECTIONS — one <table> per section */}
        <div style={{ marginTop: '3px' }}>
          {record.sections_meta.map((meta) => (
            <PrintSectionBlock key={meta.code} meta={meta} items={itemsBySection[meta.code] ?? []} />
          ))}
          {/* RBP COUNT footer note */}
          <div style={{ fontSize: '8.5px', padding: '2px 4px', fontStyle: 'italic' }}>
            * COUNT(*) 1 : Jumlah data yang terbaca &nbsp;·&nbsp; * COUNT(*) 2 : Jumlah data yang terbaca sebelum di hapus
          </div>
        </div>

        {/* FOOTER — TEKNISI / SUPERVISOR / MANAGER */}
        <table className="gc-table" style={{ marginTop: '3px' }}>
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

        {/* FORM CODE footer */}
        <div style={{ marginTop: '4px', textAlign: 'right', fontSize: '8.5px', fontWeight: 700 }}>
          {text(record.form_code) || 'FORM A-1'}
        </div>
      </div>
    </div>
  );
};
