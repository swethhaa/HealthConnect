import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  LayoutDashboard, 
  History, 
  Bell, 
  Cpu, 
  LogOut, 
  Users,
  UserPlus,
  FileText,
  Activity,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'doctor' ? [
    { path: '/doctor-dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/patients', icon: Users, label: 'Patient Directory' },
    { path: '/add-patients', icon: UserPlus, label: 'Assign Patients' },
    { path: '/alerts', icon: Bell, label: 'System Alerts' },
  ] : [
    { path: '/patient-dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/records', icon: History, label: 'Health Records' },
    { path: '/devices', icon: Cpu, label: 'Monitoring Devices' },
    { path: '/generate-report', icon: FileText, label: 'Health Report' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="app-layout">
      {/* Slim Teal Vertical Rail Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.25rem' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.18)', 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Activity size={20} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.01em' }}>
              HealthConnect
            </h2>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Rural Health Portal
            </p>
          </div>
        </div>

        {/* Navigation Destination Links */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Sign Out Section */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem', 
            padding: '0.6rem 0.75rem', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '8px',
            marginBottom: '0.75rem'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#FFFFFF', 
              color: 'var(--primary-deep)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0
            }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: '#FFFFFF', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {user?.full_name}
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '0.7rem', 
                color: 'rgba(255, 255, 255, 0.8)', 
                textTransform: 'uppercase',
                fontWeight: 500,
                letterSpacing: '0.04em'
              }}>
                {user?.role === 'doctor' ? 'Healthcare Provider' : 'Patient'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            type="button"
            className="nav-link" 
            style={{ 
              width: '100%', 
              border: 'none', 
              background: 'transparent', 
              cursor: 'pointer',
              justifyContent: 'flex-start',
              color: '#FFB8B8',
              padding: '0.55rem 0.75rem',
              fontSize: '0.85rem'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Pale Aqua Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
