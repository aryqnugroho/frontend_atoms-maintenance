import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { logbookTfpService } from '@/services/logbookTfpService';
import type { LogbookTfpDetail, LogbookTfpItem, PersonnelShiftInfo } from '@/types/logbookTfp';

// ─── Helpers ──────────────────────────────────────────────
const getYear = (dateStr: string): string => {
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return '';
  }
};

/**
 * LogbookTfpPrintView — print layout yang mengikuti form fisik resmi
 * "LOG BOOK FASILITAS PENUNJANG" Perum LPPNPI Kantor Cabang Surabaya.
 *
 * Layout:
 *   - Kop: AirNav logo + PERUM LPPNPI KANTOR CABANG - SURABAYA
 *   - Judul: LOG BOOK FASILITAS PENUNJANG
 *   - Tabel utama: NO | KEGIATAN | S | U/S | S | U/S | S | U/S | CATATAN | PARAF
 *   - Footer: Keterangan, Personil On Duty (3 shift × 4 rows), Manager Teknik TTD (3 shift)
 *
 * Print manual only — tidak auto-print saat page dibuka.
 */
export const LogbookTfpPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LogbookTfpDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await logbookTfpService.getLogbook(Number(id));
        setRecord(data);
      } catch {
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetch();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Logbook tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate('/logbooks/tfp')}>Kembali</Button>
      </div>
    );
  }

  // Flatten all items with category grouping and numbering
  const categories = Object.keys(record.items_by_category);
  let globalNo = 0;

  // Build structured rows for the table
  interface PrintRow {
    type: 'category-header' | 'sub-category-header' | 'item';
    label: string;
    no?: number;
    item?: LogbookTfpItem;
  }

  const rows: PrintRow[] = [];
  let subCatIndex = 0;

  categories.forEach((cat, catIdx) => {
    const items = record.items_by_category[cat];
    if (catIdx === 0) {
      // First category: "A | POWER CNS & OTOMASI"
      rows.push({ type: 'category-header', label: `A    ${cat}` });
    } else {
      if (catIdx === 1) {
        // Start of "B | PERALATAN" section
        rows.push({ type: 'category-header', label: 'B    PERALATAN' });
      }
      subCatIndex++;
      rows.push({ type: 'sub-category-header', label: `${subCatIndex}    ${cat}` });
    }

    items.forEach((item) => {
      globalNo++;
      rows.push({ type: 'item', label: item.equipment_name, no: globalNo, item });
    });
  });

  // Personnel helpers
  const getPersonnelList = (info: PersonnelShiftInfo | undefined): string[] => {
    if (!info || !info.roster_available) return [];
    const list: string[] = [];
    if (info.supervisor) list.push(info.supervisor.name);
    info.technicians.forEach((t) => list.push(t.name));
    return list;
  };

  const getManagerName = (info: PersonnelShiftInfo | undefined): string => {
    if (!info || !info.roster_available || !info.manager) return '';
    return info.manager.name;
  };

  const personnelPagi = getPersonnelList(record.personnel_on_duty?.pagi);
  const personnelSiang = getPersonnelList(record.personnel_on_duty?.siang);
  const personnelMalam = getPersonnelList(record.personnel_on_duty?.malam);
  const managerPagi = getManagerName(record.personnel_on_duty?.pagi);
  const managerSiang = getManagerName(record.personnel_on_duty?.siang);
  const managerMalam = getManagerName(record.personnel_on_duty?.malam);

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 6mm 8mm; }
            body { background: white !important; }
            .print-hide { display: none !important; }
            tr, td { page-break-inside: avoid; }
          }
        `}
      </style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/logbooks/tfp/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 Paper */}
      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[10px] leading-tight print:mx-0 print:w-full print:max-w-none print:border-0">

        {/* ═══ KOP ═══ */}
        <div className="flex items-center border-b border-black px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="text-[9px] leading-tight">
              <p className="font-semibold">AirNav Indonesia</p>
            </div>
          </div>
          <div className="text-center flex-1">
            <p className="text-[13px] font-black">PERUM LPPNPI</p>
            <p className="text-[11px] font-bold">KANTOR CABANG - SURABAYA</p>
          </div>
          <div className="flex-1" />
        </div>

        {/* ═══ JUDUL ═══ */}
        <div className="border-b border-black py-2 text-center">
          <p className="text-[13px] font-black tracking-wide">LOG BOOK FASILITAS PENUNJANG</p>
        </div>

        {/* ═══ TABLE HEADER ═══ */}
        <table className="w-full border-collapse">
          <thead>
            {/* Row 1: NAMA PERALATAN | CATATAN | PARAF */}
            <tr>
              <td colSpan={8} className="border border-black px-2 py-1 text-center font-bold text-[9px]">
                NAMA PERALATAN
              </td>
              <td rowSpan={4} className="border border-black px-2 py-1 text-center font-bold text-[9px] w-[25%] align-top">
                CATATAN
              </td>
              <td rowSpan={4} className="border border-black px-2 py-1 text-center font-bold text-[9px] w-[8%] align-top">
                PARAF
              </td>
            </tr>
            {/* Row 2: Tanggal + shift times */}
            <tr>
              <td colSpan={2} className="border border-black px-2 py-1 text-[9px]">
                <span>Tanggal : </span>
                <span className="ml-4">{getYear(record.date)}</span>
              </td>
              <td colSpan={2} className="border border-black px-1 py-1 text-center text-[8px] font-semibold">
                PAGI<br />07.00-13.00
              </td>
              <td colSpan={2} className="border border-black px-1 py-1 text-center text-[8px] font-semibold">
                SIANG<br />13.00-19.00
              </td>
              <td colSpan={2} className="border border-black px-1 py-1 text-center text-[8px] font-semibold">
                MALAM<br />19.00-07.00
              </td>
            </tr>
            {/* Row 3: KEGIATAN + STATUS PERALATAN */}
            <tr>
              <td rowSpan={2} className="border border-black px-1 py-1 text-center text-[8px] font-bold w-[4%]">
                NO
              </td>
              <td className="border border-black px-2 py-1 text-[8px] font-bold">
                KEGIATAN
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 text-center text-[8px] font-bold">
                STATUS PERALATAN
              </td>
            </tr>
            {/* Row 4: SHIFT + S/U/S columns */}
            <tr>
              <td className="border border-black px-2 py-1 text-[8px] font-bold">
                SHIFT
              </td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">S</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">U/S</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">S</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">U/S</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">S</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-bold w-[4%]">U/S</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              if (row.type === 'category-header') {
                return (
                  <tr key={`cat-${idx}`}>
                    <td className="border border-black px-1 py-0.5 text-center font-bold text-[9px]" />
                    <td colSpan={7} className="border border-black px-2 py-1 font-bold text-[9px]">
                      {row.label}
                    </td>
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                );
              }
              if (row.type === 'sub-category-header') {
                return (
                  <tr key={`sub-${idx}`}>
                    <td className="border border-black px-1 py-0.5 text-center text-[9px]" />
                    <td colSpan={7} className="border border-black px-2 py-0.5 font-bold text-[9px]">
                      {row.label}
                    </td>
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                );
              }
              // item row
              const item = row.item!;
              return (
                <tr key={`item-${item.id}`}>
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">{row.no}</td>
                  <td className="border border-black px-2 py-0.5 text-[9px]">{item.equipment_name}</td>
                  {/* Pagi S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_pagi === 'S' ? '✓' : ''}
                  </td>
                  {/* Pagi U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_pagi === 'US' ? '✓' : ''}
                  </td>
                  {/* Siang S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_siang === 'S' ? '✓' : ''}
                  </td>
                  {/* Siang U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_siang === 'US' ? '✓' : ''}
                  </td>
                  {/* Malam S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_malam === 'S' ? '✓' : ''}
                  </td>
                  {/* Malam U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {item.status_malam === 'US' ? '✓' : ''}
                  </td>
                  {/* Catatan — empty for now */}
                  <td className="border border-black px-1 py-0.5 text-[9px]" />
                  {/* Paraf — empty */}
                  <td className="border border-black px-1 py-0.5" />
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ═══ KETERANGAN ═══ */}
        <div className="border-t-2 border-black px-4 py-2 text-[9px]">
          <p><span className="font-bold">Keterangan :</span></p>
          <p className="ml-8"><span className="font-bold">S</span>    : Seviceable</p>
          <p className="ml-8"><span className="font-bold">U/S</span> : Unserviceable</p>
        </div>

        {/* ═══ PERSONIL ON DUTY ═══ */}
        <div className="border-t border-black">
          <div className="text-center py-1 text-[9px] font-bold border-b border-black">
            Personil On Duty
          </div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <td className="border border-black px-2 py-1 font-bold w-1/3">Duty Pagi</td>
                <td className="border border-black px-2 py-1 font-bold w-1/3">Duty Siang</td>
                <td className="border border-black px-2 py-1 font-bold w-1/3">Duty Malam</td>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1 h-5">
                    {personnelPagi[i] ? `${i + 1}. ${personnelPagi[i]}` : `${i + 1}.`}
                  </td>
                  <td className="border border-black px-2 py-1 h-5">
                    {personnelSiang[i] ? `${i + 1}. ${personnelSiang[i]}` : `${i + 1}.`}
                  </td>
                  <td className="border border-black px-2 py-1 h-5">
                    {personnelMalam[i] ? `${i + 1}. ${personnelMalam[i]}` : `${i + 1}.`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══ CATATAN KEGIATAN ═══ */}
        {record.notes.length > 0 && (
          <div className="border-t border-black">
            <div className="text-center py-1 text-[9px] font-bold border-b border-black">
              Catatan Kegiatan
            </div>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold w-[12%] text-center">SHIFT</td>
                  <td className="border border-black px-2 py-1 font-bold w-[10%] text-center">JAM</td>
                  <td className="border border-black px-2 py-1 font-bold">KEGIATAN / CATATAN</td>
                </tr>
              </thead>
              <tbody>
                {(['pagi', 'siang', 'malam'] as const).flatMap((shift) => {
                  const notes = record.notes.filter((n) => n.shift === shift);
                  if (notes.length === 0) return [];
                  return notes.map((note, idx) => (
                    <tr key={note.id}>
                      {idx === 0 && (
                        <td rowSpan={notes.length} className="border border-black px-2 py-1 font-semibold text-center align-middle uppercase">
                          {shift}
                        </td>
                      )}
                      <td className="border border-black px-2 py-1 font-mono text-center align-top">{note.time ?? ''}</td>
                      <td className="border border-black px-2 py-1 align-top">{note.activity}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ MANAGER TEKNIK TTD — per shift ═══ */}
        <div className="border-t border-black">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <td className="border border-black px-2 py-1 font-bold w-1/2">MANAGER TEKNIK</td>
                <td className="border border-black px-2 py-1 font-bold text-center w-1/2">TTD</td>
              </tr>
            </thead>
            <tbody>
              {/* Duty Pagi */}
              <tr>
                <td className="border border-black px-2 py-2 h-10">
                  1. Duty Pagi : <span className="font-medium">{record.manager_signatures.pagi.signed_by_name || managerPagi || ''}</span>
                </td>
                <td className="border border-black px-2 py-2 h-10 text-center align-middle">
                  {record.manager_signatures.pagi.signature ? (
                    <img src={record.manager_signatures.pagi.signature} alt="TTD Manager Pagi" className="mx-auto max-h-8 max-w-[100px] object-contain" />
                  ) : ''}
                </td>
              </tr>
              {/* Duty Siang */}
              <tr>
                <td className="border border-black px-2 py-2 h-10">
                  2. Duty Siang : <span className="font-medium">{record.manager_signatures.siang.signed_by_name || managerSiang || ''}</span>
                </td>
                <td className="border border-black px-2 py-2 h-10 text-center align-middle">
                  {record.manager_signatures.siang.signature ? (
                    <img src={record.manager_signatures.siang.signature} alt="TTD Manager Siang" className="mx-auto max-h-8 max-w-[100px] object-contain" />
                  ) : ''}
                </td>
              </tr>
              {/* Duty Malam */}
              <tr>
                <td className="border border-black px-2 py-2 h-10">
                  3. Duty Malam : <span className="font-medium">{record.manager_signatures.malam.signed_by_name || managerMalam || ''}</span>
                </td>
                <td className="border border-black px-2 py-2 h-10 text-center align-middle">
                  {record.manager_signatures.malam.signature ? (
                    <img src={record.manager_signatures.malam.signature} alt="TTD Manager Malam" className="mx-auto max-h-8 max-w-[100px] object-contain" />
                  ) : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
