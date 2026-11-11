# Apex Escalation Hub

A daily parts shortage and escalation board for material planners and production leads. Front-end only with realistic sample data held in the browser (changes persist via local storage); no login or backend needed for this first version.

## Look and feel
- High-density enterprise UI: dark slate header/accents, light content surface, subtle borders, compact rows, Lucide icons.
- Typography: IBM Plex Sans + IBM Plex Mono (part numbers, figures).
- Risk colours: Critical (red), Elevated (amber), Monitored (slate/green). Confidence: High (green), At Risk (amber), Stalled (red).
- Works on desktop first; on phone the table scrolls horizontally and KPIs stack 2x2.

## Page layout (single board at /)
1. Top bar: app name, date, "Import ERP Report" button, current user "Sarah M.".
2. KPI bar (4 cards, computed live from data): Blocked Value at Risk (€), Active Shortages, Assembly Lines at Risk (<48h), Stalled / Low-Confidence.
3. Board toolbar: search (part number, planner, description/category), filter chips (All, Line Down / Critical, Stalled Confidence, My Parts (Sarah M.), Due < 48h), Table / Kanban toggle.
4. Table view: Risk Score pill, Part Details, Line Impact + target build date, Financial Risk, Shortage Metrics (qty pending, days late / days to line stop), Planner avatar, Confidence pill, Workflow Stage badge. Sortable by risk and value.
5. Kanban view: 5 stage columns with drag-and-drop plus a stage dropdown on each card; card shows part number, value at risk, days late, confidence pill.
6. Part detail slide-over (row/card click):
   - Header with key metrics and stage selector.
   - Audit timeline (date changes, supplier contacts, notes); new actions append entries.
   - Draft Supplier Escalation: dialog with pre-filled formal expedite email (PO, supplier, specs, qty, deadline), editable, copy-to-clipboard and open-in-mail.
   - Update Fix Confidence: High / At Risk / Stalled with a required note (logged to timeline).
   - Mitigation checklist (alternate plant inventory, emergency courier quote, substitute part test, etc.), toggles logged.
7. Import ERP Report modal: drag/drop CSV area (mock parse preview of rows), "Download CSV template" button generating a sample file.

## Sample data
14 fictional parts (servo motors, PLC modules, encoders, harnesses, FPGAs, sensors, bearings…) across Lines A–E, 5 planners (incl. Sarah M.), spread across risk tiers, confidence states and all 5 stages, with POs, suppliers and timeline history.

## Technical details
- TanStack route `src/routes/index.tsx` with proper head metadata; root meta updated.
- `src/lib/shortages.ts` (types, seed data, risk tier/KPI helpers) + a small zustand-like React context store with localStorage.
- Components under `src/components/hub/` (KpiBar, Toolbar, ShortageTable, KanbanBoard using @dnd-kit, PartSheet, EscalationDialog, ConfidenceDialog, ImportDialog); shadcn ui primitives added as needed; sonner toasts.
- Design tokens (slate palette, risk/confidence colours) in `src/styles.css`.
- Unit tests for risk tier thresholds (80+/50–79/<50) and KPI calculations.
