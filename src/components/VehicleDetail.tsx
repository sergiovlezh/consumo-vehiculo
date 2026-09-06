import { t } from '../i18n'
import { catalogLabel, sortedRecharges, stats, fmtNum, fmtMoney } from '../domain'
import type { Recharge, Settings, Station, Vehicle, VehicleEntry } from '../types'
import { FabMenu, Header, StateDot, StatRow } from './ui'

const EntryRow = ({
  entry,
  settings,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  entry: VehicleEntry
  settings: Settings
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
}) => {
  const L = settings.language
  const kindLabel =
    entry.kind === 'expense' ? catalogLabel(settings.expenseKinds, entry.expenseKindId) : null
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">
          {entry.date}
          {entry.odo != null ? ` · ${entry.odo.toLocaleString()} km` : ''}
        </div>
        {entry.kind === 'expense' ? (
          <div className="text-sm font-medium">
            {fmtMoney(entry.amount ?? null, settings.currency)}
            {kindLabel ? <span className="font-normal text-slate-500"> · {kindLabel}</span> : null}
          </div>
        ) : null}
        <div className="text-sm whitespace-pre-wrap break-words">{entry.text}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePin}
          className={`rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center ${entry.pinned ? '' : 'opacity-40'}`}
          aria-label="Pin"
          title={t(L, 'pin')}
        >
          📌
        </button>
        <button
          onClick={onEdit}
          className="rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t(L, 'edit')}
        >
          ✎
        </button>
        <button
          onClick={() => {
            if (window.confirm(t(L, 'confirmDelete'))) {
              onDelete()
            }
          }}
          className="rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600"
          aria-label={t(L, 'delete')}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

export const VehicleDetail = ({
  vehicle,
  settings,
  stations,
  onBack,
  onAddRecharge,
  onAddNote,
  onAddExpense,
  onEditVehicle,
  onToggleFavorite,
  isFavorite,
  onEditRecharge,
  onDeleteRecharge,
  onEditEntry,
  onDeleteEntry,
  onTogglePin,
}: {
  vehicle: Vehicle
  settings: Settings
  stations: Station[]
  onBack: () => void
  onAddRecharge: () => void
  onAddNote: () => void
  onAddExpense: () => void
  onEditVehicle: () => void
  onToggleFavorite: () => void
  isFavorite: boolean
  onEditRecharge: (rec: Recharge) => void
  onDeleteRecharge: (rec: Recharge) => void
  onEditEntry: (e: VehicleEntry) => void
  onDeleteEntry: (e: VehicleEntry) => void
  onTogglePin: (e: VehicleEntry) => void
}) => {
  const L = settings.language
  const s = stats(vehicle, settings)
  const recs = sortedRecharges(vehicle)
  const isElectric = vehicle.type === 'electric'
  const entries = [...(vehicle.entries ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const pinned = entries.filter((e) => e.pinned)
  const expenses = entries.filter((e) => !e.pinned && e.kind === 'expense')
  const notes = entries.filter((e) => !e.pinned && e.kind === 'note')
  const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  return (
    <div className="pb-28">
      <Header
        title={vehicle.name}
        onBack={onBack}
        right={
          <div className="flex items-center">
            <button
              onClick={onEditVehicle}
              className="rounded-full p-2.5 text-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t(L, 'edit')}
              title={t(L, 'edit')}
            >
              ✎
            </button>
            <button
              onClick={onToggleFavorite}
              className="rounded-full p-2.5 text-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isFavorite ? 'Unfavorite' : 'Set as favorite'}
              title={isFavorite ? t(L, 'favorite') : t(L, 'setFavorite')}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          </div>
        }
      />
      <div className="space-y-3 p-4">
        <StatRow s={s} settings={settings} />
      </div>
      {pinned.length > 0 ? (
        <>
          <div className="px-4">
            <h2 className="text-sm font-semibold text-slate-700">{t(L, 'pinned')}</h2>
          </div>
          <div className="space-y-2 p-4">
            {pinned.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                settings={settings}
                onEdit={() => onEditEntry(e)}
                onDelete={() => onDeleteEntry(e)}
                onTogglePin={() => onTogglePin(e)}
              />
            ))}
          </div>
        </>
      ) : null}
      {expenses.length > 0 ? (
        <>
          <div className="flex items-baseline justify-between px-4">
            <h2 className="text-sm font-semibold text-slate-700">{t(L, 'expenses')}</h2>
            <span className="text-sm font-medium">{fmtMoney(expenseTotal, settings.currency)}</span>
          </div>
          <div className="space-y-2 p-4">
            {expenses.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                settings={settings}
                onEdit={() => onEditEntry(e)}
                onDelete={() => onDeleteEntry(e)}
                onTogglePin={() => onTogglePin(e)}
              />
            ))}
          </div>
        </>
      ) : null}
      {notes.length > 0 ? (
        <>
          <div className="px-4">
            <h2 className="text-sm font-semibold text-slate-700">{t(L, 'journal')}</h2>
          </div>
          <div className="space-y-2 p-4">
            {notes.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                settings={settings}
                onEdit={() => onEditEntry(e)}
                onDelete={() => onDeleteEntry(e)}
                onTogglePin={() => onTogglePin(e)}
              />
            ))}
          </div>
        </>
      ) : null}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-slate-700">{t(L, 'recharge')}</h2>
      </div>
      <div className="space-y-2 p-4">
        {recs.length === 0 ? (
          <div className="text-sm text-slate-500">{t(L, 'noRecharges')}</div>
        ) : (
          recs
            .slice()
            .reverse()
            .map((r) => {
              const station = r.stationId ? stations.find((s) => s.id === r.stationId) ?? null : null
              const grade = catalogLabel(settings.fuelGrades, r.fuelGradeId)
              return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500">{r.date}</div>
                  <div className="font-mono">{r.odo.toLocaleString()} km</div>
                  <div className="text-sm">
                    {fmtNum(r.amount)} {isElectric ? settings.energyUnit : settings.volumeUnit}
                    {grade ? ` · ${grade}` : ''}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.startLevel != null ? `${r.startLevel}% → ` : ''}{r.endLevel != null ? `${r.endLevel}%` : ''}
                  </div>
                  {r.place ? (
                    <div className="text-xs text-slate-500">📍 {r.place}</div>
                  ) : null}
                  {station ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <StateDot state={station.state} />
                      <span className="truncate">{station.name}</span>
                    </div>
                  ) : null}
                  {r.pricePerUnit > 0 && (
                    <div className="text-xs text-slate-500">
                      {fmtMoney(r.amount * r.pricePerUnit, settings.currency)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRecharge(r)}
                    className="rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={t(L, 'edit')}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`${t(L, 'confirmDelete')}\n\n${t(L, 'calcWarning')}`)) {
                        onDeleteRecharge(r)
                      }
                    }}
                    className="rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600"
                    aria-label={t(L, 'delete')}
                  >
                    🗑
                  </button>
                </div>
              </div>
              )
            })
        )}
      </div>
      <FabMenu onAddRecord={onAddRecharge} onAddNote={onAddNote} onAddExpense={onAddExpense} lang={L} />
    </div>
  )
}
