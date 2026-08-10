import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.example.com"),
  title: "جذور عربية، أجنحة عالمية | كتب أطفال ثنائية اللغة",
  description:
    "سلسلة كتب أطفال ثنائية اللغة (عربي-إنجليزي) تحكي قصص شخصيات عربية ملهمة. اطلبي الآن بأسعار مناسبة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Platform-level fallback for pages with no resolved store (e.g. admin
    // login). The storefront (`[storeSlug]`) and admin dashboard layouts
    // override `lang`/`dir` per store's `uiLocale` further down the tree.
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
