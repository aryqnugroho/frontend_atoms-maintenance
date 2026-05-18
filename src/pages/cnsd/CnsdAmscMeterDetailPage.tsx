import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Radio as AmscIcon,
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
import { cnsdAmscMeterService } from '@/services/cnsdAmscMeterService';
import { CnsdAmscMeterSignaturePanel } from './components/CnsdAmscMeterSignaturePanel';
import type { CnsdAmscMeterRecordDetail, CnsdAmscMeterItem } from '@/types/cnsdAmsc';

type SectionTab = '1' | '2' | '3' | '4';

const SECTION_TABS: { code: SectionTab; label: string }[] = [
  { code: '1', label: 'Front Panel' },
  { code: '2', label: 'Power Supply Unit' },
  { code: '3', label: 'Channel AMSC' },
  { code: '4', label: 'Lingkungan Kerja' },
];

// Dropdown options based on nominal
function getDropdownOptions(nominal: string | null): string[] | null {
  if (!nominal) return null;
  if (nominal === 'Normal / Alrm') return ['Normal', 'Alrm'];
  if (nominal === '√ / -') return ['√', '-'];
  if (nominal === 'OK / Not') return ['OK', 'Not'];
  if (nominal === '√') return ['√', '-'];
  return null;
}

// Channel status dropdown
const CHANNEL_STATUS_OPTIONS = ['Normal', 'U/S', 'Fault'];

export const CnsdAmscMeterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<CnsdAmscMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('1');

  // Local item state for editing
  const [localItems, setLocalItems] = useState<CnsdAmscMeterItem[]>([]);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await cnsdAmscMeterService.getRecord(Number(id));
      setRecord(data);
      setLocalItems(data.items);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data form AMSC.');
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
        hasil_a: it.hasil_a,
        hasil_b: it.hasil_b,
        hasil: it.hasil,
        status_value: it.status_value,
        cct: it.cct,
        keterangan: it.keterangan,
      }));
      const updated = await cnsdAmscMeterService.updateRecord(record.id, { items: payload });
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
        <Button onClick={() => navigate('/cnsd/amsc-meter')} className="mt-4">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/cnsd/amsc-meter')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Meter Reading AMSC
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{record.form_number}</span>
      </div>

      {/* Header */}
      <PageHeader
        icon={AmscIcon}
        iconBg="bg-sky-100"
        iconColor="text-maintenance-cnsd"
        title={`Meter Reading AMSC — ${record.form_number}`}
        subtitle={`${record.merk} ${record.type} | SN: ${record.serial_number ?? '-'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/cnsd/amsc-meter/${record.id}/print`)} className="gap-2">
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
          <ShiftBadge shift={record.shift_type} />
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
          {activeTab === '1' && <FrontPanelSection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
          {activeTab === '2' && <PowerSupplySection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
          {activeTab === '3' && <ChannelAmscSection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
          {activeTab === '4' && <EnvironmentSection items={sectionItems} isCompleted={isCompleted} onChange={handleItemChange} />}
        </div>
      </div>

      {/* Signature Panel */}
      <CnsdAmscMeterSignaturePanel record={record} onSignSuccess={fetchRecord} />
    </div>
  );
};

// ─── Section Components ─────────────────────────────────────

interface SectionProps {
  items: CnsdAmscMeterItem[];
  isCompleted: boolean;
  onChange: (id: number, field: string, value: string | null) => void;
}

const FrontPanelSection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        <th className="border border-gray-300 px-3 py-2 text-left w-12">NO</th>
        <th className="border border-gray-300 px-3 py-2 text-left">PEMBACAAN METER READING</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">NOMINAL</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">HASIL A</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">HASIL B</th>
        <th className="border border-gray-300 px-3 py-2 text-left w-40">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => {
        const options = getDropdownOptions(item.nominal);
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 text-center text-xs">{item.item_number}</td>
            <td className="border border-gray-300 px-3 py-2">{item.item_name}</td>
            <td className="border border-gray-300 px-3 py-2 text-center text-xs text-slate-500">{item.nominal}</td>
            <td className="border border-gray-300 px-2 py-1">
              {options ? (
                <select value={item.hasil_a ?? ''} onChange={(e) => onChange(item.id, 'hasil_a', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs text-center">
                  <option value="">—</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" value={item.hasil_a ?? ''} onChange={(e) => onChange(item.id, 'hasil_a', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" />
              )}
            </td>
            <td className="border border-gray-300 px-2 py-1">
              {options ? (
                <select value={item.hasil_b ?? ''} onChange={(e) => onChange(item.id, 'hasil_b', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs text-center">
                  <option value="">—</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" value={item.hasil_b ?? ''} onChange={(e) => onChange(item.id, 'hasil_b', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" />
              )}
            </td>
            <td className="border border-gray-300 px-2 py-1">
              <input type="text" value={item.keterangan ?? ''} onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Keterangan" />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const PowerSupplySection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        <th className="border border-gray-300 px-3 py-2 text-left w-12">NO</th>
        <th className="border border-gray-300 px-3 py-2 text-left">PEMBACAAN METER READING</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28 bg-slate-600 text-white">NOMINAL</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-32">HASIL</th>
        <th className="border border-gray-300 px-3 py-2 text-left w-40">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="border border-gray-300 px-3 py-2 text-center text-xs">{item.item_number}</td>
          <td className="border border-gray-300 px-3 py-2">{item.item_name}</td>
          <td className="border border-gray-300 px-3 py-2 bg-slate-200 text-center text-xs text-slate-400">—</td>
          <td className="border border-gray-300 px-2 py-1">
            <input type="text" value={item.hasil ?? ''} onChange={(e) => onChange(item.id, 'hasil', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Hasil" />
          </td>
          <td className="border border-gray-300 px-2 py-1">
            <input type="text" value={item.keterangan ?? ''} onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Keterangan" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ChannelAmscSection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        <th className="border border-gray-300 px-3 py-2 text-left w-12">NO</th>
        <th className="border border-gray-300 px-3 py-2 text-left">PEMBACAAN METER READING</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">ADDRESS</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-24">STATUS</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-24">CCT</th>
        <th className="border border-gray-300 px-3 py-2 text-left w-44">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, idx) => (
        <tr key={item.id} className={`hover:bg-gray-50 ${item.status_value === 'U/S' ? 'bg-red-50' : ''}`}>
          <td className="border border-gray-300 px-3 py-2 text-center text-xs">{idx + 1}</td>
          <td className="border border-gray-300 px-3 py-2">{item.item_name}</td>
          <td className="border border-gray-300 px-2 py-1 text-center text-xs font-mono">{item.address ?? ''}</td>
          <td className="border border-gray-300 px-2 py-1">
            <select value={item.status_value ?? ''} onChange={(e) => onChange(item.id, 'status_value', e.target.value || null)} disabled={isCompleted} className={`w-full h-8 rounded border border-gray-200 text-xs text-center ${item.status_value === 'U/S' ? 'bg-red-100 text-red-700' : ''}`}>
              <option value="">—</option>
              {CHANNEL_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </td>
          <td className="border border-gray-300 px-2 py-1">
            <input type="text" value={item.cct ?? ''} onChange={(e) => onChange(item.id, 'cct', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" />
          </td>
          <td className="border border-gray-300 px-2 py-1">
            <input type="text" value={item.keterangan ?? ''} onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Keterangan" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const EnvironmentSection: React.FC<SectionProps> = ({ items, isCompleted, onChange }) => (
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        <th className="border border-gray-300 px-3 py-2 text-left w-12">NO</th>
        <th className="border border-gray-300 px-3 py-2 text-left">KEGIATAN</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-28">Nominal</th>
        <th className="border border-gray-300 px-3 py-2 text-center w-36">HASIL PEMERIKSAAN</th>
        <th className="border border-gray-300 px-3 py-2 text-left w-44">KETERANGAN</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => {
        const options = getDropdownOptions(item.nominal);
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 text-center text-xs">{item.item_number}</td>
            <td className="border border-gray-300 px-3 py-2">{item.item_name}</td>
            <td className="border border-gray-300 px-3 py-2 text-center text-xs text-slate-500">{item.nominal}</td>
            <td className="border border-gray-300 px-2 py-1">
              {options ? (
                <select value={item.hasil ?? ''} onChange={(e) => onChange(item.id, 'hasil', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs text-center">
                  <option value="">—</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" value={item.hasil ?? ''} onChange={(e) => onChange(item.id, 'hasil', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Hasil" />
              )}
            </td>
            <td className="border border-gray-300 px-2 py-1">
              <input type="text" value={item.keterangan ?? ''} onChange={(e) => onChange(item.id, 'keterangan', e.target.value || null)} disabled={isCompleted} className="w-full h-8 rounded border border-gray-200 text-xs px-2" placeholder="Keterangan" />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);
