# Vehicle Consumption

Frontend-only MVP for tracking vehicle fuel/electricity consumption. React + TypeScript + Vite + Tailwind v4.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build -> dist/
npm run lint
```

For mobile testing on the same network, Vite is already configured with `host: true` — open the LAN URL on your phone.

## Features

- Multiple vehicles: fuel / electric / hybrid
- Recharges with date, odometer, end level (battery % or tank %), amount, price, notes
- "Full charge" checkbox auto-fills 100% (typical for gas); battery % is the primary input for EVs
- Advanced: manual start correction (when a recharge was missed) with full-tank capacity
- Dashboard per vehicle: last odometer, avg/min/max consumption, avg/min/max cost/km, total spent
- Settings: EN/ES, currency, L vs gal
- Export/Import as JSON (vehicles + recharges; settings are not part of the export)
- LocalStorage persistence (single JSON key `vc.db.v1`; settings at `vc.settings.v1`)

## Structure

```
src/
  types.ts        - domain types (Vehicle, Recharge, DB, Settings, Route)
  i18n.ts         - EN/ES strings + t()
  storage.ts      - localStorage adapters, unit conversions
  domain.ts       - pure compute (intervals, stats, formatters)
  components/
    ui.tsx          - shared UI primitives (Header, Fab, Stat, Field, Segmented, Button)
    VehicleList.tsx
    VehicleForm.tsx
    VehicleDetail.tsx
    RechargeForm.tsx
    SettingsView.tsx
  App.tsx         - router (one file, 5 routes)
  main.tsx        - bootstrap
```

## Consumption math

Between two consecutive recharges A and B, the consumed amount is estimated as:

- **Manual correction** (user provides full-tank capacity):  
  `(A.endLevel - B.endLevel) / 100 * fullTankAmount`, clamped at 0.
- **Auto from end levels** (no manual correction, A.endLevel and B.endLevel set):  
  `B.amount * (A.endLevel - B.endLevel) / (100 - B.endLevel)`.
- **Fallback** (e.g. full→full, where the levels alone don't pin down consumption):  
  `B.amount` (rough proxy).

→ skipped: per-record display (drill-down), service worker (true offline PWA), editing/deleting individual recharges. Add when needed.

## Upgrade path

- Storage: switch to IndexedDB if data approaches ~5 MB or 10k+ recharges
- Routing: lift routes to React Router if more than ~5 screens are added
- Build: already Vite — no further tooling needed for growth
