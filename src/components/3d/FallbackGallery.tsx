interface FallbackGalleryProps {
  images: { url: string; alt: string }[];
  reason: string;
}

/** Section 24: the store must stay fully usable when the 3D viewer cannot run. */
export function FallbackGallery({ images, reason }: FallbackGalleryProps) {
  const [primary, ...rest] = images;

  return (
    <div className="w-full">
      <div className="aspect-4/5 w-full overflow-hidden bg-muted sm:aspect-3/4">
        {primary && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt={primary.alt} className="h-full w-full object-cover" />
        )}
      </div>
      {rest.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {rest.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.url} src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">{reason}</p>
    </div>
  );
}
