import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdRadarMeterService } from '@/services/cnsdRadarMeterService';
import type {
  CnsdRadarMeterItem,
  CnsdRadarMeterRecordDetail,
  CnsdRadarMeterSectionMeta,
} from '@/types/cnsdRadar';

// ─── Helpers ──────────────────────────────────────────────────

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (v?: string | null): string => {
  if (!v) return '';
  return new Date(v).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '-' : v);
const isSubHeader = (it: CnsdRadarMeterItem): boolean => it.item_name.trim().startsWith('* ');
const isAntennaRpmRow = (it: CnsdRadarMeterItem): boolean =>
  it.item_name.trim().toLowerCase() === 'antenna';

/**
 * Render a kondisi_teknis value for the print view.
 * - Green → styled chip with green background
 * - Red   → styled chip with red background
 * - other → plain text via val()
 */
const TxPrintCell: React.FC<{ value: string | null | undefined; isAntenna?: boolean; antennaFallback?: string }> = ({
  value,
  isAntenna = false,
  antennaFallback,
}) => {
  if (isAntenna) {
    const display = value ? `${value} RPM` : (antennaFallback ?? '......... RPM');
    return <span>{display}</span>;
  }
  if (value === 'Green') {
    return <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">Green</span>;
  }
  if (value === 'Red') {
    return <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">Red</span>;
  }
  return <span>{val(value)}</span>;
};

// ─── Section A renderer (TX I / TX II) ────────────────────────

interface SectionProps {
  sectionMeta: CnsdRadarMeterSectionMeta;
  items: CnsdRadarMeterItem[];
}

const PrintSectionTxDual: React.FC<SectionProps> = ({ sectionMeta, items }) => {
  if (items.length === 0) return null;

  // Group items by group_number, preserving order
  const groups: { number: number | null; name: string | null; items: CnsdRadarMeterItem[] }[] = [];
  items.forEach((it) => {
    const last = groups[groups.length - 1];
    if (last && last.number === it.group_number && last.name === it.group_name) {
      last.items.push(it);
    } else {
      groups.push({ number: it.group_number, name: it.group_name, items: [it] });
    }
  });

  return (
    <>
      <tr>
        <td colSpan={6} className="border border-black bg-amber-200 px-2 py-1 text-[11px] font-bold uppercase">
          {sectionMeta.code}. {sectionMeta.name}
        </td>
      </tr>
      <tr className="bg-gray-100 text-[10px] font-bold">
        <td className="border border-black px-2 py-1 text-center w-8">NO</td>
        <td className="border border-black px-2 py-1 w-56">PEMERIKSAAN</td>
        <td className="border border-black px-2 py-1 w-28 text-center">STANDART</td>
        <td className="border border-black px-2 py-1 w-24 text-center" colSpan={2}>
          KONDISI TEKNIS
        </td>
        <td className="border border-black px-2 py-1">KETERANGAN</td>
      </tr>
      <tr className="bg-gray-100 text-[10px] font-bold">
        <td className="border border-black px-2 py-1 text-center" colSpan={3}></td>
        <td className="border border-black px-2 py-1 text-center">{sectionMeta.columns_label_1 ?? 'TX I'}</td>
        <td className="border border-black px-2 py-1 text-center">{sectionMeta.columns_label_2 ?? 'TX II'}</td>
        <td className="border border-black px-2 py-1"></td>
      </tr>
      {groups.map((g, gIdx) => (
        <React.Fragment key={`pg-${gIdx}`}>
          {(g.number !== null || g.name !== null) && (
            <tr className="bg-emerald-100">
              <td className="border border-black px-2 py-1 text-center text-[10px] font-bold">{g.number ?? ''}</td>
              <td colSpan={5} className="border border-black px-2 py-1 text-[11px] font-bold uppercase">
                {g.name}
              </td>
            </tr>
          )}
          {g.items.map((item, iIdx) => {
            if (isSubHeader(item)) {
              return (
                <tr key={item.id} className="bg-gray-50 text-[10px]">
                  <td className="border border-black px-2 py-1 text-center text-gray-500">—</td>
                  <td colSpan={5} className="border border-black px-2 py-1 font-bold uppercase tracking-wider text-gray-700">
                    {item.item_name}
                  </td>
                </tr>
              );
            }

            // Antenna row: display "... RPM" placeholder when value not filled
            const isAntenna = isAntennaRpmRow(item);

            return (
              <tr key={item.id} className="text-[11px]">
                <td className="border border-black px-2 py-1 text-center font-mono">
                  {item.item_number || iIdx + 1}
                </td>
                <td className="border border-black px-2 py-1">{item.item_name}</td>
                <td className="border border-black px-2 py-1 text-center">{val(item.standard)}</td>
                <td className="border border-black px-2 py-1 text-center">
                  <TxPrintCell value={item.kondisi_teknis_tx1} isAntenna={isAntenna} />
                </td>
                <td className="border border-black px-2 py-1 text-center">
                  <TxPrintCell value={item.kondisi_teknis_tx2} isAntenna={isAntenna} />
                </td>
                <td className="border border-black px-2 py-1">{val(item.keterangan)}</td>
              </tr>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

// ─── Section B renderer (Lingkungan Kerja: HASIL column) ─────
// Section B sits in a separate table (not nested inside the Section A tbody),
// because Section A has 6 columns (NO, PEMERIKSAAN, STANDART, TX I, TX II, KET)
// while Section B only has 5 (NO, KEGIATAN, STANDART, HASIL, KET).
// Mixing them in one <table> forces a column mismatch that breaks alignment.

const PrintSectionEnvironment: React.FC<SectionProps> = ({ sectionMeta, items }) => {
  if (items.length === 0) return null;

  return (
    <div className="border border-black mt-0">
      {/* Section header */}
      <div className="bg-amber-200 px-2 py-1 text-[11px] font-bold uppercase border-b border-black">
        {sectionMeta.code}. {sectionMeta.name}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-100 text-[10px] font-bold">
            <td className="border border-black px-2 py-1 text-center w-8">NO</td>
            <td className="border border-black px-2 py-1">KEGIATAN</td>
            <td className="border border-black px-2 py-1 text-center w-28">STANDART</td>
            <td className="border border-black px-2 py-1 text-center w-24">{sectionMeta.columns_label_1 ?? 'HASIL'}</td>
            <td className="border border-black px-2 py-1">KETERANGAN</td>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="border border-black px-2 py-1 text-center font-mono">
                {item.item_number || idx + 1}
              </td>
              <td className="border border-black px-2 py-1">{item.item_name}</td>
              <td className="border border-black px-2 py-1 text-center">{val(item.standard)}</td>
              <td className="border border-black px-2 py-1 text-center">{val(item.hasil)}</td>
              <td className="border border-black px-2 py-1">{val(item.keterangan)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main print view ──────────────────────────────────────────

/**
 * CNSD Radar Meter Reading Print View.
 *
 * Frontend-only HTML print layout that mirrors the official paper form.
 *
 *   - Kop: AirNav logo (left), PERUM LPPNPI Cabang Surabaya (right)
 *   - Title: METER READING (with RADAR box centered)
 *   - Header metadata: lokasi, tanggal, merk, type, SN
 *   - Section A: TERMONITOR DI LCMS (TX I / TX II columns + groups)
 *   - Section C: LINGKUNGAN KERJA (single HASIL column)
 *   - Footer: Teknisi list | Supervisor | Manager Teknik signatures
 */
export const CnsdRadarMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdRadarMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await cnsdRadarMeterService.getRecord(Number(id));
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
        <Button variant="outline" onClick={() => navigate('/cnsd/radar-meter')}>
          Kembali
        </Button>
      </div>
    );
  }

  // Group items by section_code
  const itemsBySection: Record<string, CnsdRadarMeterItem[]> = {};
  record.items.forEach((it) => {
    const code = it.section_code ?? 'A';
    if (!itemsBySection[code]) itemsBySection[code] = [];
    itemsBySection[code].push(it);
  });

  const shiftLabel: Record<string, string> = {
    pagi: 'Pagi (07:00–13:00)',
    siang: 'Siang (13:00–19:00)',
    malam: 'Malam (19:00–07:00)',
  };

  const sectionA = record.sections_meta.find((s) => s.code === 'A');
  const sectionB = record.sections_meta.find((s) => s.code === 'B');

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 8mm 10mm; }
            body { background: white !important; }
            .print-hide { display: none !important; }
          }
        `}
      </style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/cnsd/radar-meter/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[11px] print:mx-0 print:w-full print:max-w-none print:border-0">

        {/* Kop */}
        <div className="flex border-b border-black">
          <div className="flex w-[40%] items-center gap-2 border-r border-black p-3">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <div className="text-[12px] font-black">AirNav Indonesia</div>
              <div className="text-[8px] font-semibold text-gray-600">FAS CNS &amp; OTOMASI</div>
            </div>
          </div>

          <div className="flex w-[60%] flex-col justify-center p-3 text-[9px] leading-tight">
            <div className="font-bold text-[12px]">Perum LPPNPI</div>
            <div className="font-semibold uppercase">Kantor Cabang Surabaya</div>
            <div className="text-gray-600 mt-0.5">Telp. (031)8688456 Fax : (031)8688536</div>
            <div className="text-gray-600">email : cab@airnavindonesia.co.id</div>
            <div className="text-gray-600">Web : www.airnavindonesia.co.id</div>
          </div>
        </div>

        {/* Title row: METER READING with central RADAR box */}
        <div className="flex border-b border-black">
          <div className="w-[60%] border-r border-black flex items-center justify-center py-3">
            <div className="text-[14px] font-black uppercase tracking-wider">METER READING</div>
          </div>
          <div className="w-[20%] border-r border-black flex items-center justify-center bg-sky-100 py-3">
            <div className="text-[16px] font-black uppercase">RADAR</div>
          </div>
          <div className="w-[20%] flex flex-col justify-center px-2 py-1.5 text-[10px] leading-tight">
            <div><span className="font-bold">Merk</span> : {val(record.merk)}</div>
            <div><span className="font-bold">Type</span> : {val(record.type)}</div>
            <div><span className="font-bold">SN</span> : {val(record.serial_number)}</div>
          </div>
        </div>

        {/* Header metadata */}
        <div className="grid grid-cols-2 border-b border-black text-[11px]">
          <div className="grid grid-cols-[80px_1fr] gap-0.5 border-r border-black p-2">
            <span className="font-bold">LOKASI</span>
            <span>: {record.location}</span>
            <span className="font-bold">FASILITAS</span>
            <span>: {record.facility}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-0.5 p-2">
            <span className="font-bold">TANGGAL</span>
            <span>: {formatDate(record.date)}</span>
            <span className="font-bold">SHIFT</span>
            <span>: {shiftLabel[record.shift_type] ?? record.shift_type}</span>
            <span className="font-bold">No. Form</span>
            <span className="text-[10px] font-mono">: {record.form_number}</span>
          </div>
        </div>

        {/* Items: Section A inside a table, Section B in its own block */}
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {sectionA && (
              <PrintSectionTxDual
                sectionMeta={sectionA}
                items={itemsBySection['A'] ?? []}
              />
            )}
          </tbody>
        </table>

        {sectionB && (
          <PrintSectionEnvironment
            sectionMeta={sectionB}
            items={itemsBySection['B'] ?? []}
          />
        )}

        {/* Footer: signatures */}
        <div className="border-t border-black">
          <div className="flex">
            {/* Teknisi column */}
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">TEKNISI</div>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-1 py-1 w-8 text-center">No</th>
                    <th className="border border-black px-1 py-1 text-left">Nama</th>
                    <th className="border border-black px-1 py-1 w-24 text-center">Paraf</th>
                  </tr>
                </thead>
                <tbody>
                  {record.technicians.length > 0 ? (
                    record.technicians.map((tech, idx) => (
                      <tr key={tech.id}>
                        <td className="border border-black px-1 py-1 text-center">{idx + 1}</td>
                        <td className="border border-black px-1 py-1">{tech.technician_name}</td>
                        <td className="border border-black px-1 py-1 text-center align-middle h-12">
                          {tech.signature ? (
                            <img
                              src={tech.signature}
                              alt={`TTD ${tech.technician_name}`}
                              className="mx-auto max-h-10 max-w-[90px] object-contain"
                            />
                          ) : (
                            <span className="text-[9px] text-gray-400 italic">Belum TTD</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="border border-black px-1 py-2 text-center text-gray-400">
                        Tidak ada teknisi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Supervisor column */}
            <div className="flex w-[28%] flex-col items-center border-r border-black p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">SUPERVISOR</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img
                      src={record.supervisor.signature}
                      alt="TTD Supervisor"
                      className="max-h-16 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">
                      Belum TTD
                    </div>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Tidak ada supervisor pada shift ini
                  </span>
                )}
              </div>
              <div className="mt-auto text-[11px] font-semibold">
                {record.supervisor?.name ?? '—'}
              </div>
              {record.supervisor?.signed_at && (
                <div className="text-[9px] text-gray-500">
                  {formatDateTime(record.supervisor.signed_at)}
                </div>
              )}
            </div>

            {/* Manager Teknik column */}
            <div className="flex w-[28%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">MANAGER TEKNIK</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (
                  record.manager.signature ? (
                    <img
                      src={record.manager.signature}
                      alt="TTD Manager"
                      className="max-h-16 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">
                      Belum TTD
                    </div>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Manager Teknik tidak ditugaskan
                  </span>
                )}
              </div>
              <div className="mt-auto text-[11px] font-semibold">
                {record.manager?.name ?? '—'}
              </div>
              {record.manager?.signed_at && (
                <div className="text-[9px] text-gray-500">
                  {formatDateTime(record.manager.signed_at)}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
