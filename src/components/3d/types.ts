export interface MannequinMeasurements {
  heightCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  shoulderWidthCm: number;
  armLengthCm: number;
  inseamCm: number;
  neckCm: number;
  thighCm: number;
}

export type GarmentArchetype =
  | "tshirt"
  | "shirt"
  | "trousers"
  | "jacket"
  | "coat"
  | "dress"
  | "skirt"
  | "jumpsuit";

export type FitType = "SLIM" | "REGULAR" | "RELAXED" | "OVERSIZED";

export interface FabricPhysicalProps {
  massGsm: number;
  friction: number;
  stiffness: number;
  bendingResistance: number;
  stretchResistance: number;
  damping: number;
  elasticity: number;
  drape: "low" | "medium" | "high";
}

export type AnimationClipName =
  | "IDLE"
  | "TURN_360"
  | "WALK"
  | "ARM_RAISE"
  | "WEIGHT_SHIFT"
  | "FABRIC_TEST";

export type LightingPreset =
  | "STUDIO"
  | "DAYLIGHT"
  | "WARM"
  | "COOL"
  | "RUNWAY"
  | "OUTDOOR";

export type PerformanceTier = "LOW" | "MEDIUM" | "HIGH" | "ULTRA";

/** Parses GarmentAsset.baseModelUrl. "procedural:<archetype>" drives the built-in
 *  generator; anything else is treated as a real GLB/GLTF URL for GLTFLoader. */
export function parseModelSource(
  baseModelUrl: string,
): { kind: "procedural"; archetype: GarmentArchetype } | { kind: "gltf"; url: string } {
  if (baseModelUrl.startsWith("procedural:")) {
    return {
      kind: "procedural",
      archetype: baseModelUrl.replace("procedural:", "") as GarmentArchetype,
    };
  }
  return { kind: "gltf", url: baseModelUrl };
}
