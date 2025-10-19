import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Profile = () => {
    const { user, isAuthenticated, isLoading, logout, getIdTokenClaims } = useAuth0();
    const [dbUser, setDbUser] = useState(null);

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
                if (res.ok) setDbUser(await res.json());
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
            <h2>Profile</h2>
            <div className="profile-info">
                <img src={user.picture} alt="avatar" width={96} height={96} style={{ borderRadius: 12 }} />
                <div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                </div>
            </div>

            <div className="profile-db">
                <h4>Stored profile</h4>
                <pre>{dbUser ? JSON.stringify(dbUser, null, 2) : 'No stored profile yet'}</pre>
            </div>

            <button onClick={() => logout({ returnTo: window.location.origin })}>Logout</button>
        </div>
    );
};

export default Profile;
