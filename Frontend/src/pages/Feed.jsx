import { useState, useEffect, useRef, useCallback } from 'react';
import { getFeed, createPost } from '../api/api';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

const IconImage = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconX = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function CreatePost({ onPost }) {
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!caption.trim() && !image) return;

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();

      if (caption.trim()) {
        fd.append('caption', caption.trim());
      }

      if (image) {
        fd.append('image', image);
      }

      console.log('FORM DATA ENTRIES:');

      for (let pair of fd.entries()) {
        console.log(pair[0], pair[1]);
      }

      const newPost = await createPost(fd);

      console.log('POST CREATED:', newPost);

      setCaption('');
      setImage(null);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview(null);

      if (fileRef.current) {
        fileRef.current.value = '';
      }

      onPost(newPost);

    } catch (err) {
      console.error('CREATE POST ERROR:', err);

      setError(
        err?.detail ||
        err?.image?.[0] ||
        err?.caption?.[0] ||
        'Failed to create post'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit}>
        <div className="create-post-row">
          <Avatar user={user} size={38} />

          <textarea
            className="create-post-input"
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="preview" />

            <button
              type="button"
              className="image-preview-remove"
              onClick={removeImage}
            >
              <IconX />
            </button>
          </div>
        )}

        {error && (
          <div
            className="create-post-error"
            style={{
              color: 'red',
              marginTop: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div className="create-post-actions">
          <div className="create-post-actions-left">
            <button
              type="button"
              className="icon-btn"
              onClick={() => fileRef.current.click()}
            >
              <IconImage />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImage}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (!caption.trim() && !image)}
            style={{ padding: '7px 18px', fontSize: 13 }}
          >
            {loading ? 'Posting...' : 'Share'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loaderRef = useRef(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  useEffect(() => {
    console.log('POSTS STATE:', posts);
  }, [posts]);

  const loadFeed = useCallback(async (p = 1) => {

    if (!hasMoreRef.current && p !== 1) {
      return;
    }

    try {
      const data = await getFeed(p);

      console.log('FEED RESPONSE:', data);

      const results = data.results || [];

      if (p === 1) {
        setPosts(results);
      } else {
        setPosts((prev) => [...prev, ...results]);
      }

      const more = Boolean(data.next);

      setHasMore(more);
      hasMoreRef.current = more;

    } catch (err) {

      console.error('FEED ERROR:', err);

      if (err?.detail === 'Invalid page.') {
        setHasMore(false);
        hasMoreRef.current = false;
      }

    } finally {

      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;

    }
  }, []);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  useEffect(() => {

    const observer = new IntersectionObserver(
      ([entry]) => {

        if (
          entry.isIntersecting &&
          !loadingRef.current &&
          hasMoreRef.current
        ) {

          loadingRef.current = true;
          setLoadingMore(true);

          pageRef.current += 1;

          console.log('LOADING PAGE:', pageRef.current);

          loadFeed(pageRef.current);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();

  }, [loadFeed]);

  const handleNewPost = (post) => {
    console.log('ADDING NEW POST TO STATE:', post);

    setPosts((prev) => [post, ...prev]);
  };

  return (
    <div className="feed-page">

      <div className="feed-header">
        <h1>Your feed</h1>
        <p>Stories from people you follow</p>
      </div>

      <CreatePost onPost={handleNewPost} />

      {loading && (
        <div className="loading">
          Loading your feed...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>Follow some people to see their posts here.</p>
        </div>
      )}

      {posts.map((post, index) => (
        <PostCard
          key={post.id ?? `post-${index}`}
          post={post}
        />
      ))}

      {hasMore && (
        <div
          ref={loaderRef}
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 13,
          }}
        >
          {loadingMore ? 'Loading more...' : ''}
        </div>
      )}
    </div>
  );
}