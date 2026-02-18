'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [bookmarks, setBookmarks] = useState([])

  // 🔹 Fetch bookmarks (PRIVATE to user)
  const fetchBookmarks = async (userId) => {
    if (!userId) return

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) {
      setBookmarks(data)
    } else {
      console.error(error)
    }
  }

  // 🔹 Handle Auth + Initial Load
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      if (data.user) {
        fetchBookmarks(data.user.id)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          fetchBookmarks(currentUser.id)
        } else {
          setBookmarks([])
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🔹 Realtime Subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        () => {
          console.log('Realtime triggered 🚀')
          fetchBookmarks(user.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // 🔹 Login
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  }

  // 🔹 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // 🔹 Add Bookmark
  const handleAddBookmark = async () => {
    if (!url || !title || !user) return

    const { error } = await supabase.from('bookmarks').insert([
      {
        url,
        title,
        user_id: user.id
      }
    ])

    if (!error) {
      setUrl('')
      setTitle('')
    } else {
      console.error(error)
    }
  }

  // 🔹 Delete Bookmark
  const handleDelete = async (id) => {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
  }

  return (
    <main className=' text-black bg-gray-300 min-h-screen min-w-screen flex flex-col items-center justify-center bg-[linear-gradient(to_right,_#eea2a2_0%,_#bbc1bf_19%,_#57c6e1_42%,_#b49fda_79%,_#7ac5d8_100%)] gap-4'>
      
      

      {!user ? (
        <div className='flex flex-col items-center gap-2'>
          <h1 className='text-6xl font-bold  mb-6'>Smart Bookmark App</h1>
          <p className='text-lg text-gray-800 max-w-xl text-center'>
        Save and organize your favorite links at one place. <br/>Sign in to get started.
      </p>
          <button
            onClick={handleLogin}
            className='group relative flex items-center gap-3 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm '
          >
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white text-[18px] font-semibold text-[#4285F4]'>
              G
            </span>
            <span className='whitespace-nowrap'>
              Continue with Google
            </span>
          </button>
        </div>
      ) : (
        <>
          <p className='text-sm text-gray-500'>Logged in as {user.email}</p>
          <button onClick={handleLogout}>Logout</button>

          <hr />

          <h2 className='text-lg font-bold'>Add Bookmark</h2>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />

          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <br />

          <button className='bg-blue-500 text-white px-4 py-2 rounded-md' onClick={handleAddBookmark}>
            Add
          </button>

          <hr />

          <h2 className='text-lg font-bold'>Your Bookmarks</h2>

          {bookmarks.map((b) => (
            <div key={b.id} className='mb-2'>
              <a href={b.url} target="_blank">
                {b.title}
              </a>
              <button
                onClick={() => handleDelete(b.id)}
                style={{ marginLeft: '10px' }}
                className='bg-red-500 text-white px-4 py-2 rounded-md'
              >
                Delete
              </button>
            </div>
          ))}
        </>
      )}
    </main>
  )
}