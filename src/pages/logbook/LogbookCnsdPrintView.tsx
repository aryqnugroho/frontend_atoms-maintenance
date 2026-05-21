import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { logbookCnsdService } from '@/services/logbookCnsdService';
import type { LogbookCnsdDetail, LogbookCnsdItem, PersonnelShiftInfo } from '@/types/logbookCnsd';

// ─── Helpers ──────────────────────────────────────────────
const getYear = (dateStr: string): string => {
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return '';
  }
};

const formatDateShort = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Parse the category string into section letter + sub-section name.
 * Example: "A. COMUNICATION · VHF Main" → { letter: "A", sectionName: "COMUNICATION", subName: "VHF Main" }
 */
interface ParsedCategory {
  letter: string;        // "A", "B", "C", "D", "E"
  sectionName: string;   // "COMUNICATION", "NAVIGATION", ...
  subName: string | null;// "VHF Main" or null when no sub
}

const parseCategory = (category: string): ParsedCategory => {
  // Try "X. NAME · SUB"
  const m1 = category.match(/^([A-Z])\.\s*([^·]+?)(?:\s*·\s*(.+))?$/);
  if (m1) {
    return {
      letter: m1[1],
      sectionName: m1[2].trim(),
      subName: m1[3]?.trim() ?? null,
    };
  }
  return { letter: '', sectionName: category, subName: null };
};

/**
 * LogbookCnsdPrintView — print layout matching the official
 * "LOG BOOK CNS & AUTOMATION" form (Perum LPPNPI Surabaya).
 *
 * Layout:
 *   - Kop: AirNav logo + PERUM LPPNPI KANTOR CABANG - SURABAYA
 *   - Judul: LOG BOOK CNS & AUTOMATION
 *   - Tabel: NO | NAMA PERALATAN | S/US ×3 shift | CATATAN | PARAF
 *   - Section/sub-section header rows separate item rows
 *   - Temperature section: numeric values in lieu of S/US ticks
 *   - Footer: Keterangan, Personil On Duty (3 shift × 6 rows), Manager TTD (3 shift)
 */
export const LogbookCnsdPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LogbookCnsdDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await logbookCnsdService.getLogbook(Number(id));
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
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Logbook tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate('/logbooks/cnsd')}>Kembali</Button>
      </div>
    );
  }

  // Build structured rows for the table
  interface PrintRow {
    type: 'section-header' | 'sub-header' | 'item';
    label: string;
    letter?: string;
    subIndex?: number;
    no?: number;
    item?: LogbookCnsdItem;
  }

  const rows: PrintRow[] = [];
  const categories = Object.keys(record.items_by_category);

  let currentSection = '';
  let subIndex = 0;
  let globalNo = 0;

  categories.forEach((cat) => {
    const parsed = parseCategory(cat);
    const items = record.items_by_category[cat];

    // Emit section header row when section changes
    if (parsed.sectionName !== currentSection) {
      rows.push({
        type: 'section-header',
        label: parsed.sectionName,
        letter: parsed.letter,
      });
      currentSection = parsed.sectionName;
      subIndex = 0;
    }

    // Emit sub-section header if applicable
    if (parsed.subName) {
      subIndex++;
      rows.push({
        type: 'sub-header',
        label: parsed.subName,
        subIndex,
      });
    }

    // Emit item rows
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

  const personnelPagi  = getPersonnelList(record.personnel_on_duty?.pagi);
  const personnelSiang = getPersonnelList(record.personnel_on_duty?.siang);
  const personnelMalam = getPersonnelList(record.personnel_on_duty?.malam);
  const managerPagi    = getManagerName(record.personnel_on_duty?.pagi);
  const managerSiang   = getManagerName(record.personnel_on_duty?.siang);
  const managerMalam   = getManagerName(record.personnel_on_duty?.malam);

  // Render a single cell for status (S/US tick) or measurement value
  const renderCellValue = (item: LogbookCnsdItem, shift: 'pagi' | 'siang' | 'malam', col: 'S' | 'US'): string => {
    if (item.is_measurement) {
      // For measurement rows: render numeric value only in the S column, leave US blank
      if (col === 'S') {
        const value = shift === 'pagi' ? item.value_pagi : shift === 'siang' ? item.value_siang : item.value_malam;
        return value ? `${value}${item.unit ? ' ' + item.unit : ''}` : '';
      }
      return '';
    }
    const status = shift === 'pagi' ? item.status_pagi : shift === 'siang' ? item.status_siang : item.status_malam;
    if (col === 'S' && status === 'S') return '✓';
    if (col === 'US' && status === 'US') return '✓';
    return '';
  };

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
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/logbooks/cnsd/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 paper */}
      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[10px] leading-tight print:mx-0 print:w-full print:max-w-none print:border-0">
        {/* KOP */}
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

        {/* JUDUL */}
        <div className="border-b border-black py-2 text-center">
          <p className="text-[13px] font-black tracking-wide">LOG BOOK CNS &amp; AUTOMATION</p>
        </div>

        {/* TABEL UTAMA */}
        <table className="w-full border-collapse">
          <thead>
            {/* Row 1: NAMA PERALATAN | CATATAN | PARAF */}
            <tr>
              <td colSpan={8} className="border border-black px-2 py-1 text-center font-bold text-[9px]">
                NAMA PERALATAN
              </td>
              <td rowSpan={4} className="border border-black px-2 py-1 text-center font-bold text-[9px] w-[22%] align-top">
                CATATAN
              </td>
              <td rowSpan={4} className="border border-black px-2 py-1 text-center font-bold text-[9px] w-[8%] align-top">
                PARAF
              </td>
            </tr>
            {/* Row 2: Tanggal + shift headers */}
            <tr>
              <td colSpan={2} className="border border-black px-2 py-1 text-[9px]">
                <span>Tanggal : </span>
                <span className="ml-2 font-semibold">{formatDateShort(record.date)}</span>
                <span className="ml-3 text-slate-500">({getYear(record.date)})</span>
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
              <td className="border border-black px-2 py-1 text-[8px] font-bold">SHIFT</td>
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
              if (row.type === 'section-header') {
                return (
                  <tr key={`sec-${idx}`} className="bg-slate-100">
                    <td className="border border-black px-1 py-0.5 text-center font-black text-[10px]">
                      {row.letter}
                    </td>
                    <td colSpan={7} className="border border-black px-2 py-1 font-black text-[10px] uppercase tracking-wide">
                      {row.label}
                    </td>
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                );
              }
              if (row.type === 'sub-header') {
                return (
                  <tr key={`sub-${idx}`}>
                    <td className="border border-black px-1 py-0.5 text-center text-[9px] font-semibold">
                      {row.subIndex}
                    </td>
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
              const isMeas = item.is_measurement;
              return (
                <tr key={`item-${item.id}`}>
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">{row.no}</td>
                  <td className="border border-black px-2 py-0.5 text-[9px]">{item.equipment_name}</td>
                  {/* Pagi S */}
                  <td className={`border border-black px-1 py-0.5 text-center ${isMeas ? 'text-[8px] font-mono' : 'text-[9px]'}`}>
                    {renderCellValue(item, 'pagi', 'S')}
                  </td>
                  {/* Pagi U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {renderCellValue(item, 'pagi', 'US')}
                  </td>
                  {/* Siang S */}
                  <td className={`border border-black px-1 py-0.5 text-center ${isMeas ? 'text-[8px] font-mono' : 'text-[9px]'}`}>
                    {renderCellValue(item, 'siang', 'S')}
                  </td>
                  {/* Siang U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {renderCellValue(item, 'siang', 'US')}
                  </td>
                  {/* Malam S */}
                  <td className={`border border-black px-1 py-0.5 text-center ${isMeas ? 'text-[8px] font-mono' : 'text-[9px]'}`}>
                    {renderCellValue(item, 'malam', 'S')}
                  </td>
                  {/* Malam U/S */}
                  <td className="border border-black px-1 py-0.5 text-center text-[9px]">
                    {renderCellValue(item, 'malam', 'US')}
                  </td>
                  {/* Catatan — empty */}
                  <td className="border border-black px-1 py-0.5 text-[9px]" />
                  {/* Paraf — empty */}
                  <td className="border border-black px-1 py-0.5" />
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* KETERANGAN */}
        <div className="border-t-2 border-black px-4 py-2 text-[9px]">
          <p><span className="font-bold">Keterangan :</span></p>
          <p className="ml-8"><span className="font-bold">S</span>    : Serviceable</p>
          <p className="ml-8"><span className="font-bold">U/S</span> : Unserviceable</p>
        </div>

        {/* PERSONIL ON DUTY */}
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
              {[0, 1, 2, 3, 4, 5].map((i) => (
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

        {/* CATATAN KEGIATAN */}
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

        {/* MANAGER TEKNIK TTD — per shift */}
        <div className="border-t border-black">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <td className="border border-black px-2 py-1 font-bold w-1/2">MANAGER TEKNIK</td>
                <td className="border border-black px-2 py-1 font-bold text-center w-1/2">TTD</td>
              </tr>
            </thead>
            <tbody>
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
