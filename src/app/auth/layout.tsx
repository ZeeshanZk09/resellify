export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen grid place-content-center py-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
