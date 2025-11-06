'use client'

import { useRef } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

type TrafficLightProps = {
  position: [number, number, number]
  currentColor: 'red' | 'yellow' | 'green'
}

export default function TrafficLight({ position, currentColor }: TrafficLightProps) {
  const redRef = useRef<Mesh>(null)
  const yellowRef = useRef<Mesh>(null)
  const greenRef = useRef<Mesh>(null)
  
  // Smoothly animate light intensity
  useFrame(() => {
    if (redRef.current) {
      const material = redRef.current.material as any
      const target = currentColor === 'red' ? 1.0 : 0.02
      material.emissiveIntensity += (target - material.emissiveIntensity) * 0.1
    }
    if (yellowRef.current) {
      const material = yellowRef.current.material as any
      const target = currentColor === 'yellow' ? 1.0 : 0.02
      material.emissiveIntensity += (target - material.emissiveIntensity) * 0.1
    }
    if (greenRef.current) {
      const material = greenRef.current.material as any
      const target = currentColor === 'green' ? 1.0 : 0.02
      material.emissiveIntensity += (target - material.emissiveIntensity) * 0.1
    }
  })
  
  return (
    <group position={position}>
      {/* Pole - thin cylinder */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Housing box */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[0.7, 2.2, 0.4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      
      {/* Red light - top */}
      <mesh ref={redRef} position={[0, 5.2, 0.25]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444"
          emissiveIntensity={currentColor === 'red' ? 1 : 0.1}
        />
      </mesh>
      
      {/* Yellow light - middle */}
      <mesh ref={yellowRef} position={[0, 4.5, 0.25]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#f59e0b" 
          emissive="#f59e0b"
          emissiveIntensity={currentColor === 'yellow' ? 1 : 0.1}
        />
      </mesh>
      
      {/* Green light - bottom */}
      <mesh ref={greenRef} position={[0, 3.8, 0.25]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#10b981" 
          emissive="#10b981"
          emissiveIntensity={currentColor === 'green' ? 1 : 0.1}
        />
      </mesh>
    </group>
  )
}
