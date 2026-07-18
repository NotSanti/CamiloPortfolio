import Image from "next/image";
import type { AboutContent } from "@/data/about";
import { RichText } from "@/src/components/about/rich-text";
import { LiquidPillLink } from "@/src/components/ui/liquid-pill-link";

type AboutPageViewProps = {
  content: AboutContent;
};

export function AboutPageView({ content }: AboutPageViewProps) {
  return (
    <div className="fixed inset-0 z-0 bg-background">
      <div className="flex size-full flex-col gap-10 px-8 pb-8 pt-6 lg:grid lg:grid-cols-[minmax(220px,386px)_minmax(0,1fr)] lg:gap-16">
        <div className="flex min-h-0 flex-col lg:h-full">
          <h1 className="shrink-0 text-[clamp(3rem,8vw,96px)] font-bold uppercase leading-none text-accent">
            <span className="block">Camilo</span>
            <span className="block">Luna</span>
          </h1>

          <div className="relative mt-auto aspect-[386/699] w-full max-w-[386px] shrink-0 overflow-hidden bg-media-placeholder">
            <Image
              src={content.portraitSrc}
              alt={content.portraitAlt}
              fill
              className="object-cover object-top"
              sizes="386px"
              priority
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-10 lg:h-full lg:pt-[115px]">
          <div className="relative max-w-[679px] shrink-0 px-8 py-10">
            <Image
              src="/icons/corner-tl.svg"
              alt=""
              width={56}
              height={44}
              className="pointer-events-none absolute left-0 top-0"
            />
            <Image
              src="/icons/corner-br.svg"
              alt=""
              width={56}
              height={44}
              className="pointer-events-none absolute bottom-0 right-0 rotate-180"
            />
            <RichText
              segments={content.contactQuote}
              className="text-xl font-medium leading-normal text-foreground md:text-2xl"
            />
          </div>

          <div className="flex max-w-[679px] shrink-0 flex-col gap-6">
            <LiquidPillLink
              href={content.contactInstagramUrl}
              label={content.contactInstagramLabel}
              external
            />
            <LiquidPillLink
              href={`mailto:${content.contactEmail}`}
              label="Email"
              className="max-w-[447px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
