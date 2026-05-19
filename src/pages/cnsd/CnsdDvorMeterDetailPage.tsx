import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio, ArrowLeft, Save, Printer, Users, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { useAuth } from '@/hooks/useAuth';
import { cnsdDvorMeterService } from '@/services/cnsdDvorMeterService';
import { CnsdDvorMeterSignaturePanel } from './components/CnsdDvorMeterSignaturePanel';
import type { CnsdDvorMeterRecordDetail, CnsdDvorMeterItem } from '@/types/cnsdDvor';

type SectionTab = 'I' | 'II';

const SECTION_TABS: { code: SectionTab; label: string }[] = [
  { code: 'I', label: 'Peralatan' },
  { code: 'II', label: 'Lingkungan Kerja' },
];

// Dropdown for STATUS item in group E
function getDropdownOptions(item: CnsdDvorMeterItem): string[] | null {
  if (item.item_name === 'STATUS' && item.limit_value === 'NORMAL') return ['NORMAL', 'ABNORMAL'];
  if (item.limit_value === '√') return ['√', '-'];
  return null;
}

export const CnsdDvorMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  // ─── All hooks at top level — Rules of Hooks compliant ────
  const [record, setRecord] = useState<CnsdDvorMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('I');
  const [localItems, setLocalItems] = useState<CnsdDvorMeterItem[]>([]);
  // TX mode local state
  const [tx1Mode, setTx1Mode] = useState<'MAIN' | 'STANDBY'>('MAIN');
  const [tx2Mode, setTx2Mode] = useState<'MAIN' | 'STANDBY'>('STANDBY');

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await cnsdDvorMeterService.getRecord(Number(id));
      setRecord(data);
      setLocalItems(data.items);
      setTx1Mode((data.tx1_mode as 'MAIN' | 'STANDBY') ?? 'MAIN');
      setTx2Mode((data.tx2_mode as 'MAIN' | 'STANDBY') ?? 'STANDBY');
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data form DVOR.');
    } finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  const handleItemChange = (itemId: number, field: 'hasil_pemeriksaan' | 'keterangan', value: string | null) => {
    setLocalItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)));
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true); setErrorMessage(null); setSuccessMessage(null);
    try {
      const updated = await cnsdDvorMeterService.updateRecord(record.id, {
        tx1_mode: tx1Mode,
        tx2_mode: tx2Mode,
        items: localItems.map((it) => ({ id: it.id, hasil_pemeriksaan: it.hasil_pemeriksaan, keterangan: it.keterangan })),
      });
      setRecord(updated); setLocalItems(updated.items);
      setTx1Mode((updated.tx1_mode as 'MAIN' | 'STANDBY') ?? 'MAIN');
      setTx2Mode((updated.tx2_mode as 'MAIN' | 'STANDBY') ?? 'STANDBY');
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch { setErrorMessage('Gagal menyimpan perubahan.'); }
    finally { setIsSaving(false); }
  };

  const handleSignSuccess = (updated: CnsdDvorMeterRecordDetail) => {
    setRecord(updated); setLocalItems(updated.items);
  };

  // Grouped items for section I — unconditional (Rules of Hooks)
  const groupedItemsI = useMemo(() => {
    const groups: Map<string, CnsdDvorMeterItem[]> = new Map();
    for (const item of localItems.filter((it) => it.section_code === 'I')) {
      const key = item.group_code ?? 'X';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return groups;
  }, [localItems]);

  const sectionIIItems = useMemo(() => localItems.filter((it) => it.section_code === 'II'), [localItems]);

  // ─── Early returns after all hooks ────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage ?? 'Form tidak ditemukan.'}
        </div>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/cnsd')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> CNSD
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/cnsd/dvor-meter')} className="hover:text-slate-700 transition-colors">
          Meter Reading DVOR
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium font-mono">{record.form_number}</span>
      </div>

      <PageHeader icon={Radio} iconBg="bg-sky-100" iconColor="text-maintenance-cnsd"
        title={`Meter Reading DVOR — ${record.form_number}`}
        subtitle={`${record.form_code} · ${record.location}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/cnsd/dvor-meter/${record.id}/print`)} className="gap-2">
              <Printer size={16} /> Print PDF
            </Button>
            {!isCompleted && <Button onClick={handleSave} isLoading={isSaving} className="gap-2"><Save size={16} /> Simpan Perubahan</Button>}
          </div>
        }
      />

      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div>}
      {successMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">{successMessage}</div>}

      {/* Header info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2"><Calendar size={15} className="text-slate-400 mt-0.5 shrink-0" /><div><p className="text-xs text-slate-500">Tanggal</p><p className="font-medium text-slate-800">{record.date}</p></div></div>
          <div className="flex items-start gap-2"><div><p className="text-xs text-slate-500">Shift</p><ShiftBadge shift={record.shift_type as import('@/types').ShiftType} /></div></div>
          <div className="flex items-start gap-2"><MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" /><div><p className="text-xs text-slate-500">Lokasi</p><p className="font-medium text-slate-800">{record.location}</p></div></div>
          <div className="flex items-start gap-2"><div><p className="text-xs text-slate-500">Status</p><StatusBadge status={record.status} variant="pill" /></div></div>
          {record.merk && <div><p className="text-xs text-slate-500">Merk</p><p className="font-medium text-slate-800">{record.merk}</p></div>}
          {record.type && <div><p className="text-xs text-slate-500">Type</p><p className="font-medium text-slate-800">{record.type}</p></div>}
          {record.form_code && <div><p className="text-xs text-slate-500">Form</p><p className="font-medium text-slate-800">{record.form_code}</p></div>}
          {/* TX1 Mode dropdown */}
          <div>
            <p className="text-xs text-slate-500 mb-1">TX 1 Mode</p>
            {isCompleted ? (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${tx1Mode === 'MAIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tx1Mode}</span>
            ) : (
              <select value={tx1Mode} onChange={(e) => setTx1Mode(e.target.value as 'MAIN' | 'STANDBY')}
                className="h-8 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
                aria-label="TX 1 Mode">
                <option value="MAIN">MAIN</option>
                <option value="STANDBY">STANDBY</option>
              </select>
            )}
          </div>
          {/* TX2 Mode dropdown */}
          <div>
            <p className="text-xs text-slate-500 mb-1">TX 2 Mode</p>
            {isCompleted ? (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${tx2Mode === 'MAIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tx2Mode}</span>
            ) : (
              <select value={tx2Mode} onChange={(e) => setTx2Mode(e.target.value as 'MAIN' | 'STANDBY')}
                className="h-8 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
                aria-label="TX 2 Mode">
                <option value="MAIN">MAIN</option>
                <option value="STANDBY">STANDBY</option>
              </select>
            )}
          </div>
          <div className="flex items-start gap-2"><Users size={15} className="text-slate-400 mt-0.5 shrink-0" /><div><p className="text-xs text-slate-500">Teknisi</p><p className="font-medium text-slate-800">{record.technicians.map((t) => t.technician_name).join(', ') || '—'}</p></div></div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {SECTION_TABS.map((tab) => (
          <button key={tab.code} onClick={() => setActiveTab(tab.code)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.code ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section I — Peralatan */}
      {activeTab === 'I' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-sky-800 text-white">
                  <th className="px-3 py-2 text-center w-10">NO</th>
                  <th className="px-3 py-2 text-left">PEMBACAAN METER READING</th>
                  <th className="px-3 py-2 text-center w-36">LIMIT</th>
                  <th className="px-3 py-2 text-center w-36">HASIL PEMERIKSAAN</th>
                  <th className="px-3 py-2 text-left w-36">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(groupedItemsI.entries()).map(([, groupItems]) => {
                  const headerRow = groupItems.find((it) => it.is_header);
                  const dataRows = groupItems.filter((it) => !it.is_header);
                  return (
                    <React.Fragment key={headerRow?.id ?? groupItems[0]?.id}>
                      {headerRow && (
                        <tr className="bg-green-200">
                          <td className="px-3 py-1.5 text-center font-bold text-slate-700">{headerRow.group_code}</td>
                          <td colSpan={4} className="px-3 py-1.5 font-bold text-slate-700 italic">{headerRow.group_name}</td>
                        </tr>
                      )}
                      {dataRows.map((item, idx) => {
                        const opts = getDropdownOptions(item);
                        return (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-3 py-2 text-slate-400 text-center"></td>
                            <td className="px-3 py-2 text-slate-700">{item.item_name}</td>
                            <td className="px-3 py-2 text-center text-slate-500 text-[10px]">{item.limit_value ?? ''}</td>
                            <td className="px-3 py-2">
                              {isCompleted ? (
                                <span className="text-slate-700">{item.hasil_pemeriksaan ?? '—'}</span>
                              ) : opts ? (
                                <select value={item.hasil_pemeriksaan ?? ''} onChange={(e) => handleItemChange(item.id, 'hasil_pemeriksaan', e.target.value || null)}
                                  className={`w-full h-8 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                                    item.hasil_pemeriksaan === 'NORMAL' || item.hasil_pemeriksaan === '√' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : item.hasil_pemeriksaan === 'ABNORMAL' || item.hasil_pemeriksaan === '-' ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-white border-gray-200 text-slate-600'
                                  }`} aria-label={`Hasil ${item.item_name}`}>
                                  <option value="">— pilih —</option>
                                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type="text" value={item.hasil_pemeriksaan ?? ''} onChange={(e) => handleItemChange(item.id, 'hasil_pemeriksaan', e.target.value || null)}
                                  className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                                  placeholder="..." aria-label={`Hasil ${item.item_name}`} />
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isCompleted ? (
                                <span className="text-slate-700">{item.keterangan ?? '—'}</span>
                              ) : (
                                <input type="text" value={item.keterangan ?? ''} onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value || null)}
                                  className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                                  placeholder="Keterangan..." aria-label={`Keterangan ${item.item_name}`} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section II — Lingkungan Kerja */}
      {activeTab === 'II' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="bg-amber-500 text-white">
                  <th className="px-3 py-2 text-left w-10">NO</th>
                  <th className="px-3 py-2 text-left">KEGIATAN</th>
                  <th className="px-3 py-2 text-center w-28">NOMINAL</th>
                  <th className="px-3 py-2 text-center w-36">HASIL</th>
                  <th className="px-3 py-2 text-left w-40">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {sectionIIItems.map((item, idx) => {
                  const opts = getDropdownOptions(item);
                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 text-slate-500 text-center">{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-700">{item.item_name}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{item.limit_value ?? '—'}</td>
                      <td className="px-3 py-2">
                        {isCompleted ? (
                          <span className="text-slate-700">{item.hasil_pemeriksaan ?? '—'}</span>
                        ) : opts ? (
                          <select value={item.hasil_pemeriksaan ?? ''} onChange={(e) => handleItemChange(item.id, 'hasil_pemeriksaan', e.target.value || null)}
                            className={`w-full h-8 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                              item.hasil_pemeriksaan === '√' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : item.hasil_pemeriksaan === '-' ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-white border-gray-200 text-slate-600'
                            }`} aria-label={`Hasil ${item.item_name}`}>
                            <option value="">— pilih —</option>
                            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={item.hasil_pemeriksaan ?? ''} onChange={(e) => handleItemChange(item.id, 'hasil_pemeriksaan', e.target.value || null)}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                            placeholder="Hasil..." aria-label={`Hasil ${item.item_name}`} />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isCompleted ? (
                          <span className="text-slate-700">{item.keterangan ?? '—'}</span>
                        ) : (
                          <input type="text" value={item.keterangan ?? ''} onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value || null)}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                            placeholder="Keterangan..." aria-label={`Keterangan ${item.item_name}`} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isCompleted && (
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2"><Save size={16} /> Simpan Perubahan</Button>
        </div>
      )}

      <CnsdDvorMeterSignaturePanel record={record} onSignSuccess={handleSignSuccess} />
    </div>
  );
};
