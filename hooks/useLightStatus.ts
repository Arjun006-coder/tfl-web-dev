'use client'

import { useState, useEffect } from 'react'
import { supabase, LightStatus } from '@/lib/supabase'

type LightStatusMap = Record<string, {
  color: 'red' | 'yellow' | 'green'
  duration: number
  reason?: string
  updatedAt?: string
}>

export function useLightStatus() {
  const [data, setData] = useState<LightStatusMap>({})
  
  useEffect(() => {
    // Fetch initial
    const fetchInitial = async () => {
      try {
        const { data: lights, error } = await supabase
          .from('light_status')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(8)
        
        if (error) {
          console.error('Error fetching light status:', error)
          return
        }
        
        const grouped: LightStatusMap = {}
        lights?.forEach((light: LightStatus) => {
          const key = `${light.intersection}-${light.lane}`
          grouped[key] = {
            color: light.color,
            duration: light.duration,
            reason: light.reason,
            updatedAt: light.updated_at || light.created_at
          }
        })
        
        setData(grouped)
      } catch (err) {
        console.error('Error in fetchInitial:', err)
      }
    }
    
    fetchInitial()
    
    // Real-time subscription - listen for INSERT and UPDATE
    const channel = supabase
      .channel('light-status-channel', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'light_status'
        },
        (payload) => {
          console.log('Light status update received:', payload)
          const newData = payload.new as LightStatus
          if (!newData) return
          
          const key = `${newData.intersection}-${newData.lane}`
          
          setData(prev => ({
            ...prev,
            [key]: {
              color: newData.color,
              duration: newData.duration,
              reason: newData.reason,
              updatedAt: newData.updated_at || newData.created_at
            }
          }))
        }
      )
      .subscribe((status) => {
        console.log('Light status subscription status:', status)
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return data
}









