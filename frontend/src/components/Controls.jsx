import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Controls = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const views = [
    { id: 'feed', label: 'Feed', path: '/feed', icon: '📱' },
    { id: 'graph', label: 'Knowledge Graph', path: '/graph', icon: '🕸️' },
    { id: 'pds', label: 'PDS Dashboard', path: '/pds', icon: '🔗' },
    { id: 'github', label: 'GitHub', path: '/github', icon: '🐙' },
    { id: 'users', label: 'Users', path: '/users', icon: '👥' },
    { id: 'projectHub', label: 'Project Hub', path: '/project-hub', icon: '💬' },
  ];

  // optionally add profile link
  if (isAuthenticated) {
    views.push({ id: 'profile', label: 'Profile', path: '/profile', icon: '👤' });
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="mobile-nav-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen((s) => !s)}
      >
        ☰
      </button>

      <div className={`controls-container ${mobileOpen ? 'open' : ''}`}>
        <div className="controls-header">
          <h3>Navigation</h3>
          <div style={{ marginTop: 8 }}>
            {!isAuthenticated ? (
              <button onClick={() => loginWithRedirect()} className="view-btn">Login</button>
            ) : (
              <button onClick={() => logout({ returnTo: window.location.origin })} className="view-btn">Logout</button>
            )}
          </div>
        </div>
        <div className="view-buttons">
          {views.map((view) => (
            <Link
              key={view.id}
              to={view.path}
              className={`view-btn ${location.pathname === view.path ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="view-icon">{view.icon}</span>
              <span className="view-label">{view.label}</span>
            </Link>
          ))}
        </div>

        <div className="controls-info">
          <div className="info-item">
            <h4>Techbit Platform</h4>
            <p>AI-powered tech discovery and collaboration</p>
          </div>
          <div className="info-item">
            <h4>Features</h4>
            <ul>
              <li>🎯 Smart Feed Ranking</li>
              <li>🧠 Knowledge Graph</li>
              <li>🔗 P2P Data Sync</li>
              <li>📊 GitHub Analytics</li>
              <li>👥 User Collaboration</li>
            </ul>
          </div>
        </div>
      </div>
      {/* overlay for mobile when open */}
      {mobileOpen && <div className="mobile-nav-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
};

export default Controls;