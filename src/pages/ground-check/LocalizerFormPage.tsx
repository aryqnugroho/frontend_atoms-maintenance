import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, FileText, BarChart2, Table2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  BUILT_IN_PARAMS, ADDITIONAL_PARAMS, DEGREE_ROWS, CURVE_FIELDS,
  CURVE_FIELD_LABELS, TX1_DEFAULT, TX2_DEFAULT, type CurveField,
} from './localizerFormData';

// ─── Types ────────────────────────────────────────────────────
type ToleranceStatus = 'in' | 'out' | '';
interface ParamRow { tx1: ToleranceStatus; tx2: ToleranceStatus; tx1Result: string; tx2Result: string; keterangan: string; }
interface CurveRow { tx1: Record<CurveField, string>; tx2: Record<CurveField, string>; }

function emptyParamRow(): ParamRow { return { tx1: '', tx2: '', tx1Result: '', tx2Result: '', keterangan: '' }; }
function emptyCurveRow(): CurveRow {
  const empty = () => Object.fromEntries(CURVE_FIELDS.map(f => [f, ''])) as Record<CurveField, string>;
  return { tx1: empty(), tx2: empty() };
}

function initCurveData(): CurveRow[] {
  return DEGREE_ROWS.map((_, idx) => {
    const row = emptyCurveRow();
    const d1 = TX1_DEFAULT[idx]; const d2 = TX2_DEFAULT[idx];
    if (d1) CURVE_FIELDS.forEach(f => { if (d1[f]) row.tx1[f] = d1[f]!; });
    if (d2) CURVE_FIELDS.forEach(f => { if (d2[f]) row.tx2[f] = d2[f]!; });
    return row;
  });
}

// ─── Sub-components ───────────────────────────────────────────
const TabBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> =
  ({ active, onClick, icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
        active ? 'bg-brand-primary text-white shadow' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );

const ToleranceSelect: React.FC<{ value: ToleranceStatus; onChange: (v: ToleranceStatus) => void }> =
  ({ value, onChange }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value as ToleranceStatus)}
      className={`w-full h-7 text-[10px] font-semibold rounded border px-1 focus:outline-none focus:ring-1 ${
        value === 'in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300'
        : value === 'out' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-300'
        : 'bg-white text-slate-500 border-slate-200'
      }`}
    >
      <option value="">—</option>
      <option value="in">IN TOLERANCE</option>
      <option value="out">OUT OF TOL.</option>
    </select>
  );

// ─── Main Component ───────────────────────────────────────────
export const LocalizerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header state
  const [header, setHeader] = useState({
    laporan_bulan: 'APRIL 2026',
    bandara: 'JUANDA SURABAYA',
    nama_peralatan: 'ILS LOCALIZER',
    fungsi_peralatan: 'SURABAYA',
    data_teknis: 'ALAT BANTU',
    identification: 'ISBY',
    kalibrasi_akhir: '03 NOVEMBER 2025',
    tanggal_pelaksanaan: '2026-04-11',
    jarak_ant: '300',
  });
  const setH = (k: string, v: string) => setHeader(p => ({ ...p, [k]: v }));

  // Tab 1: parameter rows (indexed to BUILT_IN_PARAMS + ADDITIONAL_PARAMS)
  const [builtInRows, setBuiltInRows] = useState<ParamRow[]>(() => BUILT_IN_PARAMS.map(emptyParamRow));
  const [additionalRows, setAdditionalRows] = useState<ParamRow[]>(() => ADDITIONAL_PARAMS.map(emptyParamRow));

  // Tab 2: curve data rows indexed to DEGREE_ROWS
  const [curveData, setCurveData] = useState<CurveRow[]>(initCurveData);

  const setCurveCell = (rowIdx: number, tx: 'tx1' | 'tx2', field: CurveField, val: string) => {
    setCurveData(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [tx]: { ...next[rowIdx][tx], [field]: val } };
      return next;
    });
  };

  // Tab 3: chart data derived from curveData
  const chartData = useMemo(() => DEGREE_ROWS.map((row, idx) => ({
    label: row.side === 'left' ? `-${row.label}` : row.label,
    tx1: parseFloat(curveData[idx].tx1.ddmPct) || null,
    tx2: parseFloat(curveData[idx].tx2.ddmPct) || null,
  })), [curveData]);

  // Signatures
  const [teknisi, setTeknisi] = useState(['MOH. SYAMSUDIN', 'RHOMADONI S K D', 'ALDHI DESKA P', 'SAFIRA SARASWATI']);
  const [manager, setManager] = useState('FAJAR K W');

  const handleReset = () => {
    if (!window.confirm('Reset semua data form?')) return;
    setBuiltInRows(BUILT_IN_PARAMS.map(emptyParamRow));
    setAdditionalRows(ADDITIONAL_PARAMS.map(emptyParamRow));
    setCurveData(initCurveData());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Laporan ILS Localizer berhasil disimpan!');
      setIsSubmitting(false);
      navigate('/ground-check');
    }, 900);
  };

  // ─── Render helpers ───────────────────────────────────────
  const renderParamTable = (
    params: typeof BUILT_IN_PARAMS,
    rows: ParamRow[],
    setRows: React.Dispatch<React.SetStateAction<ParamRow[]>>,
  ) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-3 py-2 text-center w-10 border-r border-slate-600">No</th>
            <th className="px-3 py-2 text-left border-r border-slate-600">Parameter</th>
            <th className="px-3 py-2 text-center border-r border-slate-600 w-36">Hasil Pengukuran Setelah Kalibrasi</th>
            <th className="px-3 py-2 text-center border-r border-slate-600 w-36">Toleransi</th>
            <th className="px-3 py-2 text-center border-r border-slate-600 w-24">Hasil PD TX1</th>
            <th className="px-3 py-2 text-center border-r border-slate-600 w-24">Hasil PD TX2</th>
            <th className="px-3 py-2 text-center w-32">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, idx) => {
            if (param.isHeader) return (
              <tr key={idx} className="bg-slate-700">
                <td colSpan={7} className="px-4 py-2 text-xs font-bold text-white uppercase tracking-widest">{param.parameter}</td>
              </tr>
            );
            if (param.isSubSection) return (
              <tr key={idx} className="bg-slate-100">
                <td className="px-3 py-1.5 text-slate-400 text-center">{param.no}</td>
                <td colSpan={6} className="px-3 py-1.5 font-semibold text-slate-700">{param.parameter}</td>
              </tr>
            );
            const row = rows[idx];
            const setRow = (patch: Partial<ParamRow>) => setRows(prev => { const n = [...prev]; n[idx] = { ...n[idx], ...patch }; return n; });
            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-2 text-center text-slate-400 border-r border-slate-100">{param.no}</td>
                <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-100">{param.parameter}</td>
                <td className="px-3 py-2 text-center text-slate-600 border-r border-slate-100 font-mono text-[11px]">{param.afterCalibration}</td>
                <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-100 whitespace-pre-line leading-tight">{param.tolerance}</td>
                <td className="px-2 py-1.5 border-r border-slate-100">
                  <div className="flex flex-col gap-1">
                    <input value={row?.tx1Result || ''} onChange={e => setRow({ tx1Result: e.target.value })}
                      placeholder="Nilai" className="w-full h-6 px-1.5 text-[10px] rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    <ToleranceSelect value={row?.tx1 || ''} onChange={v => setRow({ tx1: v })} />
                  </div>
                </td>
                <td className="px-2 py-1.5 border-r border-slate-100">
                  <div className="flex flex-col gap-1">
                    <input value={row?.tx2Result || ''} onChange={e => setRow({ tx2Result: e.target.value })}
                      placeholder="Nilai" className="w-full h-6 px-1.5 text-[10px] rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    <ToleranceSelect value={row?.tx2 || ''} onChange={v => setRow({ tx2: v })} />
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <input value={row?.keterangan || ''} onChange={e => setRow({ keterangan: e.target.value })}
                    className="w-full h-7 px-1.5 text-[10px] rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCurveTable = (tx: 'tx1' | 'tx2', label: string, color: string) => (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white`} style={{ backgroundColor: color }}>
        {label}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="text-[10px] border-collapse" style={{ minWidth: '700px' }}>
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-2 py-2 text-center border-r border-slate-500 w-12">Jarak (M)</th>
              <th className="px-2 py-2 text-center border-r border-slate-500 w-14">Degrees</th>
              {CURVE_FIELDS.map(f => (
                <th key={f} className="px-2 py-2 text-center border-r border-slate-500 w-20">{CURVE_FIELD_LABELS[f]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEGREE_ROWS.map((row, idx) => {
              const isCenter = row.side === 'center';
              const isLeft = row.side === 'left';
              return (
                <tr key={idx} className={`${isCenter ? 'bg-blue-50 font-bold' : isLeft ? 'bg-orange-50/30' : 'bg-sky-50/30'} hover:bg-slate-100 transition-colors`}>
                  <td className="px-2 py-1.5 text-center text-slate-600 border-r border-slate-100">{row.jarakM || '—'}</td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700 border-r border-slate-100">
                    {isLeft ? `-${row.label}` : row.label}
                  </td>
                  {CURVE_FIELDS.map(f => (
                    <td key={f} className="px-1.5 py-1 border-r border-slate-100">
                      <input
                        value={curveData[idx][tx][f]}
                        onChange={e => setCurveCell(idx, tx, f, e.target.value)}
                        className="w-full h-6 px-1 text-center rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 text-[10px]"
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
  );

  const renderChart = (tx: 'tx1' | 'tx2', title: string, color: string) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 text-center">{title}</h3>
      <p className="text-xs text-slate-400 text-center">Distance {header.jarak_ant} Meter</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} label={{ value: 'Degrees', position: 'insideBottom', offset: -10, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} label={{ value: 'DDM', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
          <Line type="monotone" dataKey={tx} name="DDM (%)" stroke={color} dot={{ r: 3 }} strokeWidth={2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="max-w-full space-y-5 animate-fade-in pb-20">
      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/ground-check')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">Laporan Bulan ILS Localizer</h1>
            <p className="text-xs text-slate-500">Pengujian Berkala di Darat Peralatan Fasilitas Elektronik Penerbangan</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <RotateCcw size={15} /> Reset
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-100 transition-colors disabled:opacity-60">
            <Save size={15} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Header Info ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Informasi Laporan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            {[
              { label: 'Laporan Bulan', key: 'laporan_bulan' },
              { label: 'Bandara', key: 'bandara' },
              { label: 'Nama Peralatan', key: 'nama_peralatan' },
              { label: 'Fungsi Peralatan', key: 'fungsi_peralatan' },
              { label: 'Data Teknis', key: 'data_teknis' },
              { label: 'Identification', key: 'identification' },
              { label: 'Kalibrasi Akhir', key: 'kalibrasi_akhir' },
              { label: 'Tanggal Pelaksanaan', key: 'tanggal_pelaksanaan', type: 'date' },
              { label: 'Jarak dari Antena (M)', key: 'jarak_ant' },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                <input
                  type={type || 'text'}
                  value={(header as Record<string, string>)[key]}
                  onChange={e => setH(key, e.target.value)}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-1">
          <TabBtn active={activeTab === 0} onClick={() => setActiveTab(0)} icon={<Table2 size={15} />} label="Parameter Pengujian" />
          <TabBtn active={activeTab === 1} onClick={() => setActiveTab(1)} icon={<FileText size={15} />} label="Groundcheck Performance Curve" />
          <TabBtn active={activeTab === 2} onClick={() => setActiveTab(2)} icon={<BarChart2 size={15} />} label="Performance Charts" />
        </div>

        {/* ── TAB 0: Parameters ── */}
        {activeTab === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Parameter Peralatan (Built-in Test)</h2>
              {renderParamTable(BUILT_IN_PARAMS, builtInRows, setBuiltInRows)}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Additional Test Equipment</h2>
              {renderParamTable(ADDITIONAL_PARAMS, additionalRows, setAdditionalRows)}
            </div>

            {/* Teknisi Pelaksana */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-3 mb-4">Tanda Tangan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600">Teknisi Pelaksana</p>
                  {teknisi.map((name, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
                      <input value={name} onChange={e => { const n = [...teknisi]; n[i] = e.target.value; setTeknisi(n); }}
                        className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                      <div className="h-16 w-24 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-[9px] text-slate-300 italic">Paraf</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600">PH Manager Teknik 1</p>
                  <input value={manager} onChange={e => setManager(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-300 italic">Area Tanda Tangan</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Curve Data Grid ── */}
        {activeTab === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Groundcheck Performance Curve — Jarak dari ANT: {header.jarak_ant} M</h2>
              <span className="text-[10px] text-slate-400">Scroll horizontal jika diperlukan →</span>
            </div>
            <div className="space-y-8">
              {renderCurveTable('tx1', 'TX 1', '#1B3A6B')}
              {renderCurveTable('tx2', 'TX 2', '#1A5C34')}
            </div>
          </div>
        )}

        {/* ── TAB 2: Charts ── */}
        {activeTab === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
              <BarChart2 size={14} />
              <span>Chart otomatis terupdate saat Anda mengisi nilai <strong>DDM (%)</strong> di tab <strong>Groundcheck Performance Curve</strong>.</span>
            </div>
            {renderChart('tx1', 'TX 1  Ground Performance Curve', '#2563eb')}
            {renderChart('tx2', 'TX 2  Ground Performance Curve', '#16a34a')}
          </div>
        )}
      </form>
    </div>
  );
};
