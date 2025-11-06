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
  // ALWAYS place vehicles on roads, NEVER on grass or in intersection center
  const position3D = useMemo(() => {
    const [intersectionX, intersectionY, intersectionZ] = intersectionPosition
    
    // Road configuration
    const roadWidth = 8  // Road is 8 units wide
    const roadExtent = 40  // How far roads extend from intersection
    const intersectionHalfSize = intersectionSize / 2  // 12 units
    
    // Determine which lane based on world coordinates
    // world_x: 0 = left, 0.5 = center, 1 = right
    // world_y: 0 = top, 0.5 = center, 1 = bottom
    
    let x = intersectionX
    let z = intersectionZ
    
    // Determine lane: North (top) or South (bottom) based on world_y
    // We only use North and South lanes as per user requirement
    // Constrain world_y to valid road areas (avoid intersection center 0.4-0.6)
    
    let clamped_y = vehicle.world_y
    if (clamped_y >= 0.4 && clamped_y <= 0.6) {
      // If in intersection center, push to nearest lane
      clamped_y = clamped_y < 0.5 ? 0.35 : 0.65
    }
    
    const isNorthLane = clamped_y < 0.5
    const isSouthLane = clamped_y >= 0.5
    
    // ALWAYS place vehicles on the center of the north-south road
    x = intersectionX  // Center of north-south road (x coordinate)
    
    if (isNorthLane) {
      // North lane: vehicles on vertical road, moving from top (negative z) toward intersection
      // Map world_y (0.0 to 0.4) to z position
      // 0.0 = far north, 0.4 = near intersection (but not in it)
      const normalized_y = Math.max(0.0, Math.min(0.4, clamped_y))
      const progress = normalized_y / 0.4  // Normalize to 0-1
      z = intersectionZ - 20 - (progress * 30)  // Start at -50, end at -20 (before intersection)
    } else {
      // South lane: vehicles on vertical road, moving from bottom (positive z) toward intersection
      // Map world_y (0.6 to 1.0) to z position
      // 0.6 = near intersection, 1.0 = far south
      const normalized_y = Math.max(0.6, Math.min(1.0, clamped_y))
      const progress = (normalized_y - 0.6) / 0.4  // Normalize to 0-1
      z = intersectionZ + 20 + (progress * 30)  // Start at +20 (after intersection), end at +50
    }
    
    // Final safety check: ensure vehicles are NEVER in intersection center
    const distFromCenter = Math.abs(z - intersectionZ)
    if (distFromCenter < 15) {
      // Too close to center, push out
      if (isNorthLane) {
        z = intersectionZ - 20
      } else {
        z = intersectionZ + 20
      }
    }
    
    // Position vehicle on road surface
    const y = intersectionY + 1.5
    
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

