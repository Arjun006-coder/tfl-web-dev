'use client'

import { Car, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { useVehicleDetections } from '@/hooks/useVehicleDetections'
import { useEmergencyEvents } from '@/hooks/useEmergencyEvents'
import { useStats } from '@/hooks/useStats'
import { motion } from 'framer-motion'

export default function StatsPanel() {
  const vehicleData = useVehicleDetections()
  const emergencies = useEmergencyEvents()
  const stats = useStats()
  
  // Calculate total vehicles currently in system
  const totalVehicles = Object.values(vehicleData).reduce((sum, lane) => 
    sum + (lane?.cars || 0) + (lane?.bikes || 0) + (lane?.buses || 0) + (lane?.trucks || 0), 
    0
  )
  
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
        <h2 className="text-2xl font-bold text-white">System Statistics</h2>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow" />
          <span className="text-xs text-green-500 font-medium">LIVE</span>
        </div>
      </div>
      <motion.div 
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <StatCard
          icon={Car}
          label="Vehicles in System"
          value={totalVehicles}
          trend="up"
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Emergencies"
          value={emergencies.length}
          trend={emergencies.length > 0 ? 'up' : 'neutral'}
          color="red"
        />
        <StatCard
          icon={Clock}
          label="Avg Wait Time"
          value={Math.round(stats?.avg_wait_time || 0)}
          unit="s"
          trend="down"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Vehicles Today"
          value={stats?.total_vehicles_today || 0}
          trend="up"
          color="purple"
        />
      </motion.div>
    </div>
  )
}

