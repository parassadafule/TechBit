import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import Controls from './components/Controls';
import { useAuth0 } from '@auth0/auth0-react';
import Feed from './components/Feed';
import KnowledgeGraph from './components/KnowledgeGraph';
import PDSDashboard from './components/PDSDashboard';
import GitHubIntegration from './components/GitHubIntegration';
import UserProfiles from './components/UserProfiles';
import ProjectHub from './components/ProjectHub';
import SignInPage from './pages/SignInPage.jsx';
import SignupCallback from './pages/SignupCallback.jsx';
import Profile from './pages/Profile.jsx';
import LoginOnly from './pages/LoginOnly.jsx';
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
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI || (window.location.origin),
        scope: 'openid profile email'
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
        <InnerApp pages={pages} loading={loading} routeMapping={routeMapping} />
      </BrowserRouter>
    </Auth0Provider>
  );
}

function InnerApp({ pages, loading, routeMapping }) {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="App">
      {isAuthenticated && (
        <>
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

                  <Route path="/profile" element={<Profile />} />
                </Routes>
              )}
            </main>
          </div>
        </>
      )}

      <Routes>
        <Route path="/signup-callback" element={<SignupCallback />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<LoginOnly />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Navigate to="/signin" replace />} />
      </Routes>
    </div>
  );
}

export default App;