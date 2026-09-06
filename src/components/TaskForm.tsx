import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import type { Settings, TaskCategory, TaskStatus, Vehicle, VehicleTask } from '../types'
import { Button, Field, Segmented } from './ui'

const CATEGORIES: TaskCategory[] = ['general', 'document', 'maintenance', 'warranty']
const STATUSES: TaskStatus[] = ['pending', 'done', 'cancelled']

export const TaskForm = ({
  initial,
  settings,
  vehicles,
  vehicleId,
  onVehicleChange,
  onSave,
  onCancel,
}: {
  initial: VehicleTask | null
  settings: Settings
  vehicles?: Vehicle[]
  vehicleId?: string
  onVehicleChange?: (id: string) => void
  onSave: (t: VehicleTask) => void
  onCancel: () => void
}) => {
  const L = settings.language
  const [title, setTitle] = useState(initial?.title ?? '')
  const [details, setDetails] = useState(initial?.details ?? '')
  const [category, setCategory] = useState<TaskCategory>(initial?.category ?? 'general')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [dueOdo, setDueOdo] = useState(initial?.dueOdo != null ? String(initial.dueOdo) : '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'pending')

  // ponytail: document needs a due date; maintenance/warranty need a date or a
  // km; general needs a title only.
  const odoN = parseFloat(dueOdo)
  const valid =
    title.trim() !== '' &&
    (dueOdo === '' || (isFinite(odoN) && odoN >= 0)) &&
    (category === 'general' ||
      (category === 'document' ? dueDate !== '' : dueDate !== '' || dueOdo !== ''))

  const submit = () => {
    if (!valid) return
    onSave({
      id: initial?.id ?? uid(),
      title: title.trim(),
      details: details.trim() || undefined,
      category,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      dueOdo: dueOdo === '' ? undefined : odoN,
      status,
    })
  }

  return (
    <div className="space-y-4 p-4">
      {vehicles && vehicles.length > 0 && onVehicleChange ? (
        <Field label={t(L, 'vehiclePicker')}>
          <select
            value={vehicleId ?? ''}
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
      <Field label={t(L, 'taskTitle')}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
        />
      </Field>
      <Field label={t(L, 'comment')}>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
        />
      </Field>
      <Field label={t(L, 'type')}>
        <Segmented
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: t(L, c === 'general' ? 'catGeneral' : c === 'document' ? 'catDocument' : c === 'maintenance' ? 'catMaintenance' : 'catWarranty'),
          }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t(L, 'startDate')}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          />
        </Field>
        <Field label={t(L, 'dueDate')}>
          <input
            type="date"
            value={dueDate}
            min={startDate || undefined}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          />
        </Field>
      </div>
      <Field label={t(L, 'dueOdo')}>
        <input
          inputMode="decimal"
          value={dueOdo}
          onChange={(e) => setDueOdo(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          placeholder="125430"
        />
      </Field>
      {initial ? (
        <Field label={t(L, 'stationState')}>
          <Segmented
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({
              value: s,
              label: t(L, s === 'pending' ? 'stPending' : s === 'done' ? 'stDone' : 'stCancelled'),
            }))}
          />
        </Field>
      ) : null}
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} className="min-h-[44px]">
          {t(L, 'cancel')}
        </Button>
        <Button onClick={submit} disabled={!valid} className="min-h-[44px]">
          {t(L, 'save')}
        </Button>
      </div>
    </div>
  )
}
