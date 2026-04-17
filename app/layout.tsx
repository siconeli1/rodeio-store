import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://rodeio-store.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RodeioStore — Moda Country",
    template: "%s — RodeioStore",
  },
  description:
    "Camisas xadrez, botas texanas, chapéus e acessórios country. Encontre seu estilo no RodeioStore.",
  keywords: [
    "moda country",
    "camisa xadrez",
    "bota texana",
    "chapéu country",
    "jeans",
    "rodeio",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "RodeioStore",
    title: "RodeioStore — Moda Country",
    description:
      "Camisas xadrez, botas texanas, chapéus e acessórios country. Encontre seu estilo no RodeioStore.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RodeioStore — Moda Country",
    description:
      "Camisas xadrez, botas texanas, chapéus e acessórios country.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
