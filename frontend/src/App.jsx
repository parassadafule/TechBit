import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import Controls from './components/Controls';
import Feed from './components/Feed';
import KnowledgeGraph from './components/KnowledgeGraph';
import PDSDashboard from './components/PDSDashboard';
import GitHubIntegration from './components/GitHubIntegration';
import UserProfiles from './components/UserProfiles';
import ProjectHub from './components/ProjectHub';
import SignInPage from './pages/SignInPage.jsx';
import SignupCallback from './pages/SignupCallback.jsx';
import { fetchPages } from './pages/pagesFetcher';
import RequireAuth from './components/RequireAuth';

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
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || 'dev-p36zmbszrbav7f8k.us.auth0.com'}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || 'rZbvqQgg5xfqE4WLmkvORg4okeO8ZKkw'}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI || (window.location.origin + '/signin')
      }}
      onRedirectCallback={(appState) => {
        try {
          const returnTo = appState?.returnTo || '/';
          if (returnTo.startsWith('/')) {
            window.location.replace(window.location.origin + returnTo);
          } else {
            window.location.replace(returnTo);
          }
        } catch {
          window.location.replace(window.location.origin);
        }
      }}
    >
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
                      element={
                        p.id === 'pds'
                          ? <RequireAuth>{routeMapping[p.id] ?? <Navigate to="/feed" replace />}</RequireAuth>
                          : (routeMapping[p.id] ?? <Navigate to="/feed" replace />)
                      }
                    />
                  ))}

                  {/* Sign-in route */}
                  <Route path="/signin" element={<SignInPage />} />

                  {/* signup callback - finalize local signup */}
                  <Route path="/signup-callback" element={<SignupCallback />} />

                  {/* default redirect goes to signin so users sign in first */}
                  <Route path="/" element={<Navigate to="/signin" replace />} />
                </Routes>
              )}
            </main>
          </div>
        </div>
      </BrowserRouter>
    </Auth0Provider>
  );
}

export default App;