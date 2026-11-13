import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../audio/SoundManager';
import { gameState } from '../game/gameState';
import { FastForward, Youtube, Sparkles, Music } from 'lucide-react';
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
    // Start authentic Count the Doors horror song right from intro!
    soundManager.startSongTrack();

    // Timeline for Master Cinematic Intro (Total ~46 seconds)
    // Scene 1: The Void & The Eclipse 1924 (0 - 9s)
    setSubtitles('The night of the solar eclipse... 14th October 1924.');
    soundManager.playThunder(0.7);
    soundManager.playWhisper();

    const t1 = setTimeout(() => {
      // Scene 2: STRANGE CREATION & Soham Dnyaneshwar Lokhande (9 - 18s)
      setScene(2);
      soundManager.playCinematicImpact();
      setSubtitles('STRANGE CREATION presents an Indian horror nightmare.');
    }, 9000);

    const t2 = setTimeout(() => {
      // Scene 3: The Haunted Haveli in the Monsoon (18 - 28s)
      setScene(3);
      soundManager.playThunder(0.95);
      soundManager.playDoorSound(true);
      setSubtitles('In the deep forests of Maharashtra, Kalapur House still breathes...');
    }, 18000);

    const t3 = setTimeout(() => {
      // Scene 4: Corridor Approach & The Kalapur Ghost (28 - 36s)
      setScene(4);
      soundManager.playWhisper();
      soundManager.playJumpscare();
      setSubtitles('Her spirit was never laid to rest.');
    }, 28000);

    const t4 = setTimeout(() => {
      // Scene 5: Master Game Logo Grand Reveal (36 - 46s)
      setScene(5);
      soundManager.playCinematicImpact();
      soundManager.setMusicMood('menu');
      setSubtitles('THE CURSE OF KALAPUR • Escape the house. Discover the truth.');
    }, 36000);

    const t5 = setTimeout(() => {
      onComplete();
    }, 46000);

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
      {/* 16:9 Widescreen Letterbox Bar Borders for True Cinema Feel */}
      <div className="absolute top-0 left-0 right-0 h-10 md:h-16 bg-black z-40 border-b border-stone-900/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-10 md:h-16 bg-black z-40 border-t border-stone-900/60 pointer-events-none" />

      {/* Top Left: Official Logo Watermark / Studio Brand Badge */}
      <div className="absolute top-12 md:top-20 left-6 md:left-8 z-50 flex items-center gap-3 pointer-events-none select-none">
        <div className="w-20 md:w-28 aspect-video rounded border border-red-900/70 overflow-hidden shadow-[0_0_25px_rgba(220,38,38,0.55)] bg-black/90 backdrop-blur-md">
          <img
            src={officialLogoImg}
            alt="The Curse of Kalapur Official Logo"
            className="w-full h-full object-cover filter contrast-125"
          />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-red-500 font-mono text-[10px] tracking-[0.3em] uppercase font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            STRANGE CREATION
          </span>
          <span className="text-stone-300 text-xs tracking-wider font-serif font-semibold">
            THE CURSE OF KALAPUR
          </span>
        </div>
      </div>

      {/* Top Controls: Song On/Off & Skip Intro */}
      <div className="absolute top-12 md:top-20 right-8 z-50 flex items-center gap-3">
        {/* On-Screen Song On/Off Button */}
        <button
          onClick={() => {
            const next = soundManager.toggleSong();
            setIsSongOn(next);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs tracking-wider uppercase font-mono transition-all duration-300 backdrop-blur-md cursor-pointer border shadow-2xl ${
            isSongOn
              ? 'bg-amber-950/85 hover:bg-amber-900 border-amber-500/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              : 'bg-stone-950/80 hover:bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
          }`}
          title="Toggle Horror Song"
        >
          <Music className={`w-4 h-4 ${isSongOn ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
          <span>SONG: {isSongOn ? 'ON' : 'OFF'}</span>
        </button>

        {/* Skip Intro Button */}
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-4 py-2 bg-stone-950/80 hover:bg-red-950/90 border border-stone-800 hover:border-red-600 rounded text-stone-300 hover:text-white text-xs tracking-widest uppercase transition-all duration-300 backdrop-blur-md cursor-pointer shadow-2xl"
        >
          <FastForward className="w-4 h-4 text-red-500" />
          Skip Intro
        </button>
      </div>

      {/* Atmospheric Background Layers */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute inset-0 bg-radial from-red-950/15 via-black/80 to-black" />
      </div>

      <AnimatePresence mode="wait">
        {/* SCENE 1: Darkness, Rain, Sanskrit Whisper & Logo Emergence */}
        {scene === 1 && (
          <motion.div
            key="scene-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.8 }}
            className="flex flex-col items-center text-center px-6 max-w-3xl"
          >
            {/* Logo in Scene 1 */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6 }}
              className="w-64 md:w-80 aspect-video rounded-lg overflow-hidden border border-red-900/60 shadow-[0_0_60px_rgba(200,0,0,0.5)] mb-5 bg-black"
            >
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Official Logo"
                className="w-full h-full object-contain filter contrast-125 brightness-105"
              />
            </motion.div>

            <motion.div
              animate={{ opacity: [0.2, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="text-stone-500 text-xs md:text-sm tracking-[0.4em] uppercase mb-3 font-mono"
            >
              1924 • THE FORBIDDEN HAVELI
            </motion.div>
            <h2 className="text-stone-300 text-xl md:text-3xl font-light tracking-widest leading-relaxed">
              &quot;When the moon blackens, the seal shatters...&quot;
            </h2>
            <p className="text-stone-600 text-xs md:text-sm tracking-[0.25em] italic mt-3 font-serif">
              A supernatural legend preserved in the shadows of Kalapur.
            </p>
          </motion.div>
        )}

        {/* SCENE 2: STRANGE CREATION Studio & Soham Dnyaneshwar Lokhande & MR STRANGE 1229 */}
        {scene === 2 && (
          <motion.div
            key="scene-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-6 max-w-4xl"
          >
            {/* Official Logo Banner */}
            <div className="relative w-72 md:w-96 aspect-video rounded-lg overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.7)] border-2 border-red-700/80 mb-5 bg-black">
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Logo - Strange Creation"
                className="w-full h-full object-contain filter contrast-125 brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -inset-1 rounded-lg border border-red-500/30 animate-pulse pointer-events-none" />
            </div>

            <motion.h1
              initial={{ letterSpacing: '0.25em' }}
              animate={{ letterSpacing: '0.45em' }}
              transition={{ duration: 3.5 }}
              className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-red-600 uppercase mb-2 drop-shadow-[0_4px_24px_rgba(200,0,0,0.8)]"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              STRANGE CREATION
            </motion.h1>

            <div className="space-y-1 pt-1">
              <p className="text-xs tracking-[0.3em] text-red-400 uppercase font-sans font-semibold">
                Created &amp; Directed by
              </p>
              <p className="text-xl md:text-2xl text-stone-100 tracking-widest font-serif font-bold">
                Soham Dnyaneshwar Lokhande
              </p>
              <div className="flex items-center justify-center gap-2 pt-1.5 text-stone-400 text-xs tracking-wider">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="font-mono text-stone-300">MR STRANGE 1229</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCENE 3: The Haunted Mansion Silhouette in the Monsoon */}
        {scene === 3 && (
          <motion.div
            key="scene-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8 }}
            className="relative flex flex-col items-center text-center px-6 max-w-4xl"
          >
            {/* Haveli Arch Silhouette with glowing blood-red window */}
            <div className="relative w-80 md:w-96 h-52 border-t-4 border-l-4 border-r-4 border-stone-800/80 rounded-t-full flex flex-col items-center justify-center bg-gradient-to-b from-red-950/30 to-black/95 p-6 mb-6 shadow-[0_0_80px_rgba(0,0,0,0.95)]">
              {/* Eerie Glowing Red Window */}
              <div className="w-8 h-12 bg-red-600 rounded-t-sm shadow-[0_0_30px_#ff0000] border border-red-400/80 mb-2 animate-pulse flex items-center justify-center">
                <div className="w-1.5 h-6 bg-black/60 rounded-full" />
              </div>
              <div className="text-stone-500 text-[10px] tracking-[0.3em] uppercase font-mono">
                KALAPUR ESTATE • RAJASTHANI-KONKAN HAVELI
              </div>
            </div>

            <p className="text-stone-300 text-lg md:text-2xl font-light tracking-wide italic">
              A century of silence... shattered by an awakened presence.
            </p>
            <span className="text-stone-500 text-xs tracking-widest uppercase mt-3 font-sans">
              Thunder and rain lash against the barred doors
            </span>
          </motion.div>
        )}

        {/* SCENE 4: Corridor Approach & The Kalapur Ghost Reveal */}
        {scene === 4 && (
          <motion.div
            key="scene-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="relative flex flex-col items-center text-center px-4"
          >
            <div className="relative w-64 md:w-80 h-80 border-2 border-red-900/50 bg-stone-950 rounded flex flex-col items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.7)]">
              {/* Ghost Silhouette */}
              <div className="w-24 h-24 rounded-full bg-stone-900 border border-red-600 flex items-center justify-center mb-4">
                <div className="flex gap-5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_20px_#ff0000] animate-ping" />
                  <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_20px_#ff0000] animate-ping" />
                </div>
              </div>
              <div className="w-40 h-28 bg-gradient-to-b from-stone-700/40 to-transparent rounded-t-full" />
              <p className="absolute bottom-4 text-red-500 font-mono text-xs tracking-[0.3em] uppercase font-bold">
                SHE HAS AWAKENED
              </p>
            </div>
            <p className="text-red-400 font-serif text-2xl tracking-widest mt-6 font-bold animate-pulse">
              THE KALAPUR GHOST
            </p>
          </motion.div>
        )}

        {/* SCENE 5: Grand Reveal of Official Game Logo Artwork */}
        {scene === 5 && (
          <motion.div
            key="scene-5"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-6 max-w-4xl"
          >
            {/* Master Game Logo Image Asset */}
            <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow-[0_0_100px_rgba(180,0,0,0.7)] border border-red-900/60 mb-6 bg-black flex items-center justify-center">
              <img
                src={officialLogoImg}
                alt="The Curse of Kalapur Official Logo by Strange Creation"
                className="w-full h-full object-contain filter contrast-125 brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Subtitle & Credits */}
            <div className="space-y-2">
              <p className="text-stone-300 text-sm md:text-lg tracking-[0.3em] uppercase font-sans font-semibold">
                Escape the house. Discover the truth.
              </p>
              <div className="h-0.5 w-64 mx-auto bg-gradient-to-r from-transparent via-red-600 to-transparent my-3" />
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs tracking-widest uppercase text-stone-400 font-sans">
                <span className="text-red-400 font-bold">STRANGE CREATION</span>
                <span>•</span>
                <span className="text-stone-200">Soham Dnyaneshwar Lokhande</span>
                <span>•</span>
                <span className="text-stone-400 flex items-center gap-1 font-mono">
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> MR STRANGE 1229
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Subtitles at bottom center */}
      <div className="absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 text-center px-6 py-2.5 bg-black/80 rounded border border-stone-800/80 text-stone-300 text-xs md:text-sm tracking-wider font-sans max-w-xl backdrop-blur-md z-40">
        {subtitles}
      </div>
    </div>
  );
};
