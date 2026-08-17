import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://openhouse-gilt.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OHS openhouse",
  description: "FIND · JOIN · PLAY",
  openGraph: {
    title: "OHS openhouse",
    description: "FIND · JOIN · PLAY",
    siteName: "OpenHouse",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OHS openhouse",
    description: "FIND · JOIN · PLAY",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
