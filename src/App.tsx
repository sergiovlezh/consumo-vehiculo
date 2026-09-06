import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router'
import type { NavigateFunction } from 'react-router'
import { t } from './i18n'
import { loadDB, loadSettings, saveDB, saveSettings } from './storage'
import type { DB, Recharge, Settings, Station, Vehicle, VehicleEntry } from './types'
import { FabMenu, Header } from './components/ui'
import { VehicleList } from './components/VehicleList'
import { VehicleForm } from './components/VehicleForm'
import { StationForm } from './components/StationForm'
import { EntryForm } from './components/EntryForm'
import { VehicleDetail } from './components/VehicleDetail'
import { ChargeCalculator } from './components/ChargeCalculator'
import { RechargeForm } from './components/RechargeForm'
import { SettingsView } from './components/SettingsView'

// ponytail: history back covers every origin; fallback is for deep links with no history.
// RN equivalent: navigation.canGoBack() ? goBack() : navigate(fallback)
const goBack = (navigate: NavigateFunction, fallback: string) => {
  if (typeof (window.history.state as { idx?: number } | null)?.idx === 'number' && (window.history.state as { idx?: number }).idx! > 0) navigate(-1)
  else navigate(fallback)
}

const App = () => {
  const [db, setDb] = useState<DB>(loadDB)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const navigate = useNavigate()
  const L = settings.language

  useEffect(() => { saveDB(db) }, [db])
  useEffect(() => { saveSettings(settings) }, [settings])

  const upsertVehicle = (v: Vehicle) => {
    setDb((prev) => {
      const i = prev.vehicles.findIndex((x) => x.id === v.id)
      const next = [...prev.vehicles]
      if (i >= 0) next[i] = v
      else next.push(v)
      const fav = prev.favoriteVehicleId ?? next[0]?.id ?? null
      return { ...prev, vehicles: next, favoriteVehicleId: fav }
    })
    navigate(`/vehicles/${v.id}`)
  }

  const deleteVehicle = (id: string) => {
    if (!window.confirm(t(L, 'confirmDelete'))) return
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
      favoriteVehicleId: prev.favoriteVehicleId === id ? null : prev.favoriteVehicleId,
    }))
  }

  const upsertStation = (s: Station) => {
    setDb((prev) => {
      const stations = prev.stations ?? []
      const i = stations.findIndex((x) => x.id === s.id)
      const next = [...stations]
      if (i >= 0) next[i] = s
      else next.push(s)
      return { ...prev, stations: next }
    })
    navigate('/settings')
  }

  const deleteStation = (id: string) => {
    if (!window.confirm(t(L, 'confirmDelete'))) return
    setDb((prev) => ({ ...prev, stations: (prev.stations ?? []).filter((s) => s.id !== id) }))
  }

  const setFavorite = (id: string) => {
    setDb((prev) => ({ ...prev, favoriteVehicleId: id }))
  }

  const saveRecharge = (vehicleId: string, rec: Recharge, isEdit: boolean) => {
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              recharges: isEdit
                ? (v.recharges ?? []).map((r) => (r.id === rec.id ? rec : r))
                : [...(v.recharges ?? []), rec],
            }
          : v,
      ),
    }))
    navigate(`/vehicles/${vehicleId}`)
  }

  const deleteRecharge = (vehicleId: string, recId: string) => {
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, recharges: (v.recharges ?? []).filter((r) => r.id !== recId) }
          : v,
      ),
    }))
  }

  const saveEntry = (vehicleId: string, entry: VehicleEntry, isEdit: boolean) => {
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              entries: isEdit
                ? (v.entries ?? []).map((e) => (e.id === entry.id ? entry : e))
                : [...(v.entries ?? []), entry],
            }
          : v,
      ),
    }))
    navigate(`/vehicles/${vehicleId}`)
  }

  const deleteEntry = (vehicleId: string, entryId: string) => {
    if (!window.confirm(t(L, 'confirmDelete'))) return
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, entries: (v.entries ?? []).filter((e) => e.id !== entryId) }
          : v,
      ),
    }))
  }

  const togglePin = (vehicleId: string, entryId: string) => {
    setDb((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, entries: (v.entries ?? []).map((e) => (e.id === entryId ? { ...e, pinned: !e.pinned } : e)) }
          : v,
      ),
    }))
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header
                title={t(L, 'appName')}
                right={
                  <button
                    onClick={() => navigate('/settings')}
                    className="rounded-full p-2.5 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Settings"
                  >
                    ⚙
                  </button>
                }
              />
              <VehicleList
                vehicles={db.vehicles}
                settings={settings}
                favoriteId={db.favoriteVehicleId}
                onOpen={(id) => navigate(`/vehicles/${id}`)}
                onToggleFavorite={setFavorite}
                onAddVehicle={() => navigate('/vehicles/new')}
              />
              <ChargeCalculator
                vehicles={db.vehicles}
                settings={settings}
                favoriteId={db.favoriteVehicleId}
              />
              {db.vehicles.length > 0 ? (
                <FabMenu
                  onAddRecord={() => navigate('/recharges/new')}
                  onAddNote={() => navigate('/entries/new?kind=note')}
                  onAddExpense={() => navigate('/entries/new?kind=expense')}
                  lang={L}
                />
              ) : null}
            </>
          }
        />
        <Route
          path="/vehicles/new"
          element={
            <VehicleFormRoute
              db={db}
              settings={settings}
              onSave={upsertVehicle}
              onToggleFavorite={setFavorite}
            />
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <DetailRoute
              db={db}
              settings={settings}
              onToggleFavorite={setFavorite}
              onDeleteRecharge={deleteRecharge}
              onDeleteEntry={deleteEntry}
              onTogglePin={togglePin}
            />
          }
        />
        <Route
          path="/vehicles/:id/edit"
          element={
            <VehicleFormRoute
              db={db}
              settings={settings}
              edit
              onSave={upsertVehicle}
              onToggleFavorite={setFavorite}
            />
          }
        />
        <Route
          path="/vehicles/:id/recharges/new"
          element={
            <RechargeFormRoute db={db} settings={settings} onSave={saveRecharge} />
          }
        />
        <Route
          path="/vehicles/:id/recharges/:recId/edit"
          element={
            <RechargeFormRoute db={db} settings={settings} edit onSave={saveRecharge} />
          }
        />
        <Route
          path="/vehicles/:id/entries/new"
          element={
            <EntryFormRoute db={db} settings={settings} onSave={saveEntry} />
          }
        />
        <Route
          path="/vehicles/:id/entries/:entryId/edit"
          element={
            <EntryFormRoute db={db} settings={settings} edit onSave={saveEntry} />
          }
        />
        <Route
          path="/recharges/new"
          element={
            <QuickRechargeRoute db={db} settings={settings} onSave={saveRecharge} />
          }
        />
        <Route
          path="/entries/new"
          element={
            <QuickEntryRoute db={db} settings={settings} onSave={saveEntry} />
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <Header title={t(L, 'settings')} onBack={() => navigate('/')} />
              <SettingsView
                settings={settings}
                onChange={setSettings}
                db={db}
                onImport={(parsed, parsedSettings) => {
                  setDb({ vehicles: parsed.vehicles, favoriteVehicleId: parsed.favoriteVehicleId ?? null, stations: parsed.stations ?? [] })
                  if (parsedSettings) setSettings(parsedSettings)
                  navigate('/')
                }}
                onAddVehicle={() => navigate('/vehicles/new')}
                onEditVehicle={(id) => navigate(`/vehicles/${id}/edit`)}
                onDeleteVehicle={deleteVehicle}
                onAddStation={() => navigate('/stations/new')}
                onEditStation={(id) => navigate(`/stations/${id}/edit`)}
                onDeleteStation={deleteStation}
              />
            </>
          }
        />
        <Route
          path="/stations/new"
          element={<StationFormRoute db={db} settings={settings} onSave={upsertStation} />}
        />
        <Route
          path="/stations/:id/edit"
          element={<StationFormRoute db={db} settings={settings} edit onSave={upsertStation} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

// ponytail: thin route adapters, logic stays in App
const StationFormRoute = ({
  db,
  settings,
  edit,
  onSave,
}: {
  db: DB
  settings: Settings
  edit?: boolean
  onSave: (s: Station) => void
}) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const L = settings.language
  const station = edit ? (db.stations ?? []).find((x) => x.id === id) ?? null : null
  if (edit && !station) return <Navigate to="/settings" replace />
  const back = () => goBack(navigate, '/settings')
  return (
    <>
      <Header title={station ? t(L, 'editStation') : t(L, 'addStation')} onBack={back} />
      <StationForm initial={station} settings={settings} onCancel={back} onSave={onSave} />
    </>
  )
}

const VehicleFormRoute = ({
  db,
  settings,
  edit,
  onSave,
  onToggleFavorite,
}: {
  db: DB
  settings: Settings
  edit?: boolean
  onSave: (v: Vehicle) => void
  onToggleFavorite: (id: string) => void
}) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const L = settings.language
  const vehicle = edit ? db.vehicles.find((x) => x.id === id) ?? null : null
  if (edit && !vehicle) return <Navigate to="/" replace />
  const fallback = vehicle ? `/vehicles/${vehicle.id}` : '/'
  const back = () => goBack(navigate, fallback)
  return (
    <>
      <Header title={vehicle ? t(L, 'editVehicle') : t(L, 'addVehicle')} onBack={back} />
      <VehicleForm
        initial={vehicle}
        settings={settings}
        onCancel={back}
        onSave={onSave}
        isFavorite={vehicle ? db.favoriteVehicleId === vehicle.id : false}
        onToggleFavorite={() => vehicle && onToggleFavorite(vehicle.id)}
      />
    </>
  )
}

const DetailRoute = ({
  db,
  settings,
  onToggleFavorite,
  onDeleteRecharge,
  onDeleteEntry,
  onTogglePin,
}: {
  db: DB
  settings: Settings
  onToggleFavorite: (id: string) => void
  onDeleteRecharge: (vehicleId: string, recId: string) => void
  onDeleteEntry: (vehicleId: string, entryId: string) => void
  onTogglePin: (vehicleId: string, entryId: string) => void
}) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const v = db.vehicles.find((x) => x.id === id)
  if (!v) return <Navigate to="/" replace />
  return (
    <VehicleDetail
      vehicle={v}
      settings={settings}
      stations={db.stations ?? []}
      onBack={() => navigate('/')}
      onAddRecharge={() => navigate(`/vehicles/${v.id}/recharges/new`)}
      onAddNote={() => navigate(`/vehicles/${v.id}/entries/new?kind=note`)}
      onAddExpense={() => navigate(`/vehicles/${v.id}/entries/new?kind=expense`)}
      onEditVehicle={() => navigate(`/vehicles/${v.id}/edit`)}
      onToggleFavorite={() => onToggleFavorite(v.id)}
      isFavorite={db.favoriteVehicleId === v.id}
      onEditRecharge={(rec) => navigate(`/vehicles/${v.id}/recharges/${rec.id}/edit`)}
      onDeleteRecharge={(rec) => onDeleteRecharge(v.id, rec.id)}
      onEditEntry={(e) => navigate(`/vehicles/${v.id}/entries/${e.id}/edit`)}
      onDeleteEntry={(e) => onDeleteEntry(v.id, e.id)}
      onTogglePin={(e) => onTogglePin(v.id, e.id)}
    />
  )
}

const RechargeFormRoute = ({
  db,
  settings,
  edit,
  onSave,
}: {
  db: DB
  settings: Settings
  edit?: boolean
  onSave: (vehicleId: string, rec: Vehicle['recharges'][number], isEdit: boolean) => void
}) => {
  const { id, recId } = useParams()
  const navigate = useNavigate()
  const v = db.vehicles.find((x) => x.id === id)
  if (!v) return <Navigate to="/" replace />
  const initial = edit ? (v.recharges ?? []).find((r) => r.id === recId) ?? null : null
  if (edit && !initial) return <Navigate to={`/vehicles/${id}`} replace />
  return (
    <RechargeForm
      vehicle={v}
      vehicles={db.vehicles}
      settings={settings}
      stations={db.stations ?? []}
      vehicleId={v.id}
      onVehicleChange={() => {}}
      onCancel={() => navigate(`/vehicles/${v.id}`)}
      onSave={(vid, rec) => onSave(vid, rec, !!initial)}
      showHeader
      initial={initial}
    />
  )
}

const EntryFormRoute = ({
  db,
  settings,
  edit,
  onSave,
}: {
  db: DB
  settings: Settings
  edit?: boolean
  onSave: (vehicleId: string, e: VehicleEntry, isEdit: boolean) => void
}) => {
  const { id, entryId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const L = settings.language
  const v = db.vehicles.find((x) => x.id === id)
  if (!v) return <Navigate to="/" replace />
  const initial = edit ? (v.entries ?? []).find((e) => e.id === entryId) ?? null : null
  if (edit && !initial) return <Navigate to={`/vehicles/${id}`} replace />
  const kind = initial?.kind ?? (search.get('kind') === 'expense' ? 'expense' : 'note')
  const back = () => goBack(navigate, `/vehicles/${v.id}`)
  const title = t(L, edit ? (kind === 'expense' ? 'editExpense' : 'editNote') : kind === 'expense' ? 'addExpense' : 'addNote')
  return (
    <>
      <Header title={title} onBack={back} />
      <EntryForm
        initial={initial}
        kind={kind}
        settings={settings}
        onCancel={back}
        onSave={(e) => onSave(v.id, e, !!initial)}
      />
    </>
  )
}

const QuickEntryRoute = ({
  db,
  settings,
  onSave,
}: {
  db: DB
  settings: Settings
  onSave: (vehicleId: string, e: VehicleEntry, isEdit: boolean) => void
}) => {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const L = settings.language
  const kind = search.get('kind') === 'expense' ? 'expense' : 'note'
  const [vehicleId, setVehicleId] = useState<string>(db.favoriteVehicleId ?? db.vehicles[0]?.id ?? '')
  const vehicle = db.vehicles.find((v) => v.id === vehicleId) ?? null
  if (db.vehicles.length === 0) return <Navigate to="/" replace />
  return (
    <>
      <Header title={t(L, kind === 'expense' ? 'addExpense' : 'addNote')} onBack={() => navigate('/')} />
      <EntryForm
        initial={null}
        kind={kind}
        settings={settings}
        vehicles={db.vehicles}
        vehicleId={vehicleId}
        onVehicleChange={setVehicleId}
        onCancel={() => navigate('/')}
        onSave={(e) => {
          if (vehicle) onSave(vehicle.id, e, false)
        }}
      />
    </>
  )
}

const QuickRechargeRoute = ({
  db,
  settings,
  onSave,
}: {
  db: DB
  settings: Settings
  onSave: (vehicleId: string, rec: Vehicle['recharges'][number], isEdit: boolean) => void
}) => {
  const navigate = useNavigate()
  const L = settings.language
  const [vehicleId, setVehicleId] = useState<string>(db.favoriteVehicleId ?? db.vehicles[0]?.id ?? '')
  const vehicle = db.vehicles.find((v) => v.id === vehicleId) ?? null
  if (db.vehicles.length === 0) return <Navigate to="/" replace />
  return (
    <>
      <Header title={t(L, 'addRecharge')} onBack={() => navigate('/')} />
      <RechargeForm
        vehicle={vehicle}
        vehicles={db.vehicles}
        settings={settings}
        stations={db.stations ?? []}
        vehicleId={vehicleId}
        onVehicleChange={setVehicleId}
        onCancel={() => navigate('/')}
        onSave={(vid, rec) => onSave(vid, rec, false)}
        showHeader={false}
      />
    </>
  )
}

export default App
