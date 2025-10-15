import React, { useEffect, useState } from 'react';
import { feedAPI } from '../services/api';

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ limit: 10, offset: 0, sortBy: 'score', filterTags: '' });
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await feedAPI.getFeed({ ...filters, filterTags: filters.filterTags });
        setFeed(res.feed || []);
        const t = await feedAPI.getTrending();
        setTrending(t.trending || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return (
    <div className="page feed-page">
      <h2>AI-Curated Tech Feed</h2>
      <p>Discover personalized, AI-summarized content from blogs, videos, and repositories with semantic tagging</p>
      <div className="controls">
        <select value={filters.sortBy} onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
          <option value="score">Score</option>
          <option value="timestamp">Time</option>
          <option value="likes">Likes</option>
        </select>
        <input value={filters.filterTags} placeholder="tags" onChange={e => setFilters(f => ({ ...f, filterTags: e.target.value }))} />
      </div>
      {loading ? <div>Loading...</div> : (
        <div>
          <div className="trending">
            {trending.map((t, i) => (
              <button key={i} onClick={() => setFilters(f => ({ ...f, filterTags: (f.filterTags ? f.filterTags + ', ' : '') + t.tag }))}>#{t.tag}</button>
            ))}
          </div>
          <div className="feed-list">
            {feed.map(item => (
              <div key={item.post.id} className="post ai-curated-post">
                <div className="head">
                  <span className="author">{item.post.author}</span>
                  <span className="ai-score">AI Score: {item.scores.total}</span>
                  <span className="ai-badge">AI-Curated</span>
                </div>
                <div className="body">
                  <div className="content-summary">{item.post.text}</div>
                  <div className="semantic-tags">
                    {item.post.tags?.map(tag => (
                      <span key={tag} className="semantic-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="ai-insights">
                  <span>Novelty: {(item.scores.novelty * 100).toFixed(0)}%</span>
                  <span>Impact: {(item.scores.impact * 100).toFixed(0)}%</span>
                  <span>Relevance: High</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


