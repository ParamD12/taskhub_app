import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load pages - with timeout safety
const withTimeout = (importFn, timeoutMs = 8000) => {
  return Promise.race([
    importFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Page load timed out')), timeoutMs)
    )
  ]);
};

const HomePage = lazy(() => withTimeout(import('./pages/HomePage')));
const LoginPage = lazy(() => withTimeout(import('./pages/LoginPage')));
const RegisterPage = lazy(() => withTimeout(import('./pages/RegisterPage')));
const NotFoundPage = lazy(() => withTimeout(import('./pages/NotFoundPage')));

// Loading fallback with better visibility
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mb-4"></div>
    <p className="text-gray-600">Loading application...</p>
  </div>
);

// Error boundary to catch lazy loading failures
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-red-500 text-xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || "Failed to load the application. Please try refreshing the page."}
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

    return this.props.children;
  }
}

// Configure React Query with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Query error:', error);
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <TaskProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <HomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  }
                }}
              />
            </TaskProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
