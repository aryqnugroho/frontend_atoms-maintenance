# git-auto-ship

**Automatic Git commit and push workflow for atoms-maintenance frontend project**

---

## Purpose

This skill ensures that after every completed code change in the atoms-maintenance frontend project, the agent performs a safe Git commit and pushes the change to origin main in a structured and consistent way.

---

## When to Use

**Automatically invoke after:**
- Completing any code or UI change
- Finishing a feature implementation
- Fixing a bug
- Refactoring code
- Updating documentation
- Making configuration changes

**Do NOT invoke when:**
- User explicitly says "do not commit" or "do not push"
- Changes are incomplete or experimental
- Validation fails and cannot be fixed
- Working on a non-main branch without explicit permission

---

## Prerequisites

Before running this skill, ensure you have:
1. Read CLAUDE.md, AGENTS.md, PRODUCT.md, DESIGN.md
2. Completed the requested code changes
3. Verified the changes work as expected

---

## Workflow

### Step 1: Inspect Repository State

```bash
git status --short
git branch --show-current
git remote -v
```

**Expected state:**
- Current branch: `main`
- Remote origin: `https://github.com/aryqnugroho/frontend_atoms-maintenance.git`

---

### Step 2: Safety Checks

**Branch verification:**
- ✅ Current branch MUST be `main`
- ❌ STOP if branch is not `main` (unless user explicitly requested that branch)

**Remote verification:**
- ✅ Origin MUST point to: `https://github.com/aryqnugroho/frontend_atoms-maintenance.git`
- ❌ STOP if origin is missing or incorrect

**File exclusion checks:**
- ❌ NEVER commit: `.env`, `.env.local`, `.env.production`
- ❌ NEVER commit: API keys, tokens, credentials, private keys
- ❌ NEVER commit: `node_modules/`, `dist/`, `build/`, `.cache/`
- ❌ NEVER commit: Temporary files, editor swap files, OS files
- ✅ ONLY commit: Source code, configuration, documentation, assets

---

### Step 3: Validate Project

**Check available scripts:**
```bash
# Read package.json to see available scripts
```

**Run validation (if scripts exist):**
```bash
npm run lint      # Must pass with no errors
npm run build     # Must compile successfully
npm run typecheck # Must pass (if available)
```

**Validation rules:**
- Use the package manager already in use (npm, pnpm, yarn, bun)
- Do NOT invent scripts that don't exist
- If validation FAILS:
  - Try to fix issues if they're clearly related to the change
  - If still failing, STOP and report the failure
  - Do NOT commit or push with failing validation

---

### Step 4: Review Changes

```bash
git diff --stat
git diff --check
```

**Review checklist:**
- ✅ All changes match the user request
- ✅ No unrelated edits included
- ✅ No whitespace errors
- ✅ No secrets or credentials
- ✅ File changes are intentional

---

### Step 5: Stage Changes

**Preferred approach (explicit staging):**
```bash
git add <file1> <file2> <file3>
```

**Alternative (if all changes are relevant):**
```bash
git add .
```

**Rules:**
- Prefer explicit staging when possible
- Only use `git add .` if ALL changed files are relevant
- Never stage unrelated files

---

### Step 6: Create Commit Message

**Format: Conventional Commits**

```
<type>(<scope>): <short summary>

- <bullet point 1>
- <bullet point 2>
- <bullet point 3>

Validation: ✅ lint passed, ✅ build passed
```

**Allowed types:**
- `feat` — New feature or enhancement
- `fix` — Bug fix
- `refactor` — Code restructuring without behavior change
- `style` — UI/styling changes
- `docs` — Documentation updates
- `chore` — Maintenance tasks (dependencies, config, tooling)
- `test` — Test additions or fixes
- `build` — Build system or dependency changes
- `perf` — Performance improvements

**Scope examples:**
- `ui` — User interface changes
- `accessibility` — Accessibility improvements
- `tokens` — Design token system
- `responsive` — Responsive design
- `topbar` — Topbar component
- `dashboard` — Dashboard page
- `components` — Common components
- `layout` — Layout components
- `git` — Git-related changes
- `project` — Project-wide changes

**Commit message examples:**

```
feat(ui): improve responsive topbar behavior

- Preserve AirNav branding on mobile
- Increase touch targets to 80px
- Add responsive quick nav layout
- Optimize shift badge visibility

Validation: ✅ lint passed, ✅ build passed
```

```
fix(accessibility): add aria labels to icon buttons

- Add aria-label to hamburger menu button
- Add aria-label to notification bell
- Add aria-label to logout button
- Mark decorative icons with aria-hidden

Validation: ✅ lint passed, ✅ build passed
```

```
refactor(tokens): centralize status badge colors

- Create status color tokens in tailwind.config.js
- Update StatusBadge to use semantic tokens
- Update ShiftBadge to use semantic tokens
- Add CSS variables for table colors

Validation: ✅ lint passed, ✅ build passed
```

**Commit message rules:**
- Subject line: ≤72 characters
- Use imperative mood ("add" not "added")
- No period at end of subject
- Body: bullet points for meaningful changes
- Include validation results
- No vague wording ("fix stuff", "update things")

---

### Step 7: Commit

```bash
git commit -m "<commit subject>" -m "<commit body>"
```

**Example:**
```bash
git commit -m "feat(ui): improve responsive topbar behavior" -m "- Preserve AirNav branding on mobile
- Increase touch targets to 80px
- Add responsive quick nav layout
- Optimize shift badge visibility

Validation: ✅ lint passed, ✅ build passed"
```

---

### Step 8: Push

```bash
git push origin main
```

**Expected result:**
- Push succeeds
- Changes appear on GitHub

---

### Step 9: Handle Push Rejection

**If push is rejected (remote has new commits):**

```bash
git pull origin main --rebase
```

**Conflict resolution:**
- ✅ Resolve simple, safe conflicts (whitespace, formatting)
- ❌ STOP if conflicts are complex or risky
- Ask user for guidance on complex conflicts

**After resolving conflicts:**
```bash
npm run lint      # Re-validate
npm run build     # Re-validate
git push origin main
```

**NEVER use force push unless user explicitly requests it:**
- ❌ `git push --force`
- ❌ `git push -f`
- ❌ `git push --force-with-lease`

---

### Step 10: Final Response

**Always report:**

```
✅ Changes committed and pushed successfully

Files changed:
- src/components/layout/Topbar.tsx
- src/components/layout/AppShell.tsx
- src/index.css

Commit: a1b2c3d
Message: feat(ui): improve responsive topbar behavior

Validation:
✅ npm run lint — passed
✅ npm run build — passed

Push result:
✅ Pushed to origin main
   https://github.com/aryqnugroho/frontend_atoms-maintenance.git

Remaining risks: None
```

**If there are risks, list them:**
```
Remaining risks:
⚠️ Bundle size increased by 50KB (consider code splitting)
⚠️ Some components not yet tokenized (future enhancement)
```

---

## Hard Restrictions

**NEVER:**
- ❌ Force push by default
- ❌ Commit secrets, tokens, API keys, credentials
- ❌ Commit `.env` files
- ❌ Commit `node_modules/`, `dist/`, `build/`
- ❌ Commit unrelated files
- ❌ Skip lint/build validation if available
- ❌ Push if validation fails
- ❌ Rewrite history unless explicitly requested
- ❌ Modify backend reference repo
- ❌ Add backend integration unless explicitly requested
- ❌ Rewrite the app from scratch
- ❌ Remove existing features without explicit instruction

**ALWAYS:**
- ✅ Validate before committing
- ✅ Use Conventional Commit format
- ✅ Stage only relevant files
- ✅ Review changes before committing
- ✅ Report validation results
- ✅ Keep changes small and incremental
- ✅ Preserve existing routes, behavior, and UI structure
- ✅ Follow existing coding style and conventions

---

## Project Context

**Repository:**
- Main repo: `https://github.com/aryqnugroho/frontend_atoms-maintenance.git`
- Main branch: `main`
- Project name: `atoms-maintenance`

**Project characteristics:**
- Frontend-only React application
- TypeScript + Vite + Tailwind CSS
- No backend (uses mock data)
- Light-mode only
- Operational maintenance system for AirNav Indonesia

**Development principles:**
- Small, incremental changes
- Preserve existing functionality
- Follow established patterns
- Maintain UI consistency
- Keep changes safe and reversible

---

## Error Handling

### Validation Fails
```
❌ Validation failed: npm run lint

Error: ESLint found 3 errors in src/components/Button.tsx

Action: Fix linting errors before committing
```

### Push Rejected
```
⚠️ Push rejected: remote has new commits

Action: Pulling with rebase...
✅ Rebase successful
✅ Re-validated: lint passed, build passed
✅ Pushed to origin main
```

### Conflicts During Rebase
```
❌ Rebase conflicts detected in:
- src/components/layout/Topbar.tsx

Action: Conflicts are complex. Please resolve manually.

To resolve:
1. Edit the conflicted files
2. Run: git add <resolved-files>
3. Run: git rebase --continue
4. Run: npm run lint && npm run build
5. Run: git push origin main
```

---

## Examples

### Example 1: Feature Implementation

**User request:** "Add skip-to-main-content link for accessibility"

**Workflow:**
1. ✅ Implement skip link in AppShell.tsx
2. ✅ Test keyboard navigation
3. ✅ Run `git status --short` → shows AppShell.tsx modified
4. ✅ Run `npm run lint` → passed
5. ✅ Run `npm run build` → passed
6. ✅ Stage: `git add src/components/layout/AppShell.tsx`
7. ✅ Commit: `feat(accessibility): add skip-to-main-content link`
8. ✅ Push: `git push origin main`
9. ✅ Report success

### Example 2: Bug Fix

**User request:** "Fix mobile hamburger menu not closing on navigation"

**Workflow:**
1. ✅ Fix onClick handler in Topbar.tsx
2. ✅ Test on mobile viewport
3. ✅ Run validation
4. ✅ Stage: `git add src/components/layout/Topbar.tsx`
5. ✅ Commit: `fix(ui): close mobile menu on navigation`
6. ✅ Push: `git push origin main`
7. ✅ Report success

### Example 3: Refactoring

**User request:** "Extract color tokens for status badges"

**Workflow:**
1. ✅ Add tokens to tailwind.config.js
2. ✅ Update StatusBadge.tsx
3. ✅ Update ShiftBadge.tsx
4. ✅ Add CSS variables to index.css
5. ✅ Run validation
6. ✅ Stage all changed files
7. ✅ Commit: `refactor(tokens): centralize status badge colors`
8. ✅ Push: `git push origin main`
9. ✅ Report success

---

## Integration with Other Skills

**This skill works with:**
- `impeccable` — UI design and audit workflows
- `context-gatherer` — Repository analysis
- `spec-task-execution` — Task implementation

**Execution order:**
1. User requests a change
2. Agent implements the change
3. Agent validates the change
4. **git-auto-ship activates automatically**
5. Agent commits and pushes
6. Agent reports completion

---

## Notes

- This skill is **automatic** — it runs after every completed change unless the user says not to
- The skill is **safe** — it validates before committing and never force pushes
- The skill is **consistent** — it uses Conventional Commits and structured messages
- The skill is **transparent** — it always reports what it did and any remaining risks

---

## Version

**Version:** 1.0.0  
**Last Updated:** 2026-05-08  
**Project:** atoms-maintenance frontend  
**Author:** Kiro AI Agent
