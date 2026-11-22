# Apexescalationhub

Create a B2B operations web app called "Apex Escalation Hub" — a daily parts shortage and escalation board designed for manufacturing material planners and production leads during morning standups.



Use a modern, high-density enterprise UI (dark slate accents, clean typography, badge indicators, subtle borders, Lucide icons).



1. Executive KPI Summary Bar (Top):

- Blocked Value at Risk (e.g., €1,840,000)

- Active Shortages Count (e.g., 24 parts)

- Assembly Lines at Risk (e.g., 3 lines impacted inside 48h)

- Stalled / Low-Confidence Cases (e.g., 5 parts)



2. Shortage Board (Main Area with Table & Kanban toggle):

- Search by part number, planner, or component.

- Quick filter chips: "All", "Line Down / Critical", "Stalled Confidence", "My Parts (Sarah M.)", "Due < 48h".

- Structured columns:

  * Risk Score: 1–100 urgency pill (Critical 80+, Elevated 50–79, Monitored <50).

  * Part Details: Part number (e.g., PN-8402-HX), description (e.g., Brushless Servo Motor 48V), category.

  * Line Impact: Impacted assembly line (e.g., Line A - Robotics) & target build date.

  * Financial Risk: Value of blocked production run (€).

  * Shortage Metrics: Qty pending, days late (or days until line stop).

  * Planner: Name & avatar badge.

  * Fix-Confidence Indicator: 

    - 🟢 High Confidence (tracking active / stock confirmed)

    - 🟡 At Risk (supplier promised date, transit unconfirmed)

    - 🔴 Stalled / Critical (no ETA / engineering hold)

  * Workflow Stage:

    1. Shortage Detected

    2. Sourcing Alternative

    3. Expedited / In-Transit

    4. Customs Hold

    5. Cleared & Delivered



3. Kanban View:

- Cards grouped across the 5 workflow stages above, drag-and-drop or stage dropdown to move parts.

- Card preview shows Part Number, Value at Risk, Days Late, and Confidence pill.



4. Part Detail Slide-Over (Opens on row/card click):

- Detailed audit timeline: Log of date changes, supplier contacts, and notes.

- Quick Actions:

  * "Draft Supplier Escalation": Generates a formal expedite email with PO, part specs, and delivery deadline pre-filled.

  * "Update Fix Confidence": Toggle between High, At Risk, and Stalled with a required note.

  * Mitigation checklist (e.g., check alternate plant inventory, quote emergency courier, test substitute part).



5. Sample Data & Actions:

- Pre-populate with 12–15 realistic fictional parts (industrial automation / precision electronics theme) with varying risk tiers, planners, and confidence states.

- Include an "Import ERP Report" moc

k modal with a sample CSV download template.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://apexescalationhub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c426cb6-1f9f-4a19-9c06-23383e3a9bbf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
