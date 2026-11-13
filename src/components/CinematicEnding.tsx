import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../audio/SoundManager';
import { RotateCcw, Home } from 'lucide-react';

import { gameState } from '../game/gameState';

interface CinematicEndingProps {
  onRestart: () => void;
  onMainMenu: () => void;
}

export const CinematicEnding: React.FC<CinematicEndingProps> = ({ onRestart, onMainMenu }) => {
  const [phase, setPhase] = useState<number>(1);
  const isCellarEscape = gameState.escapeRouteTaken === 'cellar';

  useEffect(() => {
    soundManager.setMusicMood('victory');
    soundManager.setRainIntensity(0.8);
    soundManager.playThunder(0.9);

    // Sequence timing
    // Phase 1: Escape story
    const t1 = setTimeout(() => {
      setPhase(2); // Ominous photo frame reveal / cliffhanger
      soundManager.playWhisper();
      soundManager.playJumpscare();
    }, 6000);

    const t2 = setTimeout(() => {
      setPhase(3); // Title & Credits
      soundManager.playCinematicImpact();
    }, 12000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden font-serif">
      <AnimatePresence mode="wait">
        {/* PHASE 1: Escape into the Monsoon */}
        {phase === 1 && (
          <motion.div
            key="phase-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="max-w-2xl space-y-4"
          >
            <span className="text-red-500 font-mono text-xs uppercase tracking-[0.3em] font-bold">
              {isCellarEscape ? 'SURVIVED VIA UNDERGROUND CATACOMBS' : 'SURVIVED KALAPUR HOUSE'}
            </span>
            <h2
              className="text-3xl md:text-5xl font-black text-stone-100 tracking-wider"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {isCellarEscape ? 'CATACOMB ESCAPE!' : 'YOU ESCAPED...'}
            </h2>
            <p className="text-stone-400 text-sm md:text-base font-light italic leading-relaxed">
              {isCellarEscape
                ? 'You pried the iron bars, banished the blood curse with the sacred bell, and turned the bronze floodgate valve! Crawling through the storm catacombs under the river, you broke out into the stormy riverbanks to freedom!'
                : 'You burst through the fortified iron gate into the pouring monsoon night. Behind you, Kalapur House stands silent in the rain. The mansion was unsealed, and you survived.'}
            </p>
          </motion.div>
        )}

        {/* PHASE 2: Ominous Cliffhanger */}
        {phase === 2 && (
          <motion.div
            key="phase-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="max-w-2xl space-y-6"
          >
            <div className="w-28 h-36 mx-auto border-2 border-red-600/70 rounded bg-stone-950 flex flex-col items-center justify-center p-2 shadow-[0_0_60px_rgba(220,38,38,0.7)] animate-pulse">
              <span className="text-[10px] text-stone-500 tracking-widest uppercase">POCKET CLUE</span>
              <div className="w-12 h-14 border border-stone-800 bg-red-950/40 rounded mt-1 flex items-center justify-center">
                <span className="text-xs text-red-500 font-mono">1924</span>
              </div>
            </div>

            <p className="text-stone-300 text-sm md:text-base font-light italic">
              As you reach your pocket, your fingers touch cold glass.
              A miniature replica of the Ancestor Frame rests within your jacket.
              The painted eyes seem to blink in the flash of lightning...
            </p>

            <h3 className="text-red-500 text-2xl md:text-4xl font-black tracking-widest font-sans animate-pulse">
              &quot;THE CURSE IS NOT OVER...&quot;
            </h3>
          </motion.div>
        )}

        {/* PHASE 3: Grand Title & Founder Credits */}
        {phase === 3 && (
          <motion.div
            key="phase-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="max-w-3xl space-y-6"
          >
            <h1
              className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-red-600 tracking-wider drop-shadow-[0_10px_30px_rgba(180,0,0,0.8)]"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              THE CURSE OF KALAPUR
            </h1>

            <div className="space-y-2 py-4 border-y border-stone-800/80">
              <p className="text-xs tracking-[0.3em] uppercase text-stone-400 font-sans">
                Developed by
              </p>
              <p className="text-2xl md:text-3xl font-bold tracking-widest text-red-500">
                STRANGE CREATION
              </p>
              <p className="text-xs tracking-[0.25em] uppercase text-stone-500 font-sans pt-2">
                Founder &amp; Game Creator
              </p>
              <p className="text-xl md:text-2xl font-semibold tracking-wider text-stone-200">
                Soham Dnyaneshwar Lokhande
              </p>
            </div>

            <div className="space-y-1.5 py-1">
              <p className="text-red-400 text-sm md:text-base font-semibold tracking-wide font-sans">
                Thank you for being a part of STRANGE CREATION community
              </p>
              <p className="text-stone-400 text-xs tracking-widest uppercase font-mono">
                YouTube: MR STRANGE 1229 • Kalapur Chapter I
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={onRestart}
                className="flex items-center gap-2 px-6 py-3 bg-red-950/80 hover:bg-red-900 border border-red-700/60 rounded text-stone-200 text-xs uppercase tracking-widest font-semibold cursor-pointer transition-all shadow-lg"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                Play Again
              </button>
              <button
                onClick={onMainMenu}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-xs uppercase tracking-widest font-semibold cursor-pointer transition-all shadow-lg"
              >
                <Home className="w-4 h-4 text-stone-400" />
                Main Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
