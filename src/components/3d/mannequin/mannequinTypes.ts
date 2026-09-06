import type { MannequinMeasurements } from "../types";

export type MannequinGender = "male" | "female";

export type MannequinMaterialPresetId = "ivory" | "beige" | "stone" | "white";

export interface MannequinMaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
}

/**
 * Bone names matching the hierarchy requested for the mannequin skeleton.
 * Parent/child relationships live in `mannequinConfig.ts`'s BONE_HIERARCHY,
 * not here — this is just the closed set of valid names.
 */
export type BoneName =
  | "Root"
  | "Pelvis"
  | "Spine"
  | "Spine_01"
  | "Spine_02"
  | "Chest"
  | "Neck"
  | "Head"
  | "L_Shoulder"
  | "L_UpperArm"
  | "L_Forearm"
  | "L_Hand"
  | "R_Shoulder"
  | "R_UpperArm"
  | "R_Forearm"
  | "R_Hand"
  | "L_UpperLeg"
  | "L_LowerLeg"
  | "L_Foot"
  | "L_Toe"
  | "R_UpperLeg"
  | "R_LowerLeg"
  | "R_Foot"
  | "R_Toe";

/**
 * Where the visible mesh comes from. "procedural" is the always-available
 * generator in MannequinBuilder.ts; "gltf" loads a real authored asset via
 * drei's useGLTF. Only "procedural" is ever produced today (no licensed GLB
 * exists yet) — the "gltf" branch is real, working code, not a stub, so
 * pointing a Mannequin.baseModelUrl at a real file later is a data change.
 */
export type MannequinSource =
  | { kind: "procedural"; gender: MannequinGender; measurements: MannequinMeasurements }
  | { kind: "gltf"; url: string };

export interface MannequinHandle {
  /** The root Object3D — parent of the skinned mesh and skeleton root bone. */
  group: import("three").Group | null;
  skeleton: import("three").Skeleton | null;
  bones: Partial<Record<BoneName, import("three").Bone>>;
}
