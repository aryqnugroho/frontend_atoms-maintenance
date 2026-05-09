import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockWorkOrders } from '@/data/mockData';
import { Loader2 } from 'lucide-react';

export const WorkOrderPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workOrder = mockWorkOrders.find((w) => w.id === Number(id));

  useEffect(() => {
    if (workOrder) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [workOrder]);


  if (!workOrder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
      </div>
    );
  }

  const shiftUpper = workOrder.shift_type.toUpperCase();

  return (
    <div className="bg-white min-h-screen text-black w-full print:bg-white p-4 print:p-0">
      {/* Hide on print controls */}
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden flex justify-between">
        <button
          onClick={() => navigate('/work-orders')}
          className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium"
        >
          Kembali
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-indigo-700 text-sm font-medium shadow-sm"
        >
          Print PDF
        </button>
      </div>

      {/* A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:w-full print:mx-0 font-sans text-sm border border-black print:border-none">
        
        {/* Header */}
        <div className="flex border-b border-black">
          <div className="w-[30%] border-r border-black p-4 flex items-center justify-center">
            <img src="/assets/icon/logoairnav.svg" alt="AirNav" className="h-16" />
            <div className="ml-2 text-[10px] font-bold leading-tight">
              <div>PERUM LPPNPI</div>
              <div>Cabang Surabaya</div>
            </div>
          </div>
          <div className="w-[70%] flex items-center justify-center">
            <h1 className="text-xl font-bold uppercase tracking-wide">MAINTENANCE REQUEST & WORK ORDER</h1>
          </div>
        </div>

        {/* Tertuju */}
        <div className="bg-gray-200 border-b border-black text-center font-bold py-1">
          Tertuju : {workOrder.division}
        </div>

        {/* Info Grid */}
        <div className="flex border-b border-black">
          <div className="w-[60%] border-r border-black p-2 min-h-[80px]">
            <div className="font-bold text-xs mb-1">
              Shift Dinas : {shiftUpper === 'PAGI' ? <u>PAGI</u> : 'PAGI'} / {shiftUpper === 'SIANG' ? <u>SIANG</u> : 'SIANG'} / {shiftUpper === 'MALAM' ? <u>MALAM</u> : 'MALAM'}
            </div>
            <div className="font-bold text-xs mb-1">Nama Personil :</div>
            <div className="pl-4 text-xs font-medium">
              {workOrder.personnel.map((p, idx) => (
                <div key={idx}>{idx + 1}. {p.name}</div>
              ))}
              {workOrder.personnel.length === 0 && <div>1. -</div>}
            </div>
          </div>
          <div className="w-[40%] p-2 font-bold text-xs">
            <div className="grid grid-cols-[60px_1fr] gap-1 mb-1">
              <div>Tanggal</div>
              <div>: {workOrder.shift_date}</div>
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-1">
              <div>Jam</div>
              <div>: {workOrder.start_time || '.......'}</div>
            </div>
          </div>
        </div>

        {/* Diskripsi */}
        <div className="border-b border-black p-2 h-[200px]">
          <div className="font-bold text-xs mb-2">Diskripsi Perintah :</div>
          <div className="text-sm whitespace-pre-wrap px-2">{workOrder.description}</div>
        </div>

        {/* Output */}
        <div className="border-b border-black p-2 flex items-center gap-6 text-xs font-bold">
          <div>Output :</div>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={workOrder.output_types.includes('meter_reading')} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            Lembar Meter Reading
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={workOrder.output_types.includes('status_peralatan')} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            Status Peralatan
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={workOrder.output_types.includes('logbook')} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            Pencatatan Logbook
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={workOrder.output_types.includes('other')} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            {workOrder.output_other || '........................'}
          </label>
        </div>

        {/* Signatures Top */}
        <div className="flex border-b border-black h-[100px] text-center font-bold text-xs">
          <div className="w-1/3 border-r border-black p-2 relative flex flex-col items-center">
            MANAGER TEKNIK
            {/* Mock signature placeholder if completed */}
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.manager_name_snapshot}</div>}
          </div>
          <div className="w-1/3 border-r border-black p-2 relative flex flex-col items-center">
            SUPERVISOR
            {/* Mock signature placeholder if completed */}
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.supervisor_name_snapshot}</div>}
          </div>
          <div className="w-1/3 p-2 relative flex flex-col items-center">
            PELAKSANA
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.personnel[0]?.name}</div>}
          </div>
        </div>

        {/* Separator / Spacer */}
        <div className="border-b border-black h-6 bg-gray-50"></div>

        {/* Pelaksanaan Title */}
        <div className="bg-gray-200 border-b border-black text-center font-bold py-1 text-xs">
          Pelaksanaan
        </div>

        {/* Jam */}
        <div className="flex border-b border-black text-xs font-bold">
          <div className="w-1/2 border-r border-black p-1 pl-2">
            Jam Mulai : {workOrder.start_time || ''}
          </div>
          <div className="w-1/2 p-1 pl-2">
            Jam Selesai : {workOrder.end_time || ''}
          </div>
        </div>

        {/* Status Selesai */}
        <div className="flex border-b border-black text-xs font-bold divide-x divide-black">
          <div className="flex-1 p-2 flex items-center gap-2">
            <input type="radio" checked={workOrder.completion_status === 'selesai'} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            : Selesai
          </div>
          <div className="flex-1 p-2 flex items-center gap-2">
            <input type="radio" checked={workOrder.completion_status === 'belum_selesai_dilanjut'} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            : Belum Selesai dilanjut shift berikutnya
          </div>
          <div className="flex-1 p-2 flex items-center gap-2">
            <input type="radio" checked={workOrder.completion_status === 'tidak_bisa'} readOnly className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full" />
            : Tidak bisa dilaksanakan
          </div>
        </div>

        {/* Catatan/Kendala */}
        <div className="border-b border-black p-2 h-[120px]">
          <div className="font-bold text-xs mb-1">Catatan/Kendala :</div>
          <div className="text-sm px-2">{workOrder.notes_kendala}</div>
        </div>

        {/* Usulan */}
        <div className="border-b border-black p-2 h-[80px]">
          <div className="font-bold text-xs mb-1">Usulan :</div>
          <div className="text-sm px-2">{workOrder.notes_usulan}</div>
        </div>

        {/* Catatan Pemberi Tugas */}
        <div className="border-b border-black p-2 h-[80px]">
          <div className="font-bold text-xs mb-1">Catatan Pemberi Tugas :</div>
          <div className="text-sm px-2">{workOrder.notes_pemberi_tugas}</div>
        </div>

        {/* Signatures Bottom */}
        <div className="flex h-[100px] text-center font-bold text-xs">
          <div className="w-1/3 border-r border-black p-2 relative flex flex-col items-center">
            MANAGER TEKNIK
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.manager_name_snapshot}</div>}
          </div>
          <div className="w-1/3 border-r border-black p-2 relative flex flex-col items-center">
            SUPERVISOR
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.supervisor_name_snapshot}</div>}
          </div>
          <div className="w-1/3 p-2 relative flex flex-col items-center">
            PELAKSANA
            {workOrder.status === 'completed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 italic font-normal text-[10px]">Ttd. {workOrder.personnel[0]?.name}</div>}
          </div>
        </div>

      </div>
    </div>
  );
};
