import type { Metadata } from "next";
import Script from "next/script";
import { Cairo } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.example.com"),
  title: "My Store",
  description: "A simple online store.",
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
              <Script
          src="https://umami-iota-six-97.vercel.app/script.js"
          data-website-id="a8ea4e6c-edcc-495d-b048-aea18e804434"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
