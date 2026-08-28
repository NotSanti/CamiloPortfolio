import Image from "next/image";
import type { AboutContent } from "@/data/about";
import { CreditsScroll } from "@/src/components/about/credits-scroll";

type AboutPageViewProps = {
  content: AboutContent;
};

export function AboutPageView({ content }: AboutPageViewProps) {
  return (
    <div
      data-about-shell
      className="fixed inset-0 z-0 overflow-hidden bg-background"
    >
      <h1 className="sr-only">About Camilo Luna</h1>

      <nav
        data-about-contact
        aria-label="Contact"
        className="absolute left-[15px] top-5 z-30 flex flex-col items-start gap-1 text-lg font-bold leading-snug text-accent md:text-xl md:leading-snug lg:left-[23px] lg:top-4 lg:gap-0.5 lg:text-2xl lg:leading-snug"
      >
        <p className="uppercase">Contact</p>
        <a
          href={`mailto:${content.contactEmail}`}
          className="font-medium uppercase transition-opacity hover:opacity-70"
        >
          Email
        </a>
        <a
          href={content.contactInstagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium uppercase transition-opacity hover:opacity-70"
        >
          {content.contactInstagramLabel}
        </a>
        <a
          href={content.contactLinkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium uppercase transition-opacity hover:opacity-70"
        >
          {content.contactLinkedInLabel}
        </a>
      </nav>

      <div className="about-credits-clip absolute inset-0 z-10">
        <CreditsScroll
          paragraphs={content.bioParagraphs}
          endLabel={content.creditsEnd}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[15] hidden bg-background max-lg:block"
        style={{ height: "var(--about-credits-clip-top, 8rem)" }}
        aria-hidden
      />

      <figure
        data-about-portrait
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-28 -translate-x-1/2 -translate-y-1/2 bg-background p-1 shadow-md md:w-36 lg:w-40"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-media-placeholder">
          <Image
            src={content.portraitSrc}
            alt={content.portraitAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 112px, 160px"
            quality={90}
            priority
          />
        </div>
      </figure>
    </div>
  );
}
