# FRONTEND_CONTEXT.md — atoms-maintenance

## Vision

The ATOMS-Maintenance frontend is a React-based operational web application for airport technical equipment maintenance management at AirNav Indonesia Surabaya. It provides shift-based technicians, supervisors, and managers with tools for work order management, equipment inspections, ground checks, grounding inspections, reporting, and logbook archival.

---

## Architecture: Two-System Model

```
┌──────────────────────────┐     ┌──────────────────────────────┐
│  atoms-rostering         │     │  atoms-maintenance           │
│  (Source of Truth)       │     │  (This Project)              │
│                          │     │                              │
│  • User login (SSO)      │◄────│  frontend_atoms-maintenance  │
│  • Employee master data  │     │  • React 19 + TypeScript     │
│  • Shift schedules       │     │  • Vite + Tailwind CSS       │
│                          │     │  • 8 feature modules         │
│  frontend_atoms          │     │  • Mock data (dev)           │
│  backend_atoms           │     │  • API-ready service layer   │
└──────────────────────────┘     └──────────────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────────┐
                                 │ backend_atoms-        │
                                 │ maintenance           │
                                 │ (Laravel API)         │
                                 │ • PHP 8.x + PostgreSQL│
                                 │ • REST API /api/v1/   │
                                 └──────────────────────┘
```

### Key Principle
- **In development:** Frontend uses mock data (`src/data/mockData.ts`) and mock auth (`VITE_DEV_MOCK_AUTH=true`). No backend required.
- **In production:** Frontend calls `backend_atoms-maintenance` API, which handles maintenance logic. Auth is delegated to atoms-rostering via SSO.

---

## Current Status

| Aspect | Status |
|--------|--------|
| Framework | React 19 + TypeScript 6 + Vite 8 |
| Styling | Tailwind CSS 3.4 |
| Backend | ✅ Integrated — Work Orders full lifecycle verified |
| Auth | ✅ SSO implemented — token proxy via rostering API. Mock mode aktif (`VITE_DEV_MOCK_AUTH=true`) |
| Token storage | sessionStorage (bukan localStorage) |
| Theme | Light-mode only |
| Deployment | Not yet deployed |

---

## Module Inventory

| Module | Route | Pages | Data Source |
|--------|-------|-------|------------|
| Auth (Login) | `/login` | Login page with role selector (mock) | Mock |
| Dashboard | `/` | Shift info, checklist, trouble equipment, metrics | Mock |
| Work Orders | `/work-orders`, `/work-orders/:id`, `/work-orders/create` | List, detail, create | Mock |
| CNSD | `/cnsd/eq-1` | EQ-1 equipment readiness form | Mock |
| TFP | `/tfp/aob-ground` | AOB Ground performance check | Mock |
| Ground Check | `/ground-check` | Meter readings for nav/comm equipment | Mock |
| Grounding | `/grounding`, `/grounding/:id` | Inspection reports with visual + measurement items | Mock |
| Reporting | `/reporting` | Maintenance reports with approval workflow | Mock |
| Logbook | `/logbook` | Monthly logbook archives per division | Mock |

---

## Key Architecture Decisions

### State Management
- React Context for auth, notifications, theme
- No Redux or external state library
- `contextInstances.ts` separates context creation from providers (satisfies react-refresh lint)

### Status
- **Current State:** UI Mockups complete. Dark mode completely removed. Modals refined. **Integration with `backend_atoms-maintenance` mock authentication is successfully completed.** Work Order List UI improved with standardized statuses, action icons, and a dedicated Print-friendly PDF layout. Unified Work Order form implemented as a Modal without navigating away from the list page, supporting both "Create" (with auto-prefilling based on shift) and "Edit" modes.
- **Authentication:** Currently fetching login and profile data from the local Laravel backend (`DEV_MOCK_AUTH=true`) successfully bypassing static local storage.
- **Routing:** Role-based routing is established. New print route (`/work-orders/:id/print`) added. The old `/work-orders/create` and `/work-orders/:id/edit` routes have been removed in favor of Modals.
- **Next:** Integrate full APIs for Work Orders, Dashboard Data, and real SSO login via atoms-rostering.

### API Layer
- `src/services/authService.ts` — only service implemented so far
- Uses Axios with `VITE_API_URL` base URL
- Token sent via `Authorization: Bearer {token}` header
- Designed for easy swap from mock data to real API calls

### Mock Data Strategy
- All mock data in `src/data/mockData.ts` (~460 lines)
- Covers: users, shifts, work orders, CNSD categories, TFP categories, reports, logbooks, notifications, ground check equipment, grounding reports
- Mock data shapes match `src/types/index.ts` exactly

---

## Mock Login Strategy

### Current Behavior
The frontend already has partial mock login support:
- `AuthContext.tsx` has an `updateUser()` method that injects a mock user + mock token
- `authService.ts` calls `POST /auth/login` for real login

### Planned Enhancement (with `VITE_DEV_MOCK_AUTH`)

| Mode | Login Behavior |
|------|---------------|
| `VITE_DEV_MOCK_AUTH=true` | Show role selector dropdown instead of email/password. Select a role → inject mock user from `mockData.ts` into AuthContext. No API call. |
| `VITE_DEV_MOCK_AUTH=false` | Normal login flow → call `POST /api/v1/auth/login` → receive token + user from backend. |

### Frontend Dev Can Work Without Backend
- Set `VITE_DEV_MOCK_AUTH=true`
- All pages render using mock data from `mockData.ts`
- No backend server needed for frontend development

---

## Integration with atoms-rostering

### What We Read from Rostering (Future)
- User profiles (name, email, role)
- Employee operational data (division, group)
- Current shift schedule and personnel

### What We Do NOT Read from Rostering
- Roster building/management UI
- Leave request forms
- Shift swap workflows
- Notification management

### SSO Flow (✅ Implemented 2026-05-15)
1. User klik tombol Maintenance di atoms-rostering frontend (port 5174)
2. `MenuGrid.tsx` baca token dari `sessionStorage` → redirect ke `http://localhost:5173?token={token}`
3. `AuthContext.initAuth()` baca `?token` dari URL → hapus dari URL
4. Panggil `GET /api/v1/auth/verify` → backend proxy ke `GET http://localhost:8001/api/auth/me`
5. Jika valid: simpan token di `sessionStorage['auth_token']`, set user di context
6. Jika invalid: redirect ke `http://localhost:5174/login`

**Mock dev mode:** Set `VITE_DEV_MOCK_AUTH=true` → SSO di-bypass, login via mock form di `/login`.
Lihat `.agents/instructions/sso-rules.md` untuk detail lengkap.

---

## User Roles

| Role | Division | Can Do |
|------|----------|--------|
| Admin | — | Full system access |
| Manager Teknik | Management | View all, approve/reject reports, manage WOs |
| Supervisor CNSD | CNSD | Create WOs, manage CNSD inspections, submit reports |
| Supervisor TFP | TFP | Create WOs, manage TFP inspections, submit reports |
| Teknisi CNSD | CNSD | Execute WOs, fill CNSD forms |
| Teknisi TFP | TFP | Execute WOs, fill TFP forms |

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |
| `VITE_DEV_MOCK_AUTH` | `true` | Enable mock auth untuk development |
| `VITE_ROSTERING_FRONTEND_URL` | `http://localhost:5174` | URL rostering frontend (SSO redirect target) |
| `VITE_REVERB_APP_KEY` | `atoms-maintenance-key` | WebSocket key (future) |
| `VITE_REVERB_HOST` | `localhost` | WebSocket host (future) |
| `VITE_REVERB_PORT` | `8080` | WebSocket port (future) |
