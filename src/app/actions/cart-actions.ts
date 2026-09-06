"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as cartLib from "@/lib/cart";
import { logAnalyticsEvent } from "@/lib/analytics";

const addToCartSchema = z.object({
  productVariantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export async function addToCartAction(input: z.infer<typeof addToCartSchema>) {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid item." };
  }

  try {
    await cartLib.addToCart(parsed.data.productVariantId, parsed.data.quantity);
    await logAnalyticsEvent({ type: "ADD_TO_CART" });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not add item to cart.",
    };
  }
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  await cartLib.updateCartItemQuantity(itemId, quantity);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeCartItemAction(itemId: string) {
  await cartLib.removeCartItem(itemId);
  revalidatePath("/", "layout");
  return { success: true };
}
