export type Lang = 'en' | 'es'
export type VehicleType = 'fuel' | 'electric' | 'hybrid'
export type StationKind = 'electric' | 'fuel' | 'both'
export type StationState = 'open' | 'maintenance' | 'closed' | 'unknown'
export type EntryKind = 'note' | 'expense'
export type TaskCategory = 'general' | 'document' | 'maintenance' | 'warranty'
export type TaskStatus = 'pending' | 'done' | 'cancelled'

// Vehicle task / reminder. Display-only: never feeds stats, no notifications.
export interface VehicleTask {
  id: string
  title: string
  details?: string
  category: TaskCategory
  dueDate?: string
  dueOdo?: number | null
  status: TaskStatus
}

// Journal note or expense record. Optional odo; pinned items render on top.
// ponytail: entries never feed consumption intervals — only recharges do.
export interface VehicleEntry {
  id: string
  date: string
  odo?: number | null
  kind: EntryKind
  text: string
  pinned?: boolean
  amount?: number
  expenseKindId?: string
}

// User-managed catalog entry (fuel grades, connectors). Stable ids survive
// renames; hidden items leave pickers but still resolve by id.
export interface CatalogItem {
  id: string
  label: string
  hidden?: boolean
}

export interface Station {
  id: string
  name: string
  kind: StationKind
  state: StationState
  connectorIds?: string[]
  fuelGradeIds?: string[]
}

export interface Recharge {
  id: string
  date: string
  odo: number
  amount: number
  pricePerUnit: number
  endLevel: number
  fullCharge: boolean
  notes?: string
  place?: string
  stationId?: string
  // Display-only (non-electric). Never enters stats.
  fuelGradeId?: string
  // Display-only (electric): level when the charge started. Never enters stats.
  startLevel?: number
}

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  // Tank / battery capacity. Used to auto-calculate amount when end level < 100.
  capacity: number
  // Electric vehicle battery degradation offset (e.g., 95% means 100% display = 95% of nominal capacity)
  batteryDegradation?: number
  // Additional vehicle info
  brand?: string
  model?: string
  year?: number
  color?: string
  licensePlate?: string
  // Default fuel grade for new records (fuel/hybrid). Display-only.
  fuelGradeId?: string
  // Supported connectors (electric). Display-only for now.
  connectorIds?: string[]
  recharges: Recharge[]
  entries?: VehicleEntry[]
  tasks?: VehicleTask[]
}

export interface DB {
  vehicles: Vehicle[]
  favoriteVehicleId: string | null
  stations: Station[]
}

export interface Settings {
  language: Lang
  currency: string
  distanceUnit: 'km'
  volumeUnit: 'L' | 'gal'
  energyUnit: 'kWh'
  fuelGrades: CatalogItem[]
  connectors: CatalogItem[]
  expenseKinds: CatalogItem[]
}