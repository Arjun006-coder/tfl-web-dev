'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import Intersection from '@/components/scene/Intersection'
import { useVehicleDetections } from '@/hooks/useVehicleDetections'
import { useVehicleTracks } from '@/hooks/useVehicleTracks'
import { useLightStatus } from '@/hooks/useLightStatus'
import { useDebounce } from '@/hooks/useDebounce'
import WorldVehicle from '@/components/scene/WorldVehicle'

export default function TrafficScene3D() {
  const vehicleData = useVehicleDetections()
  const { tracks: vehicleTracks } = useVehicleTracks()  // Get vehicles with world coordinates
  const lightStatus = useLightStatus()
  
  // Increased debounce to reduce lag and prevent too many updates
  const debouncedVehicles = useDebounce(vehicleData, 300)
  const debouncedTracks = useDebounce(vehicleTracks, 300)
  const debouncedLights = useDebounce(lightStatus, 300)
  
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#202739] to-[#141a24] relative">
      <div className="absolute top-6 left-6 z-10 glass-effect px-4 py-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">3D Traffic Visualization</p>
            <p className="text-[10px] text-gray-400">🖱️ Drag • 🔍 Scroll • 🤚 Right-click</p>
          </div>
        </div>
      </div>
      
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 50, 80]} fov={55} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={40}
          maxDistance={180}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
        
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[60, 60, 60]}
          intensity={0.9}
          castShadow
          shadow-bias={-0.0005}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        <pointLight position={[-40, 30, -40]} intensity={0.25} color="#3b82f6" />
        <pointLight position={[40, 30, 40]} intensity={0.25} color="#3b82f6" />
        
        <fog attach="fog" args={['#1a1f2e', 100, 200]} />
        
        {/* Ground that blends with theme */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#1b2333" />
        </mesh>
        
        <Suspense fallback={null}>
          {/* Only show intersection 1, centered */}
          <Intersection
            position={[0, 0, 0]}
            name="int1"
            vehicleData={debouncedVehicles}
            lightStatus={debouncedLights}
          />
          
          {/* Connecting road slightly lifted to avoid z-fighting */}
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <boxGeometry args={[48, 0.3, 8]} />
            <meshStandardMaterial color="#5a5a5a" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Grass patches for visual context */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-45, -0.49, 0]} receiveShadow>
            <planeGeometry args={[80, 80]} />
            <meshStandardMaterial color="#1a4d20" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[45, -0.49, 0]} receiveShadow>
            <planeGeometry args={[80, 80]} />
            <meshStandardMaterial color="#1a4d20" />
          </mesh>
          
          {/* Center lane marking on connecting road - REMOVED for cleaner look */}
          
          {/* Render vehicles using world coordinates (if available) */}
          {Object.keys(debouncedTracks).length > 0 && (() => {
            const vehicleEntries = Object.entries(debouncedTracks)
            const totalVehicles = vehicleEntries.reduce((sum, [, tracks]) => sum + tracks.length, 0)
            console.log(`[TrafficScene3D] Rendering ${totalVehicles} vehicles from ${vehicleEntries.length} intersection-lane groups`)
            
            return vehicleEntries.flatMap(([key, trackList]) => {
              const [intersection] = key.split('-')
              // Only int1, centered at origin
              const intersectionPos = [0, 0, 0] as [number, number, number]
              
              return trackList.map((track) => {
                console.log(`[TrafficScene3D] Rendering track ${track.track_id} at (${track.world_x}, ${track.world_y}), type=${track.vehicleType}`)
                return (
                  <WorldVehicle
                    key={`${track.track_id}-${track.id}`}
                    vehicle={{
                      track_id: track.track_id,
                      world_x: track.world_x,
                      world_y: track.world_y,
                      vehicleType: track.vehicleType
                    }}
                    intersectionPosition={intersectionPos}
                    intersectionSize={24}
                  />
                )
              })
            })
          })()}
        </Suspense>
      </Canvas>
    </div>
  )
}
