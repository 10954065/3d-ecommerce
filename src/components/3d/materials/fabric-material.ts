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
    uCreaseAmplitude: { value: number };
    uCreaseFrequency: { value: number };
  };
}

const DRAPE_AMPLITUDE: Record<FabricPhysicalProps["drape"], number> = {
  low: 0.004,
  medium: 0.01,
  high: 0.02,
};

/**
 * Stiffer/lower-drape fabrics (denim) fold into fewer, deeper creases; soft
 * high-drape fabrics (silk) fold into many shallow ones. Kept deliberately
 * small (sub-millimeter to ~1.5mm) — this rides on top of a garment shell
 * that only clears the body by a few millimeters of fit ease, so anything
 * larger risks visibly poking through the body underneath.
 */
function creaseAmplitudeFor(fabric: FabricPhysicalProps): number {
  const base = 0.0004 + fabric.bendingResistance * 0.0009;
  const drapeScale = fabric.drape === "low" ? 1.3 : fabric.drape === "high" ? 0.6 : 1.0;
  const stretchDamping = 1 - fabric.stretchResistance * 0.4; // sportswear (high stretch) shows fewer loose folds
  return base * drapeScale * stretchDamping;
}

function creaseFrequencyFor(fabric: FabricPhysicalProps): number {
  return 9 - fabric.bendingResistance * 4;
}

/**
 * Level 1 (Performance Mode) secondary motion: a PBR MeshStandardMaterial
 * with a vertex-displacement injection standing in for real cloth physics.
 * Two effects layer on top of each other:
 *
 * 1. A global sway/billow (unchanged) driven by drape/stiffness/damping —
 *    the garment's overall hang and motion response.
 * 2. A joint-proximity crease — compression wrinkles where the garment's
 *    skin weights blend between two bones (elbow, knee, waist, shoulder),
 *    using the geometry's own `skinWeight` attribute as a free "how close to
 *    a joint" signal (no extra data needed). Scaled mostly by `uActivity` so
 *    creases are subtle at rest and pronounced during motion — an
 *    approximation of "wrinkles depend on pose," not random per-vertex
 *    noise. Amplitude/frequency come from the fabric's bendingResistance,
 *    drape, and stretchResistance (see creaseAmplitudeFor/creaseFrequencyFor)
 *    so denim creases differently from silk or stretch sportswear.
 *
 * Swap for baked SimulationAsset playback (Level 3) on products with
 * `simulationQuality: CINEMATIC`.
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
    uCreaseAmplitude: { value: creaseAmplitudeFor(fabric) },
    uCreaseFrequency: { value: creaseFrequencyFor(fabric) },
  };

  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    // Floor raised from 0.35 -> 0.48: dark garments under a bright studio
    // key light were reading as glossy plastic at the old baseline — real
    // woven fabric (even sleek silk) reflects far softer than that.
    roughness: 0.48 + fabric.stiffness * 0.42,
    metalness: fabric.massGsm > 450 ? 0.05 : 0.0,
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
        uniform float uMaxY;
        uniform float uCreaseAmplitude;
        uniform float uCreaseFrequency;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float heightSpan = max(uMaxY - uMinY, 0.0001);
        float t = clamp((position.y - uMinY) / heightSpan, 0.0, 1.0);
        float drapeFactor = pow(1.0 - t, 1.6);
        float sway = sin(uTime * uFrequency + position.y * 6.0) * uAmplitude;
        float billow = cos(uTime * uFrequency * 0.7 + position.x * 4.0) * uAmplitude * 0.6;
        float activity = 1.0 + uActivity * 0.9;
        transformed.x += sway * drapeFactor * activity;
        transformed.z += billow * drapeFactor * activity;

        #ifdef USE_SKINNING
        float jointBlend = 1.0 - smoothstep(0.0, 0.6, abs(skinWeight.x - skinWeight.y));
        float creaseIntensity = (0.3 + 0.7 * uActivity) * jointBlend;
        float crease = sin(position.y * uCreaseFrequency + uTime * 0.5) * uCreaseAmplitude * creaseIntensity;
        transformed += normal * crease;
        #endif`,
      );

    // Keep a reference so the component can update uniforms per-frame.
    (material as unknown as { __shader: THREE.WebGLProgramParametersWithUniforms }).__shader = shader;
  };

  return { material, uniforms };
}
