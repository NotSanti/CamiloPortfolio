import Image from "next/image";
import type { AboutContent } from "@/data/about";

type AboutPageViewProps = {
  content: AboutContent;
};

export function AboutPageView({ content }: AboutPageViewProps) {
  const sloganLines = Array.from({ length: content.sloganRepeat }, (_, index) => index);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Bio — tighter type, closer to the top edge */}
      <p className="absolute left-8 top-3 max-w-[min(960px,calc(100%-11rem))] text-sm font-bold leading-relaxed text-accent md:top-4 md:text-base md:leading-7 lg:left-8 lg:top-4 lg:max-w-[min(980px,calc(100%-14rem))] lg:text-lg lg:leading-8">
        {content.bio}
      </p>

      {/* Contact — Figma Contact 39:29 */}
      <div className="absolute right-[15px] top-5 z-10 flex flex-col items-end gap-1 text-right text-sm font-bold leading-relaxed text-accent md:right-6 md:text-base md:leading-7 lg:right-[59px] lg:top-4 lg:gap-0 lg:text-lg lg:leading-8">
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
      </div>

      {/* Middle slogan stack — centered in the viewport */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden w-max -translate-x-1/2 -translate-y-1/2 md:block"
        aria-hidden
      >
        {sloganLines.map((index) => (
          <p
            key={index}
            className="whitespace-nowrap text-lg font-bold uppercase leading-[44px] text-accent lg:text-2xl"
            style={{ marginTop: index === 0 ? 0 : -27 }}
          >
            {content.slogan}
          </p>
        ))}
      </div>

      {/* Side photo — Figma SidePhoto 19:21 */}
      <div className="absolute bottom-24 left-8 aspect-[465/268] w-[min(465px,42vw)] overflow-hidden bg-media-placeholder md:bottom-20 lg:bottom-[48px] lg:left-8">
        <Image
          src={content.portraitSrc}
          alt={content.portraitAlt}
          fill
          className="object-cover"
          sizes="465px"
          priority
        />
      </div>

      {/* ABOUT wordmark — Figma ABOUT 19:23 */}
      <p className="pointer-events-none absolute bottom-4 right-[15px] text-4xl font-bold uppercase leading-none text-accent md:bottom-6 md:right-6 md:text-6xl lg:bottom-0 lg:right-[26px] lg:text-[128px]">
        About
      </p>
    </div>
  );
}
