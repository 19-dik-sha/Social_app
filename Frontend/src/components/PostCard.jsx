import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { likePost, unlikePost, createComment, getComments } from '../api/api';
import Avatar from './Avatar';

const BASE_URL = '';

const IconHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const IconComment = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ---------------- COMMENTS MODAL ---------------- */

function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComments(postId)
      .then(c => {
        setComments(Array.isArray(c) ? c : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const c = await createComment(postId, text.trim());
      setComments(prev => [c, ...(Array.isArray(prev) ? prev : [])]);
      setText('');
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Comments</h3>
          <button className="icon-btn" onClick={onClose}><IconX /></button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Loading...</div>}

          {!loading && comments.length === 0 && (
            <div className="empty-state">
              <p>No comments yet. Be the first!</p>
            </div>
          )}

          {Array.isArray(comments) &&
            comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div
                  className="avatar-placeholder"
                  style={{
                    width: 30,
                    height: 30,
                    fontSize: 11,
                    flexShrink: 0,
                    borderRadius: '50%'
                  }}
                >
                  {c.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>

                <div className="comment-item-content">
                  <div className="author">{c.user?.username}</div>
                  <div className="text">{c.text}</div>
                </div>
              </div>
            ))}
        </div>

        <div className="modal-footer">
          <form onSubmit={submit} style={{ display: 'flex', gap: 10 }}>
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button type="submit" className="comment-send">Post</button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- POST CARD ---------------- */

export default function PostCard({ post: initialPost }) {
  const safePost = {
    ...initialPost,
    like_count: initialPost.like_count ?? 0,
    comment_count: initialPost.comment_count ?? 0,
  };

  const [post, setPost] = useState(safePost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);

  const imgSrc =
    post.image
      ? (post.image.startsWith('http')
          ? post.image
          : `${BASE_URL}${post.image}`)
      : null;


  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (post.is_liked) {
        await unlikePost(post.id);
        setPost(p => ({ ...p, is_liked: false, like_count: (p.like_count || 0) - 1 }));
      } else {
        await likePost(post.id);
        setPost(p => ({ ...p, is_liked: true, like_count: (p.like_count || 0) + 1 }));
      }
    } catch {}
    setLikeLoading(false);
  };

  const handleQuickComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await createComment(post.id, commentText.trim());
      setPost(p => ({ ...p, comment_count: (p.comment_count || 0) + 1 }));
      setCommentText('');
    } catch {}
  };

  const userObj = {
    username: post.username || post.user_username || "unknown",
    id: post.user || post.user_id
  };

  return (
    <>
      <article className="post-card fade-in">
        <div className="post-header">
          <Link to={`/profile/${userObj.username}`} className="post-user">
            <Avatar user={userObj} size={36} />
            <div className="post-user-info">
              <div className="name">{userObj.username}</div>
              <div className="time">{timeAgo(post.created_at)}</div>
            </div>
          </Link>
        </div>

        {/* {imgSrc && <img src={imgSrc} alt="post" className="post-image" />} */}

        {imgSrc && (
          <img
            src={imgSrc}
            alt="post"
            className="post-image"
            onLoad={() => {
              console.log("✅ IMAGE LOADED:", imgSrc);
            }}
            onError={(e) => {
              console.log("❌ IMAGE FAILED:", e.target.src);
            }}
          />
        )}
        <div className="post-body">
          {post.caption && <p className="post-caption">{post.caption}</p>}

          <div className="post-actions">
            <button
              className={`action-btn${post.is_liked ? ' liked' : ''}`}
              onClick={handleLike}
            >
              <IconHeart filled={post.is_liked} />
              {post.like_count > 0 && <span>{post.like_count}</span>}
            </button>

            <button className="action-btn" onClick={() => setShowComments(true)}>
              <IconComment />
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </button>
          </div>

          {Array.isArray(post.prefetched_comments) &&
            post.prefetched_comments.length > 0 && (
              <div className="post-comments-preview">
                {post.prefetched_comments.map((c, i) => (
                  <div key={i}>
                    <span>{c.user}</span> {c.text}
                  </div>
                ))}
              </div>
            )}

          <form onSubmit={handleQuickComment} className="comment-input-row">
            <input
              className="comment-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            {commentText && (
              <button type="submit" className="comment-send">Post</button>
            )}
          </form>
        </div>
      </article>

      {showComments && (
        <CommentsModal postId={post.id} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}