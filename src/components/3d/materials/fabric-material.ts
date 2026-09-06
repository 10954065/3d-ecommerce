import * as THREE from "three";
import type { FabricPhysicalProps } from "../types";

export interface FabricMaterialHandle {
  material: THREE.MeshStandardMaterial;
  uniforms: {
    uTime: { value: number };
    uAmplitude: { value: number };
    uFrequency: { value: number };
    uActivity: { value: number };
    uMinY: { value: number };
    uMaxY: { value: number };
  };
}

const DRAPE_AMPLITUDE: Record<FabricPhysicalProps["drape"], number> = {
  low: 0.004,
  medium: 0.01,
  high: 0.02,
};

/**
 * Level 1 (Performance Mode) secondary motion: a PBR MeshStandardMaterial
 * with a vertex-displacement injection standing in for real cloth physics.
 * Displacement amplitude/frequency derive from the garment's FabricMaterial
 * physics fields (stiffness, damping, drape) so silk visibly moves more than
 * denim or leather. Swap for baked SimulationAsset playback (Level 3) on
 * products with `simulationQuality: CINEMATIC`.
 */
export function createFabricMaterial(
  colorHex: string,
  fabric: FabricPhysicalProps,
  minY: number,
  maxY: number,
): FabricMaterialHandle {
  const uniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: DRAPE_AMPLITUDE[fabric.drape] * (1 - fabric.stiffness * 0.6) },
    uFrequency: { value: 1.4 + (1 - fabric.damping) * 1.6 },
    uActivity: { value: 0.15 },
    uMinY: { value: minY },
    uMaxY: { value: maxY },
  };

  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35 + fabric.stiffness * 0.5,
    metalness: fabric.massGsm > 450 ? 0.08 : 0.0,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uFrequency;
        uniform float uActivity;
        uniform float uMinY;
        uniform float uMaxY;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float heightSpan = max(uMaxY - uMinY, 0.0001);
        float t = clamp((position.y - uMinY) / heightSpan, 0.0, 1.0);
        float drapeFactor = pow(1.0 - t, 1.6);
        float sway = sin(uTime * uFrequency + position.y * 6.0) * uAmplitude;
        float billow = cos(uTime * uFrequency * 0.7 + position.x * 4.0) * uAmplitude * 0.6;
        float activity = 1.0 + uActivity * 3.0;
        transformed.x += sway * drapeFactor * activity;
        transformed.z += billow * drapeFactor * activity;`,
      );

    // Keep a reference so the component can update uniforms per-frame.
    (material as unknown as { __shader: THREE.WebGLProgramParametersWithUniforms }).__shader = shader;
  };

  return { material, uniforms };
}
