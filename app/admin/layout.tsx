export const metadata = {
  title: {
    default: "Caloid CMS",
    template: "%s · Caloid CMS",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div data-admin-shell="">{children}</div>;
}
