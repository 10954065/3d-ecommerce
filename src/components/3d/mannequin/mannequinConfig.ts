import type { MannequinMeasurements } from "../types";
import type { BoneName, MannequinMaterialConfig, MannequinMaterialPresetId } from "./mannequinTypes";

/** Bone parent relationships only — world offsets are derived at build time from the same landmark/socket data the mesh uses, so joints always land inside the mesh regardless of measurements. */
export const BONE_PARENTS: Record<BoneName, BoneName | null> = {
  Root: null,
  Pelvis: "Root",
  Spine: "Pelvis",
  Spine_01: "Spine",
  Spine_02: "Spine_01",
  Chest: "Spine_02",
  Neck: "Chest",
  Head: "Neck",
  L_Shoulder: "Chest",
  L_UpperArm: "L_Shoulder",
  L_Forearm: "L_UpperArm",
  L_Hand: "L_Forearm",
  R_Shoulder: "Chest",
  R_UpperArm: "R_Shoulder",
  R_Forearm: "R_UpperArm",
  R_Hand: "R_Forearm",
  L_UpperLeg: "Pelvis",
  L_LowerLeg: "L_UpperLeg",
  L_Foot: "L_LowerLeg",
  L_Toe: "L_Foot",
  R_UpperLeg: "Pelvis",
  R_LowerLeg: "R_UpperLeg",
  R_Foot: "R_LowerLeg",
  R_Toe: "R_Foot",
};

export const BONE_ORDER: BoneName[] = Object.keys(BONE_PARENTS) as BoneName[];

export const MANNEQUIN_MATERIAL_PRESETS: Record<MannequinMaterialPresetId, MannequinMaterialConfig & { label: string }> = {
  ivory: { label: "Warm Ivory", color: "#EFE7D8", roughness: 0.52, metalness: 0 },
  beige: { label: "Soft Beige", color: "#DCD1BE", roughness: 0.55, metalness: 0 },
  stone: { label: "Neutral Stone", color: "#C9C3B8", roughness: 0.6, metalness: 0 },
  white: { label: "Premium Matte White", color: "#F4F2ED", roughness: 0.48, metalness: 0 },
};

export const DEFAULT_MATERIAL_PRESET: MannequinMaterialPresetId = "ivory";

/** Reference (size M) measurements for each gender, matching prisma/seed-data/mannequins.ts's M rows. */
export const DEFAULT_MALE_MEASUREMENTS: MannequinMeasurements = {
  heightCm: 176,
  chestCm: 97,
  waistCm: 82,
  hipsCm: 99,
  shoulderWidthCm: 46,
  armLengthCm: 62,
  inseamCm: 82,
  neckCm: 39,
  thighCm: 55,
};

export const DEFAULT_FEMALE_MEASUREMENTS: MannequinMeasurements = {
  heightCm: 166,
  chestCm: 91,
  waistCm: 73,
  hipsCm: 99,
  shoulderWidthCm: 38,
  armLengthCm: 58,
  inseamCm: 78,
  neckCm: 33,
  thighCm: 54,
};

export const RADIAL_SEGMENTS = 28;
export const RINGS_PER_SEGMENT = 7;
export const FINGER_RADIAL_SEGMENTS = 10;
export const FINGER_RINGS_PER_SEGMENT = 4;
