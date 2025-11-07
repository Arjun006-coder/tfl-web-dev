'use client'

import { useMemo, useEffect, useRef } from 'react'
import Vehicle from './Vehicle'

export interface WorldVehicleData {
  track_id: string
  world_x: number  // Normalized 0-1: 0=west, 0.5=center, 1=east
  world_y: number  // Normalized 0-1: 0=north, 0.5=center, 1=south
  vehicleType: 'car' | 'bike' | 'bus' | 'truck' | 'emergency'
  lane?: string  // Optional lane info from database
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
 */
export default function WorldVehicle({ vehicle, intersectionPosition, intersectionSize = 24 }: WorldVehicleProps) {
  // Track previous position for smooth movement
  const prevPositionRef = useRef<[number, number, number] | null>(null)
  const targetPositionRef = useRef<[number, number, number]>([0, 0, 0])
  const smoothedWorldXRef = useRef<number | null>(null)
  const smoothedWorldYRef = useRef<number | null>(null)
  
  // Determine lane from coordinates or lane field
  const determineLane = (world_x: number, world_y: number, lane?: string): 'north' | 'south' | 'east' | 'west' => {
    if (lane) {
      return lane as 'north' | 'south' | 'east' | 'west'
    }
    
    // Determine lane from coordinates
    // North: world_y < 0.4
    // South: world_y > 0.6
    // East: world_x > 0.6
    // West: world_x < 0.4
    
    if (world_y < 0.4) return 'north'
    if (world_y > 0.6) return 'south'
    if (world_x > 0.6) return 'east'
    if (world_x < 0.4) return 'west'
    
    // Default based on which is closer to edge
    const distFromCenterX = Math.abs(world_x - 0.5)
    const distFromCenterY = Math.abs(world_y - 0.5)
    
    if (distFromCenterY > distFromCenterX) {
      return world_y < 0.5 ? 'north' : 'south'
    } else {
      return world_x > 0.5 ? 'east' : 'west'
    }
  }
  
  // Smooth coordinates to prevent jumps
  const smoothedCoords = useMemo(() => {
    const lane = determineLane(vehicle.world_x, vehicle.world_y, vehicle.lane)
    
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
    const jumpThreshold = 0.15
    if (Math.abs(vehicle.world_x - smoothedX) > jumpThreshold || 
        Math.abs(vehicle.world_y - smoothedY) > jumpThreshold) {
      // Large jump - keep previous position
      return { x: smoothedX, y: smoothedY, lane }
    }
    
    // Smooth interpolation (only allow forward progress)
    // North cars go SOUTH (y increases), South cars go NORTH (y decreases)
    // East cars go WEST (x decreases), West cars go EAST (x increases)
    if (lane === 'north') {
      // North: moving south (world_y increases 0.05 -> 0.35)
      smoothedY = Math.max(smoothedY, Math.min(vehicle.world_y, 0.35))
      smoothedY = smoothedY + (vehicle.world_y - smoothedY) * 0.15  // Slower smoothing
      smoothedX = 0.45  // LEFT side of North-South road
    } else if (lane === 'south') {
      // South: moving north (world_y decreases 0.95 -> 0.65)
      smoothedY = Math.min(smoothedY, Math.max(vehicle.world_y, 0.65))
      smoothedY = smoothedY + (vehicle.world_y - smoothedY) * 0.15  // Slower smoothing
      smoothedX = 0.45  // LEFT side of North-South road
    } else if (lane === 'east') {
      // East: moving west (world_x decreases 0.95 -> 0.65)
      smoothedX = Math.min(smoothedX, Math.max(vehicle.world_x, 0.65))
      smoothedX = smoothedX + (vehicle.world_x - smoothedX) * 0.15  // Slower smoothing
      smoothedY = 0.45  // LEFT side of East-West road
    } else {  // west
      // West: moving east (world_x increases 0.05 -> 0.35)
      smoothedX = Math.max(smoothedX, Math.min(vehicle.world_x, 0.35))
      smoothedX = smoothedX + (vehicle.world_x - smoothedX) * 0.15  // Slower smoothing
      smoothedY = 0.45  // LEFT side of East-West road
    }
    
    // Update refs
    smoothedWorldXRef.current = smoothedX
    smoothedWorldYRef.current = smoothedY
    
    return { x: smoothedX, y: smoothedY, lane }
  }, [vehicle.world_x, vehicle.world_y, vehicle.lane])
  
  // Map normalized coordinates (0-1) to 3D scene coordinates
  // ALWAYS place vehicles on roads, NEVER on grass or in intersection center
  const position3D = useMemo(() => {
    const [intersectionX, intersectionY, intersectionZ] = intersectionPosition
    const { x: world_x, y: world_y, lane } = smoothedCoords
    
    // Road configuration - match Intersection.tsx geometry
    // Roads are 8 units wide, centered at intersection
    // Road extends from intersection edge (z=±12 or x=±12) to approximately z=±33 or x=±33
    const roadExtent = 33  // How far roads extend from intersection center (matches Intersection.tsx)
    const intersectionHalfSize = intersectionSize / 2  // 12 units
    const roadWidth = 8  // Road width in 3D units (matches Intersection.tsx)
    const leftSideOffset = 2.5  // LEFT side offset from center (for left-hand traffic)
    
    let x = intersectionX
    let z = intersectionZ
    
    if (lane === 'north') {
      // North lane: vehicles on vertical road, moving from north (negative z) toward intersection (going SOUTH)
      // Map world_y (0.05 to 0.35) to z position
      const normalized_y = Math.max(0.05, Math.min(0.35, world_y))
      const progress = (normalized_y - 0.05) / 0.3  // Normalize to 0-1
      // Road extends from z=-33 to z=-12 (intersection edge)
      z = intersectionZ - roadExtent + (progress * (roadExtent - intersectionHalfSize))
      // LEFT side of North-South road (x offset from center)
      x = intersectionX - leftSideOffset
    } else if (lane === 'south') {
      // South lane: vehicles on vertical road, moving from south (positive z) toward intersection (going NORTH)
      // Map world_y (0.95 to 0.65) to z position (decreasing)
      const normalized_y = Math.max(0.65, Math.min(0.95, world_y))
      const progress = (0.95 - normalized_y) / 0.3  // Normalize to 0-1 (inverted)
      // Road extends from z=+33 to z=+12 (intersection edge)
      z = intersectionZ + roadExtent - (progress * (roadExtent - intersectionHalfSize))
      // LEFT side of North-South road (x offset from center)
      x = intersectionX - leftSideOffset
    } else if (lane === 'east') {
      // East lane: vehicles on horizontal road, moving from east (positive x) toward intersection (going WEST)
      // Map world_x (0.95 to 0.65) to x position (decreasing)
      const normalized_x = Math.max(0.65, Math.min(0.95, world_x))
      const progress = (0.95 - normalized_x) / 0.3  // Normalize to 0-1 (inverted)
      // Road extends from x=+33 to x=+12 (intersection edge)
      x = intersectionX + roadExtent - (progress * (roadExtent - intersectionHalfSize))
      // LEFT side of East-West road (z offset from center)
      z = intersectionZ - leftSideOffset
    } else {  // west
      // West lane: vehicles on horizontal road, moving from west (negative x) toward intersection (going EAST)
      // Map world_x (0.05 to 0.35) to x position
      const normalized_x = Math.max(0.05, Math.min(0.35, world_x))
      const progress = (normalized_x - 0.05) / 0.3  // Normalize to 0-1
      // Road extends from x=-33 to x=-12 (intersection edge)
      x = intersectionX - roadExtent + (progress * (roadExtent - intersectionHalfSize))
      // LEFT side of East-West road (z offset from center)
      z = intersectionZ - leftSideOffset
    }
    
    // CRITICAL: Ensure vehicles are ALWAYS within road bounds (±4 from center for 8-unit wide road)
    const roadHalfWidth = roadWidth / 2  // 4 units
    if (lane === 'north' || lane === 'south') {
      // North-South road: constrain x to road bounds
      x = Math.max(intersectionX - roadHalfWidth, Math.min(intersectionX + roadHalfWidth, x))
    } else {
      // East-West road: constrain z to road bounds
      z = Math.max(intersectionZ - roadHalfWidth, Math.min(intersectionZ + roadHalfWidth, z))
    }
    
    // Final safety check: ensure vehicles are NEVER in intersection center
    const distFromCenterX = Math.abs(x - intersectionX)
    const distFromCenterZ = Math.abs(z - intersectionZ)
    const minDist = intersectionHalfSize + 2
    
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
    
    // Position vehicle on road surface
    const y = intersectionY + 1.5
    
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
    />
  )
}
