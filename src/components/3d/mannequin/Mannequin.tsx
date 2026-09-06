"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildMannequinGeometry } from "./MannequinBuilder";
import { applyPresentationPose, buildSkeleton } from "./MannequinSkeleton";
import { createMannequinMaterial } from "./MannequinMaterials";
import { useGltfMannequinAsset } from "./MannequinLoader";
import { DEFAULT_MATERIAL_PRESET } from "./mannequinConfig";
import type {
  MannequinGender,
  MannequinHandle,
  MannequinMaterialConfig,
  MannequinMaterialPresetId,
  MannequinSource,
} from "./mannequinTypes";
import type { MannequinMeasurements } from "../types";

interface ProceduralMannequinProps {
  gender: MannequinGender;
  measurements: MannequinMeasurements;
  material: MannequinMaterialPresetId | MannequinMaterialConfig;
}

const ProceduralMannequin = forwardRef<MannequinHandle, ProceduralMannequinProps>(function ProceduralMannequin(
  { gender, measurements, material },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const build = buildMannequinGeometry(gender, measurements);
    const skeletonResult = buildSkeleton(build.boneWorldPositions);
    const meshMaterial = createMannequinMaterial(material);
    const skinnedMesh = new THREE.SkinnedMesh(build.geometry, meshMaterial);
    skinnedMesh.add(skeletonResult.rootBone);
    skinnedMesh.bind(skeletonResult.skeleton);
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    applyPresentationPose(skeletonResult.bones);
    return { mesh: skinnedMesh, skeleton: skeletonResult.skeleton, bones: skeletonResult.bones };
  }, [gender, measurements, material]);

  useEffect(() => {
    return () => {
      built.mesh.geometry.dispose();
      (built.mesh.material as THREE.Material).dispose();
    };
  }, [built]);

  useImperativeHandle(ref, () => ({ group: groupRef.current, skeleton: built.skeleton, bones: built.bones }), [built]);

  return (
    <group ref={groupRef}>
      <primitive object={built.mesh} />
    </group>
  );
});

const GltfMannequin = forwardRef<MannequinHandle, { url: string }>(function GltfMannequin({ url }, ref) {
  const gltf = useGltfMannequinAsset(url);
  const groupRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({ group: groupRef.current, skeleton: null, bones: {} }), []);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
});

export interface MannequinProps {
  gender: MannequinGender;
  measurements: MannequinMeasurements;
  material?: MannequinMaterialPresetId | MannequinMaterialConfig;
  /** Defaults to the always-available procedural generator for this gender/measurements. */
  source?: MannequinSource;
}

/**
 * Public entry point for the mannequin engine. Renders one of two child
 * components based on `source.kind` — never a conditional hook call, just a
 * conditional element, which is the correct React pattern for a variant that
 * needs a different hook (useGLTF vs. the procedural builder) per branch.
 */
export const Mannequin = forwardRef<MannequinHandle, MannequinProps>(function Mannequin(
  { gender, measurements, material = DEFAULT_MATERIAL_PRESET, source },
  ref,
) {
  const resolved: MannequinSource = source ?? { kind: "procedural", gender, measurements };

  if (resolved.kind === "gltf") {
    return <GltfMannequin ref={ref} url={resolved.url} />;
  }
  return <ProceduralMannequin ref={ref} gender={resolved.gender} measurements={resolved.measurements} material={material} />;
});
