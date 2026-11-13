import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { CinematicIntro } from './components/CinematicIntro';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { CinematicEnding } from './components/CinematicEnding';
import { gameState } from './game/gameState';
import { soundManager } from './audio/SoundManager';
import { InteractiveObject } from './game/houseGeometry';

type GameMode = 'intro' | 'menu' | 'playing' | 'paused' | 'ending';

export default function App() {
  const [mode, setMode] = useState<GameMode>('intro');
  const [currentInteractive, setCurrentInteractive] = useState<InteractiveObject | null>(null);
  const [jumpscareFlash, setJumpscareFlash] = useState(false);

  // Initialize Audio & Global Esc key for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setMode((prev) => {
          if (prev === 'playing') return 'paused';
          if (prev === 'paused') return 'playing';
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Listen for final escape victory
    const handleEscaped = () => {
      setMode('ending');
    };
    window.addEventListener('kalapur:escaped', handleEscaped);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kalapur:escaped', handleEscaped);
    };
  }, []);

  const handleStartPlay = () => {
    gameState.resetGame();
    setMode('playing');
    soundManager.setMusicMood('explore');
    gameState.showSubtitle('You entered Kalapur House. Find a way to unlock the exit door.', 5000);
  };

  const handleContinue = () => {
    const saved = gameState.loadGame();
    if (saved) {
      setMode('playing');
      soundManager.setMusicMood('explore');
      gameState.showSubtitle('Resumed from latest checkpoint.', 4000);
    } else {
      handleStartPlay();
    }
  };

  const handleReplayIntro = () => {
    setMode('intro');
  };

  const handleCatchPlayer = useCallback(() => {
    setJumpscareFlash(true);
    setTimeout(() => {
      setJumpscareFlash(false);
    }, 1500);
  }, []);

  const handleSaveProgress = useCallback(() => {
    // Save checkpoint at current player position
    gameState.saveGame(gameState.checkpointPos, gameState.checkpointRot);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer (active during menu, playing, paused, and ending) */}
      {mode !== 'intro' && (
        <GameCanvas
          mode={mode === 'paused' ? 'playing' : mode}
          onCatchPlayer={handleCatchPlayer}
          onInteractiveChange={setCurrentInteractive}
          onSaveProgress={handleSaveProgress}
        />
      )}

      {/* 1. CINEMATIC INTRO */}
      {mode === 'intro' && (
        <CinematicIntro onComplete={() => setMode('menu')} />
      )}

      {/* 2. MAIN MENU */}
      {mode === 'menu' && (
        <MainMenu
          onPlay={handleStartPlay}
          onContinue={handleContinue}
          onReplayIntro={handleReplayIntro}
        />
      )}

      {/* 3. IN-GAME HUD */}
      {mode === 'playing' && (
        <HUD
          currentInteractive={currentInteractive}
          onPause={() => setMode('paused')}
          onMainMenu={() => {
            soundManager.setMusicMood('menu');
            soundManager.stopTatyaTrack();
            setMode('menu');
          }}
        />
      )}

      {/* 4. PAUSE MENU */}
      {mode === 'paused' && (
        <PauseMenu
          onResume={() => setMode('playing')}
          onSave={handleSaveProgress}
          onMainMenu={() => {
            soundManager.setMusicMood('menu');
            setMode('menu');
          }}
        />
      )}

      {/* 5. CINEMATIC ENDING */}
      {mode === 'ending' && (
        <CinematicEnding
          onRestart={handleStartPlay}
          onMainMenu={() => {
            soundManager.setMusicMood('menu');
            setMode('menu');
          }}
        />
      )}

      {/* Red Jumpscare Capture Screen Flash */}
      {jumpscareFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-950/80 animate-ping flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-5xl font-black text-red-500 font-serif tracking-widest drop-shadow-[0_0_30px_#ff0000]">
              {gameState.settings.villainType === 'tatya' ? 'TATYA VINCHOO CAUGHT YOU' : 'THE KALAPUR GHOST CAUGHT YOU'}
            </h2>
            <p className="text-stone-300 font-mono text-xs uppercase tracking-[0.3em] mt-3">
              {gameState.settings.villainType === 'tatya' ? '"OM PHAT SWAHA!" • RESPAWNING AT CHECKPOINT...' : 'RESPAWNING AT CHECKPOINT...'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
