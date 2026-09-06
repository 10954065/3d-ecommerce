import type { HumanoidRig, BodySegment } from "./humanoid";
import type { FitType, GarmentArchetype } from "../types";

const FIT_EASE: Record<FitType, number> = {
  SLIM: 1.04,
  REGULAR: 1.09,
  RELAXED: 1.16,
  OVERSIZED: 1.26,
};

export interface SleevePlan {
  length: number;
  radiusTop: number;
  radiusBottom: number;
}

export interface LegPlan {
  length: number;
  radiusTop: number;
  radiusBottom: number;
  startY: number;
}

export interface SkirtPlan {
  topY: number;
  bottomY: number;
  radiusTop: number;
  radiusBottom: number;
}

export interface GarmentPlan {
  torso: BodySegment[];
  sleeve?: SleevePlan;
  legs?: LegPlan;
  skirt?: SkirtPlan;
}

function easedTorso(rig: HumanoidRig, ease: number, fromIndex: number): BodySegment[] {
  return rig.torso.slice(fromIndex).map((seg) => ({
    ...seg,
    radiusTop: seg.radiusTop * ease,
    radiusBottom: seg.radiusBottom * ease,
  }));
}

/** Produces the mesh plan for a garment archetype draped over a given body rig. */
export function getGarmentPlan(
  archetype: GarmentArchetype,
  rig: HumanoidRig,
  fit: FitType,
): GarmentPlan {
  const ease = FIT_EASE[fit];

  switch (archetype) {
    case "tshirt":
      return {
        torso: easedTorso(rig, ease, 1),
        sleeve: { length: rig.armLength * 0.32, radiusTop: rig.armRadiusTop * ease * 1.15, radiusBottom: rig.armRadiusBottom * ease * 1.2 },
      };
    case "shirt":
      return {
        torso: easedTorso(rig, ease, 0).map((s, i) => (i === 0 ? { ...s, height: s.height * 1.6 } : s)),
        sleeve: { length: rig.armLength * 0.92, radiusTop: rig.armRadiusTop * ease * 1.1, radiusBottom: rig.armRadiusBottom * ease * 1.05 },
      };
    case "jacket":
      return {
        torso: easedTorso(rig, ease * 1.05, 0).map((s, i) => (i === 0 ? { ...s, height: s.height * 1.9 } : s)),
        sleeve: { length: rig.armLength * 0.95, radiusTop: rig.armRadiusTop * ease * 1.25, radiusBottom: rig.armRadiusBottom * ease * 1.15 },
      };
    case "coat":
      return {
        torso: easedTorso(rig, ease * 1.1, 0).map((s, i) => (i === 0 ? { ...s, height: s.height * 4.2 } : s)),
        sleeve: { length: rig.armLength * 0.98, radiusTop: rig.armRadiusTop * ease * 1.3, radiusBottom: rig.armRadiusBottom * ease * 1.2 },
      };
    case "trousers": {
      const legLength = rig.legLength * 0.98;
      return {
        torso: easedTorso(rig, ease, 1).slice(0, 1),
        legs: { length: legLength, radiusTop: rig.legRadiusTop * ease * 1.1, radiusBottom: rig.legRadiusBottom * ease, startY: rig.ankleY + rig.legLength - legLength },
      };
    }
    case "jumpsuit": {
      const legLength = rig.legLength * 0.98;
      return {
        torso: easedTorso(rig, ease, 0),
        sleeve: { length: rig.armLength * 0.9, radiusTop: rig.armRadiusTop * ease * 1.1, radiusBottom: rig.armRadiusBottom * ease * 1.05 },
        legs: { length: legLength, radiusTop: rig.legRadiusTop * ease * 1.05, radiusBottom: rig.legRadiusBottom * ease, startY: rig.ankleY + rig.legLength - legLength },
      };
    }
    case "skirt": {
      const topY = rig.torso[1].y;
      const bottomY = rig.ankleY + rig.legLength * 0.42;
      return {
        torso: easedTorso(rig, ease, 1).slice(0, 1),
        skirt: { topY, bottomY, radiusTop: rig.torso[0].radiusTop * ease * 1.05, radiusBottom: rig.torso[0].radiusTop * ease * 2.4 },
      };
    }
    case "dress": {
      const topY = rig.torso[1].y;
      const bottomY = rig.ankleY + rig.legLength * 0.35;
      return {
        torso: easedTorso(rig, ease, 1),
        sleeve: { length: rig.armLength * 0.25, radiusTop: rig.armRadiusTop * ease * 1.1, radiusBottom: rig.armRadiusBottom * ease * 1.15 },
        skirt: { topY, bottomY, radiusTop: rig.torso[1].radiusTop * ease * 1.05, radiusBottom: rig.torso[0].radiusTop * ease * 2.2 },
      };
    }
    default:
      return { torso: easedTorso(rig, ease, 0) };
  }
}
