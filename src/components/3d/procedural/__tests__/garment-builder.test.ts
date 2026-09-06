import { describe, it, expect } from "vitest";
import { buildHumanoidRig } from "../humanoid";
import { getGarmentPlan } from "../garment-builder";
import type { MannequinMeasurements } from "../../types";

const MEASUREMENTS: MannequinMeasurements = {
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

describe("getGarmentPlan", () => {
  const rig = buildHumanoidRig(MEASUREMENTS);

  it("gives a dress both a sleeve and a skirt", () => {
    const plan = getGarmentPlan("dress", rig, "SLIM");
    expect(plan.sleeve).toBeDefined();
    expect(plan.skirt).toBeDefined();
    expect(plan.legs).toBeUndefined();
  });

  it("gives trousers legs but no sleeve or skirt", () => {
    const plan = getGarmentPlan("trousers", rig, "REGULAR");
    expect(plan.legs).toBeDefined();
    expect(plan.sleeve).toBeUndefined();
    expect(plan.skirt).toBeUndefined();
  });

  it("eases garment radii outward from the body so cloth never sits inside skin", () => {
    const plan = getGarmentPlan("tshirt", rig, "OVERSIZED");
    const bodySeg = rig.torso.at(-1)!;
    const garmentSeg = plan.torso.at(-1)!;
    expect(garmentSeg.radiusTop).toBeGreaterThan(bodySeg.radiusTop);
  });

  it("increases ease with looser fit types", () => {
    const slim = getGarmentPlan("jacket", rig, "SLIM").torso[0];
    const oversized = getGarmentPlan("jacket", rig, "OVERSIZED").torso[0];
    expect(oversized.radiusTop).toBeGreaterThan(slim.radiusTop);
  });
});
