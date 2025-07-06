import React from 'react';

const RequestsPage = () => {
  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400 flex items-center justify-center overflow-hidden">
      {/* Background stars animation */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse opacity-30"></div>

      {/* Content */}
      <div className="z-10 text-center text-white p-8">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">🚧 Coming Soon</h1>
        <p className="text-lg md:text-xl mb-6 opacity-90">We’re building something amazing here. Stay tuned!</p>
        <div className="flex justify-center mt-4">
          <span className="animate-bounce text-white text-3xl">⬇️</span>
        </div>
      </div>

      {/* Optional blurred glowing effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500 opacity-30 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full filter blur-2xl"></div>
    </div>
  );
};

export default RequestsPage;
