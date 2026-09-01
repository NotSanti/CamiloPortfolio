import { AdminLoginForm } from "@/src/components/admin/admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/admin")
      ? params.next
      : "/admin/projects";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mb-10 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-accent">
          Caloid CMS
        </p>
        <h1 className="mt-2 text-3xl font-bold uppercase text-accent md:text-4xl">
          Sign in
        </h1>
      </div>
      <AdminLoginForm nextPath={nextPath} />
    </main>
  );
}
