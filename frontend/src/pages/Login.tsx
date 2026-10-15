import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Map, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--color-bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-header" style={{ textAlign: 'center', borderBottom: 'none', paddingBottom: '8px' }}>
          <div className="sidebar-logo" style={{ margin: '0 auto 16px', width: '48px', height: '48px' }}>
            <Map className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>GeoTrace GIS</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sign in to your account</p>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail className="w-5 h-5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)', strokeWidth: 2 }} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-5 h-5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)', strokeWidth: 2, pointerEvents: 'none' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '44px', width: '100%' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}