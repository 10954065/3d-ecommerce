import * as THREE from "three";
import { buildRingLoft, type BodyLandmark } from "./geometry/ring-loft";
import {
  buildArmChain,
  buildFingerChain,
  buildFootChain,
  buildLegChain,
  buildTorsoChain,
  FINGER_LAYOUT,
  getProportions,
} from "./geometry/body-chains";
import { BONE_ORDER, FINGER_RADIAL_SEGMENTS, FINGER_RINGS_PER_SEGMENT, RADIAL_SEGMENTS, RINGS_PER_SEGMENT } from "./mannequinConfig";
import type { BoneName, MannequinGender } from "./mannequinTypes";
import type { MannequinMeasurements } from "../types";

const BONE_INDEX: Record<BoneName, number> = Object.fromEntries(BONE_ORDER.map((b, i) => [b, i])) as Record<BoneName, number>;

const ARM_LEAN = 0.22; // radians outward from vertical — enough separation from the torso to read from a pure side profile
const LEG_SPLAY = 0.025; // radians outward from vertical

export interface MannequinBuild {
  geometry: THREE.BufferGeometry;
  boneWorldPositions: Record<BoneName, THREE.Vector3>;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

function yOf(landmarks: BodyLandmark[], name: string): number {
  const found = landmarks.find((l) => l.name === name);
  if (!found) throw new Error(`landmark not found: ${name}`);
  return found.y;
}

/** Maps an axial local point (bind-time, before rigid placement) to its final world position for a part placed by `placePart`. */
function localToWorld(localPoint: THREE.Vector3, origin: THREE.Vector3, direction: THREE.Vector3, anchorLocalY: number): THREE.Vector3 {
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return new THREE.Vector3(localPoint.x, localPoint.y - anchorLocalY, localPoint.z).applyQuaternion(quat).add(origin);
}

interface BoneBreakpoint {
  bone: BoneName;
  localY: number;
}

interface AssembledPart {
  positions: Float32Array;
  normals: Float32Array;
  indices: number[];
  skinIndex: number[];
  skinWeight: number[];
}

/**
 * Lofts one body part, assigns two-bone smoothstep skin weights along its own
 * local Y axis (before placement), then rigidly places it in world space via
 * a translate+rotate transform (never a reflection, so normals stay correct).
 * This is a documented first-pass weighting heuristic — see docs/MANNEQUIN_SYSTEM.md.
 */
function buildPart(
  landmarks: BodyLandmark[],
  breakpoints: BoneBreakpoint[],
  segments: { radialSegments: number; ringsPerSegment: number },
  placement: { origin: THREE.Vector3; direction: THREE.Vector3; anchorLocalY: number },
): AssembledPart {
  const loft = buildRingLoft(landmarks, segments);
  const positionAttr = loft.geometry.getAttribute("position") as THREE.BufferAttribute;
  const vertexCount = positionAttr.count;
  const vertsPerRing = loft.radialSegments + 1;

  const skinIndex = new Array(vertexCount * 4).fill(0);
  const skinWeight = new Array(vertexCount * 4).fill(0);
  const sorted = [...breakpoints].sort((a, b) => a.localY - b.localY);

  for (let v = 0; v < vertexCount; v++) {
    const ringIdx = Math.min(Math.floor(v / vertsPerRing), loft.ringYs.length - 1);
    const localY = loft.ringYs[ringIdx];

    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];
    if (localY <= sorted[0].localY) {
      upper = sorted[0];
    } else if (localY >= sorted[sorted.length - 1].localY) {
      lower = sorted[sorted.length - 1];
    } else {
      for (let b = 0; b < sorted.length - 1; b++) {
        if (localY >= sorted[b].localY && localY <= sorted[b + 1].localY) {
          lower = sorted[b];
          upper = sorted[b + 1];
          break;
        }
      }
    }

    const t = lower === upper ? 0 : smoothstep(lower.localY, upper.localY, localY);
    skinIndex[v * 4 + 0] = BONE_INDEX[lower.bone];
    skinIndex[v * 4 + 1] = BONE_INDEX[upper.bone];
    skinWeight[v * 4 + 0] = 1 - t;
    skinWeight[v * 4 + 1] = t;
  }

  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), placement.direction.clone().normalize());
  const matrix = new THREE.Matrix4().makeTranslation(0, -placement.anchorLocalY, 0);
  matrix.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(quat));
  matrix.premultiply(new THREE.Matrix4().makeTranslation(placement.origin.x, placement.origin.y, placement.origin.z));
  loft.geometry.applyMatrix4(matrix);

  return {
    positions: (loft.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array,
    normals: (loft.geometry.getAttribute("normal") as THREE.BufferAttribute).array as Float32Array,
    indices: Array.from(loft.geometry.getIndex()!.array),
    skinIndex,
    skinWeight,
  };
}

function concatParts(parts: AssembledPart[]): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const p of parts) {
    totalVerts += p.positions.length / 3;
    totalIndices += p.indices.length;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const skinIndex = new Float32Array(totalVerts * 4);
  const skinWeight = new Float32Array(totalVerts * 4);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let indexOffset = 0;
  for (const p of parts) {
    const vCount = p.positions.length / 3;
    positions.set(p.positions, vertOffset * 3);
    normals.set(p.normals, vertOffset * 3);
    skinIndex.set(p.skinIndex, vertOffset * 4);
    skinWeight.set(p.skinWeight, vertOffset * 4);
    for (let i = 0; i < p.indices.length; i++) {
      indices[indexOffset + i] = p.indices[i] + vertOffset;
    }
    vertOffset += vCount;
    indexOffset += p.indices.length;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

/**
 * Builds the full mannequin: one continuous torso+neck+head loft, two arms
 * (each including its own palm), ten fingers, two legs, and two feet — every
 * part its own smooth ring-loft (never a raw primitive), assembled into one
 * BufferGeometry ready to bind to a THREE.Skeleton. Parts meet by deliberate
 * overlap (a couple centimeters embedded into the parent volume) rather than
 * exact vertex welding — see docs/MANNEQUIN_SYSTEM.md for why a fully
 * manifold branching mesh (torso forking into two legs, palms forking into
 * five fingers) is out of scope without a DCC/retopology tool, and why
 * overlap reads as one coherent figure at normal viewing distance regardless.
 */
export function buildMannequinGeometry(gender: MannequinGender, measurements: MannequinMeasurements): MannequinBuild {
  const p = getProportions(gender);
  const ankleY = (measurements.heightCm / 100) * 0.02;
  const legLength = measurements.inseamCm / 100;

  const torso = buildTorsoChain(measurements, p, legLength, ankleY);
  const boneWorldPositions = {} as Record<BoneName, THREE.Vector3>;
  boneWorldPositions.Root = new THREE.Vector3(0, 0, 0);
  boneWorldPositions.Pelvis = new THREE.Vector3(0, yOf(torso.landmarks, "pelvisBottom"), 0);
  boneWorldPositions.Spine = new THREE.Vector3(0, yOf(torso.landmarks, "hip"), 0);
  boneWorldPositions.Spine_01 = new THREE.Vector3(0, yOf(torso.landmarks, "waist"), 0);
  boneWorldPositions.Spine_02 = new THREE.Vector3(0, yOf(torso.landmarks, "underbust"), 0);
  boneWorldPositions.Chest = new THREE.Vector3(0, yOf(torso.landmarks, "chest"), 0);
  boneWorldPositions.Neck = new THREE.Vector3(0, yOf(torso.landmarks, "neckBase"), 0);
  boneWorldPositions.Head = new THREE.Vector3(0, yOf(torso.landmarks, "jaw"), 0);

  const torsoBreakpoints: BoneBreakpoint[] = [
    { bone: "Pelvis", localY: yOf(torso.landmarks, "pelvisBottom") },
    { bone: "Spine", localY: yOf(torso.landmarks, "hip") },
    { bone: "Spine_01", localY: yOf(torso.landmarks, "waist") },
    { bone: "Spine_02", localY: yOf(torso.landmarks, "underbust") },
    { bone: "Chest", localY: yOf(torso.landmarks, "chest") },
    { bone: "Neck", localY: yOf(torso.landmarks, "neckBase") },
    { bone: "Head", localY: yOf(torso.landmarks, "jaw") },
  ];

  const parts: AssembledPart[] = [];
  parts.push(
    buildPart(torso.landmarks, torsoBreakpoints, { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
      origin: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      anchorLocalY: 0,
    }),
  );

  (["L", "R"] as const).forEach((sideLabel) => {
    const side = sideLabel === "L" ? -1 : 1;
    const shoulderSocket = new THREE.Vector3(side * torso.shoulderHalfWidth, torso.shoulderY, 0);
    const armDir = new THREE.Vector3(side * Math.sin(ARM_LEAN), -Math.cos(ARM_LEAN), 0);
    const arm = buildArmChain(measurements, p);
    const armAnchorY = yOf(arm.landmarks, "shoulder");
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir);
    const armLateral = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    const armForward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    boneWorldPositions[`${sideLabel}_Shoulder`] = shoulderSocket.clone();
    boneWorldPositions[`${sideLabel}_UpperArm`] = shoulderSocket.clone();
    boneWorldPositions[`${sideLabel}_Forearm`] = localToWorld(new THREE.Vector3(0, yOf(arm.landmarks, "elbow"), 0), shoulderSocket, armDir, armAnchorY);
    boneWorldPositions[`${sideLabel}_Hand`] = localToWorld(new THREE.Vector3(0, yOf(arm.landmarks, "wrist"), 0), shoulderSocket, armDir, armAnchorY);

    const armBreakpoints: BoneBreakpoint[] = [
      { bone: `${sideLabel}_Shoulder`, localY: yOf(arm.landmarks, "shoulderEmbed") },
      { bone: `${sideLabel}_UpperArm`, localY: yOf(arm.landmarks, "bicep") },
      { bone: `${sideLabel}_Forearm`, localY: yOf(arm.landmarks, "elbow") },
      { bone: `${sideLabel}_Hand`, localY: yOf(arm.landmarks, "wrist") },
    ];
    parts.push(
      buildPart(arm.landmarks, armBreakpoints, { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: shoulderSocket,
        direction: armDir,
        anchorLocalY: armAnchorY,
      }),
    );

    const palmEndLandmark = arm.landmarks.find((l) => l.name === "palmEnd")!;
    const palmEndWorld = localToWorld(new THREE.Vector3(0, palmEndLandmark.y, 0), shoulderSocket, armDir, armAnchorY);

    for (const finger of FINGER_LAYOUT) {
      const fingerLength = arm.wristRadius * 3.4 * finger.lengthFraction;
      const fingerRadius = arm.wristRadius * 0.3 * finger.radiusFraction;
      const fingerLandmarks = buildFingerChain(fingerLength, fingerRadius);
      const fingerBaseLocalY = yOf(fingerLandmarks, "base");

      const fingerBaseWorld = palmEndWorld
        .clone()
        .add(armLateral.clone().multiplyScalar(side * finger.spreadX * palmEndLandmark.halfWidth))
        .add(armForward.clone().multiplyScalar(finger.spreadZ * palmEndLandmark.halfWidth));

      const fingerDir =
        finger.name === "thumb"
          ? armDir.clone().lerp(armLateral.clone().multiplyScalar(side), 0.5).normalize()
          : armDir.clone().applyAxisAngle(armLateral, finger.bendZ).normalize();

      parts.push(
        buildPart(
          fingerLandmarks,
          [{ bone: `${sideLabel}_Hand`, localY: fingerBaseLocalY }],
          { radialSegments: FINGER_RADIAL_SEGMENTS, ringsPerSegment: FINGER_RINGS_PER_SEGMENT },
          { origin: fingerBaseWorld, direction: fingerDir, anchorLocalY: fingerBaseLocalY },
        ),
      );
    }

    const hipSocket = new THREE.Vector3(side * torso.hipSocketHalfWidth, torso.hipSocketY, 0);
    const legDir = new THREE.Vector3(side * Math.sin(LEG_SPLAY), Math.cos(LEG_SPLAY), 0);
    const leg = buildLegChain(measurements, p);
    const legAnchorY = yOf(leg.landmarks, "hip");

    boneWorldPositions[`${sideLabel}_UpperLeg`] = hipSocket.clone();
    boneWorldPositions[`${sideLabel}_LowerLeg`] = localToWorld(new THREE.Vector3(0, yOf(leg.landmarks, "knee"), 0), hipSocket, legDir, legAnchorY);
    const ankleWorld = localToWorld(new THREE.Vector3(0, yOf(leg.landmarks, "ankle"), 0), hipSocket, legDir, legAnchorY);
    boneWorldPositions[`${sideLabel}_Foot`] = ankleWorld.clone();

    const legBreakpoints: BoneBreakpoint[] = [
      { bone: `${sideLabel}_UpperLeg`, localY: yOf(leg.landmarks, "hipEmbed") },
      { bone: `${sideLabel}_UpperLeg`, localY: yOf(leg.landmarks, "thigh") },
      { bone: `${sideLabel}_LowerLeg`, localY: yOf(leg.landmarks, "knee") },
      { bone: `${sideLabel}_Foot`, localY: yOf(leg.landmarks, "ankle") },
    ];
    parts.push(
      buildPart(leg.landmarks, legBreakpoints, { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: hipSocket,
        direction: legDir,
        anchorLocalY: legAnchorY,
      }),
    );

    const foot = buildFootChain(measurements, p);
    const footAnchorY = yOf(foot.landmarks, "ankleAbove");
    const footDir = new THREE.Vector3(0, 0, 1);
    boneWorldPositions[`${sideLabel}_Toe`] = localToWorld(new THREE.Vector3(0, yOf(foot.landmarks, "ball"), 0), ankleWorld, footDir, footAnchorY);

    const footBreakpoints: BoneBreakpoint[] = [
      { bone: `${sideLabel}_Foot`, localY: yOf(foot.landmarks, "ankleAbove") },
      { bone: `${sideLabel}_Toe`, localY: yOf(foot.landmarks, "ball") },
    ];
    parts.push(
      buildPart(foot.landmarks, footBreakpoints, { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: ankleWorld,
        direction: footDir,
        anchorLocalY: footAnchorY,
      }),
    );
  });

  const geometry = concatParts(parts);
  return { geometry, boneWorldPositions };
}
