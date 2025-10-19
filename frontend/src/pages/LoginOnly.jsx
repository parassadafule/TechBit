import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginOnly = () => {
    const { loginWithRedirect, isLoading } = useAuth0();
    return (
        <div style={{ padding: 40 }}>
            <h2>Sign in</h2>
            <p>Please sign in to continue</p>
            <button onClick={() => loginWithRedirect()} disabled={isLoading}>
                {isLoading ? 'Redirecting...' : 'Sign in with Auth0'}
            </button>
        </div>
    );
};

export default LoginOnly;
