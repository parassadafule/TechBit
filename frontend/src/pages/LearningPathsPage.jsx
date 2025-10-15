import React, { useState, useEffect } from 'react';
import { ragAPI } from '../services/api';

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // This would be a new API endpoint for learning paths
        // For now, using RAG to simulate
        const data = await ragAPI.retrieve('learning paths for developers');
        setPaths(data.results || []);
      } catch (error) {
        console.error('Failed to load learning paths:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page">Loading personalized learning paths...</div>;

  return (
    <div className="page learning-paths-page">
      <h2>Personalized Learning Paths</h2>
      <p>AI-curated learning journeys tailored to your goals and current skill level</p>

      <div className="learning-paths-grid">
        {paths.length === 0 ? (
          <div className="empty-state">
            <h3>Start Your Learning Journey</h3>
            <p>Our AI will analyze your interests and create personalized learning paths based on current tech trends.</p>
          </div>
        ) : (
          paths.map((path, index) => (
            <div key={index} className="learning-path-card">
              <h3>{path.title || 'Learning Path'}</h3>
              <p>{path.description || 'AI-generated learning path'}</p>
              <div className="path-steps">
                {/* Placeholder for path steps */}
                <div className="step">Step 1: Fundamentals</div>
                <div className="step">Step 2: Core Concepts</div>
                <div className="step">Step 3: Advanced Topics</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}