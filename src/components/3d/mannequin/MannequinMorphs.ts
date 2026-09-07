import * as THREE from "three";
import { buildMannequinGeometry, type MannequinMorphOverrides } from "./MannequinBuilder";
import { getProportions } from "./geometry/body-chains";
import { DEFAULT_FEMALE_MEASUREMENTS, DEFAULT_MALE_MEASUREMENTS, SIZE_MEASUREMENTS } from "./mannequinConfig";
import type { MannequinGender } from "./mannequinTypes";
import type { MannequinMeasurements } from "../types";

export type MorphName =
  | "height"
  | "shoulderWidth"
  | "chest"
  | "bust"
  | "waist"
  | "hip"
  | "thigh"
  | "armVolume"
  | "legLength"
  | "torsoLength";

export const MORPH_NAMES: MorphName[] = [
  "height",
  "shoulderWidth",
  "chest",
  "bust",
  "waist",
  "hip",
  "thigh",
  "armVolume",
  "legLength",
  "torsoLength",
];

export type SizeLabel = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export type BodyShapePreset = "Slim" | "Regular" | "Athletic" | "Curvy" | "Plus" | "Tall" | "Petite" | "Custom";

export const BODY_SHAPE_PRESETS: BodyShapePreset[] = ["Slim", "Regular", "Athletic", "Curvy", "Plus", "Tall", "Petite", "Custom"];

type MorphWeights = Partial<Record<MorphName, number>>;

interface MorphAxisSpec {
  /** The MannequinMeasurements field this axis perturbs, if any — used both to build the morph target and to solve size -> weight. */
  measurementKey?: keyof MannequinMeasurements;
  /** The delta (in the measurement's own unit, cm) that a weight of 1.0 represents. */
  measurementDelta?: number;
  /** Proportion-level deltas for axes with no direct measurement field (see MannequinBuilder's MannequinMorphOverrides). */
  armVolumeDelta?: number;
  frontBulgeDelta?: number;
  torsoLengthScaleDelta?: number;
}

/**
 * One entry per requested morph target. Each maps a weight of "1.0" to a
 * concrete perturbation — either a measurement delta (reused to build the
 * target AND to solve which weight reproduces a given size's measurements)
 * or a proportion-level delta for axes with no single circumference (bust
 * prominence, arm volume, torso length).
 */
const MORPH_AXES: Record<MorphName, MorphAxisSpec> = {
  height: { measurementKey: "heightCm", measurementDelta: 10 },
  shoulderWidth: { measurementKey: "shoulderWidthCm", measurementDelta: 4 },
  chest: { measurementKey: "chestCm", measurementDelta: 8 },
  bust: { frontBulgeDelta: 0.02 },
  waist: { measurementKey: "waistCm", measurementDelta: 8 },
  hip: { measurementKey: "hipsCm", measurementDelta: 8 },
  thigh: { measurementKey: "thighCm", measurementDelta: 4 },
  armVolume: { armVolumeDelta: 0.25 },
  legLength: { measurementKey: "inseamCm", measurementDelta: 6 },
  torsoLength: { torsoLengthScaleDelta: 0.08 },
};

function overridesForAxis(gender: MannequinGender, axis: MorphName): MannequinMorphOverrides {
  const spec = MORPH_AXES[axis];
  const base = getProportions(gender);
  return {
    armVolume: spec.armVolumeDelta !== undefined ? base.armVolume + spec.armVolumeDelta : undefined,
    chestFrontBulge: spec.frontBulgeDelta !== undefined ? (base.chest.frontBulge ?? 0) + spec.frontBulgeDelta : undefined,
    torsoLengthScale: spec.torsoLengthScaleDelta !== undefined ? 1 + spec.torsoLengthScaleDelta : undefined,
  };
}

function measurementsForAxis(base: MannequinMeasurements, axis: MorphName): MannequinMeasurements {
  const spec = MORPH_AXES[axis];
  if (!spec.measurementKey || spec.measurementDelta === undefined) return base;
  return { ...base, [spec.measurementKey]: base[spec.measurementKey] + spec.measurementDelta };
}

export interface MorphTargetSet {
  names: MorphName[];
  /** One Float32Array of position deltas per axis, same length/order as the base geometry's position attribute (for geometry.morphAttributes.position, morphTargetsRelative = true). */
  deltas: Float32Array[];
}

/**
 * Re-evaluates the full mannequin builder once per axis (holding every other
 * parameter at its base value) and stores the position delta. This only
 * works because buildMannequinGeometry's topology (ring/vertex count and
 * order) is a pure function of the profile definition, never of the
 * measurement values — confirmed by the vertex-count-mismatch check below.
 */
export function buildMorphTargets(
  gender: MannequinGender,
  baseMeasurements: MannequinMeasurements,
  basePositions: Float32Array,
): MorphTargetSet {
  const deltas: Float32Array[] = [];

  for (const axis of MORPH_NAMES) {
    const variantMeasurements = measurementsForAxis(baseMeasurements, axis);
    const overrides = overridesForAxis(gender, axis);
    const variant = buildMannequinGeometry(gender, variantMeasurements, overrides);
    const variantPositions = (variant.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;

    if (variantPositions.length !== basePositions.length) {
      throw new Error(`Morph axis "${axis}" produced ${variantPositions.length} position values, expected ${basePositions.length} — topology drifted.`);
    }

    const delta = new Float32Array(variantPositions.length);
    for (let i = 0; i < delta.length; i++) {
      delta[i] = variantPositions[i] - basePositions[i];
    }
    deltas.push(delta);
  }

  return { names: MORPH_NAMES, deltas };
}

const SIZE_AXIS_KEYS: Partial<Record<MorphName, keyof MannequinMeasurements>> = {
  height: "heightCm",
  shoulderWidth: "shoulderWidthCm",
  chest: "chestCm",
  waist: "waistCm",
  hip: "hipsCm",
  thigh: "thighCm",
  legLength: "inseamCm",
};

/** Solves the morph weight vector that reproduces `size`'s measurements from the M-reference base — sizes only touch the axes with a direct measurement field. */
export function resolveSizeMorphWeights(gender: MannequinGender, size: SizeLabel): MorphWeights {
  const base = gender === "male" ? DEFAULT_MALE_MEASUREMENTS : DEFAULT_FEMALE_MEASUREMENTS;
  const target = SIZE_MEASUREMENTS[gender][size];
  const weights: MorphWeights = {};

  for (const axis of Object.keys(SIZE_AXIS_KEYS) as MorphName[]) {
    const key = SIZE_AXIS_KEYS[axis]!;
    const delta = MORPH_AXES[axis].measurementDelta!;
    weights[axis] = (target[key] - base[key]) / delta;
  }
  return weights;
}

/**
 * Named weight vectors across all 10 morphs — continuous parameter blends,
 * not swapped unrelated meshes, per the brief's body-shape-preset
 * requirement. "Regular"/"Custom" apply no preset nudge (Custom exposes the
 * raw sliders instead).
 */
export const BODY_SHAPE_WEIGHTS: Record<BodyShapePreset, MorphWeights> = {
  Regular: {},
  Custom: {},
  Slim: { waist: -0.4, hip: -0.2, thigh: -0.35, armVolume: -0.25, chest: -0.1 },
  Athletic: { armVolume: 0.55, chest: 0.25, waist: -0.15, shoulderWidth: 0.2 },
  Curvy: { bust: 0.65, hip: 0.45, waist: -0.25, thigh: 0.2 },
  Plus: { chest: 0.4, waist: 0.55, hip: 0.55, thigh: 0.4, armVolume: 0.2 },
  Tall: { height: 0.7, legLength: 0.55, torsoLength: 0.25 },
  Petite: { height: -0.7, legLength: -0.45, torsoLength: -0.2 },
};

const MAX_WEIGHT = 1.6;

/** Combines size-driven weights with a body-shape preset's nudges, clamped so extrapolation stays plausible. */
export function combineMorphWeights(...sources: MorphWeights[]): MorphWeights {
  const combined: MorphWeights = {};
  for (const source of sources) {
    for (const axis of MORPH_NAMES) {
      const value = source[axis];
      if (value === undefined) continue;
      combined[axis] = THREE.MathUtils.clamp((combined[axis] ?? 0) + value, -MAX_WEIGHT, MAX_WEIGHT);
    }
  }
  return combined;
}

export function morphWeightsToInfluenceArray(weights: MorphWeights): number[] {
  return MORPH_NAMES.map((name) => weights[name] ?? 0);
}
