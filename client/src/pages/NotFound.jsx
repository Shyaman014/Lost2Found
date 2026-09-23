import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
