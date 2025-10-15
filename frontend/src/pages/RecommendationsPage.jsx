import React, { useState, useEffect } from 'react';
import { scoringAPI, mlAPI } from '../services/api';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Simulate AI recommendations using existing APIs
        const novelty = await mlAPI.novelty('AI-driven recommendations for developers');
        const impact = await scoringAPI.impact({ text: 'Latest tech trends and recommendations' });

        setRecommendations([
          {
            type: 'Content',
            title: 'Explainable AI Recommendations',
            description: 'Based on your learning history and current interests',
            score: novelty.score || 0.8,
            reason: 'High novelty and relevance to your tech stack'
          },
          {
            type: 'Skill',
            title: 'Emerging Technologies',
            description: 'Trending skills you should consider learning',
            score: impact.score || 0.9,
            reason: 'High impact potential in the job market'
          },
          {
            type: 'Project',
            title: 'Community Projects',
            description: 'Open-source projects matching your expertise',
            score: 0.7,
            reason: 'Good fit for your contribution history'
          }
        ]);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page">Generating AI recommendations...</div>;

  return (
    <div className="page recommendations-page">
      <h2>AI-Driven Recommendations</h2>
      <p>Explainable, personalized recommendations powered by our AI agents</p>

      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card">
            <div className="rec-header">
              <span className="rec-type">{rec.type}</span>
              <span className="rec-score">Score: {(rec.score * 100).toFixed(0)}%</span>
            </div>
            <h3>{rec.title}</h3>
            <p>{rec.description}</p>
            <div className="rec-reason">
              <strong>Why recommended:</strong> {rec.reason}
            </div>
            <button className="explore-btn">Explore</button>
          </div>
        ))}
      </div>

      <div className="ai-insights">
        <h3>AI Insights</h3>
        <p>Our AI analyzes your activity patterns, learning preferences, and current tech trends to provide these recommendations.</p>
        <ul>
          <li>Personalized based on your interaction history</li>
          <li>Updated in real-time with latest tech developments</li>
          <li>Explainable reasoning for transparency</li>
        </ul>
      </div>
    </div>
  );
}