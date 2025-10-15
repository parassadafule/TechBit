import React, { useState } from 'react';
import { githubAPI } from '../services/api';

const GitHubIntegration = () => {
  const [repoQuery, setRepoQuery] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [multipleRepos, setMultipleRepos] = useState('');
  const [multipleReposData, setMultipleReposData] = useState([]);
  const [topRepos, setTopRepos] = useState([]);
  const [topLimit, setTopLimit] = useState(5);
  const [topSortBy, setTopSortBy] = useState('stars');
  const [loading, setLoading] = useState(false);

  const handleGetRepo = async () => {
    if (!repoQuery.trim()) return;

    setLoading(true);
    try {
      const data = await githubAPI.getRepo(repoQuery);
      setRepoData(data);
    } catch (error) {
      alert('Failed to fetch repository data');
      console.error('Repo fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMultipleRepos = async () => {
    const repos = multipleRepos.split('\n').map(repo => repo.trim()).filter(repo => repo);
    if (repos.length === 0) return;

    setLoading(true);
    try {
      const data = await githubAPI.getMultipleRepos(repos);
      setMultipleReposData(data.repositories || []);
    } catch (error) {
      alert('Failed to fetch multiple repositories');
      console.error('Multiple repos fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTopRepos = async () => {
    setLoading(true);
    try {
      const data = await githubAPI.getTopRepos(topLimit, topSortBy);
      setTopRepos(data.top || []);
    } catch (error) {
      alert('Failed to fetch top repositories');
      console.error('Top repos fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRepoHealth = async (repo) => {
    try {
      const healthData = await githubAPI.getRepoHealth(repo);
      // Update the repo data with health information
      if (repoData && repoData.repo === repo) {
        setRepoData(prev => ({ ...prev, healthScore: healthData.healthScore, rating: healthData.rating }));
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'rating-excellent';
      case 'good': return 'rating-good';
      case 'fair': return 'rating-fair';
      case 'poor': return 'rating-poor';
      default: return '';
    }
  };

  return (
    <div className="github-container">
      <div className="github-header">
        <h2>GitHub Integration</h2>
      </div>

      <div className="github-grid">
        {/* Single Repository Lookup */}
        <div className="github-card">
          <h3>Repository Lookup</h3>
          <div className="repo-input">
            <input
              type="text"
              placeholder="owner/repo (e.g., facebook/react)"
              value={repoQuery}
              onChange={(e) => setRepoQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGetRepo()}
            />
            <button onClick={handleGetRepo} disabled={loading}>
              {loading ? 'Loading...' : 'Get Stats'}
            </button>
          </div>

          {repoData && (
            <div className="repo-stats">
              <h4>{repoData.repo}</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">⭐ Stars:</span>
                  <span className="stat-value">{repoData.forks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">🍴 Forks:</span>
                  <span className="stat-value">{repoData.forks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">🐛 Issues:</span>
                  <span className="stat-value">{repoData.issues}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">👥 Contributors:</span>
                  <span className="stat-value">{repoData.contributors}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">📅 Last Update:</span>
                  <span className="stat-value">{repoData.lastUpdate}</span>
                </div>
              </div>

              <div className="health-check">
                <button onClick={() => handleGetRepoHealth(repoData.repo)}>
                  Check Health Score
                </button>
                {repoData.healthScore && (
                  <div className="health-result">
                    <span className="health-score">Health: {repoData.healthScore}</span>
                    <span className={`health-rating ${getRatingColor(repoData.rating)}`}>
                      {repoData.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Multiple Repositories */}
        <div className="github-card">
          <h3>Multiple Repositories</h3>
          <div className="multiple-repos-input">
            <textarea
              placeholder="Enter one repository per line (owner/repo format)"
              value={multipleRepos}
              onChange={(e) => setMultipleRepos(e.target.value)}
              rows={5}
            />
            <button onClick={handleGetMultipleRepos} disabled={loading}>
              {loading ? 'Loading...' : 'Get Stats'}
            </button>
          </div>

          {multipleReposData.length > 0 && (
            <div className="multiple-repos-results">
              <h4>Results ({multipleReposData.length} repositories)</h4>
              <div className="repos-list">
                {multipleReposData.map((repo, index) => (
                  <div key={index} className="repo-item">
                    <h5>{repo.repo}</h5>
                    <div className="repo-stats-compact">
                      <span>⭐ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                      <span>🐛 {repo.issues}</span>
                      <span>👥 {repo.contributors}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Repositories */}
        <div className="github-card">
          <h3>Top Repositories</h3>
          <div className="top-repos-controls">
            <div className="control-group">
              <label>Limit:</label>
              <select value={topLimit} onChange={(e) => setTopLimit(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="control-group">
              <label>Sort by:</label>
              <select value={topSortBy} onChange={(e) => setTopSortBy(e.target.value)}>
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="contributors">Contributors</option>
              </select>
            </div>
            <button onClick={handleGetTopRepos} disabled={loading}>
              {loading ? 'Loading...' : 'Get Top Repos'}
            </button>
          </div>

          {topRepos.length > 0 && (
            <div className="top-repos-list">
              <h4>Top {topLimit} by {topSortBy}</h4>
              {topRepos.map((repo, index) => (
                <div key={index} className="top-repo-item">
                  <div className="repo-rank">#{index + 1}</div>
                  <div className="repo-info">
                    <h5>{repo.repo}</h5>
                    <div className="repo-metrics">
                      <span>⭐ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                      <span>🐛 {repo.issues}</span>
                      <span>👥 {repo.contributors}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;