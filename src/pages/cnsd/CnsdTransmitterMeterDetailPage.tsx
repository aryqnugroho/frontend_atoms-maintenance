import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Radio as TransmitterIcon,
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
import { cnsdTransmitterMeterService } from '@/services/cnsdTransmitterMeterService';
import { CnsdTransmitterMeterSignaturePanel } from './components/CnsdTransmitterMeterSignaturePanel';
import type { CnsdTransmitterMeterRecordDetail, CnsdTransmitterMeterItem } from '@/types/cnsdTransmitter';

type SectionTab = '1' | '2';

const SECTION_TABS: { code: SectionTab; label: string }[] = [
  { code: '1', label: 'Transmitter' },
  { code: '2', label: 'Lingkungan Kerja' },
];

// ─── Status dropdown helper ─────────────────────────────────

/**
 * Determines the status dropdown options for a transmitter item.
 * Returns null if the item should not have a status dropdown (headers, blocked, section 2).
 */
function getStatusOptions(item: CnsdTransmitterMeterItem): string[] | null {
  if (item.is_blocked || item.is_header || item.section_code === '2') return null;
  // Frequency label rows don't have status dropdowns
  if (!item.tx_label) return null;

  const merk = item.merk?.toUpperCase() ?? '';
  const group = item.group_number;

  // Group 9 = Back Up Radio, always blocked
  if (group === 9) return null;

  // CDU (group 3) = all Online/Offline
  if (group === 3) return ['Online', 'Offline'];

  // OTE merk = Online/Offline
  if (merk === 'OTE') return ['Online', 'Offline'];

  // PAE merk and everything else = On Air/STBY
  return ['On Air', 'STBY'];
}

// ─── Lingkungan Kerja dropdown helper ───────────────────────

function getEnvironmentDropdownOptions(item: CnsdTransmitterMeterItem): string[] | null {
  const nominal = item.nominal;
  if (!nominal) return null;
  if (nominal === '√') return ['√', '-'];
  return null;
}

export const CnsdTransmitterMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  const [record, setRecord] = useState<CnsdTransmitterMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('1');

  // Local item state for editing
  const [localItems, setLocalItems] = useState<CnsdTransmitterMeterItem[]>([]);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await cnsdTransmitterMeterService.getRecord(Number(id));
      setRecord(data);
      setLocalItems(data.items);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data form Transmitter.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  const handleItemChange = (itemId: number, field: string, value: string | null) => {
    setLocalItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload = localItems.map((it) => ({
        id: it.id,
        status_value: it.status_value,
        power_output: it.power_output,
        modulasi: it.modulasi,
        keterangan: it.keterangan,
        hasil: it.hasil,
      }));
      const updated = await cnsdTransmitterMeterService.updateRecord(record.id, { items: payload });
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

  const handleRecordUpdate = (updated: CnsdTransmitterMeterRecordDetail) => {
    setRecord(updated);
    setLocalItems(updated.items);
  };

  const isCompleted = record?.status === 'completed';

  const sectionItems = localItems.filter((it) => it.section_code === activeTab);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-red-600">{errorMessage ?? 'Form tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/cnsd/transmitter-meter')} className="mt-4">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/cnsd/transmitter-meter')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Meter Reading Transmitter
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{record.form_number}</span>
      </div>

      {/* Header */}
      <PageHeader
        icon={TransmitterIcon}
        iconBg="bg-sky-100"
        iconColor="text-maintenance-cnsd"
        title={`Meter Reading Transmitter — ${record.form_number}`}
        subtitle={`FORM C-1 | ${record.location}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/cnsd/transmitter-meter/${record.id}/print`)} className="gap-2">
              <Printer size={15} /> Print
            </Button>
            {!isCompleted && (
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={15} /> Simpan Perubahan
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
      {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={12} /> Tanggal</div>
          <p className="text-sm font-semibold text-slate-800">{record.date}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">Shift</div>
          <ShiftBadge shift={record.shift_type as import('@/types').ShiftType} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} /> Lokasi</div>
          <p className="text-sm font-medium text-slate-800">{record.location}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Users size={12} /> Teknisi CNSD</div>
          <p className="text-sm font-semibold text-slate-800">{record.technicians.length} orang</p>
        </div>
      </div>

      {/* Status + personnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <StatusBadge status={record.status} variant="pill" />
        <span className="text-xs text-slate-500">Form Code: <strong className="text-slate-700">{record.form_code}</strong></span>
        <span className="text-xs text-slate-500">Manager: <strong className="text-slate-700">{record.manager?.name ?? 'Tidak ditugaskan'}</strong></span>
        <span className="text-xs text-slate-500">Supervisor: <strong className="text-slate-700">{record.supervisor?.name ?? 'Tidak ditugaskan'}</strong></span>
      </div>

      {/* Section tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setActiveTab(tab.code)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.code
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-x-auto">
          {activeTab === '1' && <TransmitterSection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
          {activeTab === '2' && <EnvironmentSection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
        </div>
      </div>

      {/* Signature Panel */}
      <CnsdTransmitterMeterSignaturePanel record={record} onRecordUpdate={handleRecordUpdate} />
    </div>
  );
};

// ─── Section Components ─────────────────────────────────────

interface SectionProps {
  items: CnsdTransmitterMeterItem[];
  isCompleted: boolean;
  onChange: (id: number, field: string, value: string | null) => void;
}

const TransmitterSection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => {
  // Track row numbering (skip headers and frequency labels)
  let rowNumber = 0;

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-green-50">
          <th className="border border-gray-300 px-3 py-2 text-center w-12">NO</th>
          <th className="border border-gray-300 px-3 py-2 text-left">FREQUENCY</th>
          <th className="border border-gray-300 px-3 py-2 text-center w-24">MERK</th>
          <th className="border border-gray-300 px-3 py-2 text-center w-28">STATUS</th>
          <th className="border border-gray-300 px-3 py-2 text-center w-28">POWER O/P</th>
          <th className="border border-gray-300 px-3 py-2 text-center w-28">MODULASI</th>
          <th className="border border-gray-300 px-3 py-2 text-left w-40">KETERANGAN</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          // Group header row
          if (item.is_header) {
            return (
              <tr key={item.id} className="bg-green-100">
                <td className="border border-gray-300 px-3 py-2 text-center font-bold">{item.group_number}</td>
                <td className="border border-gray-300 px-3 py-2 font-bold uppercase" colSpan={6}>
                  {item.group_name}
                </td>
              </tr>
            );
          }

          // Frequency label row (no tx_label means it's a frequency label row)
          if (!item.tx_label && item.frequency_label) {
            return (
              <tr key={item.id} className="bg-orange-50">
                <td className="border border-gray-300 px-3 py-2 text-center text-xs"></td>
                <td className="border border-gray-300 px-3 py-2 font-medium text-slate-700">
                  {item.frequency_label}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-xs text-slate-500">
                  {item.merk ?? ''}
                </td>
                <td className="border border-gray-300 px-3 py-2" colSpan={4}></td>
              </tr>
            );
          }

          // TX data row
          rowNumber++;
          const statusOptions = getStatusOptions(item);
          const isBlocked = item.is_blocked || item.group_number === 9;

          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 text-center text-xs">{rowNumber}</td>
              <td className="border border-gray-300 px-3 py-2">
                {item.tx_label ?? item.frequency_label ?? ''}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-xs text-slate-500">
                {item.merk ?? ''}
              </td>
              {/* Status cell */}
              <td className={`border border-gray-300 px-2 py-1 ${isBlocked ? 'bg-slate-300' : ''}`}>
                {isBlocked ? (
                  <span className="text-xs text-slate-500 italic">—</span>
                ) : statusOptions ? (
                  <select
                    value={item.status_value ?? ''}
                    onChange={(e) => onChange(item.id, 'status_value', e.target.value || null)}
                    disabled={isCompleted}
                    className="w-full h-8 rounded border border-gray-200 text-xs text-center"
                  >
                    <option value="">—</option>
                    {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={item.status_value ?? ''}
                    onChange={(e) => onChange(item.id, 'status_value', e.target.value || null)}
                    disabled={isCompleted}
                    className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                  />
                )}
              </td>
              {/* Power O/P */}
              <td className="border border-gray-300 px-2 py-1">
                <input
                  type="text"
                  value={item.power_output ?? ''}
                  onChange={(e) => onChange(item.id, 'power_output', e.target.value || null)}
                  disabled={isCompleted}
                  className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                  placeholder="Power O/P"
                />
              </td>
              {/* Modulasi */}
              <td className="border border-gray-300 px-2 py-1">
                <input
                  type="text"
                  value={item.modulasi ?? ''}
                  onChange={(e) => onChange(item.id, 'modulasi', e.target.value || null)}
                  disabled={isCompleted}
                  className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                  placeholder="Modulasi"
                />
              </td>
              {/* Keterangan */}
              <td className="border border-gray-300 px-2 py-1">
                <input
                  type="text"
                  value={item.keterangan ?? ''}
                  onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)}
                  disabled={isCompleted}
                  className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                  placeholder="Keterangan"
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const EnvironmentSection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        <th className="border border-gray-300 px-3 py-2 text-left w-12">NO</th>
        <th className="border border-gray-300 px-3 py-2 text-left">KEGIATAN</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">NOMINAL</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-36">HASIL</th>
        <th className="border border-gray-300 px-3 py-2 text-left w-44">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, idx) => {
        const options = getEnvironmentDropdownOptions(item);
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 text-center text-xs">{idx + 1}</td>
            <td className="border border-gray-300 px-3 py-2">{item.group_name ?? item.frequency_label ?? ''}</td>
            <td className="border border-gray-300 px-3 py-2 text-center text-xs text-slate-500">{item.nominal ?? ''}</td>
            <td className="border border-gray-300 px-2 py-1">
              {options ? (
                <select
                  value={item.hasil ?? ''}
                  onChange={(e) => onChange(item.id, 'hasil', e.target.value || null)}
                  disabled={isCompleted}
                  className="w-full h-8 rounded border border-gray-200 text-xs text-center"
                >
                  <option value="">—</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={item.hasil ?? ''}
                  onChange={(e) => onChange(item.id, 'hasil', e.target.value || null)}
                  disabled={isCompleted}
                  className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                  placeholder="Hasil"
                />
              )}
            </td>
            <td className="border border-gray-300 px-2 py-1">
              <input
                type="text"
                value={item.keterangan ?? ''}
                onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)}
                disabled={isCompleted}
                className="w-full h-8 rounded border border-gray-200 text-xs px-2"
                placeholder="Keterangan"
              />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);
