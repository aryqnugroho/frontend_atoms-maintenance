import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Calendar, Clock, Zap, CheckSquare } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

// ─── Data Constants ───────────────────────────────────────────

const PANEL_GROUPS = [
  { id: 'cos', label: 'Panel COS (A 03)', subCols: ['input', 'output'] },
  { id: 'ats', label: 'Panel ATS (A 12)', subCols: ['input', 'output'] },
  { id: 'upsA', label: 'UPS TESCOM A', subCols: ['input', 'output'] },
  { id: 'upsB', label: 'UPS TESCOM B', subCols: ['input', 'output'] },
];

interface MatrixRow {
  id: string;
  label: string;
  unit?: string;
  // which panels this row applies to (by panel id), defaults to all if empty
  panels?: string[];
  type?: 'toggle'; // for Mode & Suplai Aktif rows
  options?: string[][];
}

const MATRIX_ROWS: MatrixRow[] = [
  { id: 'l1n',    label: 'L1 - N',       unit: 'Volt' },
  { id: 'l2n',    label: 'L2 - N',       unit: 'Volt' },
  { id: 'l3n',    label: 'L3 - N',       unit: 'Volt' },
  { id: 'ng',     label: 'N - G',        unit: 'Volt' },
  { id: 'l1l2',   label: 'L1 - L2',      unit: 'Volt' },
  { id: 'l1l3',   label: 'L1 - L3',      unit: 'Volt' },
  { id: 'l2l3',   label: 'L2 - L3',      unit: 'Volt' },
  { id: 'l1amp',  label: 'L1',           unit: 'Ampere' },
  { id: 'l2amp',  label: 'L2',           unit: 'Ampere' },
  { id: 'l3amp',  label: 'L3',           unit: 'Ampere' },
  { id: 'namp',   label: 'N',            unit: 'Ampere' },
  { id: 'freq',   label: 'Frekuensi',    unit: 'Hz' },
  { id: 'pf',     label: 'Power Factor', unit: 'Cos θ', panels: ['cos', 'ats'] },
  { id: 'batV',   label: 'Tegangan Battery', unit: 'Volt',   panels: ['upsA', 'upsB'] },
  { id: 'batA',   label: 'Arus Battery',     unit: 'Ampere', panels: ['upsA', 'upsB'] },
  { id: 'batAh',  label: 'Kapasitas Battery',unit: 'Ah',     panels: ['upsA', 'upsB'] },
  { id: 'batC',   label: 'Suhu Battery',     unit: '°C',     panels: ['upsA', 'upsB'] },
];



const FACILITY_ITEMS = [
  { id: 'catu',     label: 'Catu Daya Listrik',          defaultNote: '' },
  { id: 'penerangan', label: 'Penerangan',               defaultNote: '' },
  { id: 'upsA',     label: 'UPS Tescom A',               defaultNote: '' },
  { id: 'upsB',     label: 'UPS Tescom B',               defaultNote: '' },
  { id: 'ac01',     label: 'AC 01 (Split Wall) Eq',      defaultNote: 'A' },
  { id: 'ac02',     label: 'AC 02 (Split Wall) Eq',      defaultNote: 'A' },
  { id: 'ac03',     label: 'AC 03 (Split Wall) Eq',      defaultNote: 'A' },
  { id: 'ac04',     label: 'AC 04 (Split Wall) Eq',      defaultNote: 'A' },
  { id: 'ac05',     label: 'AC 05 (Split Wall) Gd 21',   defaultNote: 'A' },
  { id: 'ac06',     label: 'AC 06 (Split Wall) Ex MCC',  defaultNote: 'A' },
  { id: 'ac08',     label: 'AC 08 (Split Wall) ARO',     defaultNote: 'A' },
  { id: 'papan',    label: 'Papan Nama AirNav',          defaultNote: '' },
  { id: 'atap',     label: 'Atap',                       defaultNote: '' },
  { id: 'plafond',  label: 'Plafond',                    defaultNote: '' },
  { id: 'dinding',  label: 'Dinding',                    defaultNote: '' },
  { id: 'pintu',    label: 'Pintu',                      defaultNote: '' },
  { id: 'doorlock', label: 'Door Lock',                  defaultNote: '' },
];

// ─── State Initializer ────────────────────────────────────────

function initMatrixData() {
  const data: Record<string, Record<string, Record<string, string>>> = {};
  MATRIX_ROWS.forEach(row => {
    data[row.id] = {};
    PANEL_GROUPS.forEach(panel => {
      const applicable = !row.panels || row.panels.includes(panel.id);
      data[row.id][panel.id] = {
        input:  applicable ? '' : '__NA__',
        output: applicable ? '' : '__NA__',
      };
    });
  });
  return data;
}

function initBottomData() {
  return {
    mode:   { cos: 'Auto', ats: 'Auto' },
    suplai: { cos: 'PLN', ats: 'PLN 1' },
    kwh:    '',
    suhuRoom: '',
    suhuRuang: '',
  };
}

function initFacilityData() {
  const data: Record<string, { kondisi: string; keterangan: string }> = {};
  FACILITY_ITEMS.forEach(item => {
    data[item.id] = { kondisi: 'Baik', keterangan: item.defaultNote };
  });
  return data;
}

// ─── Sub-components ───────────────────────────────────────────

const NumInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  if (disabled) {
    return <div className="w-full h-8 bg-slate-100 rounded" />;
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-8 px-1.5 text-center text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
    />
  );
};

const KondisiSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={cn(
      'w-full h-8 px-2 text-xs rounded border-none focus:ring-1 focus:outline-none font-semibold',
      value === 'Baik' || value === 'Normal'
        ? 'bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
        : 'bg-red-50 text-red-700 focus:ring-red-200'
    )}
  >
    <option value="Baik">Baik</option>
    <option value="Normal">Normal</option>
    <option value="Tidak Normal">Tidak Normal</option>
  </select>
);

/** Typed signatures state for the TFP form */
interface TfpSignaturesData {
  teknisi: string;
  supervisor: string;
  manager: string;
}

// ─── Main Component ───────────────────────────────────────────

export const TfpAobGroundFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const [header, setHeader] = useState({
    hari: today.toLocaleDateString('id-ID', { weekday: 'long' }),
    tanggal: today.toISOString().split('T')[0],
    jam: today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  });

  const [matrix, setMatrix] = useState(initMatrixData);
  const [bottom, setBottom] = useState(initBottomData);
  const [facility, setFacility] = useState(initFacilityData);
  const [signatures, setSignatures] = useState<TfpSignaturesData>({ teknisi: '', supervisor: '', manager: '' });

  const setMatrixCell = (rowId: string, panelId: string, col: string, val: string) => {
    setMatrix(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], [panelId]: { ...prev[rowId][panelId], [col]: val } },
    }));
  };

  const setFacilityField = (itemId: string, field: string, val: string) => {
    setFacility(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }));
  };

  const handleReset = () => {
    if (window.confirm('Reset semua data form?')) {
      setMatrix(initMatrixData());
      setBottom(initBottomData());
      setFacility(initFacilityData());
      setSignatures({ teknisi: '', supervisor: '', manager: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Performance Check AOB Lantai Ground berhasil disimpan!');
      setIsSubmitting(false);
      navigate('/tfp');
    }, 1000);
  };

  return (
    <div className="max-w-full space-y-6 animate-fade-in pb-20">
      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tfp')} className="hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Performance Check AOB Lantai Ground</h1>
            <p className="text-xs text-slate-500">TFP — Cabang Surabaya</p>
          </div>
        </div>
        {/* Waktu Pelaksanaan */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="font-medium text-slate-400">Hari:</span>
            <input
              value={header.hari}
              onChange={e => setHeader(p => ({ ...p, hari: e.target.value }))}
              className="bg-transparent border-none focus:ring-0 w-24 font-semibold p-0 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={header.tanggal}
              onChange={e => setHeader(p => ({ ...p, tanggal: e.target.value }))}
              className="bg-transparent border-none focus:ring-0 font-semibold p-0 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Clock size={14} className="text-slate-400" />
            <input
              type="time"
              value={header.jam}
              onChange={e => setHeader(p => ({ ...p, jam: e.target.value }))}
              className="bg-transparent border-none focus:ring-0 font-semibold p-0 text-xs"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Two-Panel Grid: Section A + Section B ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ═══ SECTION A: Electrical Parameters Matrix ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <Zap size={16} className="text-amber-600" />
              <h2 className="text-sm font-bold text-slate-800">Parameter Kelistrikan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2 text-left font-semibold w-8">No</th>
                    <th className="px-3 py-2 text-left font-semibold w-36">Parameter</th>
                    {PANEL_GROUPS.map(pg => (
                      <th key={pg.id} colSpan={2} className="px-2 py-2 text-center font-semibold border-l border-slate-600">
                        {pg.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-700 text-slate-200">
                    <th colSpan={2} className="px-3 py-1.5" />
                    {PANEL_GROUPS.map(pg =>
                      pg.subCols.map(sc => (
                        <th key={`${pg.id}-${sc}`} className="px-2 py-1.5 text-center font-medium border-l border-slate-600 capitalize">
                          {sc}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {row.label}
                        {row.unit && <span className="text-slate-400 ml-1">({row.unit})</span>}
                      </td>
                      {PANEL_GROUPS.map(pg =>
                        pg.subCols.map(sc => {
                          const applicable = !row.panels || row.panels.includes(pg.id);
                          return (
                            <td key={`${pg.id}-${sc}`} className="px-2 py-1.5 border-l border-slate-100">
                              <NumInput
                                value={matrix[row.id]?.[pg.id]?.[sc] || ''}
                                onChange={v => setMatrixCell(row.id, pg.id, sc, v)}
                                disabled={!applicable}
                              />
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}

                  {/* ─ Mode Row ─ */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-3 py-2 text-slate-400 font-mono">{MATRIX_ROWS.length + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">Mode <span className="text-[10px] text-slate-400">(Auto/Manual)</span></td>
                    {/* Panel COS: input+output merged = 2 cols with radio */}
                    {PANEL_GROUPS.map(pg => {
                      const opts = pg.id === 'cos' ? ['Auto', 'Manual'] : pg.id === 'ats' ? ['Auto', 'Manual'] : null;
                      const key = pg.id === 'cos' ? 'cos' : pg.id === 'ats' ? 'ats' : null;
                      if (!opts || !key) {
                        return [<td key={`${pg.id}-in`} className="border-l border-slate-100 bg-slate-100" />,
                                <td key={`${pg.id}-out`} className="border-slate-100 bg-slate-100" />];
                      }
                      return (
                        <td key={pg.id} colSpan={2} className="px-2 py-1.5 border-l border-slate-100">
                          <div className="flex gap-3 justify-center">
                            {opts.map(opt => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700">
                                <input
                                  type="radio"
                                  name={`mode-${key}`}
                                  value={opt}
                                  checked={bottom.mode[key as 'cos' | 'ats'] === opt}
                                  onChange={() => setBottom(p => ({ ...p, mode: { ...p.mode, [key]: opt } }))}
                                  className="accent-blue-600"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* ─ Suplai Aktif Row ─ */}
                  <tr className="bg-blue-50">
                    <td className="px-3 py-2 text-slate-400 font-mono">{MATRIX_ROWS.length + 2}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">Suplai Aktif <span className="text-[10px] text-slate-400">(PLN/UPS)</span></td>
                    {PANEL_GROUPS.map(pg => {
                      const opts = pg.id === 'cos' ? ['PLN', 'UPS'] : pg.id === 'ats' ? ['PLN 1', 'PLN 2'] : null;
                      const key = pg.id === 'cos' ? 'cos' : pg.id === 'ats' ? 'ats' : null;
                      if (!opts || !key) {
                        return [<td key={`${pg.id}-in`} className="border-l border-slate-100 bg-slate-100" />,
                                <td key={`${pg.id}-out`} className="border-slate-100 bg-slate-100" />];
                      }
                      return (
                        <td key={pg.id} colSpan={2} className="px-2 py-1.5 border-l border-slate-100">
                          <div className="flex gap-3 justify-center">
                            {opts.map(opt => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700">
                                <input
                                  type="radio"
                                  name={`suplai-${key}`}
                                  value={opt}
                                  checked={bottom.suplai[key as 'cos' | 'ats'] === opt}
                                  onChange={() => setBottom(p => ({ ...p, suplai: { ...p.suplai, [key]: opt } }))}
                                  className="accent-blue-600"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* ─ KWH Meter ─ */}
                  <tr className="bg-white border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-400 font-mono">{MATRIX_ROWS.length + 3}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">KWH Meter</td>
                    <td colSpan={8} className="px-3 py-1.5">
                      <input
                        type="text"
                        value={bottom.kwh}
                        onChange={e => setBottom(p => ({ ...p, kwh: e.target.value }))}
                        placeholder="Nilai KWH..."
                        className="w-48 h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      />
                    </td>
                  </tr>

                  {/* ─ Suhu Eq. Room ─ */}
                  <tr className="bg-slate-50">
                    <td className="px-3 py-2 text-slate-400 font-mono">{MATRIX_ROWS.length + 4}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">Suhu Eq. Room (°C)</td>
                    <td colSpan={8} className="px-3 py-1.5">
                      <input
                        type="text"
                        value={bottom.suhuRoom}
                        onChange={e => setBottom(p => ({ ...p, suhuRoom: e.target.value }))}
                        placeholder="°C"
                        className="w-24 h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      />
                    </td>
                  </tr>

                  {/* ─ Suhu Ruang ARO ─ */}
                  <tr className="bg-white">
                    <td className="px-3 py-2 text-slate-400 font-mono">{MATRIX_ROWS.length + 5}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">Suhu Ruang ARO (°C)</td>
                    <td colSpan={8} className="px-3 py-1.5">
                      <input
                        type="text"
                        value={bottom.suhuRuang}
                        onChange={e => setBottom(p => ({ ...p, suhuRuang: e.target.value }))}
                        placeholder="°C"
                        className="w-24 h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ SECTION B: Facility Checklist ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <CheckSquare size={16} className="text-sky-600" />
              <h2 className="text-sm font-bold text-slate-800">Kondisi Fasilitas</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_90px_1fr] gap-2 px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Nama Fasilitas</span>
                <span className="text-center">Kondisi</span>
                <span>Keterangan</span>
              </div>
              {FACILITY_ITEMS.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[1fr_90px_1fr] gap-2 px-4 py-2.5 items-center',
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  )}
                >
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                  <KondisiSelect
                    value={facility[item.id]?.kondisi || 'Baik'}
                    onChange={v => setFacilityField(item.id, 'kondisi', v)}
                  />
                  <input
                    type="text"
                    value={facility[item.id]?.keterangan || ''}
                    onChange={e => setFacilityField(item.id, 'keterangan', e.target.value)}
                    placeholder="Ket."
                    className="h-8 px-2 text-xs rounded border border-slate-200 bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Signature Section ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Pelaksana Teknisi', key: 'teknisi' },
            { label: 'Supervisor', key: 'supervisor' },
            { label: 'Manager Teknik', key: 'manager' },
          ].map(sig => (
            <div key={sig.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">{sig.label}</h4>
              <input
                value={signatures[sig.key as keyof TfpSignaturesData]}
                onChange={e => setSignatures(p => ({ ...p, [sig.key]: e.target.value }))}
                placeholder={`Nama ${sig.label}`}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-[10px] italic">
                Area Tanda Tangan
              </div>
            </div>
          ))}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={handleReset} className="gap-2 text-slate-500">
            <RotateCcw size={16} />
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 shadow-lg shadow-emerald-100"
          >
            <Save size={16} />
            {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
          </Button>
        </div>
      </form>
    </div>
  );
};
