# Smart Bookmarks

A real-time bookmark manager built with Next.js 15 (App Router), Supabase, and Tailwind CSS.

## Features

- Google OAuth login (no email/password)
- Add bookmarks with a title + URL
- Bookmarks are private per user
- Real-time updates across tabs (Supabase Realtime)
- Delete your own bookmarks
- Deployed on Vercel

## Tech Stack

- **Next.js 15** — App Router, Server Components, Route Handlers
- **Supabase** — Auth (Google OAuth), PostgreSQL database, Realtime subscriptions
- **Tailwind CSS** — Utility-first styling
- **TypeScript** — End-to-end type safety

---

## Problems I Ran Into & How I Solved Them

### 1. Supabase cookie handling in Next.js App Router
**Problem:** The old `@supabase/auth-helpers-nextjs` package doesn't support the App Router's async `cookies()` API properly.  
**Solution:** Switched to `@supabase/ssr` which provides `createServerClient` and `createBrowserClient` with explicit cookie get/set methods that work correctly with Next.js 15's async cookie store.

### 2. Realtime not filtering by user
**Problem:** Initially, Supabase Realtime was broadcasting all bookmark changes to every connected client, regardless of which user the changes belonged to.  
**Solution:** Added a `filter: \`user_id=eq.${userId}\`` to the Realtime subscription. This, combined with Row Level Security on the database, ensures users only receive their own updates.

### 3. Row Level Security (RLS) blocking all reads/writes
**Problem:** After enabling RLS on the `bookmarks` table, all queries returned empty results — even for authenticated users.  
**Solution:** Created explicit RLS policies for SELECT, INSERT, and DELETE that check `auth.uid() = user_id`. This ensures each operation is scoped to the currently logged-in user.

### 4. Google OAuth redirect URI mismatch
**Problem:** After configuring Google OAuth in Supabase, the redirect kept failing with an OAuth error because the callback URL wasn't whitelisted.  
**Solution:** Added `https://<your-vercel-url>/auth/callback` to both the Supabase Auth settings (Site URL + Redirect URLs) and the Google Cloud Console OAuth Authorized Redirect URIs.

### 5. Duplicate inserts from Realtime + server fetch
**Problem:** When adding a bookmark, the realtime INSERT event fired, but the server-side initial fetch already had the item, causing duplicates on page load in some scenarios.  
**Solution:** Added a deduplication check in the Realtime INSERT handler: `if (prev.find((b) => b.id === payload.new.id)) return prev`.

---

## Local Development

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials
3. Run `npm install`
4. Run `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deployed to Vercel. Environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in the Vercel dashboard.
