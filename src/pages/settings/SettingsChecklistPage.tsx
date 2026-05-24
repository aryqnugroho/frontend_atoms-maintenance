import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Calendar, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { useAuth } from '@/hooks/useAuth';
import { DailyChecklistTab } from './tabs/DailyChecklistTab';
import { MonthlyChecklistTab } from './tabs/MonthlyChecklistTab';

type ActiveTab = 'daily' | 'monthly';

/**
 * /settings/checklist — top-level page for managing dashboard reminders.
 *
 * Hosts two tabs:
 *   - Harian   → DailyChecklistTab   (wajib + per-shift modules, has_record per form)
 *   - Bulanan  → MonthlyChecklistTab (per-equipment min-count targets per month)
 *
 * Active tab is mirrored in the URL via ?tab=daily|monthly so deep-links from
 * the dashboard's two gear icons land on the right tab and refresh-friendly.
 */
export const SettingsChecklistPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canEdit =
    user?.role === 'Admin' ||
    user?.role === 'Manager Teknik' ||
    user?.role === 'Supervisor CNSD' ||
    user?.role === 'Supervisor TFP';

  // Read initial tab from URL (defaults to 'daily').
  const initialTab: ActiveTab = searchParams.get('tab') === 'monthly' ? 'monthly' : 'daily';
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const handleTabChange = (key: string) => {
    const next = (key === 'monthly' ? 'monthly' : 'daily') as ActiveTab;
    setActiveTab(next);
    // Mirror to URL so reload + back-button preserve the tab.
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h2 className="text-lg font-semibold text-slate-700">Akses ditolak</h2>
        <p className="text-sm text-slate-500">
          Hanya Manager Teknik / Supervisor / Admin yang dapat mengelola checklist pengingat.
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">Pengaturan Pengingat Pengecekan</span>
      </div>

      <PageHeader
        icon={ClipboardCheck}
        iconBg="bg-violet-100"
        iconColor="text-violet-700"
        title="Pengaturan Pengingat Pengecekan"
        subtitle="Atur modul yang muncul di card pengingat (Dashboard + Monitor Workshop)."
      />

      <Tabs
        items={[
          { key: 'daily',   label: 'Pengecekan Harian',   icon: <ClipboardCheck size={16} /> },
          { key: 'monthly', label: 'Pengecekan Bulanan',  icon: <Calendar size={16} /> },
        ]}
        defaultKey={activeTab}
        onChange={handleTabChange}
      />

      {activeTab === 'daily'   && <DailyChecklistTab />}
      {activeTab === 'monthly' && <MonthlyChecklistTab />}
    </div>
  );
};
