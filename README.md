🔖 Bookmark App

A full-stack bookmark manager built with Next.js and Supabase.

✨ Key Highlights

- 🔐 Google OAuth authentication
- 🔄 Real-time cross-tab synchronization
- 🛡️ Row Level Security (RLS) enforced at database level
- 👤 Strict per-user data isolation

🧱 Technical Stack

- Next.js (App Router)
- Supabase Auth
- PostgreSQL
- Supabase Realtime
- RLS policies using auth.uid()

🛡️ Security Implementation

All database access is protected with RLS:

`auth.uid() = user_id`

Users can only read, insert, and delete their own bookmarks.

⚡ Realtime

Postgres change subscriptions ensure instant UI updates across browser tabs without refresh.

🎯 This project demonstrates:

- Secure OAuth integration
- Database-level authorization
- Real-time state synchronization
- Production-ready full-stack architecture