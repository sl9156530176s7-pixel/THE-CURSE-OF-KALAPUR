import React, { useState } from 'react';
import { Play, RotateCcw, Settings, HelpCircle, Home, Save, Volume2, X, Music, Maximize2, Sun, Moon } from 'lucide-react';
import { gameState, GameSettings } from '../game/gameState';
import { soundManager } from '../audio/SoundManager';

interface PauseMenuProps {
  onResume: () => void;
  onSave: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onSave, onMainMenu }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(gameState.settings);
  const [savedBanner, setSavedBanner] = useState(false);

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
  };

  const handleSaveClick = () => {
    onSave();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none font-serif">
      <div className="w-full max-w-sm bg-stone-950 border border-stone-800 p-5 sm:p-7 rounded shadow-2xl text-center space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="border-b border-stone-800 pb-4 mb-2">
          <span className="text-[10px] text-red-500 font-mono tracking-[0.3em] uppercase block mb-1">
            GAME PAUSED
          </span>
          <h2 className="text-2xl font-bold tracking-wider text-stone-100" style={{ fontFamily: 'Cinzel, serif' }}>
            KALAPUR HOUSE
          </h2>
        </div>

        {savedBanner && (
          <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs py-1.5 px-3 rounded tracking-wider uppercase font-sans animate-pulse">
            Game Progress Saved!
          </div>
        )}

        <div className="space-y-2.5 font-sans">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/80 hover:bg-red-900 border border-red-700/60 rounded text-stone-100 text-sm font-bold tracking-widest uppercase cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 text-red-400" />
            Resume
          </button>

          {/* Save Progress */}
          <button
            onClick={handleSaveClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-all"
          >
            <Save className="w-4 h-4 text-stone-400" />
            Save Checkpoint
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-all"
          >
            <Settings className="w-4 h-4 text-stone-400" />
            Settings
          </button>

          {/* Controls */}
          <button
            onClick={() => setShowControls(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-all"
          >
            <HelpCircle className="w-4 h-4 text-stone-400" />
            Controls Guide
          </button>

          {/* Quick Lighting Mode Toggle (Dark Flashlight-Only vs Light All-On) */}
          <button
            onClick={() =>
              handleSettingChange(
                'lightingMode',
                (settings.lightingMode || 'dark') === 'dark' ? 'light' : 'dark'
              )
            }
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-semibold tracking-widest uppercase cursor-pointer transition-all border ${
              (settings.lightingMode || 'dark') === 'light'
                ? 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/70 text-amber-200'
                : 'bg-stone-900/80 hover:bg-stone-800 border-stone-700/60 text-stone-200'
            }`}
          >
            {(settings.lightingMode || 'dark') === 'light' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-red-400" />
            )}
            <span>
              Mode: {(settings.lightingMode || 'dark') === 'light' ? 'Light (All Lights On)' : 'Dark (Flashlight Only)'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              try {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch?.(() => {});
                } else {
                  document.exitFullscreen?.().catch?.(() => {});
                }
              } catch {
                // ignore unsupported
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 rounded text-stone-200 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-all"
          >
            <Maximize2 className="w-4 h-4 text-amber-400" />
            Toggle Fullscreen
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-stone-900 border border-stone-800 hover:border-stone-700 rounded text-stone-400 hover:text-stone-200 text-xs tracking-widest uppercase cursor-pointer transition-all"
          >
            <Home className="w-4 h-4 text-stone-500" />
            Main Menu
          </button>
        </div>

        <div className="pt-2 text-[10px] text-stone-600 font-sans tracking-widest uppercase">
          STRANGE CREATION • Soham Dnyaneshwar Lokhande
        </div>
      </div>

      {/* Embedded Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-stone-950 border border-stone-800 p-5 rounded text-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-lg">SETTINGS</h3>
              <button onClick={() => setShowSettings(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="space-y-4 text-xs font-sans">
              <div>
                <div className="flex justify-between mb-1">
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
              <div>
                <div className="flex justify-between mb-1">
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

              <div>
                <div className="flex justify-between mb-1">
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

              {/* Graphics & FPS Setting */}
              <div className="flex flex-wrap justify-between items-center pt-2 border-t border-stone-800 gap-2">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-stone-200">Graphics &amp; FPS</span>
                  <span className="text-[10px] text-stone-500">90 FPS recommended on phones</span>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {([
                    { id: 'low', label: 'Low Fast' },
                    { id: 'smooth90', label: '90 FPS' },
                    { id: 'medium', label: 'Balanced' },
                    { id: 'high', label: 'High HD' },
                  ] as const).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSettingChange('graphicsQuality', q.id)}
                      className={`px-2 py-1 rounded border cursor-pointer font-bold text-[10px] uppercase ${
                        settings.graphicsQuality === q.id
                          ? 'bg-red-900 border-red-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting Mode (Dark vs Light) */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800 gap-2">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-stone-200">Lighting Mode</span>
                  <span className="text-[10px] text-stone-500">
                    {(settings.lightingMode || 'dark') === 'dark'
                      ? 'No room lights — Flashlight only'
                      : 'All house lights ON — No dark'}
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSettingChange('lightingMode', 'dark')}
                    className={`px-2.5 py-1 rounded border cursor-pointer font-bold text-[10px] uppercase flex items-center gap-1 ${
                      (settings.lightingMode || 'dark') === 'dark'
                        ? 'bg-red-900 border-red-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => handleSettingChange('lightingMode', 'light')}
                    className={`px-2.5 py-1 rounded border cursor-pointer font-bold text-[10px] uppercase flex items-center gap-1 ${
                      (settings.lightingMode || 'dark') === 'light'
                        ? 'bg-amber-500 border-amber-300 text-black'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Screen Stability Mode (Granny Steady vs Walk Bob) */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800 gap-2">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-stone-200">Screen Stability</span>
                  <span className="text-[10px] text-stone-500">Zero camera sway or subtle walk step</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSettingChange('cameraHeadBob', false)}
                    className={`px-2.5 py-1 rounded border cursor-pointer font-bold text-[10px] uppercase ${
                      !settings.cameraHeadBob
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    Steady
                  </button>
                  <button
                    onClick={() => handleSettingChange('cameraHeadBob', true)}
                    className={`px-2.5 py-1 rounded border cursor-pointer font-bold text-[10px] uppercase ${
                      settings.cameraHeadBob
                        ? 'bg-red-900 border-red-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    Walk Bob
                  </button>
                </div>
              </div>

              {/* Horror Song Toggle */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-stone-200">Horror Song</span>
                  <span className="text-[10px] text-stone-500">"Count the Doors" background song</span>
                </div>
                <button
                  onClick={() => {
                    const next = soundManager.toggleSong();
                    setSettings((s) => ({ ...s, songEnabled: next }));
                  }}
                  className={`px-3 py-1.5 rounded border cursor-pointer font-bold flex items-center gap-1.5 ${
                    settings.songEnabled
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-stone-900 border-stone-800 text-stone-500'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{settings.songEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Difficulty Selector */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800 gap-2">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-stone-300">Difficulty</span>
                  <span className="text-[10px] text-stone-500">Speed, sight &amp; outage rate</span>
                </div>
                <div className="flex gap-1.5">
                  {(['normal', 'nightmare', 'hardcore'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleSettingChange('difficulty', lvl)}
                      className={`px-2 py-1 rounded border cursor-pointer font-bold uppercase text-[10px] ${
                        settings.difficulty === lvl
                          ? 'bg-red-900 border-red-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Villain Selector */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                <span className="font-semibold text-stone-300">Active Villain</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSettingChange('villainType', 'tatya')}
                    className={`px-3 py-1 rounded border cursor-pointer font-bold ${
                      settings.villainType === 'tatya'
                        ? 'bg-red-900 border-red-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    Tatya Vinchu
                  </button>
                  <button
                    onClick={() => handleSettingChange('villainType', 'ghost')}
                    className={`px-3 py-1 rounded border cursor-pointer font-bold ${
                      settings.villainType === 'ghost'
                        ? 'bg-red-900 border-red-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    Ghost
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-red-900 rounded text-white text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Embedded Controls Modal */}
      {showControls && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-stone-950 border border-stone-800 p-5 rounded text-stone-200 space-y-4 font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3 font-serif">
              <h3 className="font-bold text-lg">CONTROLS</h3>
              <button onClick={() => setShowControls(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="space-y-2 bg-stone-900/50 p-4 rounded border border-stone-800">
              <div className="flex justify-between"><span className="text-stone-400">WASD</span><span>Move</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Mouse</span><span>Look Around</span></div>
              <div className="flex justify-between"><span className="text-stone-400">E</span><span>Interact / Hide / Secret Shelf / Breaker</span></div>
              <div className="flex justify-between"><span className="text-stone-400">G</span><span>Scatter Sacred Vibhuti (Stun Villain 9s)</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Q</span><span>Throw Brass Decoy Lota (Lure Villain)</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Tab</span><span>Floor Blueprint Map &amp; 3 Escapes</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Shift</span><span>Sprint (Drains Stamina)</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Space</span><span>Jump Over Obstacles</span></div>
              <div className="flex justify-between"><span className="text-stone-400">C</span><span>Crouch (Quiet)</span></div>
              <div className="flex justify-between"><span className="text-stone-400">F / Right-Click</span><span>Toggle Flashlight</span></div>
              <div className="flex justify-between"><span className="text-stone-400">R</span><span>Use Spare Battery</span></div>
              <div className="flex justify-between"><span className="text-stone-400">M</span><span>Toggle Horror Song (On/Off)</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Esc</span><span>Pause</span></div>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="w-full py-2 bg-red-900 rounded text-white text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
