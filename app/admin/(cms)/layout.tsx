import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/src/services/auth/actions";
import { createClient } from "@/src/lib/supabase/server";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminCmsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/admin/projects"
            className="text-sm font-bold uppercase text-accent"
          >
            Caloid CMS
          </Link>
          <nav aria-label="Admin" className="flex items-center gap-4">
            <Link
              href="/admin/projects"
              className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70"
            >
              Projects
            </Link>
            <Link
              href="/"
              className="text-sm font-medium uppercase text-foreground/50 transition-opacity hover:opacity-70"
              target="_blank"
              rel="noreferrer"
            >
              View site
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <p className="max-w-[10rem] truncate text-xs text-foreground/60 sm:max-w-none">
            {user.email}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium uppercase text-accent transition-opacity hover:opacity-70"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
