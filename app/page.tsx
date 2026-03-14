import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/LoginButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/bookmarks')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>

      {/* Decorative background blob */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: 'var(--accent)' }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo mark */}
        <div className="mx-auto mb-8 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z"
              fill="#0f0f0f" strokeWidth="0" />
          </svg>
        </div>

        <h1 className="font-display text-5xl md:text-6xl mb-4 leading-tight"
          style={{ color: 'var(--text)' }}>
          Smart<br />Bookmarks
        </h1>

        <p className="text-lg mb-10" style={{ color: 'var(--muted)' }}>
          Save, organize, and access your links — from anywhere, in real time.
        </p>

        <LoginButton />

        <p className="mt-6 text-sm" style={{ color: 'var(--muted)' }}>
          No password needed. Sign in with your Google account.
        </p>
      </div>
    </main>
  )
}
