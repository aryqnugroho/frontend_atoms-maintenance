import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpAobGroundService } from '@/services/tfpAobGroundService';
import type {
  TfpAobGroundRecordDetail,
  TfpAobGroundItem,
  TfpAobGroundFacility,
} from '@/types/tfpAobGround';

// ─── Column key map (matches backend item shape) ──────────────

type ItemColKey =
  | 'panel_cos_a03_input'
  | 'panel_cos_a03_output'
  | 'panel_ats_a12_input'
  | 'panel_ats_a12_output'
  | 'ups_tescom_a_input'
  | 'ups_tescom_a_output'
  | 'ups_tescom_b_input'
  | 'ups_tescom_b_output';

const ALL_COL_KEYS: ItemColKey[] = [
  'panel_cos_a03_input',
  'panel_cos_a03_output',
  'panel_ats_a12_input',
  'panel_ats_a12_output',
  'ups_tescom_a_input',
  'ups_tescom_a_output',
  'ups_tescom_b_input',
  'ups_tescom_b_output',
];

// ─── Helpers ──────────────────────────────────────────────────

const isDisabled = (item: TfpAobGroundItem, colKey: ItemColKey): boolean =>
  item.is_disabled_map?.[colKey] === true;

const isModeRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('mode');

const isSuplaiRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('suplai aktif');

const isSingleValueRow = (item: TfpAobGroundItem): boolean => {
  const name = item.parameter_name.toLowerCase();
  return name.startsWith('kwh') || name.startsWith('suhu eq');
};

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const val = (v: string | null | undefined): string =>
  v == null || v === '' ? '' : v;

/**
 * Decide what to render in a parameter/panel cell on print.
 * Returns either a "blocked" JSX (grey cell) or a normal cell with text.
 */
const renderPrintCell = (
  item: TfpAobGroundItem,
  colKey: ItemColKey,
): React.ReactElement => {
  // Hard disabled by template (grey cell, no value)
  if (isDisabled(item, colKey)) {
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  // Mode row — only COS input + ATS input show value
  if (isModeRow(item)) {
    if (colKey === 'panel_cos_a03_input' || colKey === 'panel_ats_a12_input') {
      const v =
        colKey === 'panel_cos_a03_input'
          ? item.panel_cos_a03_input
          : item.panel_ats_a12_input;
      return (
        <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">
          {v ? val(v) : 'Auto / Manual'}
        </td>
      );
    }
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  // Suplai Aktif row
  if (isSuplaiRow(item)) {
    if (colKey === 'panel_cos_a03_input') {
      const v = item.panel_cos_a03_input;
      return (
        <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">
          {v ? val(v) : 'PLN / UPS'}
        </td>
      );
    }
    if (colKey === 'panel_ats_a12_input') {
      const v = item.panel_ats_a12_input;
      return (
        <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">
          {v ? val(v) : 'PLN 1 / PLN 2'}
        </td>
      );
    }
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  // Single-value rows — only panel_cos_a03_input is active
  if (isSingleValueRow(item) && colKey !== 'panel_cos_a03_input') {
    return <td className="border border-black bg-gray-300 px-1 py-1" />;
  }

  const v = item[colKey] as string | null;
  return (
    <td className="border border-black px-1 py-1 text-center text-[10px]">
      {val(v)}
    </td>
  );
};

// ─── Main print view ──────────────────────────────────────────

/**
 * TFP Performance Check AOB Lantai Ground — Print View
 *
 * Frontend-only HTML print layout that mirrors the official paper form.
 *
 * Layout:
 *   - Kop: AirNav logo (left), AirNav Indonesia text, Perum LPPNPI Cabang Surabaya
 *     Teknik Fasilitas Penunjang (right), Performance Check AOB Lantai Ground title.
 *   - Single big table with parameter (left) + facility (right) merged into one row.
 *   - Header rows merged: panel headers span 2 columns (Input/Output).
 *   - Disabled cells rendered as grey (bg-gray-300) cells with no content.
 *   - Footer: Waktu Pelaksanaan (Hari/Tanggal/Jam) + Pelaksana Teknisi/Paraf/Supervisor/Manager Teknik.
 *
 * Print does NOT auto-fire — the user must click the Print PDF button. This
 * matches the CNSD pattern and avoids the React StrictMode double-effect issue.
 */
export const TfpAobGroundPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TfpAobGroundRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchRecord = async () => {
      try {
        const data = await tfpAobGroundService.getRecord(Number(id));
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
        <Button variant="outline" onClick={() => navigate('/tfp/aob-ground')}>
          Kembali
        </Button>
      </div>
    );
  }

  const items = record.items;
  const facilities = record.facilities;

  // Compose unified row count: 22 rows (parameters + 1 future capacity for visual grid).
  // Reference image shows 22 rows on left side; our template = 21 rows (Suhu Ruang ARO removed).
  // Right column has up to 17 facilities. We'll render rows with parameter on left + facility on
  // right when available, blank cell when one side runs out.
  const maxRows = Math.max(items.length, facilities.length);

  // Pad arrays so left/right rows align by index
  const padded: { item: TfpAobGroundItem | null; facility: TfpAobGroundFacility | null }[] = [];
  for (let i = 0; i < maxRows; i++) {
    padded.push({
      item: items[i] ?? null,
      facility: facilities[i] ?? null,
    });
  }

  // Technicians render directly from record.technicians — no padding rows in
  // the new CNSD-style signature block.

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

      {/* ── Toolbar (screen only) ── */}
      <div className="print-hide mx-auto mb-4 flex max-w-[290mm] items-center justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/tfp/aob-ground/${record.id}`)}
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} />
          Print PDF
        </Button>
      </div>

      {/* ── A4 landscape paper ── */}
      <div className="mx-auto max-w-[290mm] bg-white font-sans text-[10px] print:mx-0 print:w-full print:max-w-none">

        {/* ─── Kop ─── */}
        <div className="grid grid-cols-[40%_30%_30%] items-center mb-2 px-2 pt-3">
          {/* Left: logo + name */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/icon/logoairnav.svg"
              alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="text-[14px] font-black leading-tight">AirNav Indonesia</div>
          </div>

          {/* Center: title */}
          <div className="text-center">
            <div className="text-[13px] font-black leading-tight">
              Performance Check AOB Lantai Ground
            </div>
          </div>

          {/* Right: identitas */}
          <div className="text-right text-[10px] font-bold leading-tight">
            <div>Perum LPPNPI</div>
            <div>Cabang Surabaya</div>
            <div>Teknik Fasilitas Penunjang</div>
          </div>
        </div>

        {/* ─── Main table (parameter + facility) ─── */}
        <table className="w-full border-collapse text-[9px] mx-auto" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22px' }} /> {/* No */}
            <col style={{ width: '110px' }} /> {/* Parameter */}
            <col style={{ width: '40px' }} /> <col style={{ width: '40px' }} /> {/* Panel COS */}
            <col style={{ width: '40px' }} /> <col style={{ width: '40px' }} /> {/* Panel ATS */}
            <col style={{ width: '36px' }} /> <col style={{ width: '36px' }} /> {/* UPS A */}
            <col style={{ width: '36px' }} /> <col style={{ width: '36px' }} /> {/* UPS B */}
            <col style={{ width: '120px' }} /> {/* Nama Fasilitas */}
            <col style={{ width: '50px' }} /> {/* Kondisi */}
            <col style={{ width: '90px' }} /> {/* Keterangan */}
          </colgroup>

          {/* Header rows: 2 levels */}
          <thead>
            <tr className="bg-blue-100">
              <th
                rowSpan={2}
                className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle"
              >
                No.
              </th>
              <th
                rowSpan={2}
                className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle"
              >
                Parameter
              </th>
              <th
                colSpan={2}
                className="border border-black px-1 py-0.5 text-center font-bold text-[9px]"
              >
                Panel COS (A 03)
              </th>
              <th
                colSpan={2}
                className="border border-black px-1 py-0.5 text-center font-bold text-[9px]"
              >
                Panel ATS (A 12)
              </th>
              <th
                colSpan={2}
                className="border border-black px-1 py-0.5 text-center font-bold text-[9px]"
              >
                UPS TESCOM A
              </th>
              <th
                colSpan={2}
                className="border border-black px-1 py-0.5 text-center font-bold text-[9px]"
              >
                UPS TESCOM B
              </th>
              <th
                rowSpan={2}
                className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle"
              >
                Nama Fasilitas
              </th>
              <th
                rowSpan={2}
                className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle"
              >
                Kondisi
              </th>
              <th
                rowSpan={2}
                className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle"
              >
                Keterangan
              </th>
            </tr>
            <tr className="bg-blue-50 italic">
              {/* Sub-headers Input/Output for 4 panel groups */}
              {[
                'Input',
                'Output',
                'Input',
                'Output',
                'Input',
                'Output',
                'Input',
                'Output',
              ].map((lbl, i) => (
                <th
                  key={i}
                  className="border border-black px-0.5 py-0.5 text-center font-semibold text-[8px]"
                >
                  {lbl}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body — parameter rows (left) + facility rows (right) */}
          <tbody>
            {padded.map((row, idx) => {
              const item = row.item;
              const facility = row.facility;
              return (
                <tr key={`row-${idx}`}>
                  {/* No. */}
                  <td className="border border-black px-1 py-1 text-center text-[9px]">
                    {item ? idx + 1 : ''}
                  </td>

                  {/* Parameter name */}
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {item ? (
                      <>
                        {item.parameter_name}
                        {item.unit ? ` ( ${item.unit} )` : ''}
                      </>
                    ) : null}
                  </td>

                  {/* 8 panel columns */}
                  {item
                    ? ALL_COL_KEYS.map((colKey) => (
                        <React.Fragment key={`${item.id}-${colKey}`}>
                          {renderPrintCell(item, colKey)}
                        </React.Fragment>
                      ))
                    : Array.from({ length: 8 }).map((_, i) => (
                        <td
                          key={`pad-${i}`}
                          className="border border-black px-1 py-1"
                        />
                      ))}

                  {/* Facility name */}
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {facility ? facility.facility_name : ''}
                  </td>

                  {/* Kondisi */}
                  <td className="border border-black px-1 py-1 text-center text-[9px]">
                    {facility?.kondisi ?? ''}
                  </td>

                  {/* Keterangan */}
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {facility?.keterangan ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ─── Waktu Pelaksanaan (full-width row) ─── */}
        <table className="w-full border-collapse text-[9px] mt-0">
          <tbody>
            <tr className="bg-blue-100">
              <td className="border border-black px-2 py-1 text-center font-bold w-[15%]">
                Waktu Pelaksanaan
              </td>
              <td className="border border-black px-2 py-1 font-bold w-[7%]">Hari :</td>
              <td className="border border-black px-2 py-1 w-[16%]">{record.day_name ?? ''}</td>
              <td className="border border-black px-2 py-1 font-bold w-[8%]">Tanggal :</td>
              <td className="border border-black px-2 py-1 w-[18%]">{formatDate(record.date)}</td>
              <td className="border border-black px-2 py-1 font-bold w-[6%]">Jam :</td>
              <td className="border border-black px-2 py-1">{record.time_filled ?? ''}</td>
            </tr>
          </tbody>
        </table>

        {/* ─── Signature footer (mirrors CNSD print pattern) ─── */}
        <div className="mt-0 border border-black border-t-0">
          <div className="flex">
            {/* Teknisi column — table with No / Nama / Paraf */}
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
                {record.supervisor?.name ?? '—'}
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
                {record.manager?.name ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        <div className="mt-1 flex justify-between text-[8px] text-slate-700 px-1 pb-3">
          <span>(*) Coret yang tidak perlu</span>
          <span>Kondisi : (√) Baik / Normal</span>
        </div>
      </div>
    </div>
  );
};
