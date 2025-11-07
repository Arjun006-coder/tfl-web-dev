'use client'

import { useLightStatus } from '@/hooks/useLightStatus'
import { motion, AnimatePresence } from 'framer-motion'

export default function DecisionLogic() {
  const lightStatus = useLightStatus()
  
  const activeLanes = Object.entries(lightStatus).filter(
    ([_, status]) => status?.color === 'green'
  )
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white">Decision Logic</h2>
      <div className="space-y-4">
        <AnimatePresence>
          {activeLanes.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 text-center text-gray-400">
              No active green lights - system calculating...
            </div>
          ) : (
            activeLanes.map(([key, status]) => {
              const [intersection, lane] = key.split('-')
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">
                      {intersection.toUpperCase()} - {lane.charAt(0).toUpperCase() + lane.slice(1)}
                    </h3>
                    <span className="text-2xl font-bold text-green-500">
                      {status.updatedAt ? (
                        (() => {
                          try {
                            const updateTime = new Date(status.updatedAt).getTime()
                            const now = Date.now()
                            const elapsed = Math.floor((now - updateTime) / 1000)
                            const remaining = Math.max(0, status.duration - elapsed)
                            return remaining > 0 && status.duration <= 120 ? `${remaining}s` : 'ACTIVE'
                          } catch {
                            return 'ACTIVE'
                          }
                        })()
                      ) : 'ACTIVE'} GREEN
                    </span>
                  </div>
                  
                  {status.reason ? (
                    <div className="space-y-1 text-sm text-gray-300">
                      {status.reason.split('\n').map((line, i) => (
                        <p key={i} className="flex items-center gap-2">
                          {line.includes('Base') && '📏'}
                          {line.includes('car') && '🚗'}
                          {line.includes('bike') && '🏍️'}
                          {line.includes('bus') && '🚌'}
                          {line.includes('truck') && '🚛'}
                          <span>{line}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Standard timing applied</p>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

