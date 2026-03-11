import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './LandingPage.css';
import logo from '../logo.jpg';

const Home = () => {
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [headerVerseNep, setHeaderVerseNep] = useState('');
  const [headerVerseEng, setHeaderVerseEng] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Fetch generic home info
    axios.get('http://localhost:5000/api/content/home_info')
      .then(res => {
        if (res.data.success) setWelcomeMsg(res.data.data);
      })
      .catch(err => console.error(err));

    // Fetch dynamic header verses
    axios.get('http://localhost:5000/api/content/header_verse_nepali')
      .then(res => {
        if (res.data.success) setHeaderVerseNep(res.data.data);
      })
      .catch(err => console.error(err));

    axios.get('http://localhost:5000/api/content/header_verse_english')
      .then(res => {
        if (res.data.success) setHeaderVerseEng(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      console.log('Login API success:', res.data);
      if (res.data.success) {
        login('admin', res.data.username, 'Administrator');
        console.log('Context login called, navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error details:', err.response || err);
      setLoginError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoginLoading(false);
    }
  };

  const closeLoginModal = () => {
    setShowLogin(false);
    setLoginError('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="fgt-landing-wrapper">
      {/* Navbar */}
      <nav className="fgt-navbar">
        <div className="fgt-brand" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={logo} alt="FGT Logo" className="fgt-logo" />
            <span className="fgt-name">Nepalgunj FGT Church</span>
          </div>
        </div>

        <div className="fgt-nav-verse">
          <div className="verse-nepali">
            {headerVerseNep || "“हे सबै थाकेका र बोझले दबिएका हो, म कहाँ आओ; म तिमीहरूलाई विश्राम दिनेछु।”--मत्ती ११ः२८"}
          </div>
          <div className="verse-english">
            {headerVerseEng || "“Come to me, all you who are weary and burdened, and I will give you rest.” -- Matthew 11:28"}
          </div>
        </div>
      </nav>

      <section className="fgt-hero">
        <div className="fgt-hero-container">
          <div className="fgt-hero-left">
            {loading ? (
              <div className="welcome-loader"></div>
            ) : (
              <>
                <h1 className="welcome-home">Welcome Home</h1>
                {welcomeMsg && (
                  <p className="hero-custom-text">{welcomeMsg}</p>
                )}
              </>
            )}
          </div>

          <div className="fgt-hero-right">
            <div className="direct-login-card">
              <h2 className="login-title">Login</h2>

              {loginError && (
                <div className="login-error-msg">{loginError}</div>
              )}

              <form onSubmit={handleLogin}>
                <div className="login-input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="login-submit-btn"
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
