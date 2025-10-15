import React, { useEffect, useState } from 'react';
import { githubAPI } from '../services/api';

export default function GithubPage() {
  const [top, setTop] = useState([]);
  useEffect(() => {
    (async () => {
      const t = await githubAPI.getTopRepos(5, 'stars');
      setTop(t);
    })();
  }, []);
  return (
    <div className="page github-page">
      <h2>GitHub</h2>
      <ul>
        {Array.isArray(top) ? top.map((r, i) => <li key={i}>{JSON.stringify(r)}</li>) : <pre>{JSON.stringify(top, null, 2)}</pre>}
      </ul>
    </div>
  );
}


