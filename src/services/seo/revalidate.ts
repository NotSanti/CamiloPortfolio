import { revalidatePath } from "next/cache";

export function revalidatePublicSeo(slugs: string[] = []) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/why");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  revalidatePath("/admin/seo");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/about");
  for (const slug of slugs) {
    revalidatePath(`/work/${slug}`);
  }
}
