import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/app/components/ui/toaster";

export const metadata: Metadata = {
  title: "ProjectMind - AI-Powered Project Management",
  description: "Transform your notes into actionable tasks with AI-powered productivity platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
