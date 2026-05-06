import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Radio as RadioIcon,
  Zap,
  Activity,
  Radar,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

// ─── Data Structure Constants ────────────────────────────────

interface EQ1Item {
  id: string;
  name: string;
  type: 'single' | 'parent';
  children?: string[];
  frequencies?: string[];
}

interface EQ1Category {
  id: number;
  title: string;
  icon: React.ElementType;
  color: string;
  headers: string[];
  items: EQ1Item[];
}

const EQ1_STRUCTURE: EQ1Category[] = [
  {
    id: 1,
    title: 'KOMUNIKASI PENERBANGAN',
    icon: Zap,
    color: 'emerald',
    headers: ['SERVER AKTIF', 'DUAL STATE'],
    items: [
      { id: '1.1', name: 'VCCS MERA FREQUENTIS', type: 'single' },
      { id: '1.2', name: 'VOICE RECORDER', type: 'single' },
      { id: '1.3', name: 'AMSC', type: 'single' },
      { id: '1.4', name: 'ATIS', type: 'single' },
    ]
  },
  {
    id: 2,
    title: 'RADIO',
    icon: RadioIcon,
    color: 'blue',
    headers: ['DUAL STATUS', 'FREQUENCY'],
    items: [
      { id: '2.1', name: 'CDU', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['121,65 MHz', '121,80 MHz'] },
      { id: '2.2', name: 'GMC', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['118,90 MHz', '119,15 MHz'] },
      { id: '2.3', name: 'ADC', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['118,30 MHz', '118,10 MHz'] },
      { id: '2.4', name: 'APP DIRECTOR', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['123,20 MHz', '124,50 MHz'] },
      { id: '2.5', name: 'APP WEST', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['125,10 MHz', '123,55 MHz'] },
      { id: '2.6', name: 'APP EAST', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['124,00 MHz', '122,85 MHz'] },
      { id: '2.7', name: 'EMERGENCY', type: 'single', frequencies: ['121,50 MHz'] },
      { id: '2.8', name: 'VHF ER UPKN', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['134,10 MHz', '133,60 MHz'] },
      { id: '2.9', name: 'VHF E/R UBLI', type: 'single', frequencies: ['120,70 MHz'] },
      { id: '2.10', name: 'VHF ER USBY', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['123,90 MHz', '125,90 MHz'] },
      { id: '2.11', name: 'VHF ER BLORA', type: 'parent', children: ['PRIMARY', 'SECONDARY'], frequencies: ['125,10 MHz', '123,55 MHz'] },
    ]
  },
  {
    id: 3,
    title: 'NAVIGASI PENERBANGAN',
    icon: Activity,
    color: 'amber',
    headers: ['TX OPERASI', 'DUAL STATE'],
    items: [
      { id: '3.1', name: 'LOCALIZER', type: 'single' },
      { id: '3.2', name: 'GLIDE PATH', type: 'single' },
      { id: '3.3', name: 'TDME', type: 'single' },
      { id: '3.4', name: 'DVOR', type: 'single' },
      { id: '3.5', name: 'DME', type: 'single' },
    ]
  },
  {
    id: 4,
    title: 'PENGAMATAN PENERBANGAN',
    icon: Radar,
    color: 'sky',
    headers: ['CHANNEL AKTIF', 'DUAL STATE'],
    items: [
      { id: '4.1', name: 'PSR', type: 'single' },
      { id: '4.2', name: 'MSSR', type: 'single' },
      { id: '4.3', name: 'ADS-B STATUS', type: 'single' },
      { id: '4.4', name: 'MLAT', type: 'single' },
    ]
  },
  {
    id: 5,
    title: 'AUTOMASI PENERBANGAN',
    icon: Monitor,
    color: 'rose',
    headers: ['SERVER STATE', 'WORKSTATION STATE'],
    items: [
      { id: '5.1', name: 'ATC SYSTEM TERN', type: 'single' },
      { id: '5.2', name: 'ATC SYSTEM NOVA', type: 'single' },
      { id: '5.3', name: 'ASMGCS', type: 'single' },
    ]
  }
];

// ─── Component ───────────────────────────────────────────────

export const CnsdEq1FormPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    lokasi: 'CABANG SURABAYA',
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    data: {} as Record<string, any>,
    signatures: {
      teknisi: '',
      supervisor: '',
      manager: ''
    }
  });

  const handleHeaderChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      signatures: { ...prev.signatures, [field]: value }
    }));
  };

  const handleSingleItemChange = (itemId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [itemId]: { ...prev.data[itemId], [field]: value }
      }
    }));
  };

  const handleChildItemChange = (itemId: string, child: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [itemId]: {
          ...prev.data[itemId],
          [child]: { ...prev.data[itemId]?.[child], [field]: value }
        }
      }
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Form Submitted:', formData);

    setTimeout(() => {
      alert('Laporan Kesiapan Peralatan (EQ-1) berhasil disimpan!');
      setIsSubmitting(false);
      navigate('/cnsd');
    }, 1000);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin meriset form ini?')) {
      setFormData({
        lokasi: 'CABANG SURABAYA',
        tanggal: new Date().toISOString().split('T')[0],
        jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        data: {},
        signatures: { teknisi: '', supervisor: '', manager: '' }
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cnsd')}
            className="hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Form EQ-1: Kesiapan Peralatan</h1>
            <p className="text-sm text-slate-500">Main Equipment Room — CNSD Readiness</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            <MapPin size={16} className="text-slate-400" />
            <input
              value={formData.lokasi}
              onChange={(e) => handleHeaderChange('lokasi', e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-40 font-medium p-0"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => handleHeaderChange('tanggal', e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-medium p-0"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {EQ1_STRUCTURE.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 gap-2",
              activeSection === section.id
                ? "bg-slate-900 border-slate-900 text-white shadow-md"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
            )}
          >
            <section.icon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Main Form Area */}
      <form onSubmit={onSubmit} className="space-y-6">
        {EQ1_STRUCTURE.filter(s => s.id === activeSection).map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
            <div className={cn("px-6 py-4 border-b flex items-center justify-between bg-slate-50/50 border-slate-100")}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-100 text-slate-700")}>
                  <section.icon size={20} />
                </div>
                <h2 className="font-bold text-slate-800">{section.title}</h2>
              </div>
              <div className="text-xs font-medium text-slate-500">
                {section.items.length} Peralatan
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <th className="px-6 py-4 text-left w-12">No</th>
                    <th className="px-6 py-4 text-left w-64">Nama Peralatan</th>
                    <th className="px-6 py-4 text-center w-40">Status</th>
                    <th className="px-6 py-4 text-left">{section.headers[0]}</th>
                    <th className="px-6 py-4 text-left">{section.headers[1]}</th>
                    <th className="px-6 py-4 text-left w-64">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {section.items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {item.type === 'single' ? (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-6 py-5 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-6 py-5">
                            <StatusDropdown
                              value={formData.data[item.id]?.status || 'Normal'}
                              onChange={(v) => handleSingleItemChange(item.id, 'status', v)}
                            />
                          </td>
                          <td className="px-6 py-5">
                            {section.id === 2 && item.frequencies ? (
                              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-bold">
                                {item.frequencies[0]}
                              </span>
                            ) : (
                              <input
                                value={formData.data[item.id]?.cond1 || ''}
                                onChange={(e) => handleSingleItemChange(item.id, 'cond1', e.target.value)}
                                placeholder="..."
                                className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                              />
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <input
                              value={formData.data[item.id]?.cond2 || ''}
                              onChange={(e) => handleSingleItemChange(item.id, 'cond2', e.target.value)}
                              placeholder="..."
                              className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <input
                              value={formData.data[item.id]?.note || ''}
                              onChange={(e) => handleSingleItemChange(item.id, 'note', e.target.value)}
                              placeholder="Catatan"
                              className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                            />
                          </td>
                        </tr>
                      ) : (
                        item.children?.map((child, cIdx) => (
                          <tr key={`${item.id}-${child}`} className="hover:bg-slate-50 transition-colors">
                            {cIdx === 0 && (
                              <>
                                <td rowSpan={item.children?.length} className="px-6 py-5 text-slate-400 font-mono text-xs border-r border-slate-100">{idx + 1}</td>
                                <td rowSpan={item.children?.length} className="px-6 py-5 font-semibold text-slate-800 border-r border-slate-100">
                                  {item.name}
                                </td>
                              </>
                            )}
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{child}</span>
                                <StatusDropdown
                                  value={formData.data[item.id]?.[child]?.status || 'Normal'}
                                  onChange={(v) => handleChildItemChange(item.id, child, 'status', v)}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {section.id === 2 && item.frequencies ? (
                                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-bold">
                                  {item.frequencies[cIdx]}
                                </span>
                              ) : (
                                <input
                                  value={formData.data[item.id]?.[child]?.cond1 || ''}
                                  onChange={(e) => handleChildItemChange(item.id, child, 'cond1', e.target.value)}
                                  placeholder="..."
                                  className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                                />
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <input
                                value={formData.data[item.id]?.[child]?.cond2 || ''}
                                onChange={(e) => handleChildItemChange(item.id, child, 'cond2', e.target.value)}
                                placeholder="..."
                                className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <input
                                value={formData.data[item.id]?.[child]?.note || ''}
                                onChange={(e) => handleChildItemChange(item.id, child, 'note', e.target.value)}
                                placeholder="Catatan"
                                className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs focus:ring-slate-200"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Signature Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Teknisi', key: 'teknisi' },
            { label: 'Supervisor', key: 'supervisor' },
            { label: 'Manager Teknik', key: 'manager' }
          ].map((sig) => (
            <div key={sig.key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">{sig.label}</h4>
              <div className="space-y-3">
                <input
                  value={(formData.signatures as any)[sig.key]}
                  onChange={(e) => handleSignatureChange(sig.key, e.target.value)}
                  placeholder={`Nama ${sig.label}`}
                  className="w-full h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-slate-200"
                />
                <div className="h-28 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-[10px] italic">
                  Area Paraf / Tanda Tangan
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-slate-500"
          >
            <RotateCcw size={18} />
            Reset Form
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2 px-10 shadow-lg shadow-indigo-100"
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ─── Helper Components ───────────────────────────────────────

const StatusDropdown: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-9 rounded-lg text-xs font-bold border-none focus:ring-2 px-3",
        value === 'Normal'
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      )}
    >
      <option value="Normal">NORMAL</option>
      <option value="Tidak Normal">TIDAK NORMAL</option>
    </select>
  );
};


