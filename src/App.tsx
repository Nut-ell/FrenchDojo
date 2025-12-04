import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Test App
        </h1>
        <p className="text-gray-700">
          If you can see this, React is working on your device.
        </p>
        <button 
          onClick={() => alert('Button clicked!')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
