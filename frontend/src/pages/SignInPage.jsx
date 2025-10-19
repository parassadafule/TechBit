import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const SignInPage = () => {
    const { loginWithRedirect, isLoading, error } = useAuth0();
    const returnTo = '/signup-callback';

    return (
        <div className="signin-page">
            <h2>Sign in to Techbit</h2>
            {error && <div className="error">Authentication error: {error.message}</div>}
            <p>Sign in to access personalized features.</p>
            <button onClick={() => loginWithRedirect({ appState: { returnTo } })} disabled={isLoading}>
                {isLoading ? 'Redirecting...' : 'Sign in / Sign up'}
            </button>
        </div>
    );
};

export default SignInPage;
