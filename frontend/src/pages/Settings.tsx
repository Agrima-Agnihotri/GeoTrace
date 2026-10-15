import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { User as UserIcon, Shield, Bell, Palette, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    project_updates: true,
    review_requests: true,
    weekly_digest: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    map_style: 'osm' as 'osm' | 'satellite' | 'topo',
  });

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.updateProfile({ full_name: profile.full_name });
      showMessage('success', 'Profile updated successfully');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      showMessage('error', axiosError.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword(passwords.current, passwords.new);
      showMessage('success', 'Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      showMessage('error', axiosError.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        <aside className="card" style={{ height: 'fit-content' }}>
          <div className="card-body" style={{ padding: '16px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all var(--transition)',
                  }}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={2} />
                  {tab.label}
                </button>
              ))}
            </nav>
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={logout}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                <UserIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main>
          {success && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Profile Information</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label htmlFor="full_name" className="form-label">Full Name</label>
                    <input
                      id="full_name"
                      type="text"
                      className="form-input"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      value={profile.email}
                      disabled
                      style={{ background: 'var(--color-bg)', cursor: 'not-allowed' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      id="role"
                      className="form-select"
                      value={profile.role}
                      disabled
                      style={{ background: 'var(--color-bg)', cursor: 'not-allowed' }}
                    >
                      <option value="admin">Administrator</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="contractor">Contractor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      Role is assigned by administrators.
                    </p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <> <Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Change Password</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label htmlFor="current_password" className="form-label">Current Password</label>
                    <input
                      id="current_password"
                      type="password"
                      className="form-input"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new_password" className="form-label">New Password</label>
                    <input
                      id="new_password"
                      type="password"
                      className="form-input"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      Must be at least 8 characters.
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
                    <input
                      id="confirm_password"
                      type="password"
                      className="form-input"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <> <Save className="w-4 h-4" /> Change Password</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Notification Preferences</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(notifications).map(([key, value]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {key === 'email_notifications' && 'Receive email notifications for important updates'}
                          {key === 'project_updates' && 'Get notified when projects are updated'}
                          {key === 'review_requests' && 'Notifications for review requests and status changes'}
                          {key === 'weekly_digest' && 'Weekly summary of project activity'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Appearance</h2>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="theme" className="form-label">Theme</label>
                  <select
                    id="theme"
                    className="form-select"
                    value={appearance.theme}
                    onChange={(e) => setAppearance({ ...appearance, theme: e.target.value as any })}
                  >
                    <option value="system">System Default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="map_style" className="form-label">Default Map Style</label>
                  <select
                    id="map_style"
                    className="form-select"
                    value={appearance.map_style}
                    onChange={(e) => setAppearance({ ...appearance, map_style: e.target.value as any })}
                  >
                    <option value="osm">OpenStreetMap</option>
                    <option value="satellite">Satellite</option>
                    <option value="topo">Topographic</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}