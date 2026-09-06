import * as THREE from "three";
import { MANNEQUIN_MATERIAL_PRESETS } from "./mannequinConfig";
import type { MannequinMaterialConfig, MannequinMaterialPresetId } from "./mannequinTypes";

/** Configurable matte mannequin material — never hardcoded, per the brief's material-system requirement. */
export function createMannequinMaterial(config: MannequinMaterialPresetId | MannequinMaterialConfig): THREE.MeshStandardMaterial {
  const resolved: MannequinMaterialConfig = typeof config === "string" ? MANNEQUIN_MATERIAL_PRESETS[config] : config;
  return new THREE.MeshStandardMaterial({
    color: resolved.color,
    roughness: resolved.roughness,
    metalness: resolved.metalness,
  });
}
