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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://openhouse-gilt.vercel.app";

const serviceDescription =
  "주변 오픈매트·세미나·대회 정보를 찾고 바로 참가하는 스포츠 커뮤니티";

const ogImage = {
  url: "/images/ohs-wordmark.jpg",
  width: 1024,
  height: 1024,
  alt: "OHS openhouse — FIND · JOIN · PLAY",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OHS openhouse",
  description: serviceDescription,
  openGraph: {
    title: "OHS openhouse",
    description: serviceDescription,
    siteName: "OpenHouse",
    locale: "ko_KR",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "OHS openhouse",
    description: serviceDescription,
    images: [ogImage.url],
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
