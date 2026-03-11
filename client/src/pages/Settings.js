import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Lock, Search, Key, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { role, username } = useContext(AuthContext);

  // === Own Password Change ===
  const [ownForm, setOwnForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [ownMsg, setOwnMsg] = useState({ text: '', type: '' });
  const [ownLoading, setOwnLoading] = useState(false);

  // === Admin: User Search & Reset ===
  const [searchQuery, setSearchQuery] = useState('');
  const [userList, setUserList] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resetPasswords, setResetPasswords] = useState({}); // {id: newPassword}
  const [resetMsg, setResetMsg] = useState({});

  const showMsg = (setter, text, type, delay = 4000) => {
    setter({ text, type });
    setTimeout(() => setter({ text: '', type: '' }), delay);
  };

  // Handle own password change
  const handleOwnPasswordChange = async (e) => {
    e.preventDefault();
    if (ownForm.newPassword !== ownForm.confirmPassword) {
      return showMsg(setOwnMsg, 'New passwords do not match', 'error');
    }
    if (ownForm.newPassword.length < 4) {
      return showMsg(setOwnMsg, 'New password must be at least 4 characters', 'error');
    }
    setOwnLoading(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/change-password', {
        username,
        currentPassword: ownForm.currentPassword,
        newPassword: ownForm.newPassword,
        role
      });
      if (res.data.success) {
        showMsg(setOwnMsg, '✓ Password changed successfully!', 'success');
        setOwnForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showMsg(setOwnMsg, err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setOwnLoading(false);
    }
  };

  // Admin: Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      if (res.data.success) {
        const filtered = res.data.data.filter(u =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setUserList(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Admin: Reset user password
  const handleResetPassword = async (userId, username) => {
    const newPass = resetPasswords[userId];
    if (!newPass || newPass.length < 4) {
      return setResetMsg(p => ({ ...p, [userId]: { text: 'Password must be at least 4 chars', type: 'error' } }));
    }
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${userId}/password`, { newPassword: newPass });
      if (res.data.success) {
        setResetMsg(p => ({ ...p, [userId]: { text: '✓ Password updated!', type: 'success' } }));
        setResetPasswords(p => ({ ...p, [userId]: '' }));
        setTimeout(() => setResetMsg(p => ({ ...p, [userId]: { text: '', type: '' } })), 3000);
      }
    } catch (err) {
      setResetMsg(p => ({ ...p, [userId]: { text: err.response?.data?.message || 'Failed', type: 'error' } }));
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
    border: '2px solid #e5e5e5', fontSize: '0.95rem', outline: 'none',
    transition: 'border 0.2s', background: '#fafafa', color: '#333'
  };

  const MsgBox = ({ msg }) => msg.text ? (
    <div style={{
      padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginTop: '0.75rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
      color: msg.type === 'success' ? '#065f46' : '#991b1b',
      border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
    }}>
      {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg.text}
    </div>
  ) : null;

  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0d3b34', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lock size={28} /> Settings
        </h1>
        <p style={{ color: '#666' }}>Manage your account and security settings.</p>
      </div>

      {/* === OWN PASSWORD CHANGE === */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '2rem',
        border: '1px solid #e5e5e5'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0d3b34', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={20} /> Change My Password
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
          Logged in as: <strong>@{username}</strong> ({role})
        </p>

        <form onSubmit={handleOwnPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Current Password', field: 'currentPassword', placeholder: 'Enter current password' },
            { label: 'New Password', field: 'newPassword', placeholder: 'Enter new password' },
            { label: 'Confirm New Password', field: 'confirmPassword', placeholder: 'Re-type new password' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem' }}>{label}</label>
              <input
                type="password"
                value={ownForm[field]}
                onChange={e => setOwnForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder={placeholder}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0d3b34'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          ))}
          <MsgBox msg={ownMsg} />
          <button
            type="submit"
            disabled={ownLoading}
            style={{
              padding: '0.85rem', background: '#0d3b34', color: 'white', border: 'none',
              borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem',
              cursor: ownLoading ? 'not-allowed' : 'pointer', opacity: ownLoading ? 0.7 : 1,
              marginTop: '0.25rem', transition: 'all 0.2s'
            }}
          >
            {ownLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* === ADMIN: USER PASSWORD RESET === */}
      {role === 'admin' && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e5e5e5'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0d3b34', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} /> Reset a Member's Password
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by username or full name..."
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => e.target.style.borderColor = '#0d3b34'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              style={{
                padding: '0.8rem 1.5rem', background: '#0d3b34', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
              }}
            >
              <Search size={16} /> {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {userList.length === 0 && searchQuery && !searchLoading && (
            <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>No users found for "{searchQuery}"</p>
          )}

          {userList.map(user => (
            <div key={user.id} style={{
              padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e5e5e5',
              marginBottom: '0.75rem', background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#0d3b34' }}>{user.full_name || 'No name'}</span>
                  <span style={{
                    marginLeft: '0.75rem', background: '#e8f5f3', color: '#0d3b34',
                    padding: '2px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600
                  }}>@{user.username}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px', maxWidth: '340px' }}>
                  <input
                    type="password"
                    placeholder="New password"
                    value={resetPasswords[user.id] || ''}
                    onChange={e => setResetPasswords(p => ({ ...p, [user.id]: e.target.value }))}
                    style={{ ...inputStyle, flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                    onFocus={e => e.target.style.borderColor = '#0d3b34'}
                    onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                  />
                  <button
                    onClick={() => handleResetPassword(user.id, user.username)}
                    style={{
                      padding: '0.6rem 1rem', background: '#f6ad55', color: '#0d3b34',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                      fontSize: '0.88rem', whiteSpace: 'nowrap'
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>
              {resetMsg[user.id]?.text && <MsgBox msg={resetMsg[user.id]} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;
