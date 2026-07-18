import type { ReactNode } from "react";

type HomeHeroProps = {
  children: ReactNode;
};

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section
      aria-label="Featured work"
      className="relative min-h-screen w-full overflow-hidden bg-background"
    >
      {children}
    </section>
  );
}
