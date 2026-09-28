import * as THREE from "three";
import { buildRingLoft, type BodyLandmark } from "./ring-loft";
import { BONE_ORDER } from "../mannequinConfig";
import type { BoneName } from "../mannequinTypes";

const BONE_INDEX: Record<BoneName, number> = Object.fromEntries(BONE_ORDER.map((b, i) => [b, i])) as Record<BoneName, number>;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

export function yOf(landmarks: BodyLandmark[], name: string): number {
  const found = landmarks.find((l) => l.name === name);
  if (!found) throw new Error(`landmark not found: ${name}`);
  return found.y;
}

/** Maps an axial local point (bind-time, before rigid placement) to its final world position for a part placed by `buildPart`. */
export function localToWorld(localPoint: THREE.Vector3, origin: THREE.Vector3, direction: THREE.Vector3, anchorLocalY: number): THREE.Vector3 {
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return new THREE.Vector3(localPoint.x, localPoint.y - anchorLocalY, localPoint.z).applyQuaternion(quat).add(origin);
}

export interface BoneBreakpoint {
  bone: BoneName;
  localY: number;
}

export interface AssembledPart {
  positions: Float32Array;
  normals: Float32Array;
  indices: number[];
  skinIndex: number[];
  skinWeight: number[];
}

export interface PartSegments {
  radialSegments: number;
  ringsPerSegment: number;
}

export interface PartPlacement {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  anchorLocalY: number;
}

/**
 * Lofts one part — a body part (MannequinBuilder.ts) or a garment shell
 * (GarmentBuilder.ts) — assigns two-bone smoothstep skin weights along its
 * own local Y axis (before placement), then rigidly places it in world space
 * via a translate+rotate transform (never a reflection, so normals stay
 * correct). Shared by both builders so garments always skin against the same
 * bone index order and placement convention the body uses — see
 * docs/MANNEQUIN_SYSTEM.md.
 */
export function buildPart(
  landmarks: BodyLandmark[],
  breakpoints: BoneBreakpoint[],
  segments: PartSegments,
  placement: PartPlacement,
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

export function concatParts(parts: AssembledPart[]): THREE.BufferGeometry {
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
