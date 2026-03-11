import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import '../index.css';

const Explore = () => {
  const [contentStatus, setContentStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [homeInfo, setHomeInfo] = useState('');

  useEffect(() => {
    fetchContent('home_info', setHomeInfo);
  }, []);

  const fetchContent = async (key, setter) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/content/${key}`);
      if (res.data.success) {
        setter(res.data.data);
      }
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
    }
  };

  const handleContentSave = async (key, value) => {
    setIsLoading(true);
    setContentStatus({ type: '', message: '' });
    try {
      const res = await axios.put(`http://localhost:5000/api/content/${key}`, { value });
      if (res.data.success) {
        setContentStatus({ type: 'success', message: 'Content updated successfully!' });
      }
    } catch (err) {
      setContentStatus({ type: 'error', message: 'Failed to update content.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setContentStatus({ type: '', message: '' }), 3000);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2>Explore & CMS</h2>
        <p style={{ color: 'var(--text-light)' }}>Manage the welcome message on your public website.</p>
      </div>

      {contentStatus.message && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: contentStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: contentStatus.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          border: `1px solid ${contentStatus.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
        }}>
          {contentStatus.message}
        </div>
      )}

      <div className="glass-panel" style={{ maxWidth: '800px' }}>
        <h3>Home Page Message</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'gray' }}>This message appears below "Welcome Home" on the main page.</p>
        <textarea
          className="form-group"
          style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-lighter)', color: 'white', marginBottom: '1rem' }}
          value={homeInfo}
          onChange={(e) => setHomeInfo(e.target.value)}
          placeholder="Enter a welcome message for visitors..."
        />
        <button className="btn" onClick={() => handleContentSave('home_info', homeInfo)} disabled={isLoading}>
          <Save size={18} /> {isLoading ? 'Saving...' : 'Save Message'}
        </button>
      </div>
    </div>
  );
};

export default Explore;
