import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
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
import { LocalizerFormPage } from '@/pages/ground-check/LocalizerFormPage';
import { GroundingIndexPage } from '@/pages/grounding/GroundingIndexPage';
import { GroundingReportDetailPage } from '@/pages/grounding/GroundingReportDetailPage';
import { GroundingReportPrintView } from '@/pages/grounding/GroundingReportPrintView';
import { ComingSoonPage } from '@/pages/shared/ComingSoonPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
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
      { path: '/grounding/reports/:id/print', element: <GroundingReportPrintView /> },
      { path: '/tfp/aob-ground/:id/print', element: <TfpAobGroundPrintView /> },
      { path: '/tfp/aob-lt12/:id/print', element: <TfpAobLt12PrintView /> },
      { path: '/tfp/transmitter-tx/:id/print', element: <TfpTransmitterTxPrintView /> },
      { path: '/tfp/tower/:id/print', element: <TfpTowerPrintView /> },
      { path: '/tfp/radar-tfp/:id/print', element: <TfpRadarPrintView /> },
      { path: '/tfp/dvor/:id/print', element: <TfpDvorPrintView /> },
      { path: '/tfp/localizer/:id/print', element: <TfpLocalizerPrintView /> },
      { path: '/tfp/glidepath/:id/print', element: <TfpGlidepathPrintView /> },
      { path: '/ground-check/adc/:id/print', element: <GroundCheckAdcPrintView /> },
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
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
          { path: '/ground-check/localizer', element: <LocalizerFormPage /> },
          { path: '/ground-check/:code/coming-soon', element: <ComingSoonPage /> },

          // Grounding
          { path: '/grounding', element: <GroundingIndexPage /> },
          { path: '/grounding/reports/:id', element: <GroundingReportDetailPage /> },
          { path: '/grounding/:code/coming-soon', element: <ComingSoonPage /> },

          // Reporting (placeholder)
          { path: '/reports', element: <ComingSoonPage /> },
          { path: '/reports/create', element: <ComingSoonPage /> },
          { path: '/reports/:id', element: <ComingSoonPage /> },

          // Logbook (placeholder)
          { path: '/logbooks', element: <ComingSoonPage /> },

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
