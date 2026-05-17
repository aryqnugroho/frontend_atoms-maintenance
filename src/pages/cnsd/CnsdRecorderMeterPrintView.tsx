import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdRecorderMeterService } from '@/services/cnsdRecorderMeterService';
import type {
  CnsdRecorderMeterItem,
  CnsdRecorderMeterRecordDetail,
  CnsdRecorderMeterSectionMeta,
} from '@/types/cnsdRecorder';

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

const val = (v: string | null | undefined): string => (v == null || v === '' ? '' : v);

/**
 * Status chip renderer — green for OK values, red for fault values, plain otherwise.
 */
const StatusCell: React.FC<{ value: string | null | undefined }> = ({ value }) => {
  const v = (value ?? '').trim();
  if (v === 'Normal' || v === '√') {
    return <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">{v}</span>;
  }
  if (v === 'Fault' || v === 'Alrm' || v === '-') {
    return <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">{v}</span>;
  }
  return <span>{val(value)}</span>;
};

// ─── Section A renderer (Server A / Server B + 4 groups) ─────

interface SectionProps {
  sectionMeta: CnsdRecorderMeterSectionMeta;
  items: CnsdRecorderMeterItem[];
}

const PrintSectionServerDual: React.FC<SectionProps> = ({ sectionMeta, items }) => {
  if (items.length === 0) return null;

  const groups: { number: number | null; name: string | null; items: CnsdRecorderMeterItem[] }[] = [];
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
        <td colSpan={6} className="border border-black bg-emerald-200 px-2 py-1 text-[11px] font-bold uppercase">
          {sectionMeta.code}. {sectionMeta.name}
        </td>
      </tr>
      <tr className="bg-emerald-100 text-[10px] font-bold">
        <td className="border border-black px-2 py-1 text-center w-10">NO</td>
        <td className="border border-black px-2 py-1 w-56">PEMBACAAN METER READING</td>
        <td className="border border-black px-2 py-1 w-36 text-center">NOMINAL</td>
        <td className="border border-black px-2 py-1 text-center" colSpan={2}>
          HASIL PEMERIKSAAN
        </td>
        <td className="border border-black px-2 py-1">KETERANGAN</td>
      </tr>
      <tr className="bg-emerald-100 text-[10px] font-bold">
        <td className="border border-black px-2 py-1 text-center" colSpan={3}></td>
        <td className="border border-black px-2 py-1 text-center">{sectionMeta.columns_label_1 ?? 'Server A'}</td>
        <td className="border border-black px-2 py-1 text-center">{sectionMeta.columns_label_2 ?? 'Server B'}</td>
        <td className="border border-black px-2 py-1"></td>
      </tr>
      {groups.map((g, gIdx) => (
        <React.Fragment key={`pg-${gIdx}`}>
          {(g.number !== null || g.name !== null) && (
            <tr className="bg-emerald-50">
              <td className="border border-black px-2 py-1 text-center text-[10px] font-bold">{g.number ?? ''}</td>
              <td className="border border-black px-2 py-1 text-[11px] font-bold uppercase">{g.name}</td>
              {g.number === 4 ? (
                <>
                  <td className="border border-black px-2 py-1 text-[11px] font-bold text-center">Content</td>
                  <td className="border border-black px-2 py-1 text-[10px] font-bold text-center">Normal</td>
                  <td className="border border-black px-2 py-1 text-[10px] font-bold text-center">Fault</td>
                  <td className="border border-black px-2 py-1"></td>
                </>
              ) : (
                <td colSpan={4} className="border border-black px-2 py-1"></td>
              )}
            </tr>
          )}
          {g.items.map((item) => {
            // Blocked / U/S row → red strip mirroring paper form
            if (item.is_blocked) {
              return (
                <tr key={item.id} className="text-[11px]">
                  <td className="border border-black px-2 py-1 font-mono text-[10px]">{item.item_number}</td>
                  <td className="border border-black px-2 py-1 bg-red-500" />
                  <td className="border border-black px-2 py-1 bg-red-500 text-center text-white font-bold text-[10px]">
                    {item.block_reason ?? 'U/S'}
                  </td>
                  <td className="border border-black px-2 py-1 bg-red-500" />
                  <td className="border border-black px-2 py-1 bg-red-500" />
                  <td className="border border-black px-2 py-1 bg-red-500 text-center text-white font-bold text-[10px]">
                    {item.block_reason ?? 'U/S'}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={item.id} className="text-[11px]">
                <td className="border border-black px-2 py-1 font-mono text-[10px]">
                  {item.item_number || ''}
                </td>
                <td className="border border-black px-2 py-1">{item.item_name}</td>
                <td className="border border-black px-2 py-1 text-center">{val(item.nominal)}</td>
                <td className="border border-black px-2 py-1 text-center">
                  <StatusCell value={item.hasil_server_a} />
                </td>
                <td className="border border-black px-2 py-1 text-center">
                  <StatusCell value={item.hasil_server_b} />
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

const PrintSectionEnvironment: React.FC<SectionProps> = ({ sectionMeta, items }) => {
  if (items.length === 0) return null;

  return (
    <div className="border border-black mt-0">
      <div className="bg-emerald-200 px-2 py-1 text-[11px] font-bold uppercase border-b border-black">
        {sectionMeta.code}. {sectionMeta.name}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-emerald-100 text-[10px] font-bold">
            <td className="border border-black px-2 py-1 text-center w-10">NO</td>
            <td className="border border-black px-2 py-1">KEGIATAN</td>
            <td className="border border-black px-2 py-1 text-center w-28">Nominal</td>
            <td className="border border-black px-2 py-1 text-center w-32">{sectionMeta.columns_label_1 ?? 'HASIL PEMERIKSAAN'}</td>
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
              <td className="border border-black px-2 py-1 text-center">{val(item.nominal)}</td>
              <td className="border border-black px-2 py-1 text-center">
                <StatusCell value={item.hasil} />
              </td>
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
 * CNSD Recorder Meter Reading Print View.
 *
 * Frontend-only HTML print layout that mirrors the official paper form
 * (FORM C-3).
 */
export const CnsdRecorderMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdRecorderMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await cnsdRecorderMeterService.getRecord(Number(id));
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
        <Button variant="outline" onClick={() => navigate('/cnsd/recorder-meter')}>
          Kembali
        </Button>
      </div>
    );
  }

  // Group items by section_code
  const itemsBySection: Record<string, CnsdRecorderMeterItem[]> = {};
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
            tr, td { page-break-inside: avoid; }
          }
        `}
      </style>

      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/cnsd/recorder-meter/${record.id}`)}
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
              <div className="text-[8px] font-semibold text-gray-600">FAS CNS &amp; A</div>
            </div>
          </div>

          <div className="flex w-[60%] flex-col justify-center p-3 text-[9px] leading-tight">
            <div className="font-bold text-[12px]">Perum LPPNPI</div>
            <div className="font-semibold uppercase">Kantor Cabang Surabaya</div>
            <div className="text-gray-600 mt-0.5">Telp. (031)8688456 Fax : (031)8688536</div>
            <div className="text-gray-600">email : sub@airnavindonesia.co.id</div>
            <div className="text-gray-600">Web : www.airnavindonesia.co.id</div>
          </div>
        </div>

        {/* Title row: METER READING with central RECORDER box */}
        <div className="flex border-b border-black">
          <div className="w-[55%] border-r border-black flex items-center justify-center py-3">
            <div className="text-[14px] font-black uppercase tracking-wider">METER READING</div>
          </div>
          <div className="w-[20%] border-r border-black flex items-center justify-center bg-emerald-700 py-3">
            <div className="text-[16px] font-black uppercase text-white">RECORDER</div>
          </div>
          <div className="w-[25%] flex flex-col justify-center px-2 py-1.5 text-[10px] leading-tight">
            <div className="text-[10px] font-bold text-emerald-700">FAS CNS &amp; A</div>
            <div className="text-[12px] font-black text-emerald-700">{record.form_code ?? 'FORM C-3'}</div>
          </div>
        </div>

        {/* Header metadata */}
        <div className="flex border-b border-black">
          <div className="w-[55%] border-r border-black">
            <div className="grid grid-cols-[80px_1fr] gap-0.5 p-2 border-b border-black">
              <span className="font-bold">LOKASI</span>
              <span>: {record.location}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-0.5 p-2">
              <span className="font-bold">TGL/JAM</span>
              <span>: {formatDate(record.date)} — Shift {shiftLabel[record.shift_type] ?? record.shift_type}</span>
            </div>
          </div>
          <div className="w-[45%] p-2 text-[10px] leading-tight">
            <div className="grid grid-cols-[60px_1fr]">
              <span className="font-bold">MERK</span>
              <span>: {val(record.merk)}</span>
            </div>
            <div className="grid grid-cols-[60px_1fr]">
              <span className="font-bold">TYPE</span>
              <span>: {val(record.type)}</span>
            </div>
            <div className="grid grid-cols-[60px_1fr]">
              <span className="font-bold">S N</span>
              <span>: {val(record.serial_number)}</span>
            </div>
            <div className="grid grid-cols-[60px_1fr] mt-1">
              <span className="font-bold">No. Form</span>
              <span className="text-[10px] font-mono">: {record.form_number}</span>
            </div>
          </div>
        </div>

        {/* Section A — PERALATAN */}
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {sectionA && (
              <PrintSectionServerDual
                sectionMeta={sectionA}
                items={itemsBySection['A'] ?? []}
              />
            )}
          </tbody>
        </table>

        {/* Section B — LINGKUNGAN KERJA */}
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
