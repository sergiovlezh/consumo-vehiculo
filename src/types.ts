export type Lang = 'en' | 'es'
export type VehicleType = 'fuel' | 'electric' | 'hybrid'

export interface Recharge {
  id: string
  date: string
  odo: number
  amount: number
  pricePerUnit: number
  endLevel: number
  fullCharge: boolean
  notes?: string
  // Manual correction fields
  manualStart?: boolean
  startOdo?: number
  startLevel?: number
  fullTankAmount?: number
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
  recharges: Recharge[]
}

export interface DB {
  vehicles: Vehicle[]
  favoriteVehicleId: string | null
}

export interface Settings {
  language: Lang
  currency: string
  distanceUnit: 'km'
  volumeUnit: 'L' | 'gal'
  energyUnit: 'kWh'
}
