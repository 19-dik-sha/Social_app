import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    bio: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await signup(form);

      await login({
        username: form.username,
        password: form.password,
      });

      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);

      const errorMessage =
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.password?.[0] ||
        err?.response?.data?.detail ||
        err?.username?.[0] ||
        err?.password?.[0] ||
        err?.detail ||
        'Failed to create account';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">dusk</div>

        <div className="auth-tagline">
          where moments live
        </div>

        <h2>Create account</h2>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="choose_a_username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Bio{' '}
              <span
                style={{
                  color: 'var(--text-3)',
                  fontWeight: 300,
                }}
              >
                (optional)
              </span>
            </label>

            <textarea
              value={form.bio}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
              placeholder="A little about yourself..."
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Join Dusk'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}