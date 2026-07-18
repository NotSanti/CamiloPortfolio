import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { PageTransition } from "@/src/components/layout/page-transition";
import { ProjectsProvider } from "@/src/components/work/projects-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caloid",
  description:
    "Montreal-based photographer and cinematographer Camilo Luna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <ProjectsProvider projects={projects}>
          <PageTransition>{children}</PageTransition>
        </ProjectsProvider>
      </body>
    </html>
  );
}
