'use client'

import { useState, useEffect } from 'react'
import { supabase, EmergencyEvent } from '@/lib/supabase'

export function useEmergencyEvents() {
  const [data, setData] = useState<EmergencyEvent[]>([])
  
  useEffect(() => {
    // Fetch initial active emergencies
    const fetchInitial = async () => {
      const { data: emergencies } = await supabase
        .from('emergency_events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      setData(emergencies || [])
    }
    
    fetchInitial()
    
    // Subscribe to changes
    const channel = supabase
      .channel('emergency-events-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_events'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEmergency = payload.new as EmergencyEvent
            if (newEmergency.status === 'active') {
              setData(prev => [...prev, newEmergency])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as EmergencyEvent
            if (updated.status === 'cleared') {
              setData(prev => prev.filter(e => e.id !== updated.id))
            }
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return data
}









