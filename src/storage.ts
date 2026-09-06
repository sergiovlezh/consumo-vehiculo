import type { DB, Settings } from './types'

const DB_KEY = 'vc.db.v1'
const SETTINGS_KEY = 'vc.settings.v1'

export const loadDB = (): DB => {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return { vehicles: [], favoriteVehicleId: null }
    const parsed = JSON.parse(raw) as Partial<DB>
    if (!parsed || !Array.isArray(parsed.vehicles)) {
      return { vehicles: [], favoriteVehicleId: null }
    }
    return {
      vehicles: parsed.vehicles,
      favoriteVehicleId: parsed.favoriteVehicleId ?? null,
    }
  } catch {
    return { vehicles: [], favoriteVehicleId: null }
  }
}

export const saveDB = (db: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

const getBrowserLanguage = (): 'en' | 'es' => {
  const lang = navigator.language?.toLowerCase() ?? 'es'
  return lang.startsWith('es') ? 'es' : 'en'
}

const getBrowserCurrency = (): string => {
  // Try to get currency from locale
  try {
    const formatter = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: 'USD',
    })
    const parts = formatter.formatToParts(1)
    const currencyPart = parts.find((p) => p.type === 'currency')
    if (currencyPart) return currencyPart.value
  } catch {}
  return 'COP'
}

const DEFAULT_SETTINGS: Settings = {
  language: getBrowserLanguage(),
  currency: getBrowserCurrency(),
  distanceUnit: 'km',
  volumeUnit: 'L',
  energyUnit: 'kWh',
}

export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const saveSettings = (s: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const galToL = (g: number) => g * 3.78541
export const lToGal = (l: number) => l / 3.78541

// Export both DB and Settings as a single JSON
export const exportAll = (db: DB, settings: Settings): string => {
  return JSON.stringify({ db, settings }, null, 2)
}

// Import both DB and Settings from JSON
export const importAll = (json: string): { db: DB; settings: Settings } | null => {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      db: parsed.db ?? { vehicles: [], favoriteVehicleId: null },
      settings: parsed.settings ?? DEFAULT_SETTINGS,
    }
  } catch {
    return null
  }
}
