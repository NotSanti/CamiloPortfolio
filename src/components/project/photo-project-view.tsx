import Image from "next/image";
import type { MediaItem } from "@/types/projects";
import { PhotoSmoothScroll } from "@/src/components/project/photo-smooth-scroll";

type PhotoProjectViewProps = {
  title: string;
  category: string;
  year: number;
  summary: string;
  media: MediaItem[];
};

function categoryLines(category: string): string[] {
  const words = category.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 ? words : [category];
}

function bandHeadline(photo: MediaItem, summary: string, title: string): string {
  const caption = photo.caption?.trim();
  if (caption) {
    return caption;
  }

  const summaryText = summary.trim();
  if (summaryText) {
    return summaryText;
  }

  return title;
}

function MagazineBand({
  category,
  headline,
  year,
  indexLabel,
}: {
  category: string;
  headline: string;
  year: number;
  indexLabel: string;
}) {
  const lines = categoryLines(category);
  const trailing = year > 0 ? String(year) : indexLabel;

  return (
    <div className="flex items-center justify-between gap-4 bg-background py-[var(--space-4)] text-accent md:gap-8 md:py-[var(--space-5)] lg:pr-[var(--nav-rail)]">
      <p className="w-16 shrink-0 text-left text-[0.625rem] font-medium uppercase leading-tight tracking-[0.08em] md:w-24 md:text-xs">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className="line-clamp-2 min-w-0 flex-1 text-center text-[0.625rem] font-bold uppercase leading-snug tracking-[0.08em] md:text-xs lg:text-sm">
        {headline}
      </p>
      <p className="w-16 shrink-0 text-right text-[0.625rem] font-medium uppercase leading-tight tracking-[0.08em] md:w-24 md:text-xs">
        {trailing}
      </p>
    </div>
  );
}

export function PhotoProjectView({
  title,
  category,
  year,
  summary,
  media,
}: PhotoProjectViewProps) {
  const photos = media.filter((item) => item.type === "image");

  if (photos.length === 0) {
    return null;
  }

  return (
    <PhotoSmoothScroll>
      <article className="overflow-x-clip bg-background px-[15px] py-[15px] lg:px-[23px] lg:py-[23px]">
        <div className="relative">
          <h1 className="sr-only">{title}</h1>
          <p
            aria-hidden
            className="photo-project-title pointer-events-none absolute right-[-15px] z-10 top-[calc(100dvh-15px)] hidden translate-y-[calc(-100%+0.25rem)] whitespace-nowrap font-bold uppercase leading-none text-accent lg:block lg:right-[-21px] lg:top-[calc(100dvh-23px)] lg:translate-y-[calc(-100%+1rem)]"
          >
            {title}
          </p>
          {photos.map((photo, photoIndex) => {
            const showBand = photoIndex === 0 && photos.length > 1;
            const indexLabel = String(photoIndex + 1).padStart(2, "0");

            return (
              <figure
                key={photo.id}
                className={`m-0 ${photoIndex >= 2 ? "mt-[15px] lg:mt-[23px]" : ""}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt || title}
                  width={photo.width}
                  height={photo.height}
                  sizes="100vw"
                  quality={90}
                  priority={photoIndex === 0}
                  className="h-auto w-full"
                />
                {showBand ? (
                  <figcaption>
                    <MagazineBand
                      category={category}
                      headline={bandHeadline(photo, summary, title)}
                      year={year}
                      indexLabel={indexLabel}
                    />
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </article>
    </PhotoSmoothScroll>
  );
}
