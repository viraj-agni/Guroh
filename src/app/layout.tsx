import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Project Vidyā | Interactive Physical AI Academy",
  description: "Learn math, physics, and neural computation bottom-up through tactile playgrounds and WebAssembly-powered interactive grading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full dark antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full bg-vidya-bg text-vidya-text font-sans antialiased flex flex-col selection:bg-vidya-accent selection:text-vidya-void">
        {children}
      </body>
    </html>
  );
}
