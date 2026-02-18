"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faGoogle, faGithub, faSquareLinkedin} from "@fortawesome/free-brands-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  const fetchBookmarks = async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookmarks(data);
    } else {
      console.error(error);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        fetchBookmarks(data.user.id);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchBookmarks(currentUser.id);
        } else {
          setBookmarks([]);
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          console.log("Realtime triggered 🚀");
          fetchBookmarks(user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_REDIRECT_LINK,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddBookmark = async () => {
    if (!url || !title || !user) return;

    const { error } = await supabase.from("bookmarks").insert([
      {
        url,
        title,
        user_id: user.id,
      },
    ]);

    if (!error) {
      setUrl("");
      setTitle("");
    } else {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  return (
    <main className=" text-black bg-gray-300 min-h-screen w-screen flex flex-col items-center justify-center bg-[linear-gradient(to_right,#eea2a2_0%,#bbc1bf_19%,#57c6e1_42%,#b49fda_79%,#7ac5d8_100%)] gap-4">
      {!user ? (
        <div className="flex flex-col items-center gap-2 justify-center">
          <h1 className="text-8xl font-bold  mb-6">Smart Bookmark App</h1>
          <p className="text-lg text-gray-800 max-w-xl text-center">
            Save and organize your favorite links at one place. <br />
            Sign in to get started.
          </p>
          <button
            onClick={handleLogin}
            className="group relative flex items-center gap-3 rounded-full border-none bg-[#eda3a2] hover:bg-[#9c8ac7] hover:text-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm "
          >
            <div className="flex h-6 w-6 items-center justify-center text-[18px] font-semibold text-white">
              G
            </div>
            <span className="whitespace-nowrap">Continue with Google</span>
          </button>
        </div>
      ) : (
        <>
          <header className="w-full mx-auto  flex items-center justify-between rounded-b-4xl bg-white/70 backdrop-blur-md shadow-md px-6 sm:px-6 py-4 border border-white/60">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Smart Bookmark App
            </h1>

            <div className="flex items-center gap-4">
              <p className="hidden sm:block text-sm text-gray-500 max-w-[200px] truncate">
                Hi, {user.email}
              </p>
              <button
                onClick={handleLogout}
                className=" text-gray-600 hover:text-red-400"
              >
                <FontAwesomeIcon icon={faRightFromBracket} size="lg" />
              </button>
            </div>
          </header>

          <section className="mt-6 w-[80%] flex-1 flex flex-col md:flex-row md:items-start gap-6 px-6 justify-center items-center">
            {/* Left section: Add bookmark */}
            <div className="md:w-1/3 space-y-4 bg-white/70 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Add bookmark
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-s font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Supabase Docs"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-none bg-white px-3 py-2 text-sm text-gray-900 "
                  />
                </div>

                <div>
                  <label className="block text-s font-medium text-gray-600 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-lg border border-none bg-white px-3 py-2 text-sm text-gray-900 "
                  />
                </div>

                <button
                  onClick={handleAddBookmark}
                  className="w-full mt-1 inline-flex items-center justify-center rounded-lg bg-[#76c5d6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b3a0da] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Add bookmark
                </button>
              </div>
            </div>

            {/* Right section: Bookmarks list */}
            <div className="md:w-2/3 bg-white/70 backdrop-blur-md rounded-xl p-8 border border-white/60 shadow-sm flex flex-col h-[74vh] ">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your bookmarks
                </h2>
                <span className="text-xs text-gray-400">
                  {bookmarks.length} saved
                </span>
              </div>

              <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
                {bookmarks.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You don't have any bookmarks yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {bookmarks.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg mx-4 my-4 border border-none bg-gray-50/90 px-3 py-2 hover:bg-[#d3d3ef]      transition delay-10 duration-100 ease-in-out hover:-translate-y-1 hover:scale-101">
                        <a href={b.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-medium text-black " >
                          {b.title || b.url}
                        </a>
                        <button onClick={() => handleDelete(b.id)} className="text-red-500">
                          x
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <footer className="w-full mx-auto flex items-center justify-around rounded-t-4xl bg-white/70 backdrop-blur-md shadow-md px-6 sm:px-6 py-4 border border-white/60">
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated on: 18/02/2026
            </p>

            <div className="flex items-center gap-4">
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500">
                Let's connect:
              </p>

              <a
                href={process.env.NEXT_PUBLIC_GMAIL}
                className="text-gray-600 hover:text-red-500 transition-colors"
              >
                <FontAwesomeIcon icon={faGoogle} size="lg" />
              </a>

              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                target="_blank"
                className="text-gray-600 hover:text-black transition-colors">
                <FontAwesomeIcon icon={faGithub} size="lg" />
              </a>

              <a
                href={process.env.NEXT_PUBLIC_LINKEDIN_URL}
                target="_blank"
                className="text-gray-600 hover:text-sky-700 transition-colors">
                <FontAwesomeIcon icon={faSquareLinkedin} size="lg" />
              </a>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
