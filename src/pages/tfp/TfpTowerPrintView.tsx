import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpTowerService } from '@/services/tfpTowerService';
import type { TfpTowerRecordDetail, TfpTowerItem, TfpTowerFacility } from '@/types/tfpTower';

type ItemColKey =
  | 'panel_a10' | 'panel_a11'
  | 'panel_ats_a13_input' | 'panel_ats_a13_output'
  | 'panel_a14' | 'panel_a16' | 'panel_a17' | 'panel_a18' | 'panel_a19' | 'panel_a20'
  | 'panel_milat_ru1213';

const ALL_COL_KEYS: ItemColKey[] = [
  'panel_a10', 'panel_a11',
  'panel_ats_a13_input', 'panel_ats_a13_output',
  'panel_a14', 'panel_a16', 'panel_a17', 'panel_a18', 'panel_a19', 'panel_a20',
  'panel_milat_ru1213',
];

const isDisabled = (item: TfpTowerItem, colKey: ItemColKey): boolean =>
  item.is_disabled_map?.[colKey] === true;

const isModeRow = (item: TfpTowerItem): boolean => item.parameter_name.toLowerCase().startsWith('mode');
const isSuplaiRow = (item: TfpTowerItem): boolean => item.parameter_name.toLowerCase().startsWith('suplai aktif');
const isKwhRow = (item: TfpTowerItem): boolean => item.parameter_name.toLowerCase().startsWith('kwh');
const isSuhuRow = (item: TfpTowerItem): boolean => {
  const n = item.parameter_name.toLowerCase();
  return n.startsWith('suhu tower') || n.startsWith('suhu ruang rx') || n.startsWith('suhu cabin');
};

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '' : v);

const renderPrintCell = (item: TfpTowerItem, colKey: ItemColKey): React.ReactElement => {
  if (isDisabled(item, colKey)) return <td className="border border-black bg-gray-300 px-1 py-1" />;

  if (isModeRow(item)) {
    if (colKey === 'panel_ats_a13_input') return <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{val(item.panel_ats_a13_input) || 'Auto / Manual'}</td>;
    if (colKey === 'panel_ats_a13_output') return <td className="border border-black bg-gray-300 px-1 py-1" />;
    return <td className="border border-black px-1 py-1 text-center text-[10px]">{val(item[colKey] as string | null)}</td>;
  }

  if (isSuplaiRow(item)) {
    if (colKey === 'panel_ats_a13_input') return <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{val(item.panel_ats_a13_input) || 'PLN 1 / PLN 2'}</td>;
    if (colKey === 'panel_ats_a13_output') return <td className="border border-black bg-gray-300 px-1 py-1" />;
    return <td className="border border-black px-1 py-1 text-center text-[10px]">{val(item[colKey] as string | null)}</td>;
  }

  if (isKwhRow(item)) {
    if (colKey === 'panel_ats_a13_input') return <td className="border border-black px-1 py-1 text-center text-[10px]">{val(item.panel_ats_a13_input)}</td>;
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  if (isSuhuRow(item)) {
    if (colKey === 'panel_a10') return <td className="border border-black px-1 py-1 text-center text-[10px]">{val(item.panel_a10)}</td>;
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  return <td className="border border-black px-1 py-1 text-center text-[10px]">{val(item[colKey] as string | null)}</td>;
};

export const TfpTowerPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpTowerRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await tfpTowerService.getRecord(Number(id));
        if (!cancelled) setRecord(data);
      } catch { if (!cancelled) setRecord(null); }
      finally { if (!cancelled) setIsLoading(false); }
    };
    void fetchRecord();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!record) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-slate-600">Form tidak ditemukan atau gagal memuat data.</p>
      <Button variant="outline" onClick={() => navigate('/tfp/tower')}>Kembali</Button>
    </div>
  );

  const items = record.items;
  const facilities = record.facilities;
  const maxRows = Math.max(items.length, facilities.length);
  const padded: { item: TfpTowerItem | null; facility: TfpTowerFacility | null }[] = [];
  for (let i = 0; i < maxRows; i++) padded.push({ item: items[i] ?? null, facility: facilities[i] ?? null });

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm 8mm; } body { background: white !important; } .print-hide { display: none !important; } }`}</style>

      <div className="print-hide mx-auto mb-4 flex max-w-[290mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/tfp/tower/${record.id}`)}>
          <ArrowLeft size={16} />Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />Print PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[290mm] bg-white font-sans text-[10px] print:mx-0 print:w-full print:max-w-none">
        {/* Kop */}
        <div className="grid grid-cols-[40%_30%_30%] items-center mb-2 px-2 pt-3">
          <div className="flex items-center gap-2">
            <img src="/assets/icon/logoairnav.svg" alt="AirNav Indonesia" className="h-12 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="text-[14px] font-black leading-tight">AirNav Indonesia</div>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-black leading-tight">Performance Check Gedung Tower</div>
          </div>
          <div className="text-right text-[10px] font-bold leading-tight">
            <div>Perum LPPNPI</div><div>Cabang Surabaya</div><div>Teknik Fasilitas Penunjang</div>
          </div>
        </div>

        {/* Main table */}
        <table className="w-full border-collapse text-[9px] mx-auto" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20px' }} /><col style={{ width: '95px' }} />
            <col style={{ width: '30px' }} /><col style={{ width: '30px' }} />
            <col style={{ width: '28px' }} /><col style={{ width: '28px' }} />
            <col style={{ width: '30px' }} /><col style={{ width: '30px' }} />
            <col style={{ width: '30px' }} /><col style={{ width: '30px' }} />
            <col style={{ width: '32px' }} /><col style={{ width: '30px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '105px' }} /><col style={{ width: '42px' }} /><col style={{ width: '75px' }} />
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">No.</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Parameter</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 10 Tower Lt 11</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 11 Tower Lt 11</th>
              <th colSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[8px]">Panel ATS (A 13)</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 14 Tower Lt 11</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 16 ADC Room</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 17 Ruang Lift</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 18 Ruang RX</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 19 Roof Top Power</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel A 20 Power CCTV</th>
              <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-center font-bold text-[7px]">Panel MILAT RU 12 &amp; 13</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Nama Fasilitas</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Kondisi</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Keterangan</th>
            </tr>
            <tr className="bg-blue-50 italic">
              <th className="border border-black px-0.5 py-0.5 text-center font-semibold text-[8px]">Input</th>
              <th className="border border-black px-0.5 py-0.5 text-center font-semibold text-[8px]">Output</th>
            </tr>
          </thead>
          <tbody>
            {padded.map((row, idx) => {
              const item = row.item;
              const facility = row.facility;
              return (
                <tr key={`row-${idx}`}>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">{item ? idx + 1 : ''}</td>
                  <td className="border border-black px-1 py-1 text-[9px]">{item ? <>{item.parameter_name}{item.unit ? ` ( ${item.unit} )` : ''}</> : null}</td>
                  {item
                    ? ALL_COL_KEYS.map((colKey) => <React.Fragment key={`${item.id}-${colKey}`}>{renderPrintCell(item, colKey)}</React.Fragment>)
                    : Array.from({ length: 11 }).map((_, i) => <td key={`pad-${i}`} className="border border-black px-1 py-1" />)}
                  <td className="border border-black px-1 py-1 text-[9px]">{facility ? facility.facility_name : ''}</td>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">{facility?.kondisi ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-[9px]">{facility?.keterangan ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Waktu Pelaksanaan */}
        <table className="w-full border-collapse text-[9px] mt-0">
          <tbody>
            <tr className="bg-blue-100">
              <td className="border border-black px-2 py-1 text-center font-bold w-[14%]">Waktu Pelaksanaan</td>
              <td className="border border-black px-2 py-1 font-bold w-[6%]">Hari :</td>
              <td className="border border-black px-2 py-1 w-[14%]">{record.day_name ?? ''}</td>
              <td className="border border-black px-2 py-1 font-bold w-[8%]">Tanggal :</td>
              <td className="border border-black px-2 py-1 w-[16%]">{formatDate(record.date)}</td>
              <td className="border border-black px-2 py-1 font-bold w-[5%]">Jam :</td>
              <td className="border border-black px-2 py-1 w-[10%]">{record.time_filled ?? ''}</td>
              <td className="border border-black px-2 py-1 font-bold w-[5%]">WIB</td>
            </tr>
          </tbody>
        </table>

        {/* Signature footer */}
        <div className="mt-0 border border-black border-t-0">
          <div className="flex">
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">Teknisi</div>
              <table className="w-full border-collapse text-[9px]">
                <thead><tr className="bg-blue-100"><th className="border border-black px-1 py-1 w-7 text-center">No</th><th className="border border-black px-1 py-1 text-left">Nama</th><th className="border border-black px-1 py-1 w-24 text-center">Paraf</th></tr></thead>
                <tbody>
                  {record.technicians.length > 0 ? record.technicians.map((tech, idx) => (
                    <tr key={tech.id}>
                      <td className="border border-black px-1 py-1 text-center">{idx + 1}</td>
                      <td className="border border-black px-1 py-1">{tech.technician_name}</td>
                      <td className="border border-black px-1 py-1 text-center align-middle h-10">
                        {tech.signature ? <img src={tech.signature} alt={`TTD ${tech.technician_name}`} className="mx-auto max-h-9 max-w-[90px] object-contain" /> : <span className="text-[9px] text-gray-400 italic">Belum TTD</span>}
                      </td>
                    </tr>
                  )) : <tr><td colSpan={3} className="border border-black px-1 py-2 text-center text-gray-400">Tidak ada teknisi</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex w-[24%] flex-col items-center border-r border-black p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Supervisor</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor ? (record.supervisor.signature ? <img src={record.supervisor.signature} alt="TTD Supervisor" className="max-h-16 max-w-[130px] object-contain" /> : <div className="h-16 w-28 border border-dashed border-gray-400" />) : <span className="text-[9px] text-gray-400 italic">Tidak ada supervisor pada shift ini</span>}
              </div>
              <div className="mt-auto text-[10px] font-semibold">{record.supervisor?.name ?? '—'}</div>
            </div>
            <div className="flex w-[24%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (record.manager.signature ? <img src={record.manager.signature} alt="TTD Manager Teknik" className="max-h-16 max-w-[130px] object-contain" /> : <div className="h-16 w-28 border border-dashed border-gray-400" />) : <span className="text-[9px] text-gray-400 italic">Manager Teknik tidak ditugaskan</span>}
              </div>
              <div className="mt-auto text-[10px] font-semibold">{record.manager?.name ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="mt-1 flex justify-between text-[8px] text-slate-700 px-1 pb-3">
          <span>(*) Coret yang tidak perlu</span>
          <span>Kondisi : (√) Baik / Normal &nbsp;&nbsp; (x) Tidak Baik / Tidak Normal</span>
        </div>
      </div>
    </div>
  );
};
