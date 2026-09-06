import { useState } from 'react'
import { t } from '../i18n'
import { uid } from '../storage'
import { visibleOrSelected } from '../domain'
import type { EntryKind, Settings, VehicleEntry } from '../types'
import { Button, Field } from './ui'

export const EntryForm = ({
  initial,
  kind,
  settings,
  onSave,
  onCancel,
}: {
  initial: VehicleEntry | null
  kind: EntryKind
  settings: Settings
  onSave: (e: VehicleEntry) => void
  onCancel: () => void
}) => {
  const L = settings.language
  const activeKind: EntryKind = initial?.kind ?? kind
  const isExpense = activeKind === 'expense'

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(initial?.date ?? today)
  const [odo, setOdo] = useState(initial?.odo != null ? String(initial.odo) : '')
  const [text, setText] = useState(initial?.text ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [expenseKindId, setExpenseKindId] = useState(initial?.expenseKindId ?? '')

  const odoN = parseFloat(odo)
  const amtN = parseFloat(amount)
  const valid =
    text.trim() !== '' &&
    (odo === '' || (isFinite(odoN) && odoN >= 0)) &&
    (!isExpense || (isFinite(amtN) && amtN > 0))

  const submit = () => {
    if (!valid) return
    onSave({
      id: initial?.id ?? uid(),
      date,
      odo: odo === '' ? undefined : odoN,
      kind: activeKind,
      text: text.trim(),
      pinned: initial?.pinned,
      amount: isExpense ? amtN : undefined,
      expenseKindId: isExpense && expenseKindId ? expenseKindId : undefined,
    })
  }

  return (
    <div className="space-y-4 p-4">
      <Field label={t(L, 'date')}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
        />
      </Field>
      <Field label={`${t(L, 'odometer')} (${t(L, 'optional')})`}>
        <input
          inputMode="decimal"
          value={odo}
          onChange={(e) => setOdo(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          placeholder="125430"
        />
      </Field>
      {isExpense ? (
        <>
          <Field label={t(L, 'type')}>
            <select
              value={expenseKindId}
              onChange={(e) => setExpenseKindId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[44px]"
            >
              <option value="">—</option>
              {visibleOrSelected(settings.expenseKinds, expenseKindId ? [expenseKindId] : []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`${t(L, 'totalPrice')} (${settings.currency})`}>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
              placeholder="0.00"
            />
          </Field>
        </>
      ) : null}
      <Field label={t(L, 'comment')}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
        />
      </Field>
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
