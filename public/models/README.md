# 3D Vehicle Models

Place your GLTF/GLB vehicle models in this directory.

## Required Models

- `car.glb` - Low-poly car model for normal vehicles (cars, bikes, buses, trucks)
- `ambulance.glb` - Emergency vehicle model (ambulance, fire truck, police)

## Model Requirements

1. **Format**: GLTF (.gltf) or GLB (.glb) format
2. **Scale**: Models should be approximately 1-2 meters long (will be scaled 1.5x in code)
3. **Orientation**: Model should face forward (positive Z or positive X direction)
4. **Materials**: Models should use MeshStandardMaterial for dynamic color changes

## Recommended Sources

- **Sketchfab**: https://sketchfab.com (search for "low poly car" or "car gltf")
- **Free3D**: https://free3d.com
- **CGTrader**: https://www.cgtrader.com (free models available)

## Search Terms

- "low poly car"
- "simple car gltf"
- "car 3d model free"
- "ambulance gltf"
- "emergency vehicle model"

## Fallback

If models are not found, the system will automatically use a fallback simple geometry (box with wheels, windows, headlights).

## Testing

After placing models:
1. Start the dashboard: `npm run dev`
2. Run test script: `python infra/scripts/supabase_test_insert.py`
3. Check browser console for any model loading errors
4. Vehicles should appear automatically if models load successfully



