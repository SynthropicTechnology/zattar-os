import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat, Geist_Mono, Manrope } from "next/font/google";
import { CSPNonceMeta } from "@/lib/csp/csp-nonce-meta";
import RootLayoutClient from "./layout-client";
import "./globals.css";

// Fonte Sans (Interface/Texto)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fonte Heading (Títulos/Marca)
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Fonte Mono (Código/IDs técnicos)
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Fonte Headline (Magistrate)
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zattar Advogados",
    template: "%s | Zattar Advogados",
  },
  description: "Gestão Jurídica Inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Zattar",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/logos/logo-z-dark.png", media: "(prefers-color-scheme: light)", type: "image/png" },
      { url: "/logos/logo-z-light.png", media: "(prefers-color-scheme: dark)", type: "image/png" },
    ],
    apple: [{ url: "/logos/logo-z-dark.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obter nonce do middleware para CSP
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <CSPNonceMeta nonce={nonce} />
      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} ${manrope.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <RootLayoutClient nonce={nonce}>{children}</RootLayoutClient>
      </body>
    </html>
  );
}