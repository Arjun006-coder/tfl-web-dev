'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow'
}

const colorClasses = {
  blue: 'text-blue-400 bg-blue-500/15',
  green: 'text-green-400 bg-green-500/15',
  red: 'text-red-400 bg-red-500/15',
  purple: 'text-purple-400 bg-purple-500/15',
  yellow: 'text-yellow-400 bg-yellow-500/15',
}

export function StatCard({ icon: Icon, label, value, unit = '', trend, color = 'blue' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  
  // Animated counter
  useEffect(() => {
    let start = displayValue
    let end = value
    let duration = 600
    let startTime: number | null = null
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(start + (end - start) * easeOutQuart))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="gradient-card rounded-xl p-6 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-1 text-xs font-medium ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '−'}
            </motion.div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <motion.p className="text-4xl font-bold text-white" key={displayValue}>
              {displayValue.toLocaleString()}
            </motion.p>
            {unit && <span className="text-xl text-gray-500 font-medium">{unit}</span>}
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
        color === 'blue' ? 'from-blue-500 to-cyan-500' :
        color === 'green' ? 'from-green-500 to-emerald-500' :
        color === 'red' ? 'from-red-500 to-pink-500' :
        color === 'purple' ? 'from-purple-500 to-pink-500' :
        'from-yellow-500 to-orange-500'
      } opacity-50`} />
    </motion.div>
  )
}

