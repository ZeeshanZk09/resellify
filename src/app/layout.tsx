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
    default: 'Resellify | Buy Quality Products Online at Best Prices',
    template: '%s | Resellify',
  },

  description:
    'Resellify is a trusted online store where you can buy quality products at competitive prices. We carefully source products, add value, and deliver directly to customers.',
  applicationName: 'Resellify',
  keywords: [
    'Resellify',
    'online shopping',
    'buy products online',
    'best prices',
    'trusted online store',
    'reseller store',
    'Pakistan online store',
    'ecommerce website',
  ],
  authors: [{ name: 'Resellify' }],
  creator: 'Resellify',
  publisher: 'Resellify',
  metadataBase: new URL('https://www.resellify.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Resellify | Quality Products at Honest Prices',
    description:
      'Shop confidently at Resellify. We source quality products, add value, and sell directly to customers with transparent pricing.',
    url: 'https://www.resellify.com',
    siteName: 'Resellify',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // add a real OG image
        width: 1200,
        height: 630,
        alt: 'Resellify Online Store',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Resellify | Smart Online Shopping',
    description:
      'Buy quality products online from Resellify. Carefully sourced, fairly priced, and delivered to your doorstep.',
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
