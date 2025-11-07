'use client'

import { Badge } from '@/components/ui/Badge'
import { useLightStatus } from '@/hooks/useLightStatus'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle } from 'lucide-react'

// Only show intersection 1
const lanes = [
  { intersection: 'int1', lane: 'north', label: 'Intersection 1 - North' },
  { intersection: 'int1', lane: 'south', label: 'Intersection 1 - South' },
  { intersection: 'int1', lane: 'east', label: 'Intersection 1 - East' },
  { intersection: 'int1', lane: 'west', label: 'Intersection 1 - West' },
]

function CountdownTimer({ duration, color, updatedAt }: { duration: number; color: string; updatedAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(duration || 0)
  const startTimeRef = useRef<number | null>(null)
  const durationRef = useRef<number>(duration || 0)
  
  useEffect(() => {
    // Update duration ref when it changes
    durationRef.current = duration || 0
    
    // Reset when duration or updatedAt changes
    if (duration > 0 && duration <= 120) {
      // Use updatedAt if available, otherwise use current time as start
      if (updatedAt) {
        try {
          const updateTime = new Date(updatedAt).getTime()
          if (!isNaN(updateTime) && updateTime > 0) {
            startTimeRef.current = updateTime
            console.log(`[Countdown] ${color} - updatedAt: ${updatedAt}, duration: ${duration}, startTime: ${new Date(updateTime).toISOString()}`)
          } else {
            startTimeRef.current = Date.now()
            console.log(`[Countdown] ${color} - Invalid updatedAt, using now, duration: ${duration}`)
          }
        } catch (e) {
          startTimeRef.current = Date.now()
          console.log(`[Countdown] ${color} - Error parsing updatedAt, using now, duration: ${duration}`)
        }
      } else {
        startTimeRef.current = Date.now()
        console.log(`[Countdown] ${color} - No updatedAt, using now, duration: ${duration}`)
      }
      
      const updateTimer = () => {
        if (startTimeRef.current && durationRef.current > 0) {
          const now = Date.now()
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
          const remaining = Math.max(0, durationRef.current - elapsed)
          setTimeLeft(remaining)
        } else {
          setTimeLeft(durationRef.current)
        }
      }
      
      // Update immediately
      updateTimer()
      
      // Update every 100ms for smooth countdown
      const interval = setInterval(updateTimer, 100)
      return () => clearInterval(interval)
    } else {
      setTimeLeft(0)
      console.log(`[Countdown] ${color} - Invalid duration: ${duration}`)
    }
  }, [duration, updatedAt, color])
  
  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0
  return (
    <div className="relative">
      <div className="text-3xl font-bold font-mono text-white">{timeLeft}s</div>
      <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
        <motion.div
          className={`h-full ${
            color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

export default function LightStatusPanel() {
  const lightStatus = useLightStatus()
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-red-500 rounded-full" />
        <h2 className="text-2xl font-bold text-white">Traffic Light Status</h2>
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {lanes.map(({ intersection, lane, label }) => {
            const key = `${intersection}-${lane}`
            const status = lightStatus[key]
            const colorClass = status?.color === 'green'
              ? 'border-green-500/30 bg-green-500/5'
              : status?.color === 'yellow'
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-red-500/30 bg-red-500/5'
            const glowClass = status?.color === 'green'
              ? 'glow-border-green'
              : status?.color === 'yellow'
              ? 'glow-border-yellow'
              : 'glow-border-red'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`gradient-card neon-panel rounded-lg p-4 border-l-4 ${colorClass} ${status?.color === 'green' ? glowClass : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-3">
                      <Circle className={`w-5 h-5 ${
                        status?.color === 'green' ? 'text-green-500 fill-green-500' :
                        status?.color === 'yellow' ? 'text-yellow-500 fill-yellow-500' :
                        'text-red-500 fill-red-500'
                      } ${status?.color === 'green' ? 'animate-pulse' : ''}`} />
                      <Badge variant={status?.color === 'green' ? 'green' : status?.color === 'yellow' ? 'yellow' : 'red'}>
                        <span className="font-bold text-xs">{status?.color?.toUpperCase() || 'RED'}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
                    {status?.duration && status.duration > 0 ? (
                      <CountdownTimer 
                        duration={status.duration} 
                        color={status?.color || 'red'} 
                        updatedAt={status?.updatedAt}
                      />
                    ) : (
                      <div className="text-3xl font-bold font-mono text-white">0s</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

