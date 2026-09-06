export type SizeLabel = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

interface MannequinMeasurements {
  size: SizeLabel;
  heightCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  shoulderWidthCm: number;
  armLengthCm: number;
  inseamCm: number;
  neckCm: number;
  thighCm: number;
}

// Standardized measurement charts — see section 8 of the product spec.
export const MEN_MEASUREMENTS: MannequinMeasurements[] = [
  { size: "XS", heightCm: 168, chestCm: 86, waistCm: 71, hipsCm: 88, shoulderWidthCm: 42, armLengthCm: 60, inseamCm: 78, neckCm: 36, thighCm: 50 },
  { size: "S", heightCm: 172, chestCm: 91, waistCm: 76, hipsCm: 93, shoulderWidthCm: 44, armLengthCm: 61, inseamCm: 80, neckCm: 37, thighCm: 52 },
  { size: "M", heightCm: 176, chestCm: 97, waistCm: 82, hipsCm: 99, shoulderWidthCm: 46, armLengthCm: 62, inseamCm: 82, neckCm: 39, thighCm: 55 },
  { size: "L", heightCm: 180, chestCm: 103, waistCm: 88, hipsCm: 105, shoulderWidthCm: 48, armLengthCm: 63, inseamCm: 84, neckCm: 41, thighCm: 58 },
  { size: "XL", heightCm: 183, chestCm: 109, waistCm: 94, hipsCm: 111, shoulderWidthCm: 50, armLengthCm: 64, inseamCm: 86, neckCm: 43, thighCm: 61 },
  { size: "XXL", heightCm: 185, chestCm: 115, waistCm: 100, hipsCm: 117, shoulderWidthCm: 52, armLengthCm: 65, inseamCm: 87, neckCm: 45, thighCm: 64 },
  { size: "XXXL", heightCm: 187, chestCm: 121, waistCm: 106, hipsCm: 123, shoulderWidthCm: 54, armLengthCm: 66, inseamCm: 88, neckCm: 47, thighCm: 67 },
];

export const WOMEN_MEASUREMENTS: MannequinMeasurements[] = [
  { size: "XS", heightCm: 158, chestCm: 81, waistCm: 63, hipsCm: 89, shoulderWidthCm: 36, armLengthCm: 56, inseamCm: 74, neckCm: 31, thighCm: 48 },
  { size: "S", heightCm: 162, chestCm: 86, waistCm: 68, hipsCm: 94, shoulderWidthCm: 37, armLengthCm: 57, inseamCm: 76, neckCm: 32, thighCm: 51 },
  { size: "M", heightCm: 166, chestCm: 91, waistCm: 73, hipsCm: 99, shoulderWidthCm: 38, armLengthCm: 58, inseamCm: 78, neckCm: 33, thighCm: 54 },
  { size: "L", heightCm: 169, chestCm: 97, waistCm: 79, hipsCm: 105, shoulderWidthCm: 39, armLengthCm: 59, inseamCm: 79, neckCm: 34, thighCm: 57 },
  { size: "XL", heightCm: 172, chestCm: 103, waistCm: 85, hipsCm: 111, shoulderWidthCm: 40, armLengthCm: 60, inseamCm: 80, neckCm: 35, thighCm: 60 },
  { size: "XXL", heightCm: 174, chestCm: 109, waistCm: 91, hipsCm: 117, shoulderWidthCm: 41, armLengthCm: 61, inseamCm: 81, neckCm: 36, thighCm: 63 },
  { size: "XXXL", heightCm: 176, chestCm: 115, waistCm: 97, hipsCm: 123, shoulderWidthCm: 42, armLengthCm: 62, inseamCm: 82, neckCm: 37, thighCm: 66 },
];
