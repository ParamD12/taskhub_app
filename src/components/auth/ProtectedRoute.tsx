import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  // Add a local timeout to prevent infinite loading
  const [localTimeout, setLocalTimeout] = useState(false);
  
  useEffect(() => {
    // Set up a safety timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Protected route loading timeout reached');
        setLocalTimeout(true);
      }
    }, 8000); // 8 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // If loading for too long, show enhanced loading spinner
  if (loading && !localTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-gray-600">Loading your data...</p>
      </div>
    );
  }
  
  // If still loading after timeout, show a message with refresh option
  if (loading && localTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-yellow-600 text-xl font-bold mb-4">Taking longer than expected</h2>
          <p className="text-gray-700 mb-4">
            We're having trouble loading your data. This might be due to network issues.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
