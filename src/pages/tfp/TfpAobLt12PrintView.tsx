import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/common/Button";
import { tfpAobLt12Service } from "@/services/tfpAobLt12Service";
import type {
  TfpAobLt12RecordDetail,
  TfpAobLt12Item,
  TfpAobLt12Facility,
} from "@/types/tfpAobLt12";

// Column key map
type ItemColKey =
  | "panel_a05_app_room"
  | "panel_a06_app_room"
  | "panel_a07_app_room"
  | "panel_a08_gudang_lt1"
  | "panel_a22_gudang_lt1"
  | "panel_a09_amsc_room";

const ALL_COL_KEYS: ItemColKey[] = [
  "panel_a05_app_room",
  "panel_a06_app_room",
  "panel_a07_app_room",
  "panel_a08_gudang_lt1",
  "panel_a22_gudang_lt1",
  "panel_a09_amsc_room",
];

// Helpers
const isDisabled = (item: TfpAobLt12Item, colKey: ItemColKey): boolean =>
  item.is_disabled_map?.[colKey] === true;

const formatDate = (v?: string | null): string => {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const renderPrintCell = (item: TfpAobLt12Item, colKey: ItemColKey): React.ReactElement => {
  if (isDisabled(item, colKey)) {
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }
  const v = item[colKey as keyof TfpAobLt12Item] as string | null;
  return (
    <td className="border border-black px-1 py-1 text-center text-[9px]">
      {v ?? ""}
    </td>
  );
};

// Main print view component
export const TfpAobLt12PrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpAobLt12RecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await tfpAobLt12Service.getRecord(Number(id));
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
        <Button variant="outline" onClick={() => navigate("/tfp/aob-lt12")}>
          Kembali
        </Button>
      </div>
    );
  }

  const items = record.items;
  const facilities = record.facilities;

  const maxRows = Math.max(items.length, facilities.length);
  const padded: { item: TfpAobLt12Item | null; facility: TfpAobLt12Facility | null }[] = [];
  for (let i = 0; i < maxRows; i++) {
    padded.push({
      item: items[i] ?? null,
      facility: facilities[i] ?? null,
    });
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 8mm 8mm; }
            body { background: white !important; }
            .print-hide { display: none !important; }
          }
        `}
      </style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[290mm] items-center justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/tfp/aob-lt12/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* A4 landscape paper */}
      <div className="mx-auto max-w-[290mm] bg-white font-sans text-[10px] print:mx-0 print:w-full print:max-w-none">

        {/* Kop */}
        <div className="grid grid-cols-[40%_30%_30%] items-center mb-2 px-2 pt-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="text-[14px] font-black leading-tight">AirNav Indonesia</div>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-black leading-tight">
              Performance Check AOB Lantai 1 &amp; 2
            </div>
          </div>
          <div className="text-right text-[10px] font-bold leading-tight">
            <div>Perum LPPNPI</div>
            <div>Cabang Surabaya</div>
            <div>Teknik Fasilitas Penunjang</div>
          </div>
        </div>

        {/* Main table */}
        <table className="w-full border-collapse text-[9px] mx-auto" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "18px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "38px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "45px" }} />
            <col style={{ width: "80px" }} />
          </colgroup>
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">No.</th>
              <th className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Parameter</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 05 APP Room</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 06 APP Room</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 07 APP Room</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 08 Gudang Lt 1</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 22 Gudang Lt 1</th>
              <th className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">Panel A 09 AMSC Room</th>
              <th className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Nama Fasilitas</th>
              <th className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Kondisi</th>
              <th className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {padded.map((row, idx) => {
              const item = row.item;
              const facility = row.facility;
              return (
                <tr key={`row-${idx}`}>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">
                    {item ? idx + 1 : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {item ? (
                      <>
                        {item.parameter_name}
                        {item.unit ? ` ( ${item.unit} )` : ""}
                      </>
                    ) : null}
                  </td>
                  {item
                    ? ALL_COL_KEYS.map((colKey) => (
                        <React.Fragment key={`${item.id}-${colKey}`}>
                          {renderPrintCell(item, colKey)}
                        </React.Fragment>
                      ))
                    : Array.from({ length: 6 }).map((_, i) => (
                        <td key={`pad-${i}`} className="border border-black px-1 py-1" />
                      ))}
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {facility ? facility.facility_name : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">
                    {facility?.kondisi ?? ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {facility?.keterangan ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Waktu Pelaksanaan */}
        <table className="w-full border-collapse text-[9px] mt-0">
          <tbody>
            <tr className="bg-blue-100">
              <td className="border border-black px-2 py-1 text-center font-bold w-[15%]">
                Waktu Pelaksanaan
              </td>
              <td className="border border-black px-2 py-1 font-bold w-[7%]">Hari :</td>
              <td className="border border-black px-2 py-1 w-[16%]">{record.day_name ?? ""}</td>
              <td className="border border-black px-2 py-1 font-bold w-[8%]">Tanggal :</td>
              <td className="border border-black px-2 py-1 w-[18%]">{formatDate(record.date)}</td>
              <td className="border border-black px-2 py-1 font-bold w-[6%]">Jam :</td>
              <td className="border border-black px-2 py-1">{record.time_filled ?? ""}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature footer */}
        <div className="mt-0 border border-black border-t-0">
          <div className="flex">
            {/* Teknisi column */}
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">
                Teknisi
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
                          {tech.signature ? (
                            <img
                              src={tech.signature}
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
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img
                      src={record.supervisor.signature}
                      alt="TTD Supervisor"
                      className="max-h-16 max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="h-16 w-28 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Tidak ada supervisor pada shift ini
                  </span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">
                {record.supervisor?.name ?? "—"}
              </div>
            </div>

            {/* Manager Teknik column */}
            <div className="flex w-[24%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (
                  record.manager.signature ? (
                    <img
                      src={record.manager.signature}
                      alt="TTD Manager Teknik"
                      className="max-h-16 max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="h-16 w-28 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">
                    Manager Teknik tidak ditugaskan
                  </span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">
                {record.manager?.name ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        <div className="mt-1 flex justify-between text-[8px] text-slate-700 px-1 pb-3">
          <span>(*) Coret yang tidak perlu</span>
          <span>Kondisi : (v) Baik / Normal</span>
        </div>
      </div>
    </div>
  );
};
