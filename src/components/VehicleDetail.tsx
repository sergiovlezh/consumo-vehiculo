import { useState } from 'react'
import { t } from '../i18n'
import { catalogLabel, sortedRecharges, sortTasks, stats, fmtNum, fmtMoney } from '../domain'
import type { Recharge, Settings, Station, Vehicle, VehicleEntry, VehicleTask } from '../types'
import { FabMenu, Header, Segmented, StateDot, StatRow } from './ui'

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

const TaskRow = ({
  task,
  settings,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  task: VehicleTask
  settings: Settings
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
}) => {
  const L = settings.language
  const finished = task.status !== 'pending'
  const cat = t(
    L,
    task.category === 'general'
      ? 'catGeneral'
      : task.category === 'document'
        ? 'catDocument'
        : task.category === 'maintenance'
          ? 'catMaintenance'
          : 'catWarranty',
  )
  const sub = [
    cat,
    task.dueDate || null,
    task.dueOdo != null ? `${task.dueOdo.toLocaleString()} km` : null,
    finished
      ? t(L, task.status === 'done' ? 'stDone' : 'stCancelled')
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 ${finished ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
          {task.title}
        </div>
        <div className="text-xs text-slate-500">{sub}</div>
        {task.details ? (
          <div className="text-sm whitespace-pre-wrap break-words">{task.details}</div>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleDone}
          className={`rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center ${task.status === 'done' ? 'bg-green-100 text-green-700' : ''}`}
          aria-label={t(L, 'stDone')}
        >
          ✓
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
  onAddTask,
  onEditVehicle,
  onToggleFavorite,
  isFavorite,
  onEditRecharge,
  onDeleteRecharge,
  onEditEntry,
  onDeleteEntry,
  onTogglePin,
  onEditTask,
  onDeleteTask,
  onToggleTaskDone,
}: {
  vehicle: Vehicle
  settings: Settings
  stations: Station[]
  onBack: () => void
  onAddRecharge: () => void
  onAddNote: () => void
  onAddExpense: () => void
  onAddTask: () => void
  onEditVehicle: () => void
  onToggleFavorite: () => void
  isFavorite: boolean
  onEditRecharge: (rec: Recharge) => void
  onDeleteRecharge: (rec: Recharge) => void
  onEditEntry: (e: VehicleEntry) => void
  onDeleteEntry: (e: VehicleEntry) => void
  onTogglePin: (e: VehicleEntry) => void
  onEditTask: (x: VehicleTask) => void
  onDeleteTask: (x: VehicleTask) => void
  onToggleTaskDone: (x: VehicleTask) => void
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
  const tasks = sortTasks(vehicle.tasks ?? [])
  const [tab, setTab] = useState<'pinned' | 'journal' | 'recharges' | 'expenses' | 'tasks'>('recharges')

  const entryList = (list: VehicleEntry[]) => (
    <div className="space-y-2 p-4">
      {list.length === 0 ? (
        <div className="text-sm text-slate-500">{t(L, 'noEntries')}</div>
      ) : (
        list.map((e) => (
          <EntryRow
            key={e.id}
            entry={e}
            settings={settings}
            onEdit={() => onEditEntry(e)}
            onDelete={() => onDeleteEntry(e)}
            onTogglePin={() => onTogglePin(e)}
          />
        ))
      )}
    </div>
  )

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
      <div className="px-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pinned', label: t(L, 'pinned') },
            { value: 'journal', label: t(L, 'journal') },
            { value: 'recharges', label: t(L, 'recharge') },
            { value: 'expenses', label: t(L, 'expenses') },
            { value: 'tasks', label: t(L, 'tasks') },
          ]}
        />
      </div>
      {tab === 'pinned' ? entryList(pinned) : null}
      {tab === 'journal' ? entryList(notes) : null}
      {tab === 'tasks' ? (
        <div className="space-y-2 p-4">
          {tasks.length === 0 ? (
            <div className="text-sm text-slate-500">{t(L, 'noTasks')}</div>
          ) : (
            tasks.map((x) => (
              <TaskRow
                key={x.id}
                task={x}
                settings={settings}
                onToggleDone={() => onToggleTaskDone(x)}
                onEdit={() => onEditTask(x)}
                onDelete={() => onDeleteTask(x)}
              />
            ))
          )}
        </div>
      ) : null}
      {tab === 'expenses' ? (
        <>
          {expenses.length > 0 ? (
            <div className="flex justify-end px-4 pt-2">
              <span className="text-sm font-medium">{fmtMoney(expenseTotal, settings.currency)}</span>
            </div>
          ) : null}
          {entryList(expenses)}
        </>
      ) : null}
      {tab === 'recharges' ? (
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
      ) : null}
      <FabMenu onAddRecord={onAddRecharge} onAddNote={onAddNote} onAddExpense={onAddExpense} onAddTask={onAddTask} lang={L} />
    </div>
  )
}
