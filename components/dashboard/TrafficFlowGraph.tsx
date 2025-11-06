'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useVehicleDetections } from '@/hooks/useVehicleDetections'
import { useState, useEffect } from 'react'

export default function TrafficFlowGraph() {
  const vehicleData = useVehicleDetections()
  const [history, setHistory] = useState<Array<{time: string, count: number}>>([])
  
  useEffect(() => {
    const total = Object.values(vehicleData).reduce((sum, lane) => 
      sum + (lane?.cars || 0) + (lane?.bikes || 0) + (lane?.buses || 0) + (lane?.trucks || 0), 
      0
    )
    
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    
    setHistory(prev => {
      const updated = [...prev, { time: timeStr, count: total }]
      return updated.slice(-60)
    })
  }, [vehicleData])
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white">Traffic Flow</h2>
      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f9fafb' }} />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

