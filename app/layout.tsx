import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Castaway — Solana IDL → SDK Generator",
  description:
    "Paste a Solana program ID, fetch its on-chain Solana IDL, and download a fully-typed SDK client in TypeScript or Rust — powered by Codama.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://castaway.lol"
  ),
  openGraph: {
    title: "Castaway — Solana IDL → SDK Generator",
    description:
      "Paste a Solana program ID, fetch its on-chain Solana IDL, and download a fully-typed SDK client in TypeScript or Rust — powered by Codama.",
    url: "/",
    siteName: "Castaway",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/castaway-icon.png",
    shortcut: "/castaway-icon.png",
    apple: "/castaway-icon.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Castaway — Solana IDL → SDK Generator",
    description:
      "Paste a Solana program ID, fetch its on-chain Solana IDL, and download a fully-typed SDK client in TypeScript or Rust — powered by Codama.",
    creator: "@dev_jodee",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
