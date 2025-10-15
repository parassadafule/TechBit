import React, { useState } from 'react';
import Controls from './components/Controls';
import Feed from './components/Feed';
import KnowledgeGraph from './components/KnowledgeGraph';
import PDSDashboard from './components/PDSDashboard';
import GitHubIntegration from './components/GitHubIntegration';
import UserProfiles from './components/UserProfiles';
import ProjectHub from './components/ProjectHub';

function App() {
  const [activeView, setActiveView] = useState('feed');

  const renderActiveView = () => {
    switch (activeView) {
      case 'feed':
        return <Feed />;
      case 'graph':
        return <KnowledgeGraph />;
      case 'pds':
        return <PDSDashboard />;
      case 'github':
        return <GitHubIntegration />;
      case 'users':
        return <UserProfiles />;
      case 'projectHub':
        return <ProjectHub />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Techbit</h1>
        <p>AI-Powered Tech Discovery & Collaboration Platform</p>
      </header>

      <div className="app-content">
        <Controls activeView={activeView} onViewChange={setActiveView} />
        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;