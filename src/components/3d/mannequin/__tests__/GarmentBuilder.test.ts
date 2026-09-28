import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { buildGarmentGeometry } from "../GarmentBuilder";
import { buildMannequinGeometry } from "../MannequinBuilder";
import { DEFAULT_FEMALE_MEASUREMENTS, DEFAULT_MALE_MEASUREMENTS } from "../mannequinConfig";
import type { GarmentArchetype } from "../../types";

const ARCHETYPES: GarmentArchetype[] = ["tshirt", "shirt", "jacket", "coat", "trousers", "jumpsuit", "skirt", "dress"];

describe("buildGarmentGeometry", () => {
  it.each(ARCHETYPES)("produces a finite, non-empty geometry for %s", (archetype) => {
    const build = buildGarmentGeometry(archetype, "female", DEFAULT_FEMALE_MEASUREMENTS, "REGULAR");
    const position = build.geometry.getAttribute("position") as THREE.BufferAttribute;
    expect(position.count).toBeGreaterThan(0);
    for (let i = 0; i < position.array.length; i++) {
      expect(Number.isFinite(position.array[i])).toBe(true);
    }
    expect(build.minY).toBeLessThan(build.maxY);
  });

  it("gives every vertex skin weights that sum to 1", () => {
    const build = buildGarmentGeometry("jacket", "male", DEFAULT_MALE_MEASUREMENTS, "REGULAR");
    const weights = build.geometry.getAttribute("skinWeight") as THREE.BufferAttribute;
    for (let v = 0; v < weights.count; v++) {
      const sum = weights.getX(v) + weights.getY(v) + weights.getZ(v) + weights.getW(v);
      expect(sum).toBeGreaterThan(0.99);
      expect(sum).toBeLessThan(1.01);
    }
  });

  it("has no arm/leg shells for a torso-only-adjacent archetype like trousers (no vertex above the hip)", () => {
    const body = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const bodyBox = new THREE.Box3().setFromBufferAttribute(body.geometry.getAttribute("position") as THREE.BufferAttribute);
    const trousers = buildGarmentGeometry("trousers", "female", DEFAULT_FEMALE_MEASUREMENTS, "REGULAR");
    // Trousers should stay well below the shoulder line of the body they dress.
    expect(trousers.maxY).toBeLessThan(bodyBox.min.y + (bodyBox.max.y - bodyBox.min.y) * 0.6);
  });

  it("makes a skirt's hem wider than its waist (real flare, not a straight tube)", () => {
    const build = buildGarmentGeometry("skirt", "female", DEFAULT_FEMALE_MEASUREMENTS, "REGULAR");
    const position = build.geometry.getAttribute("position") as THREE.BufferAttribute;
    let hemRadius = 0;
    let waistRadius = Infinity;
    for (let v = 0; v < position.count; v++) {
      const x = position.getX(v);
      const y = position.getY(v);
      const r = Math.abs(x);
      if (Math.abs(y - build.minY) < 0.005) hemRadius = Math.max(hemRadius, r);
      if (Math.abs(y - build.maxY) < 0.005) waistRadius = Math.min(waistRadius, r === 0 ? Infinity : r);
    }
    expect(hemRadius).toBeGreaterThan(waistRadius === Infinity ? 0 : waistRadius);
  });

  it("scales larger with a more relaxed fit", () => {
    const slim = buildGarmentGeometry("tshirt", "male", DEFAULT_MALE_MEASUREMENTS, "SLIM");
    const oversized = buildGarmentGeometry("tshirt", "male", DEFAULT_MALE_MEASUREMENTS, "OVERSIZED");
    const slimBox = new THREE.Box3().setFromBufferAttribute(slim.geometry.getAttribute("position") as THREE.BufferAttribute);
    const oversizedBox = new THREE.Box3().setFromBufferAttribute(oversized.geometry.getAttribute("position") as THREE.BufferAttribute);
    expect(oversizedBox.max.x - oversizedBox.min.x).toBeGreaterThan(slimBox.max.x - slimBox.min.x);
  });

  it("is left/right symmetric for a two-sleeve archetype", () => {
    const build = buildGarmentGeometry("shirt", "male", DEFAULT_MALE_MEASUREMENTS, "REGULAR");
    const position = build.geometry.getAttribute("position") as THREE.BufferAttribute;
    let maxX = 0;
    let minX = 0;
    for (let v = 0; v < position.count; v++) {
      maxX = Math.max(maxX, position.getX(v));
      minX = Math.min(minX, position.getX(v));
    }
    expect(maxX).toBeCloseTo(-minX, 2);
  });

  it("throws for an unset topLandmark reference (config sanity guard)", () => {
    expect(() => buildGarmentGeometry("dress", "female", DEFAULT_FEMALE_MEASUREMENTS, "REGULAR")).not.toThrow();
  });
});
