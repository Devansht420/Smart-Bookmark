'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Bookmark = {
  id: string
  title: string
  url: string
  created_at: string
  user_id: string
}

export default function BookmarksList({
  initialBookmarks,
  userId,
}: {
  initialBookmarks: Bookmark[]
  userId: string
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('connecting')

  const refetchAll = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setBookmarks(data)
  }, [userId])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`bookmarks:${userId}`, {
        config: { presence: { key: userId } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBookmarks((prev) => {
            if (prev.find((b) => b.id === payload.new.id)) return prev
            return [payload.new as Bookmark, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.map((b) =>
              b.id === payload.new.id ? (payload.new as Bookmark) : b
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime status:', status, err)
        setRealtimeStatus(status)

        // If subscription failed, fall back to refetching data
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime failed, refetching...')
          refetchAll()
        }

        // On reconnect, refetch to catch any missed changes
        if (status === 'SUBSCRIBED') {
          refetchAll()
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refetchAll])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) console.error('Delete error:', error)
    // Optimistic update in case realtime is slow
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    setDeleting(null)
  }

  const startEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id)
    setEditTitle(bookmark.title)
    setEditUrl(bookmark.url)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditUrl('')
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editUrl.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('bookmarks')
      .update({
        title: editTitle.trim(),
        url: editUrl.startsWith('http') ? editUrl : `https://${editUrl}`,
      })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) console.error('Edit error:', error)
    setSaving(false)
    cancelEdit()
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔖</div>
        <p className="text-lg" style={{ color: 'var(--muted)' }}>No bookmarks yet.</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Add your first one above!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
        </p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          background: realtimeStatus === 'SUBSCRIBED' ? 'rgba(100,255,100,0.1)' : 'rgba(255,200,0,0.1)',
          color: realtimeStatus === 'SUBSCRIBED' ? '#4caf50' : '#ffc107',
        }}>
          {realtimeStatus === 'SUBSCRIBED' ? '● live' : '● connecting...'}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="group p-4 rounded-2xl transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {editingId === bookmark.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                    color: 'var(--text)',
                  }}
                />
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                    color: 'var(--text)',
                  }}
                />
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(bookmark.id)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: '#0f0f0f' }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div
                  className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?sz=32&domain=${getDomain(bookmark.url)}`}
                    alt=""
                    width={18}
                    height={18}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm block truncate hover:underline"
                    style={{ color: 'var(--text)' }}
                  >
                    {bookmark.title}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs truncate" style={{ color: 'var(--accent)' }}>
                      {getDomain(bookmark.url)}
                    </span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {formatDate(bookmark.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(bookmark)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(232,255,89,0.1)', color: 'var(--accent)' }}
                    title="Edit bookmark"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    disabled={deleting === bookmark.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                    style={{ background: 'rgba(255,107,107,0.12)', color: '#ff6b6b' }}
                    title="Delete bookmark"
                  >
                    {deleting === bookmark.id ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}