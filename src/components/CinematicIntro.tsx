import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../audio/SoundManager';
import { gameState } from '../game/gameState';
import { FastForward, Youtube, Music } from 'lucide-react';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [scene, setScene] = useState<number>(1);
  const [subtitles, setSubtitles] = useState<string>('');
  const [isSongOn, setIsSongOn] = useState<boolean>(() => gameState.settings.songEnabled);

  useEffect(() => {
    soundManager.init();
    soundManager.setRainIntensity(0.85);
    soundManager.startSongTrack();

    // Crisp, lag-free Master Cinematic Intro (Total ~24 seconds, 60 FPS GPU-composited scenes)
    setSubtitles('The night of the solar eclipse... 14th October 1924.');
    soundManager.playThunder(0.7);
    soundManager.playWhisper();

    const t1 = setTimeout(() => {
      setScene(2);
      soundManager.playCinematicImpact();
      setSubtitles('STRANGE CREATION presents an Indian horror nightmare.');
    }, 4800);

    const t2 = setTimeout(() => {
      setScene(3);
      soundManager.playThunder(0.95);
      soundManager.playDoorSound(true);
      setSubtitles('In the deep forests of Maharashtra, Kalapur House still breathes...');
    }, 9600);

    const t3 = setTimeout(() => {
      setScene(4);
      soundManager.playWhisper();
      soundManager.playJumpscare();
      setSubtitles('Her spirit was never laid to rest.');
    }, 14400);

    const t4 = setTimeout(() => {
      setScene(5);
      soundManager.playCinematicImpact();
      soundManager.setMusicMood('menu');
      setSubtitles('THE CURSE OF KALAPUR • Escape the house. Discover the truth.');
    }, 19200);

    const t5 = setTimeout(() => {
      onComplete();
    }, 24000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden font-serif select-none">
      {/* 16:9 Widescreen Letterbox Bars */}
      <div className="absolute top-0 left-0 right-0 h-10 md:h-14 bg-black z-40 border-b border-stone-900 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-10 md:h-14 bg-black z-40 border-t border-stone-900 pointer-events-none" />

      {/* Top Left: Official Brand Badge (Lightweight, Razor Sharp) */}
      <div className="absolute top-12 md:top-16 left-5 md:left-8 z-50 flex items-center gap-3 pointer-events-none select-none">
        <div className="w-20 md:w-28 aspect-video rounded border border-red-800/80 overflow-hidden bg-black">
          <img
            src={officialLogoImg}
            alt="The Curse of Kalapur Official Logo"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-red-500 font-mono text-[10px] tracking-[0.28em] uppercase font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            STRANGE CREATION
          </span>
          <span className="text-stone-200 text-xs tracking-wider font-serif font-semibold">
            THE CURSE OF KALAPUR
          </span>
        </div>
      </div>

      {/* Top Right Controls: Song On/Off & Skip Intro */}
      <div className="absolute top-12 md:top-16 right-5 md:right-8 z-50 flex items-center gap-3">
        <button
          onClick={() => {
            const next = soundManager.toggleSong();
            setIsSongOn(next);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs tracking-wider uppercase font-mono transition-colors duration-200 cursor-pointer border ${
            isSongOn
              ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/80 text-amber-200'
              : 'bg-stone-950/90 hover:bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
          title="Toggle Horror Song"
        >
          <Music className={`w-4 h-4 ${isSongOn ? 'text-amber-400' : 'text-stone-600'}`} />
          <span>SONG: {isSongOn ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-4 py-2 bg-stone-950/90 hover:bg-red-950 border border-stone-700 hover:border-red-500 rounded text-stone-200 hover:text-white text-xs tracking-widest uppercase transition-colors duration-200 cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-red-500" />
          Skip Intro
        </button>
      </div>

      {/* Lightweight Radial Background Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(69,10,10,0.22) 0%, rgba(0,0,0,0.96) 70%)' }}
      />

      <AnimatePresence mode="wait">
        {/* SCENE 1: Darkness, 1924 Eclipse & Crisp Logo Emergence */}
        {scene === 1 && (
          <motion.div
            key="scene-1"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="flex flex-col items-center text-center px-6 max-w-3xl"
          >
            <div className="w-64 md:w-80 aspect-video rounded-lg overflow-hidden border border-red-800/80 mb-5 bg-black shadow-lg">
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Official Logo"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-red-400/90 text-xs md:text-sm tracking-[0.35em] uppercase mb-3 font-mono font-semibold">
              1924 • THE FORBIDDEN HAVELI
            </div>
            <h2 className="text-stone-100 text-xl md:text-3xl font-light tracking-widest leading-relaxed">
              &quot;When the moon blackens, the seal shatters...&quot;
            </h2>
            <p className="text-stone-400 text-xs md:text-sm tracking-[0.22em] italic mt-3 font-serif">
              A supernatural legend preserved in the shadows of Kalapur.
            </p>
          </motion.div>
        )}

        {/* SCENE 2: STRANGE CREATION Studio & Soham Dnyaneshwar Lokhande & MR STRANGE 1229 */}
        {scene === 2 && (
          <motion.div
            key="scene-2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="flex flex-col items-center text-center px-6 max-w-4xl"
          >
            <div className="relative w-72 md:w-96 aspect-video rounded-lg overflow-hidden border-2 border-red-700/85 mb-5 bg-black shadow-lg">
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Logo - Strange Creation"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>

            <h1
              className="text-2xl md:text-5xl font-black text-stone-100 uppercase mb-2 tracking-[0.32em]"
              style={{ fontFamily: 'Cinzel, serif', textShadow: '0 2px 16px rgba(220,38,38,0.65)' }}
            >
              STRANGE CREATION
            </h1>

            <div className="space-y-1 pt-1">
              <p className="text-xs tracking-[0.3em] text-red-400 uppercase font-sans font-semibold">
                Created &amp; Directed by
              </p>
              <p className="text-xl md:text-2xl text-stone-100 tracking-widest font-serif font-bold">
                Soham Dnyaneshwar Lokhande
              </p>
              <div className="flex items-center justify-center gap-2 pt-1.5 text-stone-300 text-xs tracking-wider">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="font-mono">MR STRANGE 1229</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCENE 3: The Haunted Mansion Silhouette in the Monsoon */}
        {scene === 3 && (
          <motion.div
            key="scene-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="relative flex flex-col items-center text-center px-6 max-w-4xl"
          >
            <div className="relative w-80 md:w-96 h-52 border-t-4 border-l-4 border-r-4 border-stone-700 rounded-t-full flex flex-col items-center justify-center bg-stone-950 p-6 mb-6">
              <div className="w-8 h-12 bg-red-600 rounded-t-sm border border-red-400 mb-2 flex items-center justify-center">
                <div className="w-1.5 h-6 bg-black/70 rounded-full" />
              </div>
              <div className="text-stone-400 text-[10px] tracking-[0.3em] uppercase font-mono">
                KALAPUR ESTATE • RAJASTHANI-KONKAN HAVELI
              </div>
            </div>

            <p className="text-stone-100 text-lg md:text-2xl font-light tracking-wide italic">
              A century of silence... shattered by an awakened presence.
            </p>
            <span className="text-stone-400 text-xs tracking-widest uppercase mt-3 font-sans">
              Thunder and rain lash against the barred doors
            </span>
          </motion.div>
        )}

        {/* SCENE 4: Corridor Approach & The Kalapur Ghost Reveal */}
        {scene === 4 && (
          <motion.div
            key="scene-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="relative flex flex-col items-center text-center px-4"
          >
            <div className="relative w-64 md:w-80 h-80 border-2 border-red-800 bg-stone-950 rounded flex flex-col items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-stone-900 border border-red-600 flex items-center justify-center mb-4">
                <div className="flex gap-5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                </div>
              </div>
              <div className="w-40 h-28 bg-gradient-to-b from-stone-700/40 to-transparent rounded-t-full" />
              <p className="absolute bottom-4 text-red-400 font-mono text-xs tracking-[0.3em] uppercase font-bold">
                SHE HAS AWAKENED
              </p>
            </div>
            <p className="text-red-400 font-serif text-2xl tracking-widest mt-6 font-bold">
              THE KALAPUR GHOST
            </p>
          </motion.div>
        )}

        {/* SCENE 5: Crisp Grand Reveal of Official Game Logo Artwork */}
        {scene === 5 && (
          <motion.div
            key="scene-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="flex flex-col items-center text-center px-6 max-w-4xl"
          >
            <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden border border-red-800/80 mb-6 bg-black flex items-center justify-center shadow-lg">
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Official Logo by Strange Creation"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <p className="text-stone-100 text-sm md:text-lg tracking-[0.3em] uppercase font-sans font-semibold">
                Escape the house. Discover the truth.
              </p>
              <div className="h-0.5 w-64 mx-auto bg-gradient-to-r from-transparent via-red-600 to-transparent my-3" />
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs tracking-widest uppercase text-stone-300 font-sans">
                <span className="text-red-400 font-bold">STRANGE CREATION</span>
                <span>•</span>
                <span className="text-stone-100">Soham Dnyaneshwar Lokhande</span>
                <span>•</span>
                <span className="text-stone-300 flex items-center gap-1 font-mono">
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> MR STRANGE 1229
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crisp High-Contrast Subtitles */}
      <div className="absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 text-center px-6 py-2.5 bg-black/90 rounded border border-stone-700 text-stone-100 text-xs md:text-sm tracking-wider font-sans max-w-xl z-40">
        {subtitles}
      </div>
    </div>
  );
};
