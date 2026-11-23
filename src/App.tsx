import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { CinematicIntro } from './components/CinematicIntro';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { CinematicEnding } from './components/CinematicEnding';
import { LandingPage } from './components/LandingPage';
import { PWAInstallModal } from './components/PWAInstallModal';
import { RateUsModal, loadSavedRating, SavedPlayerRating } from './components/RateUsModal';
import { AppSplashLoader } from './components/AppSplashLoader';
import { GameErrorBoundary } from './components/GameErrorBoundary';
import { usePWA, detectIsStandalone } from './hooks/usePWA';
import { gameState } from './game/gameState';
import { soundManager } from './audio/SoundManager';
import { InteractiveObject } from './game/houseGeometry';

const GameCanvas = lazy(() =>
  import('./components/GameCanvas').then((m) => ({ default: m.GameCanvas }))
);

type GameMode = 'landing' | 'intro' | 'menu' | 'playing' | 'paused' | 'ending';

export default function App() {
  const [mode, setMode] = useState<GameMode>(() => (detectIsStandalone() ? 'intro' : 'landing'));
  const [showInitialSplash, setShowInitialSplash] = useState<boolean>(() => detectIsStandalone());
  const [sessionKey, setSessionKey] = useState(0);
  const [isContinueSession, setIsContinueSession] = useState(false);
  const [currentInteractive, setCurrentInteractive] = useState<InteractiveObject | null>(null);
  const [jumpscareFlash, setJumpscareFlash] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [savedRating, setSavedRating] = useState<SavedPlayerRating | null>(() => loadSavedRating());
  const [hasSave, setHasSave] = useState<boolean>(() => gameState.hasSave());

  const {
    canPromptInstall,
    isStandalone,
    isInstalled,
    isIOS,
    isOnline,
    swReady,
    updateAvailable,
    checkingUpdate,
    updateStatusMessage,
    promptNativeInstall,
    checkForUpdates,
    applyUpdate,
  } = usePWA();

  // Brief branded app splash transition when opened as installed standalone PWA
  useEffect(() => {
    if (!showInitialSplash) return;
    const timer = window.setTimeout(() => setShowInitialSplash(false), 650);
    return () => window.clearTimeout(timer);
  }, [showInitialSplash]);

  // Keep body scroll & touch-action matched cleanly to landing vs 3D gameplay
  useEffect(() => {
    if (mode === 'landing') {
      document.body.classList.remove('overflow-hidden', 'touch-none', 'select-none');
    } else {
      document.body.classList.add('overflow-hidden', 'touch-none', 'select-none');
    }
    setHasSave(gameState.hasSave());
  }, [mode]);

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
      setJumpscareFlash(false);
      setMode('ending');
    };
    window.addEventListener('kalapur:escaped', handleEscaped);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kalapur:escaped', handleEscaped);
    };
  }, []);

  const requestLandscapeFullscreen = () => {
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);
    if (!isTouch) return;
    try {
      const docEl = document.documentElement;
      if (!document.fullscreenElement && docEl.requestFullscreen) {
        docEl
          .requestFullscreen()
          .then(() => {
            (screen.orientation as { lock?: (o: string) => Promise<void> })?.lock?.('landscape')?.catch?.(() => {});
          })
          .catch(() => {});
      } else {
        (screen.orientation as { lock?: (o: string) => Promise<void> })?.lock?.('landscape')?.catch?.(() => {});
      }
    } catch {
      // Ignore unsupported browsers
    }
  };

  const handleStartPlay = useCallback(() => {
    requestLandscapeFullscreen();
    gameState.resetGame();
    setJumpscareFlash(false);
    setIsContinueSession(false);
    setSessionKey((k) => k + 1);
    setMode('playing');
    soundManager.setMusicMood('explore');
    gameState.showSubtitle('You entered Kalapur House. Find a way to unlock the exit door.', 5000);
  }, []);

  const handleContinue = useCallback(() => {
    requestLandscapeFullscreen();
    const saved = gameState.loadGame();
    if (saved) {
      setJumpscareFlash(false);
      setIsContinueSession(true);
      setSessionKey((k) => k + 1);
      setMode('playing');
      soundManager.setMusicMood('explore');
      gameState.showSubtitle('Resumed from latest checkpoint.', 4000);
    } else {
      handleStartPlay();
    }
  }, [handleStartPlay]);

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
    // Save checkpoint at live player coordinates
    gameState.saveGame(
      [...gameState.checkpointPos] as [number, number, number],
      gameState.checkpointRot
    );
    setHasSave(gameState.hasSave());
  }, []);

  const handleInstallClick = useCallback(async () => {
    const result = await promptNativeInstall();
    if (result === 'unavailable') {
      setShowInstallModal(true);
    }
  }, [promptNativeInstall]);

  if (showInitialSplash) {
    return <AppSplashLoader message="Launching Standalone App..." />;
  }

  if (mode === 'landing') {
    return (
      <>
        <LandingPage
          onPlayGame={() => {
            window.scrollTo(0, 0);
            setMode('intro');
          }}
          onContinueGame={handleContinue}
          hasSave={hasSave}
          onInstallClick={handleInstallClick}
          canPromptInstall={canPromptInstall}
          isInstalled={isInstalled}
          isStandalone={isStandalone}
          isOnline={isOnline}
          swReady={swReady}
          updateAvailable={updateAvailable}
          checkingUpdate={checkingUpdate}
          updateStatusMessage={updateStatusMessage}
          onCheckUpdates={() => void checkForUpdates(false)}
          onApplyUpdate={applyUpdate}
          onRateClick={() => setShowRateModal(true)}
          savedRating={savedRating}
        />
        <PWAInstallModal
          open={showInstallModal}
          isIOS={isIOS}
          onClose={() => setShowInstallModal(false)}
        />
        <RateUsModal
          open={showRateModal}
          onClose={() => setShowRateModal(false)}
          onSaved={(rating) => setSavedRating(rating)}
        />
      </>
    );
  }

  return (
    <GameErrorBoundary onReturnHome={() => setMode('landing')}>
      <main className="relative w-screen h-screen bg-black overflow-hidden select-none">
        {/* 3D WebGL Canvas Layer (lazy-loaded with splash fallback & error boundary) */}
        {mode !== 'intro' && (
          <Suspense fallback={<AppSplashLoader />}>
            <GameCanvas
              mode={mode === 'paused' ? 'playing' : mode}
              sessionKey={sessionKey}
              isContinueSession={isContinueSession}
              onCatchPlayer={handleCatchPlayer}
              onInteractiveChange={setCurrentInteractive}
              onSaveProgress={handleSaveProgress}
            />
          </Suspense>
        )}

        {/* 1. CINEMATIC INTRO (Preserved) */}
        {mode === 'intro' && (
          <CinematicIntro onComplete={() => setMode('menu')} />
        )}

        {/* 2. MAIN MENU (Preserved + Website & Update Banner) */}
        {mode === 'menu' && (
          <MainMenu
            onPlay={handleStartPlay}
            onContinue={handleContinue}
            onReplayIntro={handleReplayIntro}
            onBackToWebsite={
              isStandalone
                ? undefined
                : () => {
                    soundManager.stopSongTrack();
                    setMode('landing');
                  }
            }
            onInstallApp={!isInstalled && !isStandalone ? handleInstallClick : undefined}
            onRateUs={() => setShowRateModal(true)}
            updateAvailable={updateAvailable}
            onApplyUpdate={applyUpdate}
          />
        )}

        {/* 3. IN-GAME HUD */}
        {mode === 'playing' && (
          <HUD
            currentInteractive={currentInteractive}
            onPause={() => setMode('paused')}
            onPlayAgain={handleStartPlay}
            onMainMenu={() => {
              setJumpscareFlash(false);
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
              setJumpscareFlash(false);
              soundManager.setMusicMood('menu');
              soundManager.stopTatyaTrack();
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
                {gameState.settings.villainType === 'tatya' ? 'TATYA VINCHU CAUGHT YOU' : 'THE KALAPUR GHOST CAUGHT YOU'}
              </h2>
              <p className="text-stone-300 font-mono text-xs uppercase tracking-[0.3em] mt-3">
                {gameState.settings.villainType === 'tatya' ? '"OM PHAT SWAHA!" • NEXT DAY AWAKENING...' : 'NEXT DAY AWAKENING...'}
              </p>
            </div>
          </div>
        )}

        <PWAInstallModal
          open={showInstallModal}
          isIOS={isIOS}
          onClose={() => setShowInstallModal(false)}
        />
        <RateUsModal
          open={showRateModal}
          onClose={() => setShowRateModal(false)}
          onSaved={(rating) => setSavedRating(rating)}
        />
      </main>
    </GameErrorBoundary>
  );
}
