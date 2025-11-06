'use client'

import { useEmergencyEvents } from '@/hooks/useEmergencyEvents'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Ambulance, Flame, ShieldAlert, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function EmergencyAlert() {
  const emergencies = useEmergencyEvents()
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  
  const activeEmergencies = emergencies.filter(e => !dismissed.has(e.id))
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'ambulance': return <Ambulance className="w-6 h-6" />
      case 'fire': return <Flame className="w-6 h-6" />
      case 'police': return <ShieldAlert className="w-6 h-6" />
      default: return <AlertTriangle className="w-6 h-6" />
    }
  }
  
  return (
    <AnimatePresence>
      {activeEmergencies.map(emergency => (
        <motion.div
          key={emergency.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white px-8 py-5 flex items-center justify-between shadow-2xl"
          style={{ boxShadow: '0 10px 40px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.3)' }}
        >
          <div className="flex items-center gap-4">
            {getIcon(emergency.type)}
            <div>
              <p className="font-bold text-lg">
                🚨 {emergency.type.toUpperCase()} APPROACHING
              </p>
              <p className="text-sm opacity-90">
                {emergency.intersection?.toUpperCase()} - {emergency.lane} Lane - {emergency.distance}m away
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(emergency.id))}
            className="hover:bg-red-600 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

