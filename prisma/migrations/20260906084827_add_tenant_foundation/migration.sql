-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('TENANT_ADMIN', 'CONTENT_MANAGER', 'THREE_D_ARTIST', 'PRODUCT_MANAGER', 'CUSTOMER_SUPPORT', 'ANALYST', 'CUSTOMER');

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "fabric_materials" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "garment_animations" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "garment_assets" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "garment_sizes" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "mannequins" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "product_colors" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "product_media" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "shipping_zones" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "simulation_assets" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "simulation_variants" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "three_d_view_events" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "wishlist_items" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "wishlists" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_host_key" ON "tenant_domains"("host");

-- CreateIndex
CREATE INDEX "tenant_domains_tenantId_idx" ON "tenant_domains"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_memberships_userId_idx" ON "tenant_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_tenantId_userId_key" ON "tenant_memberships"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "addresses_tenantId_idx" ON "addresses"("tenantId");

-- CreateIndex
CREATE INDEX "analytics_events_tenantId_idx" ON "analytics_events"("tenantId");

-- CreateIndex
CREATE INDEX "brands_tenantId_idx" ON "brands"("tenantId");

-- CreateIndex
CREATE INDEX "cart_items_tenantId_idx" ON "cart_items"("tenantId");

-- CreateIndex
CREATE INDEX "carts_tenantId_idx" ON "carts"("tenantId");

-- CreateIndex
CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");

-- CreateIndex
CREATE INDEX "collections_tenantId_idx" ON "collections"("tenantId");

-- CreateIndex
CREATE INDEX "coupons_tenantId_idx" ON "coupons"("tenantId");

-- CreateIndex
CREATE INDEX "fabric_materials_tenantId_idx" ON "fabric_materials"("tenantId");

-- CreateIndex
CREATE INDEX "garment_animations_tenantId_idx" ON "garment_animations"("tenantId");

-- CreateIndex
CREATE INDEX "garment_assets_tenantId_idx" ON "garment_assets"("tenantId");

-- CreateIndex
CREATE INDEX "garment_sizes_tenantId_idx" ON "garment_sizes"("tenantId");

-- CreateIndex
CREATE INDEX "mannequins_tenantId_idx" ON "mannequins"("tenantId");

-- CreateIndex
CREATE INDEX "order_items_tenantId_idx" ON "order_items"("tenantId");

-- CreateIndex
CREATE INDEX "orders_tenantId_idx" ON "orders"("tenantId");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "product_colors_tenantId_idx" ON "product_colors"("tenantId");

-- CreateIndex
CREATE INDEX "product_media_tenantId_idx" ON "product_media"("tenantId");

-- CreateIndex
CREATE INDEX "product_variants_tenantId_idx" ON "product_variants"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "reviews_tenantId_idx" ON "reviews"("tenantId");

-- CreateIndex
CREATE INDEX "shipping_zones_tenantId_idx" ON "shipping_zones"("tenantId");

-- CreateIndex
CREATE INDEX "simulation_assets_tenantId_idx" ON "simulation_assets"("tenantId");

-- CreateIndex
CREATE INDEX "simulation_variants_tenantId_idx" ON "simulation_variants"("tenantId");

-- CreateIndex
CREATE INDEX "three_d_view_events_tenantId_idx" ON "three_d_view_events"("tenantId");

-- CreateIndex
CREATE INDEX "wishlist_items_tenantId_idx" ON "wishlist_items"("tenantId");

-- CreateIndex
CREATE INDEX "wishlists_tenantId_idx" ON "wishlists"("tenantId");

-- AddForeignKey
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
