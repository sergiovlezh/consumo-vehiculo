import { galToL } from './storage'
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

// Get effective capacity considering battery degradation for electric vehicles
const getEffectiveCapacity = (v: Vehicle): number => {
  if (v.type !== 'electric' || !v.batteryDegradation) return v.capacity
  return v.capacity * (v.batteryDegradation / 100)
}

// Amount required to fill from `currentLevel` to 100% given effective capacity.
// Returns null if capacity is missing.
export const amountToFull = (v: Vehicle, currentLevel: number): number | null => {
  const cap = getEffectiveCapacity(v)
  if (!cap || cap <= 0) return null
  if (currentLevel >= 100) return 0
  if (currentLevel < 0) return cap
  return (cap * (100 - currentLevel)) / 100
}

// Compute intervals between consecutive recharges.
// ponytail: full->full (no manual correction) is underspecified by the data; we
// fall back to `consumed = cur.amount` as a rough proxy. Manual correction with
// a known full-tank capacity produces exact results.
export const computeIntervals = (v: Vehicle): Interval[] => {
  const recs = sortedRecharges(v)
  const out: Interval[] = []
  for (let i = 1; i < recs.length; i++) {
    const prev = recs[i - 1]
    const cur = recs[i]
    const distance = cur.odo - prev.odo
    let consumed: number = cur.amount
    if (cur.manualStart && cur.fullTankAmount) {
      const used = ((prev.endLevel ?? 0) - (cur.endLevel ?? 0)) / 100 * cur.fullTankAmount
      consumed = Math.max(0, used)
    } else if (prev.endLevel != null && cur.endLevel != null) {
      const gap = 100 - cur.endLevel
      if (gap > 0) {
        consumed = (cur.amount * (prev.endLevel - cur.endLevel)) / gap
      }
    }
    out.push({
      from: prev,
      to: cur,
      distance,
      consumed: Math.max(0, consumed),
      cost: cur.amount * (cur.pricePerUnit || 0),
    })
  }
  return out
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
  const isElectric = v.type === 'electric'
  const consUnit = isElectric
    ? t(L, 'kwh_per_100km')
    : settings.volumeUnit === 'gal'
      ? t(L, 'gal_per_100km')
      : t(L, 'l_per_100km')
  const cons = intervals.map((i) =>
    isElectric ? round2((i.consumed / i.distance) * 100) : round2((toStandardConsumed(i.to, settings) / i.distance) * 100),
  )
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

const toStandardConsumed = (rec: Recharge, settings: Settings): number => {
  if (settings.volumeUnit === 'gal') return galToL(rec.amount)
  return rec.amount
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
