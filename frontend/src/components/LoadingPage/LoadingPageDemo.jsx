import React, { useState } from 'react';
import LoadingPage from './LoadingPage';

const LoadingPageDemo = () => {
  const [showLoading, setShowLoading] = useState(false);

  const handleStartLoading = () => {
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    alert('Loading completed! This would normally navigate to the main app.');
  };

  if (showLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96 space-y-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading Page Demo</h2>
        <p className="text-gray-600 mb-6">
          Click the button below to see the loading page in action.
        </p>
        <button
          onClick={handleStartLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Start Loading Demo
        </button>
      </div>
    </div>
  );
};

export default LoadingPageDemo; 