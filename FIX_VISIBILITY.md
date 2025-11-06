# Fix Visibility Issues - Make Roads Brighter

## Problem
Everything appears black with no clarity because:
1. Road colors are too dark (#2a2a2a, #3a3a3a)
2. Lighting is too dim (0.35 ambient)
3. Camera angle needs adjustment

## Solutions

### 1. Fix TrafficScene3D.tsx Lighting and Camera

**File:** `components/dashboard/TrafficScene3D.tsx`

**Change line 25:**
```tsx
<PerspectiveCamera makeDefault position={[0, 50, 80]} fov={55} />
```

**Change lines 27-35:**
```tsx
<OrbitControls 
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  minDistance={30}
  maxDistance={150}
  maxPolarAngle={Math.PI / 2}
  target={[0, 0, 0]}
/>
```

**Change line 37:**
```tsx
<ambientLight intensity={1.2} />
```

**Change lines 38-47:**
```tsx
<directionalLight
  position={[50, 80, 50]}
  intensity={1.5}
  castShadow={false}
/>
<pointLight position={[-30, 40, -30]} intensity={0.6} color="#ffffff" />
<pointLight position={[30, 40, 30]} intensity={0.6} color="#ffffff" />
```

**Change line 52:**
```tsx
<fog attach="fog" args={['#0a0a0a', 150, 250]} />
```

### 2. Fix Intersection.tsx Road Colors

**File:** `components/scene/Intersection.tsx`

**Change line 51:**
```tsx
<meshStandardMaterial color="#4a4a4a" />
```

**Change lines 57, 63, 69, 75:**
```tsx
<meshStandardMaterial color="#6a6a6a" />
```

**Change line 76 (connecting road):**
```tsx
<meshStandardMaterial color="#6a6a6a" />
```

### 3. Quick Test

After making these changes:
1. Run `npm run dev`
2. You should now see BRIGHTER ROADS
3. Better contrast and visibility
4. Clear view of intersections

## Alternative: Temporary Override

If the files are too corrupted, create a new file:

**File:** `components/dashboard/TrafficScene3D_FIXED.tsx`

Copy the ENTIRE TrafficScene3D.tsx content but with these changes:
- Line 25: `position={[0, 50, 80]}`
- Line 37: `intensity={1.2}`
- Line 38: Remove all shadow properties
- Line 39: `position={[50, 80, 50]}` and `intensity={1.5}`
- Lines 49-50: `color="#ffffff"` and `intensity={0.6}`

Then rename files:
```bash
mv TrafficScene3D.tsx TrafficScene3D_OLD.tsx
mv TrafficScene3D_FIXED.tsx TrafficScene3D.tsx
```

## What This Will Fix

✅ Brighter roads (gray instead of almost black)
✅ More lighting (1.2 instead of 0.35)
✅ Better camera angle (50 height instead of 70)
✅ Disabled shadows (performance improvement)
✅ White point lights instead of blue
✅ Clear visibility of all elements

The scene will look like a proper traffic intersection with clear roads!







