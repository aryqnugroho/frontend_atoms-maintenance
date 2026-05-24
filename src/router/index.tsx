import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SettingsChecklistPage } from '@/pages/settings/SettingsChecklistPage';
import { WorkOrderListPage } from '@/pages/work-order/WorkOrderListPage';
import { WorkOrderDetailPage } from '@/pages/work-order/WorkOrderDetailPage';
import { WorkOrderPrintView } from '@/pages/work-order/WorkOrderPrintView';
import { CnsdIndexPage } from '@/pages/cnsd/CnsdIndexPage';
import { CnsdReadinessListPage } from '@/pages/cnsd/CnsdReadinessListPage';
import { CnsdReadinessDetailPage } from '@/pages/cnsd/CnsdReadinessDetailPage';
import { CnsdReadinessPrintView } from '@/pages/cnsd/CnsdReadinessPrintView';
import { CnsdRadarMeterListPage } from '@/pages/cnsd/CnsdRadarMeterListPage';
import { CnsdRadarMeterDetailPage } from '@/pages/cnsd/CnsdRadarMeterDetailPage';
import { CnsdRadarMeterPrintView } from '@/pages/cnsd/CnsdRadarMeterPrintView';
import { CnsdRecorderMeterListPage } from '@/pages/cnsd/CnsdRecorderMeterListPage';
import { CnsdRecorderMeterDetailPage } from '@/pages/cnsd/CnsdRecorderMeterDetailPage';
import { CnsdRecorderMeterPrintView } from '@/pages/cnsd/CnsdRecorderMeterPrintView';
import { CnsdAmscMeterListPage } from '@/pages/cnsd/CnsdAmscMeterListPage';
import { CnsdAmscMeterDetailPage } from '@/pages/cnsd/CnsdAmscMeterDetailPage';
import { CnsdAmscMeterPrintView } from '@/pages/cnsd/CnsdAmscMeterPrintView';
import { CnsdTransmitterMeterListPage } from '@/pages/cnsd/CnsdTransmitterMeterListPage';
import { CnsdTransmitterMeterDetailPage } from '@/pages/cnsd/CnsdTransmitterMeterDetailPage';
import { CnsdTransmitterMeterPrintView } from '@/pages/cnsd/CnsdTransmitterMeterPrintView';
import { CnsdReceiverMeterListPage } from '@/pages/cnsd/CnsdReceiverMeterListPage';
import { CnsdReceiverMeterDetailPage } from '@/pages/cnsd/CnsdReceiverMeterDetailPage';
import { CnsdReceiverMeterPrintView } from '@/pages/cnsd/CnsdReceiverMeterPrintView';
import { CnsdGlidepathMeterListPage } from '@/pages/cnsd/CnsdGlidepathMeterListPage';
import { CnsdGlidepathMeterDetailPage } from '@/pages/cnsd/CnsdGlidepathMeterDetailPage';
import { CnsdGlidepathMeterPrintView } from '@/pages/cnsd/CnsdGlidepathMeterPrintView';
import { CnsdLocalizerMeterListPage } from '@/pages/cnsd/CnsdLocalizerMeterListPage';
import { CnsdLocalizerMeterDetailPage } from '@/pages/cnsd/CnsdLocalizerMeterDetailPage';
import { CnsdLocalizerMeterPrintView } from '@/pages/cnsd/CnsdLocalizerMeterPrintView';
import { CnsdTdmeMeterListPage } from '@/pages/cnsd/CnsdTdmeMeterListPage';
import { CnsdTdmeMeterDetailPage } from '@/pages/cnsd/CnsdTdmeMeterDetailPage';
import { CnsdTdmeMeterPrintView } from '@/pages/cnsd/CnsdTdmeMeterPrintView';
import { CnsdDvorMeterListPage } from '@/pages/cnsd/CnsdDvorMeterListPage';
import { CnsdDvorMeterDetailPage } from '@/pages/cnsd/CnsdDvorMeterDetailPage';
import { CnsdDvorMeterPrintView } from '@/pages/cnsd/CnsdDvorMeterPrintView';
import { CnsdDmeMeterListPage } from '@/pages/cnsd/CnsdDmeMeterListPage';
import { CnsdDmeMeterDetailPage } from '@/pages/cnsd/CnsdDmeMeterDetailPage';
import { CnsdDmeMeterPrintView } from '@/pages/cnsd/CnsdDmeMeterPrintView';
import { CnsdAtisMeterListPage } from '@/pages/cnsd/CnsdAtisMeterListPage';
import { CnsdAtisMeterDetailPage } from '@/pages/cnsd/CnsdAtisMeterDetailPage';
import { CnsdAtisMeterPrintView } from '@/pages/cnsd/CnsdAtisMeterPrintView';
import { CnsdAtcSystemMeterListPage } from '@/pages/cnsd/CnsdAtcSystemMeterListPage';
import { CnsdAtcSystemMeterDetailPage } from '@/pages/cnsd/CnsdAtcSystemMeterDetailPage';
import { CnsdAtcSystemMeterPrintView } from '@/pages/cnsd/CnsdAtcSystemMeterPrintView';
import { CnsdVccsMeterListPage } from '@/pages/cnsd/CnsdVccsMeterListPage';
import { CnsdVccsMeterDetailPage } from '@/pages/cnsd/CnsdVccsMeterDetailPage';
import { CnsdVccsMeterPrintView } from '@/pages/cnsd/CnsdVccsMeterPrintView';
import { CnsdVccsFreqMeterListPage } from '@/pages/cnsd/CnsdVccsFreqMeterListPage';
import { CnsdVccsFreqMeterDetailPage } from '@/pages/cnsd/CnsdVccsFreqMeterDetailPage';
import { CnsdVccsFreqMeterPrintView } from '@/pages/cnsd/CnsdVccsFreqMeterPrintView';
import { CnsdAsmgcsMeterListPage } from '@/pages/cnsd/CnsdAsmgcsMeterListPage';
import { CnsdAsmgcsMeterDetailPage } from '@/pages/cnsd/CnsdAsmgcsMeterDetailPage';
import { CnsdAsmgcsMeterPrintView } from '@/pages/cnsd/CnsdAsmgcsMeterPrintView';
import { TfpIndexPage } from '@/pages/tfp/TfpIndexPage';
import { TfpAobGroundListPage } from '@/pages/tfp/TfpAobGroundListPage';
import { TfpAobGroundDetailPage } from '@/pages/tfp/TfpAobGroundDetailPage';
import { TfpAobGroundPrintView } from '@/pages/tfp/TfpAobGroundPrintView';
import { TfpAobLt12ListPage } from '@/pages/tfp/TfpAobLt12ListPage';
import { TfpAobLt12DetailPage } from '@/pages/tfp/TfpAobLt12DetailPage';
import { TfpAobLt12PrintView } from '@/pages/tfp/TfpAobLt12PrintView';
import { TfpTransmitterTxListPage } from '@/pages/tfp/TfpTransmitterTxListPage';
import { TfpTransmitterTxDetailPage } from '@/pages/tfp/TfpTransmitterTxDetailPage';
import { TfpTransmitterTxPrintView } from '@/pages/tfp/TfpTransmitterTxPrintView';
import { TfpTowerListPage } from '@/pages/tfp/TfpTowerListPage';
import { TfpTowerDetailPage } from '@/pages/tfp/TfpTowerDetailPage';
import { TfpTowerPrintView } from '@/pages/tfp/TfpTowerPrintView';
import { TfpRadarListPage } from '@/pages/tfp/TfpRadarListPage';
import { TfpRadarDetailPage } from '@/pages/tfp/TfpRadarDetailPage';
import { TfpRadarPrintView } from '@/pages/tfp/TfpRadarPrintView';
import { TfpDvorListPage } from '@/pages/tfp/TfpDvorListPage';
import { TfpDvorDetailPage } from '@/pages/tfp/TfpDvorDetailPage';
import { TfpDvorPrintView } from '@/pages/tfp/TfpDvorPrintView';
import { TfpLocalizerListPage } from '@/pages/tfp/TfpLocalizerListPage';
import { TfpLocalizerDetailPage } from '@/pages/tfp/TfpLocalizerDetailPage';
import { TfpLocalizerPrintView } from '@/pages/tfp/TfpLocalizerPrintView';
import { TfpGlidepathListPage } from '@/pages/tfp/TfpGlidepathListPage';
import { TfpGlidepathDetailPage } from '@/pages/tfp/TfpGlidepathDetailPage';
import { TfpGlidepathPrintView } from '@/pages/tfp/TfpGlidepathPrintView';
import { GroundCheckIndexPage } from '@/pages/ground-check/GroundCheckIndexPage';
import { GroundCheckAdcListPage } from '@/pages/ground-check/GroundCheckAdcListPage';
import { GroundCheckAdcDetailPage } from '@/pages/ground-check/GroundCheckAdcDetailPage';
import { GroundCheckAdcPrintView } from '@/pages/ground-check/GroundCheckAdcPrintView';
import { GroundCheckVhfListPage } from '@/pages/ground-check/GroundCheckVhfListPage';
import { GroundCheckVhfDetailPage } from '@/pages/ground-check/GroundCheckVhfDetailPage';
import { GroundCheckVhfPrintView } from '@/pages/ground-check/GroundCheckVhfPrintView';
import { GroundCheckLlzListPage } from '@/pages/ground-check/GroundCheckLlzListPage';
import { GroundCheckLlzDetailPage } from '@/pages/ground-check/GroundCheckLlzDetailPage';
import { GroundCheckLlzPrintView } from '@/pages/ground-check/GroundCheckLlzPrintView';
import { GroundCheckGpListPage } from '@/pages/ground-check/GroundCheckGpListPage';
import { GroundCheckGpDetailPage } from '@/pages/ground-check/GroundCheckGpDetailPage';
import { GroundCheckGpPrintView } from '@/pages/ground-check/GroundCheckGpPrintView';
import { GroundCheckDvorListPage } from '@/pages/ground-check/GroundCheckDvorListPage';
import { GroundCheckDvorDetailPage } from '@/pages/ground-check/GroundCheckDvorDetailPage';
import { GroundCheckDvorPrintView } from '@/pages/ground-check/GroundCheckDvorPrintView';
import { GroundingIndexPage } from '@/pages/grounding/GroundingIndexPage';
import { GroundingReportDetailPage } from '@/pages/grounding/GroundingReportDetailPage';
import { GroundingReportPrintView } from '@/pages/grounding/GroundingReportPrintView';
import { ReportingListPage } from '@/pages/reporting/ReportingListPage';
import { ReportingDamageFormPage } from '@/pages/reporting/ReportingDamageFormPage';
import { ReportingDamagePrintView } from '@/pages/reporting/ReportingDamagePrintView';
import { LogbookPage } from '@/pages/logbook/LogbookPage';
import { LogbookCnsd } from '@/pages/logbook/LogbookCnsd';
import { LogbookCnsdDetail } from '@/pages/logbook/LogbookCnsdDetail';
import { LogbookCnsdPrintView } from '@/pages/logbook/LogbookCnsdPrintView';
import { LogbookTfp } from '@/pages/logbook/LogbookTfp';
import { LogbookTfpDetail } from '@/pages/logbook/LogbookTfpDetail';
import { LogbookTfpPrintView } from '@/pages/logbook/LogbookTfpPrintView';
import { MonitorPage } from '@/pages/monitor/MonitorPage';
import { ComingSoonPage } from '@/pages/shared/ComingSoonPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    // Workshop TV monitor — intentionally OUTSIDE ProtectedRoute so the kiosk
    // does not need an SSO session. The page itself shows a password gate.
    path: '/monitor',
    element: <MonitorPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/work-orders/:id/print', element: <WorkOrderPrintView /> },
      { path: '/cnsd/readiness/:id/print', element: <CnsdReadinessPrintView /> },
      { path: '/cnsd/radar-meter/:id/print', element: <CnsdRadarMeterPrintView /> },
      { path: '/cnsd/recorder-meter/:id/print', element: <CnsdRecorderMeterPrintView /> },
      { path: '/cnsd/amsc-meter/:id/print', element: <CnsdAmscMeterPrintView /> },
      { path: '/cnsd/transmitter-meter/:id/print', element: <CnsdTransmitterMeterPrintView /> },
      { path: '/cnsd/receiver-meter/:id/print', element: <CnsdReceiverMeterPrintView /> },
      { path: '/cnsd/glidepath-meter/:id/print', element: <CnsdGlidepathMeterPrintView /> },
      { path: '/cnsd/localizer-meter/:id/print', element: <CnsdLocalizerMeterPrintView /> },
      { path: '/cnsd/tdme-meter/:id/print', element: <CnsdTdmeMeterPrintView /> },
      { path: '/cnsd/dvor-meter/:id/print', element: <CnsdDvorMeterPrintView /> },
      { path: '/cnsd/dme-meter/:id/print', element: <CnsdDmeMeterPrintView /> },
      { path: '/cnsd/atis-meter/:id/print', element: <CnsdAtisMeterPrintView /> },
      { path: '/cnsd/atc-system-meter/:id/print', element: <CnsdAtcSystemMeterPrintView /> },
      { path: '/cnsd/vccs-meter/:id/print', element: <CnsdVccsMeterPrintView /> },
      { path: '/cnsd/vccs-freq-meter/:id/print', element: <CnsdVccsFreqMeterPrintView /> },
      { path: '/cnsd/asmgcs-meter/:id/print', element: <CnsdAsmgcsMeterPrintView /> },
      { path: '/grounding/reports/:id/print', element: <GroundingReportPrintView /> },
      { path: '/reporting/damage-reports/:id/print', element: <ReportingDamagePrintView /> },
      { path: '/tfp/aob-ground/:id/print', element: <TfpAobGroundPrintView /> },
      { path: '/tfp/aob-lt12/:id/print', element: <TfpAobLt12PrintView /> },
      { path: '/tfp/transmitter-tx/:id/print', element: <TfpTransmitterTxPrintView /> },
      { path: '/tfp/tower/:id/print', element: <TfpTowerPrintView /> },
      { path: '/tfp/radar-tfp/:id/print', element: <TfpRadarPrintView /> },
      { path: '/tfp/dvor/:id/print', element: <TfpDvorPrintView /> },
      { path: '/tfp/localizer/:id/print', element: <TfpLocalizerPrintView /> },
      { path: '/tfp/glidepath/:id/print', element: <TfpGlidepathPrintView /> },
      { path: '/ground-check/adc/:id/print', element: <GroundCheckAdcPrintView /> },
      { path: '/ground-check/vhf/:id/print', element: <GroundCheckVhfPrintView /> },
      { path: '/ground-check/llz/:id/print', element: <GroundCheckLlzPrintView /> },
      { path: '/ground-check/gp/:id/print', element: <GroundCheckGpPrintView /> },
      { path: '/ground-check/dvor/:id/print', element: <GroundCheckDvorPrintView /> },
      { path: '/logbooks/tfp/:id/print', element: <LogbookTfpPrintView /> },
      { path: '/logbooks/cnsd/:id/print', element: <LogbookCnsdPrintView /> },
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/settings/checklist', element: <SettingsChecklistPage /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Work Order
          { path: '/work-orders', element: <WorkOrderListPage /> },
          { path: '/work-orders/:id', element: <WorkOrderDetailPage /> },

          // CNSD
          { path: '/cnsd', element: <CnsdIndexPage /> },
          // Active module 1: Kesiapan Peralatan CNSD (Form EQ-1)
          { path: '/cnsd/readiness', element: <CnsdReadinessListPage /> },
          { path: '/cnsd/readiness/:id', element: <CnsdReadinessDetailPage /> },
          // Active module 2: Radar Meter Reading (Form RADAR-METER)
          { path: '/cnsd/radar-meter', element: <CnsdRadarMeterListPage /> },
          { path: '/cnsd/radar-meter/:id', element: <CnsdRadarMeterDetailPage /> },
          // Active module 3: Recorder Meter Reading (FORM C-3)
          { path: '/cnsd/recorder-meter', element: <CnsdRecorderMeterListPage /> },
          { path: '/cnsd/recorder-meter/:id', element: <CnsdRecorderMeterDetailPage /> },
          // Active module 4: AMSC Meter Reading
          { path: '/cnsd/amsc-meter', element: <CnsdAmscMeterListPage /> },
          { path: '/cnsd/amsc-meter/:id', element: <CnsdAmscMeterDetailPage /> },
          // Active module 5: Transmitter Meter Reading (FORM C-1)
          { path: '/cnsd/transmitter-meter', element: <CnsdTransmitterMeterListPage /> },
          { path: '/cnsd/transmitter-meter/:id', element: <CnsdTransmitterMeterDetailPage /> },
          // Active module 6: Receiver Meter Reading (FORM C-2)
          { path: '/cnsd/receiver-meter', element: <CnsdReceiverMeterListPage /> },
          { path: '/cnsd/receiver-meter/:id', element: <CnsdReceiverMeterDetailPage /> },
          // Active module 7: Glide Path Meter Reading (ILS-GP)
          { path: '/cnsd/glidepath-meter', element: <CnsdGlidepathMeterListPage /> },
          { path: '/cnsd/glidepath-meter/:id', element: <CnsdGlidepathMeterDetailPage /> },
          // Active module 8: Localizer Meter Reading (ILS-LLZ)
          { path: '/cnsd/localizer-meter', element: <CnsdLocalizerMeterListPage /> },
          { path: '/cnsd/localizer-meter/:id', element: <CnsdLocalizerMeterDetailPage /> },
          // Active module 9: T-DME Meter Reading (FORM N-5)
          { path: '/cnsd/tdme-meter', element: <CnsdTdmeMeterListPage /> },
          { path: '/cnsd/tdme-meter/:id', element: <CnsdTdmeMeterDetailPage /> },
          // Active module 10: DVOR Meter Reading (FORM N-5)
          { path: '/cnsd/dvor-meter', element: <CnsdDvorMeterListPage /> },
          { path: '/cnsd/dvor-meter/:id', element: <CnsdDvorMeterDetailPage /> },
          // Active module 11: DME Meter Reading (FORM N-5)
          { path: '/cnsd/dme-meter', element: <CnsdDmeMeterListPage /> },
          { path: '/cnsd/dme-meter/:id', element: <CnsdDmeMeterDetailPage /> },
          // Active module 13: ATIS Meter Reading (Reproducer ATIS)
          { path: '/cnsd/atis-meter', element: <CnsdAtisMeterListPage /> },
          { path: '/cnsd/atis-meter/:id', element: <CnsdAtisMeterDetailPage /> },
          // Active module 14: ATC SYSTEM Meter Reading (Approach System / Tern ATS System)
          { path: '/cnsd/atc-system-meter', element: <CnsdAtcSystemMeterListPage /> },
          { path: '/cnsd/atc-system-meter/:id', element: <CnsdAtcSystemMeterDetailPage /> },
          // Active module 15: VCCS LES Meter Reading
          { path: '/cnsd/vccs-meter', element: <CnsdVccsMeterListPage /> },
          { path: '/cnsd/vccs-meter/:id', element: <CnsdVccsMeterDetailPage /> },
          // Active module 16: VCCS Frequentis Meter Reading
          { path: '/cnsd/vccs-freq-meter', element: <CnsdVccsFreqMeterListPage /> },
          { path: '/cnsd/vccs-freq-meter/:id', element: <CnsdVccsFreqMeterDetailPage /> },
          // Active module 17: ASMGCS (SAAB) Meter Reading
          { path: '/cnsd/asmgcs-meter', element: <CnsdAsmgcsMeterListPage /> },
          { path: '/cnsd/asmgcs-meter/:id', element: <CnsdAsmgcsMeterDetailPage /> },
          // Backward-compat: legacy /cnsd/eq-1 link redirects to new list
          { path: '/cnsd/eq-1', element: <Navigate to="/cnsd/readiness" replace /> },
          { path: '/cnsd/:code/coming-soon', element: <ComingSoonPage /> },

          // TFP
          { path: '/tfp', element: <TfpIndexPage /> },
          // Active module 1: Performance Check AOB Lantai Ground
          { path: '/tfp/aob-ground', element: <TfpAobGroundListPage /> },
          { path: '/tfp/aob-ground/:id', element: <TfpAobGroundDetailPage /> },
          // Active module 2: Performance Check AOB Lantai 1 & 2
          { path: '/tfp/aob-lt12', element: <TfpAobLt12ListPage /> },
          { path: '/tfp/aob-lt12/:id', element: <TfpAobLt12DetailPage /> },
          // Active module 3: Performance Check Gedung (Transmitter) TX
          { path: '/tfp/transmitter-tx', element: <TfpTransmitterTxListPage /> },
          { path: '/tfp/transmitter-tx/:id', element: <TfpTransmitterTxDetailPage /> },
          // Active module 4: Performance Check Gedung Tower
          { path: '/tfp/tower', element: <TfpTowerListPage /> },
          { path: '/tfp/tower/:id', element: <TfpTowerDetailPage /> },
          // Active module 5: Performance Check Gedung Radar
          { path: '/tfp/radar-tfp', element: <TfpRadarListPage /> },
          { path: '/tfp/radar-tfp/:id', element: <TfpRadarDetailPage /> },
          // Active module 6: Performance Check Gedung DVOR (VOR)
          { path: '/tfp/dvor', element: <TfpDvorListPage /> },
          { path: '/tfp/dvor/:id', element: <TfpDvorDetailPage /> },
          // Active module 7: Performance Check Gedung Localizer
          { path: '/tfp/localizer', element: <TfpLocalizerListPage /> },
          { path: '/tfp/localizer/:id', element: <TfpLocalizerDetailPage /> },
          // Active module 8: Performance Check Gedung Glide Path
          { path: '/tfp/glidepath', element: <TfpGlidepathListPage /> },
          { path: '/tfp/glidepath/:id', element: <TfpGlidepathDetailPage /> },
          { path: '/tfp/:code/coming-soon', element: <ComingSoonPage /> },

          // Ground Check
          { path: '/ground-check', element: <GroundCheckIndexPage /> },
          { path: '/ground-check/adc', element: <GroundCheckAdcListPage /> },
          { path: '/ground-check/adc/:id', element: <GroundCheckAdcDetailPage /> },
          { path: '/ground-check/vhf', element: <GroundCheckVhfListPage /> },
          { path: '/ground-check/vhf/:id', element: <GroundCheckVhfDetailPage /> },
          { path: '/ground-check/llz', element: <GroundCheckLlzListPage /> },
          { path: '/ground-check/llz/:id', element: <GroundCheckLlzDetailPage /> },
          { path: '/ground-check/gp', element: <GroundCheckGpListPage /> },
          { path: '/ground-check/gp/:id', element: <GroundCheckGpDetailPage /> },
          { path: '/ground-check/dvor', element: <GroundCheckDvorListPage /> },
          { path: '/ground-check/dvor/:id', element: <GroundCheckDvorDetailPage /> },
          { path: '/ground-check/:code/coming-soon', element: <ComingSoonPage /> },

          // Grounding
          { path: '/grounding', element: <GroundingIndexPage /> },
          { path: '/grounding/reports/:id', element: <GroundingReportDetailPage /> },
          { path: '/grounding/:code/coming-soon', element: <ComingSoonPage /> },

          // Reporting (Laporan Kerusakan)
          { path: '/reporting', element: <ReportingListPage /> },
          { path: '/reporting/damage-reports', element: <Navigate to="/reporting" replace /> },
          { path: '/reporting/damage-reports/new', element: <ReportingDamageFormPage /> },
          { path: '/reporting/damage-reports/:id', element: <ReportingDamageFormPage /> },
          // Backward-compat: legacy /reports placeholder still works
          { path: '/reports', element: <Navigate to="/reporting" replace /> },
          { path: '/reports/create', element: <Navigate to="/reporting/damage-reports/new" replace /> },
          { path: '/reports/:id', element: <ComingSoonPage /> },

          // Logbook
          { path: '/logbooks', element: <LogbookPage /> },
          { path: '/logbooks/cnsd', element: <LogbookCnsd /> },
          { path: '/logbooks/cnsd/:id', element: <LogbookCnsdDetail /> },
          { path: '/logbooks/tfp', element: <LogbookTfp /> },
          { path: '/logbooks/tfp/:id', element: <LogbookTfpDetail /> },

          { path: '/admin/users', element: <ComingSoonPage /> },

          // Profile (placeholder)
          { path: '/profile', element: <ComingSoonPage /> },

          // Catch-all
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ]
      }
    ]
  }
]);
