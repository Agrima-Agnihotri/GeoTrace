import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  Settings,
  Camera,
  Satellite,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Map View', href: '/map', icon: Map },
  { name: 'Capture', href: '/capture', icon: Camera },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Desktop-only navigation items (hidden on mobile since they're in bottom nav)
const desktopOnlyNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Map View', href: '/map', icon: Map },
  { name: 'Capture', href: '/capture', icon: Camera },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || 'U';

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isMobile && (
        <aside
          className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
          style={{ 
            width: collapsed ? '72px' : 'var(--sidebar-width)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 50,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease, width 0.3s ease',
          }}
        >
          <div className="sidebar-header" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="sidebar-logo">
              <Satellite className="w-5 h-5" strokeWidth={2.5} />
            </div>
            {!collapsed && <span className="sidebar-title" style={{ fontWeight: 600, fontSize: '1.125rem' }}>GeoTrace GIS</span>}
          </div>
          <nav className="sidebar-nav" role="navigation" aria-label="Main navigation" style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
            <div className="nav-section">
              {!collapsed && <h3 className="nav-section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '12px', letterSpacing: '0.05em' }}>Main</h3>}
              {desktopOnlyNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.name : undefined}
                  aria-label={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: isActive(item.href) ? 'var(--color-primary-light)' : 'transparent',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    width: '100%',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all var(--transition)',
                    minHeight: '48px',
                  }}
                >
                  <item.icon className="w-5 h-5" strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
            {!collapsed ? (
              <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="user-avatar" style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="user-name" style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}>
                    {user?.full_name || user?.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '8px', minHeight: '48px', minWidth: '48px' }}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', minHeight: '48px' }}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </aside>
      )}

      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      <div 
        className="main-content" 
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isMobile ? 0 : (collapsed ? '72px' : 'var(--sidebar-width)'),
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
        }}
      >
        <header 
          className="header" 
          style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '56px',
          }}
        >
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-sm btn-outline"
              style={{ 
                display: isMobile ? 'flex' : 'none', 
                minHeight: '48px', 
                minWidth: '48px',
                padding: '8px',
              }}
              aria-label="Toggle navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn btn-sm btn-outline"
              style={{ 
                display: isMobile ? 'none' : 'flex',
                minHeight: '48px', 
                minWidth: '48px',
                padding: '8px',
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" strokeWidth={2} /> : <ChevronLeft className="w-5 h-5" strokeWidth={2} />}
            </button>
            {!isMobile && !collapsed && (
              <span className="sidebar-title" style={{ fontWeight: 600, fontSize: '1.125rem' }}>GeoTrace GIS</span>
            )}
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="user-avatar" style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'var(--color-primary)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 600,
                fontSize: '0.75rem',
              }}>
                {initials}
              </div>
              <span className="user-name" style={{ display: isMobile ? 'none' : 'block', fontWeight: 500, fontSize: '0.875rem' }}>
                {user?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline"
                style={{ padding: '8px', minHeight: '48px', minWidth: '48px' }}
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        <main 
          className="page-content" 
          role="main" 
          style={{ 
            flex: 1,
            padding: isMobile ? '16px' : '24px',
            maxWidth: isMobile ? '100%' : '1200px',
            width: '100%',
            margin: '0 auto',
            paddingBottom: isMobile ? '100px' : '24px',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Global Bottom Navigation Bar - Always visible on mobile for all routes */}
      {isMobile && (
        <nav 
          className="bottom-nav" 
          role="navigation" 
          aria-label="Bottom navigation"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          }}
        >
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-light)',
                textDecoration: 'none',
                fontSize: '0.7rem',
                fontWeight: 500,
                minWidth: '60px',
                transition: 'color 0.2s ease',
              })}
            >
              <item.icon 
                className="w-6 h-6" 
                strokeWidth={2.5} 
                style={{ 
                  color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text-light)' 
                }} 
              />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}