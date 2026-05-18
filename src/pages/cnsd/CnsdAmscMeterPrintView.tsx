import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { cnsdAmscMeterService } from '@/services/cnsdAmscMeterService';
import type { CnsdAmscMeterRecordDetail } from '@/types/cnsdAmsc';

/**
 * CNSD AMSC Meter Reading Print View.
 *
 * Layout follows the official AMSC paper form:
 * - Header: AirNav logo left, Perum LPPNPI right
 * - Title: METER READING — AMSC
 * - Equipment info: Merk, Type, SN
 * - Tables: Front Panel, Power Supply Unit, Channel AMSC, Lingkungan Kerja
 * - Signature footer: Teknisi + Supervisor + Manager Teknik
 *
 * Print is manual only — no auto-print.
 */
export const CnsdAmscMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdAmscMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    cnsdAmscMeterService.getRecord(Number(id)).then((data) => {
      setRecord(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat...</div>;
  if (!record) return <div className="p-8 text-center text-red-600">Form tidak ditemukan.</div>;

  const frontPanelItems = record.items.filter((it) => it.section_code === '1');
  const powerSupplyItems = record.items.filter((it) => it.section_code === '2');
  const channelItems = record.items.filter((it) => it.section_code === '3');
  const envItems = record.items.filter((it) => it.section_code === '4');

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Toolbar (hidden on print) */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/cnsd/amsc-meter/${record.id}`)} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          <Printer size={16} /> Print PDF
        </button>
      </div>

      {/* Print content */}
      <div className="max-w-[210mm] mx-auto p-6 print:p-4 print:max-w-none text-[10px] leading-tight">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/assets/icon/logoairnav.svg" alt="AirNav Indonesia" className="h-12 w-auto" />
            <div>
              <p className="font-bold text-xs">AirNav Indonesia</p>
              <p className="text-[9px] text-slate-600">FAS CNS & OTOMASI</p>
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-600">
            <p className="font-bold text-xs">Perum LPPNPI</p>
            <p>KANTOR CABANG SURABAYA</p>
            <p>Telp: (031)8686456 Fax: (031) 8686536</p>
            <p>email: sby@airnavindonesia.co.id</p>
            <p>Web: www.airnavindonesia.co.id</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-sm font-bold">METER READING</h1>
          <div className="inline-block border-2 border-black px-6 py-1 mt-1">
            <span className="text-base font-bold">AMSC</span>
          </div>
        </div>

        {/* Form info */}
        <div className="flex justify-between mb-3 text-[9px]">
          <div>
            <p><strong>LOKASI</strong> : {record.location}</p>
            <p><strong>TANGGAL</strong> : {formatDate(record.date)}</p>
          </div>
          <div className="text-right">
            <p><strong>MERK</strong> : {record.merk}</p>
            <p><strong>TYPE</strong> : {record.type}</p>
            <p><strong>S N</strong> : {record.serial_number ?? '-'}</p>
          </div>
        </div>

        {/* Section 1: Front Panel */}
        <table className="w-full border-collapse border border-gray-400 mb-3">
          <thead>
            <tr className="bg-green-100">
              <th className="border border-gray-400 px-1 py-1 w-8">NO</th>
              <th className="border border-gray-400 px-1 py-1 text-left">PEMBACAAN METER READING</th>
              <th className="border border-gray-400 px-1 py-1 w-20">NOMINAL</th>
              <th className="border border-gray-400 px-1 py-1 w-14" colSpan={2}>HASIL</th>
              <th className="border border-gray-400 px-1 py-1 w-24">KETERANGAN</th>
            </tr>
            <tr className="bg-green-50">
              <th className="border border-gray-400 px-1 py-0.5" colSpan={3}></th>
              <th className="border border-gray-400 px-1 py-0.5 w-14 text-center">A</th>
              <th className="border border-gray-400 px-1 py-0.5 w-14 text-center">B</th>
              <th className="border border-gray-400 px-1 py-0.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50 font-bold">
              <td className="border border-gray-400 px-1 py-1 text-center">1</td>
              <td className="border border-gray-400 px-1 py-1" colSpan={5}>FRONT PANEL</td>
            </tr>
            {frontPanelItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-1 py-0.5 text-center"></td>
                <td className="border border-gray-400 px-1 py-0.5">{item.item_name}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.nominal}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.hasil_a ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.hasil_b ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5">{item.keterangan ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 2: Power Supply Unit */}
        <table className="w-full border-collapse border border-gray-400 mb-3">
          <thead>
            <tr className="bg-green-100">
              <th className="border border-gray-400 px-1 py-1 w-8">NO</th>
              <th className="border border-gray-400 px-1 py-1 text-left">PEMBACAAN METER READING</th>
              <th className="border border-gray-400 px-1 py-1 w-20 bg-slate-600 text-white">Standart</th>
              <th className="border border-gray-400 px-1 py-1 w-20">HASIL</th>
              <th className="border border-gray-400 px-1 py-1 w-24">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50 font-bold">
              <td className="border border-gray-400 px-1 py-1 text-center">2</td>
              <td className="border border-gray-400 px-1 py-1" colSpan={4}>POWER SUPPLY UNIT</td>
            </tr>
            {powerSupplyItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-1 py-0.5 text-center"></td>
                <td className="border border-gray-400 px-1 py-0.5">{item.item_name}</td>
                <td className="border border-gray-400 px-1 py-0.5 bg-slate-300"></td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.hasil ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5">{item.keterangan ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 3: Channel AMSC */}
        <table className="w-full border-collapse border border-gray-400 mb-3">
          <thead>
            <tr className="bg-green-100">
              <th className="border border-gray-400 px-1 py-1 w-8">NO</th>
              <th className="border border-gray-400 px-1 py-1 text-left">PEMBACAAN METER READING</th>
              <th className="border border-gray-400 px-1 py-1 w-20">ADDRESS</th>
              <th className="border border-gray-400 px-1 py-1 w-14">STATUS</th>
              <th className="border border-gray-400 px-1 py-1 w-14">CCT</th>
              <th className="border border-gray-400 px-1 py-1 w-28">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50 font-bold">
              <td className="border border-gray-400 px-1 py-1 text-center">3</td>
              <td className="border border-gray-400 px-1 py-1" colSpan={5}>CHANNEL AMSC</td>
            </tr>
            {channelItems.map((item) => (
              <tr key={item.id} className={item.status_value === 'U/S' ? 'bg-red-50' : ''}>
                <td className="border border-gray-400 px-1 py-0.5 text-center"></td>
                <td className="border border-gray-400 px-1 py-0.5">{item.item_name}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center font-mono text-[8px]">{item.address ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.status_value ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.cct ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5">{item.keterangan ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 4: Lingkungan Kerja */}
        <table className="w-full border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-green-100">
              <th className="border border-gray-400 px-1 py-1 w-8">NO</th>
              <th className="border border-gray-400 px-1 py-1 text-left">KEGIATAN</th>
              <th className="border border-gray-400 px-1 py-1 w-20">Nominal</th>
              <th className="border border-gray-400 px-1 py-1 w-24">HASIL PEMERIKSAAN</th>
              <th className="border border-gray-400 px-1 py-1 w-28">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {envItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.item_number}</td>
                <td className="border border-gray-400 px-1 py-0.5">{item.item_name}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.nominal}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">{item.hasil ?? ''}</td>
                <td className="border border-gray-400 px-1 py-0.5">{item.keterangan ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signature Footer */}
        <div className="flex gap-4 mt-6">
          {/* Teknisi */}
          <div className="flex-1">
            <p className="font-bold text-center mb-2">TEKNISI</p>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 w-6">No</th>
                  <th className="border border-gray-400 px-1 py-1">Nama</th>
                  <th className="border border-gray-400 px-1 py-1 w-16">Paraf</th>
                </tr>
              </thead>
              <tbody>
                {record.technicians.map((t, idx) => (
                  <tr key={t.id}>
                    <td className="border border-gray-400 px-1 py-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-400 px-1 py-2">{t.technician_name}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">
                      {t.signature ? (
                        <img src={t.signature} alt="TTD" className="h-6 mx-auto" />
                      ) : (
                        <span className="text-[8px] italic text-slate-400">Belum TTD</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Pad to at least 5 rows */}
                {Array.from({ length: Math.max(0, 5 - record.technicians.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-400 px-1 py-2 text-center">{record.technicians.length + i + 1}</td>
                    <td className="border border-gray-400 px-1 py-2"></td>
                    <td className="border border-gray-400 px-1 py-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Supervisor */}
          <div className="w-[24%] text-center">
            <p className="font-bold mb-2">SUPERVISOR</p>
            <div className="border border-dashed border-gray-400 h-20 flex items-center justify-center">
              {record.supervisor?.signature ? (
                <img src={record.supervisor.signature} alt="TTD Supervisor" className="h-14 mx-auto" />
              ) : record.supervisor ? (
                <span className="text-[8px] italic text-slate-400">Belum TTD</span>
              ) : (
                <span className="text-[8px] italic text-slate-400">Tidak ada supervisor</span>
              )}
            </div>
            {record.supervisor && <p className="text-[9px] mt-1">{record.supervisor.name}</p>}
          </div>

          {/* Manager Teknik */}
          <div className="w-[24%] text-center">
            <p className="font-bold mb-2">MANAGER TEKNIK</p>
            <div className="border border-dashed border-gray-400 h-20 flex items-center justify-center">
              {record.manager?.signature ? (
                <img src={record.manager.signature} alt="TTD Manager" className="h-14 mx-auto" />
              ) : record.manager ? (
                <span className="text-[8px] italic text-slate-400">Belum TTD</span>
              ) : (
                <span className="text-[8px] italic text-slate-400">Tidak ditugaskan</span>
              )}
            </div>
            {record.manager && <p className="text-[9px] mt-1">{record.manager.name}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
