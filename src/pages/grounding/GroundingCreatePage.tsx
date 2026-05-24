import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Save, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { GroundingVisualItem, GroundingMeasurementItem } from '@/types';

const INITIAL_VISUAL_ITEMS: GroundingVisualItem[] = [
  { no: 1, name: 'Terminal Udara', ketersediaan: '', kondisi: '', catatan: '' },
  { no: 2, name: 'Konduktor Turun', ketersediaan: '', kondisi: '', catatan: '' },
  { no: 3, name: 'Modul Penangkal Petir', ketersediaan: '', kondisi: '', catatan: '' },
  { no: 4, name: 'Sambungan dan Clamp', ketersediaan: '', kondisi: '', catatan: '' },
  { no: 5, name: 'Kabel Pembumian', ketersediaan: '', kondisi: '', catatan: '' },
  { no: 6, name: 'Lightning Counter', ketersediaan: '', kondisi: '', catatan: '' },
];

const INITIAL_MEASUREMENT_ITEMS: GroundingMeasurementItem[] = [
  { no: 1, name: 'Nilai Tahanan Tahanan Tanah', standard: '≤ 1 Ω', kondisi: '', hasilPengukuran: '' },
  { no: 2, name: 'Nilai Tahanan Pentanahan Peralatan', standard: '≤ 1 Ω', kondisi: '', hasilPengukuran: '' },
  { no: 3, name: 'Uji Kontinitas Konduktor Turun dan Kabel Pentanahan', standard: '', kondisi: '', hasilPengukuran: '' },
];

const KANTOR_OPTIONS = [
  'Cabang Surabaya',
  'Cabang Kediri',
  'Cabang Malang',
  'Cabang Semarang',
];

export const GroundingCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Header form state
  const [kantorUnitKerja, setKantorUnitKerja] = useState('');
  const [namaPeralatan, setNamaPeralatan] = useState('');
  const [lokasiPeralatan, setLokasiPeralatan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [dibuatOleh, setDibuatOleh] = useState('');
  const [disetujuiOleh, setDisetujuiOleh] = useState('');

  // Checklist state
  const [visualItems, setVisualItems] = useState<GroundingVisualItem[]>(
    INITIAL_VISUAL_ITEMS.map(item => ({ ...item }))
  );
  const [measurementItems, setMeasurementItems] = useState<GroundingMeasurementItem[]>(
    INITIAL_MEASUREMENT_ITEMS.map(item => ({ ...item }))
  );

  const handleVisualChange = (index: number, field: keyof GroundingVisualItem, value: string) => {
    setVisualItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleMeasurementChange = (index: number, field: keyof GroundingMeasurementItem, value: string) => {
    setMeasurementItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleReset = () => {
    setKantorUnitKerja('');
    setNamaPeralatan('');
    setLokasiPeralatan('');
    setTanggal('');
    setDibuatOleh('');
    setDisetujuiOleh('');
    setVisualItems(INITIAL_VISUAL_ITEMS.map(item => ({ ...item })));
    setMeasurementItems(INITIAL_MEASUREMENT_ITEMS.map(item => ({ ...item })));
  };

  const handleSave = () => {
    // Mock-only handler — real persistence flow lives at
    // GroundingReportDetailPage. This page is unrouted scaffolding.
    alert('Laporan berhasil disimpan (mock)');
    navigate('/grounding');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header — matching other create pages */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
          <Zap size={20} className="text-yellow-700" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl text-slate-900">Pembuatan Laporan Grounding & Penangkal Petir</h1>
          <p className="text-sm text-slate-500">Isi form checklist pemeriksaan sistem penangkal petir dan pembumian</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar — Header Fields */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 sticky top-4">
            <h3 className="text-sm font-semibold text-slate-700 pb-2 border-b border-gray-100">Data Laporan</h3>

            {/* Kantor Unit Kerja */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kantor Unit Kerja</label>
              <select
                value={kantorUnitKerja}
                onChange={e => setKantorUnitKerja(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">Pilih kantor...</option>
                {KANTOR_OPTIONS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Nama Peralatan */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nama Peralatan</label>
              <input
                type="text"
                value={namaPeralatan}
                onChange={e => setNamaPeralatan(e.target.value)}
                placeholder="Nama Peralatan"
                className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Lokasi Peralatan */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Lokasi Peralatan</label>
              <input
                type="text"
                value={lokasiPeralatan}
                onChange={e => setLokasiPeralatan(e.target.value)}
                placeholder="Lokasi Peralatan"
                className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Dibuat Oleh */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dibuat Oleh</label>
              <input
                type="text"
                value={dibuatOleh}
                onChange={e => setDibuatOleh(e.target.value)}
                placeholder="Nama pembuat"
                className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Disetujui Oleh */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Disetujui Oleh</label>
              <input
                type="text"
                value={disetujuiOleh}
                onChange={e => setDisetujuiOleh(e.target.value)}
                placeholder="Nama penyetuju"
                className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right — Checklist Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Title */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-800">Checklist Fasilitas dan Peralatan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pemeliharaan Sistem Penangkal Petir dan Sistem Pembumian</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="grounding-table">
                <thead>
                  <tr>
                    <th colSpan={2} rowSpan={2} className="min-w-[40px]" />
                    <th colSpan={1} rowSpan={2} className="min-w-[200px]">Item Pemeriksaan</th>
                    <th colSpan={2}>Hasil Pemeriksaan</th>
                    <th rowSpan={2} className="min-w-[160px]">Catatan / Keterangan</th>
                  </tr>
                  <tr>
                    <th className="min-w-[140px]">Ketersediaan</th>
                    <th className="min-w-[140px]">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Visual section header */}
                  <tr>
                    <td colSpan={6} className="grounding-section-header px-4 py-2">
                      Visual
                    </td>
                  </tr>

                  {/* Visual items */}
                  {visualItems.map((item, idx) => (
                    <tr key={`visual-${item.no}`}>
                      <td className="text-center text-slate-500 font-medium w-10">{item.no}</td>
                      <td colSpan={1} />
                      <td className="text-slate-700">{item.name}</td>
                      <td>
                        <div className="grounding-radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`visual-ketersediaan-${item.no}`}
                              checked={item.ketersediaan === 'Ada'}
                              onChange={() => handleVisualChange(idx, 'ketersediaan', 'Ada')}
                            />
                            Ada
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`visual-ketersediaan-${item.no}`}
                              checked={item.ketersediaan === 'Tidak Ada'}
                              onChange={() => handleVisualChange(idx, 'ketersediaan', 'Tidak Ada')}
                            />
                            Tidak Ada
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="grounding-radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`visual-kondisi-${item.no}`}
                              checked={item.kondisi === 'Baik'}
                              onChange={() => handleVisualChange(idx, 'kondisi', 'Baik')}
                            />
                            Baik
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`visual-kondisi-${item.no}`}
                              checked={item.kondisi === 'Tidak Baik'}
                              onChange={() => handleVisualChange(idx, 'kondisi', 'Tidak Baik')}
                            />
                            Tidak Baik
                          </label>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.catatan}
                          onChange={e => handleVisualChange(idx, 'catatan', e.target.value)}
                          className="grounding-note-input"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Measurement section header */}
                  <tr>
                    <td colSpan={2} className="grounding-section-header px-4 py-2">
                      Pengukuran
                    </td>
                    <td colSpan={1} className="grounding-section-header px-4 py-2" />
                    <td className="grounding-section-header px-4 py-2 text-center">Standard</td>
                    <td colSpan={2} className="grounding-section-header px-4 py-2" />
                  </tr>

                  {/* Measurement items */}
                  {measurementItems.map((item, idx) => (
                    <tr key={`measurement-${item.no}`}>
                      <td className="text-center text-slate-500 font-medium w-10">{item.no}</td>
                      <td colSpan={2} className="text-slate-700">{item.name}</td>
                      <td>
                        <div className="grounding-standard">
                          {item.standard || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="grounding-radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`measurement-kondisi-${item.no}`}
                              checked={item.kondisi === 'Baik'}
                              onChange={() => handleMeasurementChange(idx, 'kondisi', 'Baik')}
                            />
                            Baik
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`measurement-kondisi-${item.no}`}
                              checked={item.kondisi === 'Tidak Baik'}
                              onChange={() => handleMeasurementChange(idx, 'kondisi', 'Tidak Baik')}
                            />
                            Tidak Baik
                          </label>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.hasilPengukuran}
                          onChange={e => handleMeasurementChange(idx, 'hasilPengukuran', e.target.value)}
                          className="grounding-note-input"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions — clean button row */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="md"
          onClick={() => navigate('/grounding')}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            className="gap-2"
          >
            <Save size={14} />
            Simpan Laporan
          </Button>
        </div>
      </div>
    </div>
  );
};
