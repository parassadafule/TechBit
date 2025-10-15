import React, { useState } from 'react';

const ProjectHub = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Quantum Computing Research",
      description: "Exploring quantum algorithms for optimization problems",
      author: "quantumphys",
      tags: ["quantum-computing", "algorithms", "research"],
      collaborators: 5,
      discussions: 23,
      lastActivity: "2 hours ago"
    },
    {
      id: 2,
      title: "Decentralized Identity System",
      description: "Building a privacy-preserving identity management system",
      author: "blockchaindev",
      tags: ["blockchain", "identity", "privacy"],
      collaborators: 8,
      discussions: 45,
      lastActivity: "1 day ago"
    },
    {
      id: 3,
      title: "AI-Powered Code Generation",
      description: "Machine learning models for automated code generation",
      author: "aiml",
      tags: ["machine-learning", "code-generation", "transformers"],
      collaborators: 12,
      discussions: 67,
      lastActivity: "3 hours ago"
    }
  ]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [discussions, setDiscussions] = useState({
    1: [
      { id: 1, author: "quantumphys", content: "Latest results show 2x speedup on QAOA algorithm", timestamp: "2 hours ago" },
      { id: 2, author: "researcher1", content: "Have you considered hybrid classical-quantum approaches?", timestamp: "1 hour ago" }
    ],
    2: [
      { id: 1, author: "blockchaindev", content: "Zero-knowledge proofs integration complete", timestamp: "1 day ago" },
      { id: 2, author: "privacyexpert", content: "Need to review the cryptographic primitives", timestamp: "12 hours ago" }
    ],
    3: [
      { id: 1, author: "aiml", content: "Transformer model shows 85% accuracy on code completion", timestamp: "3 hours ago" },
      { id: 2, author: "codegen", content: "What about multi-language support?", timestamp: "2 hours ago" }
    ]
  });

  const handleAddDiscussion = () => {
    if (!newDiscussion.trim() || !selectedProject) return;

    const newDisc = {
      id: Date.now(),
      author: "currentuser",
      content: newDiscussion,
      timestamp: "Just now"
    };

    setDiscussions(prev => ({
      ...prev,
      [selectedProject.id]: [...(prev[selectedProject.id] || []), newDisc]
    }));

    setNewDiscussion('');
  };

  return (
    <div className="project-hub-container">
      <div className="hub-header">
        <h2>Project Hub</h2>
        <p>Collaborative research and development projects</p>
      </div>

      <div className="hub-content">
        <div className="projects-list">
          <h3>Active Projects</h3>
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="project-header">
                  <h4>{project.title}</h4>
                  <span className="author">by @{project.author}</span>
                </div>

                <p className="project-description">{project.description}</p>

                <div className="project-tags">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>

                <div className="project-stats">
                  <span>👥 {project.collaborators} collaborators</span>
                  <span>💬 {project.discussions} discussions</span>
                  <span>🕒 {project.lastActivity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedProject && (
          <div className="project-details">
            <div className="project-info">
              <h3>{selectedProject.title}</h3>
              <p className="description">{selectedProject.description}</p>

              <div className="project-meta">
                <div className="meta-item">
                  <span className="label">Lead:</span>
                  <span className="value">@{selectedProject.author}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Collaborators:</span>
                  <span className="value">{selectedProject.collaborators}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Discussions:</span>
                  <span className="value">{selectedProject.discussions}</span>
                </div>
              </div>

              <div className="project-tags-detailed">
                <h4>Topics</h4>
                <div className="tags">
                  {selectedProject.tags.map((tag, index) => (
                    <span key={index} className="tag-large">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="discussions-section">
              <h4>Discussions</h4>

              <div className="discussions-list">
                {(discussions[selectedProject.id] || []).map((discussion) => (
                  <div key={discussion.id} className="discussion-item">
                    <div className="discussion-header">
                      <span className="author">@{discussion.author}</span>
                      <span className="timestamp">{discussion.timestamp}</span>
                    </div>
                    <p className="content">{discussion.content}</p>
                  </div>
                ))}
              </div>

              <div className="add-discussion">
                <textarea
                  placeholder="Add to the discussion..."
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  rows={3}
                />
                <button onClick={handleAddDiscussion} disabled={!newDiscussion.trim()}>
                  Post Discussion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHub;