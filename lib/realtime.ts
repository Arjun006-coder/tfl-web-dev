import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnon)

export type VehicleDetection = {
  id: number
  intersection: string
  lane: 'north' | 'south' | 'east' | 'west'
  world_x: number | null
  world_y: number | null
  confidence: number | null
  detected_at: string | null
}

export type LightStatus = {
  id: number
  intersection: string
  lane: 'north' | 'south' | 'east' | 'west'
  color: 'red' | 'yellow' | 'green'
  duration: number
  updated_at: string
}

export function subscribeVehicles(onInsert: (row: VehicleDetection) => void) {
  return supabase
    .channel('vehicles')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_detections' }, (payload) => {
      onInsert(payload.new as VehicleDetection)
    })
    .subscribe()
}

export function subscribeLights(onInsert: (row: LightStatus) => void) {
  return supabase
    .channel('lights')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'light_status' }, (payload) => {
      onInsert(payload.new as LightStatus)
    })
    .subscribe()
}













