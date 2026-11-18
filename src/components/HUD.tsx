import React, { useState, useEffect, useRef } from 'react';
import { gameState, getZoneName } from '../game/gameState';
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
  Hand,
  ZapOff,
  Smartphone,
  ShieldAlert,
  Scissors,
  Calendar,
  Skull,
  Music,
  Bell,
  Wrench,
  Maximize2,
  RotateCw,
  Map as MapIcon,
  MapPin,
  Fuel,
  BatteryCharging,
  Car,
  Anchor,
  CircleDot,
  CheckCircle2,
  Circle,
  ArrowUp,
  Sparkles,
} from 'lucide-react';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface HUDProps {
  currentInteractive: InteractiveObject | null;
  onPause: () => void;
  onPlayAgain?: () => void;
  onMainMenu?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ currentInteractive, onPause, onPlayAgain, onMainMenu }) => {
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

  // Blueprint Map Floor Tab ('attic' | 'upper' | 'ground' | 'crypt')
  const [mapFloor, setMapFloor] = useState<'attic' | 'upper' | 'ground' | 'crypt'>('ground');

  const closeDiary = () => {
    gameState.activeDiaryNote = null;
    gameState.notify();
  };

  const toggleBlueprintMap = () => {
    const fy = gameState.checkpointPos[1] - 1.6;
    if (fy < -0.8) setMapFloor('crypt');
    else if (fy >= 6.8) setMapFloor('attic');
    else if (fy >= 2.25) setMapFloor('upper');
    else setMapFloor('ground');
    gameState.showBlueprintMap = !gameState.showBlueprintMap;
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
    e.preventDefault();
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

  const handleTouchBattery = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchUseBattery?.());
  };

  const handleTouchDecoy = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchThrowDecoy?.());
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

  const handleTouchJump = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchJump?.());
  };

  const handleTouchStun = (e: React.MouseEvent | React.TouchEvent) => {
    triggerTouchAction(e, () => gameState.onTouchStun?.());
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
      if (joystickTouchId.current !== null || lookTouchId.current !== null) {
        e.preventDefault();
      }

      // Joystick movement
      if (joystickTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joystickTouchId.current) {
            updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }

      // Look drag (preserve full continuous deltas without choppy clipping)
      if (lookTouchId.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchId.current) {
            const touch = e.changedTouches[i];
            const rawDx = touch.clientX - lastLookPos.current.x;
            const rawDy = touch.clientY - lastLookPos.current.y;
            lastLookPos.current = { x: touch.clientX, y: touch.clientY };
            const dx = Math.max(-160, Math.min(160, rawDx));
            const dy = Math.max(-160, Math.min(160, rawDy));
            gameState.touchLook.x += dx;
            gameState.touchLook.y += dy;
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
        const rawDx = e.clientX - lastLookPos.current.x;
        const rawDy = e.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: e.clientX, y: e.clientY };
        const dx = Math.max(-160, Math.min(160, rawDx));
        const dy = Math.max(-160, Math.min(160, rawDy));
        gameState.touchLook.x += dx;
        gameState.touchLook.y += dy;
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
      lookTouchId.current = null;
      isMouseDownOnLook.current = false;
      resetJoystick();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleOrientationCheck);
    window.addEventListener('orientationchange', handleOrientationCheck);
    window.addEventListener('blur', handleOrientationCheck);
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
      window.removeEventListener('blur', handleOrientationCheck);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  // Glitch intensity from ghost & live zone calculation
  const glitch = gameState.screenGlitchIntensity;
  const isChasing = gameState.ghostState === 'chase';
  const isHiding = gameState.isHiding !== null;
  const px = gameState.checkpointPos[0];
  const py = gameState.checkpointPos[1] - 1.6;
  const pz = gameState.checkpointPos[2];
  const currentZone = getZoneName(px, py, pz);
  const currentFloorLabel =
    py < -0.8 ? 'CRYPT -1' : py >= 6.8 ? 'ATTIC +2' : py >= 2.25 ? 'UPPER +1' : 'GROUND 0';

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
            <div className="text-center bg-black/85 px-6 py-4 rounded border border-red-900/60 text-stone-300 shadow-2xl">
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm bg-stone-950/95 border border-red-600/80 rounded-lg p-3 shadow-2xl pointer-events-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-left">
            <RotateCw className="w-5 h-5 text-red-400 shrink-0" />
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

      {/* 2. TOP BAR: DAY COUNTER, ZONE & OBJECTIVE, POWER CUT ALERT, MAP & CONTROLS */}
      <div className="absolute top-2.5 sm:top-4 left-3 sm:left-5 right-3 sm:right-5 flex justify-between items-start gap-2 z-20 pointer-events-none">
        <div className="flex flex-row items-start gap-2">
          {/* Day Indicator Badge (4 Days Escape System) */}
          <div
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded border shadow-lg flex items-center gap-1.5 shrink-0 ${
              gameState.currentDay === 4
                ? 'bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-stone-950/92 border-stone-800 text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-mono tracking-widest uppercase text-stone-400 font-bold hidden sm:inline">
                {gameState.currentDay === 4 ? 'FINAL DAY' : currentFloorLabel}
              </span>
              <span className="text-[11px] sm:text-xs font-serif font-black tracking-wider text-red-400 tabular-nums whitespace-nowrap">
                DAY {gameState.currentDay}/4
              </span>
            </div>
          </div>

          {/* Zone + Objective Box */}
          <div className="bg-stone-950/92 border border-stone-800/90 rounded px-2.5 py-1 sm:px-3.5 sm:py-1.5 max-w-[185px] sm:max-w-xs md:max-w-md shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[9px] sm:text-[10px] text-amber-300 font-mono tracking-wider uppercase font-bold truncate">
                  {currentZone}
                </span>
              </div>
              {!gameState.breakerPowerOn && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-900/90 border border-red-500 rounded text-[8px] font-mono font-bold text-red-100 uppercase shrink-0">
                  <ZapOff className="w-2.5 h-2.5" />
                  BLACKOUT
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-200 font-serif font-medium leading-tight line-clamp-2">
              {gameState.currentObjective}
            </p>
          </div>
        </div>

        {/* Ghost Warning or Stunned Indicator */}
        {gameState.villainStunTimer > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/95 border border-amber-400 rounded text-amber-100 text-[10px] sm:text-xs tracking-widest uppercase font-bold shadow-[0_0_20px_rgba(245,158,11,0.55)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="whitespace-nowrap">STUNNED {Math.ceil(gameState.villainStunTimer)}s</span>
          </div>
        ) : isChasing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/95 border border-red-500 rounded text-red-100 text-[10px] sm:text-xs tracking-widest uppercase font-bold shadow-[0_0_20px_rgba(220,38,38,0.65)]">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline whitespace-nowrap">VILLAIN PURSUING</span>
          </div>
        )}

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          {/* Blueprint Map & 3 Escapes Guide */}
          <button
            onClick={toggleBlueprintMap}
            title="Haveli Blueprint & 3 Escapes (Tab)"
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono tracking-wider flex items-center gap-1 border transition cursor-pointer shadow-md whitespace-nowrap ${
              gameState.showBlueprintMap
                ? 'bg-amber-950/95 border-amber-400 text-amber-200'
                : 'bg-stone-950/92 hover:bg-stone-800 border-amber-700/70 text-amber-300'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">MAP</span>
          </button>

          {/* Landscape Fullscreen Button (Android Horizontal) */}
          {touchEnabled && (
            <button
              onClick={enterHorizontalFullscreen}
              title="Fullscreen Horizontal Mode"
              className="px-2.5 py-1.5 rounded text-[10px] font-mono bg-stone-950/92 hover:bg-stone-800 border border-stone-700/80 text-stone-200 flex items-center gap-1 cursor-pointer shadow-md whitespace-nowrap"
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
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono tracking-wider flex items-center gap-1 border transition cursor-pointer shadow-md whitespace-nowrap ${
              gameState.settings.songEnabled
                ? 'bg-amber-950/92 border-amber-500/80 text-amber-200'
                : 'bg-stone-950/92 border-stone-700/70 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${gameState.settings.songEnabled ? 'text-amber-400' : 'text-stone-500'}`} />
            <span className="hidden md:inline">Song:</span>
            <span>{gameState.settings.songEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Touch Controls Button */}
          <button
            onClick={() => setTouchEnabled((v) => !v)}
            title="Toggle Android On-Screen Joystick & Controls"
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono tracking-wider flex items-center gap-1 border transition cursor-pointer shadow-md whitespace-nowrap ${
              touchEnabled
                ? 'bg-red-950/92 border-red-500 text-red-200'
                : 'bg-stone-950/92 border-stone-700/70 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span className="font-bold">{touchEnabled ? 'PAD ON' : 'PAD OFF'}</span>
          </button>

          {/* Strange Creation Studio Badge */}
          <div
            title="STRANGE CREATION - Dir. Soham Lokhande"
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-stone-950/92 border border-amber-900/50 rounded shadow-md"
          >
            <img
              src={officialLogoImg}
              alt="Strange Creation"
              className="w-4 h-4 rounded-full object-cover border border-amber-500/50"
            />
            <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase whitespace-nowrap">
              Strange Creation
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="px-2.5 py-1.5 bg-stone-950/92 hover:bg-stone-800 border border-stone-700/80 rounded text-stone-200 text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer shadow-md font-semibold whitespace-nowrap"
          >
            Pause
          </button>
        </div>
      </div>

      {/* 3. CENTER CROSSHAIR & TAPPABLE INTERACTION PROMPT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        {/* Granny Ch 3 style Crisp Pinpoint Reticle */}
        <div className="relative flex items-center justify-center">
          {currentInteractive && (
            <div className="absolute w-6 h-6 rounded-full border border-red-400/90 shadow-[0_0_10px_rgba(239,68,68,0.65)]" />
          )}
          <div
            className={`rounded-full transition-colors duration-100 ${
              currentInteractive
                ? 'w-2.5 h-2.5 bg-red-500 shadow-[0_0_8px_#ff0000]'
                : 'w-1.5 h-1.5 bg-white/80 shadow-[0_0_3px_rgba(0,0,0,0.9)]'
            }`}
          />
        </div>

        {/* Interaction Prompt Tooltip (Directly Tappable on Android!) */}
        {currentInteractive && (
          <button
            type="button"
            onTouchStart={handleTouchInteract}
            onClick={handleTouchInteract}
            className="mt-4 px-3.5 py-2 bg-stone-950/95 border border-red-600/85 hover:border-red-400 rounded text-stone-100 text-[11px] sm:text-xs tracking-wide font-sans shadow-2xl flex items-center gap-2 pointer-events-auto cursor-pointer active:scale-95 transition-transform"
          >
            <span className="px-1.5 py-0.5 bg-red-700 text-white font-mono text-[10px] font-bold rounded">
              {touchEnabled ? 'TAP' : 'E'}
            </span>
            <span className="font-medium">{currentInteractive.prompt}</span>
          </button>
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
          {/* Mobile Battery, Stamina & Stealth Mini HUD above Joystick */}
          <div className="mb-2 flex flex-col gap-1.5 w-36 sm:w-44 pointer-events-none">
            {/* Flashlight Battery Bar + Quick Reload Button */}
            <div className="flex items-center gap-1.5 bg-stone-950/90 border border-stone-800 px-2.5 py-1 rounded shadow-md">
              <Flashlight
                className={`w-3.5 h-3.5 ${
                  gameState.flashlightOn && gameState.flashlightBattery > 0 ? 'text-yellow-400' : 'text-stone-500'
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
              <span className="text-[9px] sm:text-[10px] font-mono tabular-nums text-stone-200 font-bold">
                {Math.round(gameState.flashlightBattery)}%
              </span>
              {gameState.batteries > 0 && gameState.flashlightBattery < 75 && (
                <button
                  type="button"
                  onTouchStart={handleTouchBattery}
                  onClick={handleTouchBattery}
                  className="pointer-events-auto ml-1 px-1.5 py-0.5 bg-yellow-700 hover:bg-yellow-600 text-black text-[8px] font-mono font-black rounded cursor-pointer"
                  title="Use Spare Battery (R)"
                >
                  +BAT
                </button>
              )}
            </div>

            {/* Stamina & Noise Status Bar */}
            <div className="flex items-center gap-1.5 bg-stone-950/90 border border-stone-800 px-2.5 py-1 rounded shadow-md">
              <Footprints
                className={`w-3.5 h-3.5 ${
                  gameState.isCrouching
                    ? 'text-emerald-400'
                    : gameState.isSprinting
                    ? 'text-red-400'
                    : 'text-stone-400'
                }`}
              />
              <div className="flex-1 bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    gameState.isCrouching ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${gameState.stamina}%` }}
                />
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-mono font-bold uppercase ${
                  gameState.isCrouching
                    ? 'text-emerald-400'
                    : gameState.isSprinting
                    ? 'text-red-400'
                    : 'text-stone-300'
                }`}
              >
                {gameState.isCrouching ? 'SILENT' : gameState.isSprinting ? 'LOUD' : 'WALK'}
              </span>
            </div>
          </div>

          {/* Enlarged Joystick Base */}
          <div
            ref={joystickRef}
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 bg-stone-950/80 relative flex items-center justify-center touch-none shadow-2xl cursor-pointer ${
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

      {/* 6. BOTTOM DESKTOP STATUS BARS (BATTERY & STAMINA - ZERO BACKDROP BLUR FOR FAST WEBGL) */}
      {!touchEnabled && (
        <div className="absolute bottom-6 left-6 space-y-2 pointer-events-auto z-20">
          {/* Flashlight Battery */}
          <div className="bg-stone-950/92 border border-stone-800/90 rounded px-3 py-2 flex items-center gap-3 w-48 shadow-lg">
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
          <div className="bg-stone-950/92 border border-stone-800/90 rounded px-3 py-2 flex items-center gap-3 w-48 shadow-lg">
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
          {/* Secondary 2x2 Action Grid (Flashlight, Sprint, Crouch, Lure Decoy) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-center">
            {/* Flashlight Toggle Button */}
            <button
              onTouchStart={handleTouchFlashlight}
              onClick={handleTouchFlashlight}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none ${
                gameState.flashlightOn && gameState.flashlightBattery > 0
                  ? 'bg-yellow-950/90 border-yellow-400 text-yellow-300 shadow-[0_0_16px_rgba(234,179,8,0.55)]'
                  : 'bg-stone-950/90 border-stone-600 text-stone-400'
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
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none ${
                gameState.isSprinting
                  ? 'bg-red-950/95 border-red-400 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.6)]'
                  : 'bg-stone-950/90 border-stone-600 text-stone-300'
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
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none ${
                gameState.isCrouching
                  ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-stone-950/90 border-stone-600 text-stone-300'
              }`}
              title="Toggle Stealth Crouch (Zero Noise)"
            >
              <ShieldAlert className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase">
                {gameState.isCrouching ? 'SILENT' : 'CROUCH'}
              </span>
            </button>

            {/* Throw Brass Decoy Lota Button */}
            <button
              onTouchStart={handleTouchDecoy}
              onClick={handleTouchDecoy}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none ${
                gameState.decoys > 0
                  ? 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                  : 'bg-stone-950/90 border-stone-700 text-stone-600'
              }`}
              title="Throw Brass Decoy Lota (Q)"
            >
              <CircleDot className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase">
                LURE x{gameState.decoys}
              </span>
            </button>
          </div>

          {/* Right Thumb Column: STUN + JUMP Side-by-Side above Primary ACTION Button */}
          <div className="flex flex-col items-end gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <button
                onTouchStart={handleTouchStun}
                onClick={handleTouchStun}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none ${
                  gameState.stunCharges > 0
                    ? 'bg-amber-950/95 border-yellow-400 text-yellow-200 shadow-[0_0_16px_rgba(250,204,21,0.5)]'
                    : 'bg-stone-950/90 border-stone-700 text-stone-600'
                }`}
                title="Scatter Sacred Vibhuti Stun Flash (G)"
              >
                <Sparkles className="w-5 h-5 mb-0.5 text-yellow-300" />
                <span className="text-[8px] font-mono font-bold uppercase">
                  STUN x{gameState.stunCharges}
                </span>
              </button>

              <button
                onTouchStart={handleTouchJump}
                onClick={handleTouchJump}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 bg-stone-950/90 hover:bg-stone-800 border-amber-500/80 text-amber-200 flex flex-col items-center justify-center shadow-xl transition active:scale-90 cursor-pointer touch-none"
                title="Jump (Space)"
              >
                <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 text-amber-400" />
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase">
                  JUMP
                </span>
              </button>
            </div>

            {/* Primary Action Button [E / INTERACT] */}
            <button
              onTouchStart={handleTouchInteract}
              onClick={handleTouchInteract}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl transition-all duration-150 active:scale-90 cursor-pointer touch-none ${
                currentInteractive || isHiding
                  ? 'bg-linear-to-b from-red-600 to-red-900 border-red-300 text-white shadow-[0_0_28px_rgba(220,38,38,0.85)]'
                  : 'bg-stone-950/90 border-stone-600 text-stone-300'
              }`}
              title="Interact (E)"
            >
              <Hand className="w-8 h-8 sm:w-9 sm:h-9 mb-1" />
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase">
                {isHiding ? 'EXIT' : currentInteractive ? 'ACTION' : 'USE'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* DESKTOP INVENTORY TRAY (Gate, Car, Boat + Decoys & Batteries) */
        <div className="absolute bottom-6 right-6 flex flex-wrap justify-end items-center gap-1.5 max-w-2xl pointer-events-auto">
          {/* Gate Escape */}
          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasPhotoFrame
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : gameState.framePlacedOnDoor
                ? 'bg-emerald-950/85 border-emerald-600 text-emerald-400'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Ancestor Photo Frame (Front Exit)"
          >
            <ImageIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">{gameState.framePlacedOnDoor ? 'MOUNT' : 'FRAME'}</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasBrassKey
                ? 'bg-yellow-950/85 border-yellow-600 text-yellow-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Brass Key (Master Bedroom)"
          >
            <Key className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">BRASS</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasAtticKey
                ? 'bg-red-950/85 border-red-600 text-red-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Sanctum Key"
          >
            <Key className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">SANCT</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasBoltCutters
                ? 'bg-rose-950/85 border-rose-500 text-rose-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Bolt Cutters (Gate Chains)"
          >
            <Scissors className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">CUTTR</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasGateKey
                ? 'bg-amber-950/85 border-amber-500 text-amber-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Gate Key (Front Gate)"
          >
            <Key className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">GATE</span>
          </div>

          {/* 1954 Garage Car Escape */}
          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.carFueled
                ? 'bg-emerald-950/85 border-emerald-500 text-emerald-300'
                : gameState.hasFuelCan
                ? 'bg-orange-950/85 border-orange-500 text-orange-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Fuel Jerrycan (Garage Car)"
          >
            <Fuel className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">FUEL</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.carBatteryInstalled
                ? 'bg-emerald-950/85 border-emerald-500 text-emerald-300'
                : gameState.hasCarBattery
                ? 'bg-lime-950/85 border-lime-500 text-lime-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="12V Car Battery (Garage Car)"
          >
            <BatteryCharging className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">12V</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasCarKey
                ? 'bg-teal-950/85 border-teal-400 text-teal-200'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Car Ignition Key (Garage Car)"
          >
            <Car className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">CARKEY</span>
          </div>

          {/* Underground River Boat Escape */}
          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasCrowbar
                ? 'bg-cyan-950/85 border-cyan-500 text-cyan-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Heavy Steel Crowbar (Crypt Bars)"
          >
            <Wrench className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">CROW</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasTantricBell
                ? 'bg-purple-950/85 border-purple-500 text-purple-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Sacred Tantric Bell (Crypt Ward)"
          >
            <Bell className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">BELL</span>
          </div>

          <div
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg ${
              gameState.hasBoatOars
                ? 'bg-sky-950/85 border-sky-400 text-sky-200'
                : 'bg-stone-950/75 border-stone-800 text-stone-600'
            }`}
            title="Wooden Boat Oars (Secret Archive -> Crypt Boat)"
          >
            <Anchor className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] font-mono font-bold">OARS</span>
          </div>

          {/* Stun Vibhuti Flash (Press G or Click) */}
          <button
            type="button"
            onClick={handleTouchStun}
            title="Sacred Vibhuti Stun Flash [G]"
            className={`flex flex-col items-center justify-center w-12 h-14 rounded border shadow-lg cursor-pointer ${
              gameState.stunCharges > 0
                ? 'bg-yellow-950/90 hover:bg-yellow-900 border-yellow-500 text-yellow-200'
                : 'bg-stone-950/80 border-stone-800 text-stone-500'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400 mb-0.5" />
            <span className="text-[8px] font-mono font-bold tabular-nums">G x{gameState.stunCharges}</span>
          </button>

          {/* Decoy Lotas (Press Q or Click) */}
          <button
            type="button"
            onClick={handleTouchDecoy}
            title="Throw Brass Decoy Lota [Q]"
            className="flex flex-col items-center justify-center w-12 h-14 rounded border bg-amber-950/85 hover:bg-amber-900 border-amber-700 text-amber-200 shadow-lg cursor-pointer"
          >
            <CircleDot className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="text-[8px] font-mono font-bold tabular-nums">Q x{gameState.decoys}</span>
          </button>

          {/* Spare Batteries (Press R or Click) */}
          <button
            type="button"
            onClick={handleTouchBattery}
            title="Use Spare Battery [R]"
            className="flex flex-col items-center justify-center w-12 h-14 rounded border bg-stone-950/92 hover:bg-stone-900 border-stone-700 text-stone-200 shadow-lg cursor-pointer"
          >
            <Battery className="w-4 h-4 text-yellow-500 mb-0.5" />
            <span className="text-[8px] font-mono font-bold tabular-nums">R x{gameState.batteries}</span>
          </button>
        </div>
      )}

      {/* 8. MINI INVENTORY ROW ON TOP WHEN TOUCH IS ACTIVE */}
      {touchEnabled && (
        <div className="absolute top-14 sm:top-16 left-3 sm:left-5 flex flex-wrap items-center gap-1 pointer-events-none max-w-xl z-20">
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono ${
              gameState.hasPhotoFrame
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : gameState.framePlacedOnDoor
                ? 'bg-emerald-950/85 border-emerald-500 text-emerald-300'
                : 'bg-stone-950/75 border-stone-800 text-stone-500'
            }`}
          >
            <ImageIcon className="w-2.5 h-2.5" />
            {gameState.framePlacedOnDoor ? 'MOUNT' : gameState.hasPhotoFrame ? 'FRAME' : 'FRAME'}
          </span>

          {gameState.hasBrassKey && (
            <span className="px-1.5 py-0.5 rounded border bg-yellow-950/90 border-yellow-500 text-yellow-200 text-[8px] font-mono">
              BRASS KEY
            </span>
          )}
          {gameState.hasAtticKey && (
            <span className="px-1.5 py-0.5 rounded border bg-red-950/90 border-red-500 text-red-200 text-[8px] font-mono">
              SANCTUM
            </span>
          )}
          {gameState.hasBoltCutters && (
            <span className="px-1.5 py-0.5 rounded border bg-rose-950/90 border-rose-500 text-rose-200 text-[8px] font-mono">
              CUTTERS
            </span>
          )}
          {gameState.hasGateKey && (
            <span className="px-1.5 py-0.5 rounded border bg-amber-950/90 border-amber-500 text-amber-200 text-[8px] font-mono">
              GATE KEY
            </span>
          )}
          {gameState.hasFuelCan && (
            <span className="px-1.5 py-0.5 rounded border bg-orange-950/90 border-orange-500 text-orange-200 text-[8px] font-mono">
              FUEL
            </span>
          )}
          {gameState.hasCarBattery && (
            <span className="px-1.5 py-0.5 rounded border bg-lime-950/90 border-lime-500 text-lime-200 text-[8px] font-mono">
              12V BAT
            </span>
          )}
          {gameState.hasCarKey && (
            <span className="px-1.5 py-0.5 rounded border bg-teal-950/90 border-teal-400 text-teal-200 text-[8px] font-mono">
              CAR KEY
            </span>
          )}
          {gameState.hasCrowbar && (
            <span className="px-1.5 py-0.5 rounded border bg-cyan-950/90 border-cyan-500 text-cyan-200 text-[8px] font-mono">
              CROWBAR
            </span>
          )}
          {gameState.hasTantricBell && (
            <span className="px-1.5 py-0.5 rounded border bg-purple-950/90 border-purple-500 text-purple-200 text-[8px] font-mono">
              BELL
            </span>
          )}
          {gameState.hasBoatOars && (
            <span className="px-1.5 py-0.5 rounded border bg-sky-950/90 border-sky-400 text-sky-200 text-[8px] font-mono">
              OARS
            </span>
          )}

          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-stone-950/90 border-stone-800 text-stone-300 text-[8px] font-mono tabular-nums">
            <Battery className="w-2.5 h-2.5 text-yellow-500" />
            x{gameState.batteries}
          </span>
        </div>
      )}

      {/* 9. BOTTOM CENTER: SUBTITLES */}
      {gameState.subtitleText && (
        <div
          className={`absolute ${
            touchEnabled ? 'bottom-4 sm:bottom-6 max-w-[260px] sm:max-w-md px-4 py-2' : 'bottom-24 md:bottom-20 max-w-2xl px-6 py-3'
          } left-1/2 -translate-x-1/2 text-center rounded text-xs md:text-sm tracking-wide font-sans shadow-2xl transition-all ${
            gameState.subtitleText.includes('TATYA')
              ? 'bg-red-950/95 border-2 border-red-600 text-red-100 font-bold shadow-[0_0_30px_rgba(220,38,38,0.7)]'
              : 'bg-black/90 border border-stone-800/90 text-stone-200'
          }`}
        >
          {gameState.subtitleText}
        </div>
      )}

      {/* 9B. ARCHITECTURAL HAVELI BLUEPRINT MAP & 3 ESCAPE ROUTES MODAL */}
      {gameState.showBlueprintMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 pointer-events-auto">
          <div className="w-full max-w-3xl bg-stone-950 border-2 border-amber-800/80 rounded-lg p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-400 block">
                  KALAPUR HAVELI ARCHITECTURAL SURVEY • [TAB]
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-wider text-stone-100" style={{ fontFamily: 'Cinzel, serif' }}>
                  FLOOR BLUEPRINT &amp; 3 ESCAPE ROUTES
                </h3>
              </div>
              <button
                onClick={() => {
                  gameState.showBlueprintMap = false;
                  gameState.notify();
                }}
                className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Left: Interactive 4-Tier SVG Blueprint (Attic +2, Upper +1, Ground 0, Crypt -1) */}
              <div className="bg-[#09131d] border border-cyan-900/60 rounded p-3">
                <div className="flex gap-1 mb-3">
                  {(['attic', 'upper', 'ground', 'crypt'] as const).map((fl) => (
                    <button
                      key={fl}
                      onClick={() => setMapFloor(fl)}
                      className={`flex-1 py-1.5 rounded text-[9px] sm:text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                        mapFloor === fl
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {fl === 'attic' ? 'Attic (+2)' : fl === 'upper' ? 'Upper (+1)' : fl === 'ground' ? 'Ground (0)' : 'Crypt (-1)'}
                    </button>
                  ))}
                </div>

                {/* SVG Blueprint Grid (World X: -22..25, Z: -22..34 mapped cleanly) */}
                <svg viewBox="-23 -23 50 58" className="w-full h-60 bg-[#060e16] rounded border border-cyan-950">
                  {mapFloor === 'ground' && (
                    <g stroke="#38bdf8" strokeWidth="0.3" fill="rgba(14,116,144,0.12)" fontSize="1.8" fontFamily="monospace">
                      <rect x="-20" y="-20" width="14" height="12" stroke="#f59e0b" fill="rgba(245,158,11,0.12)" />
                      <text x="-13" y="-13.5" fill="#fde68a" textAnchor="middle" stroke="none">Armoury</text>
                      <rect x="-6" y="-20" width="12" height="12" stroke="#f59e0b" fill="rgba(245,158,11,0.14)" />
                      <text x="0" y="-13.5" fill="#fde68a" textAnchor="middle" stroke="none">Trophy Hall</text>
                      <rect x="6" y="-20" width="14" height="12" stroke="#f59e0b" fill="rgba(245,158,11,0.12)" />
                      <text x="13" y="-13.5" fill="#fde68a" textAnchor="middle" stroke="none">Servants</text>
                      <rect x="-20" y="-8" width="14" height="10" />
                      <text x="-13" y="-3" fill="#bae6fd" textAnchor="middle" stroke="none">Storage/Crypt</text>
                      <rect x="-20" y="1.8" width="6.2" height="3.2" stroke="#38bdf8" fill="rgba(56,189,248,0.18)" />
                      <text x="-16.9" y="3.9" fill="#e0f2fe" fontSize="1.35" textAnchor="middle" stroke="none">Bath</text>
                      <rect x="-20" y="5" width="14" height="12" />
                      <text x="-13" y="11.5" fill="#bae6fd" textAnchor="middle" stroke="none">Kitchen</text>
                      <rect x="-6" y="-8" width="12" height="25" />
                      <text x="0" y="9.5" fill="#fde68a" textAnchor="middle" stroke="none">Marble Foyer</text>
                      <rect x="6" y="-8" width="14" height="9.5" />
                      <text x="13" y="-3" fill="#bae6fd" textAnchor="middle" stroke="none">Dining Hall</text>
                      <rect x="6" y="1.5" width="14" height="9" />
                      <text x="13" y="6.5" fill="#bae6fd" textAnchor="middle" stroke="none">Living Room</text>
                      <rect x="6" y="10.5" width="14" height="6.5" />
                      <text x="13" y="14" fill="#bae6fd" textAnchor="middle" stroke="none">Puja Shrine</text>
                      <line x1="-1.8" y1="-8" x2="1.8" y2="-8" stroke="#34d399" strokeWidth="0.9" />
                      <line x1="6.4" y1="-8" x2="9.2" y2="-8" stroke="#34d399" strokeWidth="0.9" />
                      <line x1="-1" y1="17" x2="1" y2="17" stroke="#f87171" strokeWidth="0.9" />
                      <line x1="14" y1="17" x2="16" y2="17" stroke="#fb923c" strokeWidth="0.9" />
                      <rect x="-12" y="17" width="24" height="14" stroke="#64748b" fill="rgba(15,23,42,0.25)" />
                      <text x="0" y="25" fill="#cbd5e1" textAnchor="middle" stroke="none">Courtyard + Well</text>
                      <rect x="12" y="17" width="12" height="14" stroke="#fb923c" fill="rgba(234,88,12,0.18)" />
                      <text x="18" y="24.5" fill="#fed7aa" textAnchor="middle" stroke="none">Garage (Car)</text>
                      <circle cx="5.5" cy="14.5" r="0.9" fill={gameState.breakerPowerOn ? '#22c55e' : '#ef4444'} stroke="none" />
                      <text x="5.5" y="13" fill="#fca5a5" fontSize="1.6" textAnchor="middle" stroke="none">Breaker</text>
                      <line x1="-2.2" y1="31" x2="2.2" y2="31" stroke="#f87171" strokeWidth="0.8" />
                      <text x="0" y="33.5" fill="#f87171" fontSize="1.8" textAnchor="middle" stroke="none">IRON GATE EXIT</text>
                    </g>
                  )}

                  {mapFloor === 'upper' && (
                    <g stroke="#38bdf8" strokeWidth="0.3" fill="rgba(14,116,144,0.14)" fontSize="1.85" fontFamily="monospace">
                      <rect x="-20" y="0" width="16" height="8" />
                      <text x="-13.5" y="4.5" fill="#bae6fd" textAnchor="middle" stroke="none">Guest Room</text>
                      <rect x="-7.4" y="0.4" width="2.8" height="6.8" stroke="#f87171" fill="rgba(239,68,68,0.2)" />
                      <text x="-6" y="6" fill="#fecaca" fontSize="1.3" textAnchor="middle" stroke="none">3F↑</text>
                      <rect x="-20" y="-8" width="16" height="8" />
                      <text x="-12" y="-3.5" fill="#bae6fd" textAnchor="middle" stroke="none">Library</text>
                      <rect x="-16" y="-16" width="8" height="8" stroke="#f59e0b" strokeDasharray="1,0.6" fill="rgba(245,158,11,0.18)" />
                      <text x="-12" y="-11.5" fill="#fde68a" textAnchor="middle" stroke="none">Secret Oars</text>
                      <rect x="-4" y="-8" width="8" height="16" />
                      <text x="0" y="1" fill="#cbd5e1" textAnchor="middle" stroke="none">Gallery</text>
                      <rect x="4" y="0" width="16" height="8" />
                      <text x="12" y="4.5" fill="#bae6fd" textAnchor="middle" stroke="none">Master Bed</text>
                      <rect x="4" y="-8" width="16" height="8" />
                      <text x="9.8" y="-3.5" fill="#bae6fd" textAnchor="middle" stroke="none">Nursery</text>
                      <rect x="15.6" y="-8" width="4.4" height="4.4" stroke="#38bdf8" fill="rgba(56,189,248,0.2)" />
                      <text x="17.8" y="-5.3" fill="#e0f2fe" fontSize="1.35" textAnchor="middle" stroke="none">Bath</text>
                      <rect x="-8" y="-20" width="16" height="12" stroke="#f87171" fill="rgba(185,28,28,0.2)" />
                      <text x="0" y="-13.5" fill="#fecaca" textAnchor="middle" stroke="none">Mystic Sanctum</text>
                      <rect x="8" y="-20" width="12" height="12" stroke="#f59e0b" fill="rgba(245,158,11,0.16)" />
                      <text x="14" y="-13.5" fill="#fde68a" textAnchor="middle" stroke="none">Astrology Study</text>
                    </g>
                  )}

                  {mapFloor === 'attic' && (
                    <g stroke="#f59e0b" strokeWidth="0.35" fill="rgba(180,83,9,0.16)" fontSize="1.9" fontFamily="monospace">
                      <rect x="-12" y="-12" width="11" height="12.4" />
                      <text x="-6.5" y="-5.5" fill="#fde68a" textAnchor="middle" stroke="none">Doll Workshop</text>
                      <rect x="-1" y="-12" width="13" height="10.5" stroke="#f87171" fill="rgba(185,28,28,0.18)" />
                      <text x="5.5" y="-6.2" fill="#fecaca" textAnchor="middle" stroke="none">Seance Parlor</text>
                      <rect x="-12" y="-1.5" width="24" height="9.5" />
                      <text x="4.5" y="4.0" fill="#bae6fd" textAnchor="middle" stroke="none">Observatory Loft</text>
                      <rect x="-7.4" y="0.4" width="2.8" height="6.8" stroke="#fb7185" fill="rgba(225,29,72,0.22)" />
                      <text x="-6" y="4.2" fill="#fecaca" fontSize="1.5" textAnchor="middle" stroke="none">2F↓</text>
                    </g>
                  )}

                  {mapFloor === 'crypt' && (
                    <g stroke="#2dd4bf" strokeWidth="0.35" fill="rgba(13,148,136,0.16)" fontSize="1.9" fontFamily="monospace">
                      <rect x="-19" y="-7" width="3.6" height="6.8" stroke="#fbbf24" />
                      <text x="-17.2" y="-3" fill="#fde68a" fontSize="1.6" textAnchor="middle" stroke="none">Stairs</text>
                      <rect x="-21" y="-14.6" width="16" height="7.6" />
                      <text x="-13" y="-10" fill="#99f6e4" textAnchor="middle" stroke="none">Crypt Stone Dock</text>
                      <rect x="-5" y="-16" width="10" height="9" stroke="#f87171" fill="rgba(185,28,28,0.18)" />
                      <text x="0" y="-11" fill="#fecaca" textAnchor="middle" stroke="none">Bone Vault</text>
                      <rect x="-21" y="-21" width="16" height="6.4" fill="rgba(6,78,59,0.45)" />
                      <text x="-13" y="-17.2" fill="#5eead4" textAnchor="middle" stroke="none">River Escape Boat</text>
                    </g>
                  )}

                  {/* Live Player Position Marker if viewing active floor */}
                  {((mapFloor === 'ground' && py >= -0.8 && py < 2.25) ||
                    (mapFloor === 'upper' && py >= 2.25 && py < 6.8) ||
                    (mapFloor === 'attic' && py >= 6.8) ||
                    (mapFloor === 'crypt' && py < -0.8)) && (
                    <g>
                      <circle cx={px} cy={pz} r="1.4" fill="#ef4444" opacity="0.35" />
                      <circle cx={px} cy={pz} r="0.7" fill="#fef08a" stroke="#ef4444" strokeWidth="0.3" />
                    </g>
                  )}
                </svg>
                <p className="text-[10px] text-cyan-300/80 font-mono mt-2">
                  Current Location: <strong className="text-white">{currentZone}</strong> ({currentFloorLabel})
                </p>
              </div>

              {/* Right: 3 Escape Routes Progress Checklist */}
              <div className="space-y-2.5 text-xs font-sans">
                {/* Route 1 */}
                <div className="p-2.5 rounded border border-red-900/60 bg-red-950/20">
                  <div className="font-bold text-red-300 uppercase tracking-wider mb-1 text-[11px]">
                    1. Front Courtyard Iron Gate
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                    <span className="flex items-center gap-1">
                      {gameState.framePlacedOnDoor ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Frame on Exit Door
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.hasBoltCutters ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Bolt Cutters
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.hasGateKey ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Gate Key
                    </span>
                  </div>
                </div>

                {/* Route 2 */}
                <div className="p-2.5 rounded border border-orange-900/60 bg-orange-950/20">
                  <div className="font-bold text-orange-300 uppercase tracking-wider mb-1 text-[11px]">
                    2. East Garage 1954 Escape Car
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                    <span className="flex items-center gap-1">
                      {gameState.carFueled || gameState.hasFuelCan ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Fuel Jerrycan
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.carBatteryInstalled || gameState.hasCarBattery ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      12V Car Battery
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.hasCarKey ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Car Ignition Key
                    </span>
                  </div>
                </div>

                {/* Route 3 */}
                <div className="p-2.5 rounded border border-teal-900/60 bg-teal-950/20">
                  <div className="font-bold text-teal-300 uppercase tracking-wider mb-1 text-[11px]">
                    3. Underground River Crypt Boat
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                    <span className="flex items-center gap-1">
                      {gameState.cellarBarsPried || gameState.hasCrowbar ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Heavy Crowbar
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.cellarSealBroken || gameState.hasTantricBell ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Sacred Bell
                    </span>
                    <span className="flex items-center gap-1">
                      {gameState.hasBoatOars ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-stone-500" />}
                      Boat Oars (Secret Archive)
                    </span>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-2 rounded bg-stone-900/90 border border-stone-800 text-[10px] text-stone-400 leading-snug">
                  <strong className="text-amber-300">Tips:</strong> Pull the Library Bookshelf to reach the Secret Archive &amp; Mystic Sanctum directly. Throw Brass Lotas (<strong className="text-white">Q / LURE</strong>) to distract Tatya. Restore the Grand Foyer Breaker during Blackouts!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. DIARY READER MODAL */}
      {gameState.activeDiaryNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88 pointer-events-auto">
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
        <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto flex flex-col items-center justify-center p-6 text-center select-none font-serif pointer-events-auto">
          <div className="max-w-xl space-y-5 my-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.8)]">
              <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
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

            <div className="py-3 sm:py-4 border-y border-stone-800 space-y-1.5">
              <p className="text-red-400 font-semibold text-base md:text-lg tracking-wide font-sans">
                Thank you for being a part of STRANGE CREATION community
              </p>
              <p className="text-stone-400 text-xs tracking-widest uppercase font-mono">
                Created by Soham Dnyaneshwar Lokhande • YouTube: MR STRANGE 1229
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className="px-8 py-3.5 bg-red-800 hover:bg-red-700 border-2 border-red-500 rounded text-white text-xs uppercase tracking-widest font-bold cursor-pointer transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  Play Again
                </button>
              )}
              <button
                onClick={() => {
                  gameState.resetGame();
                  if (onMainMenu) {
                    onMainMenu();
                  } else {
                    window.location.reload();
                  }
                }}
                className="px-7 py-3.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-stone-200 text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
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
