export const GAME_VERSION = '2.6.0';
export const GAME_BUILD_ID = '2026.11.23-modes-owner';
export const GAME_RELEASE_DATE = 'November 23, 2026';

export interface ReleaseChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const RELEASE_CHANGELOG: ReleaseChangelogItem[] = [
  {
    version: '2.6.0',
    date: 'Nov 23, 2026',
    title: 'Dark & Light Modes + Verified Owner Dashboard',
    changes: [
      'Added 2 distinct Lighting Modes selectable in Main Menu & Pause Menu: Dark Mode (zero room light — Flashlight only) and Light Mode (all haveli lights ON with zero darkness).',
      'Added verified-owner Firebase Studio Dashboard showing real downloader platforms, browsers, install counts, and synced Rate Us player feedback.',
    ],
  },
  {
    version: '2.5.0',
    date: 'Nov 23, 2026',
    title: '90 FPS Ultra-Smooth Performance Engine & Player Ratings',
    changes: [
      'New default 90 FPS Smooth preset optimized for Android phones and 90Hz/120Hz displays.',
      'Fixed 4-slot pooled room lighting removes shader compilation stutters when walking between rooms.',
      'Spatial floor collider bucketing & frozen static architecture matrices cut CPU frame time by ~3x.',
      'Zero-shadow-pass mobile fast path keeps rooms clear and atmospheric without double GPU rendering.',
      'Added interactive Rate Us player feedback dialog across the studio website and game menu.',
    ],
  },
  {
    version: '2.4.0',
    date: 'Nov 22, 2026',
    title: 'Installable PWA Release & Sacred Puja Safe Zone',
    changes: [
      'Full Progressive Web App (PWA) installation with offline asset caching and standalone launch.',
      'Smooth camera damping & customizable Movement Sensitivity (0.50x – 1.80x).',
      'Puja Mantra Shrine ward keeps the roaming ghost outside the sacred sanctuary.',
      'Lag-free cinematic intro, unlocked Mystic Sanctum door, and detailed 3D keys & tools.',
    ],
  },
  {
    version: '2.3.0',
    date: 'Earlier Update',
    title: 'Dual-Villain Horror & 4-Floor Kalapur Haveli',
    changes: [
      'Added Tatya Vinchu doll and Kalapur Ghost selectable antagonists.',
      'Three distinct escape paths: Main Grand Door, Basement Garage Car, and Subterranean River Boat.',
      'Dynamic room randomization across 4 floors plus checkpoint save/continue system.',
    ],
  },
];
