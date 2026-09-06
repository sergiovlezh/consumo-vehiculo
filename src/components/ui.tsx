import type { ReactNode } from 'react'
import { useState } from 'react'
import { fmtNum, fmtMoney, type Stats } from '../domain'
import { t } from '../i18n'
import type { Settings, StationState } from '../types'

const STATE_DOT: Record<StationState, string> = {
  open: 'bg-green-500',
  maintenance: 'bg-amber-500',
  closed: 'bg-red-500',
  unknown: 'bg-slate-300',
}

export const StateDot = ({ state }: { state: StationState }) => (
  <span
    aria-hidden
    className={`inline-block h-3 w-3 flex-none rounded-full ${STATE_DOT[state] ?? STATE_DOT.unknown}`}
  />
)

// ponytail: multi-select chips for connectors / fuel grades. No lib, just buttons.
export const ChipSelect = ({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) => (
  <div className="mt-1 flex flex-wrap gap-2">
    {options.map((o) => {
      const on = selected.includes(o.value)
      return (
        <button
          key={o.value}
          onClick={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
          className={`rounded-xl border px-3 py-2 text-sm min-h-[44px] ${
            on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
          }`}
        >
          {o.label}
        </button>
      )
    })}
  </div>
)

export const Stat = ({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: ReactNode
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-semibold">{value}</div>
    {sub ? <div className="text-xs text-slate-400">{sub}</div> : null}
  </div>
)

export const StatRow = ({ s, settings }: { s: Stats; settings: Settings }) => {
  const L = settings.language
  return (
    <div className="grid grid-cols-2 gap-2">
      <Stat
        label={t(L, 'lastOdo')}
        value={s.lastOdo != null ? `${s.lastOdo.toLocaleString()} km` : '—'}
      />
      <Stat label={t(L, 'records')} value={String(s.count)} />
      <Stat label={t(L, 'avgCons')} value={fmtNum(s.avg)} sub={s.consUnit} />
      <Stat label={t(L, 'minCons')} value={fmtNum(s.min)} sub={s.consUnit} />
      <Stat label={t(L, 'maxCons')} value={fmtNum(s.max)} sub={s.consUnit} />
      <Stat
        label={t(L, 'totalSpent')}
        value={fmtMoney(s.totalSpent, settings.currency)}
      />
      <Stat
        label={t(L, 'avgCost')}
        value={fmtMoney(s.avgCost, settings.currency)}
        sub={`${settings.currency}/km`}
      />
      <Stat
        label={`${t(L, 'minCost')} / ${t(L, 'maxCost')}`}
        value={`${fmtMoney(s.minCost, settings.currency)} / ${fmtMoney(s.maxCost, settings.currency)}`}
        sub={`${settings.currency}/km`}
      />
    </div>
  )
}

export const Header = ({
  title,
  onBack,
  right,
}: {
  title: string
  onBack?: () => void
  right?: ReactNode
}) => (
  <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
    {onBack ? (
      <button
        onClick={onBack}
        className="rounded-full p-2.5 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Back"
      >
        ←
      </button>
    ) : null}
    <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
    {right}
  </header>
)

export const Fab = ({ onClick, label = '+', children }: { onClick: () => void; label?: string; children?: ReactNode }) => (
  <button
    onClick={onClick}
    aria-label="add"
    className="safe-bottom fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-2xl text-white shadow-lg active:scale-95 flex items-center justify-center"
  >
    {children ?? label}
  </button>
)

export const FabMenu = ({ onAddRecord }: { onAddRecord: () => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-6 right-6 z-20">
      <div className="flex flex-col items-end gap-2">
        {open && (
          <button
            onClick={() => { onAddRecord(); setOpen(false); }}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-lg text-left min-w-[160px] hover:bg-slate-50"
          >
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">⚡</span>
            <span className="font-medium">Add recharge</span>
          </button>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="h-14 w-14 rounded-full bg-blue-600 text-2xl text-white shadow-lg active:scale-95 flex items-center justify-center"
          aria-label="Add"
        >
          {open ? '✕' : '+'}
        </button>
      </div>
    </div>
  )
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
}: {
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) => {
  const cls =
    variant === 'primary'
      ? 'bg-blue-600 text-white disabled:opacity-50'
      : variant === 'danger'
        ? 'border border-red-300 text-red-600 disabled:opacity-50'
        : 'border border-slate-300 bg-white disabled:opacity-50'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-xl py-3 ${cls} min-h-[44px] ${className}`}
    >
      {children}
    </button>
  )
}

export const Field = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
)

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) => (
  <div className="mt-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`rounded-xl border py-2.5 text-sm min-h-[44px] ${
          value === o.value
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
)