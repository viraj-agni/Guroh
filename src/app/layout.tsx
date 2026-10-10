import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAAppShell from "@/components/PWAAppShell";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Guroh | Physical AI Academy",
  description: "Learn math, physics, and neural computation bottom-up through tactile playgrounds and WebAssembly-powered interactive grading.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Guroh",
  },
};

export const viewport: Viewport = {
  themeColor: "#8D1516",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full dark antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full bg-[#0F0505] text-[#F9F1EC] font-sans antialiased flex flex-col selection:bg-[#2D6A4F] selection:text-[#F9F1EC]">
        <ServiceWorkerRegister />
        <PWAAppShell>
          {children}
        </PWAAppShell>
      </body>
    </html>
  );
}
