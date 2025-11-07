'use client'

import React, { useRef, useEffect, memo, Suspense, ErrorInfo, Component } from 'react'
import { Group, Mesh, Vector3, MeshStandardMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type VehicleType = 'car' | 'bike' | 'bus' | 'truck' | 'emergency'

type VehicleProps = {
  type: VehicleType
  position: [number, number, number]
  targetPosition: [number, number, number]
  color?: string  // Optional dynamic color override
}

const vehicleConfig = {
  car: { 
    size: [2.2, 1.0, 1.0] as [number, number, number], 
    color: '#2563eb',  // Blue
    modelPath: '/models/datsun/scene.gltf',  // Normal car model
    fallbackSize: [2.2, 1.0, 1.0] as [number, number, number]
  },
  bike: { 
    size: [1.2, 0.8, 0.8] as [number, number, number], 
    color: '#6b7280',  // Grey
    modelPath: '/models/datsun/scene.gltf',  // Use car model
    fallbackSize: [1.2, 0.8, 0.8] as [number, number, number]
  },
  bus: { 
    size: [3.5, 1.8, 1.4] as [number, number, number], 
    color: '#ffffff',  // White
    modelPath: '/models/datsun/scene.gltf',  // Use car model
    fallbackSize: [3.5, 1.8, 1.4] as [number, number, number]
  },
  truck: { 
    size: [3.0, 1.5, 1.2] as [number, number, number], 
    color: '#8b5cf6',  // Purple
    modelPath: '/models/datsun/scene.gltf',  // Use car model
    fallbackSize: [3.0, 1.5, 1.2] as [number, number, number]
  },
  emergency: { 
    size: [2.4, 1.3, 1.1] as [number, number, number], 
    color: '#ef4444',  // Red
    modelPath: '/models/emergency/scene.gltf',  // Emergency vehicle pack
    fallbackSize: [2.4, 1.3, 1.1] as [number, number, number]
  },
}

// Scale factor for all vehicles
// The Datsun model is already about 2-5 units in size after centering
const VEHICLE_SCALE = 1.5  // Smaller scale for more realistic car size

// GLTF Model Loader Component
function VehicleModel({ url, color, scale = VEHICLE_SCALE, isEmergency = false }: { 
  url: string
  color: string
  scale?: number
  isEmergency?: boolean
}) {
  // useGLTF automatically caches models and handles loading
  // If model doesn't exist, Suspense will catch the error and show fallback
  const { scene } = useGLTF(url, true)
  const clonedSceneRef = useRef<Group | null>(null)
  
  // Clone and configure model synchronously when scene becomes available
  // This happens during render, so clone is ready immediately
  if (scene && !clonedSceneRef.current) {
    console.log(`[VehicleModel] Cloning model: ${url}`)
    clonedSceneRef.current = scene.clone()  // Clone once
    const clonedScene = clonedSceneRef.current
    
    // Calculate bounding box BEFORE any transforms
    const box = new THREE.Box3().setFromObject(clonedScene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    console.log(`[VehicleModel] Original model - size:`, size, `center:`, center)
    
    // Create wrapper group to center model properly
    const wrapper = new THREE.Group()
    
    // Translate cloned scene to center it at origin
    clonedScene.position.copy(center.clone().negate())
    
    // Add to wrapper
    wrapper.add(clonedScene)
    
    // Scale the wrapper (not individual meshes)
    wrapper.scale.set(scale, scale, scale)
    
    // Store original center offset for potential use
    ;(wrapper as any).modelCenterOffset = center.clone()
    
    // Replace ref with wrapper
    clonedSceneRef.current = wrapper
    
    // Verify final bounds
    const boxAfter = new THREE.Box3().setFromObject(wrapper)
    const centerAfter = boxAfter.getCenter(new THREE.Vector3())
    const sizeAfter = boxAfter.getSize(new THREE.Vector3())
    
    console.log(`[VehicleModel] Model wrapped and centered. Final center:`, centerAfter, `size:`, sizeAfter, `scale:`, scale)
    
    // Apply material properties (keep original textures/colors, just adjust properties)
    clonedScene.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const material = child.material as MeshStandardMaterial
        if (material.isMeshStandardMaterial) {
          // Only modify emissive for emergency vehicles, keep original colors/textures otherwise
          if (isEmergency) {
            material.emissive = new THREE.Color(0xff0000)
            material.emissiveIntensity = 0.5
          } else {
            // Don't override color - keep original textures from GLTF
            material.emissive = new THREE.Color(0x000000)
            material.emissiveIntensity = 0
          }
          // Adjust material properties but keep original textures
          material.metalness = 0.3
          material.roughness = 0.7
          material.needsUpdate = true
        }
      }
    })
    console.log(`[VehicleModel] Model cloned and configured: ${url}`)
  }
  
  // Update emissive properties for emergency vehicles only
  useEffect(() => {
    if (!clonedSceneRef.current || !isEmergency) return
    
    clonedSceneRef.current.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        const material = child.material as MeshStandardMaterial
        if (material.isMeshStandardMaterial) {
          material.emissive = new THREE.Color(0xff0000)
          material.emissiveIntensity = 0.5
          material.needsUpdate = true
        }
      }
    })
  }, [isEmergency])
  
  // Pulsing effect for emergency vehicles
  useFrame(({ clock }) => {
    if (isEmergency && clonedSceneRef.current) {
      clonedSceneRef.current.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          const material = child.material as MeshStandardMaterial
          if (material.isMeshStandardMaterial && material.emissive) {
            material.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.4
          }
        }
      })
    }
  })
  
  // If Suspense resolved, scene should exist and clone should be ready
  if (!clonedSceneRef.current) {
    console.warn(`[VehicleModel] Clone not ready for ${url}, scene exists:`, !!scene)
    return null  // Should not happen if Suspense worked correctly
  }
  
  console.log(`[VehicleModel] Rendering model: ${url}, scale=${scale}`)
  
  // Log final bounds for debugging
  if (clonedSceneRef.current) {
    const box = new THREE.Box3().setFromObject(clonedSceneRef.current)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    console.log(`[VehicleModel] Final bounds - size:`, size, `center:`, center)
  }
  
  return <primitive object={clonedSceneRef.current} castShadow receiveShadow />
}

// Fallback simple vehicle (when GLTF model not available)
function FallbackVehicle({ type, color }: { type: VehicleType; color: string }) {
  useEffect(() => {
    console.log(`[FallbackVehicle] Rendering fallback for type=${type}, color=${color}`)
  }, [type, color])
  
  const config = vehicleConfig[type]
  const [length, height, width] = config.fallbackSize
  
  return (
    <group>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length * VEHICLE_SCALE, height * 0.7 * VEHICLE_SCALE, width * VEHICLE_SCALE]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Cabin/Windows section */}
      <mesh position={[0, height * 0.15 * VEHICLE_SCALE, 0]} castShadow receiveShadow>
        <boxGeometry args={[length * 0.6 * VEHICLE_SCALE, height * 0.4 * VEHICLE_SCALE, width * 0.95 * VEHICLE_SCALE]} />
        <meshStandardMaterial 
          color={type === 'emergency' ? '#dc2626' : '#1e40af'}
          metalness={0.4}
          roughness={0.6}
          opacity={0.7}
          transparent
        />
      </mesh>
      
      {/* Wheels */}
      {[-length * 0.3 * VEHICLE_SCALE, length * 0.3 * VEHICLE_SCALE].map((xPos) => (
        <group key={xPos}>
          <mesh position={[xPos, -height * 0.35 * VEHICLE_SCALE, -width * 0.5 * VEHICLE_SCALE]} castShadow>
            <cylinderGeometry args={[0.15 * VEHICLE_SCALE, 0.15 * VEHICLE_SCALE, 0.25 * VEHICLE_SCALE, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[xPos, -height * 0.35 * VEHICLE_SCALE, width * 0.5 * VEHICLE_SCALE]} castShadow>
            <cylinderGeometry args={[0.15 * VEHICLE_SCALE, 0.15 * VEHICLE_SCALE, 0.25 * VEHICLE_SCALE, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Vehicle({ type, position, targetPosition, color }: VehicleProps) {
  const groupRef = useRef<Group>(null)
  const targetPos = useRef(new Vector3(...targetPosition))
  
  useEffect(() => {
    targetPos.current.set(...targetPosition)
  }, [targetPosition])
  
  // Very slow, smooth movement to prevent flashing and merging
  useFrame(() => {
    if (groupRef.current) {
      const distance = groupRef.current.position.distanceTo(targetPos.current)
      // Much slower movement - prevent fast flashing
      const lerpFactor = Math.min(0.03, Math.max(0.01, distance * 0.005))
      groupRef.current.position.lerp(targetPos.current, lerpFactor)
      
      // Smooth rotation to face movement direction
      // Determine direction based on movement vector
      if (distance > 0.1) {
        const direction = new Vector3()
          .subVectors(targetPos.current, groupRef.current.position)
          .normalize()
        
        if (direction.length() > 0) {
          // Calculate target angle based on movement direction
          // For North-South: direction.z determines angle (0 = south, PI = north)
          // For East-West: direction.x determines angle (PI/2 = east, -PI/2 = west)
          let targetAngle: number
          
          // Check if moving primarily along z-axis (North-South) or x-axis (East-West)
          if (Math.abs(direction.z) > Math.abs(direction.x)) {
            // Moving along z-axis (North-South road)
            targetAngle = direction.z > 0 ? 0 : Math.PI  // 0 = south, PI = north
          } else {
            // Moving along x-axis (East-West road)
            targetAngle = direction.x > 0 ? Math.PI / 2 : -Math.PI / 2  // PI/2 = east, -PI/2 = west
          }
          
          // Smooth rotation interpolation
          let currentAngle = groupRef.current.rotation.y
          let diff = targetAngle - currentAngle
          // Normalize angle difference to [-PI, PI]
          while (diff > Math.PI) diff -= 2 * Math.PI
          while (diff < -Math.PI) diff += 2 * Math.PI
          // Slower, smoother rotation
          groupRef.current.rotation.y += diff * 0.1
        }
      }
    }
  })
  
  const config = vehicleConfig[type]
  const vehicleColor = color || config.color
  const isEmergency = type === 'emergency'
  
  useEffect(() => {
    console.log(`[Vehicle] Rendering vehicle type=${type}, position=[${position.join(', ')}], modelPath=${config.modelPath}`)
  }, [type, position, config.modelPath])
  
  return (
    <group ref={groupRef} position={position}>
      <Suspense fallback={<FallbackVehicle type={type} color={vehicleColor} />}>
        {/* Try to load GLTF model - if it fails, Suspense will catch and show fallback */}
        <ModelErrorBoundary fallback={<FallbackVehicle type={type} color={vehicleColor} />}>
          <VehicleModel 
            url={config.modelPath} 
            color={vehicleColor}
            scale={VEHICLE_SCALE}
            isEmergency={isEmergency}
          />
        </ModelErrorBoundary>
      </Suspense>
    </group>
  )
}

// Simple error boundary for model loading
class ModelErrorBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Vehicle model loading error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>
    }
    return this.props.children
  }
}

// Memoize to prevent re-renders when props haven't changed
export default memo(Vehicle, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.targetPosition[0] === nextProps.targetPosition[0] &&
    prevProps.targetPosition[1] === nextProps.targetPosition[1] &&
    prevProps.targetPosition[2] === nextProps.targetPosition[2]
  )
})
