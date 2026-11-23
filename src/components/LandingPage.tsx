import React, { useState, useEffect } from 'react';
import {
  Play,
  Download,
  RefreshCw,
  ShieldCheck,
  Lock,
  Sparkles,
  Wifi,
  WifiOff,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Youtube,
  ExternalLink,
  Smartphone,
  Info,
  Gamepad2,
  Star,
} from 'lucide-react';
import { TrailerPlayer } from './TrailerPlayer';
import { SavedPlayerRating } from './RateUsModal';
import { GAME_VERSION, GAME_RELEASE_DATE, RELEASE_CHANGELOG } from '../game/version';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface ScreenshotItem {
  id: string;
  category: string;
  title: string;
  caption: string;
  src: string;
}

const GALLERY_ITEMS: ScreenshotItem[] = [
  {
    id: 'poster',
    category: 'Official Game Poster',
    title: 'The Curse of Kalapur — Official Key Art',
    caption: 'Enter the four-floor ancestral Kalapur Haveli and survive until dawn.',
    src: './screenshots/poster-wide.jpg',
  },
  {
    id: 'gameplay',
    category: 'Gameplay',
    title: 'Flashlight Exploration & Locked Drawers',
    caption: 'Search darkened corridors, unlock teakwood doors, and recover brass keys inside desk drawers.',
    src: './screenshots/gameplay-haveli.jpg',
  },
  {
    id: 'character',
    category: 'Characters & Villains',
    title: 'Tatya Vinchu & The Kalapur Ghost',
    caption: 'Choose your antagonist before starting and listen carefully for footsteps echoing on the staircase.',
    src: './screenshots/character-tatya.jpg',
  },
  {
    id: 'environment',
    category: 'Environment & Safe Zone',
    title: 'Sacred Puja Mantra Sanctuary',
    caption: 'The golden Puja Shrine wards off the roaming ghost on the ground floor.',
    src: './screenshots/environment-sanctum.jpg',
  },
  {
    id: 'action',
    category: 'Escape Action',
    title: 'Subterranean River Crypt',
    caption: 'Unlock one of three escape routes: Grand Door Frame, Garage Escape Car, or Underground River Boat.',
    src: './screenshots/action-escape.jpg',
  },
];

interface LandingPageProps {
  onPlayGame: () => void;
  onContinueGame: () => void;
  hasSave: boolean;
  onInstallClick: () => void;
  canPromptInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  swReady: boolean;
  updateAvailable: boolean;
  checkingUpdate: boolean;
  updateStatusMessage: string;
  onCheckUpdates: () => void;
  onApplyUpdate: () => void;
  onRateClick: () => void;
  savedRating: SavedPlayerRating | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onPlayGame,
  onContinueGame,
  hasSave,
  onInstallClick,
  canPromptInstall,
  isInstalled,
  isStandalone,
  isOnline,
  swReady,
  updateAvailable,
  checkingUpdate,
  updateStatusMessage,
  onCheckUpdates,
  onApplyUpdate,
  onRateClick,
  savedRating,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % GALLERY_ITEMS.length));
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i === null ? null : (i - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex]);

  const installButtonLabel = isInstalled || isStandalone ? 'LAUNCH INSTALLED GAME' : '⬇ INSTALL GAME – FREE';

  return (
    <div className="min-h-screen w-full bg-[#060810] text-stone-100 overflow-x-hidden selection:bg-red-700/60 selection:text-white">
      {/* Update Available / Offline Notification Banner */}
      {updateAvailable && (
        <div className="sticky top-0 z-50 bg-red-950/95 border-b border-red-600/60 px-4 py-2.5 text-xs sm:text-sm backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-100">
              <RefreshCw className="w-4 h-4 text-red-300 shrink-0" />
              <span>{updateStatusMessage}</span>
            </div>
            <button
              type="button"
              onClick={onApplyUpdate}
              className="px-3.5 py-1.5 rounded-md bg-white text-black hover:bg-stone-200 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Update &amp; Reload
            </button>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-700/50 px-4 py-2 text-xs text-amber-200 text-center">
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" />
            Offline mode active. Cached files for The Curse of Kalapur remain playable on this device.
          </span>
        </div>
      )}

      {/* 3-Zone Single-Row Sticky Studio Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-[#060810]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Left Zone: Studio Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-3 shrink-0 group focus:outline-none"
          >
            <img
              src="./icons/icon-192x192.png"
              alt="Strange Creation Studio Emblem"
              className="w-9 h-9 rounded-lg border border-stone-700/80 object-cover"
            />
            <span className="font-serif font-black text-base sm:text-lg tracking-wider text-stone-100 group-hover:text-red-400 transition-colors whitespace-nowrap">
              STRANGE CREATION
            </span>
          </a>

          {/* Center Zone: Studio Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300 whitespace-nowrap">
            <a href="#games" className="hover:text-white transition-colors">
              Our Games
            </a>
            <a href="#trailer" className="hover:text-white transition-colors">
              Trailer
            </a>
            <a href="#gallery" className="hover:text-white transition-colors">
              Gallery
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About Studio
            </a>
            <a href="#updates" className="hover:text-white transition-colors">
              Updates
            </a>
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy
            </a>
          </nav>

          {/* Right Zone: Play Flagship Game Action + Mobile Menu Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onPlayGame}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play Kalapur</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-900 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-stone-800 bg-[#080a12] px-5 py-4 space-y-3 text-sm">
            <a href="#games" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              Our Games — The Curse of Kalapur
            </a>
            <a href="#trailer" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              Official Trailer
            </a>
            <a href="#gallery" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              Screenshots Gallery
            </a>
            <a href="#about" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              About Strange Creation
            </a>
            <a href="#updates" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              Updates &amp; Version {GAME_VERSION}
            </a>
            <a href="#privacy" onClick={() => setMobileNavOpen(false)} className="block py-1.5 text-stone-200 hover:text-red-400">
              Security &amp; Privacy Policy
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onRateClick();
              }}
              className="flex items-center gap-2 py-1.5 text-amber-300 hover:text-amber-200 font-medium cursor-pointer"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{savedRating ? `Rate Us (${savedRating.stars}/5)` : 'Rate Us'}</span>
            </button>
          </div>
        )}
      </header>

      {/* STUDIO HERO SECTION */}
      <section id="top" className="relative overflow-hidden border-b border-stone-900">
        {/* Cinematic Background Backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="./screenshots/poster-wide.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060810] via-[#060810]/88 to-[#060810]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-transparent to-[#060810]/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Studio Proposition & Direct Flagship Game Launch */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-red-400 font-semibold">
                Official Indie Game Studio • Founded by Soham Dnyaneshwar Lokhande
              </p>

              <h1
                className="font-serif font-black tracking-wide text-white leading-[1.06]"
                style={{ fontSize: 'clamp(2.35rem, 4.8vw, 4.1rem)' }}
              >
                STRANGE CREATION
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl">
                An independent game development studio building atmospheric Indian horror experiences that run natively in your browser and install cleanly onto your phone or desktop. Explore our flagship title, <strong className="text-white">The Curse of Kalapur</strong>, available free today.
              </p>

              {/* Unboxed Studio Metadata Strip */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-mono text-stone-400">
                <span>Featured Title: The Curse of Kalapur</span>
                <span className="text-stone-700">/</span>
                <span>Release v{GAME_VERSION}</span>
                <span className="text-stone-700">/</span>
                <span>{isOnline ? 'HTTPS Live' : 'Offline Cached'}</span>
                <span className="text-stone-700">/</span>
                <span>Zero APK Required</span>
              </div>

              {/* Primary Giant Animated Install CTA + Play Flagship Game */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={isInstalled || isStandalone ? onPlayGame : onInstallClick}
                  className="install-cta-pulse group px-7 py-4 sm:py-4.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 border border-red-400/60 text-white font-extrabold text-base sm:text-lg tracking-wider uppercase cursor-pointer transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-3 whitespace-nowrap"
                >
                  {isInstalled || isStandalone ? (
                    <>
                      <Play className="w-5 h-5 fill-white" />
                      <span>{installButtonLabel}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                      <span>{installButtonLabel}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={hasSave ? onContinueGame : onPlayGame}
                  className="px-6 py-4 rounded-xl border border-stone-700 bg-stone-950/80 hover:bg-stone-900 hover:border-stone-500 text-stone-100 font-bold text-sm sm:text-base tracking-wider uppercase cursor-pointer transition-colors inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <Play className="w-4 h-4 text-red-400" />
                  <span>{hasSave ? 'Continue Saved Run' : 'Play in Browser'}</span>
                </button>
              </div>

              {/* Transparent Browser Compatibility Note */}
              <p className="text-xs text-stone-400 leading-relaxed flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  {canPromptInstall
                    ? 'Ready to install The Curse of Kalapur directly to your home screen — opens fullscreen in standalone mode.'
                    : 'Installs cleanly on Android Chrome, iPhone/iPad Safari (Share → Add to Home Screen), and Desktop Chromium.'}
                </span>
              </p>
            </div>

            {/* Right Featured Title Spotlight Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-stone-800 bg-stone-950/85 overflow-hidden shadow-2xl">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={officialLogoImg}
                    alt="The Curse of Kalapur by Strange Creation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 border-t border-stone-800/80 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-red-400">
                        Flagship Studio Release
                      </div>
                      <h2 className="text-lg font-serif font-bold text-white mt-0.5">
                        The Curse of Kalapur
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-stone-400">v{GAME_VERSION}</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    3D Indian survival horror escape inside a four-floor haunted haveli. Outsmart Tatya Vinchu and the Ghost, seek shelter in the Puja Shrine, and escape alive.
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <a
                      href="#games"
                      className="text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider"
                    >
                      View Game Details →
                    </a>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onRateClick}
                        className="px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/50 text-amber-200 font-medium whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{savedRating ? `${savedRating.stars}/5 ★` : 'Rate Us'}</span>
                      </button>
                      <a
                        href="#trailer"
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-medium whitespace-nowrap"
                      >
                        Watch Trailer
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 01: STRANGE CREATION GAME CATALOG */}
      <section id="games" className="py-16 sm:py-20 border-b border-stone-900 bg-[#080a12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">
                01. Official Studio Catalog
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-serif font-bold text-white">
                Games by Strange Creation
              </h2>
            </div>
            <p className="text-sm text-stone-400 max-w-md">
              Published directly via HTTPS as instant browser games and installable standalone PWAs — never via third-party APKs.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Game #1: The Curse of Kalapur */}
            <article className="lg:col-span-8 rounded-xl border border-stone-800 bg-stone-950/90 overflow-hidden grid md:grid-cols-12">
              <div className="md:col-span-5 relative bg-black">
                <img
                  src="./screenshots/gameplay-haveli.jpg"
                  alt="The Curse of Kalapur 3D Gameplay"
                  className="w-full h-full object-cover min-h-[220px]"
                />
              </div>
              <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-red-400 font-bold uppercase tracking-wider">Game #01 • Available Now</span>
                    <span className="text-stone-400">3D Survival Horror • Free</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">
                    The Curse of Kalapur
                  </h3>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    You are locked inside the ancient four-floor Kalapur Haveli after dusk. Search desk drawers for keys, keep your flashlight powered, choose between <strong className="text-white">Tatya Vinchu</strong> or the <strong className="text-white">Kalapur Ghost</strong> as your pursuer, rest safely inside the Sacred Puja Shrine, and unlock one of three escape routes.
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-xs text-stone-400 border-t border-stone-800/80">
                    <div><strong className="text-stone-200">Platform:</strong> Android, iOS, PC</div>
                    <div><strong className="text-stone-200">Performance:</strong> 60 FPS High / 50 FPS Low</div>
                    <div><strong className="text-stone-200">Escape Paths:</strong> Door, Car &amp; Boat</div>
                    <div><strong className="text-stone-200">Offline Play:</strong> Supported (PWA)</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={isInstalled || isStandalone ? onPlayGame : onInstallClick}
                    className="px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalled || isStandalone ? 'Launch Installed Game' : '⬇ Install Game – Free'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onPlayGame}
                    className="px-5 py-2.5 rounded-lg border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 text-red-400" />
                    <span>Play Now</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Studio Production Roadmap Card */}
            <aside className="lg:col-span-4 rounded-xl border border-stone-800/80 bg-stone-950/60 p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <Gamepad2 className="w-6 h-6 text-red-400" />
                <div className="text-xs font-mono uppercase tracking-[0.16em] text-stone-400">
                  Studio Pipeline
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Upcoming Strange Creation Titles
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Following the ongoing updates to <strong className="text-stone-200">The Curse of Kalapur</strong>, Strange Creation is expanding new chapters, enhanced AI encounters, and upcoming original web-native horror games.
                </p>
              </div>
              <div className="pt-4 border-t border-stone-800/80 space-y-3">
                <p className="text-xs text-stone-400">
                  Follow developer updates and gameplay devlogs directly on our official channel:
                </p>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300"
                >
                  <Youtube className="w-4 h-4" />
                  <span>MR STRANGE 1229 on YouTube</span>
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTION 02: OFFICIAL GAMEPLAY TRAILER */}
      <section id="trailer" className="py-16 sm:py-20 border-b border-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">02. Featured Game Trailer</p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-serif font-bold text-white">
                The Curse of Kalapur — Official Trailer
              </h2>
            </div>
            <p className="text-sm text-stone-400 max-w-md">
              Preview the darkened mansion corridors, cursed doll encounters, sacred Puja Shrine protection, and subterranean boat escape.
            </p>
          </div>

          <TrailerPlayer onPlayGame={onPlayGame} />
        </div>
      </section>

      {/* SECTION 03: SCREENSHOTS & VISUAL GALLERY */}
      <section id="gallery" className="py-16 sm:py-20 border-b border-stone-900 bg-[#080a12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">03. Visual Gallery</p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-serif font-bold text-white">
                The Curse of Kalapur — Screenshots &amp; Art
              </h2>
            </div>
            <p className="text-sm text-stone-400">
              Select any screenshot to view full screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`group text-left rounded-xl border border-stone-800/90 bg-stone-950/80 overflow-hidden hover:border-red-700/70 transition-colors cursor-pointer ${
                  idx === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="aspect-video overflow-hidden bg-black">
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="p-4 sm:p-5 border-t border-stone-800/70">
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-red-400">
                    {item.category}
                  </div>
                  <h3 className="mt-1 text-base sm:text-lg font-serif font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-stone-400 leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04: ABOUT STRANGE CREATION & GAME SYSTEMS */}
      <section id="about" className="py-16 sm:py-20 border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">04. Studio &amp; Craft</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                About Strange Creation
              </h2>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                Founded by independent developer <strong className="text-white">Soham Dnyaneshwar Lokhande</strong> (creator of <strong className="text-white">MR STRANGE 1229</strong>), <strong className="text-white">Strange Creation</strong> focuses on rich 3D Indian horror storytelling that anyone can play instantly without heavy app stores or expensive hardware.
              </p>
              <p className="text-sm text-stone-400 leading-relaxed">
                Inside <strong className="text-stone-200">The Curse of Kalapur</strong>, key locations shuffle every playthrough across drawers, closets, and upper floors so every escape demands sharp ears and careful exploration.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onPlayGame}
                  className="px-5 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play The Curse of Kalapur</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-stone-800/90 bg-stone-950/70 p-6 space-y-2.5">
                <span className="text-xs font-mono text-red-400 font-bold">01</span>
                <h3 className="text-lg font-serif font-bold text-white">Three Escape Endings</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Restore the Ancestor Photo Frame at the Main Foyer Door, repair and fuel the Basement Escape Car, or cut chains to escape by boat through the Subterranean River Gate.
                </p>
              </div>

              <div className="rounded-xl border border-stone-800/90 bg-stone-950/70 p-6 space-y-2.5">
                <span className="text-xs font-mono text-red-400 font-bold">02</span>
                <h3 className="text-lg font-serif font-bold text-white">Tatya Vinchu &amp; Ghost AI</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Choose your antagonist before playing. Both roam freely across rooms and staircases, reacting to sprint noise while blocked from entering the glowing Puja Mantra Shrine.
                </p>
              </div>

              <div className="rounded-xl border border-stone-800/90 bg-stone-950/70 p-6 space-y-2.5">
                <span className="text-xs font-mono text-red-400 font-bold">03</span>
                <h3 className="text-lg font-serif font-bold text-white">60 FPS High &amp; 50 FPS Low</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Tuned for smooth frame pacing on mobile devices and desktops, with damped camera look smoothing and customizable Movement Sensitivity (0.50x to 1.80x).
                </p>
              </div>

              <div className="rounded-xl border border-stone-800/90 bg-stone-950/70 p-6 space-y-2.5">
                <span className="text-xs font-mono text-red-400 font-bold">04</span>
                <h3 className="text-lg font-serif font-bold text-white">Offline Standalone PWA</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Precaches the 3D engine, models, and original horror soundtrack including Count the Doors so installed players can launch straight into the mansion even offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: UPDATES, VERSIONING & AUTOMATIC SYNC */}
      <section id="updates" className="py-16 sm:py-20 border-b border-stone-900 bg-[#080a12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Live Installed Version Card */}
            <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-stone-950/90 p-6 sm:p-7 space-y-5">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">
                  05. Automatic Updates
                </p>
                <h2 className="mt-1.5 text-2xl font-serif font-bold text-white">
                  Current Release v{GAME_VERSION}
                </h2>
                <p className="mt-1 text-xs font-mono text-stone-400">
                  Published {GAME_RELEASE_DATE}
                </p>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm border-y border-stone-800/80 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Network Connection</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-stone-200">
                    {isOnline ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                        Offline Mode
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Offline PWA Cache</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-stone-200">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${swReady ? 'text-emerald-400' : 'text-stone-500'}`} />
                    {swReady ? 'Active & Validated' : 'Browser Preview'}
                  </span>
                </div>
                <div className="pt-1 text-xs text-stone-300 leading-relaxed">
                  {updateStatusMessage}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onCheckUpdates}
                  disabled={checkingUpdate}
                  className="px-4 py-2.5 rounded-lg border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60 inline-flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                  <span>{checkingUpdate ? 'Checking...' : 'Check for Updates'}</span>
                </button>

                {updateAvailable && (
                  <button
                    type="button"
                    onClick={onApplyUpdate}
                    className="px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Update &amp; Reload</span>
                  </button>
                )}
              </div>
            </div>

            {/* Release Notes */}
            <div className="lg:col-span-7 space-y-5">
              {RELEASE_CHANGELOG.map((rel) => (
                <article
                  key={rel.version}
                  className="rounded-xl border border-stone-800/90 bg-stone-950/60 p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                      The Curse of Kalapur v{rel.version} — {rel.title}
                    </h3>
                    <span className="text-xs font-mono text-stone-400">{rel.date}</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-300 list-disc list-inside leading-relaxed">
                    {rel.changes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: SECURITY, PRIVACY POLICY & DEVELOPER CONTACT */}
      <section id="privacy" className="py-16 sm:py-20 border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-red-400">
              06. Player Trust &amp; Security
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-serif font-bold text-white">
              Privacy Policy &amp; Studio Contact
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-6 space-y-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-serif font-bold text-white">Zero Unnecessary Permissions</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Strange Creation games never ask for camera, microphone, contacts, SMS, or GPS permissions and never distribute APK executables. Everything runs sandboxed over HTTPS via standard browser technology.
              </p>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-6 space-y-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-serif font-bold text-white">On-Device Data Only</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                We do not collect personal information or run third-party advertising trackers. Game progress checkpoints, volume levels, graphics quality, and sensitivity preferences remain strictly inside your browser&apos;s <code className="text-stone-200">localStorage</code>.
              </p>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-6 space-y-3">
              <Info className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-serif font-bold text-white">Contact Strange Creation</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Developed by <strong className="text-stone-200">Strange Creation</strong> (Founder:{' '}
                <strong className="text-stone-200">Soham Dnyaneshwar Lokhande</strong>). Reach us for support or follow updates on YouTube (<strong className="text-stone-200">MR STRANGE 1229</strong>).
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={onRateClick}
                  className="px-3 py-1.5 rounded-md border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{savedRating ? `Your Rating: ${savedRating.stars}/5 • Update` : 'Rate Us'}</span>
                </button>
                <a
                  href="https://github.com/sl9156530176s7-pixel/THE-CURSE-OF-KALAPUR/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                >
                  <span>GitHub Support</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="./privacy-policy.html"
                  className="text-stone-200 hover:text-white underline underline-offset-4"
                >
                  privacy-policy.html
                </a>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  Quick Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUIET COMMERCIAL STUDIO FOOTER */}
      <footer className="bg-[#05070d] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-stone-400">
          <div className="space-y-1.5">
            <div className="font-serif font-bold text-sm tracking-wider text-stone-100">
              STRANGE CREATION
            </div>
            <div>
              Official Publisher of <strong className="text-stone-200">The Curse of Kalapur</strong> • Founder: Soham Dnyaneshwar Lokhande
            </div>
            <div className="font-mono text-stone-500">
              v{GAME_VERSION} • Progressive Web App • HTTPS Verified
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="#games" className="hover:text-white">Our Games</a>
            <a href="#trailer" className="hover:text-white">Trailer</a>
            <a href="#gallery" className="hover:text-white">Gallery</a>
            <a href="#updates" className="hover:text-white">Updates</a>
            <a href="./privacy-policy.html" className="hover:text-white">Privacy Policy</a>
            <button
              type="button"
              onClick={onRateClick}
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-medium cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{savedRating ? `Rate Us (${savedRating.stars}/5)` : 'Rate Us'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-white cursor-pointer"
            >
              Quick View
            </button>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
            >
              <Youtube className="w-4 h-4" />
              <span>MR STRANGE 1229</span>
            </a>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX VIEWER FOR SCREENSHOTS */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-200 cursor-pointer border border-stone-700"
            aria-label="Close gallery preview"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setLightboxIndex((lightboxIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)}
            className="hidden sm:flex p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 cursor-pointer mr-4"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="max-w-5xl w-full space-y-3">
            <div className="aspect-video rounded-xl overflow-hidden border border-stone-800 bg-black shadow-2xl">
              <img
                src={GALLERY_ITEMS[lightboxIndex].src}
                alt={GALLERY_ITEMS[lightboxIndex].title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-red-400">
                  {GALLERY_ITEMS[lightboxIndex].category} ({lightboxIndex + 1}/{GALLERY_ITEMS.length})
                </div>
                <div className="text-base sm:text-lg font-serif font-bold text-white">
                  {GALLERY_ITEMS[lightboxIndex].title}
                </div>
                <p className="text-xs sm:text-sm text-stone-400">{GALLERY_ITEMS[lightboxIndex].caption}</p>
              </div>
              <div className="flex sm:hidden gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)}
                  className="px-3 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-white"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % GALLERY_ITEMS.length)}
                  className="px-3 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLightboxIndex((lightboxIndex + 1) % GALLERY_ITEMS.length)}
            className="hidden sm:flex p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 cursor-pointer ml-4"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* FULL PRIVACY POLICY MODAL */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-policy-heading"
        >
          <div className="w-full max-w-2xl rounded-xl border border-stone-800 bg-[#0c0d14] p-6 sm:p-8 text-stone-200 max-h-[88vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-400">
                  Transparency &amp; Security
                </p>
                <h2 id="privacy-policy-heading" className="text-xl font-serif font-bold text-white mt-1">
                  Privacy Policy — Strange Creation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                aria-label="Close privacy policy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <p>
                <strong className="text-white">1. Data Collection:</strong> Strange Creation does not collect, sell, or transmit your personal identity, emails, IP logs, microphone audio, camera feed, or device GPS coordinates.
              </p>
              <p>
                <strong className="text-white">2. Local Storage &amp; Offline Caching:</strong> Saved game checkpoints for The Curse of Kalapur, volume levels, graphics preset selection, look/movement sensitivity sliders, and cached PWA assets (HTML, JavaScript, 3D textures, and audio) are stored locally inside your browser&apos;s sandboxed storage so you can play offline and resume progress.
              </p>
              <p>
                <strong className="text-white">3. Security &amp; Updates:</strong> All files are served exclusively over GitHub Pages HTTPS. Updates are verified using the Service Worker cache manifest and <code className="text-stone-200">version.json</code>; we never prompt players to download third-party APKs or unverified executables.
              </p>
              <p>
                <strong className="text-white">4. Contact Studio:</strong> For support, privacy questions, or bug reports, contact founder Soham Dnyaneshwar Lokhande (Strange Creation) via our repository support page at <code className="text-stone-200">github.com/sl9156530176s7-pixel/THE-CURSE-OF-KALAPUR/issues</code>.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-800 text-right">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
