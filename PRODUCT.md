# PRODUCT.md — ATOMS-Maintenance

## Register

**product**

## Users

### Primary Users
**Shift-based operational technicians** at AirNav Indonesia Surabaya who perform daily equipment maintenance checks, inspections, and troubleshooting across three shifts (pagi 07:00-13:00, siang 13:00-19:00, malam 19:00-07:00). These are hands-on technical staff working in office environments and occasionally on-site at airport facilities.

**Supervisors and managers** who oversee maintenance operations, approve work orders, review inspection reports, and monitor equipment status across CNSD (Communications, Navigation, Surveillance & Data) and TFP (Teknik Fasilitas Penunjang / Supporting Technical Facilities) divisions.

### User Characteristics
- Work in structured shift rotations with clear handover protocols
- Need to quickly scan equipment status and pending tasks at shift start
- Perform repetitive inspection workflows using standardized forms
- Document findings with signatures, timestamps, and measurement data
- Respond to equipment failures and create work orders under time pressure
- Access the system from desktop workstations in control rooms and occasionally tablets during field inspections
- Expect the interface to be fast, reliable, and require minimal training

## Product Purpose

ATOMS-Maintenance is an internal operational tool for managing airport technical equipment maintenance workflows at AirNav Indonesia. It replaces paper-based inspection forms, manual work order tracking, and fragmented reporting systems with a unified digital platform.

The system serves as the single source of truth for:
- Daily equipment readiness checks (CNSD EQ-1 forms, TFP AOB Ground performance checks)
- Work order lifecycle management (creation, assignment, execution, feedback, closure)
- Ground check measurements (runway/taxiway localizer inspections)
- Grounding system inspections (visual checks, resistance measurements per PUIL 2011/SNI/IEC standards)
- Maintenance reporting and monthly logbook archival
- Shift personnel tracking and task assignment

The product exists to reduce documentation errors, improve handover clarity between shifts, enable real-time equipment status visibility, and maintain regulatory compliance records.

## Brand

### Organization Identity
AirNav Indonesia is a state-owned enterprise responsible for air navigation services across Indonesia. The Surabaya branch manages critical airport infrastructure supporting one of the country's busiest airports. The organization values precision, safety, regulatory compliance, and operational reliability.

### Tone
**Operational and professional.** The interface should feel like a trusted tool built by people who understand shift work, not a generic SaaS product. Language is direct, technical when needed, and uses Indonesian terminology familiar to aviation maintenance staff.

**Calm under pressure.** Equipment failures and urgent work orders are routine. The UI should present critical information clearly without alarm fatigue. Status indicators are informative, not dramatic.

**Respectful of expertise.** Users are skilled technicians and engineers. The interface should not over-explain or patronize. Forms should match the structure of physical inspection documents they already know.

### Visual Character
Clean, structured, and information-dense without feeling cluttered. The aesthetic is closer to industrial control systems than consumer apps. Think airport operations centers: functional layouts, clear hierarchies, consistent color coding for divisions and status types.

Not playful, not trendy, not minimalist to the point of hiding information. Every element serves operational clarity.

## Anti-References

### What This Is Not
**Not a generic SaaS dashboard.** Avoid the cream-colored, rounded-everything, pastel-gradient aesthetic common in B2B tools. This is not a productivity app for knowledge workers. It's an operational system for technical staff.

**Not a mobile-first consumer app.** While responsive design is required, the primary context is desktop workstations in control rooms. Don't sacrifice information density or multi-column layouts for mobile simplicity.

**Not a project management tool.** Work orders are maintenance tasks, not agile sprints. Avoid kanban boards, burndown charts, or productivity gamification.

**Not a data visualization showcase.** Charts and graphs should be functional, not decorative. No animated donut charts or gradient-filled area graphs unless they serve a clear operational purpose.

### Specific Patterns to Avoid
- Pastel color palettes with low contrast
- Excessive white space that forces scrolling for critical information
- Modal dialogs for every action (prefer inline editing and progressive disclosure)
- Generic iconography (prefer domain-specific symbols when available)
- Overly casual microcopy ("Oops!", "Yay!", emoji in error messages)
- Skeleton loaders that take longer to render than the actual content
- Infinite scroll for operational data (prefer pagination with clear counts)

## Strategic Principles

### 1. Shift-First Design
Every screen should answer: "What do I need to do this shift?" The dashboard prioritizes pending checklists, active work orders, and trouble equipment over historical data or analytics. Shift handover clarity is more important than long-term trend visualization.

### 2. Form Fidelity
Digital inspection forms should mirror the structure and terminology of existing paper forms. Technicians should recognize the EQ-1 checklist, AOB Ground performance sheet, and grounding inspection table immediately. Don't "improve" the form structure without operational validation.

### 3. Division-Aware Color Coding
CNSD and TFP are distinct operational divisions with different equipment categories and workflows. Use consistent color coding (sky blue for CNSD, emerald green for TFP) throughout the interface to reduce cognitive load when scanning mixed-division data.

### 4. Status Over Aesthetics
Equipment status (normal/abnormal/warning), work order status (open/in-progress/completed/closed), and shift status (active/upcoming/past) must be instantly scannable. Prioritize clarity over visual harmony when status indicators conflict with the color palette.

### 5. Offline-Aware (Future)
While not currently implemented, the system should be designed with the assumption that field inspections may occur in areas with poor connectivity. Avoid patterns that assume always-on real-time data (e.g., live-updating counters, websocket-dependent UI states).

### 6. Regulatory Compliance by Default
Inspection forms must capture all fields required by Indonesian aviation regulations (PUIL 2011, SNI, IEC 62305, IEEE Std 142 for grounding systems). Missing required fields or incomplete signatures should block form submission, not warn after the fact.

### 7. Audit Trail Transparency
Every work order, inspection, and report should clearly show who created it, who modified it, and when. Timestamps, shift context, and personnel signatures are not optional metadata; they are core to the operational record.

## Open Questions

### Scope Clarification
- Should the system handle attendance tracking, or is that managed separately?
- Are maintenance reports subject to multi-level approval workflows, or is supervisor sign-off sufficient?
- Does the ground check module cover all runway/taxiway inspection types, or only localizer measurements?
- Should the system integrate with existing AirNav enterprise systems (HR, asset management, procurement)?

### User Roles and Permissions
- Are the current six roles (Admin, Manager Teknik, Supervisor CNSD, Supervisor TFP, Teknisi CNSD, Teknisi TFP) sufficient, or are additional roles needed (e.g., external auditors, contractor technicians)?
- Should role permissions be configurable per-user, or are they fixed by role type?

### Data Retention and Compliance
- What is the required retention period for maintenance records (work orders, inspection forms, reports)?
- Are there regulatory requirements for data export formats (PDF, CSV, specific report templates)?
- Should the system support archival/read-only modes for historical data?

### Backend and Infrastructure
- What authentication method will be used (local accounts, LDAP/Active Directory, SSO)?
- Will the system be deployed on-premise or cloud-hosted?
- What file storage solution will be used for uploaded documents, photos, and signatures?

## Notes

This product context is based on the current frontend implementation (React 19 + TypeScript + Tailwind CSS) and project documentation (CLAUDE.md, AGENTS.md). The backend does not yet exist; all data is currently mock data.

The design system should be extracted from existing components and patterns in the codebase, not invented from scratch. The goal is to document and refine what already works, not to redesign the entire interface.
