import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'admin' or 'user'
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem('fgt_church_auth');
    const storedRole = localStorage.getItem('fgt_church_role');
    const storedUsername = localStorage.getItem('fgt_church_username');
    const storedFullName = localStorage.getItem('fgt_church_fullname');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setRole(storedRole || 'user');
      setUsername(storedUsername || '');
      setFullName(storedFullName || '');
    }
    setLoading(false);
  }, []);

  const login = (userRole = 'user', userName = '', userFullName = '') => {
    setIsAuthenticated(true);
    setRole(userRole);
    setUsername(userName);
    setFullName(userFullName);
    localStorage.setItem('fgt_church_auth', 'true');
    localStorage.setItem('fgt_church_role', userRole);
    localStorage.setItem('fgt_church_username', userName);
    localStorage.setItem('fgt_church_fullname', userFullName);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUsername('');
    setFullName('');
    localStorage.removeItem('fgt_church_auth');
    localStorage.removeItem('fgt_church_role');
    localStorage.removeItem('fgt_church_username');
    localStorage.removeItem('fgt_church_fullname');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#071f1b', color: 'white', fontSize: '1.2rem' }}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, username, fullName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
