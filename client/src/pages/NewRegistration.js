import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import nepalify from 'nepalify';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const NewRegistration = () => {
  const currentYear = new Date().getFullYear();
  const [churchUsers, setChurchUsers] = useState([]);
  const { role, username, fullName } = useContext(AuthContext);
  const currentUser = { role, username, fullName };

  useEffect(() => {
    // Fetch all church users for dropdown

    // Fetch all church users for dropdown
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');
        if (res.data.success) {
          setChurchUsers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  // Helper to convert Nepali digits to English digits
  const nepaliToEnglish = (nepaliNumberStr) => {
    if (!nepaliNumberStr) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(nepaliNumberStr).split('').map(char => {
      const index = nepaliDigits.indexOf(char);
      return index !== -1 ? index : char;
    }).join('');
  };
  const months = [
    "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
    "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
  ];
  const years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    amount: '',
    year: currentYear.toString(),
    month: months[new Date().getMonth()]
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [isNepaliMode, setIsNepaliMode] = useState(true);

  const handleNameChange = (e) => {
    const rawVal = e.target.value;
    const finalVal = nepalify.format(rawVal);
    setFormData({ ...formData, name: finalVal });
  };

  const handleEnglishNameChange = (e) => {
    setFormData({ ...formData, name_en: e.target.value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For amount and year, format to Nepali numbers if mode is active
    let finalVal = value;
    if (isNepaliMode && (name === 'amount' || name === 'year')) {
      finalVal = nepalify.format(value);
    }
    setFormData({ ...formData, [name]: finalVal });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const submissionData = { ...formData };
      if (isNepaliMode && submissionData.amount) {
        // ensure amount is formatted back to standard english digits for MySQL DECIMAL type
        submissionData.amount = nepaliToEnglish(submissionData.amount);
      }

      const res = await axios.post('http://localhost:5000/api/donations', submissionData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Church Tithe registered successfully!' });
        setFormData({ ...formData, name: '', name_en: '', amount: '' }); // reset inputs
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save record'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>New Tithe Registration</h2>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        {status.message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
            border: `1px solid ${status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>वर्ष (Year)</label>
              <select name="year" value={formData.year} onChange={handleChange} required>
                {years.map(y => (
                  <option key={y} value={y}>{nepalify.format(y)}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>महिना (Month)</label>
              <select name="month" value={formData.month} onChange={handleChange} required>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Member Name (In Nepali)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Type in Roman English (e.g. ram -> राम)"
                required
              />
            </div>

            <div className="form-group">
              <label>Member Name (In English)</label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleEnglishNameChange}
                placeholder="e.g. Ram Bahadur Thapa"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>रकम (Amount)</label>
            <input
              type="text"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder={isNepaliMode ? "५०००" : "5000"}
              required
            />
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewRegistration;
