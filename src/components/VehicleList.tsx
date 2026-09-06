import { t } from '../i18n'
import type { Settings, Vehicle } from '../types'
import { stats, fmtNum, fmtMoney } from '../domain'
import { Button, Stat } from './ui'

const VehicleCard = ({
  vehicle,
  settings,
  isFavorite,
  onOpen,
  onToggleFavorite,
  vehicleCount,
}: {
  vehicle: Vehicle
  settings: Settings
  isFavorite: boolean
  onOpen: () => void
  onToggleFavorite: () => void
  vehicleCount: number
}) => {
  const s = stats(vehicle, settings)
  const L = settings.language
  const isElectric = vehicle.type === 'electric'
  const typeLabel = isElectric
    ? t(L, 'electric')
    : vehicle.type === 'hybrid'
      ? t(L, 'hybrid')
      : t(L, 'fuel')
  const showFav = vehicleCount > 1

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <button onClick={onOpen} className="w-full text-left">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{vehicle.name}</div>
              {isFavorite ? <span aria-label="favorite" className="text-amber-500">★</span> : null}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{typeLabel}</div>
          </button>
        </div>
        {showFav && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="rounded-full p-2.5 text-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isFavorite ? 'Unfavorite' : 'Set as favorite'}
            title={isFavorite ? t(L, 'favorite') : t(L, 'setFavorite')}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      <button onClick={onOpen} className="mt-3 grid w-full grid-cols-3 gap-2 text-left">
        <Stat label={t(L, 'avgCons')} value={fmtNum(s.avg)} sub={s.consUnit} />
        <Stat
          label={t(L, 'avgCost')}
          value={fmtMoney(s.avgCost, settings.currency)}
          sub={`${settings.currency}/km`}
        />
        <Stat
          label={t(L, 'lastOdo')}
          value={s.lastOdo != null ? `${s.lastOdo.toLocaleString()} km` : '—'}
        />
      </button>
    </div>
  )
}

export const VehicleList = ({
  vehicles,
  settings,
  favoriteId,
  onOpen,
  onToggleFavorite,
  onAddVehicle,
}: {
  vehicles: Vehicle[]
  settings: Settings
  favoriteId: string | null
  onOpen: (id: string) => void
  onToggleFavorite: (id: string) => void
  onAddVehicle: () => void
}) => {
  const L = settings.language
  return (
    <div className="space-y-3 p-4">
      {vehicles.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-slate-500">{t(L, 'noVehicles')}</div>
          <div className="mx-auto mt-4 max-w-xs">
            <Button onClick={onAddVehicle}>{t(L, 'addVehicle')}</Button>
          </div>
        </div>
      ) : (
        vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            settings={settings}
            isFavorite={v.id === favoriteId}
            onOpen={() => onOpen(v.id)}
            onToggleFavorite={() => onToggleFavorite(v.id)}
            vehicleCount={vehicles.length}
          />
        ))
      )}
    </div>
  )
}
