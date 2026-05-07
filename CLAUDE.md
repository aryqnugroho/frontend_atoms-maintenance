# atoms-maintenance Agent Context

> **Last Updated:** 2026-05-08
> **Project:** ATOMS-Maintenance (Air Traffic Operations Maintenance System)
> **Organization:** AirNav Indonesia

---

## Project Overview

**atoms-maintenance** is the primary project for managing office and airport technical operations maintenance workflows at AirNav Indonesia. It handles equipment readiness checks, work order management, performance monitoring, grounding system inspections, and reporting for two core divisions: **CNSD** (Communications, Navigation, Surveillance & Data) and **TFP** (Teknik Fasilitas Penunjang / Supporting Technical Facilities).

The application is designed for shift-based operations with three daily shifts (pagi/siang/malam) and supports role-based access control across six user roles.

---

## Current Development Status

- **Frontend:** Actively developed, functional MVP with multiple operational modules.
- **Backend:** **Does not exist yet.** The frontend currently runs entirely on mock data (`src/data/mockData.ts`).
- **Auth Service:** An `authService.ts` exists that points to `VITE_API_URL` (default `http://localhost:8000/api`) via Axios, but there is no backend to receive these calls. Login currently works via the mock user flow in `AuthContext`.
- **Real-time:** Dependencies for Laravel Echo and Pusher are installed (`laravel-echo`, `pusher-js`) but not wired up. Environment variables for Reverb are defined in `.env` but unused.
- **Testing:** No test framework is installed. No test files exist.

---

## Backend Reference Context

There is a separate repository: `https://github.com/RakhaMaulana26/backend_atoms.git`

**Critical rules:**
- `backend_atoms` is **only a reference** from another project that handles employee rostering schedules and account data.
- It **must NOT** be copied directly into atoms-maintenance.
- It **must NOT** be treated as the final/production backend.
- It should be used to **study**:
  - Account/user data structures
  - Employee data models
  - Rostering schedule data concepts
  - Authentication patterns
- Any adopted ideas must be **reviewed, adapted, and redesigned** specifically for atoms-maintenance requirements.

---

## Tech Stack

### Core
| Layer         | Technology                                          |
|---------------|-----------------------------------------------------|
| Framework     | React 19.2 with TypeScript ~6.0                     |
| Build Tool    | Vite 8.0                                            |
| Routing       | React Router DOM 7.14 (createBrowserRouter)         |
| Styling       | Tailwind CSS 3.4 + PostCSS + Autoprefixer           |
| HTTP Client   | Axios 1.15                                          |
| Icons         | Lucide React 1.8                                    |
| Forms         | React Hook Form 7.75                                |
| Charts        | Recharts 3.8                                        |
| PDF Gen       | @react-pdf/renderer 4.4                             |
| Utilities     | clsx 2.1 + tailwind-merge 3.5                       |
| Real-time     | Laravel Echo 2.3 + Pusher JS 8.5 (installed, unused)|
| Font          | Inter (Google Fonts, loaded via `index.html`)        |

### Dev Tooling
| Tool          | Version/Details                                     |
|---------------|-----------------------------------------------------|
| Linting       | ESLint 9.39 + typescript-eslint + react-hooks + react-refresh |
| TypeScript    | ~6.0.2 with strict mode (`noUnusedLocals`, `noUnusedParameters`) |
| Vite Plugin   | @vitejs/plugin-react 6.0                            |

### Path Alias
- `@/*` → `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`)

---

## Repository Structure

```
atoms-maintenance-v2/
├── frontend_atoms-maintenance/     ← Main application
│   ├── public/
│   │   ├── assets/icon/            ← AirNav logo SVG
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.tsx                 ← Root component (AuthProvider → NotificationProvider → Router)
│   │   ├── main.tsx                ← Entry point (ThemeProvider → App)
│   │   ├── index.css               ← Global styles, CSS variables, animations, scrollbar
│   │   ├── App.css                 ← Legacy Vite template CSS (unused, can be cleaned up)
│   │   ├── assets/                 ← Static images (hero.png, react.svg, vite.svg)
│   │   ├── components/
│   │   │   ├── common/             ← 16 reusable UI components
│   │   │   └── layout/             ← AppShell, Sidebar, Topbar, ProtectedRoute
│   │   ├── contexts/               ← React Context providers
│   │   │   ├── AuthContext.tsx      ← Auth state (user, token, login, logout)
│   │   │   ├── NotificationContext.tsx ← Notification state (mock data)
│   │   │   └── ThemeContext.tsx     ← Light-mode-only (no-op provider)
│   │   ├── data/
│   │   │   └── mockData.ts         ← All mock data (users, shifts, WOs, categories, etc.)
│   │   ├── lib/
│   │   │   └── utils.ts            ← cn() utility (clsx + twMerge)
│   │   ├── pages/                  ← Page components organized by module
│   │   │   ├── auth/               ← LoginPage
│   │   │   ├── dashboard/          ← DashboardPage
│   │   │   ├── work-order/         ← List, Create, Detail pages
│   │   │   ├── cnsd/               ← Index, EQ-1 Form
│   │   │   ├── tfp/                ← Index, AOB Ground Form
│   │   │   ├── ground-check/       ← Index, Localizer Form + form data
│   │   │   ├── grounding/          ← Index, Create page
│   │   │   └── shared/             ← ComingSoonPage
│   │   ├── router/
│   │   │   └── index.tsx           ← All route definitions
│   │   ├── routes/                 ← Empty directory (unused)
│   │   ├── services/
│   │   │   └── authService.ts      ← Axios login/logout calls (no backend)
│   │   └── types/
│   │       └── index.ts            ← All TypeScript interfaces and types (307 lines)
│   ├── .env                        ← VITE_API_URL, VITE_REVERB_* variables
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   ├── eslint.config.js
│   ├── postcss.config.js
│   ├── PROJECT_REQUIREMENTS.md     ← Detailed PRD with changelog
│   └── README.md                   ← Default Vite README
└── refrence/                       ← Reference documents (PRD, form PDFs/JPGs)
    ├── ATOMS_Maintenance_Frontend_Plan.md
    ├── ATOMS_Maintenance_PRD.md
    ├── ATOMS_Maintenance_PRD_v2.md
    ├── Kesiapan-Peralatan-CNSD.pdf/jpg
    ├── Performance-Check-AOB-lt-Ground-TFP.pdf/jpg
    ├── Work-Order.pdf/jpg
    └── airnav.jpg
```

---

## Application Modules

### ✅ Implemented (Functional)

| Module | Pages | Status |
|--------|-------|--------|
| **Auth** | `LoginPage` | Works via mock user selection (no real API auth) |
| **Dashboard** | `DashboardPage` | Full dashboard with shift info, checklist, WO summary, trouble equipment, quick nav |
| **Work Order** | `WorkOrderListPage`, `WorkOrderCreatePage`, `WorkOrderDetailPage` | CRUD with shift/personal WO types, feedback forms, role-based permissions |
| **CNSD Readiness** | `CnsdIndexPage`, `CnsdEq1FormPage` | Category index + EQ-1 equipment check form |
| **TFP Performance** | `TfpIndexPage`, `TfpAobGroundFormPage` | Category index + AOB Ground performance check form |
| **Ground Check** | `GroundCheckIndexPage`, `LocalizerFormPage` | Index + Localizer measurement form |
| **Grounding** | `GroundingIndexPage`, `GroundingCreatePage` | Index + grounding inspection create form |

### 🔜 Placeholder (Coming Soon)

| Module | Route | Notes |
|--------|-------|-------|
| **Reports** | `/reports`, `/reports/create`, `/reports/:id` | Types defined, mock data exists, no UI |
| **Logbook** | `/logbooks` | Types defined, mock data exists, no UI |
| **Admin Users** | `/admin/users` | Placeholder page |
| **Profile** | `/profile` | Placeholder page |

### Needs Verification
- Whether the CNSD EQ-1 form covers all required equipment sections
- Whether the TFP AOB Ground form matches the physical form document completely
- Whether the Localizer form data structure is finalized
- Whether the Grounding create form matches required standards (PUIL 2011, SNI, IEC 62305, IEEE Std 142)

---

## Common Components (src/components/common/)

| Component | Description |
|-----------|-------------|
| `Badge` | Generic label for status/category |
| `Button` | Multi-variant button component |
| `Card` | Container card with consistent styling |
| `ComingSoonCard` | Placeholder card for unbuilt features |
| `ConfirmDialog` | Confirmation dialog modal |
| `EmptyState` | Empty data state display |
| `Input` | Text input field |
| `Modal` | Generic modal/dialog |
| `Select` | Dropdown select |
| `ShiftBadge` | Shift indicator badge (pagi/siang/malam) |
| `SignatureDisplay` | Digital signature renderer |
| `Skeleton` | Loading skeleton placeholder |
| `StatusBadge` | Work order status badge |
| `Table` | Data table with click-row support |
| `Tabs` | Tab navigation |
| `Textarea` | Multi-line text input |

---

## Layout Components (src/components/layout/)

| Component | Description |
|-----------|-------------|
| `AppShell` | Main layout (Topbar + Sidebar + content outlet) |
| `Sidebar` | Navigation sidebar with role-based filtering, responsive (desktop fixed / mobile slide-in) |
| `Topbar` | Header bar with logo, shift badge, notifications dropdown, user info, logout |
| `ProtectedRoute` | Auth guard that redirects unauthenticated users to `/login` |

---

## State Management

The application uses **React Context** for state management:

1. **`AuthContext`** — User authentication state
   - Stores `user`, `token`, `isAuthenticated`, `isLoading`
   - Login/logout with localStorage persistence
   - `updateUser()` for mock login flow (sets user directly without API)
   - Token stored in `localStorage` as `auth_token`, user as `user`

2. **`NotificationContext`** — In-app notifications
   - Initialized with `mockNotifications` from mock data
   - Supports `addNotification`, `markAsRead`, `markAllAsRead`
   - `unreadCount` computed from state

3. **`ThemeContext`** — Theme management
   - **Light-mode only** — the provider is a no-op (`theme: 'light'`, `isDark: false`)
   - Dark mode was previously supported but has been removed
   - Note: `index.html` still has a dark-mode initialization script (legacy, can be cleaned up)

**Provider hierarchy:** `ThemeProvider → AuthProvider → NotificationProvider → RouterProvider`

---

## Styling Approach

- **Primary:** Tailwind CSS 3.4 utility classes throughout all components
- **CSS Variables:** Defined in `index.css` `:root` for page background, card, borders, text colors
- **Custom CSS:** `index.css` contains custom animations (`fadeIn`, `fadeSlideDown`, `fadeSlideUp`, `fadeScaleUp`, `slideInFromRight`, `slideInFromLeft`), scrollbar styles, and grounding form table styles
- **Utility:** `cn()` function in `src/lib/utils.ts` combines `clsx` and `tailwind-merge`
- **Design tokens** in `tailwind.config.js`:
  - Brand colors: `brand-primary` (#1B3A6B), `brand-secondary` (#F5A623)
  - Sidebar colors: `sidebar` (#222E6A), `sidebar-active` (#454D7C), `sidebar-hover` (#2d3a7a)
  - Maintenance semantic colors: `cnsd`, `tfp`, `wo`, `normal`, `abnormal`, `warning`, `soon`
  - Custom `shimmer` animation
- **Theme:** Light-mode only. Dark mode CSS was removed; some vestigial references may remain.
- **Background pattern:** Subtle dot grid on main content area via CSS `radial-gradient`.
- **`App.css`:** Contains legacy Vite template styles — unused by the application and safe to remove.

---

## API Layer

### Current State
- **`authService.ts`** is the only API service file
  - Uses Axios to call `POST /auth/login` and `POST /auth/logout`
  - API base URL from `VITE_API_URL` env var (defaults to `http://localhost:8000/api`)
  - **No backend exists** — these calls will fail if invoked against a real server
- **All other data** comes from `src/data/mockData.ts` (27KB, 463 lines)
  - Users, shift schedules, dashboard checklists, trouble equipment, work orders, CNSD/TFP categories, maintenance reports, logbooks, notifications, meter reading equipment, grounding reports

### Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=atoms-maintenance-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

---

## Type System (src/types/index.ts)

Comprehensive TypeScript interfaces organized by domain:

| Domain | Key Types |
|--------|-----------|
| Auth | `UserRole` (6 roles), `User`, `LoginCredentials`, `LoginResponse` |
| Notification | `Notification` |
| Shift | `ShiftType`, `ShiftPersonnel`, `ShiftScheduleResponse` |
| Dashboard | `DashboardChecklistItem`, `TroubleEquipment` |
| Work Order | `WOStatus`, `WOType`, `OutputType`, `CompletionStatus`, `WOPersonnel`, `WorkOrder` |
| CNSD | `CnsdCategory`, `EQ1RowData`, `EQ1SectionData`, `CnsdMeterReading` |
| TFP | `TfpCategory`, `AOBMeasurementRow`, `AOBFacilityItem`, `TfpPerformanceCheck` |
| Reports | `ReportType`, `ReportStatus`, `MaintenanceReport` |
| Logbook | `Logbook` |
| Ground Check | `MeterReadingEquipment` |
| Grounding | `GroundingVisualItem`, `GroundingMeasurementItem`, `GroundingReport` |
| Pagination | `PaginatedResponse<T>` |

---

## User Roles

| Role | Access Level |
|------|-------------|
| `Admin` | Full access + user management |
| `Manager Teknik` | Approval authority, create WOs, view all modules |
| `Supervisor CNSD` | CNSD division oversight, create WOs |
| `Supervisor TFP` | TFP division oversight, create WOs |
| `Teknisi CNSD` | CNSD equipment checks, WO feedback |
| `Teknisi TFP` | TFP equipment checks, WO feedback |

Role-based sidebar filtering is implemented in `Sidebar.tsx` using a `roles` array per nav item.

---

## Gaps That Need Future Backend Support

1. **Authentication & Authorization** — Real login/logout, JWT/token management, session handling
2. **User CRUD** — Admin panel for creating, editing, deactivating users
3. **Shift Schedule API** — Dynamic shift schedule management instead of mock data
4. **Work Order Persistence** — CRUD operations, status transitions, audit trail
5. **Equipment Check Submission** — CNSD/TFP form data persistence and retrieval
6. **Ground Check Data** — Localizer and other measurement data storage
7. **Grounding Reports** — Inspection data persistence with photo uploads
8. **Maintenance Reports** — Draft/review/approval workflow with document storage
9. **Logbook** — File upload/download for monthly logbooks
10. **Notifications** — Real-time push notifications (Laravel Echo/Pusher infrastructure exists in dependencies)
11. **PDF Generation** — Server-side or client-side PDF export for work orders and reports
12. **File Storage** — Images, signatures, documents (currently referenced as mock URLs)

---

## Future Backend Design Direction

atoms-maintenance will eventually need its own backend. The future backend **may** adopt selected ideas from `backend_atoms`, especially:

- **Account/user data model** — employee ID, role, division, active status
- **Employee data** — name, email, signature, role assignments
- **Rostering schedule data** — shift types, shift times, personnel assignments per shift
- **Authentication concepts** — token-based auth, role-based authorization middleware
- **Office/schedule data model** — shift rotation, personnel availability

**All adopted structures must be:**
- Reviewed against atoms-maintenance functional requirements
- Adapted to include maintenance-specific fields (equipment categories, work order workflows, inspection forms)
- Redesigned where the reference structure doesn't fit

---

## Data Reference Rules

When analyzing `backend_atoms` in the future:
- Treat it as a **reference only**
- Extract useful **data concepts**, not raw implementation code
- Do **not** copy business logic blindly
- Identify **reusable data fields** (e.g., user name, email, role, shift assignment)
- Identify **irrelevant fields** that don't apply to maintenance workflows
- Propose a **clean backend schema** specifically designed for atoms-maintenance
- Mark all uncertain assumptions as **"needs verification"**

---

## API Design Rules

Since atoms-maintenance has no backend yet:

- **Do not** create fake final API endpoints
- Proposed endpoints must be clearly labeled as **"PROPOSAL"**
- Use `VITE_API_URL` environment variable for the API base URL
- Keep future API calls in a **centralized service layer** (`src/services/`)
- **Do not** hardcode production URLs, tokens, credentials, or user roles
- API-driven UI must include **loading, error, and empty states**
- Follow the existing pattern from `authService.ts` (Axios + env var base URL)

---

## Frontend Development Rules

- Follow the existing frontend structure and conventions
- Reuse existing common components (`src/components/common/`)
- Keep the UI consistent with the established enterprise design
- Use the `cn()` utility for conditional Tailwind class merging
- Avoid large refactors unless explicitly requested
- Prefer small, reviewable changes
- Do **not** remove existing features without explicit instruction
- Do **not** rewrite the project from scratch
- Do **not** re-introduce dark mode (it was intentionally removed)
- New pages should follow the existing pattern: export named component, add route in `src/router/index.tsx`
- Type definitions go in `src/types/index.ts`
- Mock data for development goes in `src/data/mockData.ts`

---

## Testing and Validation

### Available Commands (from `package.json`)
| Command | Script | Description |
|---------|--------|-------------|
| `npm run dev` | `vite` | Start dev server with HMR |
| `npm run build` | `tsc -b && vite build` | TypeScript check + production build |
| `npm run lint` | `eslint .` | Run ESLint across the project |
| `npm run preview` | `vite preview` | Preview production build |

### Test Setup
- **No test framework is installed** (no Jest, Vitest, Cypress, or Playwright)
- **No test files exist** in the repository
- Testing infrastructure needs to be added when the project matures

### Before completing any code task, run:
1. `npm run lint` — Check for lint errors
2. `npm run build` — Verify TypeScript compilation and Vite build

---

## Agent Workflow

Before modifying any code, the agent must:

1. **Read relevant files** — Understand the existing code in the files being modified
2. **Understand the existing pattern** — Check how similar features are implemented
3. **Explain a short plan** — Describe what will change and why
4. **Make minimal changes** — Smallest diff that achieves the goal
5. **Validate the result** — Run `npm run lint` and `npm run build`
6. **Summarize** — List changed files and any remaining risks

---

## Do Not Do

- ❌ Do not assume `backend_atoms` is the final backend
- ❌ Do not copy `backend_atoms` directly
- ❌ Do not invent final API endpoints (mark proposals clearly)
- ❌ Do not hardcode mock data as permanent production logic
- ❌ Do not expose secrets, tokens, or credentials
- ❌ Do not replace the frontend framework (React + Vite + Tailwind)
- ❌ Do not rewrite the whole project from scratch
- ❌ Do not re-introduce dark mode
- ❌ Do not remove existing features without explicit instruction
- ❌ Do not bypass the ProtectedRoute auth guard

---

## Open Questions

The following questions still need confirmation from stakeholders:

### Modules & Features
- What is the complete list of modules that must exist in atoms-maintenance?
- Does atoms-maintenance need attendance tracking?
- Does atoms-maintenance need maintenance ticketing beyond work orders?
- Does atoms-maintenance need asset/inventory management?
- Does atoms-maintenance need approval workflows for reports?
- Is the ground check module (runway/taxiway inspection) within scope, or is it a different team's responsibility?

### Users & Roles
- What user roles are needed beyond the current six?
- Should role permissions be configurable (RBAC) or hardcoded?
- What account data should be stored (employee ID format, division, position)?

### Scheduling
- What rostering schedule fields are needed beyond shift type and personnel list?
- How are shift rotations managed (manual assignment or automated)?
- Should the app handle leave/absence tracking?

### Backend & Infrastructure
- What backend stack will be used for the final atoms-maintenance backend? (Laravel is implied by existing dependencies)
- What database will be used? (PostgreSQL, MySQL, etc.)
- What authentication method will be used? (JWT, session, OAuth, SSO?)
- Will the application be deployed on-premise or cloud?
- What file storage solution will be used for documents and photos?

### Data & Integration
- Should atoms-maintenance integrate with any existing AirNav systems?
- What data retention policies apply to work orders, reports, and logbooks?
- Are there regulatory compliance requirements for maintenance records?
