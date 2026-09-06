// ponytail: the one runnable check for the consumption math. Run with `npm run check`.
import { computeIntervals, catalogLabel, effectiveCapacity, kmPerPercent, kwhForLevels, levelsForKwh, seedConnectors, seedFuelGrades, stationsForVehicle, stats, visibleOrSelected } from './domain'
import type { Settings, Station, Vehicle } from './types'

// ponytail: local assert keeps node types out of the app tsconfig.
const assert = {
  equal: (a: unknown, b: unknown) => {
    if (a !== b) throw new Error(`assert.equal failed: ${String(a)} !== ${String(b)}`)
  },
}

// ponytail: block bodies, not `=> ({...})` — tsc 6.0 misparses a later bare
// block after a parenthesized arrow-object return.
const settings = (volumeUnit: Settings['volumeUnit'] = 'L'): Settings => {
  return {
    language: 'en',
    currency: 'USD',
    distanceUnit: 'km',
    volumeUnit,
    energyUnit: 'kWh',
    fuelGrades: seedFuelGrades('en'),
    connectors: seedConnectors(),
  }
}

const ev = (recharges: Vehicle['recharges'], capacity = 60): Vehicle => {
  return {
    id: 'v1',
    name: 'EV',
    type: 'electric',
    capacity,
    recharges,
  }
}

// 1. Same-target partial charges (the 80->80 commuter): consumed must equal amount.
{
  const v = ev([
    { id: 'a', date: '2026-01-01', odo: 100, amount: 15, pricePerUnit: 0.2, endLevel: 80, fullCharge: false },
    { id: 'b', date: '2026-01-05', odo: 300, amount: 20, pricePerUnit: 0.2, endLevel: 80, fullCharge: false },
  ])
  const [iv] = computeIntervals(v)
  assert.equal(iv.distance, 200)
  assert.equal(iv.consumed, 20)
  assert.equal(stats(v, settings()).avg, 10)
  assert.equal(kmPerPercent(v, settings()), 6)
}

// 2. Legacy manual-correction fields are ignored, not honored.
{
  const v = ev([
    { id: 'a', date: '2026-01-01', odo: 100, amount: 15, pricePerUnit: 0, endLevel: 80, fullCharge: false },
    {
      id: 'b', date: '2026-01-05', odo: 300, amount: 20, pricePerUnit: 0, endLevel: 80,
      fullCharge: false, manualStart: true, startOdo: 250, startLevel: 30, fullTankAmount: 60,
    } as Vehicle['recharges'][number],
  ])
  const [iv] = computeIntervals(v)
  assert.equal(iv.distance, 200) // startOdo ignored, last odo is the base
  assert.equal(iv.consumed, 20) // level math ignored, raw amount wins
}

// 3. Gallons are labeled gallons (no silent liter conversion).
{
  const v: Vehicle = {
    id: 'v2', name: 'Truck', type: 'fuel', capacity: 100,
    recharges: [
      { id: 'a', date: '2026-01-01', odo: 0, amount: 10, pricePerUnit: 3, endLevel: 100, fullCharge: true },
      { id: 'b', date: '2026-01-05', odo: 200, amount: 10, pricePerUnit: 3, endLevel: 100, fullCharge: true },
    ],
  }
  const s = stats(v, settings('gal'))
  assert.equal(s.avg, 5)
  assert.equal(s.consUnit, 'gal/100km')
}

// 4. Legacy hybrid vehicles still compute (fuel path).
{
  const v: Vehicle = {
    id: 'v3', name: 'Old hybrid', type: 'hybrid', capacity: 40,
    recharges: [
      { id: 'a', date: '2026-01-01', odo: 0, amount: 4, pricePerUnit: 1, endLevel: 100, fullCharge: true },
      { id: 'b', date: '2026-01-05', odo: 100, amount: 4, pricePerUnit: 1, endLevel: 100, fullCharge: true },
    ],
  }
  assert.equal(stats(v, settings()).avg, 4)
}

// 5. Estimator honors degradation; single record yields no average.
{
  const v = ev([], 60)
  v.batteryDegradation = 95
  assert.equal(effectiveCapacity(v), 57)
  assert.equal(kwhForLevels(v, 30, 80), 28.5)
  assert.equal(levelsForKwh(v, 28.5), 50)
  assert.equal(effectiveCapacity(ev([], 0)), null)
  const single = ev([
    { id: 'a', date: '2026-01-01', odo: 100, amount: 15, pricePerUnit: 0.2, endLevel: 80, fullCharge: false },
  ])
  assert.equal(stats(single, settings()).avg, null)
  assert.equal(kmPerPercent(single, settings()), null)
}

// 6. Catalog seeds are stable and language-aware.
{
  const es = seedFuelGrades('es')
  assert.equal(es.length, 3)
  assert.equal(es[0].id, 'regular')
  assert.equal(es[0].label, 'Corriente')
  assert.equal(es[2].label, 'Extra')
  const en = seedFuelGrades('en')
  assert.equal(en[0].label, 'Regular')
  assert.equal(en[0].id, es[0].id) // ids survive language switches
  assert.equal(seedConnectors().length, 7)
}

// 7. Hidden catalog items resolve; deleted ones yield null; pickers keep selected-hidden.
{
  const items = [...seedFuelGrades('en'), { id: 'x', label: 'X', hidden: true }]
  assert.equal(catalogLabel(items, 'x'), 'X')
  assert.equal(catalogLabel(items, 'gone'), null)
  assert.equal(catalogLabel(items, ''), null)
  const opts = visibleOrSelected(items, ['x'])
  assert.equal(opts.some((i) => i.id === 'x'), true)
  assert.equal(visibleOrSelected(items, []).some((i) => i.id === 'x'), false)
}

// 8. Station picker filters by vehicle kind.
{
  const stations: Station[] = [
    { id: 'e', name: 'E', kind: 'electric', state: 'open' },
    { id: 'f', name: 'F', kind: 'fuel', state: 'open' },
    { id: 'b', name: 'B', kind: 'both', state: 'open' },
  ]
  assert.equal(stationsForVehicle(stations, 'electric').length, 2)
  assert.equal(stationsForVehicle(stations, 'fuel').length, 2)
  assert.equal(stationsForVehicle(stations, 'hybrid').length, 2)
  assert.equal(stationsForVehicle(stations, 'electric').some((s) => s.id === 'f'), false)
}

console.log('domain.selfcheck: ok')
