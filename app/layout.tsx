import {ClerkProvider} from '@clerk/nextjs';
import type { Metadata } from 'next'
import { Inter, Schibsted_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

// Covira's two voices (Design Bible §Typography), self-hosted via next/font to
// avoid render-blocking @import and layout shift. Exposed as CSS variables so
// the .voice / .evidence classes and <Said>/<Recorded> components resolve them.
//   --font-voice     Schibsted Grotesk — everything SAID (variable font, full 400–700 axis)
//   --font-evidence  IBM Plex Mono — everything RECORDED (discrete weights 400/500)
const schibstedGrotesk = Schibsted_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-voice' })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], display: 'swap', weight: ['400', '500'], variable: '--font-evidence' })

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
    <html lang="en" className={`${inter.variable} ${schibstedGrotesk.variable} ${ibmPlexMono.variable}`}>
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