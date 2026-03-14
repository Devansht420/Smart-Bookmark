# Smart Bookmarks

A real-time bookmark manager. Sign in with Google, save links, and watch them appear instantly across tabs.

**Live:** https://smart-bookmark-2syd.vercel.app

**Stack:** Next.js 16 (App Router), Supabase (Auth + Realtime), Tailwind CSS

---

## Problems I ran into

**1. Bookmarks weren't updating in real time**
Supabase Realtime was connected but nothing was happening. Turns out I had forgotten to enable Realtime on the `bookmarks` table in the Supabase dashboard, it's off by default. 

Went to Database then Replication, toggled it on, and it started working immediately. Also had a bug where two tabs shared the same channel name and conflicted with each other, fixed by making the channel name unique per user.

**2. Google OAuth redirect kept failing after deployment**
Worked fine on localhost but after deploying to Vercel, Google login would throw an OAuth error. The problem was I hadn't added the production URL to either the Supabase redirect allow list or the Google Cloud Console authorized URIs. 

Both need to be updated, missing either one breaks the flow.

**3. Next.js 16 broke the middleware**
Upgraded Next.js to fix a security vulnerability and the build started failing. Turns out Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function also needs to be named `proxy` instead of `middleware`. 

Renamed both and it deployed cleanly.
