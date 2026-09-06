import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import { amountToFull, sortedRecharges } from '../domain'
import type { Recharge, Settings, Vehicle } from '../types'
import { Button, Field, Header } from './ui'

type LastEdited = 'amount' | 'unit' | 'total' | null

export const RechargeForm = ({
  vehicle,
  vehicles,
  settings,
  vehicleId,
  onVehicleChange,
  onSave,
  onCancel,
  onBack,
  showHeader = true,
  initial,
}: {
  vehicle: Vehicle | null
  vehicles: Vehicle[]
  settings: Settings
  vehicleId?: string
  onVehicleChange?: (id: string) => void
  onSave: (vehicleId: string, rec: Recharge) => void
  onCancel: () => void
  onBack?: () => void
  showHeader?: boolean
  initial?: Recharge | null
}) => {
  const L = settings.language
  const activeVehicle = vehicle
  const isElectric = activeVehicle?.type === 'electric'
  const last = activeVehicle ? sortedRecharges(activeVehicle).slice(-1)[0] : undefined
  const isEditing = !!initial

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(initial?.date ?? today)
  const [odo, setOdo] = useState(initial?.odo ? String(initial.odo) : (last ? String(last.odo) : ''))
  const [endLevel, setEndLevel] = useState(initial?.endLevel != null ? String(initial.endLevel) : (isElectric ? '80' : '100'))
  const [fullCharge, setFullCharge] = useState(initial?.fullCharge ?? !isElectric)
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [pricePerUnit, setPricePerUnit] = useState(initial?.pricePerUnit != null ? String(initial.pricePerUnit) : '')
  const [totalPrice, setTotalPrice] = useState(initial?.pricePerUnit != null && initial?.amount != null
    ? String(initial.pricePerUnit * initial.amount)
    : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [manualStart, setManualStart] = useState(initial?.manualStart ?? false)
  const [startOdo, setStartOdo] = useState(initial?.startOdo != null ? String(initial.startOdo) : (last ? String(last.odo) : ''))
  const [startLevel, setStartLevel] = useState(initial?.startLevel != null ? String(initial.startLevel) : (last && last.endLevel != null ? String(last.endLevel) : ''))
  const [fullTankAmount, setFullTankAmount] = useState(initial?.fullTankAmount != null ? String(initial.fullTankAmount) : '')
  const [lastEdited, setLastEdited] = useState<LastEdited>(null)

  const amtUnit = isElectric ? settings.energyUnit : settings.volumeUnit
  const amtLabel = `${t(L, 'amount')} (${amtUnit})`

  const onAmountChange = (raw: string) => {
    setAmount(raw)
    setLastEdited('amount')
  }
  const onUnitChange = (raw: string) => {
    setPricePerUnit(raw)
    setLastEdited('unit')
  }
  const onTotalChange = (raw: string) => {
    setTotalPrice(raw)
    setLastEdited('total')
  }

  const a = parseFloat(amount)
  const u = parseFloat(pricePerUnit)
  const t_ = parseFloat(totalPrice)
  const preview = (() => {
    if (lastEdited === 'amount' && isFinite(a) && isFinite(u)) return { total: a * u }
    if (lastEdited === 'amount' && isFinite(a) && isFinite(t_)) return { unit: a > 0 ? t_ / a : NaN }
    if (lastEdited === 'unit' && isFinite(u) && isFinite(t_)) return { amount: u > 0 ? t_ / u : NaN }
    if (lastEdited === 'unit' && isFinite(u) && isFinite(a)) return { total: a * u }
    if (lastEdited === 'total' && isFinite(t_) && isFinite(a)) return { unit: a > 0 ? t_ / a : NaN }
    if (lastEdited === 'total' && isFinite(t_) && isFinite(u)) return { amount: u > 0 ? t_ / u : NaN }
    return {}
  })()

  const autoFilled = (() => {
    if (!activeVehicle || !fullCharge) return null
    const lvl = parseFloat(endLevel)
    if (!isFinite(lvl)) return null
    return amountToFull(activeVehicle, lvl)
  })()

  const formValid = (() => {
    if (!activeVehicle) return false
    const odoN = parseFloat(odo)
    const endN = parseFloat(endLevel)
    if (!isFinite(odoN) || odoN < 0) return false
    if (!isFinite(endN) || endN < 0 || endN > 100) return false
    let amtN = parseFloat(amount)
    let unitN = parseFloat(pricePerUnit)
    let totN = parseFloat(totalPrice)
    const valid = (n: number) => isFinite(n)
    if (autoFilled != null && !valid(amtN)) amtN = autoFilled
    if (valid(amtN) && valid(unitN) && !valid(totN)) totN = amtN * unitN
    else if (valid(amtN) && valid(totN) && !valid(unitN)) unitN = amtN > 0 ? totN / amtN : 0
    else if (valid(unitN) && valid(totN) && !valid(amtN)) amtN = unitN > 0 ? totN / unitN : 0
    if (!valid(amtN) || amtN <= 0) return false
    return true
  })()

  const submit = () => {
    if (!activeVehicle || !formValid) return
    const odoN = parseFloat(odo)
    const endN = parseFloat(endLevel)
    let amtN = parseFloat(amount)
    let unitN = parseFloat(pricePerUnit)
    let totN = parseFloat(totalPrice)
    const valid = (n: number) => isFinite(n)
    if (autoFilled != null && !valid(amtN)) amtN = autoFilled
    if (valid(amtN) && valid(unitN) && !valid(totN)) totN = amtN * unitN
    else if (valid(amtN) && valid(totN) && !valid(unitN)) unitN = amtN > 0 ? totN / amtN : 0
    else if (valid(unitN) && valid(totN) && !valid(amtN)) amtN = unitN > 0 ? totN / unitN : 0

    const payload: Recharge = {
      id: initial?.id ?? uid(),
      date,
      odo: odoN,
      amount: amtN,
      pricePerUnit: valid(unitN) ? unitN : 0,
      endLevel: endN,
      fullCharge,
      notes: notes || undefined,
    }
    if (manualStart) {
      const sOdo = parseFloat(startOdo)
      const sLvl = parseFloat(startLevel)
      const fTank = parseFloat(fullTankAmount)
      if (!isFinite(sOdo) || !isFinite(sLvl) || !isFinite(fTank)) return
      payload.startOdo = sOdo
      payload.startLevel = sLvl
      payload.fullTankAmount = fTank
      payload.manualStart = true
    }
    onSave(activeVehicle.id, payload)
  }

  const inner = (
    <div className="space-y-4 p-4">
      {vehicles && vehicles.length > 0 && onVehicleChange ? (
        <Field label={t(L, 'vehiclePicker')}>
          <select
            value={vehicleId ?? activeVehicle?.id ?? ''}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px]"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {activeVehicle ? (
        <>
          <Field label={t(L, 'date')}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
            />
          </Field>
          <Field label={t(L, 'odometer')}>
            <input
              inputMode="decimal"
              value={odo}
              onChange={(e) => setOdo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder={last ? String(last.odo) : '125430'}
            />
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fc"
              checked={fullCharge}
              onChange={(e) => {
                const checked = e.target.checked
                setFullCharge(checked)
                if (checked) setEndLevel('100')
              }}
              className="h-5 w-5"
            />
            <label htmlFor="fc" className="text-sm">
              {t(L, 'fullCharge')}
            </label>
          </div>
          <Field label={t(L, 'endLevel')}>
            <input
              inputMode="decimal"
              value={endLevel}
              onChange={(e) => setEndLevel(e.target.value)}
              disabled={fullCharge}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px] disabled:bg-slate-100"
            />
          </Field>
          {fullCharge && autoFilled != null && autoFilled > 0 ? (
            <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-800">
              {t(L, 'calcAmount')}: <strong>{autoFilled.toFixed(2)} {amtUnit}</strong>
            </div>
          ) : fullCharge && activeVehicle && activeVehicle.capacity > 0 ? null : null}
          <Field label={amtLabel}>
            <input
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
            {lastEdited !== 'amount' && preview.amount != null && isFinite(preview.amount) ? (
              <div className="mt-1 text-xs text-slate-500">
                = {preview.amount.toFixed(2)} {amtUnit}
              </div>
            ) : null}
          </Field>
          <Field label={`${t(L, 'pricePerUnit')} (${settings.currency})`}>
            <input
              inputMode="decimal"
              step="0.01"
              value={pricePerUnit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
            {lastEdited !== 'unit' && preview.unit != null && isFinite(preview.unit) ? (
              <div className="mt-1 text-xs text-slate-500">
                = {(preview.unit as number).toFixed(2)} {settings.currency}
              </div>
            ) : null}
          </Field>
          <Field label={`${t(L, 'totalPrice')} (${settings.currency})`}>
            <input
              inputMode="decimal"
              step="0.01"
              value={totalPrice}
              onChange={(e) => onTotalChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
            {lastEdited !== 'total' && preview.total != null && isFinite(preview.total) ? (
              <div className="mt-1 text-xs text-slate-500">
                = {preview.total.toFixed(2)} {settings.currency}
              </div>
            ) : null}
          </Field>
          <Field label={t(L, 'notes')}>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
            />
          </Field>
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-sm text-blue-600 min-h-[44px] flex items-center"
          >
            {showAdvanced ? '▾ ' : '▸ '}
            {t(L, 'advanced')}
          </button>
          {showAdvanced ? (
            <div className="space-y-3 rounded-xl bg-slate-100 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ms"
                  checked={manualStart}
                  onChange={(e) => setManualStart(e.target.checked)}
                  className="h-5 w-5"
                />
                <label htmlFor="ms" className="text-sm">
                  {t(L, 'manualStart')}
                </label>
              </div>
              {manualStart ? (
                <>
                  <Field label={t(L, 'startOdometer')}>
                    <input
                      inputMode="decimal"
                      value={startOdo}
                      onChange={(e) => setStartOdo(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
                    />
                  </Field>
                  <Field label={t(L, 'startLevel')}>
                    <input
                      inputMode="decimal"
                      value={startLevel}
                      onChange={(e) => setStartLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
                    />
                  </Field>
                  <Field label={`${t(L, 'amount')} (${t(L, 'fullTankAmount')})`}>
                    <input
                      inputMode="decimal"
                      value={fullTankAmount}
                      onChange={(e) => setFullTankAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
                    />
                  </Field>
                </>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} className="min-h-[44px]">
          {t(L, 'cancel')}
        </Button>
        <Button onClick={submit} disabled={!formValid} className="min-h-[44px]">
          {t(L, 'save')}
        </Button>
      </div>
    </div>
  )

  const title = isEditing ? t(L, 'editRecharge') : t(L, 'addRecharge')

  return showHeader ? (
    <>
      <Header title={title} onBack={onBack ?? onCancel} />
      {inner}
    </>
  ) : (
    inner
  )
}
