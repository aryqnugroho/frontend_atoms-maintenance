---
inclusion: auto
name: ui-design
description: Use this guidance when improving UI consistency, visual hierarchy, responsive design, navigation, dashboard layout, typography, spacing, icons, and frontend polish.
---

# UI Design Steering for atoms-maintenance

When working on UI improvements, use the Impeccable skill as the design review and polishing reference.

Always follow:
- AGENTS.md
- CLAUDE.md
- existing project architecture
- existing frontend styling conventions

Use Impeccable mainly for:
- UI audit
- visual hierarchy review
- responsive design review
- typography consistency
- spacing consistency
- icon consistency
- dashboard polish
- navigation polish
- empty/loading/error state polish

Do not:
- replace the whole UI framework
- add a new UI library without approval
- rewrite the frontend from scratch
- introduce unrelated features
- break existing routes
- ignore lint/build validation

For UI implementation:
1. Audit first.
2. Propose small improvements.
3. Implement incrementally.
4. Validate responsiveness.
5. Run lint/build if available.