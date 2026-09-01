import { aboutContent } from "@/data/about";
import { SeoManager } from "@/src/components/admin/seo-manager";
import { getAllProjects } from "@/src/services/projects/admin";
import { getAdminSiteSettings } from "@/src/services/site/admin";

export const metadata = {
  title: "SEO",
};

export default async function AdminSeoPage() {
  const [settings, projects] = await Promise.all([
    getAdminSiteSettings(),
    getAllProjects(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase text-accent md:text-3xl">
          SEO
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Titles, descriptions, and sitemap used by search engines and link
          previews. Generate from current content after you add or edit work,
          then refresh the live site.
        </p>
      </div>

      <SeoManager
        key={`${settings.updated_at}:${projects.map((project) => project.updated_at).join(",")}`}
        settings={settings}
        projects={projects}
        aboutBio={aboutContent.bioParagraphs[0] ?? ""}
      />
    </main>
  );
}
