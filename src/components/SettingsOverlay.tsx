import React from 'react';
import { BookOpen } from 'lucide-react';

interface SettingsOverlayProps {
  onStart: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm text-white p-4">
      <div className="max-w-md w-full bg-white text-ink rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-6">
          <BookOpen size={40} />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">French Flow</h1>
          <p className="text-gray-500">Immersive listening practice</p>
        </div>

        <p className="text-gray-600 leading-relaxed">
          Experience French sentences with natural audio. 
          Tap the card to listen and advance automatically.
        </p>

        <button 
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          Start Learning
        </button>
      </div>
    </div>
  );
};
