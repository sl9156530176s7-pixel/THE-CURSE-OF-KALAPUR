import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface TrailerScene {
  src: string;
  title: string;
  subtitle: string;
  duration: number;
  zoomStart: number;
  zoomEnd: number;
  panX: number;
  flashAt?: number;
}

const TRAILER_SCENES: TrailerScene[] = [
  {
    src: './screenshots/poster-wide.jpg',
    title: 'STRANGE CREATION PRESENTS',
    subtitle: 'Four floors of ancestral dread behind locked teakwood doors.',
    duration: 7,
    zoomStart: 1.0,
    zoomEnd: 1.08,
    panX: 0,
  },
  {
    src: './screenshots/gameplay-haveli.jpg',
    title: 'EXPLORE THE KALAPUR HAVELI',
    subtitle: 'Search drawers, salvage keys, and keep your flashlight battery alive.',
    duration: 8,
    zoomStart: 1.02,
    zoomEnd: 1.12,
    panX: -18,
    flashAt: 3.4,
  },
  {
    src: './screenshots/character-tatya.jpg',
    title: 'OUTRUN TATYA VINCHU & THE GHOST',
    subtitle: 'Every creaking stair and whispered taunt reveals who hunts nearby.',
    duration: 8,
    zoomStart: 1.05,
    zoomEnd: 1.16,
    panX: 16,
    flashAt: 2.2,
  },
  {
    src: './screenshots/environment-sanctum.jpg',
    title: 'SANCTUARY IN THE PUJA SHRINE',
    subtitle: 'The sacred mantra ward holds the Kalapur Ghost at bay — rest before the final run.',
    duration: 7,
    zoomStart: 1.0,
    zoomEnd: 1.09,
    panX: -10,
  },
  {
    src: './screenshots/action-escape.jpg',
    title: 'THREE ROUTES OUT ALIVE',
    subtitle: 'Grand Door Frame • Basement Garage Car • Underground River Boat.',
    duration: 8,
    zoomStart: 1.03,
    zoomEnd: 1.13,
    panX: 14,
    flashAt: 4.5,
  },
];

const TOTAL_DURATION = TRAILER_SCENES.reduce((acc, s) => acc + s.duration, 0);

export const TrailerPlayer: React.FC<{ onPlayGame?: () => void }> = ({ onPlayGame }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);

  // Preload trailer scene bitmaps & audio track
  useEffect(() => {
    let cancelled = false;
    const loaded: HTMLImageElement[] = new Array(TRAILER_SCENES.length);
    let count = 0;

    TRAILER_SCENES.forEach((scene, idx) => {
      const img = new Image();
      img.src = scene.src;
      img.onload = () => {
        if (cancelled) return;
        loaded[idx] = img;
        count += 1;
        if (count === TRAILER_SCENES.length) {
          imagesRef.current = loaded;
          setImagesReady(true);
        }
      };
      img.onerror = () => {
        count += 1;
        if (count === TRAILER_SCENES.length && !cancelled) {
          imagesRef.current = loaded;
          setImagesReady(true);
        }
      };
    });

    const audio = new Audio('./assets/aistudio/Count_the_Doors_e8e142b1.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    return () => {
      cancelled = true;
      audio.pause();
      audio.src = '';
    };
  }, []);

  const drawFrame = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Resolve active scene + normalized progress
    let acc = 0;
    let sceneIdx = 0;
    let localT = 0;
    for (let i = 0; i < TRAILER_SCENES.length; i++) {
      const s = TRAILER_SCENES[i];
      if (t < acc + s.duration || i === TRAILER_SCENES.length - 1) {
        sceneIdx = i;
        localT = Math.max(0, Math.min(s.duration, t - acc));
        break;
      }
      acc += s.duration;
    }

    const scene = TRAILER_SCENES[sceneIdx];
    const progress = localT / scene.duration;
    const img = imagesRef.current[sceneIdx];

    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, w, h);

    if (img && img.complete && img.naturalWidth > 0) {
      const zoom = scene.zoomStart + (scene.zoomEnd - scene.zoomStart) * progress;
      const offsetX = scene.panX * progress;
      const drawW = w * zoom;
      const drawH = h * zoom;
      const dx = (w - drawW) / 2 + offsetX;
      const dy = (h - drawH) / 2;

      ctx.save();
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    }

    // Subtle lightning flash pulse on dramatic timestamps
    if (scene.flashAt !== undefined) {
      const dist = Math.abs(localT - scene.flashAt);
      if (dist < 0.16) {
        const alpha = (1 - dist / 0.16) * 0.45;
        ctx.fillStyle = `rgba(225, 235, 255, ${alpha})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Cinematic bottom & left vignette
    const grad = ctx.createLinearGradient(0, h * 0.35, 0, h);
    grad.addColorStop(0, 'rgba(6, 8, 16, 0.05)');
    grad.addColorStop(0.65, 'rgba(6, 8, 16, 0.68)');
    grad.addColorStop(1, 'rgba(6, 8, 16, 0.94)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fade-in/fade-out edge transitions
    const fadeEdge = Math.min(localT / 0.55, (scene.duration - localT) / 0.55, 1);
    const captionAlpha = Math.max(0, Math.min(1, fadeEdge));

    ctx.save();
    ctx.globalAlpha = captionAlpha;
    ctx.fillStyle = '#ef4444';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText(`0${sceneIdx + 1} / 0${TRAILER_SCENES.length}`, 56, h - 134);

    ctx.fillStyle = '#f5f5f4';
    ctx.font = '900 42px "Cinzel", Georgia, serif';
    ctx.fillText(scene.title, 56, h - 88);

    ctx.fillStyle = '#d6d3d1';
    ctx.font = '500 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(scene.subtitle, 56, h - 50);
    ctx.restore();

    // Crossfade black during cut boundary
    if (fadeEdge < 0.85) {
      ctx.fillStyle = `rgba(6, 8, 16, ${(1 - fadeEdge) * 0.7})`;
      ctx.fillRect(0, 0, w, h);
    }
  }, []);

  // Draw initial poster frame when ready
  useEffect(() => {
    if (imagesReady) {
      drawFrame(elapsedRef.current);
    }
  }, [imagesReady, drawFrame]);

  // Animation loop when playing
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      return;
    }

    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(() => {});
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      elapsedRef.current += dt;

      if (elapsedRef.current >= TOTAL_DURATION) {
        elapsedRef.current = 0;
        setCurrentTime(0);
        setIsPlaying(false);
        drawFrame(0);
        return;
      }

      setCurrentTime(elapsedRef.current);
      drawFrame(elapsedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, isMuted, drawFrame]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    elapsedRef.current = 0;
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    drawFrame(0);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    elapsedRef.current = val;
    setCurrentTime(val);
    drawFrame(val);
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatSec = (s: number) => {
    const secs = Math.floor(s);
    const m = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-800 bg-[#060810] shadow-[0_24px_80px_rgba(0,0,0,0.8)] group"
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer block"
      />

      {/* Big Center Play Button when Paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 cursor-pointer transition-opacity"
        >
          <button
            type="button"
            aria-label="Play official trailer"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-700/95 hover:bg-red-600 border-2 border-red-400/70 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.65)] transition-transform hover:scale-105 cursor-pointer"
          >
            <Play className="w-9 h-9 sm:w-10 sm:h-10 text-white fill-white ml-1" />
          </button>
          <span className="mt-4 text-xs sm:text-sm font-mono uppercase tracking-[0.22em] text-stone-200 bg-black/65 px-3.5 py-1.5 rounded">
            Watch Official Trailer ({formatSec(TOTAL_DURATION)})
          </span>
        </div>
      )}

      {/* Bottom Transport Controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-lg bg-stone-900/90 hover:bg-red-800 text-white border border-stone-700/80 cursor-pointer transition-colors"
          aria-label={isPlaying ? 'Pause trailer' : 'Play trailer'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
        </button>

        <button
          type="button"
          onClick={handleRestart}
          className="p-2 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700/80 cursor-pointer transition-colors"
          aria-label="Restart trailer"
          title="Restart trailer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={0}
          max={TOTAL_DURATION}
          step={0.1}
          value={currentTime}
          onChange={handleScrub}
          aria-label="Trailer timeline"
          className="flex-1 accent-red-600 h-1.5 bg-stone-800 rounded cursor-pointer"
        />

        <span className="text-[11px] font-mono text-stone-300 tabular-nums hidden sm:inline">
          {formatSec(currentTime)} / {formatSec(TOTAL_DURATION)}
        </span>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 cursor-pointer transition-colors"
          aria-label={isMuted ? 'Unmute trailer sound' : 'Mute trailer sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {onPlayGame && (
          <button
            type="button"
            onClick={onPlayGame}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800/90 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Play Now
          </button>
        )}

        <button
          type="button"
          onClick={handleFullscreen}
          className="p-2 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 cursor-pointer transition-colors"
          aria-label="Toggle fullscreen trailer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
