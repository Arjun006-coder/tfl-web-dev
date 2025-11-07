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
            updatedAt: light.updated_at
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
          table: 'light_status',
          filter: 'intersection=eq.int1'  // Only listen to int1 for now
        },
        (payload) => {
          console.log('Light status update received:', payload)
          const newData = payload.new as LightStatus
          if (!newData) {
            // Handle DELETE events
            if (payload.eventType === 'DELETE' && payload.old) {
              const oldData = payload.old as LightStatus
              const key = `${oldData.intersection}-${oldData.lane}`
              setData(prev => {
                const updated = { ...prev }
                delete updated[key]
                return updated
              })
            }
            return
          }
          
          const key = `${newData.intersection}-${newData.lane}`
          
          setData(prev => ({
            ...prev,
            [key]: {
              color: newData.color,
              duration: newData.duration,
              reason: newData.reason,
              updatedAt: newData.updated_at || new Date().toISOString()  // Fallback to now if missing
            }
          }))
        }
      )
      .subscribe((status) => {
        console.log('Light status subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to light status updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to light status updates')
        }
      })
    
    // Also poll every 2 seconds as backup for real-time updates
    const pollInterval = setInterval(async () => {
      try {
        const { data: lights, error } = await supabase
          .from('light_status')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(8)
        
        if (!error && lights) {
          const grouped: LightStatusMap = {}
          lights.forEach((light: LightStatus) => {
            const key = `${light.intersection}-${light.lane}`
            grouped[key] = {
              color: light.color,
              duration: light.duration,
              reason: light.reason,
              updatedAt: light.updated_at
            }
          })
          setData(prev => ({ ...prev, ...grouped }))
        }
      } catch (err) {
        console.error('Error polling light status:', err)
      }
    }, 2000)
    
    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [])
  
  return data
}









