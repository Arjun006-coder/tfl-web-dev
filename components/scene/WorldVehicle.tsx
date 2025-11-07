'use client'

import { useMemo, useEffect, useRef } from 'react'
import Vehicle from './Vehicle'

export interface WorldVehicleData {
  track_id: string
  world_x: number  // Normalized 0-1: 0=west, 0.5=center, 1=east
  world_y: number  // Normalized 0-1: 0=north, 0.5=center, 1=south
  vehicleType: 'car' | 'bike' | 'bus' | 'truck' | 'emergency'
  lane?: string  // Lane info from database
}

type WorldVehicleProps = {
  vehicle: WorldVehicleData
  intersectionPosition: [number, number, number]  // Intersection center in 3D
  intersectionSize: number  // Size of intersection (default 24)
}

/**
 * Renders a vehicle positioned using world coordinates (normalized 0-1)
 * Maps normalized coordinates to 3D scene positions
 * Supports all 4 lanes: North, South, East, West
 * CRITICAL: Vehicles MUST stay on roads only, NEVER on grass
 */
export default function WorldVehicle({ vehicle, intersectionPosition, intersectionSize = 24 }: WorldVehicleProps) {
  // Track previous position for smooth movement
  const prevPositionRef = useRef<[number, number, number] | null>(null)
  const targetPositionRef = useRef<[number, number, number]>([0, 0, 0])
  const smoothedWorldXRef = useRef<number | null>(null)
  const smoothedWorldYRef = useRef<number | null>(null)
  
  // Determine lane from lane field (MUST use lane from database, not coordinates)
  const determineLane = (world_x: number, world_y: number, lane?: string): 'north' | 'south' | 'east' | 'west' => {
    // ALWAYS use lane from database if available
    if (lane && ['north', 'south', 'east', 'west'].includes(lane)) {
      return lane as 'north' | 'south' | 'east' | 'west'
    }
    
    // Fallback: determine from coordinates (should rarely happen)
    if (world_y < 0.4) return 'north'
    if (world_y > 0.6) return 'south'
    if (world_x > 0.6) return 'east'
    if (world_x < 0.4) return 'west'
    
    // Default
    return 'north'
  }
  
  const lane = determineLane(vehicle.world_x, vehicle.world_y, vehicle.lane)
  
  // Smooth coordinates to prevent jumps - ONLY smooth within lane bounds
  const smoothedCoords = useMemo(() => {
    // Initialize smoothed values
    if (smoothedWorldXRef.current === null) {
      smoothedWorldXRef.current = vehicle.world_x
    }
    if (smoothedWorldYRef.current === null) {
      smoothedWorldYRef.current = vehicle.world_y
    }
    
    let smoothedX = smoothedWorldXRef.current
    let smoothedY = smoothedWorldYRef.current
    
    // Prevent large jumps (teleporting)
    const jumpThreshold = 0.2
    if (Math.abs(vehicle.world_x - smoothedX) > jumpThreshold || 
        Math.abs(vehicle.world_y - smoothedY) > jumpThreshold) {
      // Large jump - keep previous position
      return { x: smoothedX, y: smoothedY, lane }
    }
    
    // Smooth interpolation - ONLY within lane-specific bounds
    if (lane === 'north') {
      // North: moving south (world_y increases 0.05 -> 0.35)
      smoothedY = Math.max(0.05, Math.min(0.35, vehicle.world_y))
      smoothedY = smoothedY + (vehicle.world_y - smoothedY) * 0.2
      smoothedX = 0.5  // ALWAYS center on North-South road
    } else if (lane === 'south') {
      // South: moving north (world_y decreases 0.95 -> 0.65)
      smoothedY = Math.max(0.65, Math.min(0.95, vehicle.world_y))
      smoothedY = smoothedY + (vehicle.world_y - smoothedY) * 0.2
      smoothedX = 0.5  // ALWAYS center on North-South road
    } else if (lane === 'east') {
      // East: moving west (world_x decreases 0.95 -> 0.65)
      smoothedX = Math.max(0.65, Math.min(0.95, vehicle.world_x))
      smoothedX = smoothedX + (vehicle.world_x - smoothedX) * 0.2
      smoothedY = 0.5  // ALWAYS center on East-West road
    } else {  // west
      // West: moving east (world_x increases 0.05 -> 0.35)
      smoothedX = Math.max(0.05, Math.min(0.35, vehicle.world_x))
      smoothedX = smoothedX + (vehicle.world_x - smoothedX) * 0.2
      smoothedY = 0.5  // ALWAYS center on East-West road
    }
    
    // Update refs
    smoothedWorldXRef.current = smoothedX
    smoothedWorldYRef.current = smoothedY
    
    return { x: smoothedX, y: smoothedY, lane }
  }, [vehicle.world_x, vehicle.world_y, vehicle.lane, lane])
  
  // Map normalized coordinates (0-1) to 3D scene coordinates
  // EXACTLY match Intersection.tsx road geometry
  const position3D = useMemo(() => {
    const [intersectionX, intersectionY, intersectionZ] = intersectionPosition
    const { x: world_x, y: world_y, lane } = smoothedCoords
    
    // Road geometry from Intersection.tsx:
    // North road: position [0, 0.02, -22.5], size [8, 0.3, 21] -> x: -4 to +4, z: -33 to -12
    // South road: position [0, 0.02, 22.5], size [8, 0.3, 21] -> x: -4 to +4, z: 12 to 33
    // East road: position [22.5, 0.02, 0], size [21, 0.3, 8] -> x: 12 to 33, z: -4 to +4
    // West road: position [-22.5, 0.02, 0], size [21, 0.3, 8] -> x: -33 to -12, z: -4 to +4
    
    const roadWidth = 8  // Road width in 3D units
    const roadHalfWidth = roadWidth / 2  // 4 units
    const intersectionHalfSize = intersectionSize / 2  // 12 units
    const roadLength = 21  // Road length in 3D units
    const roadStart = intersectionHalfSize + roadLength  // 33 units from center
    
    // LEFT side offset (for left-hand traffic)
    const leftSideOffset = 2.0  // Offset from center to left side
    
    let x = intersectionX
    let z = intersectionZ
    let y = intersectionY + 1.5  // Vehicle height above road
    
    if (lane === 'north') {
      // North road: centered at x=intersectionX, extends from z=-33 to z=-12
      // Map world_y (0.05 to 0.35) to z position (going SOUTH)
      const normalized_y = Math.max(0.05, Math.min(0.35, world_y))
      const progress = (normalized_y - 0.05) / 0.3  // 0 to 1
      z = intersectionZ - roadStart + (progress * roadLength)  // z: -33 to -12
      x = intersectionX - leftSideOffset  // LEFT side of road
      // CRITICAL: Clamp to road bounds
      x = Math.max(intersectionX - roadHalfWidth, Math.min(intersectionX + roadHalfWidth, x))
      z = Math.max(intersectionZ - roadStart, Math.min(intersectionZ - intersectionHalfSize, z))
    } else if (lane === 'south') {
      // South road: centered at x=intersectionX, extends from z=12 to z=33
      // Map world_y (0.95 to 0.65) to z position (going NORTH, decreasing)
      const normalized_y = Math.max(0.65, Math.min(0.95, world_y))
      const progress = (0.95 - normalized_y) / 0.3  // 0 to 1 (inverted)
      z = intersectionZ + intersectionHalfSize + (progress * roadLength)  // z: 12 to 33
      x = intersectionX - leftSideOffset  // LEFT side of road
      // CRITICAL: Clamp to road bounds
      x = Math.max(intersectionX - roadHalfWidth, Math.min(intersectionX + roadHalfWidth, x))
      z = Math.max(intersectionZ + intersectionHalfSize, Math.min(intersectionZ + roadStart, z))
    } else if (lane === 'east') {
      // East road: centered at z=intersectionZ, extends from x=12 to x=33
      // Map world_x (0.95 to 0.65) to x position (going WEST, decreasing)
      const normalized_x = Math.max(0.65, Math.min(0.95, world_x))
      const progress = (0.95 - normalized_x) / 0.3  // 0 to 1 (inverted)
      x = intersectionX + intersectionHalfSize + (progress * roadLength)  // x: 12 to 33
      z = intersectionZ - leftSideOffset  // LEFT side of road
      // CRITICAL: Clamp to road bounds
      x = Math.max(intersectionX + intersectionHalfSize, Math.min(intersectionX + roadStart, x))
      z = Math.max(intersectionZ - roadHalfWidth, Math.min(intersectionZ + roadHalfWidth, z))
    } else {  // west
      // West road: centered at z=intersectionZ, extends from x=-33 to x=-12
      // Map world_x (0.05 to 0.35) to x position (going EAST)
      const normalized_x = Math.max(0.05, Math.min(0.35, world_x))
      const progress = (normalized_x - 0.05) / 0.3  // 0 to 1
      x = intersectionX - roadStart + (progress * roadLength)  // x: -33 to -12
      z = intersectionZ - leftSideOffset  // LEFT side of road
      // CRITICAL: Clamp to road bounds
      x = Math.max(intersectionX - roadStart, Math.min(intersectionX - intersectionHalfSize, x))
      z = Math.max(intersectionZ - roadHalfWidth, Math.min(intersectionZ + roadHalfWidth, z))
    }
    
    // FINAL safety check: ensure vehicles are NEVER in intersection center
    const distFromCenterX = Math.abs(x - intersectionX)
    const distFromCenterZ = Math.abs(z - intersectionZ)
    const minDist = intersectionHalfSize + 1
    
    if (distFromCenterX < minDist && distFromCenterZ < minDist) {
      // Too close to center, push out based on lane
      if (lane === 'north') {
        z = intersectionZ - minDist
      } else if (lane === 'south') {
        z = intersectionZ + minDist
      } else if (lane === 'east') {
        x = intersectionX + minDist
      } else {  // west
        x = intersectionX - minDist
      }
    }
    
    return [x, y, z] as [number, number, number]
  }, [smoothedCoords, intersectionPosition, intersectionSize])
  
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
    // Update previous position after animation completes
    const timer = setTimeout(() => {
      prevPositionRef.current = position3D
    }, 200)
    return () => clearTimeout(timer)
  }, [position3D])
  
  return (
    <Vehicle
      type={vehicle.vehicleType}
      position={startPosition}
      targetPosition={targetPositionRef.current}
      lane={lane}
    />
  )
}
