import { useState, useEffect } from 'react';
import { getNotifications, markAsRead } from '../api/api';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const icons = {
  like: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  comment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  follow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
};

const messages = {
  like: (sender) => <><strong>{sender}</strong> liked your post</>,
  comment: (sender) => <><strong>{sender}</strong> commented on your post</>,
  follow: (sender) => <><strong>{sender}</strong> started following you</>,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (n) => {
    if (n.is_read) return;
    try {
      await markAsRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    } catch {}
  };

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="notifications-page">
      <h1 className="page-title">Notifications</h1>
      {loading && <div className="loading">Loading...</div>}
      {!loading && notifications.length === 0 && (
        <div className="empty-state">
          <h3>All quiet</h3>
          <p>You're all caught up. New activity will appear here.</p>
        </div>
      )}
      {unread.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.75rem' }}>
            New · {unread.length}
          </div>
          {unread.map(n => (
            <div
              key={n.id}
              className="notif-item unread fade-in"
              onClick={() => handleRead(n)}
            >
              <div className={`notif-icon ${n.notification_type}`}>
                {icons[n.notification_type] || icons.follow}
              </div>
              <div className="notif-text">
                {messages[n.notification_type]?.(n.sender_username) || <>{n.sender_username} interacted with you</>}
              </div>
              <div className="notif-time">{timeAgo(n.created_at)}</div>
              <div className="unread-dot" />
            </div>
          ))}
        </div>
      )}
      {read.length > 0 && (
        <div>
          {unread.length > 0 && (
            <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.75rem' }}>
              Earlier
            </div>
          )}
          {read.map(n => (
            <div key={n.id} className="notif-item">
              <div className={`notif-icon ${n.notification_type}`} style={{ opacity: 0.5 }}>
                {icons[n.notification_type] || icons.follow}
              </div>
              <div className="notif-text" style={{ color: 'var(--text-3)' }}>
                {messages[n.notification_type]?.(n.sender_username) || <>{n.sender_username} interacted with you</>}
              </div>
              <div className="notif-time">{timeAgo(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
