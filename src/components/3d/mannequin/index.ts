export * from "./mannequinTypes";
export {
  BONE_PARENTS,
  BONE_ORDER,
  MANNEQUIN_MATERIAL_PRESETS,
  DEFAULT_MATERIAL_PRESET,
  DEFAULT_MALE_MEASUREMENTS,
  DEFAULT_FEMALE_MEASUREMENTS,
  SIZE_MEASUREMENTS,
} from "./mannequinConfig";
export { buildMannequinGeometry, type MannequinBuild, type MannequinMorphOverrides } from "./MannequinBuilder";
export { buildSkeleton, applyPresentationPose, type BuiltSkeleton } from "./MannequinSkeleton";
export { createMannequinMaterial } from "./MannequinMaterials";
export { useGltfMannequinAsset } from "./MannequinLoader";
export {
  MORPH_NAMES,
  BODY_SHAPE_PRESETS,
  BODY_SHAPE_WEIGHTS,
  buildMorphTargets,
  resolveSizeMorphWeights,
  combineMorphWeights,
  morphWeightsToInfluenceArray,
  type MorphName,
  type SizeLabel,
  type BodyShapePreset,
  type MorphTargetSet,
} from "./MannequinMorphs";
export { buildCollisionCapsuleSpecs, buildCollisionProxy, type CollisionCapsuleSpec } from "./MannequinCollision";
export { Mannequin, type MannequinProps } from "./Mannequin";
export { buildGarmentGeometry, type GarmentBuild } from "./GarmentBuilder";
export { Garment, type GarmentProps } from "./Garment";
export { useMannequinAnimation } from "./MannequinAnimation";
