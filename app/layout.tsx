import type { Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "LexiGov AI - Philippine Ordinance Generator",
  description: "AI-powered platform for drafting RA 7160 compliant local government ordinances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        >
          <ConvexClientProvider>
            {children}
            <Toaster richColors />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
