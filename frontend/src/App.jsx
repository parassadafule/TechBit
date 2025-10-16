import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Controls from './components/Controls';
import Feed from './components/Feed';
import KnowledgeGraph from './components/KnowledgeGraph';
import PDSDashboard from './components/PDSDashboard';
import GitHubIntegration from './components/GitHubIntegration';
import UserProfiles from './components/UserProfiles';
import ProjectHub from './components/ProjectHub';
import SignInPage from './pages/SignInPage';
import { fetchPages } from './pages/pagesFetcher';

function App() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchPages();
        if (mounted) setPages(p);
      } catch (err) {
        console.error('failed to fetch pages', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const routeMapping = {
    feed: <Feed />,
    graph: <KnowledgeGraph />,
    pds: <PDSDashboard />,
    github: <GitHubIntegration />,
    users: <UserProfiles />,
    projectHub: <ProjectHub />,
  };

  return (
    <BrowserRouter>
      <div className="App">
        <header className="app-header">
          <h1>Techbit</h1>
          <p>AI-Powered Tech Discovery & Collaboration Platform</p>
        </header>

        <div className="app-content">
          <Controls />
          <main className="main-content">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Routes>
                {/* pages fetched from API (or fallback) will determine routes */}
                {pages.map((p) => (
                  <Route
                    key={p.id}
                    path={p.path}
                    element={routeMapping[p.id] ?? <Navigate to="/feed" replace />}
                  />
                ))}

                {/* Sign-in route */}
                <Route path="/signin" element={<SignInPage />} />

                {/* default redirect */}
                <Route path="/" element={<Navigate to="/feed" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;