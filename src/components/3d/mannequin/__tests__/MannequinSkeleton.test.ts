import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { buildMannequinGeometry } from "../MannequinBuilder";
import { applyPresentationPose, buildSkeleton } from "../MannequinSkeleton";
import { BONE_ORDER, BONE_PARENTS } from "../mannequinConfig";
import type { MannequinMeasurements } from "../../types";

const REFERENCE: MannequinMeasurements = {
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

describe("buildSkeleton", () => {
  it("creates exactly one bone per name in BONE_ORDER", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", REFERENCE);
    const { skeleton } = buildSkeleton(boneWorldPositions);
    expect(skeleton.bones.length).toBe(BONE_ORDER.length);
  });

  it("gives Root no parent and every other bone the parent declared in BONE_PARENTS", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", REFERENCE);
    const { bones } = buildSkeleton(boneWorldPositions);
    expect(bones.Root.parent).toBeNull();
    for (const name of BONE_ORDER) {
      const parentName = BONE_PARENTS[name];
      if (parentName === null) continue;
      expect(bones[name].parent).toBe(bones[parentName]);
    }
  });

  it("places each bone's world matrix position at the requested world position", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", REFERENCE);
    const { bones } = buildSkeleton(boneWorldPositions);
    const worldPos = new THREE.Vector3();
    for (const name of BONE_ORDER) {
      bones[name].getWorldPosition(worldPos);
      expect(worldPos.x).toBeCloseTo(boneWorldPositions[name].x, 4);
      expect(worldPos.y).toBeCloseTo(boneWorldPositions[name].y, 4);
      expect(worldPos.z).toBeCloseTo(boneWorldPositions[name].z, 4);
    }
  });

  it("computes bone inverse matrices for every bone", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", REFERENCE);
    const { skeleton } = buildSkeleton(boneWorldPositions);
    expect(skeleton.boneInverses.length).toBe(BONE_ORDER.length);
  });
});

describe("applyPresentationPose", () => {
  it("rotates at least one bone away from identity (never ships a literal T-pose)", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", REFERENCE);
    const { bones } = buildSkeleton(boneWorldPositions);
    applyPresentationPose(bones);

    const anyRotated = BONE_ORDER.some((name) => {
      const r = bones[name].rotation;
      return Math.abs(r.x) > 1e-6 || Math.abs(r.y) > 1e-6 || Math.abs(r.z) > 1e-6;
    });
    expect(anyRotated).toBe(true);
  });

  it("keeps every applied rotation within a plausible small-angle range", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", REFERENCE);
    const { bones } = buildSkeleton(boneWorldPositions);
    applyPresentationPose(bones);

    const maxRadians = THREE.MathUtils.degToRad(30);
    for (const name of BONE_ORDER) {
      const r = bones[name].rotation;
      expect(Math.abs(r.x)).toBeLessThanOrEqual(maxRadians);
      expect(Math.abs(r.y)).toBeLessThanOrEqual(maxRadians);
      expect(Math.abs(r.z)).toBeLessThanOrEqual(maxRadians);
    }
  });
});
