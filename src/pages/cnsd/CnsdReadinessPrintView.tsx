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

const val = (v: string | null | undefined): string =>
  v == null || v === '' ? '-' : v;

// ─── Section table for print ──────────────────────────────────

interface PrintSectionProps {
  sectionMeta: CnsdReadinessSectionMeta;
  items: CnsdReadinessItem[];
  sectionIndex: number;
}

const PrintSection: React.FC<PrintSectionProps> = ({ sectionMeta, items, sectionIndex }) => {
  if (items.length === 0) return null;

  return (
    <>
      {/* Section header row */}
      <tr>
        <td
          colSpan={6}
          className="border border-black bg-gray-200 px-2 py-1 text-[11px] font-bold uppercase"
        >
          {sectionIndex + 1}. {sectionMeta.name}
          {/* Show column header info in the section header for context */}
          <span className="ml-3 font-normal text-gray-600 text-[10px]">
            — {val(sectionMeta.columns_label_1)} | {val(sectionMeta.columns_label_2)}
          </span>
        </td>
      </tr>
      {/* Column sub-header */}
      <tr className="bg-gray-100 text-[10px] font-bold">
        <td className="border border-black px-2 py-1 text-center w-8">No</td>
        <td className="border border-black px-2 py-1 w-44">Nama Peralatan</td>
        <td className="border border-black px-2 py-1 w-24 text-center">Status Peralatan</td>
        <td className="border border-black px-2 py-1 w-28 text-center">
          {val(sectionMeta.columns_label_1)}
        </td>
        <td className="border border-black px-2 py-1 w-28 text-center">
          {val(sectionMeta.columns_label_2)}
        </td>
        <td className="border border-black px-2 py-1">Keterangan</td>
      </tr>
      {items.map((item, idx) => (
        <tr key={item.id} className="text-[11px]">
          <td className="border border-black px-2 py-1 text-center font-mono">
            {item.item_number ?? idx + 1}
          </td>
          <td className="border border-black px-2 py-1">
            <span className="font-semibold">{item.equipment_name}</span>
            {item.sub_equipment_name && (
              <span className="ml-1 text-[9px] font-bold text-gray-500 uppercase">
                {item.sub_equipment_name}
              </span>
            )}
          </td>
          <td className="border border-black px-2 py-1 text-center">
            {item.status_peralatan ? (
              <span
                className={
                  item.status_peralatan === 'NORMAL'
                    ? 'font-bold text-black'
                    : 'font-bold text-black'
                }
              >
                {item.status_peralatan}
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
          <td className="border border-black px-2 py-1 text-center">
            {val(item.kondisi_operasional_1)}
          </td>
          <td className="border border-black px-2 py-1 text-center">
            {val(item.kondisi_operasional_2)}
          </td>
          <td className="border border-black px-2 py-1">{val(item.keterangan)}</td>
        </tr>
      ))}
    </>
  );
};

// ─── Main print view ──────────────────────────────────────────

/**
 * CNSD Readiness Print View — Form EQ-1
 *
 * Frontend-only HTML print layout. No backend PDF generation required.
 *
 * Layout mirrors the official AirNav Indonesia KESIAPAN PERALATAN paper form:
 *   - Kop: AirNav logo (left), PERUM LPPNPI Cabang Surabaya identity (right)
 *   - Judul: KESIAPAN PERALATAN / COMMUNICATION NAVIGATION SURVEILLANCE / FORM EQ-1
 *   - Header metadata: lokasi, tanggal, shift, fasilitas
 *   - 5-section item table (data from API, not hardcoded)
 *   - Footer: Teknisi list | Supervisor | Manager Teknik signatures
 *
 * Print CSS: `@media print` hides the control toolbar and renders A4.
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
        <Button variant="outline" onClick={() => navigate('/cnsd/readiness')}>
          Kembali
        </Button>
      </div>
    );
  }

  // Group items by section_name, preserving order from sections_meta
  const itemsBySection: Record<string, CnsdReadinessItem[]> = {};
  record.items.forEach((it) => {
    if (!itemsBySection[it.section_name]) itemsBySection[it.section_name] = [];
    itemsBySection[it.section_name].push(it);
  });

  const shiftLabel: Record<string, string> = {
    pagi: 'Pagi (07:00–13:00)',
    siang: 'Siang (13:00–19:00)',
    malam: 'Malam (19:00–07:00)',
  };

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

      {/* ── Toolbar (screen only) ── */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/cnsd/readiness/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* ── A4 paper ── */}
      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[11px] print:mx-0 print:w-full print:max-w-none print:border-0">

        {/* Kop */}
        <div className="flex border-b border-black">
          {/* Left: AirNav logo + name */}
          <div className="flex w-[35%] items-center gap-2 border-r border-black p-3">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <div className="text-[12px] font-black">AirNav Indonesia</div>
              <div className="text-[9px] font-semibold text-gray-600">PERUM LPPNPI</div>
              <div className="text-[9px] font-semibold text-gray-600">Cabang Surabaya</div>
            </div>
          </div>

          {/* Center: judul */}
          <div className="flex flex-1 flex-col items-center justify-center border-r border-black px-2 py-3 text-center">
            <div className="text-[14px] font-black uppercase tracking-wide">Kesiapan Peralatan</div>
            <div className="mt-0.5 text-[9px] font-semibold text-gray-600 uppercase leading-tight">
              Communication Navigation Surveillance and Data Processing
            </div>
          </div>

          {/* Right: form identity */}
          <div className="flex w-[28%] flex-col items-center justify-center px-2 py-3 text-center">
            <div className="text-[9px] font-semibold text-gray-500 uppercase">Formulir</div>
            <div className="text-[16px] font-black">FORM EQ-1</div>
            <div className="text-[8px] text-gray-500 mt-0.5">No: {record.form_number}</div>
          </div>
        </div>

        {/* Header metadata */}
        <div className="grid grid-cols-2 border-b border-black text-[11px]">
          <div className="grid grid-cols-[90px_1fr] gap-0.5 border-r border-black p-2">
            <span className="font-bold">Lokasi</span>
            <span>: {record.location}</span>
            <span className="font-bold">Fasilitas</span>
            <span>: {record.facility}</span>
            <span className="font-bold">Ruangan</span>
            <span>: {val(record.room)}</span>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-0.5 p-2">
            <span className="font-bold">Tanggal</span>
            <span>: {formatDate(record.date)}</span>
            <span className="font-bold">Shift</span>
            <span>: {shiftLabel[record.shift_type] ?? record.shift_type}</span>
            <span className="font-bold">Status Form</span>
            <span className="capitalize">: {record.status}</span>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {record.sections_meta.map((meta, sIdx) => (
              <PrintSection
                key={meta.name}
                sectionMeta={meta}
                items={itemsBySection[meta.name] ?? []}
                sectionIndex={sIdx}
              />
            ))}
          </tbody>
        </table>

        {/* Footer: signatures */}
        <div className="mt-0 border-t border-black">
          <div className="flex">
            {/* Teknisi column */}
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">
                Teknisi
              </div>
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
            <div className="flex w-[28%] flex-col items-center border-r border-black p-2 text-center min-h-[130px]">
              <div className="text-[10px] font-black uppercase mb-1">Supervisor</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img
                      src={record.supervisor.signature}
                      alt="TTD Supervisor"
                      className="max-h-16 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400" />
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
            <div className="flex w-[28%] flex-col items-center p-2 text-center min-h-[130px]">
              <div className="text-[10px] font-black uppercase mb-1">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (
                  record.manager.signature ? (
                    <img
                      src={record.manager.signature}
                      alt="TTD Manager"
                      className="max-h-16 max-w-[110px] object-contain"
                    />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400" />
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
