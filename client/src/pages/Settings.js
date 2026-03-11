import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { role, username } = useContext(AuthContext);

  // === Own Password Change ===
  const [ownForm, setOwnForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [ownMsg, setOwnMsg] = useState({ text: '', type: '' });
  const [ownLoading, setOwnLoading] = useState(false);

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

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px',
    border: '1px solid var(--border-color)', fontSize: '0.85rem', outline: 'none',
    transition: 'all 0.2s', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)'
  };

  const MsgBox = ({ msg }) => msg.text ? (
    <div style={{
      padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', marginTop: '0.75rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: msg.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
      color: msg.type === 'success' ? '#34c759' : '#ff3b30',
      border: `1px solid ${msg.type === 'success' ? '#34c759' : '#ff3b30'}`
    }}>
      {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {msg.text}
    </div>
  ) : null;

  return (
    <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Settings</h2>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} /> Change Password
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          Logged in as: <strong>@{username}</strong> ({role})
        </p>

        <form onSubmit={handleOwnPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {[
            { label: 'Current Password', field: 'currentPassword', placeholder: 'Enter current password' },
            { label: 'New Password', field: 'newPassword', placeholder: 'Enter new password' },
            { label: 'Confirm New Password', field: 'confirmPassword', placeholder: 'Re-type new password' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{label}</label>
              <input
                type="password"
                value={ownForm[field]}
                onChange={e => setOwnForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder={placeholder}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          ))}
          <MsgBox msg={ownMsg} />
          <button
            type="submit"
            className="btn btn-sm"
            disabled={ownLoading}
            style={{
              padding: '0.7rem', width: '100%', justifyContent: 'center',
              marginTop: '0.5rem'
            }}
          >
            {ownLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
