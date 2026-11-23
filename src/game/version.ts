export const GAME_VERSION = '2.4.0';
export const GAME_BUILD_ID = '2026.11.22-pwa';
export const GAME_RELEASE_DATE = 'November 22, 2026';

export interface ReleaseChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const RELEASE_CHANGELOG: ReleaseChangelogItem[] = [
  {
    version: '2.4.0',
    date: 'Nov 22, 2026',
    title: 'Installable PWA Release & Sacred Puja Safe Zone',
    changes: [
      'Full Progressive Web App (PWA) installation with offline asset caching and standalone launch.',
      'Smooth camera damping & customizable Movement Sensitivity (0.50x – 1.80x).',
      'Puja Mantra Shrine ward keeps the roaming ghost outside the sacred sanctuary.',
      '60 FPS High & 50 FPS Low graphics presets with crisp room visibility.',
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
