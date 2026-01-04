import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { AuthProvider } from '@/shared/components/auth-provider';
import { ThemeProvider } from '@/shared/components/theme-provider';
import { auth } from '@/auth';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'GO Shop | Buy Quality Products Online at Best Prices',
    template: '%s | GO Shop',
  },

  description:
    'GO Shop is a trusted online store where you can buy quality products at competitive prices. We carefully source products, add value, and deliver directly to customers.',
  applicationName: 'GO Shop',
  keywords: [
    'GO Shop',
    'online shopping',
    'buy products online',
    'best prices',
    'trusted online store',
    'reseller store',
    'Pakistan online store',
    'ecommerce website',
  ],
  authors: [{ name: 'GO Shop' }],
  creator: 'GO Shop',
  publisher: 'GO Shop',
  metadataBase: new URL('https://www.GO Shop.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GO Shop | Quality Products at Honest Prices',
    description:
      'Shop confidently at GO Shop. We source quality products, add value, and sell directly to customers with transparent pricing.',
    url: 'https://www.GO Shop.com',
    siteName: 'GO Shop',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // add a real OG image
        width: 1200,
        height: 630,
        alt: 'GO Shop Online Store',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GO Shop | Smart Online Shopping',
    description:
      'Buy quality products online from GO Shop. Carefully sourced, fairly priced, and delivered to your doorstep.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  category: 'ecommerce',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  console.log('user-session-from-next-auth: ', session);
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`min-h-screen [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300 ${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider session={session}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <Toaster
              position='top-right'
              richColors
              closeButton
              duration={5000}
              theme='system'
              className='z-100 bg-background text-foreground border border-border rounded-lg shadow-lg p-4'
            />

            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
