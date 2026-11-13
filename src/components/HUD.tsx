import React, { useState, useEffect, useRef } from 'react';
import { gameState } from '../game/gameState';
import { InteractiveObject } from '../game/houseGeometry';
import { soundManager } from '../audio/SoundManager';
import {
  Flashlight,
  Key,
  Image as ImageIcon,
  Battery,
  AlertTriangle,
  X,
  Footprints,
  Compass,
  Hand,
  Zap,
  Smartphone,
  ShieldAlert,
  Scissors,
  Calendar,
  Skull,
  Lock,
  Unlock,
  Music,
  Bell,
  Wrench,
  Maximize2,
  RotateCw,
} from 'lucide-react';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface HUDProps {
  currentInteractive: InteractiveObject | null;
  onPause: () => void;
  onMainMenu?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ currentInteractive, onPause, onMainMenu }) => {
  const [, setTick] = useState(0);

  // Auto-detect mobile / touch capability, but allow toggle
  const [touchEnabled, setTouchEnabled] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024)
    );
  });

  // Virtual Joystick State (Zero-Re-Render DOM transform for 120Hz zero-lag feel)
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const isMouseDownOnJoystick = useRef(false);
  const lastTouchActionTime = useRef(0);

  // Landscape orientation helper state for Android phones
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [dismissRotateHint, setDismissRotateHint] = useState(false);

  // Touch Look Dragging State
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });
  const isMouseDownOnLook = useRef(false);

  const closeDiary = () => {
    gameState.activeDiaryNote = null;
    gameState.notify();
  };

  const enterHorizontalFullscreen = () => {
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
      // ignore
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const dx = clientX - joystickCenter.current.x;
    const dy = clientY - joystickCenter.current.y;
    const baseSize = joystickRef.current ? joystickRef.current.clientWidth : 152;
    const maxRadius = Math.max(48, Math.round(baseSize * 0.35));
    const distance = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (distance > maxRadius) {
      clampedX = (dx / distance) * maxRadius;
      clampedY = (dy / distance) * maxRadius;
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }

    // Send normalized touch vector into game state (-1 to 1)
    gameState.touchMove.x = clampedX / maxRadius;
    gameState.touchMove.z = clampedY / maxRadius;
  };

  const resetJoystick = () => {
    joystickTouchId.current = null;
    isMouseDownOnJoystick.current = false;
    setJoystickActive(false);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    gameState.touchMove.x = 0;
    gameState.touchMove.z = 0;
  };

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setJoystickActive(true);

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateJoystick(touch.clientX, touch.clientY);
    }
  };

  // Mouse fallback for testing on desktop / Android with mouse
  const handleJoystickMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isMouseDownOnJoystick.current = true;
    setJoystickActive(true);
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateJoystick(e.clientX, e.clientY);
    }
  };

  // Fullscreen Touch Look handlers
  const handleLookStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownOnLook.current = true;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
  };

  // Instant Touch Action Triggers (prevents 300ms click delay & accidental swipe cancel on Android)
  const triggerTouchAction = (e: React.MouseEvent | React.TouchEvent, fn: () => void) => {
    e.stopPropagation();
    if (e.type === 'touchstart') {
      e.preventDefault();
      lastTouchActionTime.current = performance.now();
      fn();
    } else if (performance.now() - lastTouchActionTime.current > 350) {
      fn();
    }
  };

  const handleTouchInteract = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchInteract?.());
  };

  const handleTouchFlashlight = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchFlashlight?.());
  };

  const handleTouchSprintToggle = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => {
      gameState.touchSprint = !gameState.touchSprint;
      gameState.isSprinting = gameState.touchSprint;
      gameState.notify();
    });
  };

  const handleTouchCrouchToggle = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => {
      gameState.isCrouching = !gameState.isCrouching;
      gameState.notify();
    });
  };

  // Global window listeners so dragging outside boundaries is smooth and never gets stuck
  useEffect(() => {
    const unsub = gameState.subscribe(() => {
      setTick((t) => t + 1);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // 'M' toggles the horror background song
      if (e.code === 'KeyM' && !e.repeat) {
        const next = soundManager.toggleSong();
        gameState.showSubtitle(next ? "Horror Song: ON ('Count the Doors')" : "Horror Song: OFF", 2500);
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      // Joystick movement
      if (joystickTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joystickTouchId.current) {
            updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }

      // Look drag
      if (lookTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchId.current) {
            const touch = e.changedTouches[i];
            const deltaX = touch.clientX - lastLookPos.current.x;
            const deltaY = touch.clientY - lastLookPos.current.y;
            lastLookPos.current = { x: touch.clientX, y: touch.clientY };
            gameState.touchLook.x += deltaX;
            gameState.touchLook.y += deltaY;
            break;
          }
        }
      }
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      if (joystickTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joystickTouchId.current) {
            resetJoystick();
            break;
          }
        }
      }

      if (lookTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchId.current) {
            lookTouchId.current = null;
            break;
          }
        }
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isMouseDownOnJoystick.current) {
        updateJoystick(e.clientX, e.clientY);
      }
      if (isMouseDownOnLook.current) {
        const deltaX = e.clientX - lastLookPos.current.x;
        const deltaY = e.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: e.clientX, y: e.clientY };
        gameState.touchLook.x += deltaX;
        gameState.touchLook.y += deltaY;
      }
    };

    const handleWindowMouseUp = () => {
      if (isMouseDownOnJoystick.current) {
        resetJoystick();
      }
      if (isMouseDownOnLook.current) {
        isMouseDownOnLook.current = false;
      }
    };

    const handleOrientationCheck = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleOrientationCheck);
    window.addEventListener('orientationchange', handleOrientationCheck);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleOrientationCheck);
      window.removeEventListener('orientationchange', handleOrientationCheck);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  // Glitch intensity from ghost
  const glitch = gameState.screenGlitchIntensity;
  const isChasing = gameState.ghostState === 'chase';
  const isHiding = gameState.isHiding !== null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden font-sans">
      {/* 1. HORROR SCREEN EFFECTS & VIGNETTE */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />

      {/* Ghost Chase / Danger Vignette (Pulsing Blood Red) */}
      {(glitch > 0 || isChasing) && (
        <div
          className="absolute inset-0 transition-opacity duration-200 pointer-events-none"
          style={{
            backgroundColor: `rgba(180, 0, 0, ${Math.min(0.5, glitch * 0.45)})`,
            boxShadow: `inset 0 0 ${glitch * 120}px rgba(255, 0, 0, ${glitch * 0.8})`,
          }}
        />
      )}

      {/* Ghost Proximity Static Glitch Lines */}
      {glitch > 0.3 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 bg-repeat"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)',
          }}
        />
      )}

      {/* Hiding Overlay (Wardrobe Slats / Underbed Darkness) */}
      {isHiding && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
          <div className="w-full h-1/4 bg-black/90 border-b-4 border-stone-900" />
          <div className="flex justify-between items-center px-6 md:px-12">
            <div className="w-12 md:w-16 h-full bg-black/85" />
            <div className="text-center bg-black/80 px-6 py-4 rounded border border-red-900/60 text-stone-300 shadow-2xl">
              <span className="text-red-400 font-bold uppercase tracking-widest text-xs block mb-1">
                Currently Hiding ({gameState.isHiding === 'wardrobe' ? 'Wardrobe' : 'Under Bed'})
              </span>
              <p className="text-xs text-stone-400 mb-3">Villain cannot see you here!</p>
              <button
                onClick={handleTouchInteract}
                className="pointer-events-auto px-5 py-2 bg-red-900/80 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider rounded border border-red-500 shadow-lg cursor-pointer"
              >
                Step Out of Hiding [E]
              </button>
            </div>
            <div className="w-12 md:w-16 h-full bg-black/85" />
          </div>
          <div className="w-full h-1/4 bg-black/90 border-t-4 border-stone-900" />
        </div>
      )}

      {/* 1B. ANDROID PORTRAIT-TO-HORIZONTAL HELPER BANNER (Non-blocking) */}
      {touchEnabled && isPortrait && !dismissRotateHint && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm bg-stone-950/95 border border-red-600/80 rounded-lg p-3 shadow-2xl pointer-events-auto flex items-center justify-between gap-2 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-left">
            <RotateCw className="w-5 h-5 text-red-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
            <div>
              <p className="text-xs font-bold text-stone-100">Rotate Phone Horizontally</p>
              <p className="text-[10px] text-stone-400">Best view &amp; controls in landscape</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={enterHorizontalFullscreen}
              className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded cursor-pointer"
            >
              Rotate
            </button>
            <button
              onClick={() => setDismissRotateHint(true)}
              className="p-1 text-stone-400 hover:text-white cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP BAR: OBJECTIVE BADGE, DAY COUNTER, TOUCH TOGGLE, AND PAUSE BUTTON */}
      <div className="absolute top-2.5 sm:top-4 left-3 sm:left-5 right-3 sm:right-5 flex justify-between items-start gap-2 z-20 pointer-events-none">
        <div className="flex flex-row items-start gap-2">
          {/* Day Indicator Badge (4 Days Escape System) */}
          <div
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded border backdrop-blur-sm shadow-lg flex items-center gap-1.5 shrink-0 ${
              gameState.currentDay === 4
                ? 'bg-red-950/95 border-red-500 text-red-200 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-stone-950/85 border-stone-800 text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-mono tracking-widest uppercase text-stone-400 font-bold hidden sm:inline">
                {gameState.currentDay === 4 ? 'FINAL DAY' : 'ESCAPE PLAN'}
              </span>
              <span className="text-[11px] sm:text-xs font-serif font-black tracking-wider text-red-400">
                DAY {gameState.currentDay}/4
              </span>
            </div>
          </div>

          {/* Objective Pill */}
          <div className="bg-stone-950/85 border border-stone-800/90 rounded px-2.5 py-1.5 sm:px-3.5 sm:py-2 backdrop-blur-sm max-w-[190px] sm:max-w-xs md:max-w-md shadow-lg">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Compass className="w-3 h-3 text-red-500 animate-spin shrink-0" style={{ animationDuration: '8s' }} />
              <span className="text-[8px] sm:text-[9px] text-red-400 font-mono tracking-widest uppercase font-bold">
                Mission
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-200 font-serif font-medium leading-tight line-clamp-2">
              {gameState.currentObjective}
            </p>
          </div>
        </div>

        {/* Ghost Warning Indicator (if in chase) */}
        {isChasing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/95 border border-red-600 rounded text-red-200 text-[10px] sm:text-xs tracking-widest uppercase font-bold animate-bounce shadow-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">VILLAIN PURSUING</span>
          </div>
        )}

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          {/* Landscape Fullscreen Button (Android Horizontal) */}
          {touchEnabled && (
            <button
              onClick={enterHorizontalFullscreen}
              title="Fullscreen Horizontal Mode"
              className="px-2 py-1.5 rounded text-[10px] font-mono bg-stone-900/85 hover:bg-stone-800 border border-stone-700/70 text-stone-200 flex items-center gap-1 cursor-pointer backdrop-blur-sm shadow-md"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">FULL</span>
            </button>
          )}

          {/* Toggle Song Button */}
          <button
            onClick={() => {
              const next = soundManager.toggleSong();
              gameState.showSubtitle(next ? "Horror Song: ON ('Count the Doors')" : "Horror Song: OFF", 2500);
            }}
            title="Toggle Horror Song: Count the Doors (M)"
            className={`px-2 py-1.5 rounded text-[10px] font-mono tracking-wider flex items-center gap-1 border transition cursor-pointer backdrop-blur-sm shadow-md ${
              gameState.settings.songEnabled
                ? 'bg-amber-950/85 border-amber-500/80 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                : 'bg-stone-900/80 border-stone-700/60 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${gameState.settings.songEnabled ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
            <span className="hidden md:inline">Song:</span>
            <span>{gameState.settings.songEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Touch Controls Button */}
          <button
            onClick={() => setTouchEnabled((v) => !v)}
            title="Toggle Android On-Screen Joystick & Controls"
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono tracking-wider flex items-center gap-1 border transition cursor-pointer backdrop-blur-sm shadow-md ${
              touchEnabled
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-stone-900/80 border-stone-700/60 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span className="font-bold">{touchEnabled ? 'PAD ON' : 'PAD OFF'}</span>
          </button>

          {/* Strange Creation Studio Watermark Badge */}
          <div
            title="STRANGE CREATION - Dir. Soham Lokhande"
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-stone-950/85 border border-amber-900/50 rounded backdrop-blur-sm shadow-md"
          >
            <img
              src={officialLogoImg}
              alt="Strange Creation"
              className="w-4 h-4 rounded-full object-cover border border-amber-500/50"
            />
            <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase">
              Strange Creation
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="px-2.5 py-1.5 bg-stone-900/85 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer backdrop-blur-sm shadow-md font-semibold"
          >
            Pause
          </button>
        </div>
      </div>

      {/* 3. CENTER CROSSHAIR & INTERACTION PROMPT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        {/* Reticle */}
        <div
          className={`w-2 h-2 rounded-full transition-all duration-150 ${
            currentInteractive
              ? 'w-4 h-4 bg-red-500 shadow-[0_0_12px_#ff0000] scale-125'
              : 'bg-stone-400/70'
          }`}
        />

        {/* Interaction Prompt Tooltip */}
        {currentInteractive && (
          <div className="mt-4 px-3 py-1.5 bg-stone-950/90 border border-stone-700 rounded text-stone-100 text-[11px] sm:text-xs tracking-wide font-sans shadow-2xl backdrop-blur-md flex items-center gap-2 animate-pulse">
            <span className="px-1.5 py-0.5 bg-red-700 text-white font-mono text-[10px] font-bold rounded">
              {touchEnabled ? 'TAP' : 'E'}
            </span>
            <span>{currentInteractive.prompt}</span>
          </div>
        )}
      </div>

      {/* 4. ANDROID / FULLSCREEN TOUCH LOOK DRAG ZONE (Entire viewport behind controls) */}
      {touchEnabled && (
        <div
          className="absolute inset-0 pointer-events-auto touch-none z-10 select-none"
          onTouchStart={handleLookStart}
          onMouseDown={handleLookMouseDown}
        />
      )}

      {/* 5. VIRTUAL JOYSTICK (RAISED & ENLARGED FOR ANDROID HORIZONTAL PLAY) */}
      {touchEnabled && (
        <div
          className="absolute bottom-11 sm:bottom-14 left-4 sm:left-7 z-20 pointer-events-auto select-none touch-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Mobile Battery & Stamina Mini HUD above Joystick */}
          <div className="mb-2 flex flex-col gap-1.5 w-36 sm:w-44 pointer-events-none">
            {/* Flashlight Battery Bar */}
            <div className="flex items-center gap-1.5 bg-black/80 border border-stone-800/90 px-2.5 py-1 rounded backdrop-blur-xs shadow-md">
              <Flashlight
                className={`w-3.5 h-3.5 ${
                  gameState.flashlightOn && gameState.flashlightBattery > 0 ? 'text-yellow-400 animate-pulse' : 'text-stone-500'
                }`}
              />
              <div className="flex-1 bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gameState.flashlightBattery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${gameState.flashlightBattery}%` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-stone-200 font-bold">{Math.round(gameState.flashlightBattery)}%</span>
            </div>

            {/* Stamina Bar */}
            <div className="flex items-center gap-1.5 bg-black/80 border border-stone-800/90 px-2.5 py-1 rounded backdrop-blur-xs shadow-md">
              <Footprints
                className={`w-3.5 h-3.5 ${gameState.isSprinting ? 'text-red-400 animate-pulse' : 'text-stone-500'}`}
              />
              <div className="flex-1 bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${gameState.stamina}%` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-stone-200 font-bold">{Math.round(gameState.stamina)}%</span>
            </div>
          </div>

          {/* Enlarged Joystick Base */}
          <div
            ref={joystickRef}
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 bg-stone-950/75 backdrop-blur-md relative flex items-center justify-center touch-none shadow-2xl cursor-pointer ${
              joystickActive
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.55)]'
                : 'border-stone-600/85'
            }`}
            onTouchStart={handleJoystickStart}
            onMouseDown={handleJoystickMouseDown}
          >
            {/* Outer concentric guide ring */}
            <div className="absolute inset-3 rounded-full border border-stone-700/70 pointer-events-none" />

            {/* Guide directional cross marks */}
            <div className="absolute top-2 text-xs font-mono text-stone-400 font-bold pointer-events-none">▲</div>
            <div className="absolute bottom-2 text-xs font-mono text-stone-400 font-bold pointer-events-none">▼</div>
            <div className="absolute left-2.5 text-xs font-mono text-stone-400 font-bold pointer-events-none">◀</div>
            <div className="absolute right-2.5 text-xs font-mono text-stone-400 font-bold pointer-events-none">▶</div>

            {/* Moving Knob (Zero-latency direct DOM transform) */}
            <div
              ref={knobRef}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-b from-red-600 via-stone-900 to-black border-2 border-red-400 shadow-[0_0_22px_rgba(239,68,68,0.75)] flex items-center justify-center pointer-events-none will-change-transform"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-400/90 shadow-inner flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/85" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM DESKTOP STATUS BARS (BATTERY & STAMINA) */}
      {!touchEnabled && (
        <div className="absolute bottom-6 left-6 space-y-2 pointer-events-auto z-20">
          {/* Flashlight Battery */}
          <div className="bg-stone-950/85 border border-stone-800/80 rounded px-3 py-2 backdrop-blur-sm flex items-center gap-3 w-48 shadow-lg">
            <Flashlight
              className={`w-4 h-4 ${
                gameState.flashlightOn && gameState.flashlightBattery > 0
                  ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                  : 'text-stone-600'
              }`}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-stone-400 font-mono mb-1">
                <span>BATTERY</span>
                <span>{Math.round(gameState.flashlightBattery)}%</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gameState.flashlightBattery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${gameState.flashlightBattery}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sprint Stamina */}
          <div className="bg-stone-950/85 border border-stone-800/80 rounded px-3 py-2 backdrop-blur-sm flex items-center gap-3 w-48 shadow-lg">
            <Footprints
              className={`w-4 h-4 ${
                gameState.isSprinting ? 'text-red-400 animate-pulse' : 'text-stone-500'
              }`}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-stone-400 font-mono mb-1">
                <span>STAMINA</span>
                <span>{Math.round(gameState.stamina)}%</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-300 transition-all duration-100"
                  style={{ width: `${gameState.stamina}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ANDROID / TOUCH SCREEN ACTION BUTTON CLUSTER (RAISED & ENLARGED FOR HORIZONTAL PLAY) */}
      {touchEnabled ? (
        <div
          className="absolute bottom-11 sm:bottom-14 right-4 sm:right-7 z-20 pointer-events-auto flex items-end gap-3 sm:gap-4 touch-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Secondary Action Grid (Flashlight, Sprint, Crouch) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2.5 sm:gap-3 items-center">
            {/* Flashlight Toggle Button */}
            <button
              onTouchStart={handleTouchFlashlight}
              onClick={handleTouchFlashlight}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer backdrop-blur-sm touch-none ${
                gameState.flashlightOn && gameState.flashlightBattery > 0
                  ? 'bg-yellow-950/85 border-yellow-400 text-yellow-300 shadow-[0_0_16px_rgba(234,179,8,0.55)]'
                  : 'bg-stone-900/85 border-stone-600 text-stone-400'
              }`}
              title="Toggle Flashlight (F)"
            >
              <Flashlight className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase">
                {gameState.flashlightOn ? 'LIGHT' : 'TORCH'}
              </span>
            </button>

            {/* Sprint Toggle Button */}
            <button
              onTouchStart={handleTouchSprintToggle}
              onClick={handleTouchSprintToggle}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer backdrop-blur-sm touch-none ${
                gameState.isSprinting
                  ? 'bg-red-950/90 border-red-400 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.6)]'
                  : 'bg-stone-900/85 border-stone-600 text-stone-300'
              }`}
              title="Toggle Run"
            >
              <Footprints className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase">
                {gameState.isSprinting ? 'RUN' : 'WALK'}
              </span>
            </button>

            {/* Stealth Crouch Toggle Button */}
            <button
              onTouchStart={handleTouchCrouchToggle}
              onClick={handleTouchCrouchToggle}
              className={`col-span-2 sm:col-span-1 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer backdrop-blur-sm justify-self-end touch-none ${
                gameState.isCrouching
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-stone-900/85 border-stone-600 text-stone-300'
              }`}
              title="Toggle Stealth Crouch (Zero Noise)"
            >
              <ShieldAlert className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase">
                {gameState.isCrouching ? 'SILENT' : 'CROUCH'}
              </span>
            </button>
          </div>

          {/* Primary Action Button [E / INTERACT] */}
          <button
            onTouchStart={handleTouchInteract}
            onClick={handleTouchInteract}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl transition-all duration-150 active:scale-90 cursor-pointer backdrop-blur-md touch-none ${
              currentInteractive || isHiding
                ? 'bg-linear-to-b from-red-600 to-red-900 border-red-300 text-white shadow-[0_0_28px_rgba(220,38,38,0.85)] animate-pulse'
                : 'bg-stone-950/85 border-stone-600 text-stone-300'
            }`}
            title="Interact (E)"
          >
            <Hand className="w-8 h-8 sm:w-9 sm:h-9 mb-1" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase">
              {isHiding ? 'EXIT' : currentInteractive ? 'ACTION' : 'USE'}
            </span>
          </button>
        </div>
      ) : (
        /* DESKTOP INVENTORY TRAY */
        <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-auto">
          {/* Photo Frame (Core Mission Item) */}
          <div
            className={`flex flex-col items-center justify-center w-16 h-18 rounded border backdrop-blur-sm transition-all duration-300 shadow-xl ${
              gameState.hasPhotoFrame
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                : gameState.framePlacedOnDoor
                ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Ancestor Photo Frame"
          >
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-bold text-center leading-none">
              {gameState.framePlacedOnDoor ? 'PLACED' : 'FRAME'}
            </span>
          </div>

          {/* Old Brass Key */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasBrassKey
                ? 'bg-yellow-950/60 border-yellow-600 text-yellow-300 shadow-[0_0_15px_rgba(202,138,4,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Brass Key"
          >
            <Key className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">BRASS</span>
          </div>

          {/* Sanctum Key */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasAtticKey
                ? 'bg-red-950/60 border-red-600 text-red-300 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Sanctum Key"
          >
            <Key className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">SANCTUM</span>
          </div>

          {/* Heavy Bolt Cutters */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasBoltCutters
                ? 'bg-rose-950/70 border-rose-600 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Heavy Bolt Cutters (cuts gate chains)"
          >
            <Scissors className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">CUTTERS</span>
          </div>

          {/* Heavy Gate Key */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasGateKey
                ? 'bg-amber-950/70 border-amber-600 text-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Gate Key (unlocks gate padlock)"
          >
            <Key className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">GATE KEY</span>
          </div>

          {/* Heavy Steel Crowbar (Escape Route 2) */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasCrowbar
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Heavy Steel Crowbar (pries catacomb hatch bars)"
          >
            <Wrench className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">CROWBAR</span>
          </div>

          {/* Sacred Tantric Bell (Escape Route 2) */}
          <div
            className={`flex flex-col items-center justify-center w-14 h-16 rounded border backdrop-blur-sm transition-all duration-300 shadow-lg ${
              gameState.hasTantricBell
                ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-stone-950/40 border-stone-800/60 text-stone-700'
            }`}
            title="Sacred Tantric Bell (dispels demon blood seal)"
          >
            <Bell className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">BELL</span>
          </div>

          {/* Batteries count */}
          <div className="flex flex-col items-center justify-center w-14 h-16 rounded border bg-stone-950/80 border-stone-800 text-stone-300 backdrop-blur-sm shadow-lg">
            <Battery className="w-5 h-5 text-yellow-500 mb-1" />
            <span className="text-[10px] font-mono font-bold">x{gameState.batteries}</span>
          </div>
        </div>
      )}

      {/* 8. MINI INVENTORY ROW ON TOP WHEN TOUCH IS ACTIVE (Compact single-row horizontal layout) */}
      {touchEnabled && (
        <div className="absolute top-14 sm:top-16 left-3 sm:left-5 flex flex-wrap items-center gap-1 pointer-events-none max-w-lg z-20">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasPhotoFrame
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : gameState.framePlacedOnDoor
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span className="text-[9px] font-mono">
              {gameState.framePlacedOnDoor ? 'MOUNTED' : gameState.hasPhotoFrame ? 'FRAME' : 'NO FRAME'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasBoltCutters
                ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasBoltCutters ? 'CUTTERS' : 'CUTTERS'}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasGateKey
                ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Key className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasGateKey ? 'GATE KEY' : 'GATE KEY'}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasCrowbar
                ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasCrowbar ? 'CROWBAR' : 'CROWBAR'}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasTantricBell
                ? 'bg-purple-950/90 border-purple-500 text-purple-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasTantricBell ? 'BELL' : 'BELL'}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasBrassKey
                ? 'bg-yellow-950/90 border-yellow-500 text-yellow-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Key className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasBrassKey ? 'BRASS' : 'KEY'}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border backdrop-blur-sm text-xs ${
              gameState.hasAtticKey
                ? 'bg-red-950/90 border-red-500 text-red-300'
                : 'bg-stone-950/60 border-stone-800 text-stone-600'
            }`}
          >
            <Key className="w-3 h-3" />
            <span className="text-[9px] font-mono">{gameState.hasAtticKey ? 'SANCTUM' : 'KEY'}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded border bg-stone-950/80 border-stone-800 text-stone-300 backdrop-blur-sm text-xs">
            <Battery className="w-3 h-3 text-yellow-500" />
            <span className="text-[9px] font-mono">{Math.round(gameState.flashlightBattery)}%</span>
          </div>
        </div>
      )}

      {/* 9. BOTTOM CENTER: SUBTITLES */}
      {gameState.subtitleText && (
        <div
          className={`absolute ${
            touchEnabled ? 'bottom-4 sm:bottom-6 max-w-[260px] sm:max-w-md px-4 py-2' : 'bottom-24 md:bottom-20 max-w-2xl px-6 py-3'
          } left-1/2 -translate-x-1/2 text-center rounded text-xs md:text-sm tracking-wide font-sans shadow-2xl backdrop-blur-md transition-all ${
            gameState.subtitleText.includes('TATYA')
              ? 'bg-red-950/95 border-2 border-red-600 text-red-100 font-bold shadow-[0_0_30px_rgba(220,38,38,0.7)]'
              : 'bg-black/90 border border-stone-800/90 text-stone-200'
          }`}
        >
          {gameState.subtitleText}
        </div>
      )}

      {/* 10. DIARY READER MODAL */}
      {gameState.activeDiaryNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto">
          <div className="relative w-full max-w-lg bg-[#2b241a] text-[#f2e6cf] border-4 border-[#5a4831] p-6 md:p-8 rounded shadow-2xl font-serif">
            <button
              onClick={closeDiary}
              className="absolute top-4 right-4 p-1 hover:bg-[#3d3224] rounded text-[#c5b191] hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-[#6e583c] pb-3 mb-4">
              <span className="text-xs uppercase tracking-widest text-[#b89562] font-sans block mb-1">
                {gameState.activeDiaryNote.date}
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-wider text-[#ffe8c6]" style={{ fontFamily: 'Cinzel, serif' }}>
                {gameState.activeDiaryNote.title}
              </h3>
            </div>

            <p className="text-sm md:text-base leading-relaxed tracking-wide italic whitespace-pre-line text-[#dfd0b5]">
              &quot;{gameState.activeDiaryNote.text}&quot;
            </p>

            <div className="mt-6 pt-4 border-t border-[#6e583c] flex justify-between items-center text-xs text-[#b89562] font-sans">
              <span>Kalapur Haveli Archives</span>
              <button
                onClick={closeDiary}
                className="px-4 py-2 bg-[#4a3a27] hover:bg-[#5f4b33] rounded text-white font-semibold cursor-pointer"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. DAY TRANSITION SCREEN (When caught & advancing day) */}
      {gameState.isDayTransitioning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none font-serif">
          <div className="space-y-4 max-w-lg animate-pulse">
            <span className="text-red-500 font-mono text-xs uppercase tracking-[0.4em] font-bold">
              KALAPUR NIGHTMARE
            </span>
            <h1
              className="text-5xl md:text-8xl font-black text-red-600 tracking-widest drop-shadow-[0_0_40px_#cc0000]"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {gameState.dayTransitionText}
            </h1>
            <p className="text-stone-400 text-xs md:text-sm italic font-sans tracking-wide">
              You awaken back in the Grand Foyer... The tantric chants grow louder.
            </p>
          </div>
        </div>
      )}

      {/* 12. GAME OVER SCREEN (When player fails 4 days) */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none font-serif pointer-events-auto">
          <div className="max-w-xl space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.8)]">
              <Skull className="w-10 h-10 text-red-500 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-red-500 font-mono text-xs uppercase tracking-[0.4em] font-bold">
                4 DAYS EXPIRED • THE CURSE CLAIMED YOU
              </span>
              <h1
                className="text-4xl md:text-7xl font-black text-stone-100 tracking-wider"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                GAME OVER
              </h1>
            </div>

            <p className="text-stone-300 text-sm md:text-base font-light italic leading-relaxed">
              You could not escape Kalapur House in 4 days. Tatya Vinchu and the ancient matriarch claimed your soul to wander the dark haveli for eternity.
            </p>

            <div className="py-4 border-y border-stone-800 space-y-1.5">
              <p className="text-red-400 font-semibold text-base md:text-lg tracking-wide font-sans">
                Thank you for being a part of STRANGE CREATION community
              </p>
              <p className="text-stone-400 text-xs tracking-widest uppercase font-mono">
                Created by Soham Dnyaneshwar Lokhande • YouTube: MR STRANGE 1229
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  gameState.resetGame();
                  if (onMainMenu) {
                    onMainMenu();
                  } else {
                    window.location.reload();
                  }
                }}
                className="px-8 py-3.5 bg-red-950 hover:bg-red-900 border-2 border-red-600 rounded text-white text-xs uppercase tracking-widest font-bold cursor-pointer transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)]"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
