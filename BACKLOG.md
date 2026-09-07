# Backlog

Deferred features, in no particular order. Each gets planned before building.

- **Per-vehicle CSV export** — export recharges, expenses (and journal?) for one
  vehicle as CSV for Excel. Needs delimiter/locale decision (`,` vs `;`,
  decimal separator) and a column spec per record type.
- **PHEV/REEV split** — separate plug-in hybrids with per-tank tracking
  ("which tank are you filling") instead of the single `hybrid` type.
- **Station compatibility enforcement** — constrain record fuel grade /
  connector to what the chosen station offers (currently display-only).
- **Station quick-add mid-form** — create a station from the recharge form
  without losing form state.
- **Recurring tasks/reminders** — repeat rules for maintenance and documents.
- **Expense breakdowns** — per-kind totals/charts in the expenses tab.
- **Photo attachments** — for records, expenses, tasks.
- **Address autocomplete / reverse-geocode** — needs an API key (Google) or
  Nominatim; GPS coords already stored without any key.
- **Share-sheet export** — `navigator.share` integration alongside copy/download.
- **Installable PWA packaging** — manifest + service worker; works in mobile
  browsers as-is today.
