"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Mannequin, Garment, useMannequinAnimation, type MannequinGender, type MannequinHandle } from "../mannequin";
import { LightingRig } from "./LightingRig";
import { CameraRig, type CameraRigHandle, type CameraView } from "./CameraRig";
import { RENDER_SETTINGS } from "../hooks/usePerformanceTier";
import type {
  AnimationClipName,
  FabricPhysicalProps,
  FitType,
  GarmentArchetype,
  LightingPreset,
  MannequinMeasurements,
  PerformanceTier,
} from "../types";

interface SceneContentProps {
  gender: MannequinGender;
  measurements: MannequinMeasurements;
  garment: { archetype: GarmentArchetype; fit: FitType; colorHex: string; fabric: FabricPhysicalProps } | null;
  clip: AnimationClipName;
  lighting: LightingPreset;
  fabricFocus: boolean;
  cameraRigRef: React.Ref<CameraRigHandle>;
}

/**
 * Rendered inside <Canvas> — useMannequinAnimation calls useFrame, which only
 * works within the R3F render tree, so the mannequin+garment+animation wiring
 * lives here rather than in the outer Scene component.
 */
function SceneContent({ gender, measurements, garment, clip, lighting, fabricFocus, cameraRigRef }: SceneContentProps) {
  const mannequinRef = useRef<MannequinHandle>(null);
  const [skeleton, setSkeleton] = useState<THREE.Skeleton | null>(null);
  const activityRef = useMannequinAnimation(mannequinRef, clip);

  useEffect(() => {
    setSkeleton(mannequinRef.current?.skeleton ?? null);
  }, [gender, measurements]);

  return (
    <>
      <LightingRig preset={lighting} />
      <Mannequin ref={mannequinRef} gender={gender} measurements={measurements} />
      {skeleton && garment && (
        <Garment
          gender={gender}
          measurements={measurements}
          archetype={garment.archetype}
          fit={garment.fit}
          colorHex={garment.colorHex}
          fabric={garment.fabric}
          skeleton={skeleton}
          activityRef={activityRef}
        />
      )}
      <CameraRig ref={cameraRigRef} fabricFocus={fabricFocus} />
    </>
  );
}

interface SceneProps extends SceneContentProps {
  tier: PerformanceTier;
}

export function Scene({ tier, ...content }: SceneProps) {
  const settings = RENDER_SETTINGS[tier];

  return (
    <Canvas
      shadows={settings.shadows}
      dpr={settings.dpr}
      gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.9, 2.6], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
    >
      <color attach="background" args={["#F5F1EA"]} />
      <SceneContent {...content} />
    </Canvas>
  );
}

export type { CameraView };
