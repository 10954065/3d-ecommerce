"use client";

/* eslint-disable react-hooks/immutability --
 * The per-frame uTime/uActivity uniform update below mutates a
 * useMemo-derived material handle inside useFrame — the standard
 * react-three-fiber pattern (mutate the scene graph/shader uniforms
 * directly every frame; never setState per frame). That mutation runs on
 * three.js's render loop, outside React's render/memoization cycle, so it
 * cannot break compiler memoization the way mutating React state would.
 * MannequinFigure.tsx's old fabricHandles-ref pattern did the same update
 * without tripping this rule (it read from a plain useRef, not a useMemo
 * return); see MannequinAnimation.ts for the same tradeoff on bones. */
import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildGarmentGeometry } from "./GarmentBuilder";
import { createFabricMaterial } from "../materials/fabric-material";
import type { MannequinGender } from "./mannequinTypes";
import type { FabricPhysicalProps, FitType, GarmentArchetype, MannequinMeasurements } from "../types";

export interface GarmentProps {
  gender: MannequinGender;
  measurements: MannequinMeasurements;
  archetype: GarmentArchetype;
  fit: FitType;
  colorHex: string;
  fabric: FabricPhysicalProps;
  /** The body's own skeleton — garments bind to it directly rather than owning bones, so both deform from the same live bone transforms each frame. */
  skeleton: THREE.Skeleton;
  /** Ref rather than state — read inside useFrame so per-frame changes never trigger a re-render. */
  activityRef: RefObject<number>;
}

/**
 * One garment as a single lofted SkinnedMesh, bound to the body's skeleton
 * (see GarmentBuilder.ts for how its shells are derived from the body's own
 * landmark chains). Rebuilds only when archetype/fit/measurements/gender
 * change — color and fabric changes rebuild the material, not the geometry.
 */
export function Garment({ gender, measurements, archetype, fit, colorHex, fabric, skeleton, activityRef }: GarmentProps) {
  const { mesh, handle } = useMemo(() => {
    const built = buildGarmentGeometry(archetype, gender, measurements, fit);
    const materialHandle = createFabricMaterial(colorHex, fabric, built.minY, built.maxY);
    const skinnedMesh = new THREE.SkinnedMesh(built.geometry, materialHandle.material);
    skinnedMesh.bind(skeleton);
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    // Skinned deformation can move vertices outside the bind-pose bounding
    // sphere Three.js computes by default; never cull this single mesh.
    skinnedMesh.frustumCulled = false;
    return { mesh: skinnedMesh, handle: materialHandle };
  }, [gender, measurements, archetype, fit, colorHex, fabric, skeleton]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      handle.material.dispose();
    };
  }, [mesh, handle]);

  useFrame((state) => {
    handle.uniforms.uTime.value = state.clock.elapsedTime;
    handle.uniforms.uActivity.value = activityRef.current;
  });

  return <primitive object={mesh} />;
}
