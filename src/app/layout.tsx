import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Grisella Makeup | Luxury Bridal & Event Makeup Artist',
  description:
    'Sistem reservasi online eksklusif Grisella Makeup. Layanan rias pengantin, bridesmaid, wisuda, dan event spesial dengan look natural flawless glam tahan lama.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#c97a7e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-[#FDFBF7] text-[#2D2424] antialiased selection:bg-[#F5DAE0] selection:text-[#8C4247] font-sans">
        {children}
      </body>
    </html>
  );
}
