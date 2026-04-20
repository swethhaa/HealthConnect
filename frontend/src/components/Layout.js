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
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/add-patients', icon: UserPlus, label: 'Add Patients' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
  ] : [
    { path: '/patient-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/records', icon: History, label: 'Health Records' },
    { path: '/devices', icon: Cpu, label: 'Devices' },
    { path: '/generate-report', icon: FileText, label: 'Generate Report' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 1rem' }}>
          <Activity size={32} color="var(--primary)" />
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.25rem' }}>RuralHealth</h2>
        </div>
        
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ marginBottom: '1rem', padding: '0 1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={20} />
            Logout
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
