import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    (async () => {
      const u = await userAPI.getUsers();
      setUsers(u.users || []);
    })();
  }, []);
  return (
    <div className="page users-page">
      <h2>TechBit Community</h2>
      <p>Connect with developers and contribute to AI-generated content refinement</p>
      <ul>
        {users.map(u => (
          <li key={u.username}>{u.name || u.username} — Reputation {u.reputation} — Contributor</li>
        ))}
      </ul>
    </div>
  );
}


