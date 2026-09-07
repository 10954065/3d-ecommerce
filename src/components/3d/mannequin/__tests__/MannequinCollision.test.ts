import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { buildMannequinGeometry } from "../MannequinBuilder";
import { buildCollisionCapsuleSpecs, buildCollisionProxy } from "../MannequinCollision";
import { DEFAULT_FEMALE_MEASUREMENTS, DEFAULT_MALE_MEASUREMENTS } from "../mannequinConfig";

describe("buildCollisionCapsuleSpecs", () => {
  it("covers head, torso, both arms, both hands, both legs, and both feet", () => {
    const specs = buildCollisionCapsuleSpecs("female", DEFAULT_FEMALE_MEASUREMENTS);
    const names = specs.map((s) => s.name);

    expect(names).toContain("headNeck");
    expect(names).toContain("chest");
    expect(names).toContain("abdomen");
    expect(names).toContain("pelvis");
    for (const side of ["L", "R"]) {
      expect(names).toContain(`${side}_upperArm`);
      expect(names).toContain(`${side}_forearm`);
      expect(names).toContain(`${side}_hand`);
      expect(names).toContain(`${side}_thigh`);
      expect(names).toContain(`${side}_calf`);
      expect(names).toContain(`${side}_foot`);
    }
  });

  it("gives every capsule a positive, finite radius", () => {
    const specs = buildCollisionCapsuleSpecs("male", DEFAULT_MALE_MEASUREMENTS);
    for (const spec of specs) {
      expect(spec.radius).toBeGreaterThan(0);
      expect(Number.isFinite(spec.radius)).toBe(true);
    }
  });

  it("mirrors left/right radii exactly", () => {
    const specs = buildCollisionCapsuleSpecs("male", DEFAULT_MALE_MEASUREMENTS);
    const byName = Object.fromEntries(specs.map((s) => [s.name, s]));
    for (const part of ["upperArm", "forearm", "hand", "thigh", "calf", "foot"]) {
      expect(byName[`L_${part}`].radius).toBeCloseTo(byName[`R_${part}`].radius, 10);
    }
  });

  it("scales the torso capsules with a bigger male vs. female frame at the same reference height", () => {
    const male = buildCollisionCapsuleSpecs("male", { ...DEFAULT_MALE_MEASUREMENTS, heightCm: 170 });
    const female = buildCollisionCapsuleSpecs("female", { ...DEFAULT_FEMALE_MEASUREMENTS, heightCm: 170, chestCm: DEFAULT_MALE_MEASUREMENTS.chestCm });
    const maleChest = male.find((s) => s.name === "chest")!;
    const femaleChest = female.find((s) => s.name === "chest")!;
    expect(maleChest.radius).toBeGreaterThan(femaleChest.radius);
  });
});

describe("buildCollisionProxy", () => {
  it("produces one mesh per spec, all with finite world positions", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const specs = buildCollisionCapsuleSpecs("female", DEFAULT_FEMALE_MEASUREMENTS);
    const proxy = buildCollisionProxy(specs, boneWorldPositions);

    expect(proxy.children.length).toBe(specs.length);
    for (const child of proxy.children) {
      expect(child).toBeInstanceOf(THREE.Mesh);
      const pos = (child as THREE.Mesh).position;
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.z)).toBe(true);
    }
  });

  it("uses a sphere for same-bone specs (hands) and a capsule otherwise", () => {
    const { boneWorldPositions } = buildMannequinGeometry("male", DEFAULT_MALE_MEASUREMENTS);
    const specs = buildCollisionCapsuleSpecs("male", DEFAULT_MALE_MEASUREMENTS);
    const proxy = buildCollisionProxy(specs, boneWorldPositions);

    const handMesh = proxy.children.find((c) => c.name === "L_hand") as THREE.Mesh;
    const armMesh = proxy.children.find((c) => c.name === "L_upperArm") as THREE.Mesh;
    expect(handMesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
    expect(armMesh.geometry).toBeInstanceOf(THREE.CapsuleGeometry);
  });

  it("stays well within the 5k-20k triangle collision budget", () => {
    const { boneWorldPositions } = buildMannequinGeometry("female", DEFAULT_FEMALE_MEASUREMENTS);
    const specs = buildCollisionCapsuleSpecs("female", DEFAULT_FEMALE_MEASUREMENTS);
    const proxy = buildCollisionProxy(specs, boneWorldPositions);

    let triangleCount = 0;
    proxy.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const index = child.geometry.getIndex();
        triangleCount += (index ? index.count : child.geometry.getAttribute("position").count) / 3;
      }
    });
    expect(triangleCount).toBeLessThan(5000);
  });
});
