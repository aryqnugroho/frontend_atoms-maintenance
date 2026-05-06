import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, Radio, Clock, User, Search, ChevronRight } from 'lucide-react';
import { mockMeterReadingEquipment } from '@/data/mockData';
import type { MeterReadingEquipment } from '@/types';

type CategoryFilter = 'all' | 'Navigation' | 'Communication';

export const GroundCheckIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = mockMeterReadingEquipment.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || eq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const navItems = filteredItems.filter(eq => eq.category === 'Navigation');
  const comItems = filteredItems.filter(eq => eq.category === 'Communication');

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Route map: equipment name -> route
  const EQUIPMENT_ROUTES: Record<string, string> = {
    'Localizer': '/ground-check/localizer',
    'Glide Path': '/ground-check/glide-path/coming-soon',
    'DVOR': '/ground-check/dvor/coming-soon',
  };

  const handleCardClick = (eq: MeterReadingEquipment) => {
    const route = EQUIPMENT_ROUTES[eq.name];
    if (route) navigate(route);
  };

  const renderEquipmentCard = (eq: MeterReadingEquipment) => {
    const route = EQUIPMENT_ROUTES[eq.name];
    const isClickable = !!route;
    return (
      <div
        key={eq.id}
        onClick={() => handleCardClick(eq)}
        className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
          isClickable
            ? 'border-brand-primary/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group'
            : 'border-gray-200 opacity-60 cursor-default'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-800 leading-tight pr-2 group-hover:text-brand-primary transition-colors">
            {eq.name}
          </h4>
          {isClickable && <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-primary transition-colors shrink-0" />}
        </div>

        {eq.frequency && (
          <div className="mb-3">
            <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-xs font-mono font-medium text-violet-700 border border-violet-200">
              {eq.frequency}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <User size={12} className="text-slate-400" />
            <span>{eq.checkedBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>{formatTime(eq.lastChecked)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Radar size={20} className="text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl text-slate-900">Ground Check</h1>
            <p className="text-sm text-slate-500">Meter Reading & Ground Check — Status peralatan navigasi dan komunikasi</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {(['all', 'Navigation', 'Communication'] as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
          
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari peralatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      {(activeCategory === 'all' || activeCategory === 'Navigation') && navItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Radio size={16} className="text-sky-600" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Navigation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navItems.map(eq => renderEquipmentCard(eq))}
          </div>
        </div>
      )}

      {/* Communication Section */}
      {(activeCategory === 'all' || activeCategory === 'Communication') && comItems.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Radio size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Communication</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comItems.map(eq => renderEquipmentCard(eq))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Search size={20} className="text-gray-300" />
          </div>
          <p className="text-slate-500 font-medium">Tidak ada peralatan ditemukan</p>
          <p className="text-slate-400 text-xs">Coba ubah filter atau kata kunci pencarian Anda</p>
        </div>
      )}
    </div>
  );
};
