import type { MannequinMeasurements } from "../../types";
import type { MannequinGender } from "../mannequinTypes";
import type { BodyLandmark } from "./ring-loft";

/** Converts a circumference (cm) to an effective radius (m), assuming a circular cross-section. */
const effR = (cm: number) => cm / (2 * Math.PI) / 100;

interface SectionShape {
  width: number;
  depth: number;
  n: number;
  frontBulge?: number;
}

/**
 * Per-gender proportion tables — these are what actually differentiate the
 * male and female mannequins (distinct waist-to-hip ratios, bust presence,
 * shoulder-to-hip ratio, neck thickness), not a uniform scale of one mesh.
 * Values are multipliers on the circumference-derived effective radius
 * (effR), tuned by eye against typical fashion-mannequin references, and
 * expected to be refined once rendered (see docs/MANNEQUIN_SYSTEM.md).
 */
export interface GenderProportions {
  hip: SectionShape;
  waist: SectionShape;
  underbust: SectionShape;
  chest: SectionShape;
  shoulderBase: SectionShape;
  neck: SectionShape;
  headWidthFactor: number;
  headDepthFactor: number;
  headN: number;
  jawWidthFactor: number;
  armVolume: number;
  legVolume: number;
  handScale: number;
  footScale: number;
  hipSocketInset: number;
}

export const FEMALE_PROPORTIONS: GenderProportions = {
  hip: { width: 1.22, depth: 0.86, n: 2.1 },
  waist: { width: 1.08, depth: 0.78, n: 1.85 },
  underbust: { width: 1.05, depth: 0.8, n: 1.95 },
  chest: { width: 1.1, depth: 0.86, n: 2.05, frontBulge: 0.018 },
  shoulderBase: { width: 1.0, depth: 0.82, n: 2.15 },
  neck: { width: 0.92, depth: 0.86, n: 2.0 },
  headWidthFactor: 0.92,
  headDepthFactor: 0.98,
  headN: 2.3,
  jawWidthFactor: 0.78,
  armVolume: 0.9,
  legVolume: 0.95,
  handScale: 0.92,
  footScale: 0.93,
  hipSocketInset: 0.55,
};

export const MALE_PROPORTIONS: GenderProportions = {
  hip: { width: 1.12, depth: 0.92, n: 2.2 },
  waist: { width: 1.12, depth: 0.9, n: 2.05 },
  underbust: { width: 1.13, depth: 0.92, n: 2.1 },
  chest: { width: 1.18, depth: 0.95, n: 2.25, frontBulge: 0.006 },
  shoulderBase: { width: 1.0, depth: 0.88, n: 2.3 },
  neck: { width: 1.0, depth: 0.94, n: 2.1 },
  headWidthFactor: 1.0,
  headDepthFactor: 1.02,
  headN: 2.5,
  jawWidthFactor: 0.86,
  armVolume: 1.15,
  legVolume: 1.1,
  handScale: 1.08,
  footScale: 1.08,
  hipSocketInset: 0.62,
};

export function getProportions(gender: MannequinGender): GenderProportions {
  return gender === "male" ? MALE_PROPORTIONS : FEMALE_PROPORTIONS;
}

export interface TorsoChainResult {
  landmarks: BodyLandmark[];
  shoulderY: number;
  shoulderHalfWidth: number;
  hipSocketY: number;
  hipSocketHalfWidth: number;
  headRadius: number;
}

/**
 * Pelvis -> waist -> chest -> neck -> head, one continuous chain — no
 * primitive seams. `torsoLengthScale` stretches only the pelvis-to-shoulder
 * span (the "torsoLength" morph target) — neck/head spacing stays fixed
 * since lengthening those would look wrong.
 */
export function buildTorsoChain(
  m: MannequinMeasurements,
  p: GenderProportions,
  legLength: number,
  ankleY: number,
  torsoLengthScale = 1,
): TorsoChainResult {
  const height = m.heightCm / 100;
  const hipY = ankleY + legLength;
  const hipR = effR(m.hipsCm);
  const waistR = effR(m.waistCm);
  const chestR = effR(m.chestCm);
  const neckR = effR(m.neckCm);
  const headRadius = height * 0.062;
  const shoulderHalfWidth = m.shoulderWidthCm / 100 / 2;

  const pelvisBottomY = hipY;
  const hipY2 = pelvisBottomY + height * 0.02 * torsoLengthScale;
  const waistY = hipY2 + height * 0.15 * torsoLengthScale;
  const underbustY = waistY + height * 0.06 * torsoLengthScale;
  const chestY = underbustY + height * 0.05 * torsoLengthScale;
  const shoulderY = chestY + height * 0.045 * torsoLengthScale;
  const neckBaseY = shoulderY + height * 0.012;
  const neckTopY = neckBaseY + height * 0.035;
  const jawY = neckTopY + height * 0.02;
  const cheekY = jawY + height * 0.034;
  const crownBaseY = cheekY + height * 0.03;
  const crownMidY = crownBaseY + height * 0.02;
  const crownY = crownMidY + height * 0.014;

  // The torso's own shoulder ring is brought nearly out to the true
  // shoulderWidthCm socket point (rather than staying chest-width) so the
  // arm attaches flush against the torso instead of leaving a visible notch.
  const shoulderRingHalfWidth = shoulderHalfWidth * 0.93;

  const landmarks: BodyLandmark[] = [
    { name: "pelvisBottom", y: pelvisBottomY, halfWidth: hipR * p.hip.width * 0.88, depthFront: hipR * p.hip.depth * 0.8, depthBack: hipR * p.hip.depth * 0.8, n: p.hip.n },
    { name: "hip", y: hipY2, halfWidth: hipR * p.hip.width, depthFront: hipR * p.hip.depth, depthBack: hipR * p.hip.depth * 0.94, n: p.hip.n },
    { name: "waist", y: waistY, halfWidth: waistR * p.waist.width, depthFront: waistR * p.waist.depth, depthBack: waistR * p.waist.depth * 0.92, n: p.waist.n },
    { name: "underbust", y: underbustY, halfWidth: waistR * p.underbust.width * 1.02, depthFront: waistR * p.underbust.depth, depthBack: waistR * p.underbust.depth * 0.9, n: p.underbust.n },
    {
      name: "chest",
      y: chestY,
      halfWidth: chestR * p.chest.width,
      depthFront: chestR * p.chest.depth + (p.chest.frontBulge ?? 0),
      depthBack: chestR * p.chest.depth * 0.86,
      n: p.chest.n,
    },
    { name: "shoulderBase", y: shoulderY, halfWidth: shoulderRingHalfWidth, depthFront: chestR * p.shoulderBase.depth, depthBack: chestR * p.shoulderBase.depth * 0.9, n: p.shoulderBase.n },
    { name: "neckBase", y: neckBaseY, halfWidth: neckR * p.neck.width * 1.15, depthFront: neckR * p.neck.depth * 1.15, depthBack: neckR * p.neck.depth * 1.05, n: p.neck.n },
    { name: "neckTop", y: neckTopY, halfWidth: neckR * p.neck.width, depthFront: neckR * p.neck.depth, depthBack: neckR * p.neck.depth * 0.94, n: p.neck.n },
    { name: "jaw", y: jawY, halfWidth: headRadius * p.jawWidthFactor, depthFront: headRadius * p.jawWidthFactor * 0.95, depthBack: headRadius * p.jawWidthFactor * 0.85, n: 1.85 },
    { name: "cheek", y: cheekY, halfWidth: headRadius * p.headWidthFactor, depthFront: headRadius * p.headDepthFactor * 0.62, depthBack: headRadius * p.headDepthFactor * 0.54, n: p.headN },
    { name: "crownBase", y: crownBaseY, halfWidth: headRadius * p.headWidthFactor * 0.82, depthFront: headRadius * p.headDepthFactor * 0.58, depthBack: headRadius * p.headDepthFactor * 0.52, n: p.headN },
    { name: "crownMid", y: crownMidY, halfWidth: headRadius * p.headWidthFactor * 0.5, depthFront: headRadius * p.headDepthFactor * 0.36, depthBack: headRadius * p.headDepthFactor * 0.32, n: p.headN },
    { name: "crown", y: crownY, halfWidth: 0.001, depthFront: 0.001, depthBack: 0.001, n: 2 },
  ];

  return {
    landmarks,
    shoulderY,
    shoulderHalfWidth,
    hipSocketY: hipY2,
    hipSocketHalfWidth: hipR * p.hipSocketInset,
    headRadius,
  };
}

export interface ArmChainResult {
  landmarks: BodyLandmark[];
  totalLength: number;
  wristRadius: number;
}

/** Local axis: y=0 at the shoulder socket (embedded into the torso), ascending toward the wrist/palm end. */
export function buildArmChain(m: MannequinMeasurements, p: GenderProportions): ArmChainResult {
  const neckR = effR(m.neckCm);
  const armLength = m.armLengthCm / 100;
  const bicepR = neckR * 0.85 * p.armVolume;
  const elbowR = neckR * 0.62 * p.armVolume;
  const forearmR = neckR * 0.68 * p.armVolume;
  const wristR = neckR * 0.5 * p.armVolume;
  const palmLength = armLength * 0.11;

  const landmarks: BodyLandmark[] = [
    { name: "shoulderEmbed", y: -0.025, halfWidth: bicepR * 1.15, depthFront: bicepR * 1.1, depthBack: bicepR * 1.1, n: 2.2 },
    { name: "shoulder", y: 0, halfWidth: bicepR * 1.05, depthFront: bicepR, depthBack: bicepR, n: 2.15 },
    { name: "bicep", y: armLength * 0.28, halfWidth: bicepR, depthFront: bicepR * 0.95, depthBack: bicepR * 0.95, n: 2.1 },
    { name: "elbow", y: armLength * 0.5, halfWidth: elbowR, depthFront: elbowR * 0.95, depthBack: elbowR * 0.95, n: 2.0 },
    { name: "forearm", y: armLength * 0.68, halfWidth: forearmR, depthFront: forearmR * 0.92, depthBack: forearmR * 0.92, n: 2.0 },
    { name: "wrist", y: armLength * 0.94, halfWidth: wristR, depthFront: wristR * 0.8, depthBack: wristR * 0.8, n: 2.0 },
    { name: "palmBase", y: armLength * 0.94 + palmLength * 0.3, halfWidth: wristR * 1.5, depthFront: wristR * 0.55, depthBack: wristR * 0.55, n: 2.6 },
    { name: "palmEnd", y: armLength * 0.94 + palmLength, halfWidth: wristR * 1.6, depthFront: wristR * 0.5, depthBack: wristR * 0.5, n: 2.8 },
  ];

  return { landmarks, totalLength: armLength * 0.94 + palmLength, wristRadius: wristR };
}

export interface FingerSpec {
  name: string;
  lengthFraction: number;
  radiusFraction: number;
  spreadX: number;
  spreadZ: number;
  bendZ: number;
}

/** Thumb + four fingers, positioned relative to the palm end, each a short independent loft (embedded, not welded). */
export const FINGER_LAYOUT: FingerSpec[] = [
  { name: "thumb", lengthFraction: 0.62, radiusFraction: 1.15, spreadX: 1.35, spreadZ: 0.3, bendZ: 0.55 },
  { name: "index", lengthFraction: 0.92, radiusFraction: 0.85, spreadX: 0.75, spreadZ: 0, bendZ: 0.12 },
  { name: "middle", lengthFraction: 1.0, radiusFraction: 0.85, spreadX: 0.25, spreadZ: 0, bendZ: 0.08 },
  { name: "ring", lengthFraction: 0.9, radiusFraction: 0.8, spreadX: -0.25, spreadZ: 0, bendZ: 0.12 },
  { name: "pinky", lengthFraction: 0.72, radiusFraction: 0.7, spreadX: -0.75, spreadZ: 0, bendZ: 0.18 },
];

export function buildFingerChain(fingerLength: number, radius: number): BodyLandmark[] {
  return [
    { name: "base", y: -0.008, halfWidth: radius * 1.1, depthFront: radius * 1.1, depthBack: radius * 1.1, n: 2.2 },
    { name: "proximal", y: fingerLength * 0.45, halfWidth: radius, depthFront: radius * 0.95, depthBack: radius * 0.95, n: 2.0 },
    { name: "distal", y: fingerLength * 0.8, halfWidth: radius * 0.78, depthFront: radius * 0.75, depthBack: radius * 0.75, n: 2.0 },
    { name: "tip", y: fingerLength, halfWidth: 0.0015, depthFront: 0.0015, depthBack: 0.0015, n: 2 },
  ];
}

export interface LegChainResult {
  landmarks: BodyLandmark[];
  totalLength: number;
  ankleY: number;
}

/** Local axis: y=0 at the ankle, ascending to the hip socket (embedded into the pelvis). */
export function buildLegChain(m: MannequinMeasurements, p: GenderProportions): LegChainResult {
  const thighR = effR(m.thighCm) * 0.82 * p.legVolume;
  const ankleR = thighR * 0.42;
  const calfR = thighR * 0.68;
  const kneeR = thighR * 0.58;
  const legLength = m.inseamCm / 100;

  const landmarks: BodyLandmark[] = [
    { name: "ankle", y: 0, halfWidth: ankleR, depthFront: ankleR * 1.05, depthBack: ankleR * 0.95, n: 2.0 },
    { name: "calf", y: legLength * 0.28, halfWidth: calfR, depthFront: calfR * 0.95, depthBack: calfR * 0.95, n: 2.05 },
    { name: "knee", y: legLength * 0.48, halfWidth: kneeR, depthFront: kneeR, depthBack: kneeR, n: 2.0 },
    { name: "thigh", y: legLength * 0.82, halfWidth: thighR, depthFront: thighR * 0.95, depthBack: thighR * 0.95, n: 2.1 },
    { name: "hip", y: legLength, halfWidth: thighR * 1.08, depthFront: thighR, depthBack: thighR, n: 2.15 },
    { name: "hipEmbed", y: legLength + 0.03, halfWidth: thighR * 1.12, depthFront: thighR * 1.05, depthBack: thighR * 1.05, n: 2.15 },
  ];

  return { landmarks, totalLength: legLength, ankleY: 0 };
}

/**
 * A small flattened, tapered appendage lofted outward from the side of the
 * head — same "separate small loft, embedded by overlap" technique as
 * buildFingerChain, not a socket/indentation (ring-loft can't carve a local
 * concavity into an otherwise-convex head silhouette). Local Y is the
 * outward protrusion axis; the caller (computeBodyFrame) orients it roughly
 * lateral-and-back from the head surface.
 */
export function buildEarChain(headRadius: number): BodyLandmark[] {
  const scale = headRadius * 0.32;
  return [
    { name: "earBase", y: -0.002, halfWidth: scale * 0.4, depthFront: scale * 0.26, depthBack: scale * 0.22, n: 2.3 },
    { name: "earMid", y: scale * 0.45, halfWidth: scale * 0.46, depthFront: scale * 0.2, depthBack: scale * 0.18, n: 2.2 },
    { name: "earUpper", y: scale * 0.78, halfWidth: scale * 0.24, depthFront: scale * 0.1, depthBack: scale * 0.09, n: 2.4 },
    { name: "earTip", y: scale * 0.95, halfWidth: scale * 0.04, depthFront: 0.001, depthBack: 0.001, n: 2 },
  ];
}

/**
 * A minimal closed-eyelid ridge — a very shallow, wide, flat bump (not an
 * open eye with a visible iris), per the brief's "closed or minimally
 * detailed eyes" — deliberately subtle to stay on the "neutral, non-
 * distracting" side rather than reading as a character face. Local Y is the
 * shallow forward-protrusion axis (a few millimeters); halfWidth/depth give
 * the almond's world-horizontal/vertical extent once rotated to face
 * forward — see computeBodyFrame's eye socket placement.
 */
export function buildEyelidChain(headRadius: number): BodyLandmark[] {
  const width = headRadius * 0.22;
  const height = headRadius * 0.075;
  return [
    { name: "lidBase", y: -0.0015, halfWidth: width * 0.85, depthFront: height * 0.8, depthBack: height * 0.8, n: 2.6 },
    { name: "lidPeak", y: 0.0015, halfWidth: width, depthFront: height, depthBack: height, n: 3 },
    { name: "lidTip", y: 0.003, halfWidth: width * 0.06, depthFront: 0.0008, depthBack: 0.0008, n: 2 },
  ];
}

export interface FootChainResult {
  landmarks: BodyLandmark[];
  footLength: number;
}

/**
 * Local axis represents distance forward from the heel (not vertical) —
 * the caller rotates this loft ~90 degrees so its local Y becomes world Z.
 * Cross-section halfWidth = left-right, depthFront = upward (instep),
 * depthBack = downward (sole).
 */
export function buildFootChain(m: MannequinMeasurements, p: GenderProportions): FootChainResult {
  const footLength = (m.heightCm / 100) * 0.152 * p.footScale;
  const w = footLength * 0.19;

  const landmarks: BodyLandmark[] = [
    { name: "heelBack", y: 0, halfWidth: w * 0.62, depthFront: w * 0.55, depthBack: w * 0.32, n: 2.4 },
    { name: "ankleAbove", y: footLength * 0.18, halfWidth: w * 0.58, depthFront: w * 0.75, depthBack: w * 0.28, n: 2.2 },
    { name: "arch", y: footLength * 0.48, halfWidth: w * 0.62, depthFront: w * 0.5, depthBack: w * 0.2, n: 2.3 },
    { name: "ball", y: footLength * 0.8, halfWidth: w * 0.74, depthFront: w * 0.42, depthBack: w * 0.16, n: 2.5 },
    { name: "toeTip", y: footLength, halfWidth: w * 0.08, depthFront: w * 0.1, depthBack: w * 0.06, n: 2.2 },
  ];

  return { landmarks, footLength };
}
