'use client'

import { useState, useEffect } from 'react'
import { supabase, VehicleDetection } from '@/lib/supabase'

export interface VehicleTrack {
  id: string
  track_id: string
  intersection: string
  lane: string
  world_x: number  // Normalized 0-1 or meters
  world_y: number  // Normalized 0-1 or meters
  vehicleType: 'car' | 'bike' | 'bus' | 'truck' | 'emergency'
  raw_bboxes?: Array<{
    class: string
    x1: number
    y1: number
    x2: number
    y2: number
    conf: number
  }>
  speed_mps?: number
  confidence?: number
  created_at: string
}

type VehicleTracksMap = Record<string, VehicleTrack[]>  // key: intersection-lane

/**
 * Hook to fetch individual vehicle tracks with world coordinates
 * Returns vehicles positioned by world_x/world_y instead of lane counts
 */
export function useVehicleTracks() {
  const [tracks, setTracks] = useState<VehicleTracksMap>({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // Fetch detections with world coordinates and track_id
        const nowIso = new Date(Date.now() - 30_000).toISOString()
        const { data: detections, error } = await supabase
          .from('vehicle_detections')
          .select('*')
          .not('world_x', 'is', null)  // Only get vehicles with world coordinates
          .not('world_y', 'is', null)
          .not('track_id', 'is', null)
          .gte('created_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(50)  // Reduced limit to prevent lag
        
        if (error) throw error
        
        // Group by intersection-lane and convert to tracks
        const grouped: VehicleTracksMap = {}
        
        detections?.forEach((det: VehicleDetection) => {
          if (!det.world_x || !det.world_y || !det.track_id) return
          
          const key = `${det.intersection}-${det.lane}`
          
          // Determine vehicle type from raw_bboxes or aggregate counts
          let vehicleType: VehicleTrack['vehicleType'] = 'car'
          
          if (det.raw_bboxes && det.raw_bboxes.length > 0) {
            const firstBbox = det.raw_bboxes[0]
            const vehicleClass = firstBbox.class.toLowerCase()
            
            if (vehicleClass === 'emergency' || vehicleClass.includes('ambulance') || 
                vehicleClass.includes('fire') || vehicleClass.includes('police')) {
              vehicleType = 'emergency'
            } else if (vehicleClass === 'bus') {
              vehicleType = 'bus'
            } else if (vehicleClass === 'truck') {
              vehicleType = 'truck'
            } else if (vehicleClass === 'bike' || vehicleClass === 'motorcycle') {
              vehicleType = 'bike'
            } else {
              vehicleType = 'car'
            }
          } else {
            // Fallback to aggregate counts
            if (det.buses > 0) vehicleType = 'bus'
            else if (det.trucks > 0) vehicleType = 'truck'
            else if (det.bikes > 0) vehicleType = 'bike'
            else vehicleType = 'car'
          }
          
          const track: VehicleTrack = {
            id: det.id,
            track_id: det.track_id,
            intersection: det.intersection,
            lane: det.lane,
            world_x: det.world_x,
            world_y: det.world_y,
            vehicleType,
            raw_bboxes: det.raw_bboxes,
            speed_mps: det.speed_mps,
            confidence: det.confidence,
            created_at: det.created_at
          }
          
          if (!grouped[key]) {
            grouped[key] = []
          }
          
          // Only keep latest track for each track_id per lane
          const existingIndex = grouped[key].findIndex(t => t.track_id === track.track_id)
          if (existingIndex >= 0) {
            // Update if this one is newer
            if (new Date(track.created_at) > new Date(grouped[key][existingIndex].created_at)) {
              grouped[key][existingIndex] = track
            }
          } else {
            grouped[key].push(track)
          }
        })
        
        console.log(`Fetched ${Object.values(grouped).flat().length} vehicle tracks from database`)
        setTracks(grouped)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching vehicle tracks:', err)
        setLoading(false)
      }
    }
    
    fetchTracks()
    
    // Subscribe to real-time updates with proper status handling
    const channel = supabase
      .channel('vehicle-tracks-channel', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_detections'
        },
        (payload) => {
          console.log('Vehicle detection INSERT received:', payload)
          const newData = payload.new as VehicleDetection
          
          // Only process if it has world coordinates and track_id
          if (!newData.world_x || !newData.world_y || !newData.track_id) {
            return
          }
          
          const key = `${newData.intersection}-${newData.lane}`
          // Ignore stale rows older than 30s
          try {
            const isRecent = new Date(newData.created_at).getTime() >= Date.now() - 30_000
            if (!isRecent) return
          } catch {}
          
          // Determine vehicle type
          let vehicleType: VehicleTrack['vehicleType'] = 'car'
          if (newData.raw_bboxes && newData.raw_bboxes.length > 0) {
            const firstBbox = newData.raw_bboxes[0]
            const vehicleClass = firstBbox.class.toLowerCase()
            
            if (vehicleClass === 'emergency' || vehicleClass.includes('ambulance') || 
                vehicleClass.includes('fire') || vehicleClass.includes('police')) {
              vehicleType = 'emergency'
            } else if (vehicleClass === 'bus') vehicleType = 'bus'
            else if (vehicleClass === 'truck') vehicleType = 'truck'
            else if (vehicleClass === 'bike' || vehicleClass === 'motorcycle') vehicleType = 'bike'
          }
          
          const track: VehicleTrack = {
            id: newData.id,
            track_id: newData.track_id,
            intersection: newData.intersection,
            lane: newData.lane,
            world_x: newData.world_x,
            world_y: newData.world_y,
            vehicleType,
            raw_bboxes: newData.raw_bboxes,
            speed_mps: newData.speed_mps,
            confidence: newData.confidence,
            created_at: newData.created_at
          }
          
          setTracks(prev => {
            const updated = { ...prev }
            if (!updated[key]) updated[key] = []
            
            // Update or add track
            const existingIndex = updated[key].findIndex(t => t.track_id === track.track_id)
            if (existingIndex >= 0) {
              // Update existing track
              updated[key][existingIndex] = track
            } else {
              // Add new track
              updated[key].push(track)
            }
            
            console.log('Updated tracks:', updated)
            return updated
          })
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status)
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return { tracks, loading }
}

