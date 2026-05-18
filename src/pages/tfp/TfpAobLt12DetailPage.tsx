import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  Printer,
  Users,
  Calendar,
  Clock,
  Zap,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShiftBadge } from "@/components/common/ShiftBadge";
import { tfpAobLt12Service } from "@/services/tfpAobLt12Service";
import { TfpAobLt12SignaturePanel } from "./components/TfpAobLt12SignaturePanel";
import { cn } from "@/lib/utils";
import type { TfpAobLt12RecordDetail, TfpAobLt12Item } from "@/types/tfpAobLt12";

// Column definitions
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

const PANEL_LABELS: Record<ItemColKey, string> = {
  panel_a05_app_room: "Panel A 05 APP Room",
  panel_a06_app_room: "Panel A 06 APP Room",
  panel_a07_app_room: "Panel A 07 APP Room",
  panel_a08_gudang_lt1: "Panel A 08 Gudang Lt 1",
  panel_a22_gudang_lt1: "Panel A 22 Gudang Lt 1",
  panel_a09_amsc_room: "Panel A 09 AMSC Room",
};

// Helpers
const isDisabled = (item: TfpAobLt12Item, colKey: ItemColKey): boolean =>
  item.is_disabled_map?.[colKey] === true;

const isModeRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().startsWith("mode");

const isSuplaiRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().startsWith("suplai aktif");

const isSuhuAppRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().includes("suhu app");

const isSuhuAmscRow = (item: TfpAobLt12Item): boolean =>
  item.parameter_name.toLowerCase().includes("suhu amsc");

// CellInput component
interface CellInputProps {
  item: TfpAobLt12Item;
  colKey: ItemColKey;
  value: string;
  onChange: (val: string) => void;
  isCompleted: boolean;
}

const CellInput: React.FC<CellInputProps> = ({ item, colKey, value, onChange, isCompleted }) => {
  if (isDisabled(item, colKey)) {
    return <div className="w-full h-7 bg-slate-200 rounded" aria-hidden="true" />;
  }
  if (isCompleted) {
    return <span className="text-xs text-slate-700">{value || "—"}</span>;
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-7 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
    />
  );
};

// Main component
export const TfpAobLt12DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<TfpAobLt12RecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [itemValues, setItemValues] = useState<Record<number, Record<ItemColKey, string>>>({});
  const [facilityValues, setFacilityValues] = useState<
    Record<number, { kondisi: string; keterangan: string }>
  >({});

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await tfpAobLt12Service.getRecord(Number(id));
      setRecord(data);

      const iv: Record<number, Record<ItemColKey, string>> = {};
      data.items.forEach((item) => {
        iv[item.id] = {
          panel_a05_app_room: item.panel_a05_app_room ?? "",
          panel_a06_app_room: item.panel_a06_app_room ?? "",
          panel_a07_app_room: item.panel_a07_app_room ?? "",
          panel_a08_gudang_lt1: item.panel_a08_gudang_lt1 ?? "",
          panel_a22_gudang_lt1: item.panel_a22_gudang_lt1 ?? "",
          panel_a09_amsc_room: item.panel_a09_amsc_room ?? "",
        };
      });
      setItemValues(iv);

      const fv: Record<number, { kondisi: string; keterangan: string }> = {};
      data.facilities.forEach((f) => {
        fv[f.id] = {
          kondisi: f.kondisi ?? "Baik",
          keterangan: f.keterangan ?? "",
        };
      });
      setFacilityValues(fv);
    } catch {
      setErrorMessage("Gagal memuat data form. Coba refresh halaman.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  useEffect(() => {
    const onFocus = () => void fetchRecord();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchRecord]);

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const itemsPayload = record.items.map((item) => ({
        id: item.id,
        ...itemValues[item.id],
      }));
      const facilitiesPayload = record.facilities.map((f) => ({
        id: f.id,
        kondisi: facilityValues[f.id]?.kondisi ?? null,
        keterangan: facilityValues[f.id]?.keterangan ?? null,
      }));

      const updated = await tfpAobLt12Service.updateRecord(record.id, {
        items: itemsPayload,
        facilities: facilitiesPayload,
      });
      setRecord(updated);
      setSuccessMessage("Perubahan berhasil disimpan.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? "Gagal menyimpan perubahan.");
      } else {
        setErrorMessage("Gagal menyimpan perubahan. Coba lagi.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setItemCell = (itemId: number, colKey: ItemColKey, val: string) => {
    setItemValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [colKey]: val },
    }));
  };

  const setFacilityField = (facilityId: number, field: "kondisi" | "keterangan", val: string) => {
    setFacilityValues((prev) => ({
      ...prev,
      [facilityId]: { ...prev[facilityId], [field]: val },
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-slate-500">Form tidak ditemukan.</p>
        <Button onClick={() => navigate("/tfp/aob-lt12")} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isCompleted = record.status === "completed";

  return (
    <div className="max-w-full space-y-6 animate-fade-in pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate("/tfp")}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          TFP
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate("/tfp/aob-lt12")}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          Performance Check AOB Lantai 1 &amp; 2
        </button>
        <span>/</span>
        <span className="text-slate-700 font-mono font-medium">{record.form_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tfp/aob-lt12")}
              className="hover:bg-slate-100 mt-0.5"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">
                  Performance Check AOB Lantai 1 &amp; 2
                </h1>
                <StatusBadge status={record.status} variant="pill" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                TFP — Cabang Surabaya &nbsp;·&nbsp;
                <span className="font-mono">{record.form_number}</span>
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-medium">{record.day_name ?? ""}</span>
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Clock size={13} className="text-slate-400" />
              <span>{record.time_filled ?? "—"}</span>
            </div>
            <ShiftBadge shift={record.shift_type} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Users size={13} className="text-slate-400" />
              <span>{record.technicians.length} Teknisi TFP</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tfp/aob-lt12/${record.id}/print`)}
              className="gap-1.5 text-indigo-600 hover:bg-indigo-50"
            >
              <Printer size={15} />
              Print
            </Button>
          </div>
        </div>

        {/* Personnel summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Manager Teknik
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.manager?.name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Supervisor TFP
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.supervisor?.name ?? (
                <span className="text-slate-400 italic">Tidak ditugaskan</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              Pelaksana Teknisi TFP
            </span>
            <p className="mt-0.5 font-medium text-slate-700">
              {record.technicians.map((t) => t.technician_name).join(", ") || (
                <span className="text-slate-400 italic">—</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Error / Success messages */}
      {errorMessage && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Left panel: Parameter Pengukuran */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <Zap size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">Parameter Pengukuran</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[750px]" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "32px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
              </colgroup>
              <thead>
                <tr className="bg-sky-800 text-white">
                  <th className="px-2 py-2 text-center font-semibold border border-sky-700 text-xs w-8">No</th>
                  <th className="px-3 py-2 text-left font-semibold border border-sky-700 text-xs w-40">Parameter</th>
                  {ALL_COL_KEYS.map((colKey) => (
                    <th key={colKey} className="px-2 py-2 text-center font-semibold border border-sky-700 text-xs">
                      {PANEL_LABELS[colKey]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.items.map((item, idx) => {
                  const rowBase = idx % 2 === 0 ? "bg-white" : "bg-slate-50/40";

                  // Row: Mode
                  if (isModeRow(item)) {
                    const modeSelectCls = (val: string) =>
                      cn(
                        "w-full h-7 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-medium",
                        val === "Auto"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200"
                          : val === "Manual"
                          ? "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200"
                          : "bg-white border-slate-200 text-slate-700 focus:ring-slate-300",
                      );
                    return (
                      <tr key={item.id} className="bg-blue-50/40">
                        <td className="px-2 py-1.5 text-slate-400 font-mono text-center text-xs border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-700 text-xs border-r border-slate-100">
                          {item.parameter_name}
                          <span className="text-slate-400 ml-1 text-[10px]">(Auto/Manual)</span>
                        </td>
                        {(["panel_a05_app_room", "panel_a06_app_room", "panel_a07_app_room"] as ItemColKey[]).map((colKey) => {
                          const val = itemValues[item.id]?.[colKey] ?? "";
                          return (
                            <td key={colKey} className="px-1.5 py-1 border-l border-slate-100">
                              {isCompleted ? (
                                <span className="text-xs text-slate-700">{val || "—"}</span>
                              ) : (
                                <select
                                  value={val}
                                  onChange={(e) => setItemCell(item.id, colKey, e.target.value)}
                                  className={modeSelectCls(val)}
                                >
                                  <option value="">—</option>
                                  <option value="Auto">Auto</option>
                                  <option value="Manual">Manual</option>
                                </select>
                              )}
                            </td>
                          );
                        })}
                        {(["panel_a08_gudang_lt1", "panel_a22_gudang_lt1", "panel_a09_amsc_room"] as ItemColKey[]).map((colKey) => (
                          <td key={colKey} className="px-1.5 py-1 border-l border-slate-100 bg-slate-200" />
                        ))}
                      </tr>
                    );
                  }

                  // Row: Suplai Aktif
                  if (isSuplaiRow(item)) {
                    const suplaiSelectCls = (val: string) =>
                      cn(
                        "w-full h-7 px-1.5 text-xs rounded border focus:ring-1 focus:outline-none font-medium",
                        val === "PLN"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200"
                          : val === "UPS"
                          ? "bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-200"
                          : "bg-white border-slate-200 text-slate-700 focus:ring-slate-300",
                      );
                    return (
                      <tr key={item.id} className="bg-blue-50/40">
                        <td className="px-2 py-1.5 text-slate-400 font-mono text-center text-xs border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-700 text-xs border-r border-slate-100">
                          {item.parameter_name}
                        </td>
                        {(["panel_a05_app_room", "panel_a06_app_room", "panel_a07_app_room"] as ItemColKey[]).map((colKey) => {
                          const val = itemValues[item.id]?.[colKey] ?? "";
                          return (
                            <td key={colKey} className="px-1.5 py-1 border-l border-slate-100">
                              {isCompleted ? (
                                <span className="text-xs text-slate-700">{val || "—"}</span>
                              ) : (
                                <select
                                  value={val}
                                  onChange={(e) => setItemCell(item.id, colKey, e.target.value)}
                                  className={suplaiSelectCls(val)}
                                >
                                  <option value="">—</option>
                                  <option value="PLN">PLN</option>
                                  <option value="UPS">UPS</option>
                                </select>
                              )}
                            </td>
                          );
                        })}
                        {(["panel_a08_gudang_lt1", "panel_a22_gudang_lt1", "panel_a09_amsc_room"] as ItemColKey[]).map((colKey) => (
                          <td key={colKey} className="px-1.5 py-1 border-l border-slate-100 bg-slate-200" />
                        ))}
                      </tr>
                    );
                  }

                  // Row: Suhu APP Room
                  if (isSuhuAppRow(item)) {
                    const val = itemValues[item.id]?.panel_a05_app_room ?? "";
                    return (
                      <tr key={item.id} className={rowBase}>
                        <td className="px-2 py-1.5 text-slate-400 font-mono text-center text-xs border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-700 text-xs border-r border-slate-100">
                          {item.parameter_name}
                          {item.unit && (
                            <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>
                          )}
                        </td>
                        <td className="px-1.5 py-1 border-l border-slate-100">
                          {isCompleted ? (
                            <span className="text-xs text-slate-700">{val || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={val}
                              onChange={(e) => setItemCell(item.id, "panel_a05_app_room", e.target.value)}
                              className="w-full h-7 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                            />
                          )}
                        </td>
                        {(["panel_a06_app_room", "panel_a07_app_room", "panel_a08_gudang_lt1", "panel_a22_gudang_lt1", "panel_a09_amsc_room"] as ItemColKey[]).map((colKey) => (
                          <td key={colKey} className="px-1.5 py-1 border-l border-slate-100 bg-slate-200" />
                        ))}
                      </tr>
                    );
                  }

                  // Row: Suhu AMSC Room
                  if (isSuhuAmscRow(item)) {
                    const val = itemValues[item.id]?.panel_a09_amsc_room ?? "";
                    return (
                      <tr key={item.id} className={rowBase}>
                        <td className="px-2 py-1.5 text-slate-400 font-mono text-center text-xs border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-medium text-slate-700 text-xs border-r border-slate-100">
                          {item.parameter_name}
                          {item.unit && (
                            <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>
                          )}
                        </td>
                        {(["panel_a05_app_room", "panel_a06_app_room", "panel_a07_app_room", "panel_a08_gudang_lt1", "panel_a22_gudang_lt1"] as ItemColKey[]).map((colKey) => (
                          <td key={colKey} className="px-1.5 py-1 border-l border-slate-100 bg-slate-200" />
                        ))}
                        <td className="px-1.5 py-1 border-l border-slate-100">
                          {isCompleted ? (
                            <span className="text-xs text-slate-700">{val || "—"}</span>
                          ) : (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={val}
                              onChange={(e) => setItemCell(item.id, "panel_a09_amsc_room", e.target.value)}
                              className="w-full h-7 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-sky-400 focus:outline-none"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // Normal rows 1-17
                  return (
                    <tr key={item.id} className={rowBase}>
                      <td className="px-2 py-1.5 text-slate-400 font-mono text-center text-xs border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-1.5 font-medium text-slate-700 text-xs border-r border-slate-100">
                        {item.parameter_name}
                        {item.unit && (
                          <span className="text-slate-400 ml-1 text-[10px]">({item.unit})</span>
                        )}
                      </td>
                      {ALL_COL_KEYS.map((colKey) => (
                        <td
                          key={colKey}
                          className={cn(
                            "px-1.5 py-1 border-l border-slate-100",
                            isDisabled(item, colKey) ? "bg-slate-200" : "",
                          )}
                        >
                          <CellInput
                            item={item}
                            colKey={colKey}
                            value={itemValues[item.id]?.[colKey] ?? ""}
                            onChange={(val) => setItemCell(item.id, colKey, val)}
                            isCompleted={isCompleted}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: Kondisi Fasilitas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <CheckSquare size={16} className="text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800">Kondisi Fasilitas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_90px_1fr] gap-2 px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Nama Fasilitas</span>
              <span className="text-center">Kondisi</span>
              <span>Keterangan</span>
            </div>
            {record.facilities.map((facility, idx) => {
              const kondisi = facilityValues[facility.id]?.kondisi ?? "Baik";
              const isGood = kondisi === "Baik" || kondisi === "Normal";
              return (
                <div
                  key={facility.id}
                  className={cn(
                    "grid grid-cols-[1fr_90px_1fr] gap-2 px-4 py-2.5 items-center",
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                  )}
                >
                  <span className="text-xs font-medium text-slate-700">{facility.facility_name}</span>
                  {isCompleted ? (
                    <span
                      className={cn(
                        "text-xs font-semibold text-center",
                        isGood ? "text-emerald-700" : "text-red-700",
                      )}
                    >
                      {kondisi || "—"}
                    </span>
                  ) : (
                    <select
                      value={kondisi}
                      onChange={(e) => setFacilityField(facility.id, "kondisi", e.target.value)}
                      className={cn(
                        "w-full h-8 px-1.5 text-xs rounded border-none focus:ring-1 focus:outline-none font-semibold",
                        isGood
                          ? "bg-emerald-50 text-emerald-700 focus:ring-emerald-200"
                          : "bg-red-50 text-red-700 focus:ring-red-200",
                      )}
                    >
                      <option value="Baik">Baik</option>
                      <option value="Normal">Normal</option>
                      <option value="Tidak Baik">Tidak Baik</option>
                    </select>
                  )}
                  {isCompleted ? (
                    <span className="text-xs text-slate-600">
                      {facilityValues[facility.id]?.keterangan || "—"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={facilityValues[facility.id]?.keterangan ?? ""}
                      onChange={(e) => setFacilityField(facility.id, "keterangan", e.target.value)}
                      placeholder="Keterangan..."
                      className="h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none w-full"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>{/* end two-panel grid */}

      {/* Save button */}
      {!isCompleted && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-100"
          >
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      )}

      {/* Signature panel */}
      <TfpAobLt12SignaturePanel
        record={record}
        onUpdated={(updated) => {
          setRecord(updated);
          const iv: Record<number, Record<ItemColKey, string>> = {};
          updated.items.forEach((item) => {
            iv[item.id] = {
              panel_a05_app_room: item.panel_a05_app_room ?? "",
              panel_a06_app_room: item.panel_a06_app_room ?? "",
              panel_a07_app_room: item.panel_a07_app_room ?? "",
              panel_a08_gudang_lt1: item.panel_a08_gudang_lt1 ?? "",
              panel_a22_gudang_lt1: item.panel_a22_gudang_lt1 ?? "",
              panel_a09_amsc_room: item.panel_a09_amsc_room ?? "",
            };
          });
          setItemValues(iv);
        }}
      />
    </div>
  );
};
