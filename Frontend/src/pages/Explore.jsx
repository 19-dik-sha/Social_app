import { useState, useEffect, useRef } from 'react';
import { searchUsers, getAllPosts, followUser, unfollowUser } from '../api/api';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

const BASE_URL = '/api';

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const IconComment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

// ✅ strict safety function (important)
const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export default function Explore() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [followState, setFollowState] = useState({});
  const timer = useRef(null);

  // POSTS
  useEffect(() => {
    getAllPosts()
      .then(data => setPosts(toArray(data)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  // SEARCH (debounced + safe)
  useEffect(() => {
    clearTimeout(timer.current);

    if (!query.trim()) {
      setUsers([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    timer.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query);

        console.log("SEARCH RESPONSE:", res);

        setUsers(toArray(res)); // ✅ always array safe
      } catch (err) {
        console.error("Search error:", err);
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [query]);

  const toggleFollow = async (user) => {
    const isFollowing = !!followState[user.id];

    setFollowState(prev => ({
      ...prev,
      [user.id]: !isFollowing
    }));

    try {
      if (isFollowing) await unfollowUser(user.username);
      else await followUser(user.username);
    } catch {
      setFollowState(prev => ({
        ...prev,
        [user.id]: isFollowing
      }));
    }
  };

  // FINAL SAFE GUARDS (extra protection)
  const safeUsers = toArray(users);
  const safePosts = toArray(posts);

  return (
    <div className="explore-page">
      <h1>Explore</h1>

      <div className="search-bar">
        <IconSearch />
        <input
          placeholder="Search people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* SEARCH MODE */}
      {query && (
        <div className="search-results">
          <h3>{searching ? 'Searching...' : 'People'}</h3>

          {!searching && safeUsers.length === 0 && (
            <p>No users found for "{query}"</p>
          )}

          {safeUsers.map((u) => (
            <div key={u.id} className="user-card">
              <Link to={`/profile/${u.username}`}>
                <Avatar user={u} size={40} />
                <div>
                  <div>{u.username}</div>
                  {u.bio && <div>{u.bio}</div>}
                </div>
              </Link>

              <button onClick={() => toggleFollow(u)}>
                {followState[u.id] ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* POSTS MODE */}
      {!query && (
        <>
          <h3>All Posts</h3>

          {loading && <div>Loading...</div>}

          <div className="posts-grid">
            {safePosts
              .filter(p => p?.image)
              .map(post => {
                const src = post.image.startsWith('http')
                  ? post.image
                  : `${BASE_URL}${post.image}`;

                return (
                  <div key={post.id} className="grid-post">
                    <img src={src} alt="" />
                    <div className="overlay">
                      <span><IconHeart /> {post.like_count || 0}</span>
                      <span><IconComment /> {post.comment_count || 0}</span>
                    </div>
                  </div>
                );
              })}

            {safePosts
              .filter(p => !p?.image)
              .map(post => (
                <div key={post.id} className="grid-post">
                  <div className="placeholder">
                    {post.caption?.slice(0, 60)}
                  </div>
                </div>
              ))}
          </div>

          {!loading && safePosts.length === 0 && (
            <div>No posts yet</div>
          )}
        </>
      )}
    </div>
  );
}