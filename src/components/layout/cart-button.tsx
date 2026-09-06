"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart-actions";

interface CartLineItem {
  id: string;
  productName: string;
  productSlug: string;
  color: string;
  size: string;
  quantity: number;
  variantId: string;
}

interface CartButtonProps {
  itemCount: number;
  items: CartLineItem[];
}

export function CartButton({ itemCount, items }: CartButtonProps) {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center text-foreground/80 transition-colors hover:text-foreground"
        aria-label="Open cart"
      >
        <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
        {itemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-lg uppercase tracking-editorial">
            Your Bag ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm text-muted-foreground">Your bag is empty.</p>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              render={<Link href="/men" />}
            >
              Continue browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <div className="h-24 w-20 shrink-0 bg-muted" />
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.productSlug}`}
                          onClick={() => setOpen(false)}
                          className="text-sm font-medium hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          aria-label="Remove item"
                          disabled={isPending}
                          onClick={() => handleRemove(item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.color} / {item.size}
                      </p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center border border-border"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center border border-border"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <SheetFooter>
              <Button
                size="lg"
                className="w-full uppercase tracking-editorial"
                render={<Link href="/checkout" onClick={() => setOpen(false)} />}
              >
                Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setOpen(false)}
                render={<Link href="/cart" />}
              >
                View bag
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
