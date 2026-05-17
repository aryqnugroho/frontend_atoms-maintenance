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
import { TfpIndexPage } from '@/pages/tfp/TfpIndexPage';
import { TfpAobGroundFormPage } from '@/pages/tfp/TfpAobGroundFormPage';
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
          // Active module: Kesiapan Peralatan CNSD (Form EQ-1)
          { path: '/cnsd/readiness', element: <CnsdReadinessListPage /> },
          { path: '/cnsd/readiness/:id', element: <CnsdReadinessDetailPage /> },
          // Backward-compat: legacy /cnsd/eq-1 link redirects to new list
          { path: '/cnsd/eq-1', element: <Navigate to="/cnsd/readiness" replace /> },
          { path: '/cnsd/:code/coming-soon', element: <ComingSoonPage /> },

          // TFP
          { path: '/tfp', element: <TfpIndexPage /> },
          { path: '/tfp/aob-ground', element: <TfpAobGroundFormPage /> },
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
