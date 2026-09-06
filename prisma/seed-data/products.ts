export type GarmentArchetype =
  | "tshirt"
  | "shirt"
  | "trousers"
  | "jacket"
  | "coat"
  | "dress"
  | "skirt"
  | "jumpsuit";

export interface SeedProduct {
  name: string;
  gender: "MEN" | "WOMEN";
  categorySlug: string;
  archetype: GarmentArchetype;
  fit: "SLIM" | "REGULAR" | "RELAXED" | "OVERSIZED";
  basePrice: number;
  fabric: string;
  brand: string;
  description: string;
  materialSummary: string;
  careInstructions: string;
  colors: { name: string; hex: string }[];
  sizes: ("XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL")[];
}

export const MEN_PRODUCTS: SeedProduct[] = [
  {
    name: "Oxford Weave Shirt",
    gender: "MEN",
    categorySlug: "shirts",
    archetype: "shirt",
    fit: "REGULAR",
    basePrice: 420,
    fabric: "Cotton",
    brand: "Forme Atelier",
    description:
      "A wardrobe staple cut from breathable oxford cotton with a soft, structured collar. Engineered to hold its shape through movement while draping naturally at the waist.",
    materialSummary: "100% Cotton",
    careInstructions: "Machine wash cold. Warm iron. Do not bleach.",
    colors: [
      { name: "White", hex: "#F5F3EE" },
      { name: "Sky Blue", hex: "#A9C4D9" },
      { name: "Charcoal", hex: "#3A3A3C" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Heritage Denim Jacket",
    gender: "MEN",
    categorySlug: "jackets",
    archetype: "jacket",
    fit: "REGULAR",
    basePrice: 780,
    fabric: "Denim",
    brand: "Forme Atelier",
    description:
      "Rigid selvedge denim, garment-washed for a broken-in feel from the first wear. Structured shoulders hold their line while the body softens with movement.",
    materialSummary: "100% Cotton Denim, 14oz",
    careInstructions: "Machine wash cold, inside out. Line dry.",
    colors: [
      { name: "Indigo", hex: "#2B3A55" },
      { name: "Washed Grey", hex: "#8C8C8C" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Merino Crew Sweater",
    gender: "MEN",
    categorySlug: "t-shirts",
    archetype: "tshirt",
    fit: "RELAXED",
    basePrice: 650,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "Fine-gauge merino wool knit with natural temperature regulation and a soft drape. Falls with weight at the hem rather than clinging.",
    materialSummary: "100% Merino Wool",
    careInstructions: "Hand wash cold. Dry flat.",
    colors: [
      { name: "Oatmeal", hex: "#DCD3C2" },
      { name: "Forest", hex: "#1F3A2E" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Classic Piqué Polo",
    gender: "MEN",
    categorySlug: "polos",
    archetype: "tshirt",
    fit: "SLIM",
    basePrice: 340,
    fabric: "Cotton",
    brand: "Forme Atelier",
    description:
      "Structured piqué cotton with a close, tailored cut through the body and a clean ribbed collar that keeps its shape wash after wash.",
    materialSummary: "100% Cotton Piqué",
    careInstructions: "Machine wash cold. Tumble dry low.",
    colors: [
      { name: "White", hex: "#F5F3EE" },
      { name: "Navy", hex: "#1B2A4A" },
      { name: "Burgundy", hex: "#6E1423" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    name: "Tailored Wool Trousers",
    gender: "MEN",
    categorySlug: "trousers",
    archetype: "trousers",
    fit: "SLIM",
    basePrice: 590,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "A fluid wool blend with just enough structure to hold a crease. Cut slim through the leg with a clean break at the ankle.",
    materialSummary: "80% Wool, 20% Viscose",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Charcoal", hex: "#3A3A3C" },
      { name: "Camel", hex: "#B08D57" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Straight Fit Selvedge Jeans",
    gender: "MEN",
    categorySlug: "jeans",
    archetype: "trousers",
    fit: "REGULAR",
    basePrice: 690,
    fabric: "Denim",
    brand: "Forme Atelier",
    description:
      "Heavyweight selvedge denim in a straight leg silhouette. Stiff off the shelf, molding to the body with wear.",
    materialSummary: "100% Cotton Denim, 13.5oz",
    careInstructions: "Wash sparingly, cold, inside out.",
    colors: [
      { name: "Raw Indigo", hex: "#22314D" },
      { name: "Black Wash", hex: "#1C1C1E" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
  },
  {
    name: "Two-Piece Wool Suit Jacket",
    gender: "MEN",
    categorySlug: "suits",
    archetype: "jacket",
    fit: "SLIM",
    basePrice: 1450,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "A half-canvassed jacket in fine wool twill. Soft shoulder construction moves with the body rather than against it.",
    materialSummary: "100% Wool",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Midnight Navy", hex: "#1B2439" },
      { name: "Charcoal", hex: "#3A3A3C" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Waxed Field Jacket",
    gender: "MEN",
    categorySlug: "jackets",
    archetype: "jacket",
    fit: "REGULAR",
    basePrice: 820,
    fabric: "Cotton",
    brand: "Forme Atelier",
    description:
      "Waxed cotton canvas built for weather. Develops a unique patina with age, softening at the fold lines.",
    materialSummary: "100% Waxed Cotton Canvas",
    careInstructions: "Spot clean only. Re-wax annually.",
    colors: [
      { name: "Olive", hex: "#4B5320" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Wool Overcoat",
    gender: "MEN",
    categorySlug: "coats",
    archetype: "coat",
    fit: "OVERSIZED",
    basePrice: 1290,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "Full-length overcoat in double-faced wool with substantial weight and drape. An oversized cut layers cleanly over tailoring.",
    materialSummary: "90% Wool, 10% Cashmere",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Camel", hex: "#B08D57" },
      { name: "Charcoal", hex: "#3A3A3C" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Technical Training Shorts",
    gender: "MEN",
    categorySlug: "activewear",
    archetype: "trousers",
    fit: "REGULAR",
    basePrice: 260,
    fabric: "Cotton",
    brand: "Forme Sport",
    description:
      "Lightweight stretch-cotton shorts built for range of motion, with a soft brushed interior finish.",
    materialSummary: "92% Cotton, 8% Elastane",
    careInstructions: "Machine wash cold. Tumble dry low.",
    colors: [
      { name: "Black", hex: "#141311" },
      { name: "Grey Melange", hex: "#9C9C9C" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
];

export const WOMEN_PRODUCTS: SeedProduct[] = [
  {
    name: "Silk Slip Dress",
    gender: "WOMEN",
    categorySlug: "dresses",
    archetype: "dress",
    fit: "SLIM",
    basePrice: 780,
    fabric: "Silk",
    brand: "Forme Atelier",
    description:
      "Cut on the bias from fluid mulberry silk, this slip dress skims the body and pools with movement. Fine adjustable straps.",
    materialSummary: "100% Mulberry Silk",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Champagne", hex: "#E8DCC8" },
      { name: "Black", hex: "#141311" },
      { name: "Deep Green", hex: "#1F3A2E" },
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    name: "Draped Satin Blouse",
    gender: "WOMEN",
    categorySlug: "blouses",
    archetype: "shirt",
    fit: "REGULAR",
    basePrice: 460,
    fabric: "Silk",
    brand: "Forme Atelier",
    description:
      "A satin-finish blouse with a soft cowl draped front. Fluid through the body with a fitted cuff.",
    materialSummary: "100% Silk Satin",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Ivory", hex: "#F1EADC" },
      { name: "Blush", hex: "#E3B8A8" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    name: "Wide-Leg Linen Trousers",
    gender: "WOMEN",
    categorySlug: "trousers",
    archetype: "trousers",
    fit: "RELAXED",
    basePrice: 520,
    fabric: "Linen",
    brand: "Forme Atelier",
    description:
      "Breathable linen with a high rise and a wide, fluid leg. Naturally textured with a relaxed, editorial drape.",
    materialSummary: "100% Linen",
    careInstructions: "Machine wash cold. Warm iron while damp.",
    colors: [
      { name: "Sand", hex: "#D8C9AE" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    name: "High-Rise Straight Jeans",
    gender: "WOMEN",
    categorySlug: "jeans",
    archetype: "trousers",
    fit: "REGULAR",
    basePrice: 640,
    fabric: "Denim",
    brand: "Forme Atelier",
    description:
      "Rigid denim with a high rise and a clean straight leg. Holds structure at the waist while softening through wear.",
    materialSummary: "99% Cotton, 1% Elastane",
    careInstructions: "Wash sparingly, cold, inside out.",
    colors: [
      { name: "Mid Blue", hex: "#4A6285" },
      { name: "Black Wash", hex: "#1C1C1E" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Pleated Midi Skirt",
    gender: "WOMEN",
    categorySlug: "skirts",
    archetype: "skirt",
    fit: "REGULAR",
    basePrice: 480,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "Fine knife pleats in a soft wool blend that swing and settle with each step. Falls to mid-calf.",
    materialSummary: "70% Wool, 30% Polyester",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Camel", hex: "#B08D57" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    name: "Tailored Jumpsuit",
    gender: "WOMEN",
    categorySlug: "jumpsuits",
    archetype: "jumpsuit",
    fit: "SLIM",
    basePrice: 690,
    fabric: "Cotton",
    brand: "Forme Atelier",
    description:
      "A structured single-piece silhouette with a fitted waist and wide, fluid leg. Reads tailored front-of-house, easy underneath.",
    materialSummary: "97% Cotton, 3% Elastane",
    careInstructions: "Machine wash cold. Hang to dry.",
    colors: [
      { name: "Black", hex: "#141311" },
      { name: "Terracotta", hex: "#B4623E" },
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    name: "Cropped Wool Blazer",
    gender: "WOMEN",
    categorySlug: "jackets",
    archetype: "jacket",
    fit: "SLIM",
    basePrice: 720,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "A cropped, sharply tailored blazer in fine wool twill with structured shoulders and a nipped waist.",
    materialSummary: "100% Wool",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Charcoal", hex: "#3A3A3C" },
      { name: "Ivory", hex: "#F1EADC" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    name: "Belted Wool Coat",
    gender: "WOMEN",
    categorySlug: "coats",
    archetype: "coat",
    fit: "REGULAR",
    basePrice: 1180,
    fabric: "Wool",
    brand: "Forme Atelier",
    description:
      "A substantial wool coat with a self-belt at the waist. Full-length with a soft, weighted drape through the skirt.",
    materialSummary: "85% Wool, 15% Cashmere",
    careInstructions: "Dry clean only.",
    colors: [
      { name: "Camel", hex: "#B08D57" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    name: "Ribbed Knit Top",
    gender: "WOMEN",
    categorySlug: "tops",
    archetype: "tshirt",
    fit: "SLIM",
    basePrice: 280,
    fabric: "Cotton",
    brand: "Forme Atelier",
    description:
      "Fine rib-knit cotton with natural stretch and recovery. Fitted through the body with a soft, second-skin hand feel.",
    materialSummary: "95% Cotton, 5% Elastane",
    careInstructions: "Machine wash cold. Lay flat to dry.",
    colors: [
      { name: "White", hex: "#F5F3EE" },
      { name: "Sage", hex: "#9CAF88" },
      { name: "Black", hex: "#141311" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    name: "Performance Wrap Leggings",
    gender: "WOMEN",
    categorySlug: "activewear",
    archetype: "trousers",
    fit: "SLIM",
    basePrice: 320,
    fabric: "Cotton",
    brand: "Forme Sport",
    description:
      "Four-way stretch performance fabric with a wrap-effect waistband. Engineered for full range of motion.",
    materialSummary: "78% Nylon, 22% Elastane",
    careInstructions: "Machine wash cold. Do not tumble dry.",
    colors: [
      { name: "Black", hex: "#141311" },
      { name: "Deep Plum", hex: "#4B2E43" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
];
