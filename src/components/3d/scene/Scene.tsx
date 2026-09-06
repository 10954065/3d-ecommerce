"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { MannequinFigure, type MannequinFigureHandle } from "./MannequinFigure";
import { LightingRig } from "./LightingRig";
import { CameraRig, type CameraRigHandle, type CameraView } from "./CameraRig";
import { useAnimationController } from "../hooks/useAnimationController";
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
  measurements: MannequinMeasurements;
  garment: { archetype: GarmentArchetype; fit: FitType; colorHex: string; fabric: FabricPhysicalProps } | null;
  clip: AnimationClipName;
  lighting: LightingPreset;
  fabricFocus: boolean;
  cameraRigRef: React.Ref<CameraRigHandle>;
}

function SceneContent({ measurements, garment, clip, lighting, fabricFocus, cameraRigRef }: SceneContentProps) {
  const figureRef = useRef<MannequinFigureHandle>(null);
  const activityRef = useAnimationController(figureRef, clip);

  return (
    <>
      <LightingRig preset={lighting} />
      <MannequinFigure ref={figureRef} measurements={measurements} garment={garment} activityRef={activityRef} />
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
    >
      <color attach="background" args={["#F5F1EA"]} />
      <SceneContent {...content} />
    </Canvas>
  );
}

export type { CameraView };
