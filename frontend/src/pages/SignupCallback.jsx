import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const SignupCallback = () => {
    const { user, isAuthenticated, isLoading, getIdTokenClaims } = useAuth0();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!isAuthenticated || !user) return;
            try {
                // Optionally get access token for calling protected backend endpoints
                // const token = await getAccessTokenSilently();

                const idToken = (await getIdTokenClaims())?.__raw;
                await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3002'}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ profile: user })
                });

                // Clear any logged-out flag so RequireAuth won't force /logged-out
                try { localStorage.removeItem('techbit_logged_out'); } catch { /* ignore */ }

                if (mounted) {
                    navigate('/feed');
                }
            } catch (err) {
                console.error('Signup callback failed', err);
                if (mounted) setError(err.message || 'Signup error');
            }
        })();

        return () => { mounted = false; };
    }, [isAuthenticated, user, navigate, getIdTokenClaims]);

    if (isLoading) return <div className="loading">Finalizing signup...</div>;
    if (error) return <div className="error">{error}</div>;
    return <div className="loading">Finalizing signup...</div>;
};

export default SignupCallback;
