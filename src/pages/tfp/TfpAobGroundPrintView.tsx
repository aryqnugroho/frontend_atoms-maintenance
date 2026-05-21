import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { tfpAobGroundService } from '@/services/tfpAobGroundService';
import type {
  TfpAobGroundRecordDetail,
  TfpAobGroundItem,
} from '@/types/tfpAobGround';

// ─── Helpers ──────────────────────────────────────────────────

const cellKeyOf = (panelId: string, subKey: string) => `${panelId}.${subKey}`;

const isModeRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('mode');

const isSuplaiRow = (item: TfpAobGroundItem): boolean =>
  item.parameter_name.toLowerCase().startsWith('suplai aktif');

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

// ─── Main print view ──────────────────────────────────────────

/**
 * TFP Performance Check AOB Lantai Ground — Print View (A4 landscape)
 *
 * Renders the table dynamically from record.columns_config:
 *   - Panel headers span their sub_columns count
 *   - Cells honor per-item is_disabled_map (grey) and merge_map (colSpan)
 *   - Mode/Suplai rows still render their label in the merged cell
 *
 * Print does NOT auto-fire — user clicks Print PDF button.
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
    return () => { cancelled = true; };
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

  const config = record.columns_config ?? [];
  const items = record.items;
  const facilities = record.facilities;

  // Flatten config into ordered cell list (matches detail page logic)
  const flatCells: { panelId: string; subKey: string; key: string }[] = [];
  for (const p of config) {
    for (const s of p.sub_columns) {
      flatCells.push({ panelId: p.id, subKey: s.key, key: cellKeyOf(p.id, s.key) });
    }
  }
  const totalCellCount = flatCells.length;

  const maxRows = Math.max(items.length, facilities.length);
  const padded: { item: TfpAobGroundItem | null; facility: typeof facilities[number] | null }[] = [];
  for (let i = 0; i < maxRows; i++) {
    padded.push({ item: items[i] ?? null, facility: facilities[i] ?? null });
  }

  // Width budget: 22 (No) + 110 (Param) + N*cellW + 120 (NamaFas) + 50 (Kond) + 90 (Ket)
  // Scale cell width down a bit when many panels exist to keep A4 landscape fit.
  const cellW = totalCellCount <= 8 ? 40 : totalCellCount <= 12 ? 32 : 26;

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm 8mm; }
          body { background: white !important; }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="print-hide mx-auto mb-4 flex max-w-[290mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/tfp/aob-ground/${record.id}`)}>
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
              src="/assets/icon/logoairnav.svg" alt="AirNav Indonesia"
              className="h-12 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="text-[14px] font-black leading-tight">AirNav Indonesia</div>
          </div>

          <div className="text-center">
            <div className="text-[13px] font-black leading-tight">Performance Check AOB Lantai Ground</div>
          </div>

          <div className="text-right text-[10px] font-bold leading-tight">
            <div>Perum LPPNPI</div>
            <div>Cabang Surabaya</div>
            <div>Teknik Fasilitas Penunjang</div>
          </div>
        </div>

        {/* Main table (parameter + facility merged side-by-side) */}
        <table className="w-full border-collapse text-[9px] mx-auto" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22px' }} />
            <col style={{ width: '110px' }} />
            {flatCells.map((c) => <col key={c.key} style={{ width: `${cellW}px` }} />)}
            <col style={{ width: '120px' }} />
            <col style={{ width: '50px' }} />
            <col style={{ width: '90px' }} />
          </colgroup>

          {/* Header rows */}
          <thead>
            <tr className="bg-blue-100">
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">No.</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Parameter</th>
              {config.map((panel) => (
                <th key={panel.id} colSpan={panel.sub_columns.length}
                  className="border border-black px-1 py-0.5 text-center font-bold text-[9px]">
                  {panel.label}
                </th>
              ))}
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Nama Fasilitas</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Kondisi</th>
              <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold text-[9px] align-middle">Keterangan</th>
            </tr>
            <tr className="bg-blue-50 italic">
              {config.flatMap((panel) =>
                panel.sub_columns.map((sub) => (
                  <th key={cellKeyOf(panel.id, sub.key)}
                    className="border border-black px-0.5 py-0.5 text-center font-semibold text-[8px]">
                    {sub.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {padded.map((row, idx) => {
              const item = row.item;
              const facility = row.facility;

              const skipKeys = new Set<string>();
              const cells: React.ReactNode[] = [];

              if (item) {
                const modeRow = isModeRow(item);
                const suplaiRow = isSuplaiRow(item);

                flatCells.forEach((fc, fi) => {
                  if (skipKeys.has(fc.key)) return;
                  const colspan = item.merge_map?.[fc.key] ?? 1;
                  const disabled = item.is_disabled_map?.[fc.key] === true;
                  for (let k = 1; k < colspan; k++) {
                    const nxt = flatCells[fi + k];
                    if (nxt) skipKeys.add(nxt.key);
                  }

                  if (disabled) {
                    cells.push(
                      <td key={fc.key} colSpan={colspan} className="border border-black bg-gray-300 px-1 py-1" />
                    );
                    return;
                  }

                  const v = item.values?.[fc.key] ?? '';

                  if (modeRow && !v) {
                    cells.push(
                      <td key={fc.key} colSpan={colspan} className="border border-black px-1 py-1 text-center text-[10px] font-semibold">
                        Auto / Manual
                      </td>
                    );
                    return;
                  }
                  if (suplaiRow && !v) {
                    const placeholder = fc.panelId === 'panel_ats_a12' ? 'PLN 1 / PLN 2' : 'PLN / UPS';
                    cells.push(
                      <td key={fc.key} colSpan={colspan} className="border border-black px-1 py-1 text-center text-[10px] font-semibold">
                        {placeholder}
                      </td>
                    );
                    return;
                  }

                  cells.push(
                    <td key={fc.key} colSpan={colspan}
                      className={`border border-black px-1 py-1 text-center text-[10px] ${modeRow || suplaiRow ? 'font-semibold' : ''}`}>
                      {val(v)}
                    </td>
                  );
                });
              } else {
                // pad row (parameter side empty)
                for (let i = 0; i < totalCellCount; i++) {
                  cells.push(<td key={`pad-${idx}-${i}`} className="border border-black px-1 py-1" />);
                }
              }

              return (
                <tr key={`row-${idx}`}>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">{item ? idx + 1 : ''}</td>
                  <td className="border border-black px-1 py-1 text-[9px]">
                    {item ? (
                      <>
                        {item.parameter_name}
                        {item.unit ? ` ( ${item.unit} )` : ''}
                      </>
                    ) : null}
                  </td>
                  {cells}
                  <td className="border border-black px-1 py-1 text-[9px]">{facility?.facility_name ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-center text-[9px]">{facility?.kondisi ?? ''}</td>
                  <td className="border border-black px-1 py-1 text-[9px]">{facility?.keterangan ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Waktu Pelaksanaan */}
        <table className="w-full border-collapse text-[9px] mt-0">
          <tbody>
            <tr className="bg-blue-100">
              <td className="border border-black px-2 py-1 text-center font-bold w-[15%]">Waktu Pelaksanaan</td>
              <td className="border border-black px-2 py-1 font-bold w-[7%]">Hari :</td>
              <td className="border border-black px-2 py-1 w-[16%]">{record.day_name ?? ''}</td>
              <td className="border border-black px-2 py-1 font-bold w-[8%]">Tanggal :</td>
              <td className="border border-black px-2 py-1 w-[18%]">{formatDate(record.date)}</td>
              <td className="border border-black px-2 py-1 font-bold w-[6%]">Jam :</td>
              <td className="border border-black px-2 py-1">{record.time_filled ?? ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature footer */}
        <div className="mt-0 border border-black border-t-0">
          <div className="flex">
            <div className="flex-1 border-r border-black p-2">
              <div className="text-[10px] font-black text-center uppercase mb-2">Teknisi</div>
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
                            <img src={tech.signature} alt={`TTD ${tech.technician_name}`}
                              className="mx-auto max-h-9 max-w-[90px] object-contain" />
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

            <div className="flex w-[24%] flex-col items-center border-r border-black p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Supervisor</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.supervisor ? (
                  record.supervisor.signature ? (
                    <img src={record.supervisor.signature} alt="TTD Supervisor"
                      className="max-h-16 max-w-[130px] object-contain" />
                  ) : (
                    <div className="h-16 w-28 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Tidak ada supervisor pada shift ini</span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">{record.supervisor?.name ?? '—'}</div>
            </div>

            <div className="flex w-[24%] flex-col items-center p-2 text-center min-h-[140px]">
              <div className="text-[10px] font-black uppercase mb-1">Manager Teknik</div>
              <div className="flex flex-1 items-center justify-center w-full mt-1">
                {record.manager ? (
                  record.manager.signature ? (
                    <img src={record.manager.signature} alt="TTD Manager Teknik"
                      className="max-h-16 max-w-[130px] object-contain" />
                  ) : (
                    <div className="h-16 w-28 border border-dashed border-gray-400" />
                  )
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Manager Teknik tidak ditugaskan</span>
                )}
              </div>
              <div className="mt-auto text-[10px] font-semibold">{record.manager?.name ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="mt-1 flex justify-between text-[8px] text-slate-700 px-1 pb-3">
          <span>(*) Coret yang tidak perlu</span>
          <span>Kondisi : (√) Baik / Normal</span>
        </div>
      </div>
    </div>
  );
};
