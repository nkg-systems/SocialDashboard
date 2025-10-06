import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'SM3D - Social Media Management Dashboard',
  description: 'AI-driven platform for managing, analyzing, and automating multi-platform social media accounts',
  keywords: 'social media, management, dashboard, analytics, automation, SM3D',
  authors: [{ name: 'SM3D Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E50914',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="__next" className="min-h-screen bg-background text-text-primary">
          {children}
        </div>
      </body>
    </html>
  )
}
