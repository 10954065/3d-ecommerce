"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import type { Group } from "three";
import { MannequinFigure, type MannequinFigureHandle } from "./scene/MannequinFigure";
import { useReducedMotion } from "./hooks/useReducedMotion";
import type { MannequinMeasurements } from "./types";

const HERO_MEASUREMENTS: MannequinMeasurements = {
  heightCm: 176,
  chestCm: 91,
  waistCm: 73,
  hipsCm: 99,
  shoulderWidthCm: 38,
  armLengthCm: 58,
  inseamCm: 78,
  neckCm: 33,
  thighCm: 54,
};

function AutoRotate({ reducedMotion }: { reducedMotion: boolean }) {
  const figureRef = useRef<MannequinFigureHandle>(null);
  const activityRef = useRef(0.1);

  useFrame((_, delta) => {
    const root = figureRef.current?.root as Group | null | undefined;
    if (root && !reducedMotion) {
      root.rotation.y += delta * 0.35;
    }
  });

  return (
    <MannequinFigure ref={figureRef} measurements={HERO_MEASUREMENTS} garment={null} activityRef={activityRef} />
  );
}

/** Purely ambient, non-interactive hero visual — no OrbitControls, minimal render cost. */
export function HeroMannequin() {
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.95, 2.4], fov: 30 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
    >
      <color attach="background" args={["#F5F1EA"]} />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={0.55} />
        <directionalLight position={[2, 3, 2]} intensity={1.4} castShadow={false} />
        <ambientLight intensity={0.4} />
        <AutoRotate reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}
