import Link from "next/link";
import { AboutPortraitManager } from "@/src/components/admin/about-portrait-manager";
import { aboutContent } from "@/data/about";
import { getAdminSiteSettings } from "@/src/services/site/admin";

export const metadata = {
  title: "About · Caloid CMS",
};

export default async function AdminAboutPage() {
  const settings = await getAdminSiteSettings();

  return (
    <main className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-accent md:text-3xl">
            About
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Site content used on the public about page.
          </p>
        </div>
        <Link
          href="/about"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70"
        >
          View live →
        </Link>
      </div>

      <AboutPortraitManager
        key={settings.updated_at}
        settings={settings}
        fallbackSrc={aboutContent.portraitSrc}
        fallbackAlt={aboutContent.portraitAlt}
      />
    </main>
  );
}
