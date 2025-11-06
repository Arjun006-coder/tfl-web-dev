'use client'

import { useState, useEffect } from 'react'
import { supabase, LightStatus } from '@/lib/supabase'

type LightStatusMap = Record<string, {
  color: 'red' | 'yellow' | 'green'
  duration: number
  reason?: string
}>

export function useLightStatus() {
  const [data, setData] = useState<LightStatusMap>({})
  
  useEffect(() => {
    // Fetch initial
    const fetchInitial = async () => {
      const { data: lights } = await supabase
        .from('light_status')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(8)
      
      const grouped: LightStatusMap = {}
      lights?.forEach((light: LightStatus) => {
        const key = `${light.intersection}-${light.lane}`
        grouped[key] = {
          color: light.color,
          duration: light.duration,
          reason: light.reason
        }
      })
      
      setData(grouped)
    }
    
    fetchInitial()
    
    // Real-time subscription
    const channel = supabase
      .channel('light-status-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'light_status'
        },
        (payload) => {
          const newData = payload.new as LightStatus
          const key = `${newData.intersection}-${newData.lane}`
          
          setData(prev => ({
            ...prev,
            [key]: {
              color: newData.color,
              duration: newData.duration,
              reason: newData.reason
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









