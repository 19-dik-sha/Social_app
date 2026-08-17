import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProfile,
  getUserPosts,
  followUser,
  unfollowUser,
  uploadProfilePicture
} from '../api/api';

import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const IconCamera = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function Profile() {
  const { username } = useParams();
  const { user: me, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [view, setView] = useState('grid');

  const fileRef = useRef(null);

  const isMe = me?.username === username;

  useEffect(() => {
    setLoading(true);

    Promise.all([
      getProfile(username),
      getUserPosts(username),
    ])
      .then(([p, postsData]) => {
        setProfile(p || {});
        setFollowing(p?.is_following || false);

        const safePosts = Array.isArray(postsData)
          ? postsData
          : Array.isArray(postsData?.results)
            ? postsData.results
            : [];

        setPosts(safePosts);
      })
      .catch(() => {
        navigate('/explore');
      })
      .finally(() => {
        setLoading(false);
      });

  }, [username, navigate]);

  const toggleFollow = async () => {
    if (followLoading) return;

    setFollowLoading(true);

    try {
      if (following) {
        await unfollowUser(username);

        setFollowing(false);

        setProfile(prev => ({
          ...prev,
          followers_count: (prev?.followers_count || 1) - 1
        }));

      } else {
        await followUser(username);

        setFollowing(true);

        setProfile(prev => ({
          ...prev,
          followers_count: (prev?.followers_count || 0) + 1
        }));
      }

    } catch (err) {
      console.log(err);

    } finally {
      setFollowLoading(false);
    }
  };

  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const fd = new FormData();
    fd.append('profile_picture', file);

    try {
      await uploadProfilePicture(fd);

      await refreshUser();

      const updatedProfile = await getProfile(username);

      setProfile(updatedProfile);

    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div
        className="loading"
        style={{ padding: '3rem' }}
      >
        Loading profile...
      </div>
    );
  }

  if (!profile) return null;

  const imgSrc = profile?.profile_picture
    ? (
        profile.profile_picture.startsWith('http')
          ? profile.profile_picture
          : profile.profile_picture
      )
    : null;

  return (
    <div className="profile-page">

      <div className="profile-header">

        <div className="profile-pic-wrap">

          {imgSrc ? (
            <img
              src={imgSrc}
              alt={profile.username}
              className="avatar"
              style={{ width: 100, height: 100 }}
            />
          ) : (
            <div
              className="avatar-placeholder"
              style={{
                width: 100,
                height: 100,
                fontSize: 38
              }}
            >
              {profile?.username?.[0]?.toUpperCase()}
            </div>
          )}

          {isMe && (
            <>
              <button
                type="button"
                className="icon-btn"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  padding: 6
                }}
                onClick={() => fileRef.current?.click()}
              >
                <IconCamera />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePicChange}
              />
            </>
          )}

        </div>

        <div className="profile-stats">

          <div className="profile-stats-top">

            <h1 className="profile-username">
              {profile.username}
            </h1>

            {!isMe ? (
              <button
                className={`btn ${following ? 'btn-ghost' : 'btn-primary'}`}
                onClick={toggleFollow}
                disabled={followLoading}
                style={{
                  padding: '7px 20px',
                  fontSize: 13
                }}
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>

            ) : (
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/settings')}
                style={{
                  padding: '7px 20px',
                  fontSize: 13
                }}
              >
                Edit Profile
              </button>
            )}

          </div>

          <div className="profile-counts">

            <div className="profile-count">
              <span className="number">
                {profile.posts_count || 0}
              </span>
              <span className="label">Posts</span>
            </div>

            <div className="profile-count">
              <span className="number">
                {profile.followers_count || 0}
              </span>
              <span className="label">Followers</span>
            </div>

            <div className="profile-count">
              <span className="number">
                {profile.following_count || 0}
              </span>
              <span className="label">Following</span>
            </div>

          </div>

          {profile.bio && (
            <p className="profile-bio">
              {profile.bio}
            </p>
          )}

        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >

        <button
          className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setView('grid')}
          style={{
            padding: '6px 16px',
            fontSize: 12
          }}
        >
          Grid
        </button>

        <button
          className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setView('list')}
          style={{
            padding: '6px 16px',
            fontSize: 12
          }}
        >
          List
        </button>

      </div>

      {posts.length === 0 && (
        <div className="empty-state">
          <h3>No posts yet</h3>

          <p>
            {isMe
              ? 'Share your first moment.'
              : `${username} hasn't posted yet.`
            }
          </p>
        </div>
      )}

      {view === 'grid' && (
        <div className="posts-grid">

          {Array.isArray(posts) &&
            posts.map(post => {

              const src = post.image
                ? (
                    post.image.startsWith('http')
                      ? post.image
                      : post.image
                  )
                : null;

              return (
                <div
                  key={post.id}
                  className="grid-post"
                >

                  {src ? (
                    <img
                      src={src}
                      alt=""
                    />

                  ) : (
                    <div className="grid-post-placeholder">
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-3)',
                          padding: '1rem',
                          textAlign: 'center'
                        }}
                      >
                        {post.caption?.slice(0, 50)}
                      </span>
                    </div>
                  )}

                </div>
              );
            })
          }

        </div>
      )}

      {view === 'list' && (
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto'
          }}
        >

          {Array.isArray(posts) &&
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
              />
            ))
          }

        </div>
      )}

    </div>
  );
}