import React, { useState, useEffect } from 'react';
import { feedAPI } from '../services/api';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    limit: 10,
    offset: 0,
    sortBy: 'score',
    filterTags: '',
  });
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    loadFeed();
    loadTrendingTags();
  }, [filters]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        filterTags: filters.filterTags ? filters.filterTags.split(',').map(tag => tag.trim()) : [],
      };
      const response = await feedAPI.getFeed(params);
      setPosts(response.feed || []);
      setError(null);
    } catch (err) {
      setError('Failed to load feed');
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingTags = async () => {
    try {
      const response = await feedAPI.getTrending();
      setTrendingTags(response.trending || []);
    } catch (err) {
      console.error('Trending tags load error:', err);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handleTagClick = (tag) => {
    const currentTags = filters.filterTags ? filters.filterTags.split(',').map(t => t.trim()) : [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleFilterChange({ filterTags: newTags.join(', ') });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="feed-container">
        <div className="loading">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Tech Feed</h2>
        <div className="feed-controls">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
          >
            <option value="score">Sort by Score</option>
            <option value="timestamp">Sort by Time</option>
            <option value="likes">Sort by Likes</option>
          </select>
          <input
            type="text"
            placeholder="Filter by tags (comma separated)"
            value={filters.filterTags}
            onChange={(e) => setFilters(prev => ({ ...prev, filterTags: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && handleFilterChange({})}
          />
          <button onClick={() => handleFilterChange({})}>Apply Filters</button>
        </div>
      </div>

      {trendingTags.length > 0 && (
        <div className="trending-tags">
          <h3>Trending Tags:</h3>
          <div className="tags">
            {trendingTags.slice(0, 10).map((tag, index) => (
              <span
                key={index}
                className={`tag ${filters.filterTags.includes(tag.tag) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag.tag)}
              >
                #{tag.tag} ({tag.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="posts">
        {posts.map((item) => (
          <div key={item.post.id} className="post-card">
            <div className="post-header">
              <div className="author-info">
                <span className="author">{item.post.author}</span>
                <span className="timestamp">{formatTimestamp(item.post.timestamp)}</span>
              </div>
              <div className="post-score">
                <span className="score">Score: {item.score.toFixed(2)}</span>
                <div className="score-breakdown">
                  <span>Novelty: {item.scores.novelty}</span>
                  <span>Impact: {item.scores.impact}</span>
                </div>
              </div>
            </div>

            <div className="post-content">
              <p>{item.post.text}</p>
            </div>

            <div className="post-meta">
              <div className="tags">
                {item.post.tags.map((tag, index) => (
                  <span key={index} className="tag" onClick={() => handleTagClick(tag)}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="engagement">
                <span>❤️ {item.post.likes}</span>
                <span>💬 {item.post.comments}</span>
                <span>🔄 {item.post.shares}</span>
              </div>

              {item.post.repo && (
                <div className="repo-link">
                  <a href={`https://github.com/${item.post.repo}`} target="_blank" rel="noopener noreferrer">
                    📁 {item.post.repo}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="no-posts">No posts found matching your criteria.</div>
      )}

      <div className="pagination">
        <button
          onClick={() => handleFilterChange({ offset: Math.max(0, filters.offset - filters.limit) })}
          disabled={filters.offset === 0}
        >
          Previous
        </button>
        <span>Page {Math.floor(filters.offset / filters.limit) + 1}</span>
        <button
          onClick={() => handleFilterChange({ offset: filters.offset + filters.limit })}
          disabled={posts.length < filters.limit}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Feed;