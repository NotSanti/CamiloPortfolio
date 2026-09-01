import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import { WhyPageView } from "@/src/components/why/why-page-view";
import { buildPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Why",
  description: aboutContent.slogan,
  path: "/why",
});

export default function WhyPage() {
  return (
    <main className="flex-1">
      <WhyPageView
        text={aboutContent.slogan}
        repeat={aboutContent.sloganRepeat}
      />
    </main>
  );
}
