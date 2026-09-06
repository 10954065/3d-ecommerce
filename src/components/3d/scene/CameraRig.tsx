"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type CameraView = "front" | "back" | "left" | "right" | "three-quarter";

export interface CameraRigHandle {
  reset: () => void;
  setView: (view: CameraView) => void;
}

const VIEW_ANGLES: Record<CameraView, number> = {
  front: 0,
  "three-quarter": Math.PI * 0.22,
  right: Math.PI * 0.5,
  back: Math.PI,
  left: -Math.PI * 0.5,
};

const DEFAULT_DISTANCE = 2.6;
const DEFAULT_TARGET = new THREE.Vector3(0, 0.9, 0);

interface CameraRigProps {
  fabricFocus: boolean;
}

export const CameraRig = forwardRef<CameraRigHandle, CameraRigProps>(function CameraRig(
  { fabricFocus },
  ref,
) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const pendingAngle = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      pendingAngle.current = 0;
    },
    setView: (view) => {
      pendingAngle.current = VIEW_ANGLES[view];
    },
  }));

  useFrame(() => {
    if (pendingAngle.current === null || !controlsRef.current) return;
    const distance = fabricFocus ? DEFAULT_DISTANCE * 0.45 : DEFAULT_DISTANCE;
    const targetPos = new THREE.Vector3(
      Math.sin(pendingAngle.current) * distance,
      DEFAULT_TARGET.y,
      Math.cos(pendingAngle.current) * distance,
    );
    camera.position.lerp(targetPos, 0.12);
    controlsRef.current.target.lerp(DEFAULT_TARGET, 0.12);
    controlsRef.current.update();
    if (camera.position.distanceTo(targetPos) < 0.01) {
      pendingAngle.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.9}
      maxDistance={4.5}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.75}
      target={DEFAULT_TARGET}
      makeDefault
    />
  );
});
