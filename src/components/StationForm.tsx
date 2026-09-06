import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import { visibleOrSelected } from '../domain'
import type { Settings, Station, StationKind, StationState } from '../types'
import { Button, ChipSelect, Field, Segmented } from './ui'

const STATES: StationState[] = ['open', 'maintenance', 'closed', 'unknown']

export const StationForm = ({
  initial,
  settings,
  onSave,
  onCancel,
}: {
  initial: Station | null
  settings: Settings
  onSave: (s: Station) => void
  onCancel: () => void
}) => {
  const L = settings.language
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<StationKind>(initial?.kind ?? 'both')
  const [state, setState] = useState<StationState>(initial?.state ?? 'open')
  const [connectorIds, setConnectorIds] = useState<string[]>(initial?.connectorIds ?? [])
  const [fuelGradeIds, setFuelGradeIds] = useState<string[]>(initial?.fuelGradeIds ?? [])

  const submit = () => {
    if (!name.trim()) return
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      kind,
      state,
      connectorIds: kind === 'fuel' ? undefined : connectorIds.length ? connectorIds : undefined,
      fuelGradeIds: kind === 'electric' ? undefined : fuelGradeIds.length ? fuelGradeIds : undefined,
    })
  }

  return (
    <div className="space-y-4 p-4">
      <Field label={t(L, 'name')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          placeholder="Terpel La Paz"
        />
      </Field>
      <Field label={t(L, 'type')}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'electric', label: t(L, 'electric') },
            { value: 'fuel', label: t(L, 'fuel') },
            { value: 'both', label: t(L, 'kindBoth') },
          ]}
        />
      </Field>
      <Field label={t(L, 'stationState')}>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as StationState)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px]"
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {t(L, s === 'open' ? 'stOpen' : s === 'maintenance' ? 'stMaintenance' : s === 'closed' ? 'stClosed' : 'stUnknown')}
            </option>
          ))}
        </select>
      </Field>
      {kind !== 'fuel' ? (
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
      {kind !== 'electric' ? (
        <Field label={t(L, 'fuelType')}>
          <ChipSelect
            options={visibleOrSelected(settings.fuelGrades, fuelGradeIds).map((g) => ({
              value: g.id,
              label: g.label,
            }))}
            selected={fuelGradeIds}
            onChange={setFuelGradeIds}
          />
        </Field>
      ) : null}
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
