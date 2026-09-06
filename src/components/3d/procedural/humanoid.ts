import type { MannequinMeasurements } from "../types";

/**
 * Converts a measurement set into a stack of simple radial body segments, in
 * meters, from the ground up. This is a stylized tailor's-dummy abstraction —
 * not an anatomically skinned mesh — chosen because it lets garment fit
 * respond directly and legibly to chest/waist/hip/shoulder/arm numbers
 * without a rigged character asset. Swap in a real scanned+rigged mannequin
 * GLB via Mannequin.baseModelUrl when one is available; this generator
 * remains the always-available fallback.
 */
export interface BodySegment {
  name: string;
  /** Y position (meters) of the segment's bottom face, from the ground. */
  y: number;
  height: number;
  radiusBottom: number;
  radiusTop: number;
}

export interface HumanoidRig {
  totalHeight: number;
  torso: BodySegment[];
  neck: BodySegment;
  headRadius: number;
  headY: number;
  shoulderY: number;
  shoulderHalfWidth: number;
  armLength: number;
  armRadiusTop: number;
  armRadiusBottom: number;
  hipHalfWidth: number;
  legLength: number;
  legRadiusTop: number;
  legRadiusBottom: number;
  ankleY: number;
}

const circumferenceToRadius = (cm: number) => cm / (2 * Math.PI) / 100;

export function buildHumanoidRig(m: MannequinMeasurements): HumanoidRig {
  const height = m.heightCm / 100;
  const legLength = m.inseamCm / 100;
  const ankleY = height * 0.02;
  const hipY = ankleY + legLength;

  const chestR = circumferenceToRadius(m.chestCm);
  const waistR = circumferenceToRadius(m.waistCm);
  const hipsR = circumferenceToRadius(m.hipsCm);
  const thighR = circumferenceToRadius(m.thighCm) * 0.8;
  const neckR = circumferenceToRadius(m.neckCm);

  const pelvisHeight = height * 0.08;
  const waistHeight = height * 0.09;
  const chestHeight = height * 0.13;
  const neckHeight = height * 0.03;
  const headRadius = height * 0.062;

  const pelvisY = hipY;
  const waistY = pelvisY + pelvisHeight;
  const chestY = waistY + waistHeight;
  const shoulderY = chestY + chestHeight;
  const neckY = shoulderY;
  const headY = neckY + neckHeight + headRadius * 0.9;

  const torso: BodySegment[] = [
    { name: "pelvis", y: pelvisY, height: pelvisHeight, radiusBottom: hipsR * 0.94, radiusTop: hipsR },
    { name: "waist", y: waistY, height: waistHeight, radiusBottom: hipsR, radiusTop: waistR },
    { name: "chest", y: chestY, height: chestHeight, radiusBottom: waistR, radiusTop: chestR },
  ];

  return {
    totalHeight: height,
    torso,
    neck: { name: "neck", y: neckY, height: neckHeight, radiusBottom: neckR, radiusTop: neckR * 0.95 },
    headRadius,
    headY,
    shoulderY,
    shoulderHalfWidth: m.shoulderWidthCm / 100 / 2,
    armLength: m.armLengthCm / 100,
    armRadiusTop: neckR * 0.85,
    armRadiusBottom: neckR * 0.6,
    hipHalfWidth: hipsR * 0.65,
    legLength,
    legRadiusTop: thighR,
    legRadiusBottom: thighR * 0.55,
    ankleY,
  };
}
