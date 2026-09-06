import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import { sortedRecharges, stationsForVehicle, visibleOrSelected } from '../domain'
import type { Recharge, Settings, Station, Vehicle } from '../types'
import { Button, Field, Header, StateDot } from './ui'

type LastEdited = 'amount' | 'unit' | 'total' | null

export const RechargeForm = ({
  vehicle,
  vehicles,
  settings,
  stations,
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
  stations: Station[]
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
  const stationOptions = activeVehicle ? stationsForVehicle(stations, activeVehicle.type) : []

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
  const [place, setPlace] = useState(initial?.place ?? '')
  const [fuelGradeId, setFuelGradeId] = useState(
    initial?.fuelGradeId ?? (activeVehicle && !isElectric ? activeVehicle.fuelGradeId ?? '' : ''),
  )
  const [stationName, setStationName] = useState(
    initial?.stationId ? stations.find((s) => s.id === initial.stationId)?.name ?? '' : '',
  )
  const [startLevel, setStartLevel] = useState(initial?.startLevel != null ? String(initial.startLevel) : '')
  const [lastEdited, setLastEdited] = useState<LastEdited>(null)

  const station = stationOptions.find((s) => s.name === stationName) ?? null

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

  const formValid = (() => {
    if (!activeVehicle) return false
    const odoN = parseFloat(odo)
    const endN = parseFloat(endLevel)
    if (!isFinite(odoN) || odoN < 0) return false
    if (!isFinite(endN) || endN < 0 || endN > 100) return false
    if (startLevel !== '') {
      const sN = parseFloat(startLevel)
      if (!isFinite(sN) || sN < 0 || sN > 100) return false
    }
    let amtN = parseFloat(amount)
    let unitN = parseFloat(pricePerUnit)
    let totN = parseFloat(totalPrice)
    const valid = (n: number) => isFinite(n)
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
    if (valid(amtN) && valid(unitN) && !valid(totN)) totN = amtN * unitN
    else if (valid(amtN) && valid(totN) && !valid(unitN)) unitN = amtN > 0 ? totN / amtN : 0
    else if (valid(unitN) && valid(totN) && !valid(amtN)) amtN = unitN > 0 ? totN / unitN : 0

    const sN = parseFloat(startLevel)
    const payload: Recharge = {
      id: initial?.id ?? uid(),
      date,
      odo: odoN,
      amount: amtN,
      pricePerUnit: valid(unitN) ? unitN : 0,
      endLevel: endN,
      fullCharge,
      notes: notes || undefined,
      place: place.trim() || undefined,
      stationId: station?.id,
      // ponytail: display-only, non-electric; never enters stats
      fuelGradeId: !isElectric && fuelGradeId ? fuelGradeId : undefined,
      // ponytail: display-only, electric only; never enters stats
      startLevel: isElectric && startLevel !== '' && isFinite(sN) ? sN : undefined,
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
          <Field label={t(L, 'selectStation')}>
            <input
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              list="station-pick"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="Terpel La Paz"
            />
            <datalist id="station-pick">
              {stationOptions.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
            {station ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <StateDot state={station.state} />
                <span>{t(L, station.state === 'open' ? 'stOpen' : station.state === 'maintenance' ? 'stMaintenance' : station.state === 'closed' ? 'stClosed' : 'stUnknown')}</span>
                {station.state !== 'open' ? <span>· {t(L, 'stationWarn')}</span> : null}
              </div>
            ) : null}
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
          {isElectric ? (
            <Field label={t(L, 'startLevel')}>
              <input
                inputMode="decimal"
                value={startLevel}
                onChange={(e) => setStartLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
                placeholder="20"
              />
            </Field>
          ) : (
            <Field label={t(L, 'fuelType')}>
              <select
                value={fuelGradeId}
                onChange={(e) => setFuelGradeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px]"
              >
                <option value="">—</option>
                {visibleOrSelected(settings.fuelGrades, fuelGradeId ? [fuelGradeId] : []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
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
          <Field label={t(L, 'place')}>
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
            />
          </Field>
          <Field label={t(L, 'notes')}>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
            />
          </Field>
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