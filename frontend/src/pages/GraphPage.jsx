import React, { useEffect, useState } from 'react';
import { graphAPI } from '../services/api';

export default function GraphPage() {
  const [status, setStatus] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  useEffect(() => {
    (async () => {
      setStatus(await graphAPI.getStatus());
      const g = await graphAPI.getGaps({ limit: 10 });
      setGaps(g.gaps || []);
    })();
  }, []);

  async function runQuery() {
    const r = await graphAPI.query(query);
    setResults(r);
  }

  return (
    <div className="page graph-page">
      <h2>Knowledge Graph</h2>
      {status && <div className="status">Status: {status.status}</div>}
      <div className="query">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search graph" />
        <button onClick={runQuery}>Query</button>
      </div>
      {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
      <h3>Top Gaps</h3>
      <ul>
        {gaps.map(g => <li key={g.id}>{g.title}</li>)}
      </ul>
    </div>
  );
}


