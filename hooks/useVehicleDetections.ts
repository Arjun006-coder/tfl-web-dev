'use client'

import { useState, useEffect } from 'react'
import { supabase, VehicleDetection } from '@/lib/supabase'

type VehicleData = {
  cars: number
  bikes: number
  buses: number
  trucks: number
  pedestrians: number
}

type VehicleDataMap = Record<string, VehicleData>

export function useVehicleDetections() {
  const [data, setData] = useState<VehicleDataMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Fetch initial data
    const fetchInitial = async () => {
      try {
        const nowIso = new Date(Date.now() - 30_000).toISOString()
        const { data: detections, error } = await supabase
          .from('vehicle_detections')
          .select('*')
          .gte('created_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(8) // Latest for each of 8 lanes
        
        if (error) throw error
        
        // Group by intersection-lane
        const grouped: VehicleDataMap = {}
        detections?.forEach((det: VehicleDetection) => {
          const key = `${det.intersection}-${det.lane}`
          if (!grouped[key] || new Date(det.created_at) > new Date((grouped[key] as any).created_at || 0)) {
            grouped[key] = {
              cars: det.cars,
              bikes: det.bikes,
              buses: det.buses,
              trucks: det.trucks,
              pedestrians: det.pedestrians
            }
          }
        })
        
        setData(grouped)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }
    
    fetchInitial()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('vehicle-detections-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_detections'
        },
        (payload) => {
          const newData = payload.new as VehicleDetection
          const key = `${newData.intersection}-${newData.lane}`
          // Ignore stale rows older than 30s
          try {
            const isRecent = new Date(newData.created_at).getTime() >= Date.now() - 30_000
            if (!isRecent) return
          } catch {}
          
          setData(prev => ({
            ...prev,
            [key]: {
              cars: newData.cars,
              bikes: newData.bikes,
              buses: newData.buses,
              trucks: newData.trucks,
              pedestrians: newData.pedestrians
            }
          }))
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return data
}









