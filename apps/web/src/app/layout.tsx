import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  title: 'LexiGov AI - Philippine Ordinance Drafting Assistant',
  description: 'AI-powered ordinance and policy drafting platform for Philippine Local Government Units',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
