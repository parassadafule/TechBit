import React, { useState, useEffect } from 'react';
import { graphAPI } from '../services/api';

const KnowledgeGraph = () => {
  const [graphStatus, setGraphStatus] = useState(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    loadGraphStatus();
    loadKnowledgeGaps();
  }, []);

  const loadGraphStatus = async () => {
    try {
      const status = await graphAPI.getStatus();
      setGraphStatus(status);
    } catch (error) {
      console.error('Failed to load graph status:', error);
    }
  };

  const loadKnowledgeGaps = async () => {
    try {
      const gaps = await graphAPI.getGaps({ limit: 10 });
      setKnowledgeGaps(gaps.gaps || []);
    } catch (error) {
      console.error('Failed to load knowledge gaps:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const results = await graphAPI.query(query);
      setQueryResults(results);
    } catch (error) {
      console.error('Query failed:', error);
      setQueryResults({ error: 'Query failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (nodeId) => {
    try {
      const nodeData = await graphAPI.getNode(nodeId);
      setSelectedNode(nodeData);
    } catch (error) {
      console.error('Failed to load node details:', error);
    }
  };

  return (
    <div className="knowledge-graph-container">
      <div className="graph-header">
        <h2>Knowledge Graph</h2>
        {graphStatus && (
          <div className="graph-status">
            <span className={`status ${graphStatus.status}`}>
              Status: {graphStatus.status}
            </span>
            <span>Last updated: {new Date(graphStatus.timestamp).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="graph-content">
        <div className="query-section">
          <h3>Query Knowledge Graph</h3>
          <div className="query-input">
            <input
              type="text"
              placeholder="Enter your query (e.g., 'quantum blockchain')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            />
            <button onClick={handleQuery} disabled={loading}>
              {loading ? 'Searching...' : 'Query'}
            </button>
          </div>

          {queryResults && (
            <div className="query-results">
              <h4>Query Results</h4>
              {queryResults.error ? (
                <p className="error">{queryResults.error}</p>
              ) : (
                <div className="results-content">
                  <p><strong>Type:</strong> {queryResults.type}</p>
                  {queryResults.data && (
                    <div className="results-data">
                      {Array.isArray(queryResults.data) ? (
                        <ul>
                          {queryResults.data.map((item, index) => (
                            <li key={index}>{JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <pre>{JSON.stringify(queryResults.data, null, 2)}</pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="knowledge-gaps-section">
          <h3>Knowledge Gaps</h3>
          <div className="gaps-list">
            {knowledgeGaps.map((gap) => (
              <div key={gap.id} className="gap-card">
                <h4>{gap.title}</h4>
                <p>{gap.description}</p>
                <div className="gap-meta">
                  <span className="relevance">Relevance: {(gap.relevance * 100).toFixed(1)}%</span>
                  <div className="gap-tags">
                    {gap.topics.map((topic, index) => (
                      <span key={index} className="tag">#{topic}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedNode && (
          <div className="node-details-modal">
            <div className="modal-content">
              <h3>Node Details</h3>
              <div className="node-info">
                <p><strong>ID:</strong> {selectedNode.node.id}</p>
                <p><strong>Label:</strong> {selectedNode.node.label}</p>
                <p><strong>Type:</strong> {selectedNode.node.type}</p>
                <p><strong>Connections:</strong> {selectedNode.node.connections.length}</p>
              </div>
              <div className="related-nodes">
                <h4>Related Nodes ({selectedNode.connectionCount})</h4>
                <div className="nodes-grid">
                  {selectedNode.relatedNodes.map((node, index) => (
                    <div key={index} className="related-node" onClick={() => handleNodeClick(node.id)}>
                      <span className="node-label">{node.label}</span>
                      <span className="node-type">{node.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;