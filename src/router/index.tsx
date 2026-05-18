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
import { GroundCheckIndexPage } from '@/pages/ground-check/GroundCheckIndexPage';
import { LocalizerFormPage } from '@/pages/ground-check/LocalizerFormPage';
import { GroundingIndexPage } from '@/pages/grounding/GroundingIndexPage';
import { GroundingCreatePage } from '@/pages/grounding/GroundingCreatePage';
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
      { path: '/tfp/aob-ground/:id/print', element: <TfpAobGroundPrintView /> },
      { path: '/tfp/aob-lt12/:id/print', element: <TfpAobLt12PrintView /> },
      { path: '/tfp/transmitter-tx/:id/print', element: <TfpTransmitterTxPrintView /> },
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
          { path: '/tfp/:code/coming-soon', element: <ComingSoonPage /> },

          // Ground Check
          { path: '/ground-check', element: <GroundCheckIndexPage /> },
          { path: '/ground-check/localizer', element: <LocalizerFormPage /> },
          { path: '/ground-check/:code/coming-soon', element: <ComingSoonPage /> },

          // Grounding
          { path: '/grounding', element: <GroundingIndexPage /> },
          { path: '/grounding/create', element: <GroundingCreatePage /> },
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
