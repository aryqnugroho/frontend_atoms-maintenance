import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundCheckAdcService } from '@/services/groundCheckAdcService';
import type { GroundCheckAdcRecordDetail } from '@/types/groundCheckAdc';

// ─── Helpers ──────────────────────────────────────────────────

const val = (v: string | null | undefined): string =>
  v == null || v === '' ? '' : v;

/**
 * Ground Check ADC — Print View
 *
 * Frontend-only HTML print layout that mirrors the official paper form
 * "PENGUJIAN BERKALA DI DARAT — PERALATAN FASELEKTRIK PENERBANGAN".
 *
 * Print does NOT auto-fire — the user must click the Print PDF button.
 */
export const GroundCheckAdcPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundCheckAdcRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await groundCheckAdcService.getDetail(Number(id));
        if (!cancelled) setRecord(data);
      } catch {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchRecord();
    return () => {
      cancelled = true;
    };
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
        <p className="text-sm text-slate-600">Form tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/ground-check/adc')}>
          Kembali
        </Button>
      </div>
    );
  }

  // Item numbering (skip headers)
  let itemNumber = 0;

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
          onClick={() => navigate(`/ground-check/adc/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* ── A4 portrait paper ── */}
      <div className="mx-auto max-w-[210mm] bg-white font-sans text-[10px] print:mx-0 print:w-full print:max-w-none">

        {/* ─── Header / Kop ─── */}
        <div className="flex items-center justify-between px-3 pt-3 mb-3">
          {/* Left: logo */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Center: title */}
          <div className="text-center flex-1">
            <div className="text-[12px] font-black leading-tight uppercase">
              Pengujian Berkala di Darat
            </div>
            <div className="text-[10px] font-bold leading-tight uppercase mt-0.5">
              Peralatan Faselektrik Penerbangan
            </div>
          </div>

          {/* Right: form number */}
          <div className="text-right text-[9px] font-semibold leading-tight">
            <div>{record.form_number}</div>
          </div>
        </div>

        {/* ─── Metadata section ─── */}
        <table className="w-full border-collapse text-[10px] mb-2 px-2">
          <tbody>
            <tr>
              <td className="px-2 py-0.5 font-semibold w-[140px]">Laporan Bulan</td>
              <td className="px-1 py-0.5 w-3">:</td>
              <td className="px-1 py-0.5">{record.report_month ?? '—'}</td>
              <td className="px-2 py-0.5 font-semibold w-[140px]">Nama Peralatan</td>
              <td className="px-1 py-0.5 w-3">:</td>
              <td className="px-1 py-0.5">{record.equipment_name ?? '—'}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5 font-semibold">Bandara</td>
              <td className="px-1 py-0.5">:</td>
              <td className="px-1 py-0.5">{record.airport ?? '—'}</td>
              <td className="px-2 py-0.5 font-semibold">Lokasi Peralatan</td>
              <td className="px-1 py-0.5">:</td>
              <td className="px-1 py-0.5">{record.equipment_location ?? '—'}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5 font-semibold">Fungsi Peralatan</td>
              <td className="px-1 py-0.5">:</td>
              <td className="px-1 py-0.5">{record.equipment_function ?? '—'}</td>
              <td className="px-2 py-0.5 font-semibold">Data Teknis</td>
              <td className="px-1 py-0.5">:</td>
              <td className="px-1 py-0.5">{record.technical_data ?? '—'}</td>
            </tr>
            <tr>
              <td className="px-2 py-0.5 font-semibold">Kalibrasi Terakhir</td>
              <td className="px-1 py-0.5">:</td>
              <td colSpan={4} className="px-1 py-0.5">{record.last_calibration ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ─── Items table ─── */}
        <table className="w-full border-collapse text-[9px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24px' }} />   {/* No */}
            <col style={{ width: '110px' }} />  {/* Parameter */}
            <col style={{ width: '70px' }} />   {/* Hasil Pengukuran Setelah Kalibrasi */}
            <col style={{ width: '55px' }} />   {/* Toleransi */}
            <col style={{ width: '50px' }} />   {/* TX1 Hasil PD */}
            <col style={{ width: '35px' }} />   {/* TX1 In Tol */}
            <col style={{ width: '35px' }} />   {/* TX1 Out Tol */}
            <col style={{ width: '50px' }} />   {/* TX2 Hasil PD */}
            <col style={{ width: '35px' }} />   {/* TX2 In Tol */}
            <col style={{ width: '35px' }} />   {/* TX2 Out Tol */}
            <col style={{ width: '70px' }} />   {/* Keterangan */}
          </colgroup>

          <thead>
            <tr className="bg-blue-100">
              <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold align-middle">
                No
              </th>
              <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold align-middle">
                Parameter
              </th>
              <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold align-middle text-[8px]">
                Hasil Pengukuran Setelah Kalibrasi
              </th>
              <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold align-middle">
                Toleransi
              </th>
              <th colSpan={6} className="border border-black px-1 py-0.5 text-center font-bold">
                Pengujian di Darat ({record.date})
              </th>
              <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold align-middle">
                Keterangan
              </th>
            </tr>
            <tr className="bg-blue-50">
              <th colSpan={3} className="border border-black px-1 py-0.5 text-center font-semibold text-[8px]">
                TX1
              </th>
              <th colSpan={3} className="border border-black px-1 py-0.5 text-center font-semibold text-[8px]">
                TX2
              </th>
            </tr>
            <tr className="bg-blue-50 italic">
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                Hasil PD
              </th>
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                In Tol.
              </th>
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                Out Tol.
              </th>
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                Hasil PD
              </th>
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                In Tol.
              </th>
              <th className="border border-black px-0.5 py-0.5 text-center font-medium text-[7px]">
                Out Tol.
              </th>
            </tr>
          </thead>

          <tbody>
            {record.items.map((item) => {
              // Section header row
              if (item.is_header) {
                return (
                  <tr key={item.id} className="bg-gray-100">
                    <td
                      colSpan={11}
                      className="border border-black px-2 py-1 text-[9px] font-bold"
                    >
                      {item.parameter_name}
                    </td>
                  </tr>
                );
              }

              itemNumber++;

              return (
                <tr key={item.id}>
                  <td className="border border-black px-1 py-1 text-center">
                    {itemNumber}
                  </td>
                  <td className="border border-black px-1 py-1">
                    {item.parameter_name}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {val(item.calibration_result)}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {val(item.tolerance)}
                  </td>
                  {/* TX1 Hasil PD */}
                  <td className="border border-black px-1 py-1 text-center">
                    {val(item.tx1_hasil_pd)}
                  </td>
                  {/* TX1 In Tolerance */}
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {item.tx1_in_tolerance === '√' ? '√' : ''}
                  </td>
                  {/* TX1 Out of Tolerance */}
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {item.tx1_out_of_tolerance === '√' ? '√' : ''}
                  </td>
                  {/* TX2 Hasil PD */}
                  <td className="border border-black px-1 py-1 text-center">
                    {val(item.tx2_hasil_pd)}
                  </td>
                  {/* TX2 In Tolerance */}
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {item.tx2_in_tolerance === '√' ? '√' : ''}
                  </td>
                  {/* TX2 Out of Tolerance */}
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {item.tx2_out_of_tolerance === '√' ? '√' : ''}
                  </td>
                  {/* Keterangan */}
                  <td className="border border-black px-1 py-1">
                    {val(item.keterangan)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ─── Signature footer (mirrors CNSD/TFP print pattern) ─── */}
        <div className="mt-2 border border-black">
          <div className="flex">
            {/* Teknisi Pelaksana column — table with No / Nama / Paraf */}
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">
                Teknisi Pelaksana
              </div>
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-black px-1 py-1 w-7 text-center">No</th>
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
                        <td className="border border-black px-1 py-1 text-center align-middle h-10">
                          {tech.technician_signature ? (
                            <img
                              src={tech.technician_signature}
                              alt={`TTD ${tech.technician_name}`}
                              className="mx-auto max-h-9 max-w-[90px] object-contain"
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
            <div className="flex w-[24%] flex-col items-center border-r border-black p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Supervisor</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor_name ? (
                  record.supervisor_signature ? (
                    <img
                      src={record.supervisor_signature}
                      alt="TTD Supervisor"
                      className="max-h-16 max-w-[130px] object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-gray-400 italic">Belum TTD</span>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Tidak ada supervisor pada shift ini
                  </span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">
                {record.supervisor_name ?? '—'}
              </div>
            </div>

            {/* Manager Teknik column */}
            <div className="flex w-[24%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager_name ? (
                  record.manager_signature ? (
                    <img
                      src={record.manager_signature}
                      alt="TTD Manager Teknik"
                      className="max-h-16 max-w-[130px] object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-gray-400 italic">Belum TTD</span>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Manager Teknik tidak ditugaskan
                  </span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">
                {record.manager_name ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
