import * as THREE from "three";
import type { BodyLandmark } from "./geometry/ring-loft";
import type { TorsoChainResult } from "./geometry/body-chains";
import {
  armBreakpoints,
  computeBodyFrame,
  legBreakpoints,
  torsoBreakpoints,
  type ArmFrame,
  type LegFrame,
  type Side,
} from "./geometry/body-frame";
import { buildPart, concatParts, yOf, type AssembledPart } from "./geometry/skinned-loft";
import { RADIAL_SEGMENTS, RINGS_PER_SEGMENT } from "./mannequinConfig";
import type { MannequinGender } from "./mannequinTypes";
import type { FitType, GarmentArchetype, MannequinMeasurements } from "../types";

export interface GarmentBuild {
  geometry: THREE.BufferGeometry;
  /** World-space Y bounds across the whole garment, for the fabric shader's drape gradient (see materials/fabric-material.ts). */
  minY: number;
  maxY: number;
}

/** How much a fit inflates the underlying body's cross-sections — mirrors the old procedural/garment-builder.ts's FIT_EASE table. */
const FIT_EASE: Record<FitType, number> = {
  SLIM: 1.04,
  REGULAR: 1.09,
  RELAXED: 1.16,
  OVERSIZED: 1.26,
};

interface FlareSpec {
  /** Landmark on the torso chain the flare hangs from. */
  topLandmark: string;
  /** Fraction of inseam (leg length) the flare extends downward from `topLandmark`. */
  lengthFraction: number;
  /** How much wider the hem is than the top, e.g. 2.1 = hem is 2.1x the waist. */
  flareScale: number;
}

interface GarmentSpec {
  /** Torso shell from this landmark up to "shoulderBase" — omitted for garments with no upper-body coverage (trousers). */
  torsoBottomLandmark?: string;
  /** Fraction of armLengthCm the sleeve extends from the shoulder. */
  sleeveLengthFraction?: number;
  /** Fraction of inseam the leg shell covers, measured up from the ankle. */
  legLengthFraction?: number;
  /** A rigid, pelvis-hung flared shell — coat hems and skirts/dresses below the torso/waist. */
  flare?: FlareSpec;
}

const GARMENT_SPECS: Record<GarmentArchetype, GarmentSpec> = {
  tshirt: { torsoBottomLandmark: "pelvisBottom", sleeveLengthFraction: 0.32 },
  shirt: { torsoBottomLandmark: "pelvisBottom", sleeveLengthFraction: 0.92 },
  jacket: { torsoBottomLandmark: "pelvisBottom", sleeveLengthFraction: 0.95 },
  coat: {
    torsoBottomLandmark: "pelvisBottom",
    sleeveLengthFraction: 0.98,
    flare: { topLandmark: "pelvisBottom", lengthFraction: 0.42, flareScale: 1.12 },
  },
  trousers: { legLengthFraction: 0.98 },
  jumpsuit: { torsoBottomLandmark: "pelvisBottom", sleeveLengthFraction: 0.9, legLengthFraction: 0.98 },
  skirt: { flare: { topLandmark: "waist", lengthFraction: 0.42, flareScale: 2.1 } },
  dress: {
    torsoBottomLandmark: "pelvisBottom",
    sleeveLengthFraction: 0.25,
    flare: { topLandmark: "hip", lengthFraction: 0.55, flareScale: 1.9 },
  },
};

function scaleLandmarks(landmarks: BodyLandmark[], ease: number): BodyLandmark[] {
  return landmarks.map((l) => ({
    ...l,
    halfWidth: l.halfWidth * ease,
    depthFront: l.depthFront * ease,
    depthBack: l.depthBack * ease,
  }));
}

function lerpLandmark(a: BodyLandmark, b: BodyLandmark, t: number): BodyLandmark {
  return {
    name: "crop",
    y: a.y + (b.y - a.y) * t,
    halfWidth: a.halfWidth + (b.halfWidth - a.halfWidth) * t,
    depthFront: a.depthFront + (b.depthFront - a.depthFront) * t,
    depthBack: a.depthBack + (b.depthBack - a.depthBack) * t,
    n: a.n + (b.n - a.n) * t,
  };
}

/**
 * Crops a body-derived landmark chain to [minY, maxY], inserting interpolated
 * boundary points so the garment loft starts/ends exactly at the requested
 * range instead of at the nearest body landmark. This is what turns a full
 * body chain (e.g. the whole arm) into a garment-length shell (a t-shirt
 * sleeve stopping mid-bicep).
 */
function cropLandmarks(landmarks: BodyLandmark[], minY: number, maxY: number): BodyLandmark[] {
  const EPS = 1e-6;
  const result: BodyLandmark[] = [];
  for (let i = 0; i < landmarks.length; i++) {
    const curr = landmarks[i];
    const prev = landmarks[i - 1];
    if (prev && prev.y < minY - EPS && curr.y >= minY) {
      const t = (minY - prev.y) / (curr.y - prev.y);
      if (t > EPS) result.push(lerpLandmark(prev, curr, t));
    }
    if (curr.y >= minY - EPS && curr.y <= maxY + EPS) {
      result.push(curr);
    }
    if (prev && prev.y <= maxY + EPS && curr.y > maxY + EPS) {
      const t = (maxY - prev.y) / (curr.y - prev.y);
      if (t > EPS) result.push(lerpLandmark(prev, curr, t));
    }
  }
  if (result.length < 2) {
    return [
      { ...landmarks[0], name: "cropStart", y: minY },
      { ...landmarks[0], name: "cropEnd", y: maxY },
    ];
  }
  return result;
}

function buildFlareLandmarks(topY: number, bottomY: number, topHalfWidth: number, topDepth: number, flareScale: number): BodyLandmark[] {
  const bottomHalfWidth = topHalfWidth * flareScale;
  const bottomDepth = topDepth * flareScale * 0.9;
  const midY = bottomY + (topY - bottomY) * 0.55;
  return [
    { name: "flareBottom", y: bottomY, halfWidth: bottomHalfWidth, depthFront: bottomDepth, depthBack: bottomDepth * 0.92, n: 2.3 },
    {
      name: "flareMid",
      y: midY,
      halfWidth: (topHalfWidth + bottomHalfWidth) / 2,
      depthFront: (topDepth + bottomDepth) / 2,
      depthBack: ((topDepth + bottomDepth) / 2) * 0.92,
      n: 2.2,
    },
    { name: "flareTop", y: topY, halfWidth: topHalfWidth, depthFront: topDepth, depthBack: topDepth * 0.92, n: 2.1 },
  ];
}

function buildTorsoShell(torso: TorsoChainResult, ease: number, bottomLandmark: string): AssembledPart {
  const minY = yOf(torso.landmarks, bottomLandmark);
  const maxY = yOf(torso.landmarks, "shoulderBase");
  const eased = scaleLandmarks(cropLandmarks(torso.landmarks, minY, maxY), ease);
  return buildPart(eased, torsoBreakpoints(torso), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
    origin: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 1, 0),
    anchorLocalY: 0,
  });
}

function buildSleeveShell(side: Side, armFrame: ArmFrame, ease: number, lengthFraction: number, armLengthM: number): AssembledPart {
  const minY = yOf(armFrame.arm.landmarks, "shoulderEmbed");
  const maxY = Math.min(lengthFraction * armLengthM, yOf(armFrame.arm.landmarks, "wrist"));
  const eased = scaleLandmarks(cropLandmarks(armFrame.arm.landmarks, minY, maxY), ease);
  return buildPart(eased, armBreakpoints(side, armFrame.arm), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
    origin: armFrame.shoulderSocket,
    direction: armFrame.armDir,
    anchorLocalY: armFrame.armAnchorY,
  });
}

function buildLegShell(side: Side, legFrame: LegFrame, ease: number, lengthFraction: number): AssembledPart {
  const maxY = yOf(legFrame.leg.landmarks, "hipEmbed");
  const minY = legFrame.leg.totalLength * (1 - lengthFraction);
  const eased = scaleLandmarks(cropLandmarks(legFrame.leg.landmarks, minY, maxY), ease);
  return buildPart(eased, legBreakpoints(side, legFrame.leg), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
    origin: legFrame.hipSocket,
    direction: legFrame.legDir,
    anchorLocalY: legFrame.legAnchorY,
  });
}

function buildFlareShell(torso: TorsoChainResult, ease: number, flare: FlareSpec, legLengthM: number): AssembledPart {
  const topLandmark = torso.landmarks.find((l) => l.name === flare.topLandmark);
  if (!topLandmark) throw new Error(`flare topLandmark not found: ${flare.topLandmark}`);
  const topY = topLandmark.y;
  const bottomY = topY - flare.lengthFraction * legLengthM;
  const landmarks = buildFlareLandmarks(topY, bottomY, topLandmark.halfWidth * ease, topLandmark.depthFront * ease, flare.flareScale);
  return buildPart(landmarks, [{ bone: "Pelvis", localY: bottomY }], { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
    origin: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 1, 0),
    anchorLocalY: 0,
  });
}

/**
 * Builds one garment as lofted shells offset from the body's own landmark
 * chains — never re-authored from scratch — so a garment always tracks the
 * body underneath at any gender/measurements. Torso/sleeve/leg shells reuse
 * the exact bone breakpoints the body part they wrap uses (so they deform
 * with the same bones during animation); the coat-hem and skirt/dress flare
 * are rigid, pelvis-hung shells (a skirt doesn't bend at the knee).
 * Everything binds to one THREE.Skeleton shared with the body's SkinnedMesh —
 * see Garment.tsx.
 */
export function buildGarmentGeometry(
  archetype: GarmentArchetype,
  gender: MannequinGender,
  measurements: MannequinMeasurements,
  fit: FitType,
): GarmentBuild {
  const spec = GARMENT_SPECS[archetype];
  const ease = FIT_EASE[fit];
  const frame = computeBodyFrame(gender, measurements);
  const armLengthM = measurements.armLengthCm / 100;
  const legLengthM = measurements.inseamCm / 100;

  const parts: AssembledPart[] = [];
  if (spec.torsoBottomLandmark) {
    parts.push(buildTorsoShell(frame.torso, ease, spec.torsoBottomLandmark));
  }
  if (spec.sleeveLengthFraction) {
    (["L", "R"] as const).forEach((side) => {
      parts.push(buildSleeveShell(side, frame.arms[side], ease, spec.sleeveLengthFraction!, armLengthM));
    });
  }
  if (spec.legLengthFraction) {
    (["L", "R"] as const).forEach((side) => {
      parts.push(buildLegShell(side, frame.legs[side], ease, spec.legLengthFraction!));
    });
  }
  if (spec.flare) {
    parts.push(buildFlareShell(frame.torso, ease, spec.flare, legLengthM));
  }

  let minY = Infinity;
  let maxY = -Infinity;
  for (const part of parts) {
    for (let i = 1; i < part.positions.length; i += 3) {
      const y = part.positions[i];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  return { geometry: concatParts(parts), minY, maxY };
}
