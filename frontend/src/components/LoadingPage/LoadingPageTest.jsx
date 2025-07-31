import React, { useState } from 'react';
import LoadingPage from './LoadingPage';

const LoadingPageTest = () => {
  const [showLoading, setShowLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleStartLoading = () => {
    setShowLoading(true);
    addTestResult('Loading page started');
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    addTestResult('Loading page completed successfully');
  };

  const handleLoadingError = (error) => {
    setShowLoading(false);
    addTestResult(`Loading page failed: ${error}`);
  };

  if (showLoading) {
    return (
      <LoadingPage 
        onComplete={handleLoadingComplete}
        onError={handleLoadingError}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96 space-y-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">Loading Page Test</h2>
        
        <button
          onClick={handleStartLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-4"
        >
          Start Loading Test
        </button>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={() => setTestResults([])}
          className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>
    </div>
  );
};

export default LoadingPageTest; 