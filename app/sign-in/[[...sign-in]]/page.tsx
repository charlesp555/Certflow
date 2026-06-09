import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#D97706',
            colorBackground: '#0a0a0f',
            colorInputBackground: '#111118',
            colorText: '#ffffff',
            colorTextSecondary: '#9ca3af',
            borderRadius: '8px',
          },
          elements: {
            card: 'bg-[#111118] border border-[#1e1e2e]',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-400',
            formButtonPrimary: 'bg-[#D97706] hover:bg-[#B45309]',
          },
        }}
      />
    </div>
  )
}
