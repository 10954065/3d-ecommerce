interface ContentPageProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

export function ContentPage({ eyebrow, title, children }: ContentPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl">{title}</h1>
      <div className="prose-content mt-8 flex flex-col gap-5 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  );
}
