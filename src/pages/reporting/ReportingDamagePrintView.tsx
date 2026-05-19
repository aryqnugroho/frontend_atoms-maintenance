import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { reportingDamageReportService } from '@/services/reportingDamageReportService';
import { OBSTACLE_CODE_LABELS, OBSTACLE_CODE_ORDER } from '@/types/reporting';
import type { ReportingDamageReportDetail } from '@/types/reporting';

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  try {
    return new Date(v).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return v;
  }
};

const formatDateTime = (v?: string | null): string => {
  if (!v) return '-';
  try {
    return new Date(v).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return v;
  }
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '-' : v);

/**
 * ReportingDamagePrintView — Laporan Kerusakan formal print layout.
 *
 * Frontend-only HTML print. No backend PDF generation. Print is MANUAL only —
 * no auto-print on mount. The print toolbar is hidden via @media print.
 *
 * Layout mirrors the official AirNav Indonesia LAPORAN KERUSAKAN paper form:
 *   - Kop: AirNav logo (left), title "LAPORAN KERUSAKAN" (center)
 *   - Body: 13-row table (NO | URAIAN | DATA)
 *   - Kode hambatan list with selected indicator
 *   - Footer: Manager (left) | Pelaksana (right) signatures
 */
export const ReportingDamagePrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ReportingDamageReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await reportingDamageReportService.getReport(Number(id));
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
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Laporan tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/reporting')}>
          Kembali
        </Button>
      </div>
    );
  }

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
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/reporting/damage-reports/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* A4 paper */}
      <div className="mx-auto max-w-[210mm] border border-black bg-white font-sans text-[11px] print:mx-0 print:w-full print:max-w-none print:border-0">
        {/* Kop */}
        <div className="flex border-b border-black">
          {/* Left: AirNav logo */}
          <div className="flex w-[35%] items-center gap-2 border-r border-black p-3">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="leading-tight">
              <div className="text-[12px] font-black">AirNav Indonesia</div>
              <div className="text-[9px] font-semibold text-gray-600">PERUM LPPNPI</div>
              <div className="text-[9px] font-semibold text-gray-600">Cabang Surabaya</div>
            </div>
          </div>

          {/* Center: title */}
          <div className="flex flex-1 flex-col items-center justify-center border-r border-black px-2 py-3 text-center">
            <div className="text-[16px] font-black uppercase tracking-wide">
              Laporan Kerusakan
            </div>
            <div className="mt-1 text-[10px] font-semibold text-gray-600 uppercase">
              Damage Report
            </div>
          </div>

          {/* Right: form identity */}
          <div className="flex w-[28%] flex-col items-center justify-center px-2 py-3 text-center">
            <div className="text-[9px] font-semibold text-gray-500 uppercase">No. Surat</div>
            <div className="text-[14px] font-black break-all">{record.report_number}</div>
            <div className="text-[8px] text-gray-500 mt-0.5 capitalize">{record.status}</div>
          </div>
        </div>

        {/* Body table */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100 text-[10px] font-bold uppercase">
              <th className="border border-black px-2 py-1 w-10 text-center">No.</th>
              <th className="border border-black px-2 py-1 w-[35%] text-left">Uraian</th>
              <th className="border border-black px-2 py-1 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            <BodyRow no={1} label="Tanggal / Bulan / Tahun">
              <span className="font-semibold">
                {record.day_name ? `${record.day_name}, ` : ''}
                {formatDate(record.report_date)}
              </span>
            </BodyRow>
            <BodyRow no={2} label="Lokasi">{val(record.location)}</BodyRow>
            <BodyRow no={3} label="Fasilitas">{val(record.facility)}</BodyRow>
            <BodyRow no={4} label="Nama Peralatan">{val(record.equipment_name)}</BodyRow>
            <BodyRow no={5} label="Bagian/Modul Peralatan">{val(record.equipment_module)}</BodyRow>
            <BodyRow no={6} label="Kategori Kerusakan">
              <span className="font-semibold">{record.damage_category}</span>
            </BodyRow>
            <BodyRow no={7} label="Uraian Kerusakan">
              <span className="whitespace-pre-line">{val(record.damage_description)}</span>
            </BodyRow>
            <BodyRow no={8} label="Tindakan Perbaikan">
              <div className="space-y-1">
                <span className="whitespace-pre-line">{val(record.repair_action)}</span>
                {record.repair_by_type && (
                  <div className="mt-1 text-[10px]">
                    <strong>Oleh:</strong>{' '}
                    <span className="capitalize font-semibold">{record.repair_by_type}</span>
                  </div>
                )}
              </div>
            </BodyRow>
            <BodyRow no={9} label="Penyebab Kerusakan">
              <span className="whitespace-pre-line">{val(record.damage_cause)}</span>
            </BodyRow>
            <BodyRow no={10} label="Tgl. Kerusakan / Jam Kerusakan">
              {formatDateTime(record.damage_started_at)}
            </BodyRow>
            <BodyRow no={11} label="Tgl. Selesai Perbaikan / Jam Selesai Perbaikan">
              {formatDateTime(record.repair_finished_at)}
            </BodyRow>
            <BodyRow no={12} label="Jumlah Jam Operasi Terputus">
              {record.downtime_hours !== null && record.downtime_hours !== undefined
                ? `${Number(record.downtime_hours).toFixed(2)} jam`
                : '-'}
            </BodyRow>
            <tr className="align-top">
              <td className="border border-black px-2 py-1 text-center font-semibold">13</td>
              <td className="border border-black px-2 py-1 align-top">Kode Hambatan</td>
              <td className="border border-black px-2 py-1">
                <ObstacleCodeBox
                  selected={record.obstacle_code}
                  alasanLain={record.obstacle_description}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer signatures */}
        <div className="border-t border-black">
          <div className="flex">
            {/* Left: Manager Teknik */}
            <div className="flex w-1/2 flex-col items-center border-r border-black p-3 text-center min-h-[180px]">
              <div className="text-[10px] font-bold mb-1">Mengetahui,</div>
              <div className="text-[10px] font-black uppercase mb-2">Manager Teknik</div>

              <div className="flex flex-1 items-center justify-center w-full">
                {record.manager ? (
                  record.manager.signature ? (
                    <img
                      src={record.manager.signature}
                      alt="TTD Manager"
                      className="max-h-20 max-w-[160px] object-contain"
                    />
                  ) : (
                    <div className="h-16 w-32 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400 italic">
                      Belum TTD
                    </div>
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Manager Teknik tidak ditugaskan
                  </span>
                )}
              </div>

              <div className="mt-2 w-full border-t border-black pt-1">
                <div className="text-[11px] font-semibold">
                  ({record.manager?.name ?? '—'})
                </div>
                {record.manager?.signed_at && (
                  <div className="text-[8px] text-gray-500">
                    {formatDateTime(record.manager.signed_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pelaksana Perbaikan list */}
            <div className="flex w-1/2 flex-col p-3 min-h-[180px]">
              <div className="text-[10px] font-black uppercase mb-1 text-center">
                Pelaksana Perbaikan
              </div>
              <div className="text-[9px] font-semibold mb-2 text-center text-gray-600">
                Teknisi Telekomunikasi
              </div>

              {record.repairers.length === 0 ? (
                <p className="text-center text-[10px] text-gray-400 italic">
                  Tidak ada pelaksana
                </p>
              ) : (
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-1 py-0.5 w-6 text-center">No</th>
                      <th className="border border-black px-1 py-0.5 text-left">Nama Pelaksana</th>
                      <th className="border border-black px-1 py-0.5 w-20 text-center">Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.repairers.map((r, idx) => (
                      <tr key={r.id ?? idx} className="align-middle">
                        <td className="border border-black px-1 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-1 py-0.5">
                          <span className="font-medium">{r.person_name}</span>
                          {r.person_role && (
                            <span className="block text-[8px] text-gray-500">
                              {r.person_role}
                            </span>
                          )}
                        </td>
                        <td className="border border-black px-1 py-0.5 text-center align-middle h-10">
                          {r.signature ? (
                            <img
                              src={r.signature}
                              alt={`TTD ${r.person_name}`}
                              className="mx-auto max-h-9 max-w-[70px] object-contain"
                            />
                          ) : (
                            <span className="text-[8px] text-gray-400 italic">Belum TTD</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BodyRow: React.FC<{
  no: number;
  label: string;
  children: React.ReactNode;
}> = ({ no, label, children }) => (
  <tr className="align-top">
    <td className="border border-black px-2 py-1 text-center font-semibold">{no}</td>
    <td className="border border-black px-2 py-1">{label}</td>
    <td className="border border-black px-2 py-1">{children}</td>
  </tr>
);

const ObstacleCodeBox: React.FC<{
  selected: string | null;
  alasanLain?: string | null;
}> = ({ selected, alasanLain }) => (
  <div className="space-y-1.5">
    <div className="grid grid-cols-1 gap-x-3 gap-y-0.5">
      {OBSTACLE_CODE_ORDER.map((code) => {
        const isSelected = selected === code;
        const labelExtra = code === 'AL' ? ' (Jelaskan)' : '';
        return (
          <div
            key={code}
            className={`flex items-start gap-1.5 ${
              isSelected ? 'font-bold text-black' : 'text-gray-700'
            }`}
          >
            <span
              className={`inline-flex h-3 w-3 items-center justify-center border border-black shrink-0 mt-0.5 ${
                isSelected ? 'bg-black' : 'bg-white'
              }`}
              aria-hidden="true"
            >
              {isSelected && <span className="text-white text-[8px] leading-none">✓</span>}
            </span>
            <span className="text-[10px]">
              <strong>{code}</strong> - {OBSTACLE_CODE_LABELS[code]}
              {labelExtra}
            </span>
          </div>
        );
      })}
    </div>
    {selected === 'AL' && alasanLain && (
      <div className="mt-2 border-t border-gray-300 pt-1.5">
        <div className="text-[9px] font-semibold text-gray-600 uppercase">Alasan Lain:</div>
        <div className="text-[10px] whitespace-pre-line">{alasanLain}</div>
      </div>
    )}
  </div>
);
