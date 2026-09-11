import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from '@lexigov/ui/components/sonner';

export const metadata: Metadata = {
  title: 'LexiGov AI - Philippine Ordinance Generator',
  description: 'AI-assisted platform with advisory RA 7160 guidance for local government ordinance drafts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='light' disableTransitionOnChange>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
