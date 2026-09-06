import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { auth } from "@/auth";

const GUEST_CART_COOKIE = "onion3d_guest_cart";

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          currency: true,
          basePrice: true,
          media: {
            where: { type: "IMAGE" as const },
            orderBy: { sortOrder: "asc" as const },
            take: 1,
            select: { url: true, altText: true },
          },
        },
      },
      productVariant: {
        include: { color: true },
      },
    },
    orderBy: { addedAt: "asc" as const },
  },
};

export type CartWithItems = NonNullable<
  Awaited<ReturnType<typeof getOrCreateCart>>
>;

/**
 * Resolves (creating if necessary) the current visitor's cart — by user id
 * when signed in, else by a guest cookie. Wrapped in React's `cache()` so a
 * single request (e.g. the layout's header plus the page itself both asking
 * for the cart) shares one in-flight resolution instead of racing to create
 * two carts — without a cookie present yet, two concurrent, uncached calls
 * would otherwise generate two different fallback guest ids and both try to
 * create a cart in the same request.
 */
export const getOrCreateCart = cache(async function getOrCreateCart() {
  const [session, cookieStore, db, tenantId] = await Promise.all([
    auth(),
    cookies(),
    getTenantDb(),
    getTenantId(),
  ]);

  if (session?.user?.id) {
    const userId = session.user.id;
    const existing = await db.cart.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: cartInclude,
    });
    if (existing) return existing;

    // A guest cart from before sign-in gets adopted rather than discarded.
    const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;
    if (guestId) {
      const guestCart = await db.cart.findUnique({ where: { tenantId_guestId: { tenantId, guestId } } });
      if (guestCart) {
        return db.cart.update({
          where: { id: guestCart.id },
          data: { userId, guestId: null },
          include: cartInclude,
        });
      }
    }

    return db.cart.create({
      data: { tenantId, userId },
      include: cartInclude,
    });
  }

  // proxy.ts assigns this cookie on every request, so it should always be
  // present by the time a Server Component runs. Server Component rendering
  // cannot itself set cookies, so we fall back to a per-request random id
  // (not persisted) in the rare case it is missing — e.g. a direct request
  // that bypassed the proxy matcher.
  const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value ?? randomUUID();

  const existing = await db.cart.findUnique({
    where: { tenantId_guestId: { tenantId, guestId } },
    include: cartInclude,
  });
  if (existing) return existing;

  return db.cart.create({
    data: { tenantId, guestId },
    include: cartInclude,
  });
});

export async function getCartSummary() {
  const cart = await getOrCreateCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return { cart, itemCount };
}

/** Server-side price resolution — never trust a client-submitted price. */
export async function addToCart(productVariantId: string, quantity: number) {
  const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
  const variant = await db.productVariant.findUnique({
    where: { id: productVariantId },
    select: { productId: true, stockQuantity: true, isActive: true },
  });
  if (!variant || !variant.isActive) {
    throw new Error("This variant is not available.");
  }

  const cart = await getOrCreateCart();
  const existing = cart.items.find(
    (item) => item.productVariantId === productVariantId,
  );
  const nextQuantity = Math.min(
    (existing?.quantity ?? 0) + quantity,
    variant.stockQuantity,
  );

  if (nextQuantity <= 0) {
    throw new Error("This item is out of stock.");
  }

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        tenantId,
        cartId: cart.id,
        productId: variant.productId,
        productVariantId,
        quantity: nextQuantity,
      },
    });
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const db = await getTenantDb();
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
    return;
  }
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { productVariant: { select: { stockQuantity: true } } },
  });
  if (!item) return;
  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity: Math.min(quantity, item.productVariant.stockQuantity) },
  });
}

export async function removeCartItem(itemId: string) {
  const db = await getTenantDb();
  await db.cartItem.delete({ where: { id: itemId } });
}
