# SKILL: Frontend Architecture — atoms-maintenance

Always follow these rules when working on the ATOMS-Maintenance frontend.

---

## Mandatory First Steps

1. **Read AGENTS.md and FRONTEND_CONTEXT.md** before starting any frontend task.
2. **Read CLAUDE.md** for detailed component inventory and design rules.
3. **Check existing components** in `src/components/common/` before creating new ones.

---

### 1. API Integration Requirements
1. **Axios over Fetch**: Use `axios` exclusively for all API calls.
2. **Base Configuration**: Retrieve the API base URL from `import.meta.env.VITE_API_URL`. Do not hardcode URLs.
3. **Response Unwrapping**: Standardize un-wrapping the `ApiResponse` payload format from the backend. The backend will return `{ success: true, message: string, data: any }`. Services must extract and return `response.data.data`.
4. **Mock Auth Compatibility**: Handle the fallback gracefully when `VITE_DEV_MOCK_AUTH=true`. Ensure local `localStorage` mock logic only runs if the API is entirely unresponsive or disabled. 

---

## Architecture Rules

1. **Two-system model.** atoms-rostering is the source of truth for login, accounts, and employee/shift data. The frontend reads this data but does not manage it.
2. **Never modify atoms-rostering.** Do not write, edit, or commit any files inside `atoms-rostering/`.
3. **Mock data in dev.** When `VITE_DEV_MOCK_AUTH=true`, all data comes from `src/data/mockData.ts`. No backend required.
4. **Dedicated Print Views.** When creating printable layouts (like Work Orders), use a dedicated route (e.g. `/path/:id/print`) outside of the `AppShell` (or hidden from it via `@media print`) to ensure a clean, A4-friendly output without sidebar/topbar.
5. **API-ready code.** Even when using mock data, structure code so that swapping to real API calls is minimal work.
5. **Light-mode only.** Do not reintroduce dark theme.

---

## Implementation Rules

1. **Reuse components.** Use existing common components from `src/components/common/`.
2. **Follow patterns.** Match the style and structure of existing pages.
3. **Types in one place.** All TypeScript interfaces in `src/types/index.ts`.
4. **Mock data in one place.** Development data in `src/data/mockData.ts`.
5. **Routes in one place.** Register new routes in `src/router/index.tsx`.
6. **Use `cn()`.** For conditional Tailwind class merging from `src/lib/utils.ts`.
7. **Use `@/` imports.** Path alias maps to `./src/*`.

---

## Form & Modal Architecture Rules

1. **Forms**: Use uncontrolled components for simple forms to maximize performance, but use controlled state (`useState`) with lazy initialization (`useEffect` logic) for complex modals that require dynamic switching between Create and Edit modes.
2. **Pre-population**: When developing "Create" modals, automatically pre-fill relevant fields (e.g. Current Shift, Logged-in User, Current Date) based on contextual data (like `mockShiftSchedule`) rather than forcing the user to manually select them.
3. **Dual-Purpose Modals**: Reuse the exact same modal component for both Creating and Editing entities. Use a `null` ID prop to infer Create mode, and an actual ID to infer Edit mode. Adapt the Title, Action Buttons, and Initial State dynamically.
4. **Validation Rules**: Validate minimum lengths and handle loading states using the `<Button isLoading />` property during submission.

---

## Mock Auth Rules

1. **`VITE_DEV_MOCK_AUTH=true`** — Frontend shows role selector on login, injects mock user, no API call.
2. **`VITE_DEV_MOCK_AUTH=false`** — Frontend uses real login flow via `authService.ts`.
3. **Mock token format:** `mock-token-{user_id}`.
4. **Mock users** defined in `src/data/mockData.ts` → `mockUsers` array.

---

## Backend Integration Rules (When Backend Exists)

1. **Create service modules** in `src/services/` for each backend module.
2. **Match API response shapes** to TypeScript types in `src/types/index.ts`.
3. **Handle loading/error states** consistently across all pages.
4. **Use Axios** with `VITE_API_URL` base URL.
5. **Send `Authorization: Bearer {token}`** with every authenticated request.

---

## Commit & Validation Rules

1. **Run `npm run lint`** — must pass with no errors.
2. **Run `npm run build`** — must compile successfully.
3. **Follow Conventional Commits** (see `git-auto-ship` skill).
4. **Incremental changes.** Small, focused diffs. No large refactors without explicit instruction.
5. **Don't delete features.** Never remove existing features without explicit instruction.

---

## Division Color Coding

- **CNSD:** Sky blue (`sky-*` Tailwind classes)
- **TFP:** Emerald green (`emerald-*` Tailwind classes)
- Maintain this consistently across all pages and components.
