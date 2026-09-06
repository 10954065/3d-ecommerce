import { describe, it, expect } from "vitest";
import { buildRingLoft, type BodyLandmark } from "../ring-loft";

const SIMPLE_CHAIN: BodyLandmark[] = [
  { name: "a", y: 0, halfWidth: 0.05, depthFront: 0.04, depthBack: 0.04, n: 2 },
  { name: "b", y: 0.5, halfWidth: 0.08, depthFront: 0.06, depthBack: 0.06, n: 2 },
  { name: "c", y: 1, halfWidth: 0.001, depthFront: 0.001, depthBack: 0.001, n: 2 },
];

describe("buildRingLoft", () => {
  it("produces the exact vertex count implied by ring/segment counts", () => {
    const radialSegments = 16;
    const ringsPerSegment = 5;
    const result = buildRingLoft(SIMPLE_CHAIN, { radialSegments, ringsPerSegment });
    const expectedRings = (SIMPLE_CHAIN.length - 1) * ringsPerSegment + 1;
    const expectedVerts = expectedRings * (radialSegments + 1);
    expect(result.geometry.getAttribute("position").count).toBe(expectedVerts);
    expect(result.ringYs.length).toBe(expectedRings);
  });

  it("maps every landmark name to a ring index", () => {
    const result = buildRingLoft(SIMPLE_CHAIN, { radialSegments: 12, ringsPerSegment: 4 });
    expect(Object.keys(result.landmarkRingIndex).sort()).toEqual(["a", "b", "c"].sort());
    expect(result.landmarkRingIndex.a).toBe(0);
    expect(result.landmarkRingIndex.c).toBe(result.ringYs.length - 1);
  });

  it("collapses a near-zero landmark's ring to a single point", () => {
    const result = buildRingLoft(SIMPLE_CHAIN, { radialSegments: 12, ringsPerSegment: 4 });
    const positions = result.geometry.getAttribute("position");
    const vertsPerRing = 13;
    const lastRingStart = (result.ringYs.length - 1) * vertsPerRing;
    for (let i = 0; i < vertsPerRing; i++) {
      const x = positions.getX(lastRingStart + i);
      const z = positions.getZ(lastRingStart + i);
      expect(Math.abs(x)).toBeLessThan(0.01);
      expect(Math.abs(z)).toBeLessThan(0.01);
    }
  });

  it("produces no NaN or infinite positions", () => {
    const result = buildRingLoft(SIMPLE_CHAIN, { radialSegments: 20, ringsPerSegment: 6 });
    const positions = result.geometry.getAttribute("position").array;
    for (const value of positions) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("widens the ring at a wider landmark than its neighbors", () => {
    const result = buildRingLoft(SIMPLE_CHAIN, { radialSegments: 16, ringsPerSegment: 6 });
    const positions = result.geometry.getAttribute("position");
    const vertsPerRing = 17;
    const midRing = result.landmarkRingIndex.b;
    const startRing = result.landmarkRingIndex.a;
    const maxXAt = (ring: number) => {
      let max = 0;
      for (let i = 0; i < vertsPerRing; i++) {
        max = Math.max(max, Math.abs(positions.getX(ring * vertsPerRing + i)));
      }
      return max;
    };
    expect(maxXAt(midRing)).toBeGreaterThan(maxXAt(startRing));
  });

  it("throws with fewer than 2 landmarks", () => {
    expect(() => buildRingLoft([SIMPLE_CHAIN[0]], { radialSegments: 8, ringsPerSegment: 2 })).toThrow();
  });
});
