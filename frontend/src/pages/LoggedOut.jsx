import React from 'react';
import { Link } from 'react-router-dom';

const LoggedOut = () => {
    return (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: 480, textAlign: 'center' }}>
                <h1 style={{ fontSize: 72, margin: 0 }}>404</h1>
                <h2 style={{ marginTop: 8 }}>User not found</h2>
                <p style={{ color: '#666' }}>You have been logged out or your session expired. Please sign in again to continue.</p>
                <Link to="/signin" style={{ display: 'inline-block', marginTop: 12, padding: '10px 16px', background: '#0b5cff', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Go to Sign in</Link>
            </div>
        </div>
    );
};

export default LoggedOut;
