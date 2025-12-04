import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SettingsOverlay } from './components/SettingsOverlay';
import { SentenceCard } from './components/SentenceCard';
import { SENTENCE_DATA, MODE_CONFIGS } from './constants';
import { SpeedMode } from './types';
import { getTTSAudio, prefetchSentences, playPageTurnSound } from './services/audioService';
import { ChevronLeft, ChevronRight, Gauge, Bookmark } from 'lucide-react';

const BOOKMARK_KEY = 'frenchflow_bookmark';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Load bookmark on initial render
    const saved = localStorage.getItem(BOOKMARK_KEY);
    return saved ? Math.max(0, Math.min(parseInt(saved, 10), SENTENCE_DATA.length - 1)) : 0;
  });
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<SpeedMode>(SpeedMode.NORMAL);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showJumpInput, setShowJumpInput] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Prefetch Window Size
  const PREFETCH_COUNT = 3;

  // Save bookmark whenever index changes
  useEffect(() => {
    localStorage.setItem(BOOKMARK_KEY, currentIndex.toString());
  }, [currentIndex]);

  // Initialize Audio Context on user interaction and start prefetching
  const initializeAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    // Initial prefetch (extract AUDIO FILENAMES)
    const initialBatch = SENTENCE_DATA.slice(0, PREFETCH_COUNT).map(s => s.audio);
    prefetchSentences(initialBatch, audioCtxRef.current);
    
    setHasStarted(true);
  }, []);

  // Monitor index changes to keep the buffer filled ahead
  useEffect(() => {
    if (hasStarted && audioCtxRef.current) {
      // Prefetch the next N sentences from current index
      const start = currentIndex;
      const end = Math.min(currentIndex + PREFETCH_COUNT, SENTENCE_DATA.length);
      const upcoming = SENTENCE_DATA.slice(start, end).map(s => s.audio);
      
      prefetchSentences(upcoming, audioCtxRef.current);
    }
  }, [currentIndex, hasStarted]);

  const stopAudio = useCallback(() => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) {}
      activeSourceRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  // Core playback function - plays audio for a specific index
  const playAudio = useCallback(async (index: number) => {
    if (!audioCtxRef.current) return;
    
    // Stop any currently playing audio before starting new one
    stopAudio();

    // Use AUDIO filename instead of French text
    const filename = SENTENCE_DATA[index].audio;
    
    setIsLoading(true);
    setIsPlaying(true);

    try {
      // Get audio from service (cached or fetched)
      const buffer = await getTTSAudio(filename, audioCtxRef.current);

      // Check if we were stopped during fetch
      if (!audioCtxRef.current) return;

      setIsLoading(false);
      setIsPlaying(true); // Ensure playing state is set after loading

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      
      const config = MODE_CONFIGS[mode];
      source.playbackRate.value = config.rate;

      source.connect(audioCtxRef.current.destination);
      activeSourceRef.current = source;
      
      source.onended = () => {
        setIsPlaying(false);
        activeSourceRef.current = null;
      };

      source.start();

    } catch (err) {
      console.error("Playback error:", err);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [mode, stopAudio]);

  // Handler for Play Button - Plays current sentence
  const handlePlayCurrent = useCallback(() => {
    playAudio(currentIndex);
  }, [playAudio, currentIndex]);

  // Handler for "Next" Button - ONLY Navigation
  const handleNextSequence = (e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    stopAudio(); // Stop any pending audio

    const nextIndex = (currentIndex + 1) % SENTENCE_DATA.length;
    
    setDirection(1);
    setCurrentIndex(nextIndex);
    
    if (audioCtxRef.current) {
      playPageTurnSound(audioCtxRef.current);
    }
  };

  // Handler for "Back" Button - ONLY Navigation
  const handlePrevSequence = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    stopAudio();

    const prevIndex = currentIndex === 0 ? SENTENCE_DATA.length - 1 : currentIndex - 1;
    
    setDirection(-1);
    setCurrentIndex(prevIndex);
    
    if (audioCtxRef.current) {
      playPageTurnSound(audioCtxRef.current);
    }
  };

  // Handle jump to specific page
  const handleJump = useCallback(() => {
    const target = parseInt(jumpValue, 10) - 1; // Convert to 0-based index
    if (!isNaN(target) && target >= 0 && target < SENTENCE_DATA.length) {
      stopAudio();
      setDirection(target > currentIndex ? 1 : -1);
      setCurrentIndex(target);
      setShowJumpInput(false);
      setJumpValue('');
      
      if (audioCtxRef.current) {
        playPageTurnSound(audioCtxRef.current);
      }
    }
  }, [jumpValue, currentIndex, stopAudio]);

  const handleJumpKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump();
    } else if (e.key === 'Escape') {
      setShowJumpInput(false);
      setJumpValue('');
    }
  }, [handleJump]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative overflow-hidden">
      {!hasStarted && <SettingsOverlay onStart={initializeAudio} />}

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
         <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-0 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-10 max-w-5xl mx-auto w-full">
         <div className="flex items-center space-x-2 text-ink">
            <span className="font-serif font-bold text-xl tracking-tight">FrenchFlow</span>
         </div>
         
         <div className="flex items-center space-x-3">
            {/* Jump to Page Button */}
            <div className="relative">
              {showJumpInput ? (
                <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200 px-3 py-1.5">
                  <input
                    type="number"
                    min="1"
                    max={SENTENCE_DATA.length}
                    value={jumpValue}
                    onChange={(e) => setJumpValue(e.target.value)}
                    onKeyDown={handleJumpKeyPress}
                    placeholder={`1-${SENTENCE_DATA.length}`}
                    className="w-20 px-2 py-1 text-sm border-none outline-none bg-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleJump}
                    className="ml-2 px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Go
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJumpInput(true)}
                  className="flex items-center space-x-1 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  title="Jump to page"
                >
                  <Bookmark size={16} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">Jump</span>
                </button>
              )}
            </div>

            {/* Speed Mode Selector */}
            <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200 p-1">
               <Gauge size={16} className="ml-3 mr-2 text-gray-500" />
               <div className="flex">
                  {(Object.values(SpeedMode) as SpeedMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                        mode === m 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col items-center z-10 space-y-8">
        <SentenceCard 
          text={SENTENCE_DATA[currentIndex].french}
          translation={SENTENCE_DATA[currentIndex].english}
          index={currentIndex} 
          total={SENTENCE_DATA.length}
          onPlay={handlePlayCurrent}
          onNext={handleNextSequence}
          onPrev={handlePrevSequence}
          isLoading={isLoading}
          isPlaying={isPlaying}
          direction={direction}
        />

        {/* Manual Controls - Backup Navigation */}
        <div className="flex items-center justify-center space-x-8 opacity-50 hover:opacity-100 transition-opacity">
          <button 
            onClick={handlePrevSequence}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg text-ink hover:bg-blue-50 transition-transform active:scale-95 disabled:opacity-50"
            disabled={isLoading || isPlaying}
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-gray-400 text-sm font-medium">
             Navigation
          </div>

          <button 
            onClick={handleNextSequence}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg text-ink hover:bg-blue-50 transition-transform active:scale-95 disabled:opacity-50"
            disabled={isLoading || isPlaying}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </main>

      <footer className="fixed bottom-4 text-gray-400 text-xs text-center w-full">
        Powered by French Flow
      </footer>
    </div>
  );
}
