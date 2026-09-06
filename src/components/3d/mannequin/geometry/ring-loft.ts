import * as THREE from "three";

/**
 * One cross-section control point along a lofted chain. `y` is the local
 * height (meters) — landmarks must be supplied in ascending `y` order. A
 * landmark with halfWidth/depthFront/depthBack all ~0 degenerates its ring to
 * a single point, which `mergeVertices` later collapses into a natural fan
 * cap (crown, fingertip, toe tip) with no special-cased cap geometry needed.
 */
export interface BodyLandmark {
  name: string;
  y: number;
  halfWidth: number;
  depthFront: number;
  depthBack: number;
  /** Superellipse exponent: 2 = true ellipse, >2 = softer-squared (shoulders/chest), <2 = pinched. */
  n: number;
}

export interface LoftResult {
  geometry: THREE.BufferGeometry;
  /** Landmark name -> generated ring index, for socket lookups and skin-weight assignment. */
  landmarkRingIndex: Record<string, number>;
  /** Absolute local Y of every generated ring, indexed the same as landmarkRingIndex's values. */
  ringYs: number[];
  radialSegments: number;
}

export interface RingLoftOptions {
  radialSegments: number;
  ringsPerSegment: number;
}

/** Catmull-Rom interpolation of a single scalar through 4 control values at t in [0,1] between p1 and p2. */
function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Asymmetric-superellipse cross-section: wider/narrower left-right than
 * front-back, and front depth independently tunable from back depth (a real
 * torso/bust/belly bulges forward more than the back curves backward — this
 * is what a plain ellipse or circle cannot express).
 */
function superellipsePoint(
  angle: number,
  halfWidth: number,
  depthFront: number,
  depthBack: number,
  n: number,
): { x: number; z: number } {
  const cosT = Math.cos(angle);
  const sinT = Math.sin(angle);
  const exp = 2 / n;
  const x = halfWidth * Math.sign(cosT) * Math.abs(cosT) ** exp;
  const depth = sinT >= 0 ? depthFront : depthBack;
  const z = depth * Math.sign(sinT) * Math.abs(sinT) ** exp;
  return { x, z };
}

/**
 * Lofts a smooth, continuous tube through a chain of cross-section landmarks.
 * This is the single building block every body part (torso+neck+head, each
 * arm, each leg, palms, fingers, feet) is built from — never a primitive
 * (cylinder/sphere/capsule) directly, so seams between rings are always
 * smooth quad columns rather than sharp primitive-to-primitive joins.
 */
export function buildRingLoft(landmarks: BodyLandmark[], opts: RingLoftOptions): LoftResult {
  if (landmarks.length < 2) {
    throw new Error("buildRingLoft requires at least 2 landmarks");
  }
  const { radialSegments, ringsPerSegment } = opts;

  interface RingSpec {
    y: number;
    halfWidth: number;
    depthFront: number;
    depthBack: number;
    n: number;
  }
  const rings: RingSpec[] = [];
  const landmarkRingIndex: Record<string, number> = {};

  const at = (i: number) => landmarks[Math.max(0, Math.min(landmarks.length - 1, i))];

  for (let i = 0; i < landmarks.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const stepsThisSegment = ringsPerSegment;

    landmarkRingIndex[p1.name] = rings.length;

    for (let s = 0; s < stepsThisSegment; s++) {
      const t = s / stepsThisSegment;
      rings.push({
        y: lerp(p1.y, p2.y, t),
        halfWidth: catmullRom1D(p0.halfWidth, p1.halfWidth, p2.halfWidth, p3.halfWidth, t),
        depthFront: catmullRom1D(p0.depthFront, p1.depthFront, p2.depthFront, p3.depthFront, t),
        depthBack: catmullRom1D(p0.depthBack, p1.depthBack, p2.depthBack, p3.depthBack, t),
        n: catmullRom1D(p0.n, p1.n, p2.n, p3.n, t),
      });
    }
  }
  const last = landmarks[landmarks.length - 1];
  landmarkRingIndex[last.name] = rings.length;
  rings.push({ y: last.y, halfWidth: last.halfWidth, depthFront: last.depthFront, depthBack: last.depthBack, n: last.n });

  const ringYs = rings.map((r) => r.y);
  const positions: number[] = [];
  for (const ring of rings) {
    for (let seg = 0; seg <= radialSegments; seg++) {
      const angle = (seg / radialSegments) * Math.PI * 2;
      const { x, z } = superellipsePoint(angle, ring.halfWidth, ring.depthFront, ring.depthBack, Math.max(ring.n, 1e-3));
      positions.push(x, ring.y, z);
    }
  }

  const indices: number[] = [];
  const vertsPerRing = radialSegments + 1;
  for (let ringIdx = 0; ringIdx < rings.length - 1; ringIdx++) {
    for (let seg = 0; seg < radialSegments; seg++) {
      const a = ringIdx * vertsPerRing + seg;
      const b = a + 1;
      const c = a + vertsPerRing;
      const d = c + 1;
      // Wound so the outward-facing normal points away from the Y axis.
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, landmarkRingIndex, ringYs, radialSegments };
}
