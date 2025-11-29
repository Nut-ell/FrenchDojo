import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Volume2, ArrowRight, ArrowLeft, Play } from 'lucide-react';

interface SentenceCardProps {
  text: string;
  translation: string;
  index: number;
  total: number;
  onPlay: () => void;
  onNext: (e: React.MouseEvent) => void;
  onPrev: (e: React.MouseEvent) => void;
  isLoading: boolean;
  isPlaying: boolean;
  direction: number;
}

const cardVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction * 20,
    x: direction * 50
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction * -20,
    x: direction * -50
  })
};

export const SentenceCard: React.FC<SentenceCardProps> = ({ 
  text, 
  translation,
  index, 
  total, 
  onPlay,
  onNext,
  onPrev,
  isLoading,
  isPlaying,
  direction
}) => {
  return (
    <div className="relative w-full max-w-xl aspect-[4/5] sm:aspect-[4/3] perspective-1000 group">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 20 }}
          className="absolute inset-0 bg-paper rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-stone-100 flex flex-col p-8 sm:p-12 text-center overflow-hidden"
        >
          {/* Decorative binding visual */}
          <div className="absolute left-4 top-0 bottom-0 w-[2px] border-l-2 border-dashed border-gray-200"></div>

          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink leading-tight font-medium select-none">
              {text}
            </h2>
            
            <p className="mt-4 text-lg sm:text-xl text-gray-500 font-serif font-light select-none">
              {translation}
            </p>
            
            {/* Play Button Area */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              disabled={isLoading || isPlaying}
              className={`mt-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95 disabled:cursor-not-allowed
                ${isPlaying 
                  ? 'bg-blue-50 text-blue-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
              aria-label="Play audio"
            >
              {isLoading ? (
                 <div className="flex space-x-1">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              ) : isPlaying ? (
                <Volume2 className="animate-pulse" size={32} />
              ) : (
                <Play size={28} className="ml-1 fill-current" />
              )}
            </button>
          </div>

          {/* Footer with Navigation */}
          <div className="w-full flex justify-between items-center text-gray-400 font-medium border-t border-gray-100 pt-6 mt-4 relative z-20">
             <button 
                onClick={onPrev}
                className="p-2 rounded-full hover:bg-gray-100 text-ink transition-colors flex items-center gap-2 group/btn"
                aria-label="Previous sentence"
             >
                <ArrowLeft size={20} className="group-hover/btn:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline text-sm">Back</span>
             </button>

             <span className="text-sm font-mono">{index + 1} / {total}</span>

             <button 
                onClick={onNext}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors flex items-center gap-2 group/btn font-semibold"
                aria-label="Next sentence"
             >
                <span className="hidden sm:inline text-sm">Next</span>
                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};