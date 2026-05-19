import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Radio,
  ArrowLeft,
  Save,
  Printer,
  Users,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ShiftBadge } from '@/components/common/ShiftBadge';
import { useAuth } from '@/hooks/useAuth';
import { cnsdReceiverMeterService } from '@/services/cnsdReceiverMeterService';
import { CnsdReceiverMeterSignaturePanel } from './components/CnsdReceiverMeterSignaturePanel';
import type { CnsdReceiverMeterRecordDetail, CnsdReceiverMeterItem } from '@/types/cnsdReceiver';

type SectionTab = '1' | '2';

const SECTION_TABS: { code: SectionTab; label: string }[] = [
  { code: '1', label: 'Receiver' },
  { code: '2', label: 'Lingkungan Kerja' },
];

// Status dropdown options for receiver items
const STATUS_OPTIONS = ['ON LINE', 'OFF LINE'];

// Environment dropdown options
function getEnvDropdownOptions(item: CnsdReceiverMeterItem): string[] | null {
  const nominal = item.nominal;
  if (!nominal) return null;
  if (nominal === '√') return ['√', '-'];
  return null;
}

export const CnsdReceiverMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  const [record, setRecord] = useState<CnsdReceiverMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('1');
  const [localItems, setLocalItems] = useState<CnsdReceiverMeterItem[]>([]);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await cnsdReceiverMeterService.getRecord(Number(id));
      setRecord(data);
      setLocalItems(data.items);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data form Receiver.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  const handleItemChange = (itemId: number, field: string, value: string | null) => {
    setLocalItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)));
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await cnsdReceiverMeterService.updateRecord(record.id, {
        items: localItems.map((it) => ({
          id: it.id,
          status_a: it.status_a,
          status_b: it.status_b,
          sequelsh_on: it.sequelsh_on,
          keterangan: it.keterangan,
          hasil: it.hasil,
        })),
      });
      setRecord(updated);
      setLocalItems(updated.items);
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignSuccess = (updated: CnsdReceiverMeterRecordDetail) => {
    setRecord(updated);
    setLocalItems(updated.items);
  };

  // Compute grouped items for section 1 — must be called unconditionally (Rules of Hooks)
  const groupedItems = useMemo(() => {
    if (activeTab !== '1') return null;
    const groups: Map<number, CnsdReceiverMeterItem[]> = new Map();
    const section1 = localItems.filter((it) => it.section_code === '1');
    for (const item of section1) {
      const gn = item.group_number ?? 0;
      if (!groups.has(gn)) groups.set(gn, []);
      groups.get(gn)!.push(item);
    }
    return groups;
  }, [activeTab, localItems]);

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
  const sectionItems = localItems.filter((it) => it.section_code === activeTab);

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/cnsd')}
          className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} /> CNSD
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('/cnsd/receiver-meter')}
          className="hover:text-slate-700 transition-colors"
        >
          Meter Reading Receiver
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium font-mono">{record.form_number}</span>
      </div>

      <PageHeader
        icon={Radio}
        iconBg="bg-sky-100"
        iconColor="text-maintenance-cnsd"
        title={`Meter Reading Receiver — ${record.form_number}`}
        subtitle={`${record.form_code} · ${record.location}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/cnsd/receiver-meter/${record.id}/print`)}
              className="gap-2"
            >
              <Printer size={16} /> Print PDF
            </Button>
            {!isCompleted && (
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={16} /> Simpan Perubahan
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Header info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Tanggal</p>
              <p className="font-medium text-slate-800">{record.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div>
              <p className="text-xs text-slate-500">Shift</p>
              <ShiftBadge shift={record.shift_type as import('@/types').ShiftType} />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Lokasi</p>
              <p className="font-medium text-slate-800">{record.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <StatusBadge status={record.status} variant="pill" />
            </div>
          </div>
          {record.merk && (
            <div>
              <p className="text-xs text-slate-500">Merk</p>
              <p className="font-medium text-slate-800">{record.merk}</p>
            </div>
          )}
          {record.type && (
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <p className="font-medium text-slate-800">{record.type}</p>
            </div>
          )}
          {record.serial_number && (
            <div>
              <p className="text-xs text-slate-500">S/N</p>
              <p className="font-medium text-slate-800">{record.serial_number}</p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Users size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Teknisi</p>
              <p className="font-medium text-slate-800">
                {record.technicians.map((t) => t.technician_name).join(', ') || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.code}
            onClick={() => setActiveTab(tab.code)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.code
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1 — Receiver */}
      {activeTab === '1' && groupedItems && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="bg-sky-800 text-white">
                  <th className="px-3 py-2 text-left w-10">NO</th>
                  <th className="px-3 py-2 text-left">PEMERIKSAAN</th>
                  <th className="px-3 py-2 text-center w-36">STATUS A</th>
                  <th className="px-3 py-2 text-center w-36">STATUS B</th>
                  <th className="px-3 py-2 text-center w-32">SEQUELSH ON</th>
                  <th className="px-3 py-2 text-left w-40">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(groupedItems.entries()).map(([, groupItems]) => {
                  const headerRow = groupItems.find((it) => it.is_header);
                  const dataRows = groupItems.filter((it) => !it.is_header);
                  return (
                    <React.Fragment key={headerRow?.id ?? groupItems[0]?.id}>
                      {/* Group header */}
                      {headerRow && (
                        <tr className="bg-amber-100">
                          <td colSpan={6} className="px-3 py-1.5 font-semibold text-slate-700 text-xs">
                            {headerRow.group_name}
                          </td>
                        </tr>
                      )}
                      {/* Data rows */}
                      {dataRows.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        >
                          <td className="px-3 py-2 text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-3 py-2 text-slate-700">{item.item_name}</td>
                          <td className="px-3 py-2">
                            {isCompleted ? (
                              <span className={`text-xs font-medium ${item.status_a === 'ON LINE' ? 'text-emerald-700' : item.status_a === 'OFF LINE' ? 'text-red-600' : 'text-slate-500'}`}>
                                {item.status_a ?? '—'}
                              </span>
                            ) : (
                              <select
                                value={item.status_a ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'status_a', e.target.value || null)}
                                className={`w-full h-8 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                                  item.status_a === 'ON LINE'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : item.status_a === 'OFF LINE'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-white border-gray-200 text-slate-600'
                                }`}
                                aria-label={`Status A ${item.item_name}`}
                              >
                                <option value="">— pilih —</option>
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isCompleted ? (
                              <span className={`text-xs font-medium ${item.status_b === 'ON LINE' ? 'text-emerald-700' : item.status_b === 'OFF LINE' ? 'text-red-600' : 'text-slate-500'}`}>
                                {item.status_b ?? '—'}
                              </span>
                            ) : (
                              <select
                                value={item.status_b ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'status_b', e.target.value || null)}
                                className={`w-full h-8 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                                  item.status_b === 'ON LINE'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : item.status_b === 'OFF LINE'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-white border-gray-200 text-slate-600'
                                }`}
                                aria-label={`Status B ${item.item_name}`}
                              >
                                <option value="">— pilih —</option>
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isCompleted ? (
                              <span className="text-slate-700">{item.sequelsh_on ?? '—'}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.sequelsh_on ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'sequelsh_on', e.target.value || null)}
                                className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                                placeholder="..."
                                aria-label={`Sequelsh On ${item.item_name}`}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isCompleted ? (
                              <span className="text-slate-700">{item.keterangan ?? '—'}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.keterangan ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value || null)}
                                className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                                placeholder="Keterangan..."
                                aria-label={`Keterangan ${item.item_name}`}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2 — Lingkungan Kerja */}
      {activeTab === '2' && (
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
                {sectionItems.map((item, idx) => {
                  const dropdownOpts = getEnvDropdownOptions(item);
                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 text-slate-500 text-center">{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-700">{item.item_name}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{item.nominal ?? '—'}</td>
                      <td className="px-3 py-2">
                        {isCompleted ? (
                          <span className="text-slate-700">{item.hasil ?? '—'}</span>
                        ) : dropdownOpts ? (
                          <select
                            value={item.hasil ?? ''}
                            onChange={(e) => handleItemChange(item.id, 'hasil', e.target.value || null)}
                            className={`w-full h-8 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                              item.hasil === '√'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : item.hasil === '-'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-white border-gray-200 text-slate-600'
                            }`}
                            aria-label={`Hasil ${item.item_name}`}
                          >
                            <option value="">— pilih —</option>
                            {dropdownOpts.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={item.hasil ?? ''}
                            onChange={(e) => handleItemChange(item.id, 'hasil', e.target.value || null)}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                            placeholder="Hasil..."
                            aria-label={`Hasil ${item.item_name}`}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isCompleted ? (
                          <span className="text-slate-700">{item.keterangan ?? '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.keterangan ?? ''}
                            onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value || null)}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                            placeholder="Keterangan..."
                            aria-label={`Keterangan ${item.item_name}`}
                          />
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

      {/* Save button (bottom) */}
      {!isCompleted && (
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
            <Save size={16} /> Simpan Perubahan
          </Button>
        </div>
      )}

      {/* Signature panel */}
      <CnsdReceiverMeterSignaturePanel record={record} onSignSuccess={handleSignSuccess} />
    </div>
  );
};
