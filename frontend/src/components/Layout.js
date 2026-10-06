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
  Activity,
  UserPlus,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'doctor' ? [
    { path: '/doctor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patient Directory' },
    { path: '/add-patients', icon: UserPlus, label: 'Assign Patients' },
    { path: '/alerts', icon: Bell, label: 'System Alerts' },
  ] : [
    { path: '/patient-dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/records', icon: History, label: 'Health History' },
    { path: '/devices', icon: Cpu, label: 'Monitoring Devices' },
    { path: '/generate-report', icon: FileText, label: 'Health Report' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ background: '#0284c7', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em' }}>HealthConnect</h2>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Rural Health Portal</p>
          </div>
        </div>
        
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem 0.5rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{user?.full_name}</p>
            <span style={{ 
              display: 'inline-block', 
              marginTop: '0.25rem',
              fontSize: '0.7rem', 
              color: user?.role === 'doctor' ? '#38bdf8' : '#4ade80',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {user?.role === 'doctor' ? 'Healthcare Provider' : 'Patient'}
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            className="nav-link" 
            style={{ 
              width: '100%', 
              border: 'none', 
              background: 'transparent', 
              cursor: 'pointer',
              justifyContent: 'flex-start',
              color: '#f87171',
              padding: '0.6rem 0.75rem'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
