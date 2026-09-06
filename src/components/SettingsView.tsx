import { useRef, useState } from 'react'
import { t } from '../i18n'
import { exportAll, importAll, uid } from '../storage'
import type { CatalogItem, DB, Lang, Settings } from '../types'
import { Button, Field, Segmented, StateDot } from './ui'

// ponytail: one editor reused for fuel grades and connectors. Hidden keeps old
// refs resolving; true delete renders dangling refs as '—'.
const CatalogEditor = ({
  title,
  items,
  onChange,
  lang,
}: {
  title: string
  items: CatalogItem[]
  onChange: (items: CatalogItem[]) => void
  lang: Lang
}) => {
  const [draft, setDraft] = useState('')
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            value={item.label}
            onChange={(e) =>
              onChange(items.map((x) => (x.id === item.id ? { ...x, label: e.target.value } : x)))
            }
            className="flex-1 min-w-0 rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          />
          <label className="flex items-center gap-1 text-sm text-slate-600 whitespace-nowrap">
            <input
              type="checkbox"
              checked={!!item.hidden}
              onChange={(e) =>
                onChange(items.map((x) => (x.id === item.id ? { ...x, hidden: e.target.checked || undefined } : x)))
              }
              className="h-5 w-5"
            />
            {t(lang, 'hide')}
          </label>
          <button
            onClick={() => {
              if (window.confirm(t(lang, 'confirmDelete'))) {
                onChange(items.filter((x) => x.id !== item.id))
              }
            }}
            className="rounded-full p-2 text-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600"
            aria-label={t(lang, 'delete')}
          >
            🗑
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 min-w-0 rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
        />
        <Button
          onClick={() => {
            if (!draft.trim()) return
            onChange([...items, { id: uid(), label: draft.trim() }])
            setDraft('')
          }}
          className="min-h-[44px] flex-none"
        >
          {t(lang, 'add')}
        </Button>
      </div>
    </div>
  )
}

export const SettingsView = ({
  settings,
  onChange,
  db,
  onImport,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onAddStation,
  onEditStation,
  onDeleteStation,
}: {
  settings: Settings
  onChange: (s: Settings) => void
  db: DB
  onImport: (parsed: DB, settings: Settings) => void
  onAddVehicle: () => void
  onEditVehicle: (id: string) => void
  onDeleteVehicle: (id: string) => void
  onAddStation: () => void
  onEditStation: (id: string) => void
  onDeleteStation: (id: string) => void
}) => {
  const L = settings.language
  const [showExport, setShowExport] = useState(false)
  const [importText, setImportText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const exportAllData = (() => {
    try {
      return exportAll(db, settings)
    } catch {
      return '{}'
    }
  })()

  const doImport = () => {
    try {
      const parsed = importAll(importText)
      if (parsed) {
        onImport(parsed.db, parsed.settings)
      } else {
        // Fallback: try to parse as DB only (old format)
        const parsedDb = JSON.parse(importText) as DB
        if (!parsedDb || !Array.isArray(parsedDb.vehicles)) throw new Error('bad')
        onImport(parsedDb, settings)
      }
      alert(t(L, 'imported'))
      setImportText('')
    } catch {
      alert(t(L, 'invalidJson'))
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">{t(L, 'manageVehicles')}</h2>
        {db.vehicles.length === 0 ? (
          <div className="text-sm text-slate-500">{t(L, 'noVehicles')}</div>
        ) : (
          db.vehicles.map((v) => {
            const isFav = v.id === db.favoriteVehicleId
            return (
              <div key={v.id} className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onEditVehicle(v.id)}
                  className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50 min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    {isFav ? <span className="text-amber-500">★</span> : <span className="text-slate-300">☆</span>}
                    <span className="font-medium">{v.name}</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t(L, 'confirmDelete'))) {
                      onDeleteVehicle(v.id)
                    }
                  }}
                  className="rounded-xl border border-red-300 text-red-600 px-3 py-2 text-sm min-h-[44px]"
                >
                  {t(L, 'delete')}
                </button>
              </div>
            )
          })
        )}
        <Button onClick={onAddVehicle} className="min-h-[44px]">
          {t(L, 'addVehicle')}
        </Button>
      </div>

      <CatalogEditor
        title={t(L, 'fuelType')}
        items={settings.fuelGrades}
        onChange={(fuelGrades) => onChange({ ...settings, fuelGrades })}
        lang={L}
      />

      <CatalogEditor
        title={t(L, 'connectors')}
        items={settings.connectors}
        onChange={(connectors) => onChange({ ...settings, connectors })}
        lang={L}
      />

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">{t(L, 'manageStations')}</h2>
        {(db.stations ?? []).length === 0 ? (
          <div className="text-sm text-slate-500">{t(L, 'noStations')}</div>
        ) : (
          (db.stations ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <button
                onClick={() => onEditStation(s.id)}
                className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50 min-h-[44px]"
              >
                <StateDot state={s.state} />
                <span className="font-medium truncate">{s.name}</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t(L, 'confirmDelete'))) {
                    onDeleteStation(s.id)
                  }
                }}
                className="rounded-xl border border-red-300 text-red-600 px-3 py-2 text-sm min-h-[44px]"
              >
                {t(L, 'delete')}
              </button>
            </div>
          ))
        )}
        <Button onClick={onAddStation} className="min-h-[44px]">
          {t(L, 'addStation')}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <Field label={t(L, 'language')}>
          <Segmented
            value={L as Lang}
            onChange={(v) => onChange({ ...settings, language: v })}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
            ]}
          />
        </Field>
        <Field label={t(L, 'currency')}>
          <input
            value={settings.currency}
            onChange={(e) =>
              onChange({ ...settings, currency: e.target.value.toUpperCase().slice(0, 3) })
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px]"
          />
        </Field>
        <Field label={`${t(L, 'volumeUnit')} (L / gal)`}>
          <Segmented
            value={settings.volumeUnit}
            onChange={(v) => onChange({ ...settings, volumeUnit: v })}
            options={[
              { value: 'L', label: 'L' },
              { value: 'gal', label: 'gal' },
            ]}
          />
        </Field>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <button
          onClick={() => setShowExport((s) => !s)}
          className="w-full rounded-xl border border-slate-300 py-3 min-h-[44px]"
        >
          {t(L, 'exportData')}
        </button>
        {showExport ? (
          <div>
            <p className="mb-1 text-xs text-slate-500">{t(L, 'exportedHint')}</p>
            <textarea
              readOnly
              value={exportAllData}
              className="h-40 w-full rounded-xl border border-slate-300 p-2 font-mono text-xs"
            />
          </div>
        ) : null}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border border-slate-300 py-3 min-h-[44px]"
        >
          {t(L, 'importData')}…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {importText ? (
          <div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="h-32 w-full rounded-xl border border-slate-300 p-2 font-mono text-xs"
            />
            <Button onClick={doImport} className="min-h-[44px]">
              {t(L, 'importData')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
