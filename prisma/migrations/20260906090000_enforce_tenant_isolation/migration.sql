-- DropIndex
DROP INDEX "analytics_events_tenantId_idx";

-- DropIndex
DROP INDEX "brands_name_key";

-- DropIndex
DROP INDEX "brands_slug_key";

-- DropIndex
DROP INDEX "brands_tenantId_idx";

-- DropIndex
DROP INDEX "cart_items_tenantId_idx";

-- DropIndex
DROP INDEX "carts_guestId_key";

-- DropIndex
DROP INDEX "carts_tenantId_idx";

-- DropIndex
DROP INDEX "carts_userId_key";

-- DropIndex
DROP INDEX "categories_slug_key";

-- DropIndex
DROP INDEX "categories_tenantId_idx";

-- DropIndex
DROP INDEX "collections_slug_key";

-- DropIndex
DROP INDEX "collections_tenantId_idx";

-- DropIndex
DROP INDEX "coupons_code_key";

-- DropIndex
DROP INDEX "coupons_tenantId_idx";

-- DropIndex
DROP INDEX "fabric_materials_name_key";

-- DropIndex
DROP INDEX "fabric_materials_tenantId_idx";

-- DropIndex
DROP INDEX "garment_animations_tenantId_idx";

-- DropIndex
DROP INDEX "garment_sizes_tenantId_idx";

-- DropIndex
DROP INDEX "mannequins_gender_size_bodyType_key";

-- DropIndex
DROP INDEX "mannequins_tenantId_idx";

-- DropIndex
DROP INDEX "orders_orderNumber_key";

-- DropIndex
DROP INDEX "orders_tenantId_idx";

-- DropIndex
DROP INDEX "product_variants_sku_key";

-- DropIndex
DROP INDEX "product_variants_tenantId_idx";

-- DropIndex
DROP INDEX "products_gender_categoryId_status_idx";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "products_slug_key";

-- DropIndex
DROP INDEX "products_tenantId_idx";

-- DropIndex
DROP INDEX "reviews_tenantId_idx";

-- DropIndex
DROP INDEX "simulation_variants_tenantId_idx";

-- DropIndex
DROP INDEX "three_d_view_events_tenantId_idx";

-- DropIndex
DROP INDEX "wishlist_items_tenantId_idx";

-- DropIndex
DROP INDEX "wishlists_tenantId_idx";

-- DropIndex
DROP INDEX "wishlists_userId_key";

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "analytics_events" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "carts" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "collections" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "fabric_materials" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "garment_animations" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "garment_assets" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "garment_sizes" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "mannequins" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_colors" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_media" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_variants" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "shipping_zones" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "simulation_assets" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "simulation_variants" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "three_d_view_events" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "wishlist_items" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "wishlists" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "analytics_events_tenantId_type_createdAt_idx" ON "analytics_events"("tenantId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "brands_tenantId_name_key" ON "brands"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_tenantId_slug_key" ON "brands"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "carts_tenantId_userId_key" ON "carts"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_tenantId_guestId_key" ON "carts"("tenantId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_slug_key" ON "categories"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "collections_tenantId_slug_key" ON "collections"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_tenantId_code_key" ON "coupons"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_materials_tenantId_name_key" ON "fabric_materials"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "mannequins_tenantId_gender_size_bodyType_key" ON "mannequins"("tenantId", "gender", "size", "bodyType");

-- CreateIndex
CREATE INDEX "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenantId_orderNumber_key" ON "orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_tenantId_sku_key" ON "product_variants"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "products_tenantId_status_gender_categoryId_idx" ON "products"("tenantId", "status", "gender", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_slug_key" ON "products"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "three_d_view_events_tenantId_productId_createdAt_idx" ON "three_d_view_events"("tenantId", "productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_tenantId_userId_key" ON "wishlists"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mannequins" ADD CONSTRAINT "mannequins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_materials" ADD CONSTRAINT "fabric_materials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_assets" ADD CONSTRAINT "garment_assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_sizes" ADD CONSTRAINT "garment_sizes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_animations" ADD CONSTRAINT "garment_animations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_assets" ADD CONSTRAINT "simulation_assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_variants" ADD CONSTRAINT "simulation_variants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "three_d_view_events" ADD CONSTRAINT "three_d_view_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

