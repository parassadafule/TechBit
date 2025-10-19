import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();
    const location = useLocation();

    if (isLoading) return <div className="loading">Checking authentication...</div>;

    if (!isAuthenticated) {
        // Redirect to signin and preserve where the user wanted to go
        return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default RequireAuth;
