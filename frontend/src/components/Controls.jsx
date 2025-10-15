import React from 'react';

const Controls = ({ activeView, onViewChange }) => {
  const views = [
    { id: 'feed', label: 'Feed', icon: '📱' },
    { id: 'graph', label: 'Knowledge Graph', icon: '🕸️' },
    { id: 'pds', label: 'PDS Dashboard', icon: '🔗' },
    { id: 'github', label: 'GitHub', icon: '🐙' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'projectHub', label: 'Project Hub', icon: '💬' },
  ];

  return (
    <div className="controls-container">
      <div className="controls-header">
        <h3>Navigation</h3>
      </div>
      <div className="view-buttons">
        {views.map((view) => (
          <button
            key={view.id}
            className={`view-btn ${activeView === view.id ? 'active' : ''}`}
            onClick={() => onViewChange(view.id)}
          >
            <span className="view-icon">{view.icon}</span>
            <span className="view-label">{view.label}</span>
          </button>
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
  );
};

export default Controls;