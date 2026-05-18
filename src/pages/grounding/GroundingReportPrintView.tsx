import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundingReportService } from '@/services/groundingReportService';
import type { GroundingReportDetail } from '@/types/grounding';

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (v?: string | null): string => {
  if (!v) return '';
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '' : v);

/**
 * Grounding Report Print View.
 *
 * Layout:
 * - Header: AirNav logo left, Perum LPPNPI right
 * - Title: Checklist Fasilitas dan Peralatan Pemeliharaan Sistem Penangkal Petir dan Sistem Pembumian
 * - Info: Tanggal, Jam, Nama Peralatan, Lokasi Peralatan, Kantor Unit Kerja
 * - Section VISUAL table
 * - Section PENGUKURAN table
 * - Footer: Teknisi | Supervisor | Manager Teknik (TFP AOB Ground pattern)
 *
 * Print is manual only — no auto-print.
 */
export const GroundingReportPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundingReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await groundingReportService.getRecord(Number(id));
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
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Laporan tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/grounding')}>Kembali</Button>
      </div>
    );
  }

  const visualItems = record.items.filter((it) => it.section_name === 'VISUAL');
  const measurementItems = record.items.filter((it) => it.section_name === 'PENGUKURAN');

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
            tr, td { page-break-inside: avoid; }
          }
        `}
      </style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/grounding/reports/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 paper */}
      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[11px] print:mx-0 print:w-full print:max-w-none print:border-0">

        {/* Kop */}
        <div className="flex border-b border-black">
          {/* Left: AirNav logo */}
          <div className="flex w-[40%] items-center gap-2 border-r border-black p-3">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <div className="text-[12px] font-black">AirNav Indonesia</div>
              <div className="text-[8px] font-semibold text-gray-600">Teknik Fasilitas Penunjang</div>
            </div>
          </div>
          {/* Right: Perum LPPNPI */}
          <div className="flex w-[60%] flex-col justify-center p-3 text-[9px] leading-tight">
            <div className="font-bold text-[12px]">Perum LPPNPI</div>
            <div className="font-semibold uppercase">Kantor Cabang Surabaya</div>
            <div className="text-gray-600 mt-0.5">Telp. (031)8688456 Fax : (031)8688536</div>
            <div className="text-gray-600">email : sub@airnavindonesia.co.id</div>
            <div className="text-gray-600">Web : www.airnavindonesia.co.id</div>
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-black px-4 py-3 text-center">
          <div className="text-[13px] font-black uppercase tracking-wide">
            Checklist Fasilitas dan Peralatan
          </div>
          <div className="text-[11px] font-semibold mt-0.5">
            Pemeliharaan Sistem Penangkal Petir dan Sistem Pembumian
          </div>
        </div>

        {/* Info header */}
        <div className="border-b border-black">
          <div className="grid grid-cols-2 text-[10px]">
            <div className="border-r border-black p-2 space-y-1">
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">No. Laporan</span>
                <span>: {record.report_number}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Tanggal</span>
                <span>: {formatDate(record.date)}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Jam</span>
                <span>: {record.time_filled ?? '-'}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Shift</span>
                <span>: {shiftLabel[record.shift_type] ?? record.shift_type}</span>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Kantor Unit Kerja</span>
                <span>: {record.work_unit}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Nama Peralatan</span>
                <span>: {record.equipment_name}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-bold">Lokasi Peralatan</span>
                <span>: {record.equipment_location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section VISUAL */}
        <div className="border-b border-black">
          <div className="bg-green-100 px-3 py-1 text-[10px] font-bold uppercase border-b border-black">
            VISUAL
          </div>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-2 py-1 text-center w-8">No</th>
                <th className="border border-black px-2 py-1 text-left">Item Pemeriksaan</th>
                <th className="border border-black px-2 py-1 text-center w-24">Ketersediaan</th>
                <th className="border border-black px-2 py-1 text-center w-24">Kondisi</th>
                <th className="border border-black px-2 py-1 text-left w-36">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {visualItems.map((item) => (
                <tr key={item.id}>
                  <td className="border border-black px-2 py-1 text-center">{item.item_number}</td>
                  <td className="border border-black px-2 py-1">{item.item_name}</td>
                  <td className="border border-black px-2 py-1 text-center">{val(item.availability)}</td>
                  <td className="border border-black px-2 py-1 text-center">{val(item.condition)}</td>
                  <td className="border border-black px-2 py-1">{val(item.notes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section PENGUKURAN */}
        <div className="border-b border-black">
          <div className="bg-green-100 px-3 py-1 text-[10px] font-bold uppercase border-b border-black">
            PENGUKURAN
          </div>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-2 py-1 text-center w-8">No</th>
                <th className="border border-black px-2 py-1 text-left">Item Pemeriksaan</th>
                <th className="border border-black px-2 py-1 text-center w-20">Standard</th>
                <th className="border border-black px-2 py-1 text-center w-24">Kondisi</th>
                <th className="border border-black px-2 py-1 text-left w-36">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {measurementItems.map((item) => (
                <tr key={item.id}>
                  <td className="border border-black px-2 py-1 text-center">{item.item_number}</td>
                  <td className="border border-black px-2 py-1">{item.item_name}</td>
                  <td className="border border-black px-2 py-1 text-center font-mono">{val(item.standard)}</td>
                  <td className="border border-black px-2 py-1 text-center">{val(item.condition)}</td>
                  <td className="border border-black px-2 py-1">{val(item.notes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: Waktu Pelaksanaan + Tanda Tangan */}
        <div>
          {/* Waktu pelaksanaan */}
          <div className="flex border-b border-black text-[10px]">
            <div className="flex-1 grid grid-cols-[70px_1fr] gap-0.5 p-2 border-r border-black">
              <span className="font-bold">Hari</span>
              <span>: {record.day_name ?? '-'}</span>
            </div>
            <div className="flex-1 grid grid-cols-[70px_1fr] gap-0.5 p-2 border-r border-black">
              <span className="font-bold">Tanggal</span>
              <span>: {formatDate(record.date)}</span>
            </div>
            <div className="flex-1 grid grid-cols-[50px_1fr] gap-0.5 p-2">
              <span className="font-bold">Jam</span>
              <span>: {record.time_filled ?? '-'}</span>
            </div>
          </div>

          {/* Signature columns */}
          <div className="flex">
            {/* Pelaksana Teknisi */}
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">PELAKSANA TEKNISI</div>
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
                            <img src={tech.signature} alt={`TTD ${tech.technician_name}`} className="mx-auto max-h-10 max-w-[90px] object-contain" />
                          ) : (
                            <span className="text-[9px] text-gray-400 italic">Belum TTD</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="border border-black px-1 py-2 text-center text-gray-400">Tidak ada teknisi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Supervisor */}
            <div className="flex w-[28%] flex-col items-center border-r border-black p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">SUPERVISOR</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img src={record.supervisor.signature} alt="TTD Supervisor" className="max-h-16 max-w-[110px] object-contain" />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">Belum TTD</div>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Tidak ada supervisor pada shift ini</span>
                )}
              </div>
              <div className="mt-auto text-[11px] font-semibold">{record.supervisor?.name ?? '—'}</div>
              {record.supervisor?.signed_at && <div className="text-[9px] text-gray-500">{formatDateTime(record.supervisor.signed_at)}</div>}
            </div>

            {/* Manager Teknik */}
            <div className="flex w-[28%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">MANAGER TEKNIK</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (
                  record.manager.signature ? (
                    <img src={record.manager.signature} alt="TTD Manager" className="max-h-16 max-w-[110px] object-contain" />
                  ) : (
                    <div className="h-14 w-24 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">Belum TTD</div>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Manager Teknik tidak ditugaskan</span>
                )}
              </div>
              <div className="mt-auto text-[11px] font-semibold">{record.manager?.name ?? '—'}</div>
              {record.manager?.signed_at && <div className="text-[9px] text-gray-500">{formatDateTime(record.manager.signed_at)}</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
