import { t, type strings } from './i18n'
import type { Lang, Recharge, Settings, Vehicle } from './types'

export const sortedRecharges = (v: Vehicle): Recharge[] =>
  [...(v.recharges ?? [])].sort(
    (a, b) => a.odo - b.odo || a.date.localeCompare(b.date),
  )

export interface Interval {
  from: Recharge
  to: Recharge
  distance: number
  consumed: number
  cost: number
}

// Compute intervals between consecutive recharges.
// ponytail: consumption is always the raw metered amount. Same-target charges
// are exact under the same-level assumption; mixed targets are a rough proxy.
// Battery levels are display-only and never enter the math. No capacity
// inference, ever.
export const computeIntervals = (v: Vehicle): Interval[] => {
  const recs = sortedRecharges(v)
  const out: Interval[] = []
  for (let i = 1; i < recs.length; i++) {
    const prev = recs[i - 1]
    const cur = recs[i]
    out.push({
      from: prev,
      to: cur,
      distance: cur.odo - prev.odo,
      consumed: Math.max(0, cur.amount),
      cost: cur.amount * (cur.pricePerUnit || 0),
    })
  }
  return out
}

// Effective 100% capacity in the vehicle's own amount unit. Display and
// estimator only — never used to fill a recharge amount.
export const effectiveCapacity = (v: Vehicle): number | null => {
  const cap =
    v.type === 'electric' && v.batteryDegradation
      ? v.capacity * (v.batteryDegradation / 100)
      : v.capacity
  return cap > 0 && isFinite(cap) ? cap : null
}

// Energy needed to go from fromPct to toPct, or null without usable capacity.
export const kwhForLevels = (v: Vehicle, fromPct: number, toPct: number): number | null => {
  const cap = effectiveCapacity(v)
  if (cap == null || !isFinite(fromPct) || !isFinite(toPct)) return null
  return (cap * (toPct - fromPct)) / 100
}

// Level gain for a given energy amount, or null without usable capacity.
export const levelsForKwh = (v: Vehicle, kwh: number): number | null => {
  const cap = effectiveCapacity(v)
  if (cap == null || !isFinite(kwh)) return null
  return (kwh / cap) * 100
}

export interface Stats {
  lastOdo: number | null
  count: number
  avg: number | null
  min: number | null
  max: number | null
  avgCost: number | null
  minCost: number | null
  maxCost: number | null
  totalSpent: number
  consUnit: string
}

const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length

// Round to 2 decimals for display
const round2 = (n: number) => Math.round(n * 100) / 100

export const stats = (v: Vehicle, settings: Settings): Stats => {
  const intervals = computeIntervals(v).filter((i) => i.distance > 0 && i.consumed > 0)
  const totalSpent = (v.recharges ?? []).reduce(
    (s, r) => s + (r.amount || 0) * (r.pricePerUnit || 0),
    0,
  )
  const lastOdo = sortedRecharges(v).slice(-1)[0]?.odo ?? null
  const L = settings.language
  if (intervals.length === 0) {
    return {
      lastOdo,
      count: v.recharges?.length ?? 0,
      avg: null, min: null, max: null,
      avgCost: null, minCost: null, maxCost: null,
      totalSpent,
      consUnit: '',
    }
  }
  const consUnit =
    v.type === 'electric'
      ? t(L, 'kwh_per_100km')
      : settings.volumeUnit === 'gal'
        ? t(L, 'gal_per_100km')
        : t(L, 'l_per_100km')
  // ponytail: amount is entered in the configured unit, so no conversion needed.
  const cons = intervals.map((i) => round2((i.consumed / i.distance) * 100))
  const costPerKm = intervals.map((i) => round2(i.cost / i.distance))
  return {
    lastOdo,
    count: v.recharges?.length ?? 0,
    avg: round2(avg(cons)),
    min: round2(Math.min(...cons)),
    max: round2(Math.max(...cons)),
    avgCost: round2(avg(costPerKm)),
    minCost: round2(Math.min(...costPerKm)),
    maxCost: round2(Math.max(...costPerKm)),
    totalSpent,
    consUnit,
  }
}

export const fmtNum = (n: number | null, d = 2): string =>
  n == null || !isFinite(n) ? '—' : n.toFixed(d)

export const fmtMoney = (n: number | null, currency: string): string => {
  if (n == null || !isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

export type StringDict = typeof strings.en
export type { Lang }
