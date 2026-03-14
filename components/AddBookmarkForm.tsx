'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddBookmarkForm({ userId }: { userId: string }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.trim() || !title.trim()) {
      setError('Both URL and title are required.')
      return
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      setError('Please enter a valid URL.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('bookmarks').insert({
      user_id: userId,
      url: url.startsWith('http') ? url : `https://${url}`,
      title: title.trim(),
    })

    setLoading(false)

    if (insertError) {
      setError('Failed to save bookmark. Try again.')
    } else {
      setUrl('')
      setTitle('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-5 rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>
        Add Bookmark
      </h2>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />

        {error && (
          <p className="text-sm" style={{ color: '#ff6b6b' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed self-end"
          style={{ background: 'var(--accent)', color: '#0f0f0f' }}
        >
          {loading ? 'Saving…' : 'Save Bookmark'}
        </button>
      </div>
    </form>
  )
}
