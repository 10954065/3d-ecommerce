"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Mannequin, DEFAULT_FEMALE_MEASUREMENTS, type MannequinHandle } from "./mannequin";
import { useReducedMotion } from "./hooks/useReducedMotion";

function AutoRotate({ reducedMotion }: { reducedMotion: boolean }) {
  const mannequinRef = useRef<MannequinHandle>(null);

  useFrame((_, delta) => {
    const group = mannequinRef.current?.group;
    if (group && !reducedMotion) {
      group.rotation.y += delta * 0.35;
    }
  });

  return <Mannequin ref={mannequinRef} gender="female" measurements={DEFAULT_FEMALE_MEASUREMENTS} />;
}

/** Purely ambient, non-interactive hero visual — no OrbitControls, minimal render cost. */
export function HeroMannequin() {
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.95, 2.4], fov: 30 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
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
