import "dotenv/config";
import { PrismaClient, type SizeLabel, type Gender } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { FABRIC_PRESETS } from "./seed-data/fabrics";
import { MEN_MEASUREMENTS, WOMEN_MEASUREMENTS } from "./seed-data/mannequins";
import { MEN_PRODUCTS, WOMEN_PRODUCTS, type SeedProduct } from "./seed-data/products";
import { placeholderProductImage } from "./seed-data/placeholder";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ANIMATION_CLIPS: { clip: "IDLE" | "TURN_360" | "WALK" | "ARM_RAISE" | "WEIGHT_SHIFT" | "FABRIC_TEST"; durationMs: number }[] = [
  { clip: "IDLE", durationMs: 4000 },
  { clip: "TURN_360", durationMs: 6000 },
  { clip: "WALK", durationMs: 5000 },
  { clip: "ARM_RAISE", durationMs: 3000 },
  { clip: "WEIGHT_SHIFT", durationMs: 3500 },
  { clip: "FABRIC_TEST", durationMs: 4500 },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedFabrics() {
  const map = new Map<string, string>();
  for (const preset of FABRIC_PRESETS) {
    const fabric = await prisma.fabricMaterial.upsert({
      where: { name: preset.name },
      update: preset,
      create: preset,
    });
    map.set(preset.name, fabric.id);
  }
  console.log(`Seeded ${map.size} fabric materials`);
  return map;
}

async function seedMannequins() {
  const map = new Map<string, string>();
  for (const [gender, measurements] of [
    ["MEN", MEN_MEASUREMENTS],
    ["WOMEN", WOMEN_MEASUREMENTS],
  ] as const) {
    for (const m of measurements) {
      const mannequin = await prisma.mannequin.upsert({
        where: {
          gender_size_bodyType: { gender, size: m.size, bodyType: "standard" },
        },
        update: {
          heightCm: m.heightCm,
          chestCm: m.chestCm,
          waistCm: m.waistCm,
          hipsCm: m.hipsCm,
          shoulderWidthCm: m.shoulderWidthCm,
          armLengthCm: m.armLengthCm,
          inseamCm: m.inseamCm,
          neckCm: m.neckCm,
          thighCm: m.thighCm,
        },
        create: {
          gender,
          size: m.size,
          bodyType: "standard",
          heightCm: m.heightCm,
          chestCm: m.chestCm,
          waistCm: m.waistCm,
          hipsCm: m.hipsCm,
          shoulderWidthCm: m.shoulderWidthCm,
          armLengthCm: m.armLengthCm,
          inseamCm: m.inseamCm,
          neckCm: m.neckCm,
          thighCm: m.thighCm,
          morphTargetKey: m.size,
        },
      });
      map.set(`${gender}:${m.size}`, mannequin.id);
    }
  }
  console.log(`Seeded ${map.size} mannequins`);
  return map;
}

async function seedBrands() {
  const names = ["Forme Atelier", "Forme Sport"];
  const map = new Map<string, string>();
  for (const name of names) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    map.set(name, brand.id);
  }
  console.log(`Seeded ${map.size} brands`);
  return map;
}

async function seedCategories(products: SeedProduct[]) {
  const map = new Map<string, string>();
  const seen = new Set<string>();
  for (const product of products) {
    const key = `${product.gender}:${product.categorySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const slug = `${product.gender.toLowerCase()}-${product.categorySlug}`;
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: titleCase(product.categorySlug),
        slug,
        gender: product.gender as Gender,
      },
    });
    map.set(key, category.id);
  }
  console.log(`Seeded ${map.size} categories`);
  return map;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function seedCollections() {
  const collections = [
    { name: "New Arrivals", slug: "new-arrivals", isFeatured: true },
    { name: "The Essentials", slug: "the-essentials", isFeatured: true },
  ];
  const map = new Map<string, string>();
  for (const c of collections) {
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    map.set(c.slug, collection.id);
  }
  console.log(`Seeded ${map.size} collections`);
  return map;
}

async function seedProduct(
  product: SeedProduct,
  index: number,
  fabricMap: Map<string, string>,
  categoryMap: Map<string, string>,
  brandMap: Map<string, string>,
  mannequinMap: Map<string, string>,
  collectionId: string,
) {
  const slug = slugify(`${product.name}-${product.gender}`);
  const sku = `FRM-${product.gender.slice(0, 2)}-${String(index + 1).padStart(3, "0")}`;
  const categoryId = categoryMap.get(`${product.gender}:${product.categorySlug}`)!;
  const brandId = brandMap.get(product.brand)!;
  const fabricMaterialId = fabricMap.get(product.fabric)!;

  const created = await prisma.product.upsert({
    where: { slug },
    update: {},
    create: {
      brandId,
      categoryId,
      name: product.name,
      slug,
      description: product.description,
      gender: product.gender,
      fit: product.fit,
      basePrice: product.basePrice,
      currency: "GHS",
      sku,
      materialSummary: product.materialSummary,
      careInstructions: product.careInstructions,
      status: "PUBLISHED",
      publish3D: true,
      collections: { connect: [{ id: collectionId }] },
    },
  });

  let mediaSortOrder = 0;
  for (const color of product.colors) {
    const productColor = await prisma.productColor.upsert({
      where: { productId_name: { productId: created.id, name: color.name } },
      update: { hexCode: color.hex },
      create: {
        productId: created.id,
        name: color.name,
        hexCode: color.hex,
        swatchUrl: null,
      },
    });

    await prisma.productMedia.create({
      data: {
        productId: created.id,
        type: "IMAGE",
        url: placeholderProductImage({
          hex: color.hex,
          productName: product.name,
          colorName: color.name,
        }),
        altText: `${product.name} in ${color.name}`,
        sortOrder: mediaSortOrder++,
        colorId: productColor.id,
      },
    });

    for (const size of product.sizes) {
      const variantSku = `${sku}-${slugify(color.name)}-${size}`;
      const stockQuantity = 8 + Math.floor(Math.random() * 32);
      await prisma.productVariant.upsert({
        where: { sku: variantSku },
        update: { stockQuantity },
        create: {
          productId: created.id,
          colorId: productColor.id,
          size: size as SizeLabel,
          sku: variantSku,
          stockQuantity,
        },
      });
    }
  }

  const garmentAsset = await prisma.garmentAsset.upsert({
    where: { productId: created.id },
    update: { fabricMaterialId },
    create: {
      productId: created.id,
      fabricMaterialId,
      baseModelUrl: `procedural:${product.archetype}`,
      simulationQuality: "PERFORMANCE",
      status: "READY",
    },
  });

  for (const size of product.sizes) {
    const mannequinId = mannequinMap.get(`${product.gender}:${size}`);
    if (!mannequinId) continue;
    await prisma.garmentSize.upsert({
      where: {
        garmentAssetId_mannequinId: { garmentAssetId: garmentAsset.id, mannequinId },
      },
      update: {},
      create: {
        garmentAssetId: garmentAsset.id,
        mannequinId,
        morphTargetKey: size,
      },
    });
  }

  for (const clip of ANIMATION_CLIPS) {
    await prisma.garmentAnimation.upsert({
      where: { garmentAssetId_clip: { garmentAssetId: garmentAsset.id, clip: clip.clip } },
      update: {},
      create: {
        garmentAssetId: garmentAsset.id,
        clip: clip.clip,
        durationMs: clip.durationMs,
      },
    });
  }

  return created;
}

async function seedShippingZones() {
  await prisma.shippingZone.upsert({
    where: { id: "ghana-domestic" },
    update: {},
    create: {
      id: "ghana-domestic",
      name: "Ghana (Domestic)",
      countries: ["GH"],
      flatRate: 30,
      currency: "GHS",
    },
  });
  await prisma.shippingZone.upsert({
    where: { id: "international" },
    update: {},
    create: {
      id: "international",
      name: "International",
      countries: ["US", "GB", "NG", "CA", "FR", "DE"],
      flatRate: 250,
      currency: "GHS",
    },
  });
  console.log("Seeded shipping zones");
}

async function seedUsers() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const customerPassword = await bcrypt.hash("Customer123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@forme.test" },
    update: {},
    create: {
      email: "admin@forme.test",
      name: "Forme Admin",
      role: "ADMIN",
      passwordHash: adminPassword,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@forme.test" },
    update: {},
    create: {
      email: "customer@forme.test",
      name: "Demo Customer",
      role: "CUSTOMER",
      passwordHash: customerPassword,
    },
  });

  await prisma.address.upsert({
    where: { id: "demo-customer-address" },
    update: {},
    create: {
      id: "demo-customer-address",
      userId: customer.id,
      label: "Home",
      fullName: "Demo Customer",
      phone: "+233 20 000 0000",
      line1: "12 Independence Ave",
      city: "Accra",
      country: "GH",
      isDefault: true,
    },
  });

  console.log(`Seeded users: ${admin.email} (ADMIN), ${customer.email} (CUSTOMER)`);
  console.log("Demo credentials — admin@forme.test / Admin123!, customer@forme.test / Customer123!");
}

async function main() {
  const fabricMap = await seedFabrics();
  const mannequinMap = await seedMannequins();
  const brandMap = await seedBrands();
  const allProducts = [...MEN_PRODUCTS, ...WOMEN_PRODUCTS];
  const categoryMap = await seedCategories(allProducts);
  const collectionMap = await seedCollections();
  await seedShippingZones();
  await seedUsers();

  let count = 0;
  for (const product of allProducts) {
    const collectionSlug = count % 5 === 0 ? "new-arrivals" : "the-essentials";
    await seedProduct(
      product,
      count,
      fabricMap,
      categoryMap,
      brandMap,
      mannequinMap,
      collectionMap.get(collectionSlug)!,
    );
    count++;
  }
  console.log(`Seeded ${count} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
