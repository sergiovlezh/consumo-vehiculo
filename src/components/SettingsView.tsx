import { useRef, useState } from 'react'
import { t } from '../i18n'
import { exportAll, importAll } from '../storage'
import type { DB, Lang, Settings } from '../types'
import { Button, Field, Segmented } from './ui'

export const SettingsView = ({
  settings,
  onChange,
  db,
  onImport,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: {
  settings: Settings
  onChange: (s: Settings) => void
  db: DB
  onImport: (parsed: DB, settings: Settings) => void
  onAddVehicle: () => void
  onEditVehicle: (id: string) => void
  onDeleteVehicle: (id: string) => void
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
