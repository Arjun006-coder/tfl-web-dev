export default function RoadMarkings() {
  const dashLength = 1.5
  const dashGap = 1.2
  const dashCount = 11
  
  return (
    <group>
      {/* North road center line (vertical) */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh 
          key={`north-${i}`} 
          position={[0, 0.11, -13.25 - i * (dashLength + dashGap)]}
        >
          <boxGeometry args={[0.15, 0.05, dashLength]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}
      
      {/* South road center line (vertical) */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh 
          key={`south-${i}`} 
          position={[0, 0.11, 13.25 + i * (dashLength + dashGap)]}
        >
          <boxGeometry args={[0.15, 0.05, dashLength]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}
      
      {/* East road center line (horizontal) */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh 
          key={`east-${i}`} 
          position={[13.25 + i * (dashLength + dashGap), 0.11, 0]}
        >
          <boxGeometry args={[dashLength, 0.05, 0.15]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}
      
      {/* West road center line (horizontal) */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh 
          key={`west-${i}`} 
          position={[-13.25 - i * (dashLength + dashGap), 0.11, 0]}
        >
          <boxGeometry args={[dashLength, 0.05, 0.15]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}
      
      {/* Crosswalk lines - North side */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh 
          key={`crosswalk-n-${i}`} 
          position={[-4 + i * 2, 0.11, -12.5]}
        >
          <boxGeometry args={[1.2, 0.05, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      
      {/* Crosswalk lines - South side */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh 
          key={`crosswalk-s-${i}`} 
          position={[-4 + i * 2, 0.11, 12.5]}
        >
          <boxGeometry args={[1.2, 0.05, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}
