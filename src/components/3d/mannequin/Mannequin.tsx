"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildMannequinGeometry } from "./MannequinBuilder";
import { applyPresentationPose, buildSkeleton } from "./MannequinSkeleton";
import { createMannequinMaterial } from "./MannequinMaterials";
import { useGltfMannequinAsset } from "./MannequinLoader";
import { buildMorphTargets, morphWeightsToInfluenceArray, type MorphName } from "./MannequinMorphs";
import { buildCollisionCapsuleSpecs, buildCollisionProxy } from "./MannequinCollision";
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
  morphWeights?: Partial<Record<MorphName, number>>;
  showCollisionDebug?: boolean;
}

const ProceduralMannequin = forwardRef<MannequinHandle, ProceduralMannequinProps>(function ProceduralMannequin(
  { gender, measurements, material, morphWeights, showCollisionDebug },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const build = buildMannequinGeometry(gender, measurements);
    const basePositions = (build.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    const morphs = buildMorphTargets(gender, measurements, basePositions);
    build.geometry.morphAttributes.position = morphs.deltas.map((delta, i) => {
      const attribute = new THREE.BufferAttribute(delta, 3);
      attribute.name = morphs.names[i];
      return attribute;
    });
    build.geometry.morphTargetsRelative = true;

    const skeletonResult = buildSkeleton(build.boneWorldPositions);
    const meshMaterial = createMannequinMaterial(material);
    const skinnedMesh = new THREE.SkinnedMesh(build.geometry, meshMaterial);
    skinnedMesh.add(skeletonResult.rootBone);
    skinnedMesh.bind(skeletonResult.skeleton);
    skinnedMesh.updateMorphTargets();
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    applyPresentationPose(skeletonResult.bones);

    const collisionSpecs = buildCollisionCapsuleSpecs(gender, measurements);
    const collisionProxy = buildCollisionProxy(collisionSpecs, build.boneWorldPositions);

    return {
      mesh: skinnedMesh,
      skeleton: skeletonResult.skeleton,
      bones: skeletonResult.bones,
      collisionProxy,
    };
  }, [gender, measurements, material]);

  useEffect(() => {
    return () => {
      built.mesh.geometry.dispose();
      (built.mesh.material as THREE.Material).dispose();
      built.collisionProxy.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
    };
  }, [built]);

  useEffect(() => {
    const influences = built.mesh.morphTargetInfluences;
    if (!influences) return;
    const resolved = morphWeightsToInfluenceArray(morphWeights ?? {});
    for (let i = 0; i < influences.length; i++) {
      influences[i] = resolved[i] ?? 0;
    }
  }, [built, morphWeights]);

  useImperativeHandle(
    ref,
    () => ({ group: groupRef.current, skeleton: built.skeleton, bones: built.bones, collisionProxy: built.collisionProxy }),
    [built],
  );

  return (
    <group ref={groupRef}>
      <primitive object={built.mesh} />
      <primitive object={built.collisionProxy} visible={showCollisionDebug ?? false} />
    </group>
  );
});

const GltfMannequin = forwardRef<MannequinHandle, { url: string }>(function GltfMannequin({ url }, ref) {
  const gltf = useGltfMannequinAsset(url);
  const groupRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({ group: groupRef.current, skeleton: null, bones: {}, collisionProxy: null }), []);

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
  /** Size/body-shape morph weights — see MannequinMorphs.ts's resolveSizeMorphWeights/BODY_SHAPE_WEIGHTS/combineMorphWeights. Ignored for a "gltf" source until an imported asset carries its own morph targets. */
  morphWeights?: Partial<Record<MorphName, number>>;
  /** Renders the capsule/sphere collision proxy as a visible wireframe overlay — QA-only, off by default. */
  showCollisionDebug?: boolean;
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
  { gender, measurements, material = DEFAULT_MATERIAL_PRESET, morphWeights, showCollisionDebug, source },
  ref,
) {
  const resolved: MannequinSource = source ?? { kind: "procedural", gender, measurements };

  if (resolved.kind === "gltf") {
    return <GltfMannequin ref={ref} url={resolved.url} />;
  }
  return (
    <ProceduralMannequin
      ref={ref}
      gender={resolved.gender}
      measurements={resolved.measurements}
      material={material}
      morphWeights={morphWeights}
      showCollisionDebug={showCollisionDebug}
    />
  );
});
