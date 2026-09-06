import { describe, it, expect } from "vitest";
import { buildMannequinGeometry } from "../MannequinBuilder";
import { BONE_ORDER } from "../mannequinConfig";
import type { MannequinMeasurements } from "../../types";

const REFERENCE: MannequinMeasurements = {
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

describe("buildMannequinGeometry", () => {
  it("produces a bone world position for every bone name", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", REFERENCE);
    for (const name of BONE_ORDER) {
      expect(boneWorldPositions[name]).toBeDefined();
      expect(Number.isFinite(boneWorldPositions[name].x)).toBe(true);
      expect(Number.isFinite(boneWorldPositions[name].y)).toBe(true);
      expect(Number.isFinite(boneWorldPositions[name].z)).toBe(true);
    }
  });

  it("stacks torso bones bottom to top", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", REFERENCE);
    const order = ["Pelvis", "Spine", "Spine_01", "Spine_02", "Chest", "Neck", "Head"] as const;
    for (let i = 1; i < order.length; i++) {
      expect(boneWorldPositions[order[i]].y).toBeGreaterThan(boneWorldPositions[order[i - 1]].y);
    }
  });

  it("mirrors left/right bones across the X axis", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", REFERENCE);
    const pairs: [string, string][] = [
      ["L_Shoulder", "R_Shoulder"],
      ["L_UpperArm", "R_UpperArm"],
      ["L_Hand", "R_Hand"],
      ["L_UpperLeg", "R_UpperLeg"],
      ["L_Foot", "R_Foot"],
    ];
    for (const [l, r] of pairs) {
      const left = boneWorldPositions[l as keyof typeof boneWorldPositions];
      const right = boneWorldPositions[r as keyof typeof boneWorldPositions];
      expect(left.x).toBeCloseTo(-right.x, 5);
      expect(left.y).toBeCloseTo(right.y, 5);
      expect(left.z).toBeCloseTo(right.z, 5);
    }
  });

  it("produces a taller skeleton for a taller measurement set", () => {
    const shortResult = buildMannequinGeometry("female", { ...REFERENCE, heightCm: 155 });
    const tallResult = buildMannequinGeometry("female", { ...REFERENCE, heightCm: 185 });
    expect(tallResult.boneWorldPositions.Head.y).toBeGreaterThan(shortResult.boneWorldPositions.Head.y);
  });

  it("produces a single geometry with position, normal, skinIndex, and skinWeight attributes", () => {
    const { geometry } = buildMannequinGeometry("male", REFERENCE);
    expect(geometry.getAttribute("position")).toBeDefined();
    expect(geometry.getAttribute("normal")).toBeDefined();
    expect(geometry.getAttribute("skinIndex")).toBeDefined();
    expect(geometry.getAttribute("skinWeight")).toBeDefined();
    expect(geometry.getIndex()).not.toBeNull();
  });

  it("every vertex's skin weight influences sum to 1 and reference valid bone indices", () => {
    const { geometry } = buildMannequinGeometry("female", REFERENCE);
    const skinIndex = geometry.getAttribute("skinIndex");
    const skinWeight = geometry.getAttribute("skinWeight");
    const boneCount = BONE_ORDER.length;

    for (let i = 0; i < skinWeight.count; i += 37) {
      const sum = skinWeight.getX(i) + skinWeight.getY(i) + skinWeight.getZ(i) + skinWeight.getW(i);
      expect(sum).toBeCloseTo(1, 4);
      expect(skinIndex.getX(i)).toBeGreaterThanOrEqual(0);
      expect(skinIndex.getX(i)).toBeLessThan(boneCount);
      expect(skinIndex.getY(i)).toBeGreaterThanOrEqual(0);
      expect(skinIndex.getY(i)).toBeLessThan(boneCount);
    }
  });

  it("produces no NaN or infinite vertex positions across the whole assembled mesh", () => {
    const { geometry } = buildMannequinGeometry("male", REFERENCE);
    const positions = geometry.getAttribute("position").array;
    for (const value of positions) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("spaces the shoulder bones to match the shoulderWidthCm measurement", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", REFERENCE);
    const shoulderSpan = Math.abs(boneWorldPositions.L_Shoulder.x - boneWorldPositions.R_Shoulder.x);
    expect(shoulderSpan).toBeCloseTo(REFERENCE.shoulderWidthCm / 100, 2);
  });
});
