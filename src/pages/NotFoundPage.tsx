import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="bg-red-100 p-3 rounded-full inline-flex mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or deleted.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button variant="primary">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;