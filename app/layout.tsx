import {ClerkProvider} from '@clerk/nextjs';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Covira — AI Vendor Insurance Verification',
  description: 'Covira uses AI to instantly review certificates of insurance, detect compliance gaps, and help property managers manage vendor risk with confidence.',
  keywords: ['COI verification', 'certificate of insurance', 'property management', 'vendor compliance', 'insurance automation', 'covira'],
  openGraph: {
    title: 'Covira — AI Vendor Insurance Verification',
    description: 'Instant. Accurate. Compliant. AI-powered vendor insurance verification for property managers.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}