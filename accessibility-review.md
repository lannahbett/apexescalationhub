# Phase 1 accessibility review — 11 November 2026

## Measured results

Chromium/Playwright checks used axe-core 4.10.3 (WCAG 2 A/AA, 2.1 AA and 2.2 AA tags), DOM target dimensions, and WCAG relative-luminance calculations from rendered sRGB colours. Ratios below are rounded for reporting, not for pass/fail comparisons. Normal text requires 4.5:1; essential non-text UI requires 3:1.

| Text or UI pair | Measured ratio | Result |
| --- | ---: | --- |
| Monitored risk text / badge | 5.19:1 (previously 4.16:1) | Pass |
| Critical risk text / filled badge | 5.77:1 | Pass |
| Stalled text / soft badge | 5.13:1 | Pass |
| Elevated / At Risk text / soft badge | 5.03:1 | Pass |
| High Confidence text / soft badge | 5.38:1 | Pass |
| Info text / soft background | 5.07:1 | Pass |
| Secondary text / page background | 6.32:1 | Pass |
| Main text / page background | 16.55:1 | Pass |
| Button text / primary background | 13.86:1 | Pass |
| Input outlines / page and card backgrounds | 4.54–4.88:1 | Pass |
| Focus indicator / page, card and selected backgrounds | 5.29–6.48:1 | Pass |

Lowest directly sampled active visible text ratio across the checked screens: 5.03:1. Placeholder colours use the same secondary text token. Disabled controls are exempt and excluded from the pass claim. Decorative borders and icons are not essential UI boundaries.

## Layout and touch checks

- Table at 1280×1800, 768×1024, 394×690 and 320×740 CSS pixels; Compact, Kanban, stage selection, part sheet, confidence dialog, email draft, import dialog and CSV preview additionally checked at 394×690 and 320×568.
- No document-level horizontal overflow in checked states. Wide tables and Kanban columns retain intentional, contained horizontal scrolling; they are not converted into narrow tables that lose information.
- Measured visible application controls are at least 44×44 CSS pixels, including filters, sorting, density/view controls, reset, close, checklist checkboxes and stage selectors. Native select popup choices are browser/OS-managed, not application-sized targets. The visually hidden skip link is excluded from the off-focus target measurement.
- Dialogs stay within viewport width and scroll vertically where necessary. Screenshots inspected for narrow-screen clipping and overlap.
- Final axe scans reported zero violations in the checked states. Incomplete checks remain for obscured background content and Radix focus guards; these are not counted as passes. Background text was measured separately when unobscured.
- Keyboard opening of a table part, skip-link focus transfer, confidence save/readback, stage selection, email draft opening and CSV preview upload exercised. No JavaScript page errors observed. Existing business-rule and navigation tests: 5 passing.

## Fixes

- Darkened Monitored text, essential field outlines and focus indicators.
- Enlarged controls and checklist targets; wrapped phone toolbars and stacked narrow-dialog actions.
- Added missing accessible names for note/email fields; corrected risk badge semantics.
- Separated Kanban details buttons from stage controls to remove nested interactive elements.
- Replaced the stage popup with a native select after the popup produced an aria-hidden-focus failure; native controls provide browser-managed keyboard and mobile selection.
- Made file selection keyboard reachable and constrained modal dimensions.

## Manual screen-reader testing still required

No NVDA, JAWS, VoiceOver or TalkBack session was performed. Verify table headers and row announcements, risk badge wording, native stage selection, stage-change live announcements, checklist state announcements, modal focus isolation/return (including nested dialogs), required confidence note announcements, and CSV file-picker feedback with actual assistive technology. Native mobile pickers also need physical-device checks.

These results are a scoped accessibility review, not a claim that the whole app is certified WCAG AA conformant. Drag interaction, every hover state, OS-native popup rendering, and all possible imported content are not exhaustively covered.