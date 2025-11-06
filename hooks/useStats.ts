'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = {
  total_vehicles_today: number
  avg_wait_time: number
  emergencies_handled: number
  accidents_detected: number
  fuel_saved_estimate: number
}

export function useStats() {
  const [data, setData] = useState<Stats | null>(null)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: stats, error } = await supabase
          .from('stats')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()  // Use maybeSingle() instead of single() - returns null if no rows
        
        if (error || !stats) {
          // Stats table might not exist or be empty - return default values
          if (error) {
            console.warn('Stats table error:', error.message)
          }
          setData({
            total_vehicles_today: 0,
            avg_wait_time: 0,
            emergencies_handled: 0,
            accidents_detected: 0,
            fuel_saved_estimate: 0
          })
          return
        }
        
        setData(stats)
      } catch (err) {
        // Handle network errors gracefully
        console.warn('Error fetching stats:', err)
        setData({
          total_vehicles_today: 0,
          avg_wait_time: 0,
          emergencies_handled: 0,
          accidents_detected: 0,
          fuel_saved_estimate: 0
        })
      }
    }
    
    fetchStats()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return data
}









