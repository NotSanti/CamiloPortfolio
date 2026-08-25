import type { Metadata } from "next";
import { getPublishedProjectSummaries } from "@/src/services/projects/get-published-projects";
import { LoadingOverlay } from "@/src/components/layout/loading-overlay";
import { PageTransition } from "@/src/components/layout/page-transition";
import { ProjectsProvider } from "@/src/components/work/projects-provider";
import "./globals.css";

/** Public project data can change from the CMS without a redeploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Caloid",
  description: "Montreal-based photographer and cinematographer Camilo Luna.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projectSummaries = await getPublishedProjectSummaries();

  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        <LoadingOverlay />
        <ProjectsProvider projects={projectSummaries}>
          <PageTransition>{children}</PageTransition>
        </ProjectsProvider>
      </body>
    </html>
  );
}
