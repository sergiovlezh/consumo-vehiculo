import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import { visibleOrSelected } from '../domain'
import type { Settings, Vehicle, VehicleType } from '../types'
import { Button, ChipSelect, Field, Segmented } from './ui'

export const VehicleForm = ({
  initial,
  settings,
  onSave,
  onCancel,
  isFavorite,
  onToggleFavorite,
}: {
  initial: Vehicle | null
  settings: Settings
  onSave: (v: Vehicle) => void
  onCancel: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}) => {
  const L = settings.language
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'fuel')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState<string>(String(initial?.year ?? ''))
  const [color, setColor] = useState(initial?.color ?? '')
  const [licensePlate, setLicensePlate] = useState(initial?.licensePlate ?? '')
  const isElectric = type === 'electric'
  const capUnit = isElectric ? settings.energyUnit : settings.volumeUnit
  const [capacity, setCapacity] = useState(
    initial?.capacity != null ? String(initial.capacity) : '',
  )
  const [batteryDegradation, setBatteryDegradation] = useState(
    initial?.batteryDegradation != null ? String(initial.batteryDegradation) : '100',
  )
  const [fuelGradeId, setFuelGradeId] = useState(initial?.fuelGradeId ?? '')
  const [connectorIds, setConnectorIds] = useState<string[]>(initial?.connectorIds ?? [])

  const submit = () => {
    if (!name.trim()) return
    const capN = parseFloat(capacity)
    const degN = parseFloat(batteryDegradation)
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      type,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      color: color.trim() || undefined,
      licensePlate: licensePlate.trim() || undefined,
      capacity: isFinite(capN) && capN > 0 ? capN : 0,
      batteryDegradation: isElectric && isFinite(degN) && degN > 0 && degN <= 100 ? degN : undefined,
      fuelGradeId: !isElectric && fuelGradeId ? fuelGradeId : undefined,
      connectorIds: isElectric && connectorIds.length ? connectorIds : undefined,
      recharges: initial?.recharges ?? [],
    })
  }

  return (
    <div className="space-y-4 p-4">
      <Field label={t(L, 'name')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          placeholder="My car"
        />
      </Field>
      <Field label={t(L, 'type')}>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'fuel', label: t(L, 'fuel') },
            { value: 'electric', label: t(L, 'electric') },
            // ponytail: hybrid removed; PHEV/REEV per-tank split is a later feature.
            // Stored legacy 'hybrid' vehicles keep working (treated as fuel).
          ]}
        />
      </Field>
      <Field label={t(L, 'brand')}>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          placeholder="Toyota"
        />
      </Field>
      <Field label={t(L, 'model')}>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          placeholder="Corolla"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t(L, 'year')}>
          <input
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="2023"
          />
        </Field>
        <Field label={t(L, 'color')}>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Blue"
          />
        </Field>
        <Field label={t(L, 'licensePlate')}>
          <input
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="ABC-123"
          />
        </Field>
      </div>
      <Field label={`${t(L, 'capacity')} (${capUnit})`}>
        <input
          inputMode="decimal"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          placeholder="50"
        />
      </Field>
      {isElectric ? (
        <Field label={t(L, 'batteryDegradation')}>
          <input
            inputMode="decimal"
            value={batteryDegradation}
            onChange={(e) => setBatteryDegradation(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="100"
            max="100"
            min="1"
          />
          <p className="mt-1 text-xs text-slate-500">{t(L, 'batteryDegradationHelp')}</p>
        </Field>
      ) : (
        <Field label={t(L, 'fuelType')}>
          <select
            value={fuelGradeId}
            onChange={(e) => setFuelGradeId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px] outline-none focus:border-blue-500"
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
      {isElectric ? (
        <Field label={t(L, 'connectors')}>
          <ChipSelect
            options={visibleOrSelected(settings.connectors, connectorIds).map((c) => ({
              value: c.id,
              label: c.label,
            }))}
            selected={connectorIds}
            onChange={setConnectorIds}
          />
        </Field>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFavorite}
          className="rounded-full p-2 text-2xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isFavorite ? 'Unfavorite' : 'Set as favorite'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        <span className="text-sm text-slate-600">{t(L, 'favorite')}</span>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} className="min-h-[44px]">
          {t(L, 'cancel')}
        </Button>
        <Button onClick={submit} className="min-h-[44px]">
          {t(L, 'save')}
        </Button>
      </div>
    </div>
  )
}