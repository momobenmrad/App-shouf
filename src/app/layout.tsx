import type { Metadata, Viewport } from "next";
import { getBrand, onColor } from "@/lib/admin";
import { LangProvider } from "@/components/LangProvider";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBrand();
  return { title: `${b.name} · ${b.nameAr}`, description: b.slogan };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b111c", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&family=Reem+Kufi:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* White-label colours come from the back-office settings. */}
        <style>{`:root{--primary:${brand.primary};--on-primary:${onColor(brand.primary)};--accent:${brand.accent};}`}</style>
      </head>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
