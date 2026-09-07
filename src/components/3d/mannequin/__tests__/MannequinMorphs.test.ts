import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { buildMannequinGeometry } from "../MannequinBuilder";
import {
  BODY_SHAPE_WEIGHTS,
  MORPH_NAMES,
  buildMorphTargets,
  combineMorphWeights,
  morphWeightsToInfluenceArray,
  resolveSizeMorphWeights,
} from "../MannequinMorphs";
import { DEFAULT_FEMALE_MEASUREMENTS, DEFAULT_MALE_MEASUREMENTS } from "../mannequinConfig";

describe("buildMorphTargets", () => {
  it("produces one delta array per morph name, matching the base vertex count", () => {
    const { geometry } = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const basePositions = (geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;

    const morphs = buildMorphTargets("female", DEFAULT_FEMALE_MEASUREMENTS, basePositions);

    expect(morphs.names).toEqual(MORPH_NAMES);
    expect(morphs.deltas.length).toBe(MORPH_NAMES.length);
    for (const delta of morphs.deltas) {
      expect(delta.length).toBe(basePositions.length);
    }
  });

  it("produces a non-zero displacement for every axis (each morph actually moves vertices)", () => {
    const { geometry } = buildMannequinGeometry("male", DEFAULT_MALE_MEASUREMENTS);
    const basePositions = (geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    const morphs = buildMorphTargets("male", DEFAULT_MALE_MEASUREMENTS, basePositions);

    morphs.deltas.forEach((delta, i) => {
      const maxAbs = delta.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
      expect(maxAbs, `axis "${morphs.names[i]}" should displace at least one vertex`).toBeGreaterThan(1e-6);
    });
  });

  it("produces no NaN or infinite values in any delta", () => {
    const { geometry } = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const basePositions = (geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    const morphs = buildMorphTargets("female", DEFAULT_FEMALE_MEASUREMENTS, basePositions);

    for (const delta of morphs.deltas) {
      for (const value of delta) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("the height morph raises the topmost vertex more than the bust morph does", () => {
    const { geometry } = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const basePositions = (geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    const morphs = buildMorphTargets("female", DEFAULT_FEMALE_MEASUREMENTS, basePositions);

    let topVertexIndex = 0;
    let topY = -Infinity;
    for (let i = 0; i < basePositions.length; i += 3) {
      if (basePositions[i + 1] > topY) {
        topY = basePositions[i + 1];
        topVertexIndex = i;
      }
    }

    const heightDelta = morphs.deltas[MORPH_NAMES.indexOf("height")][topVertexIndex + 1];
    const bustDelta = morphs.deltas[MORPH_NAMES.indexOf("bust")][topVertexIndex + 1];
    expect(Math.abs(heightDelta)).toBeGreaterThan(Math.abs(bustDelta));
  });
});

describe("resolveSizeMorphWeights", () => {
  it("resolves to (near) zero weights for the M reference size", () => {
    const weights = resolveSizeMorphWeights("male", "M");
    for (const value of Object.values(weights)) {
      expect(value).toBeCloseTo(0, 5);
    }
  });

  it("resolves negative weights for XS and positive weights for XXXL", () => {
    const xs = resolveSizeMorphWeights("female", "XS");
    const xxxl = resolveSizeMorphWeights("female", "XXXL");

    expect(xs.height).toBeLessThan(0);
    expect(xs.chest).toBeLessThan(0);
    expect(xxxl.height).toBeGreaterThan(0);
    expect(xxxl.chest).toBeGreaterThan(0);
  });

  it("only resolves weights for axes with a direct measurement field", () => {
    const weights = resolveSizeMorphWeights("male", "L");
    expect(weights.bust).toBeUndefined();
    expect(weights.armVolume).toBeUndefined();
    expect(weights.torsoLength).toBeUndefined();
  });
});

describe("combineMorphWeights", () => {
  it("sums weights across sources", () => {
    const combined = combineMorphWeights({ height: 0.5 }, { height: 0.3, waist: -0.2 });
    expect(combined.height).toBeCloseTo(0.8, 5);
    expect(combined.waist).toBeCloseTo(-0.2, 5);
  });

  it("clamps extreme combined weights", () => {
    const combined = combineMorphWeights({ height: 5 }, { height: 5 });
    expect(combined.height).toBeLessThanOrEqual(1.6);
  });
});

describe("morphWeightsToInfluenceArray", () => {
  it("produces an array in MORPH_NAMES order, defaulting missing axes to 0", () => {
    const influences = morphWeightsToInfluenceArray({ waist: -0.4 });
    expect(influences.length).toBe(MORPH_NAMES.length);
    expect(influences[MORPH_NAMES.indexOf("waist")]).toBeCloseTo(-0.4, 5);
    expect(influences[MORPH_NAMES.indexOf("height")]).toBe(0);
  });
});

describe("BODY_SHAPE_WEIGHTS", () => {
  it("has an entry for every documented preset", () => {
    const presets = ["Slim", "Regular", "Athletic", "Curvy", "Plus", "Tall", "Petite", "Custom"] as const;
    for (const preset of presets) {
      expect(BODY_SHAPE_WEIGHTS[preset]).toBeDefined();
    }
  });

  it("Regular and Custom apply no preset nudge", () => {
    expect(Object.keys(BODY_SHAPE_WEIGHTS.Regular)).toHaveLength(0);
    expect(Object.keys(BODY_SHAPE_WEIGHTS.Custom)).toHaveLength(0);
  });
});
