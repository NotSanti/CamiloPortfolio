import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getPublishedProjectSummaries } from "@/src/services/projects/get-published-projects";
import { LoadingOverlay } from "@/src/components/layout/loading-overlay";
import { PageTransition } from "@/src/components/layout/page-transition";
import { ProjectsProvider } from "@/src/components/work/projects-provider";
import {
  DEFAULT_HOME_DESCRIPTION,
  getSiteUrl,
  PERSON_NAME,
  SITE_NAME,
} from "@/src/lib/seo";
import "./globals.css";

/** Public project data can change from the CMS without a redeploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: PERSON_NAME }],
  creator: PERSON_NAME,
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projectSummaries = await getPublishedProjectSummaries();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    preconnect(supabaseUrl);
  }
  preconnect("https://image.mux.com");

  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        {/* <LoadingOverlay /> */}
        <ProjectsProvider projects={projectSummaries}>
          <PageTransition>{children}</PageTransition>
        </ProjectsProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
