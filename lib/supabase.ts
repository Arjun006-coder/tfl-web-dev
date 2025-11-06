import { createClient } from '@supabase/supabase-js'

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for database tables
export interface EmergencyEvent {
  id: string
  type: string
  intersection: string
  lane: string
  distance?: number
  status: 'active' | 'cleared'
  priority?: number
  created_at: string
}

export interface VehicleDetection {
  id: string
  intersection: string
  lane: string
  cars: number
  bikes: number
  buses: number
  trucks: number
  pedestrians: number
  camera_rotation?: number
  track_id?: string
  raw_bboxes?: Array<{
    class: string
    x1: number
    y1: number
    x2: number
    y2: number
    conf: number
  }>
  world_x?: number  // Normalized 0-1 or meters
  world_y?: number  // Normalized 0-1 or meters
  speed_mps?: number
  confidence?: number
  frame_id?: string
  created_at: string
}

export interface LightStatus {
  id: string
  intersection: string
  lane: string
  color: 'red' | 'yellow' | 'green'
  duration: number
  reason?: string
  updated_at: string
}

