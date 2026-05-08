# DESIGN.md — ATOMS-Maintenance

## Color System

### Palette Strategy
**Restrained with functional color coding.** The base interface uses tinted neutrals with strategic accent colors for operational divisions (CNSD/TFP) and status types (normal/abnormal/warning). Color is a functional tool for rapid scanning, not decoration.

### Base Colors (OKLCH)
```css
/* Page background: cool gray with subtle blue tint */
--bg-page: oklch(94% 0.008 240);        /* #EEF1F8 */

/* Card background: pure white with minimal warmth */
--bg-card: oklch(100% 0.002 240);       /* #FFFFFF */

/* Border: neutral gray */
--border-card: oklch(84% 0.005 240);    /* #D1D5DB */

/* Text primary: deep slate */
--text-primary: oklch(24% 0.015 240);   /* #1E293B */

/* Text secondary: medium slate */
--text-secondary: oklch(52% 0.012 240); /* #64748B */

/* Dot pattern: very light gray */
--dot-color: oklch(91% 0.005 240);      /* #E2E6F0 */
```

### Brand Colors
```css
/* Primary: deep navy (AirNav brand) */
--brand-primary: oklch(30% 0.08 250);   /* #1B3A6B */

/* Secondary: amber (accent, used sparingly) */
--brand-secondary: oklch(70% 0.15 60);  /* #F5A623 */
```

### Sidebar Colors
```css
/* Sidebar base: rich navy */
--sidebar: oklch(25% 0.10 255);         /* #222E6A */

/* Sidebar active state */
--sidebar-active: oklch(38% 0.08 255);  /* #454D7C */

/* Sidebar hover state */
--sidebar-hover: oklch(30% 0.09 255);   /* #2d3a7a */
```

### Division Colors
```css
/* CNSD: sky blue (communications/navigation) */
--cnsd: oklch(45% 0.10 220);            /* #1B5E82 */

/* TFP: forest green (facilities/infrastructure) */
--tfp: oklch(40% 0.12 150);             /* #1A5C34 */

/* Work Order: purple */
--wo: oklch(45% 0.18 290);              /* #6D28D9 */
```

### Status Colors
```css
/* Normal: emerald green */
--normal: oklch(65% 0.18 160);          /* #10B981 */

/* Abnormal: red */
--abnormal: oklch(60% 0.22 25);         /* #EF4444 */

/* Warning: amber */
--warning: oklch(70% 0.18 70);          /* #F59E0B */

/* Soon/Inactive: neutral gray */
--soon: oklch(68% 0.005 240);           /* #9CA3AF */
```

### Color Usage Rules
- **Never use pure black (#000) or pure white (#fff).** All neutrals have a subtle blue tint (chroma 0.005-0.015) to maintain visual cohesion.
- **Division colors are semantic, not decorative.** CNSD sky blue and TFP emerald green appear consistently in badges, borders, and section headers to reinforce division identity.
- **Status colors override division colors.** When equipment status is abnormal, red takes precedence over division color coding.
- **Amber is an accent, not a primary.** The brand secondary color appears in warnings, pending states, and occasional CTAs, but never dominates the interface.

## Typography

### Font Family
**Inter** (Google Fonts, loaded via `index.html`). A neutral, highly legible sans-serif designed for UI work. Fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif`.

**JetBrains Mono** (or Fira Code) for technical identifiers: work order numbers, equipment codes, measurement standards. Used sparingly in `.grounding-standard` class.

### Type Scale
```css
/* Heading 1: Page titles */
h1: 24px (1.5rem), font-weight 700, tracking -0.025em

/* Heading 2: Section titles */
h2: 18px (1.125rem), font-weight 600, tracking -0.025em

/* Heading 3: Subsection titles */
h3: 16px (1rem), font-weight 600

/* Body: Default text */
body: 14px (0.875rem), font-weight 400

/* Small: Secondary text, labels */
small: 12px (0.75rem), font-weight 400

/* Tiny: Metadata, timestamps */
tiny: 10px (0.625rem), font-weight 400
```

### Hierarchy Rules
- **Scale ratio: 1.25x minimum between levels.** Avoid flat scales where h1, h2, and h3 are visually indistinguishable.
- **Weight contrast over size.** In dense layouts (tables, forms), use font-weight 600 vs 400 to create hierarchy without increasing line height.
- **Uppercase sparingly.** Reserved for section labels in forms (e.g., "DIVISI CNSD", "MANAGEMENT") and table headers. Never use uppercase for body text or headings.
- **Line length: 65-75ch maximum** for body text. Operational data (tables, lists) can exceed this for information density.

### Text Colors
- Primary text: `--text-primary` (slate-900 equivalent)
- Secondary text: `--text-secondary` (slate-500 equivalent)
- Disabled text: `text-slate-400`
- Link text: `text-brand-primary` with `hover:underline`

## Layout

### Spacing System
Based on Tailwind's default scale (4px base unit), with emphasis on rhythm over uniformity.

```
Tight:   4px (gap-1), 8px (gap-2)   — Icon-to-label, inline badges
Default: 12px (gap-3), 16px (gap-4) — Card padding, list item spacing
Loose:   24px (gap-6), 32px (gap-8) — Section spacing, page margins
```

**Vary spacing for rhythm.** Dashboard cards use `space-y-6` between sections, but internal card content uses `space-y-3` or `space-y-4`. Same padding everywhere is monotony.

### Grid and Containers
- **Max-width: 1280px (max-w-7xl)** for main content. Prevents excessive line length on ultra-wide monitors.
- **Responsive grid:** `grid-cols-1 lg:grid-cols-2` for two-column layouts. Mobile stacks vertically, desktop shows side-by-side.
- **No arbitrary containers.** Don't wrap every section in a `<div class="container">`. Most content flows naturally within the page max-width.

### Card Design
```tsx
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
  <div className="px-6 py-4 border-b border-gray-100">
    {/* Header */}
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

- **Border radius: 16px (rounded-2xl)** for cards. Softer than sharp corners, but not pill-shaped.
- **Border: 1px solid gray-200.** Defines card boundaries without heavy shadows.
- **Shadow: subtle (shadow-sm).** Elevation is minimal; cards are defined by borders, not drop shadows.
- **Header separation: border-b border-gray-100.** Divides card header from content without visual weight.
- **Padding: 24px (p-6) for content, 16px vertical + 24px horizontal (px-6 py-4) for headers.**

### Background Pattern
```css
.main-content-bg {
  background-color: var(--bg-page);
  background-image: radial-gradient(circle, var(--dot-color) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Subtle dot grid on page background. Adds texture without competing with content. Dots are 1px, spaced 24px apart.

### Responsive Breakpoints
- **Mobile: < 640px** — Single column, stacked navigation, full-width cards
- **Tablet: 640px - 1024px** — Two-column grids where appropriate, sidebar collapses to drawer
- **Desktop: ≥ 1024px** — Full layout with persistent sidebar, multi-column dashboards

## Components

### Buttons
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

**Variants:**
- `primary`: Navy background (`bg-brand-primary`), white text. Default for primary actions.
- `secondary`: Amber background (`bg-brand-secondary`), white text. Rare, used for warnings or secondary CTAs.
- `outline`: White background, gray border, slate text. Secondary actions.
- `ghost`: Transparent background, slate text, hover gray. Tertiary actions, icon buttons.
- `danger`: Red background (`bg-maintenance-abnormal`), white text. Destructive actions.

**Sizes:**
- `sm`: 36px height (h-9), 12px horizontal padding, 14px text
- `md`: 40px height (h-10), 16px horizontal padding, 14px text (default)
- `lg`: 44px height (h-11), 32px horizontal padding, 16px text

**Rules:**
- **No gradient backgrounds.** Solid colors only.
- **Rounded corners: 8px (rounded-lg).** Consistent with input fields.
- **Loading state: spinner icon + disabled.** Use `isLoading` prop to show `Loader2` icon.
- **Focus ring: 2px brand-primary.** Keyboard navigation must be visible.

### Badges
```tsx
<StatusBadge status="in-progress" variant="pill" />
<ShiftBadge shift="pagi" />
```

**Status badges:**
- `open`: Blue background, blue text
- `in-progress`: Amber background, amber text
- `completed`: Green background, green text
- `closed`: Gray background, gray text

**Shift badges:**
- `pagi`: Light background, sun emoji, "Shift Pagi 07:00-13:00"
- `siang`: Light background, cloud-sun emoji, "Shift Siang 13:00-19:00"
- `malam`: Light background, moon emoji, "Shift Malam 19:00-07:00"

**Division badges:**
- `CNSD`: Sky blue background (`bg-sky-50`), sky blue text (`text-sky-700`)
- `TFP`: Emerald background (`bg-emerald-50`), emerald text (`text-emerald-700`)

**Rules:**
- **Pill shape: rounded-full.** Fully rounded ends for badge variants.
- **Padding: px-2 py-0.5 for small, px-3 py-1 for default.**
- **Font size: 12px (text-xs) for small, 14px (text-sm) for default.**
- **No icons inside badges.** Text only, or emoji for shift badges.

### Tables
```tsx
<Table>
  <thead>
    <tr>
      <th>Column Header</th>
    </tr>
  </thead>
  <tbody>
    <tr onClick={() => navigate('/detail')}>
      <td>Cell content</td>
    </tr>
  </tbody>
</Table>
```

**Rules:**
- **Clickable rows: hover:bg-slate-50 cursor-pointer.** Entire row is interactive, not just a link in one cell.
- **Header styling: bg-slate-50, font-weight 600, text-xs uppercase, tracking-wide.**
- **Cell padding: px-4 py-3.** Generous padding for readability.
- **Borders: border-b border-gray-100.** Horizontal lines only, no vertical dividers.
- **Zebra striping: avoid.** Hover state provides sufficient row distinction.

### Forms
```tsx
<Input
  label="Equipment Name"
  placeholder="Enter equipment name"
  required
/>

<Select
  label="Division"
  options={[
    { value: 'CNSD', label: 'CNSD' },
    { value: 'TFP', label: 'TFP' },
  ]}
/>

<Textarea
  label="Notes"
  rows={4}
/>
```

**Rules:**
- **Label above input.** Never inline labels for operational forms.
- **Required indicator: red asterisk.** `<span className="text-red-500">*</span>` after label.
- **Input height: 40px (h-10).** Consistent with button height.
- **Border: 1px solid gray-200, focus: 2px brand-primary ring.**
- **Placeholder text: text-slate-400.** Lighter than body text, never as a substitute for labels.
- **Error state: red border, red text below input.** Validation errors appear immediately below the field.

### Modals
```tsx
<Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
  <h2>Modal Title</h2>
  <p>Modal content</p>
  <div className="flex gap-2 mt-4">
    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</Modal>
```

**Sizes:**
- `sm`: 400px max-width
- `md`: 600px max-width (default)
- `lg`: 800px max-width

**Rules:**
- **Backdrop: black/40 with backdrop-blur-sm.** Dims background without full opacity.
- **Modal positioning: centered vertically and horizontally.**
- **Close button: X icon in top-right, or hideCloseButton prop to remove.**
- **Footer buttons: right-aligned, cancel on left, primary action on right.**
- **Avoid modals for complex workflows.** Prefer inline editing or dedicated pages for multi-step forms.

## Motion

### Animation Principles
- **Ease out with exponential curves.** Use `ease-out` timing (or custom cubic-bezier for quart/quint/expo). No bounce, no elastic.
- **Duration: 200-400ms for UI transitions, 600-800ms for page loads.**
- **Don't animate layout properties.** Never animate `width`, `height`, `top`, `left`. Use `transform` and `opacity` only.

### Defined Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeScaleUp {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
```

**Usage:**
- `animate-fade-in`: Page load, card appearance
- `animate-fade-slide-down`: Topbar, page header
- `animate-fade-slide-up`: Dashboard cards, content sections
- `animate-fade-scale-up`: Modals, dropdowns

**Rules:**
- **Stagger delays for sequential elements.** Use `animate-fade-in-delay` and `animate-fade-in-delay-2` for cascading entrance.
- **No animation on data updates.** When a table row updates, don't animate the change. Operational data should update instantly.
- **Hover transitions: 150ms.** Button hover, card hover, link hover all use `transition-colors duration-150`.

## Elevation

### Shadow System
```css
shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05)   — Cards, buttons
shadow:     0 1px 3px rgba(0, 0, 0, 0.1)    — Dropdowns, popovers
shadow-md:  0 4px 6px rgba(0, 0, 0, 0.1)    — Modals, elevated cards
shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1)  — Overlays, notifications
shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.1)  — Rare, high-priority overlays
shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25) — Mobile drawer, critical alerts
```

**Rules:**
- **Default cards: shadow-sm.** Minimal elevation, defined by borders.
- **Interactive elements: shadow on hover.** Buttons and cards gain `hover:shadow` to indicate interactivity.
- **Modals and dropdowns: shadow-2xl.** High elevation to separate from page content.
- **No layered shadows.** One shadow per element, no stacking.

## Iconography

### Icon Library
**Lucide React** (v1.8). Consistent stroke width (2px), 24x24 default size, scalable to 16px, 20px, or 32px as needed.

### Icon Usage
- **Navigation icons: 18-20px.** Sidebar and topbar nav items use `size={18}` or `size={20}`.
- **Button icons: 16px.** Icons inside buttons use `size={16}` with `mr-2` spacing.
- **Section headers: 20px.** Card headers and page titles use `size={20}`.
- **Status indicators: 16-18px.** Alert icons, status icons use `size={16}` or `size={18}`.

**Color:**
- **Default: inherit text color.** Icons use `className="text-slate-700"` or inherit from parent.
- **Accent: division or status color.** CNSD icons use `text-sky-700`, TFP icons use `text-emerald-700`, alert icons use `text-red-600`.

**Rules:**
- **No decorative icons.** Every icon serves a functional purpose (navigation, status, action).
- **No icon-only buttons without labels.** Exception: mobile hamburger menu, close buttons with aria-label.
- **Consistent icon choice.** `FileText` for work orders, `CheckSquare` for CNSD, `Activity` for TFP, `AlertTriangle` for trouble equipment.

## Responsive Design

### Mobile Adaptations
- **Topbar: hamburger menu replaces desktop nav links.** Logo and brand remain visible.
- **Sidebar: slide-in drawer from left.** Overlay with backdrop blur, 260px width.
- **Cards: full-width, stacked vertically.** No side-by-side layouts on mobile.
- **Tables: horizontal scroll.** Wrap tables in `overflow-x-auto` container, preserve column structure.
- **Forms: full-width inputs.** No multi-column form layouts on mobile.

### Tablet Adaptations
- **Two-column grids where appropriate.** Dashboard cards can show 2 per row on tablet.
- **Sidebar: persistent or collapsible based on screen width.** At 1024px breakpoint, sidebar becomes persistent.

### Desktop Optimizations
- **Multi-column dashboards.** Three-column layouts for dense information (shift personnel, checklist, work orders).
- **Persistent sidebar.** Always visible, no hamburger menu.
- **Hover states.** Desktop users see hover effects on cards, buttons, table rows.

## Accessibility

### Keyboard Navigation
- **Focus rings: 2px brand-primary ring.** Visible on all interactive elements.
- **Tab order: logical flow.** Top to bottom, left to right.
- **Skip links: not currently implemented.** Future enhancement for screen reader users.

### Color Contrast
- **WCAG AA minimum.** All text meets 4.5:1 contrast ratio against background.
- **Status indicators: not color-only.** Status badges include text labels, not just color.

### ARIA Labels
- **Icon-only buttons: aria-label required.** Hamburger menu, close buttons, notification bell.
- **Modal dialogs: role="dialog" and aria-labelledby.**
- **Form inputs: associated labels via htmlFor.**

## Notes

This design system is extracted from the existing codebase (React 19 + Tailwind CSS 3.4). It documents current patterns, not aspirational redesigns. The goal is to maintain consistency as new features are added, not to overhaul the existing interface.

The color system uses OKLCH for perceptual uniformity, but Tailwind's default palette is used for implementation (e.g., `bg-slate-50`, `text-sky-700`). OKLCH values are provided for reference and future refinement.

The system prioritizes operational clarity over aesthetic trends. If a design choice conflicts with rapid information scanning or shift-based workflows, operational needs take precedence.
