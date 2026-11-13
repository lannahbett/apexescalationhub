<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
- Board data remains in a client-side store (src/components/hub/store.tsx) persisted to localStorage, seeded from src/lib/shortages.ts; Cloud is connected but board sync is deferred, so keep business rules (risk tiers, KPIs, filters) in shortages.ts where tests cover them.

- Maintain 44px minimum primary control targets and bounded horizontal board scrolling; shared primitives enforce usable phone targets without changing business rules.
- Use a native select for workflow stages and a separate Button for Kanban details; this avoids nested controls and hidden-but-focusable content from the previous popup.
- AI calls go through server functions in src/lib/ai.functions.ts using the GROQ_API_KEY secret; model output that changes board data must pass sanitizeExtraction (src/lib/ai-parse.ts) and explicit planner confirmation, so the AI never edits parts on its own.
- Commercial calculations and legacy order defaults belong in shortages.ts; commercial mode persists separately from the board, and commercial-orders.tsx edits every occurrence of a sales order together to prevent inconsistent terms and duplicate KPI exposure.

- Role perspectives are presentation lenses, not authorization roles; persist their selection separately and keep the shared board unchanged.
- Apply sales-order changes atomically across all pegging occurrences; cancellations remove commercial exposure only, because inventory allocation and ERP write-back are not modeled.
- Expedite scenarios retain other part blockers, deduplicate order penalties and label downtime as a user assumption; scenarios never book freight or alter the board.
- Parse CSV/XLSX in client-safe data-exchange.ts with lazy ExcelJS loading; validate all rows before a confirmed atomic store import, matching part/PO/line and propagating sales-order terms across pegging links to avoid partial imports or inconsistent exposure.
- Dashboard preferences are validated and stored separately per perspective; widgets use shortages.ts analysis and focus the shared board without mutating it.
- Guided practice owns isolated fictional fixtures and reuses order, extraction and freight validation; never write practice state to the hub store or send practice messages.
- The left navigation (app-sidebar.tsx) jumps to sections on the single board page; add real routes only when a section needs its own URL, so the shared board state stays in one place.
- Visual analytics reads dashboardAnalysis in shortages.ts and uses the whole board for read-only expedite comparisons; filtered charts must not hide other order blockers or invent historical trends.
- The business vision is the landing page at / and the workspace lives at /demo; /vision redirects to / so earlier shared links keep working. Legal pages (/terms, /privacy) share src/components/legal-page.tsx.
- Outbound shipping readiness (requiredShippingDocs/shippingReadiness in shortages.ts) derives required documents from freight mode and destination flags and is saved per sales order via updateOrder, so every pegging occurrence stays consistent.
- SAP ECC import support is header aliases plus DD.MM.YYYY and unambiguous decimal-comma parsing in data-exchange.ts; ambiguous values like "1,200" stay rejected to avoid silent quantity errors.
