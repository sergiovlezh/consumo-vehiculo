import { useState } from 'react'
import { t } from '../i18n'
import { effectiveCapacity, fmtMoney, fmtNum, kmPerPercent } from '../domain'
import type { Settings, Vehicle } from '../types'
import { Field } from './ui'

const num = (s: string): number | null => {
  if (s === '') return null
  const n = parseFloat(s)
  return isFinite(n) ? n : null
}

const r2 = (n: number) => String(Math.round(n * 100) / 100)

// ponytail: station asks kWh or money, car shows only %. The field being typed
// wins; the others recompute (target <-> amount <-> total). Never overwrites
// the active field, so mid-typing states stay sane.
export const ChargeCalculator = ({
  vehicles,
  settings,
  favoriteId,
}: {
  vehicles: Vehicle[]
  settings: Settings
  favoriteId: string | null
}) => {
  const electrics = vehicles.filter((v) => v.type === 'electric' && (v.capacity ?? 0) > 0)
  const [sel, setSel] = useState<string | null>(null)
  const [unit, setUnit] = useState('')
  const [cur, setCur] = useState('')
  const [tgt, setTgt] = useState('')
  const [amt, setAmt] = useState('')
  const [tot, setTot] = useState('')
  if (electrics.length === 0) return null

  const L = settings.language
  const vehicle =
    electrics.find((v) => v.id === sel) ??
    electrics.find((v) => v.id === favoriteId) ??
    electrics[0]
  const cap = effectiveCapacity(vehicle)
  if (cap == null) return null

  const kwhFromPct = (c: number, t: number) => ((t - c) / 100) * cap
  const tgtFromKwh = (c: number, k: number) => c + (k / cap) * 100

  const onUnit = (v: string) => {
    setUnit(v)
    const u = num(v)
    const a = num(amt)
    if (u != null && a != null) setTot(r2(a * u))
  }
  const onCur = (v: string) => {
    setCur(v)
    const c = num(v)
    const t = num(tgt)
    if (c == null || t == null || t <= c) return
    const k = kwhFromPct(c, t)
    setAmt(r2(k))
    const u = num(unit)
    if (u != null) setTot(r2(k * u))
  }
  const onTgt = (v: string) => {
    setTgt(v)
    const c = num(cur)
    const t = num(v)
    if (c == null || t == null || t <= c) return
    const k = kwhFromPct(c, t)
    setAmt(r2(k))
    const u = num(unit)
    if (u != null) setTot(r2(k * u))
  }
  const onAmt = (v: string) => {
    setAmt(v)
    const a = num(v)
    if (a == null) return
    const u = num(unit)
    if (u != null) setTot(r2(a * u))
    const c = num(cur)
    if (c != null) setTgt(r2(tgtFromKwh(c, a)))
  }
  const onTot = (v: string) => {
    setTot(v)
    const t = num(v)
    const u = num(unit)
    if (t == null || u == null || u <= 0) return
    const k = t / u
    setAmt(r2(k))
    const c = num(cur)
    if (c != null) setTgt(r2(tgtFromKwh(c, k)))
  }

  const uN = num(unit)
  const costPerPct = uN != null ? (cap / 100) * uN : null
  const kmPP = kmPerPercent(vehicle, settings)

  return (
    <div className="px-4 pb-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">{t(L, 'chargeCalc')}</h2>
        <details>
          <summary className="text-sm text-blue-600 min-h-[44px] flex items-center cursor-pointer">
            {t(L, 'advanced')}
          </summary>
          <div className="pt-1 space-y-3">
            <Field label={t(L, 'vehiclePicker')}>
              <select
                value={vehicle.id}
                onChange={(e) => {
                  setSel(e.target.value)
                  setTgt('')
                  setAmt('')
                  setTot('')
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px]"
              >
                {electrics.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t(L, 'costPerPct')}>
                <input
                  readOnly
                  value={costPerPct != null ? fmtMoney(costPerPct, settings.currency) : '—'}
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 min-h-[44px]"
                />
              </Field>
              <Field label={t(L, 'kmPerPct')}>
                <input
                  readOnly
                  value={kmPP != null ? `${fmtNum(kmPP)} km` : '—'}
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 min-h-[44px]"
                />
              </Field>
            </div>
          </div>
        </details>
        <Field label={`${t(L, 'pricePerUnit')} (${settings.currency})`}>
          <input
            inputMode="decimal"
            value={unit}
            onChange={(e) => onUnit(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
            placeholder="0.00"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t(L, 'currentLevel')}>
            <input
              inputMode="decimal"
              value={cur}
              onChange={(e) => onCur(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="20"
            />
          </Field>
          <Field label={t(L, 'targetLevel')}>
            <input
              inputMode="decimal"
              value={tgt}
              onChange={(e) => onTgt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="80"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label={`${t(L, 'amount')} (${settings.energyUnit})`}>
            <input
              inputMode="decimal"
              value={amt}
              onChange={(e) => onAmt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
          </Field>
          <Field label={`${t(L, 'totalPrice')} (${settings.currency})`}>
            <input
              inputMode="decimal"
              value={tot}
              onChange={(e) => onTot(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
