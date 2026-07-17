import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fonil Group',
  description: 'Acompanhamento de atividades e fluxo de dailies da Fonil Group',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Fonil Group',
    statusBarStyle: 'black-translucent',
    startupImage: [
      // iPhone 14 Pro Max
      { url: '/apple-icon', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 Pro
      { url: '/apple-icon', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 / 13 / 12
      { url: '/apple-icon', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone SE
      { url: '/apple-icon', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  other: {
    // Android Chrome
    'mobile-web-app-capable': 'yes',
    // Microsoft
    'msapplication-TileColor': '#06061a',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06061a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} min-h-screen bg-background antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
