import React, { useState } from 'react';
import LoadingPage from './LoadingPage';

const AmazingLoadingDemo = () => {
  const [showLoading, setShowLoading] = useState(false);

  const handleStartLoading = () => {
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    alert('🎉 Amazing! The loading page with butchery logo and knife animation is working perfectly!');
  };

  if (showLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96 space-y-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">🔪 Amazing Butchery Loading Demo</h2>
        
        <div className="space-y-4 text-sm text-gray-600">
          <p>✨ Features you'll see:</p>
          <ul className="text-left space-y-2">
            <li>🔪 <strong>Animated Knife</strong> - Cutting through meat</li>
            <li>🥩 <strong>Meat Animation</strong> - Shaking and splitting</li>
            <li>⚡ <strong>Cutting Line</strong> - Dynamic cutting effect</li>
            <li>📊 <strong>Progress Bar</strong> - Real-time loading progress</li>
            <li>🎯 <strong>Step Indicators</strong> - Clear progress steps</li>
            <li>🏢 <strong>AuraRise Branding</strong> - Professional tech solutions</li>
          </ul>
        </div>
        
        <button
          onClick={handleStartLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
        >
          🚀 Start Amazing Loading Demo
        </button>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> This demo shows the beautiful butchery-themed loading page with knife cutting meat animation and AuraRise Tech Solutions branding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmazingLoadingDemo; 