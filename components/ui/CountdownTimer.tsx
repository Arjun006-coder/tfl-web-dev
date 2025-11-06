'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  duration: number
  color: string
}

export function CountdownTimer({ duration, color }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  
  useEffect(() => {
    setTimeLeft(duration)
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [duration])
  
  return (
    <span className="text-2xl font-mono font-bold">
      {timeLeft}s
    </span>
  )
}









