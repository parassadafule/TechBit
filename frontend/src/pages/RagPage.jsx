import React, { useState } from 'react';
import { ragAPI } from '../services/api';

export default function RagPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  async function runRag() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await ragAPI.retrieve(query);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="page rag-page">
      <h2>RAG</h2>
      <div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter query" />
        <button onClick={runRag} disabled={loading}>{loading ? 'Retrieving...' : 'Retrieve'}</button>
      </div>
      {result && (
        <div>
          <p><strong>Summary:</strong> {result.summary}</p>
          {Array.isArray(result.documents) && (
            <ul>
              {result.documents.map((d, i) => <li key={i}>{String(d)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


