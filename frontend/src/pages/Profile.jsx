import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Profile.css';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user, isAuthenticated, isLoading, logout, getIdTokenClaims } = useAuth0();
    const [dbUser, setDbUser] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [editingBio, setEditingBio] = useState('');
    const [statusMsg, setStatusMsg] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!isAuthenticated) return;
            try {
                const idToken = (await getIdTokenClaims())?.__raw;
                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3002'}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!mounted) return;
                if (res.ok) {
                    const payload = await res.json();
                    const u = payload.user || payload;
                    setDbUser(u);
                    setEditingName(u.name ?? '');
                    setEditingBio(u.bio ?? '');
                }
            } catch (err) {
                console.error('Failed to fetch db user', err);
            }
        })();
        return () => { mounted = false; };
    }, [isAuthenticated, getIdTokenClaims]);

    if (isLoading) return <div className="loading">Loading profile...</div>;
    if (!isAuthenticated) return <div>Please login to view profile</div>;

    return (
        <div className="profile-page">
            <div className="profile-card">
                <h2>Profile</h2>
                <div className="profile-info">
                    <img className="avatar" src={user.picture} alt="avatar" />
                    <div className="profile-details">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                    </div>
                </div>

                <div className="profile-db">
                    <h4>Stored profile</h4>
                    {dbUser ? (
                        <div>
                            {!isEditing ? (
                                <div>
                                    <div style={{ textAlign: 'left' }}>
                                        {/* <strong>Name:</strong>
                                        <div style={{ marginBottom: 8 }}>{dbUser.name || user.name}</div> */}
                                        <strong>Bio:</strong>
                                        <div style={{ marginBottom: 8 }}> {dbUser.bio || 'No bio yet'} </div>
                                    </div>
                                    <div>
                                        <button className="profile-logout" onClick={() => { setIsEditing(true); setStatusMsg(null); }} style={{ marginRight: 8 }}>Edit profile</button>
                                        <Link to="/post" className="profile-logout" style={{ marginLeft: 8, display: 'inline-block', padding: '8px 10px', color: '#fff', background: '#0b5cff', borderRadius: 8, textDecoration: 'none' }}>Create Post</Link>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label>
                                        Name<br />
                                        <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                                    </label>

                                    <label style={{ display: 'block', marginTop: 8 }}>
                                        Bio<br />
                                        <textarea rows={4} value={editingBio} onChange={(e) => setEditingBio(e.target.value)} />
                                    </label>

                                    <div style={{ marginTop: 8 }}>
                                        <button
                                            className="profile-logout"
                                            onClick={async () => {
                                                setStatusMsg(null);
                                                try {
                                                    const idToken = (await getIdTokenClaims())?.__raw;
                                                    const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3002'}/auth/profile`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                                                        body: JSON.stringify({ name: editingName, bio: editingBio })
                                                    });
                                                    if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
                                                    const p = await res.json();
                                                    setDbUser(p.user || p);
                                                    setStatusMsg('Profile updated');
                                                    setIsEditing(false);
                                                } catch (err) {
                                                    setStatusMsg('Update failed: ' + (err.message || err));
                                                }
                                            }}
                                            style={{ marginRight: 8 }}
                                        >Save</button>

                                        <button className="profile-logout" onClick={() => { setIsEditing(false); setEditingName(dbUser.name || user.name || ''); setEditingBio(dbUser.bio || ''); }}>Cancel</button>
                                    </div>

                                    {statusMsg && <div style={{ marginTop: 8 }}>{statusMsg}</div>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>No stored profile yet</div>
                    )}
                </div>

                <button className="profile-logout" onClick={() => logout({ returnTo: window.location.origin })}>Logout</button>
            </div>
        </div>
    );
};

export default Profile;
