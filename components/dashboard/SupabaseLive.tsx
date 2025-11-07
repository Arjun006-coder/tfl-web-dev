"use client";
import { useEffect, useRef } from 'react';
import { subscribeVehicles, subscribeLights, VehicleDetection, LightStatus } from '@/lib/realtime';

type Props = {
  onVehicle: (v: VehicleDetection) => void;
  onLight: (l: LightStatus) => void;
};

export default function SupabaseLive({ onVehicle, onLight }: Props) {
  const subRef = useRef<{ v?: any; l?: any }>({});

  useEffect(() => {
    const v = subscribeVehicles(onVehicle);
    const l = subscribeLights(onLight);
    subRef.current = { v, l };
    return () => {
      try { v.unsubscribe(); } catch {}
      try { l.unsubscribe(); } catch {}
    };
  }, [onVehicle, onLight]);

  return null;
}

















