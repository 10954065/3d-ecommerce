import Link from "next/link";
import { getCartSummary } from "@/lib/cart";
import { auth } from "@/auth";
import { CartButton } from "./cart-button";
import { MobileNav } from "./mobile-nav";
import { User2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/collections", label: "Collections" },
  { href: "/studio", label: "3D Studio" },
];

export async function SiteHeader() {
  const [{ cart, itemCount }, session] = await Promise.all([
    getCartSummary(),
    auth(),
  ]);

  const cartItems = cart.items.map((item) => ({
    id: item.id,
    productName: item.product.name,
    productSlug: item.product.slug,
    color: item.productVariant.color.name,
    size: item.productVariant.size,
    quantity: item.quantity,
    variantId: item.productVariantId,
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-blur:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <MobileNav links={NAV_LINKS} />
          <Link
            href="/"
            className="font-display text-xl tracking-editorial uppercase"
          >
            Forme
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-editorial text-foreground/80 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href={session ? "/account" : "/sign-in"}
            className="inline-flex h-9 w-9 items-center justify-center text-foreground/80 transition-colors hover:text-foreground"
            aria-label={session ? "Your account" : "Sign in"}
          >
            <User2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <CartButton itemCount={itemCount} items={cartItems} />
        </div>
      </div>
    </header>
  );
}
