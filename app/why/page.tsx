import type { Metadata } from "next";
import { aboutContent } from "@/data/about";
import { WhyPageView } from "@/src/components/why/why-page-view";

export const metadata: Metadata = {
  title: "Why · Caloid",
  description: aboutContent.slogan,
};

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
