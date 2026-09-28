import * as THREE from "three";
import {
  buildArmChain,
  buildLegChain,
  buildTorsoChain,
  getProportions,
  type ArmChainResult,
  type GenderProportions,
  type LegChainResult,
  type TorsoChainResult,
} from "./body-chains";
import { localToWorld, yOf, type BoneBreakpoint } from "./skinned-loft";
import type { MannequinGender } from "../mannequinTypes";
import type { MannequinMeasurements } from "../../types";

export const ARM_LEAN = 0.22; // radians outward from vertical — enough separation from the torso to read from a pure side profile
export const LEG_SPLAY = 0.025; // radians outward from vertical

export type Side = "L" | "R";

/**
 * Proportion-level (not measurement-level) overrides used by the morph-target
 * builder (MannequinMorphs.ts) to isolate axes that don't map to one of the
 * 9 tracked measurement fields — bust prominence, arm volume, and torso
 * length are all shape parameters independent of any single circumference.
 */
export interface MannequinMorphOverrides {
  armVolume?: number;
  chestFrontBulge?: number;
  torsoLengthScale?: number;
}

export interface ArmFrame {
  shoulderSocket: THREE.Vector3;
  armDir: THREE.Vector3;
  armAnchorY: number;
  armLateral: THREE.Vector3;
  armForward: THREE.Vector3;
  arm: ArmChainResult;
}

export interface LegFrame {
  hipSocket: THREE.Vector3;
  legDir: THREE.Vector3;
  legAnchorY: number;
  ankleWorld: THREE.Vector3;
  leg: LegChainResult;
}

export interface BodyFrame {
  proportions: GenderProportions;
  torso: TorsoChainResult;
  arms: Record<Side, ArmFrame>;
  legs: Record<Side, LegFrame>;
}

/**
 * Computes body-relative sockets/directions for the torso, both arms, and
 * both legs from measurements alone — the single source of truth both
 * MannequinBuilder.ts (body mesh) and GarmentBuilder.ts (garment shells)
 * build from, so garments always stay glued to the body underneath
 * regardless of gender, measurements, or morph overrides.
 */
export function computeBodyFrame(
  gender: MannequinGender,
  measurements: MannequinMeasurements,
  overrides?: MannequinMorphOverrides,
): BodyFrame {
  const baseProportions = getProportions(gender);
  const p: GenderProportions = {
    ...baseProportions,
    armVolume: overrides?.armVolume ?? baseProportions.armVolume,
    chest: { ...baseProportions.chest, frontBulge: overrides?.chestFrontBulge ?? baseProportions.chest.frontBulge },
  };
  const ankleY = (measurements.heightCm / 100) * 0.02;
  const legLength = measurements.inseamCm / 100;
  const torso = buildTorsoChain(measurements, p, legLength, ankleY, overrides?.torsoLengthScale ?? 1);

  const arms = {} as Record<Side, ArmFrame>;
  const legs = {} as Record<Side, LegFrame>;

  (["L", "R"] as const).forEach((sideLabel) => {
    const side = sideLabel === "L" ? -1 : 1;

    const shoulderSocket = new THREE.Vector3(side * torso.shoulderHalfWidth, torso.shoulderY, 0);
    const armDir = new THREE.Vector3(side * Math.sin(ARM_LEAN), -Math.cos(ARM_LEAN), 0);
    const arm = buildArmChain(measurements, p);
    const armAnchorY = yOf(arm.landmarks, "shoulder");
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir);
    const armLateral = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    const armForward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    arms[sideLabel] = { shoulderSocket, armDir, armAnchorY, armLateral, armForward, arm };

    const hipSocket = new THREE.Vector3(side * torso.hipSocketHalfWidth, torso.hipSocketY, 0);
    const legDir = new THREE.Vector3(side * Math.sin(LEG_SPLAY), Math.cos(LEG_SPLAY), 0);
    const leg = buildLegChain(measurements, p);
    const legAnchorY = yOf(leg.landmarks, "hip");
    const ankleWorld = localToWorld(new THREE.Vector3(0, 0, 0), hipSocket, legDir, legAnchorY);
    legs[sideLabel] = { hipSocket, legDir, legAnchorY, ankleWorld, leg };
  });

  return { proportions: p, torso, arms, legs };
}

export function torsoBreakpoints(torso: TorsoChainResult): BoneBreakpoint[] {
  return [
    { bone: "Pelvis", localY: yOf(torso.landmarks, "pelvisBottom") },
    { bone: "Spine", localY: yOf(torso.landmarks, "hip") },
    { bone: "Spine_01", localY: yOf(torso.landmarks, "waist") },
    { bone: "Spine_02", localY: yOf(torso.landmarks, "underbust") },
    { bone: "Chest", localY: yOf(torso.landmarks, "chest") },
    { bone: "Neck", localY: yOf(torso.landmarks, "neckBase") },
    { bone: "Head", localY: yOf(torso.landmarks, "jaw") },
  ];
}

export function armBreakpoints(side: Side, arm: ArmChainResult): BoneBreakpoint[] {
  return [
    { bone: `${side}_Shoulder`, localY: yOf(arm.landmarks, "shoulderEmbed") },
    { bone: `${side}_UpperArm`, localY: yOf(arm.landmarks, "bicep") },
    { bone: `${side}_Forearm`, localY: yOf(arm.landmarks, "elbow") },
    { bone: `${side}_Hand`, localY: yOf(arm.landmarks, "wrist") },
  ];
}

export function legBreakpoints(side: Side, leg: LegChainResult): BoneBreakpoint[] {
  return [
    { bone: `${side}_UpperLeg`, localY: yOf(leg.landmarks, "hipEmbed") },
    { bone: `${side}_UpperLeg`, localY: yOf(leg.landmarks, "thigh") },
    { bone: `${side}_LowerLeg`, localY: yOf(leg.landmarks, "knee") },
    { bone: `${side}_Foot`, localY: yOf(leg.landmarks, "ankle") },
  ];
}
