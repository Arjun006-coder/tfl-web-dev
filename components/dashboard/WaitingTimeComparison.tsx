'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useStats } from '@/hooks/useStats'
import { useState, useEffect } from 'react'

// Normal average waiting time (baseline - traditional system)
const NORMAL_AVG_WAIT_TIME = 45 // seconds - typical fixed-time traffic light

export default function WaitingTimeComparison() {
  const stats = useStats()
  const [history, setHistory] = useState<Array<{
    time: string
    normal: number
    new: number
  }>>([])
  
  useEffect(() => {
    if (stats?.avg_wait_time !== undefined && stats.avg_wait_time !== null) {
      const now = new Date()
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      
      setHistory(prev => {
        const updated = [...prev, {
          time: timeStr,
          normal: NORMAL_AVG_WAIT_TIME,
          new: Math.round(stats.avg_wait_time)
        }]
        // Keep last 30 data points
        return updated.slice(-30)
      })
    }
  }, [stats?.avg_wait_time])
  
  const currentNormal = NORMAL_AVG_WAIT_TIME
  const currentNew = stats?.avg_wait_time ? Math.round(stats.avg_wait_time) : null
  const improvement = currentNew !== null ? ((currentNormal - currentNew) / currentNormal * 100) : 0
  
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white">Average Waiting Time Comparison</h2>
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-300">Normal System: {currentNormal}s</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-300">
            Our System: {currentNew !== null ? `${currentNew}s` : 'Calculating...'}
          </span>
        </div>
        {currentNew !== null && (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {improvement > 0 ? '↓' : '↑'} {Math.abs(improvement).toFixed(1)}% {improvement > 0 ? 'faster' : 'slower'}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #2a2a2a', 
              borderRadius: '8px', 
              color: '#f9fafb' 
            }} 
          />
          <Legend 
            wrapperStyle={{ color: '#9ca3af' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="normal" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            name="Normal System"
            strokeDasharray="5 5"
          />
          <Line 
            type="monotone" 
            dataKey="new" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={false}
            name="Our System"
          />
        </LineChart>
      </ResponsiveContainer>
      {history.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          Waiting for data to calculate average waiting time...
        </div>
      )}
    </div>
  )
}


