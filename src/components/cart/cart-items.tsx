"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart-actions";

export interface CartPageLineItem {
  id: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  imageAlt: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockQuantity: number;
}

interface CartItemsProps {
  items: CartPageLineItem[];
  currency: string;
}

export function CartItems({ items, currency }: CartItemsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleQuantityChange(itemId: string, quantity: number) {
    startTransition(async () => {
      await updateCartItemAction(itemId, quantity);
      router.refresh();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeCartItemAction(itemId);
      router.refresh();
    });
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li key={item.id} className="flex gap-5 py-6">
          <Link
            href={`/products/${item.productSlug}`}
            className="h-32 w-24 shrink-0 bg-muted sm:h-40 sm:w-30"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.imageAlt}
                className="h-full w-full object-cover"
              />
            ) : null}
          </Link>

          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 text-xs uppercase tracking-editorial text-muted-foreground">
                  {item.colorName} / {item.size}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove item"
                disabled={isPending}
                onClick={() => handleRemove(item.id)}
                className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-auto flex items-end justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || item.quantity <= 1}
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center border border-border disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  disabled={isPending || item.quantity >= item.stockQuantity}
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center border border-border disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatMoney(item.lineTotal, currency)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(item.unitPrice, currency)} each
                  </p>
                )}
              </div>
            </div>
            {item.quantity >= item.stockQuantity && (
              <p className="mt-1 text-xs text-destructive">
                Only {item.stockQuantity} left in stock.
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
