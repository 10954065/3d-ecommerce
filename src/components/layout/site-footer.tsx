import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/men", label: "Men" },
      { href: "/women", label: "Women" },
      { href: "/collections", label: "Collections" },
      { href: "/studio", label: "3D Studio" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/careers", label: "Careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/shipping", label: "Shipping & Returns" },
      { href: "/size-guide", label: "Size Guide" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-bone">
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-xl uppercase tracking-editorial">
              Forme
            </p>
            <p className="mt-4 max-w-[24ch] text-sm text-bone/60">
              See it. Feel it. Wear it. Fashion in motion.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs uppercase tracking-editorial text-bone/50">
                {column.title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-bone/80 transition-colors hover:text-bone"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-bone/10 pt-8 text-xs text-bone/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Forme. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-bone">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-bone">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
