import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Check } from 'lucide-react';

const Photo = () => {
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCurrentTemplate();
  }, []);

  const fetchCurrentTemplate = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/template');
      if (res.data.success && res.data.path) {
        // Append timestamp to break browser cache
        setCurrentTemplate(`http://localhost:5000${res.data.path}?t=${new Date().getTime()}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('templateImage', file);

    try {
      const res = await axios.post('http://localhost:5000/api/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMessage('Template uploaded successfully!');
        fetchCurrentTemplate();
      }
    } catch (err) {
      setMessage('Failed to upload template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Thank You Card Template</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        <div className="glass-panel text-center">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Upload New Template</h3>
          
          <div className="upload-area" onClick={() => fileInputRef.current.click()}>
            <Upload size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
            <p>Click or drag image to upload template background.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              We recommend 1920x1080 or equivalent horizontal 16:9 ratio.
            </p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleUpload}
            />
          </div>
          
          {loading && <p style={{ marginTop: '1rem', color: 'var(--accent-hover)' }}>Uploading...</p>}
          {message && (
            <p style={{ marginTop: '1rem', color: message.includes('success') ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {message.includes('success') && <Check size={16} />} {message}
            </p>
          )}
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Current Active Template</h3>
          {currentTemplate ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={currentTemplate} alt="Current template" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              No template uploaded yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Photo;
