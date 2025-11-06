'use client'

import dynamic from 'next/dynamic'
import EmergencyAlert from '@/components/dashboard/EmergencyAlert'
import StatsPanel from '@/components/dashboard/StatsPanel'
import LightStatusPanel from '@/components/dashboard/LightStatusPanel'
import DecisionLogic from '@/components/dashboard/DecisionLogic'
import TrafficFlowGraph from '@/components/dashboard/TrafficFlowGraph'
import WaitingTimeComparison from '@/components/dashboard/WaitingTimeComparison'
import { Activity } from 'lucide-react'

// Load 3D scene only on client (prevents SSR issues with Three.js)
const TrafficScene3D = dynamic(
  () => import('@/components/dashboard/TrafficScene3D'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <div className="text-gray-400 text-sm">Loading 3D Scene...</div>
        </div>
      </div>
    )
  }
)

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#202739] via-[#1a2230] to-[#202739] text-white">
      {/* Header */}
      <header className="glass-effect border-b border-gray-700/50 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Smart Traffic Management System</h1>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Real-time AI-powered traffic control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 pulse-glow" />
            <span className="text-sm font-semibold text-green-500">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>
      {/* Emergency Alert Banner - Only shows when emergency active */}
      <EmergencyAlert />
      
      {/* Main Layout: 60% 3D Scene | 40% Panels */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left: 3D Visualization */}
        <div className="w-full lg:w-[60%] h-[50vh] lg:h-full border-r border-gray-700/50 radial-canvas">
          <div className="relative z-10 h-full">
            <TrafficScene3D />
          </div>
        </div>
        
        {/* Right: Information Panels */}
        <div className="w-full lg:w-[40%] h-[50vh] lg:h-full overflow-y-auto bg-gradient-to-b from-[#1a1f2e] to-[#151a27]">
          <div className="p-6 space-y-8">
            <StatsPanel />
            <LightStatusPanel />
            <DecisionLogic />
            <WaitingTimeComparison />
            <TrafficFlowGraph />
          </div>
        </div>
      </div>
    </div>
  )
}
