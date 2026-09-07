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

/**
 * Per-size measurement tables, mirroring prisma/seed-data/mannequins.ts's
 * MEN_MEASUREMENTS/WOMEN_MEASUREMENTS exactly (kept as a local client-side
 * copy rather than importing that seed file, same rationale as
 * DEFAULT_MALE_MEASUREMENTS/DEFAULT_FEMALE_MEASUREMENTS above). Used to solve
 * size -> morph-weight in MannequinMorphs.ts.
 */
export const SIZE_MEASUREMENTS: Record<"male" | "female", Record<"XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL", MannequinMeasurements>> = {
  male: {
    XS: { heightCm: 168, chestCm: 86, waistCm: 71, hipsCm: 88, shoulderWidthCm: 42, armLengthCm: 60, inseamCm: 78, neckCm: 36, thighCm: 50 },
    S: { heightCm: 172, chestCm: 91, waistCm: 76, hipsCm: 93, shoulderWidthCm: 44, armLengthCm: 61, inseamCm: 80, neckCm: 37, thighCm: 52 },
    M: { heightCm: 176, chestCm: 97, waistCm: 82, hipsCm: 99, shoulderWidthCm: 46, armLengthCm: 62, inseamCm: 82, neckCm: 39, thighCm: 55 },
    L: { heightCm: 180, chestCm: 103, waistCm: 88, hipsCm: 105, shoulderWidthCm: 48, armLengthCm: 63, inseamCm: 84, neckCm: 41, thighCm: 58 },
    XL: { heightCm: 183, chestCm: 109, waistCm: 94, hipsCm: 111, shoulderWidthCm: 50, armLengthCm: 64, inseamCm: 86, neckCm: 43, thighCm: 61 },
    XXL: { heightCm: 185, chestCm: 115, waistCm: 100, hipsCm: 117, shoulderWidthCm: 52, armLengthCm: 65, inseamCm: 87, neckCm: 45, thighCm: 64 },
    XXXL: { heightCm: 187, chestCm: 121, waistCm: 106, hipsCm: 123, shoulderWidthCm: 54, armLengthCm: 66, inseamCm: 88, neckCm: 47, thighCm: 67 },
  },
  female: {
    XS: { heightCm: 158, chestCm: 81, waistCm: 63, hipsCm: 89, shoulderWidthCm: 36, armLengthCm: 56, inseamCm: 74, neckCm: 31, thighCm: 48 },
    S: { heightCm: 162, chestCm: 86, waistCm: 68, hipsCm: 94, shoulderWidthCm: 37, armLengthCm: 57, inseamCm: 76, neckCm: 32, thighCm: 51 },
    M: { heightCm: 166, chestCm: 91, waistCm: 73, hipsCm: 99, shoulderWidthCm: 38, armLengthCm: 58, inseamCm: 78, neckCm: 33, thighCm: 54 },
    L: { heightCm: 169, chestCm: 97, waistCm: 79, hipsCm: 105, shoulderWidthCm: 39, armLengthCm: 59, inseamCm: 79, neckCm: 34, thighCm: 57 },
    XL: { heightCm: 172, chestCm: 103, waistCm: 85, hipsCm: 111, shoulderWidthCm: 40, armLengthCm: 60, inseamCm: 80, neckCm: 35, thighCm: 60 },
    XXL: { heightCm: 174, chestCm: 109, waistCm: 91, hipsCm: 117, shoulderWidthCm: 41, armLengthCm: 61, inseamCm: 81, neckCm: 36, thighCm: 63 },
    XXXL: { heightCm: 176, chestCm: 115, waistCm: 97, hipsCm: 123, shoulderWidthCm: 42, armLengthCm: 62, inseamCm: 82, neckCm: 37, thighCm: 66 },
  },
};
