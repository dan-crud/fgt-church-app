import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LayoutDashboard, UserPlus, FileSpreadsheet, Image as ImageIcon, CreditCard, LogOut, Globe, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import './index.css';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NewRegistration from './pages/NewRegistration';
import Reports from './pages/Reports';
import Photo from './pages/Photo';
import GenerateCard from './pages/GenerateCard';
import Explore from './pages/Explore';
import Settings from './pages/Settings';


// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = React.useContext(AuthContext);
  console.log('ProtectedRoute - Auth Status:', { isAuthenticated, role });
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// Sidebar Layout Wrapper
const DashboardLayout = ({ children }) => {
  const { logout, role, username } = React.useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'user'] },
    { path: '/explore', label: 'Explore (CMS)', icon: <Globe size={18} />, roles: ['admin'] },
    { path: '/new-registration', label: 'New Registration', icon: <UserPlus size={18} />, roles: ['admin', 'user'] },
    { path: '/photo', label: 'Photo', icon: <ImageIcon size={18} />, roles: ['admin', 'user'] },
    { path: '/generate-card', label: 'Generate Card', icon: <CreditCard size={18} />, roles: ['admin', 'user'] },
    { path: '/reports', label: 'Reports', icon: <FileSpreadsheet size={18} />, roles: ['admin', 'user'] },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon size={18} />, roles: ['admin', 'user'] },
  ];

  // If role is null, we might be in a mid-state sync. Wait for it.
  const navItems = role ? allNavItems.filter(item => item.roles.includes(role)) : [];

  return (
    <div className={`dashboard-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Toggle Button */}
      <button 
        className="sidebar-toggle-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2 className="text-gradient" style={{ fontSize: '1.2rem' }}>Nepalgunj FGT Church</h2>
          <div style={{ marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              {username && `@${username}`}
            </span>
            <span style={{
              marginLeft: '0.4rem', fontSize: '0.65rem', padding: '1px 7px',
              borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
              background: role === 'admin' ? '#f6ad55' : 'rgba(255,255,255,0.15)',
              color: role === 'admin' ? '#0d3b34' : 'white'
            }}>{role}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
        <footer style={{ 
          marginTop: '4rem',
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.85rem',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          @2026 Nepalgunj FGT Church . All rights reserved.
        </footer>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><DashboardLayout><Explore /></DashboardLayout></ProtectedRoute>} />
          <Route path="/new-registration" element={<ProtectedRoute><DashboardLayout><NewRegistration /></DashboardLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/photo" element={<ProtectedRoute><DashboardLayout><Photo /></DashboardLayout></ProtectedRoute>} />
          <Route path="/generate-card" element={<ProtectedRoute><DashboardLayout><GenerateCard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
