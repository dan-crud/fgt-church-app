import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import '../index.css';

const Explore = () => {
  const [contentStatus, setContentStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [homeInfo, setHomeInfo] = useState('');
  const [headerVerseNep, setHeaderVerseNep] = useState('');
  const [headerVerseEng, setHeaderVerseEng] = useState('');

  useEffect(() => {
    fetchContent('home_info', setHomeInfo);
    fetchContent('header_verse_nepali', setHeaderVerseNep);
    fetchContent('header_verse_english', setHeaderVerseEng);
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

  const handleSaveSection = async (key, value) => {
    setIsLoading(true);
    setContentStatus({ type: '', message: '' });
    try {
      if (key === 'header_verse') {
        await Promise.all([
          axios.put(`http://localhost:5000/api/content/header_verse_nepali`, { value: headerVerseNep }),
          axios.put(`http://localhost:5000/api/content/header_verse_english`, { value: headerVerseEng })
        ]);
      } else {
        await axios.put(`http://localhost:5000/api/content/${key}`, { value });
      }
      setContentStatus({ type: 'success', message: 'Message saved successfully!' });
    } catch (err) {
      setContentStatus({ type: 'error', message: 'Failed to save changes.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setContentStatus({ type: '', message: '' }), 4000);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2>Explore & CMS</h2>
        <p style={{ color: 'var(--text-light)' }}>Manage the welcome message and header verses on your public website.</p>
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
        <button className="btn btn-sm" onClick={() => handleSaveSection('home_info', homeInfo)} disabled={isLoading}>
          <Save size={16} /> {isLoading ? 'Saving...' : 'Save Welcome Message'}
        </button>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <h3>Navbar Header Verse</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'gray' }}>This message appears on the top-right of your main landing page.</p>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nepali Verse</label>
          <input
            type="text"
            className="form-group"
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-lighter)', color: 'white' }}
            value={headerVerseNep}
            onChange={(e) => setHeaderVerseNep(e.target.value)}
            placeholder="Enter Nepali verse..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>English Verse</label>
          <input
            type="text"
            className="form-group"
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-lighter)', color: 'white' }}
            value={headerVerseEng}
            onChange={(e) => setHeaderVerseEng(e.target.value)}
            placeholder="Enter English verse..."
          />
        </div>

        <button 
          className="btn btn-sm" 
          onClick={() => handleSaveSection('header_verse')} 
          disabled={isLoading}
          style={{ backgroundColor: 'var(--success-color)' }}
        >
          <Save size={16} /> {isLoading ? 'Saving...' : 'Save Header Verses'}
        </button>
      </div>
    </div>
  );
};

export default Explore;
