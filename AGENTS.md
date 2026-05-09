# AGENTS.md — atoms-maintenance

> Agent-agnostic guide for AI coding assistants working on this project.
> For detailed project context, architecture, and rules, see **[CLAUDE.md](./CLAUDE.md)**.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint the codebase
npm run lint

# Type-check + production build
npm run build

# Preview production build
npm run preview
```

---

## Project Summary

- **What:** Frontend web app for airport equipment maintenance and operations management (AirNav Indonesia).
- **Stack:** React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 3.4.
- **Backend:** Integrated with local mock backend. Work Order UI revamped (Fasilitas, standardized statuses, Print PDF layout, Create/Edit functionality via unified Modal).
- **State:** React Context (`AuthContext`, `NotificationContext`, `ThemeContext`).
- **Routing:** React Router DOM 7 with `createBrowserRouter`.
- **Theme:** Light-mode only.

---

## Key Directories

| Path | Purpose |
|------|---------|
| `src/components/common/` | 16 reusable UI components (Button, Card, Modal, Table, etc.) |
| `src/components/layout/` | App shell, sidebar, topbar, route guard |
| `src/pages/` | Page components organized by module |
| `src/contexts/` | React Context providers |
| `src/data/mockData.ts` | All mock/dummy data |
| `src/services/` | API service layer (currently only auth) |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/router/index.tsx` | Route definitions |
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |

---

## Coding Rules

1. **Read first.** Always read relevant existing files before making changes.
2. **Reuse components.** Use existing common components from `src/components/common/`.
3. **Follow patterns.** Match the style and structure of existing pages and components.
4. **Use `cn()`.** For conditional Tailwind class merging, use `cn()` from `src/lib/utils.ts`.
5. **Types in one place.** Add TypeScript interfaces to `src/types/index.ts`.
6. **Mock data in one place.** Development data goes in `src/data/mockData.ts`.
7. **Routes in one place.** Register new routes in `src/router/index.tsx`.
8. **No dark mode.** The app is light-mode only. Do not reintroduce dark theme.
9. **No backend assumptions.** Do not create final API endpoints. Label proposals clearly.
10. **Minimal changes.** Prefer small, focused diffs over large refactors.
11. **Don't delete features.** Never remove existing features without explicit instruction.

---

## Validation Checklist

Before completing any code task, run:

```bash
npm run lint     # Must pass with no errors
npm run build    # Must compile TypeScript and build successfully
```

No test framework is currently installed.

---

## Path Alias

`@/*` maps to `./src/*` — use this in all imports:
```typescript
import { Button } from '@/components/common/Button';
import type { User } from '@/types';
```

---

## Environment Variables

Defined in `.env` (gitignored):
```
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=atoms-maintenance-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

Access via `import.meta.env.VITE_*`.

---

## For Full Context

Read **[CLAUDE.md](./CLAUDE.md)** for:
- Complete module inventory and status
- All 16 common component descriptions
- Type system documentation
- User role definitions and permissions
- Backend reference rules (`backend_atoms`)
- API design rules
- Open questions and future direction
