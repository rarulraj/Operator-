import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Silkscreen } from "next/font/google";
import type { ReactNode } from "react";
import { NavProgress } from "@/components/nav-progress";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const pixel = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Operator — Personal RPG",
  description:
    "A personal AI-powered RPG for career growth, brand building, and startup execution.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  appleWebApp: {
    capable: true,
    title: "Operator",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#161009",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${pixel.variable}`}>
      <body>
        <NavProgress />
        <Sidebar />
        <main className="min-h-screen pb-16 pt-16 md:pl-60 md:pt-0">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
