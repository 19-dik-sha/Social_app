import { useState } from 'react';
import { updateProfile, changePassword } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileErr(''); setProfileMsg('');
    setProfileLoading(true);
    try {
      await updateProfile({ username: profileData.username, bio: profileData.bio, email: profileData.email });
      await refreshUser();
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr(err?.username?.[0] || err?.detail || 'Failed to update profile');
    }
    setProfileLoading(false);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordErr(''); setPasswordMsg('');
    if (passwords.new_password !== passwords.confirm) {
      setPasswordErr("New passwords don't match");
      return;
    }
    if (passwords.new_password.length < 6) {
      setPasswordErr('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({ old_password: passwords.old_password, new_password: passwords.new_password });
      setPasswordMsg('Password changed successfully');
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPasswordErr(err?.old_password?.[0] || err?.detail || 'Failed to change password');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">
        <h3>Profile Information</h3>
        {profileMsg && <div className="settings-success">{profileMsg}</div>}
        {profileErr && <div className="auth-error">{profileErr}</div>}
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={profileData.username}
              onChange={e => setProfileData(s => ({ ...s, username: e.target.value }))}
              placeholder="Username"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={e => setProfileData(s => ({ ...s, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={profileData.bio}
              onChange={e => setProfileData(s => ({ ...s, bio: e.target.value }))}
              placeholder="Tell people a little about yourself..."
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3>Change Password</h3>
        {passwordMsg && <div className="settings-success">{passwordMsg}</div>}
        {passwordErr && <div className="auth-error">{passwordErr}</div>}
        <form onSubmit={savePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwords.old_password}
              onChange={e => setPasswords(s => ({ ...s, old_password: e.target.value }))}
              placeholder="Current password"
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={e => setPasswords(s => ({ ...s, new_password: e.target.value }))}
              placeholder="New password"
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords(s => ({ ...s, confirm: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
            <span>App</span><span style={{ color: 'var(--accent)' }}>Dusk</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
            <span>Version</span><span>1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
            <span>Signed in as</span><span style={{ color: 'var(--text)' }}>@{user?.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
