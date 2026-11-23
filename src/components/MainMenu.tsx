import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gameState, GameSettings } from '../game/gameState';
import { soundManager } from '../audio/SoundManager';
import { Play, RotateCcw, Settings, HelpCircle, X, Volume2, Shield, Eye, Flame, Compass, Youtube, Image as ImageIcon, Music, Download, Globe, RefreshCw, Star } from 'lucide-react';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface MainMenuProps {
  onPlay: () => void;
  onContinue: () => void;
  onReplayIntro: () => void;
  onBackToWebsite?: () => void;
  onInstallApp?: () => void;
  onRateUs?: () => void;
  updateAvailable?: boolean;
  onApplyUpdate?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onContinue,
  onReplayIntro,
  onBackToWebsite,
  onInstallApp,
  onRateUs,
  updateAvailable,
  onApplyUpdate,
}) => {
  const [hasSave, setHasSave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(gameState.settings);

  useEffect(() => {
    soundManager.init();
    soundManager.setMusicMood('menu');
    soundManager.setRainIntensity(0.5);
    // Play authentic Count the Doors horror song
    soundManager.startSongTrack();
    setHasSave(gameState.hasSave());

    const unsub = gameState.subscribe(() => {
      setSettings({ ...gameState.settings });
      setHasSave(gameState.hasSave());
    });
    return () => {
      unsub();
    };
  }, []);

  const handleSettingChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    gameState.saveSettings({ [key]: value });

    if (key === 'masterVolume' || key === 'musicVolume' || key === 'sfxVolume') {
      soundManager.setVolumes(
        key === 'masterVolume' ? (value as number) : updated.masterVolume,
        key === 'musicVolume' ? (value as number) : updated.musicVolume,
        key === 'sfxVolume' ? (value as number) : updated.sfxVolume
      );
    }

    if (key === 'songEnabled') {
      if (value) {
        soundManager.startSongTrack();
      } else {
        soundManager.stopSongTrack();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none pointer-events-auto overflow-y-auto">
      {/* Dark Vignette Overlay for Menu Contrast over 3D Live Scene */}
      <div className="fixed inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent pointer-events-none -z-10" />

      {/* Top Header & Official Game Logo */}
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          {/* Official Game Logo Thumbnail */}
          <div
            onClick={() => setShowLogoModal(true)}
            className="w-28 sm:w-40 md:w-52 aspect-video rounded border border-red-900/60 overflow-hidden shadow-[0_0_25px_rgba(200,0,0,0.5)] cursor-pointer group relative bg-black shrink-0"
            title="Click to view full official game logo"
          >
            <img
              src={officialLogoImg}
              alt="The Curse of Kalapur Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-red-900/10 group-hover:bg-transparent transition-colors" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_#ff0000]" />
              <span className="text-red-500 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold">
                STRANGE CREATION
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-300 to-red-600 tracking-wider drop-shadow-[0_4px_18px_rgba(200,0,0,0.6)]"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              THE CURSE OF KALAPUR
            </h1>
            <p className="text-stone-400 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-sans mt-0.5 hidden sm:block">
              Escape the house. Discover the truth.
            </p>
          </div>
        </div>

        {/* On-Screen Song Toggle & Founder Badge */}
        <div className="flex items-center gap-3">
          {/* Dedicated On-Screen Song On/Off Button */}
          <button
            onClick={() => {
              const next = soundManager.toggleSong();
              setSettings((prev) => ({ ...prev, songEnabled: next }));
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded text-xs tracking-wider uppercase font-mono transition-all duration-300 backdrop-blur-sm cursor-pointer border shadow-xl ${
              settings.songEnabled
                ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : 'bg-stone-950/80 hover:bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
            title="Toggle Horror Song: Count the Doors"
          >
            <Music className={`w-4 h-4 ${settings.songEnabled ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
            <span>SONG: {settings.songEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Founder Credits & YouTube Channel Badge */}
          <div className="hidden md:flex flex-col items-end text-right bg-stone-950/85 border border-stone-800/80 px-4 py-2.5 rounded backdrop-blur-sm shadow-xl">
            <span className="text-[10px] text-stone-500 uppercase tracking-widest">Founder &amp; Creator</span>
            <span className="text-stone-200 text-sm font-semibold tracking-wider font-serif">
              Soham Dnyaneshwar Lokhande
            </span>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono tracking-wider mt-1 cursor-pointer"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>MR STRANGE 1229</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Action Buttons (2-column compact layout on mobile landscape, vertical stack on desktop) */}
      <nav className="my-3 md:my-auto w-full max-w-2xl md:max-w-sm grid grid-cols-2 md:grid-cols-1 gap-2 sm:gap-2.5 z-10">
        {/* Play Button */}
        <button
          onClick={() => {
            soundManager.playCinematicImpact();
            onPlay();
          }}
          className="col-span-2 md:col-span-1 group w-full flex items-center justify-between px-5 py-3 md:py-4 bg-gradient-to-r from-red-950/90 to-stone-900/90 hover:from-red-900 hover:to-red-950 border border-red-700/70 hover:border-red-500 rounded text-stone-100 transition-all duration-200 cursor-pointer shadow-lg shadow-black/60 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-base md:text-lg font-bold tracking-[0.2em] uppercase font-serif">PLAY GAME</span>
          </div>
          <span className="text-[11px] text-red-400 tracking-widest opacity-90">ENTER HORIZONTAL</span>
        </button>

        {/* Continue Button */}
        <button
          onClick={() => {
            if (!hasSave) return;
            soundManager.playItemPickup();
            onContinue();
          }}
          disabled={!hasSave}
          className={`group w-full flex items-center justify-between px-4 py-2.5 md:px-6 md:py-3.5 border rounded transition-all duration-200 shadow-md ${
            hasSave
              ? 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-700 hover:border-stone-500 text-stone-200 cursor-pointer'
              : 'bg-stone-950/50 border-stone-800/40 text-stone-600 cursor-not-allowed opacity-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase font-serif">CONTINUE</span>
          </div>
          <span className="text-[9px] tracking-wider text-stone-500 uppercase hidden sm:inline">
            {hasSave ? 'READY' : 'EMPTY'}
          </span>
        </button>

        {/* View Official Game Logo Modal */}
        <button
          onClick={() => setShowLogoModal(true)}
          className="group w-full flex items-center justify-between px-4 py-2.5 md:px-6 md:py-3 bg-stone-950/80 hover:bg-stone-900/90 border border-red-950 hover:border-red-800/70 rounded text-stone-300 transition-all duration-200 cursor-pointer shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase font-serif">OFFICIAL LOGO</span>
          </div>
          <span className="text-[9px] tracking-wider text-red-400 uppercase hidden sm:inline">4K ART</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            soundManager.playItemPickup();
            setShowSettings(true);
          }}
          className="group w-full flex items-center justify-between px-4 py-2.5 md:px-6 md:py-3 bg-stone-950/70 hover:bg-stone-900/80 border border-stone-800 hover:border-stone-600 rounded text-stone-300 transition-all duration-200 cursor-pointer shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-stone-400 group-hover:rotate-45 transition-transform shrink-0" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase font-serif">SETTINGS</span>
          </div>
          <span className="text-[9px] tracking-wider text-stone-500 uppercase hidden sm:inline">AUDIO / GPU</span>
        </button>

        {/* How to Play Button */}
        <button
          onClick={() => {
            soundManager.playItemPickup();
            setShowHowToPlay(true);
          }}
          className="group w-full flex items-center justify-between px-4 py-2.5 md:px-6 md:py-3 bg-stone-950/70 hover:bg-stone-900/80 border border-stone-800 hover:border-stone-600 rounded text-stone-300 transition-all duration-200 cursor-pointer shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase font-serif">HOW TO PLAY</span>
          </div>
          <span className="text-[9px] tracking-wider text-stone-500 uppercase hidden sm:inline">GUIDE</span>
        </button>

        {/* Replay Cinematic Intro */}
        <button
          onClick={() => {
            onReplayIntro();
          }}
          className="col-span-2 md:col-span-1 group w-full flex items-center justify-between px-4 py-2 bg-transparent hover:bg-stone-900/40 border border-stone-800/40 hover:border-stone-700/60 rounded text-stone-400 text-[11px] tracking-widest uppercase transition-all duration-200 cursor-pointer"
        >
          <span>REPLAY INTRO SCENE</span>
          <span className="text-stone-600 group-hover:text-red-400">46s</span>
        </button>

        {/* Update Ready Banner */}
        {updateAvailable && onApplyUpdate && (
          <button
            onClick={onApplyUpdate}
            className="col-span-2 md:col-span-1 w-full flex items-center justify-between px-4 py-2.5 bg-red-950/90 hover:bg-red-900 border border-red-500/80 rounded text-red-100 text-[11px] tracking-wider uppercase font-bold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-red-300" />
              UPDATE AVAILABLE — RELOAD
            </span>
            <span className="text-red-300 font-mono">NEW</span>
          </button>
        )}

        {/* Install App, Rate Us & Back to Website */}
        {(onInstallApp || onRateUs || onBackToWebsite) && (
          <div className="col-span-2 md:col-span-1 flex gap-2">
            {onInstallApp && (
              <button
                onClick={onInstallApp}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 rounded text-red-200 text-[11px] tracking-wider uppercase font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
            {onRateUs && (
              <button
                onClick={onRateUs}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 rounded text-amber-200 text-[11px] tracking-wider uppercase font-semibold transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Rate Us</span>
              </button>
            )}
            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-950/70 hover:bg-stone-900 border border-stone-800 rounded text-stone-300 text-[11px] tracking-wider uppercase transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Footer System Info */}
      <footer className="flex flex-wrap justify-between items-center text-[10px] sm:text-xs text-stone-500 border-t border-stone-800/40 pt-2 gap-2">
        <div>
          <span>THE CURSE OF KALAPUR • Android &amp; PC</span>
          <span className="mx-1.5">•</span>
          <span className="text-stone-400">Headphones Recommended</span>
        </div>
        <div className="text-stone-400">
          <span>Developed by <strong className="text-stone-200">STRANGE CREATION</strong></span>
          <span className="mx-1.5">•</span>
          <span>Creator: <strong className="text-stone-200">Soham Dnyaneshwar Lokhande</strong></span>
        </div>
      </footer>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-stone-950 border border-stone-800 p-5 md:p-8 rounded shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-bold font-serif tracking-wider">GAME SETTINGS</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 text-sm">
                {/* Master Volume */}
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span>Master Volume</span>
                    <span className="font-mono text-red-400">{Math.round(settings.masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.masterVolume}
                    onChange={(e) => handleSettingChange('masterVolume', parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-stone-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Music Volume */}
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span>Music &amp; Ambiance Volume</span>
                    <span className="font-mono text-red-400">{Math.round(settings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.musicVolume}
                    onChange={(e) => handleSettingChange('musicVolume', parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-stone-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* SFX Volume */}
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span>Sound Effects Volume</span>
                    <span className="font-mono text-red-400">{Math.round(settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxVolume}
                    onChange={(e) => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-stone-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Look Sensitivity (Smooth Touch & Mouse) */}
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span>Look Sensitivity (Smooth Touch &amp; Mouse)</span>
                    <span className="font-mono text-red-400">{settings.mouseSensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="2.2"
                    step="0.05"
                    value={settings.mouseSensitivity}
                    onChange={(e) => handleSettingChange('mouseSensitivity', parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-stone-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Movement Sensitivity (Walk & Sprint Speed) */}
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span>Movement Sensitivity (Walk / Sprint)</span>
                    <span className="font-mono text-red-400">{(settings.movementSensitivity ?? 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={settings.movementSensitivity ?? 1.0}
                    onChange={(e) => handleSettingChange('movementSensitivity', parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-stone-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Graphics Quality & FPS Target */}
                <div className="flex flex-wrap justify-between items-center pt-2 gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-stone-200">Graphics &amp; FPS</span>
                    <span className="text-[10px] text-stone-500">90 FPS Smooth recommended for zero lag</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { id: 'low', label: 'Low Fast' },
                      { id: 'smooth90', label: '90 FPS' },
                      { id: 'medium', label: 'Balanced' },
                      { id: 'high', label: 'High HD' },
                    ] as const).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSettingChange('graphicsQuality', q.id)}
                        className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded border cursor-pointer font-semibold ${
                          settings.graphicsQuality === q.id
                            ? 'bg-red-950 border-red-500 text-red-200'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Villain Selection */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-stone-200">Horror Villain</span>
                    <span className="text-[10px] text-stone-500">Select mansion antagonist</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSettingChange('villainType', 'tatya')}
                      className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border cursor-pointer font-bold ${
                        settings.villainType === 'tatya'
                          ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      Tatya Vinchu
                    </button>
                    <button
                      onClick={() => handleSettingChange('villainType', 'ghost')}
                      className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border cursor-pointer font-bold ${
                        settings.villainType === 'ghost'
                          ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      Ghost
                    </button>
                  </div>
                </div>

                {/* Horror Song Toggle */}
                <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                  <div className="flex flex-col">
                    <span className="font-semibold text-stone-200">Horror Song</span>
                    <span className="text-[10px] text-stone-500">"Count the Doors" background song</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange('songEnabled', !settings.songEnabled)}
                    className={`px-3 py-1.5 text-xs font-mono tracking-wider rounded border cursor-pointer flex items-center gap-1.5 ${
                      settings.songEnabled
                        ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-stone-900 border-stone-800 text-stone-500'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>{settings.songEnabled ? 'ENABLED' : 'MUTED'}</span>
                  </button>
                </div>

                {/* Subtitles Toggle */}
                <div className="flex justify-between items-center pt-2">
                  <span>Show Subtitles</span>
                  <button
                    onClick={() => handleSettingChange('showSubtitles', !settings.showSubtitles)}
                    className={`px-4 py-1 text-xs uppercase tracking-wider rounded border cursor-pointer ${
                      settings.showSubtitles
                        ? 'bg-red-950 border-red-500 text-red-200'
                        : 'bg-stone-900 border-stone-800 text-stone-500'
                    }`}
                  >
                    {settings.showSubtitles ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-800 text-right">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-red-900 hover:bg-red-800 rounded text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Save &amp; Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOW TO PLAY MODAL */}
      <AnimatePresence>
        {showHowToPlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-stone-950 border border-stone-800 p-6 md:p-8 rounded shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-bold font-serif tracking-wider">SURVIVAL GUIDE</h2>
                </div>
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="text-red-400 font-serif font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Compass className="w-4 h-4" /> PC Controls
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-900/60 p-3 rounded border border-stone-800">
                    <div><span className="text-stone-400 font-mono">W, A, S, D</span> : Walk</div>
                    <div><span className="text-stone-400 font-mono">Mouse</span> : Look Around</div>
                    <div><span className="text-stone-400 font-mono">E</span> : Interact / Hide / Take / Place</div>
                    <div><span className="text-stone-400 font-mono">Shift</span> : Sprint (Drains stamina)</div>
                    <div><span className="text-stone-400 font-mono">C</span> : Crouch (Silent movement)</div>
                    <div><span className="text-stone-400 font-mono">F / Right-Click</span> : Toggle Flashlight</div>
                    <div><span className="text-stone-400 font-mono">Esc</span> : Pause Game</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-red-400 font-serif font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> The Core Mission: Restore the Photo Frame
                  </h3>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    The Grand Exit Door in the Foyer has an empty cursed frame mount. The door cannot be opened until the
                    sacred Ancestor Photo Frame is restored. Search the upper floors and enter the unsealed Mystic Sanctum,
                    retrieve the frame, carry it back downstairs, attach it with <strong className="text-red-400">[E]</strong>, and escape!
                  </p>
                </div>

                <div>
                  <h3 className="text-red-400 font-serif font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> The Kalapur Ghost
                  </h3>
                  <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                    <li>The ghost continuously patrols both floors and reacts to noise (sprinting footsteps).</li>
                    <li>When your screen distorts and your heartbeat accelerates, the ghost is hunting nearby.</li>
                    <li>Hide inside antique wardrobes or underneath charpai beds with <strong>[E]</strong> before she sees you!</li>
                    <li>If the ghost sees you, sprint away, break line of sight, and hide immediately.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-800 text-right">
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="px-6 py-2 bg-red-900 hover:bg-red-800 rounded text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* OFFICIAL GAME LOGO ASSET SHOWCASE MODAL */}
        {showLogoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-stone-950 border border-stone-800 p-5 md:p-8 rounded shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-red-500 font-mono tracking-[0.3em] uppercase block">
                    ORIGINAL GAME ASSET • 16:9 WIDESCREEN
                  </span>
                  <h2 className="text-xl font-bold font-serif tracking-wider">
                    OFFICIAL LOGO — THE CURSE OF KALAPUR
                  </h2>
                </div>
                <button
                  onClick={() => setShowLogoModal(false)}
                  className="p-1.5 hover:bg-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full 16:9 Display */}
              <div className="relative aspect-video w-full rounded border border-red-900/60 overflow-hidden shadow-[0_0_80px_rgba(200,0,0,0.6)] bg-black mb-4 flex items-center justify-center">
                <img
                  src={officialLogoImg}
                  alt="Official Logo The Curse of Kalapur by Strange Creation"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Asset Information & Creator Credits */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-stone-400 border-t border-stone-800/80 pt-4 gap-3">
                <div className="space-y-1">
                  <div><strong className="text-stone-200">Studio:</strong> STRANGE CREATION</div>
                  <div><strong className="text-stone-200">Creator &amp; Founder:</strong> Soham Dnyaneshwar Lokhande</div>
                  <div><strong className="text-stone-200">YouTube Channel:</strong> MR STRANGE 1229</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-stone-500 text-[11px]">Ready for YouTube Thumbnails &amp; Title Screens</span>
                  <button
                    onClick={() => setShowLogoModal(false)}
                    className="px-5 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
