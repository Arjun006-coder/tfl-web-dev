'use client'

import { useMemo, useEffect, useRef } from 'react'
import Vehicle from './Vehicle'

export interface WorldVehicleData {
  track_id: string
  world_x: number  // Normalized 0-1
  world_y: number  // Normalized 0-1
  vehicleType: 'car' | 'bike' | 'bus' | 'truck' | 'emergency'
}

type WorldVehicleProps = {
  vehicle: WorldVehicleData
  intersectionPosition: [number, number, number]  // Intersection center in 3D
  intersectionSize: number  // Size of intersection (default 24)
}

/**
 * Renders a vehicle positioned using world coordinates (normalized 0-1)
 * Maps normalized coordinates to 3D scene positions
 */
export default function WorldVehicle({ vehicle, intersectionPosition, intersectionSize = 24 }: WorldVehicleProps) {
  // Track previous position for smooth animation
  const prevPositionRef = useRef<[number, number, number] | null>(null)
  const targetPositionRef = useRef<[number, number, number]>([0, 0, 0])
  
  // Map normalized coordinates (0-1) to 3D scene coordinates
  // 0.5, 0.5 = center of intersection
  // 0, 0 = top-left of intersection area
  // 1, 1 = bottom-right of intersection area
  const position3D = useMemo(() => {
    const [intersectionX, intersectionY, intersectionZ] = intersectionPosition
    
    // Traffic lights are positioned at:
    // North: z = -13, East: x = 13, South: z = 13, West: x = -13
    // Intersection is 24x24 units, center is at intersectionPosition
    // Roads are 8 units wide
    
    // Road extent from intersection center
    const roadExtent = 35  // Extend further to avoid lights
    const intersectionHalfSize = intersectionSize / 2  // 12 units
    const lightDistance = 13  // Traffic lights are 13 units from center
    
    // Map normalized coordinates (0-1) to world positions
    // 0.0 -> far approach, 0.5 -> intersection center, 1.0 -> far exit
    
    // Calculate base position
    let x = intersectionX + (vehicle.world_x - 0.5) * (roadExtent * 2)
    let z = intersectionZ + (vehicle.world_y - 0.5) * (roadExtent * 2)
    
    // AVOID TRAFFIC LIGHT POSITIONS - place vehicles on road lanes, not where lights are
    const lightAvoidanceRadius = 3  // Keep vehicles at least 3 units away from lights
    
    // Check if vehicle would collide with traffic light positions
    // If near light positions, offset to lane center
    const nearNorthLight = Math.abs(z - (intersectionZ - lightDistance)) < lightAvoidanceRadius && Math.abs(x - intersectionX) < 5
    const nearSouthLight = Math.abs(z - (intersectionZ + lightDistance)) < lightAvoidanceRadius && Math.abs(x - intersectionX) < 5
    const nearEastLight = Math.abs(x - (intersectionX + lightDistance)) < lightAvoidanceRadius && Math.abs(z - intersectionZ) < 5
    const nearWestLight = Math.abs(x - (intersectionX - lightDistance)) < lightAvoidanceRadius && Math.abs(z - intersectionZ) < 5
    
    // Place vehicles on actual road lanes (offset from light positions)
    if (nearNorthLight || (Math.abs(vehicle.world_x - 0.5) < 0.1 && vehicle.world_y < 0.5)) {
      // North lane - place on road, avoid light at z = -13
      x = intersectionX  // Center of north-south road
      z = intersectionZ - 18  // Far enough from light (light is at -13, place at -18)
    } else if (nearSouthLight || (Math.abs(vehicle.world_x - 0.5) < 0.1 && vehicle.world_y > 0.5)) {
      // South lane
      x = intersectionX
      z = intersectionZ + 18  // Far enough from light (light is at 13, place at 18)
    } else if (nearEastLight || (vehicle.world_x > 0.5 && Math.abs(vehicle.world_y - 0.5) < 0.1)) {
      // East lane
      x = intersectionX + 18  // Far enough from light (light is at 13, place at 18)
      z = intersectionZ
    } else if (nearWestLight || (vehicle.world_x < 0.5 && Math.abs(vehicle.world_y - 0.5) < 0.1)) {
      // West lane
      x = intersectionX - 18  // Far enough from light (light is at -13, place at -18)
      z = intersectionZ
    } else {
      // Vehicle is on approach/exit roads - clamp to road area but avoid lights
      const maxDistance = intersectionHalfSize + roadExtent
      x = Math.max(intersectionX - maxDistance, Math.min(intersectionX + maxDistance, x))
      z = Math.max(intersectionZ - maxDistance, Math.min(intersectionZ + maxDistance, z))
      
      // Additional check: if still too close to lights, push further out
      if (Math.abs(z - (intersectionZ - lightDistance)) < lightAvoidanceRadius && Math.abs(x - intersectionX) < 8) {
        z = intersectionZ - 18
      } else if (Math.abs(z - (intersectionZ + lightDistance)) < lightAvoidanceRadius && Math.abs(x - intersectionX) < 8) {
        z = intersectionZ + 18
      } else if (Math.abs(x - (intersectionX + lightDistance)) < lightAvoidanceRadius && Math.abs(z - intersectionZ) < 8) {
        x = intersectionX + 18
      } else if (Math.abs(x - (intersectionX - lightDistance)) < lightAvoidanceRadius && Math.abs(z - intersectionZ) < 8) {
        x = intersectionX - 18
      }
    }
    
    // Position vehicle on road surface (road is at y=0)
    // Raise car higher so tires sit properly on road surface, not submerged
    const y = intersectionY + 1.5  // Increased to raise car above road so tires are visible
    
    return [x, y, z] as [number, number, number]
  }, [vehicle.world_x, vehicle.world_y, intersectionPosition, intersectionSize])
  
  // Update target position when world coordinates change
  useEffect(() => {
    targetPositionRef.current = position3D
    if (!prevPositionRef.current) {
      prevPositionRef.current = position3D
    }
  }, [position3D])
  
  // Use previous position as starting point for smooth animation
  const startPosition = prevPositionRef.current || position3D
  
  useEffect(() => {
    console.log(`[WorldVehicle] Rendering vehicle track_id=${vehicle.track_id}, type=${vehicle.vehicleType}, position=[${position3D.join(', ')}]`)
    // Update previous position after a short delay to allow animation
    const timer = setTimeout(() => {
      prevPositionRef.current = position3D
    }, 100)
    return () => clearTimeout(timer)
  }, [vehicle.track_id, vehicle.vehicleType, position3D])
  
  return (
    <Vehicle
      type={vehicle.vehicleType}
      position={startPosition}
      targetPosition={targetPositionRef.current}
    />
  )
}

