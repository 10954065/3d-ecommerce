import { describe, it, expect } from "vitest";
import { buildHumanoidRig } from "../humanoid";
import type { MannequinMeasurements } from "../../types";

const MEDIUM_MALE: MannequinMeasurements = {
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

describe("buildHumanoidRig", () => {
  it("scales total height to the measurement in meters", () => {
    const rig = buildHumanoidRig(MEDIUM_MALE);
    expect(rig.totalHeight).toBeCloseTo(1.76, 2);
  });

  it("stacks torso segments bottom to top without gaps", () => {
    const rig = buildHumanoidRig(MEDIUM_MALE);
    for (let i = 1; i < rig.torso.length; i++) {
      const prev = rig.torso[i - 1];
      expect(rig.torso[i].y).toBeCloseTo(prev.y + prev.height, 5);
    }
  });

  it("keeps leg radius smaller than hip half-width so legs render as two distinct limbs", () => {
    const rig = buildHumanoidRig(MEDIUM_MALE);
    expect(rig.legRadiusTop).toBeLessThan(rig.hipHalfWidth);
  });

  it("produces a taller rig for a larger height measurement", () => {
    const small = buildHumanoidRig({ ...MEDIUM_MALE, heightCm: 160 });
    const large = buildHumanoidRig({ ...MEDIUM_MALE, heightCm: 190 });
    expect(large.totalHeight).toBeGreaterThan(small.totalHeight);
    expect(large.shoulderY).toBeGreaterThan(small.shoulderY);
  });
});
