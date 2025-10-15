import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UserProfiles = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('reputation');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userAPI.getUsers();
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (username) => {
    try {
      const userData = await userAPI.getUser(username);
      setSelectedUser(userData);
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
  };

  const filteredUsers = users
    .filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return b.reputation - a.reputation;
        case 'followers':
          return b.followers - a.followers;
        case 'posts':
          return b.posts - a.posts;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getReputationColor = (reputation) => {
    if (reputation >= 0.8) return 'reputation-excellent';
    if (reputation >= 0.6) return 'reputation-good';
    if (reputation >= 0.4) return 'reputation-fair';
    return 'reputation-poor';
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>User Profiles</h2>
        <div className="users-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="reputation">Sort by Reputation</option>
            <option value="followers">Sort by Followers</option>
            <option value="posts">Sort by Posts</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="users-content">
        <div className="users-list">
          <h3>All Users ({filteredUsers.length})</h3>
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <div
                key={user.username}
                className="user-card"
                onClick={() => loadUserDetails(user.username)}
              >
                <div className="user-avatar">
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p className="username">@{user.username}</p>
                  <div className="user-stats">
                    <span className={`reputation ${getReputationColor(user.reputation)}`}>
                      Rep: {(user.reputation * 100).toFixed(0)}%
                    </span>
                    <span>👥 {user.followers}</span>
                    <span>📝 {user.posts}</span>
                  </div>
                  <div className="user-specialties">
                    {user.specialties.slice(0, 2).map((specialty, index) => (
                      <span key={index} className="specialty-tag">#{specialty}</span>
                    ))}
                    {user.specialties.length > 2 && (
                      <span className="specialty-more">+{user.specialties.length - 2} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedUser && (
          <div className="user-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>User Profile</h3>
                <button onClick={() => setSelectedUser(null)}>×</button>
              </div>

              <div className="user-profile">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <span>{selectedUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="profile-info">
                    <h2>{selectedUser.name}</h2>
                    <p className="username">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-label">Reputation:</span>
                    <span className={`stat-value ${getReputationColor(selectedUser.reputation)}`}>
                      {(selectedUser.reputation * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Followers:</span>
                    <span className="stat-value">{selectedUser.followers.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Posts:</span>
                    <span className="stat-value">{selectedUser.posts}</span>
                  </div>
                </div>

                <div className="profile-specialties">
                  <h4>Specialties</h4>
                  <div className="specialties-list">
                    {selectedUser.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag-large">#{specialty}</span>
                    ))}
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="follow-btn">Follow</button>
                  <button className="message-btn">Message</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfiles;