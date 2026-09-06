"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import type { LightingPreset } from "../types";

const ENVIRONMENT_PRESET: Record<LightingPreset, "studio" | "city" | "sunset" | "dawn" | "warehouse" | "park"> = {
  STUDIO: "studio",
  DAYLIGHT: "city",
  WARM: "sunset",
  COOL: "dawn",
  RUNWAY: "warehouse",
  OUTDOOR: "park",
};

const KEY_LIGHT: Record<LightingPreset, { color: string; intensity: number }> = {
  STUDIO: { color: "#ffffff", intensity: 1.6 },
  DAYLIGHT: { color: "#eaf2ff", intensity: 1.4 },
  WARM: { color: "#ffd9a0", intensity: 1.3 },
  COOL: { color: "#cfe8ff", intensity: 1.2 },
  RUNWAY: { color: "#ffffff", intensity: 2.2 },
  OUTDOOR: { color: "#fff3d6", intensity: 1.5 },
};

interface LightingRigProps {
  preset: LightingPreset;
}

export function LightingRig({ preset }: LightingRigProps) {
  const key = KEY_LIGHT[preset];

  return (
    <>
      <Environment preset={ENVIRONMENT_PRESET[preset]} environmentIntensity={0.6} />
      <directionalLight
        position={[2.2, 3.5, 2.5]}
        intensity={key.intensity}
        color={key.color}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <ambientLight intensity={0.35} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={3} blur={2.4} far={2} />
    </>
  );
}
