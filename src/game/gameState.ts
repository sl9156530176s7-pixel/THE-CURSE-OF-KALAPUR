/**
 * Game state management for "THE CURSE OF KALAPUR"
 * Handles inventory, objectives, doors, hiding state, diary notes, settings, and save/continue.
 */

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  showSubtitles: boolean;
  villainType: 'tatya' | 'ghost';
  songEnabled: boolean;
  difficulty: 'normal' | 'nightmare' | 'hardcore';
  cameraHeadBob: boolean;
}

export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  text: string;
}

export const DIARY_LORE: Record<string, DiaryEntry> = {
  diary1: {
    id: 'diary1',
    title: 'The Zamindar\'s Final Journal',
    date: '14th October 1924',
    text: 'The villagers whisper of a curse. Three ways out exist: restore the Ancestor Portrait & unchain the Front Gate, fuel & wire the 1954 Sedan in the East Courtyard Garage, or descend beneath the Storage Wing to the Flooded River Crypt!',
  },
  diary2: {
    id: 'diary2',
    title: 'Secret Library Archive',
    date: '2nd November 1924',
    text: 'Behind the tall mahogany bookshelf in the Upper Library hides a revolving stone shortcut directly into the Mystic Sanctum. Use Brass Decoy Lotas [Q] to lure Tatya Vinchu away before opening locks!',
  },
  diary3: {
    id: 'diary3',
    title: 'The Cursed Tatya Puppet',
    date: 'Night of the Vanishing',
    text: 'Tatya Vinchu cuts the Main Power Breaker box in the Grand Foyer when angered, plunging the haveli into pitch darkness. Keep spare batteries ready and watch the shadowed corners.',
  },
  'haunted-well': {
    id: 'haunted-well',
    title: 'The Secrets of the Kalapur Kuan',
    date: 'Midnight Echoes',
    text: 'Beneath this monsoon courtyard runs an underground river tied to the ancient crypt dock. Pry the iron sluice bars with a Crowbar, dispel the blood ward with the Sacred Bell, and row out with Wooden Oars!',
  },
};

export interface SaveData {
  currentDay?: number;
  hasPhotoFrame: boolean;
  hasBrassKey: boolean;
  hasAtticKey: boolean;
  hasGateKey?: boolean;
  hasBoltCutters?: boolean;
  hasCrowbar?: boolean;
  hasTantricBell?: boolean;
  hasFuelCan?: boolean;
  hasCarBattery?: boolean;
  hasCarKey?: boolean;
  hasBoatOars?: boolean;
  carFueled?: boolean;
  carBatteryInstalled?: boolean;
  secretPassageOpen?: boolean;
  breakerPowerOn?: boolean;
  decoys?: number;
  batteries: number;
  flashlightBattery: number;
  currentObjective: string;
  framePlacedOnDoor: boolean;
  exitUnlocked: boolean;
  gateChainsCut?: boolean;
  gatePadlockUnlocked?: boolean;
  cellarBarsPried?: boolean;
  cellarSealBroken?: boolean;
  diariesRead: string[];
  playerPos: [number, number, number];
  playerRotY: number;
  timestamp: number;
  villainType?: 'tatya' | 'ghost';
  songEnabled?: boolean;
  difficulty?: 'normal' | 'nightmare' | 'hardcore';
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.9,
  mouseSensitivity: 0.85,
  graphicsQuality: 'high',
  showSubtitles: true,
  villainType: 'tatya',
  songEnabled: true,
  difficulty: 'normal',
  cameraHeadBob: false,
};

const SAVE_KEY = 'kalapur_save_v2';
const SETTINGS_KEY = 'kalapur_settings_v2';

export function getZoneName(x: number, y: number, z: number): string {
  if (y < -0.8) {
    if (z < -13) return 'River Crypt Boat Dock';
    return 'Underground River Crypt';
  }
  if (y >= 2.25) {
    if (z < -8 && x >= -8.5) return 'Mystic Ritual Sanctum';
    if (z < -8 && x < -8.5) return 'Secret Archive Passage';
    if (x > 3.8 && z >= 0) return 'Master Bedchamber';
    if (x > 3.8 && z < 0) return 'Cursed Doll Nursery';
    if (x < -3.8 && z >= 0) return 'Guest Bedchamber';
    if (x < -3.8 && z < 0) return 'Haunted Library';
    return 'Upper Mezzanine Gallery';
  }
  if (x >= 11.5 && z >= 16.5) return 'East Courtyard Garage';
  if (z >= 17) return 'Monsoon Courtyard';
  if (x > 5.8 && z >= 10.5) return 'Puja Prayer Shrine';
  if (x > 5.8 && z >= 1.5) return 'Living Baithak';
  if (x > 5.8 && z < 1.5) return 'Grand Dining Hall';
  if (x < -5.8 && z >= 5.0) return 'Haunted Kitchen';
  if (x < -5.8 && z < 5.0) return 'Storage & Crypt Stairs';
  return 'Grand Marble Foyer';
}

export class GameStateManager {
  public settings: GameSettings = DEFAULT_SETTINGS;
  public villainType: 'tatya' | 'ghost' = 'tatya';

  // 4-Day Escape System
  public currentDay = 1;
  public maxDays = 4;
  public isDayTransitioning = false;
  public dayTransitionText = 'DAY 1';
  public isGameOver = false;
  public isVictory = false;
  public gameStartTime = Date.now();
  public escapeTimeSeconds = 0;

  // Escape Route 1: Front Courtyard Gate
  public hasPhotoFrame = false;
  public hasBrassKey = false;
  public hasAtticKey = false;
  public hasGateKey = false;
  public hasBoltCutters = false;
  public framePlacedOnDoor = false;
  public exitUnlocked = false;
  public gateChainsCut = false;
  public gatePadlockUnlocked = false;
  public gateUnlocked = false;

  // Escape Route 2: Underground River Boat (Crypt Y = -3)
  public hasCrowbar = false;
  public hasTantricBell = false;
  public hasBoatOars = false;
  public cellarBarsPried = false;
  public cellarSealBroken = false;
  public cellarValveTurned = false;
  public cellarUnlocked = false;

  // Escape Route 3: East Courtyard Garage 1954 Sedan Car
  public hasFuelCan = false;
  public hasCarBattery = false;
  public hasCarKey = false;
  public carFueled = false;
  public carBatteryInstalled = false;
  public carStarted = false;

  public escapeRouteTaken: 'gate' | 'cellar' | 'car' | null = null;

  // Equipment, Decoys & Power Breaker
  public batteries = 2;
  public flashlightBattery = 100;
  public flashlightOn = true;
  public decoys = 2;
  public maxDecoys = 5;
  public breakerPowerOn = true;
  public secretPassageOpen = false;
  public showBlueprintMap = false;

  // Player physical state
  public stamina = 100;
  public isSprinting = false;
  public isCrouching = false;
  public isHiding: 'wardrobe' | 'underbed' | null = null;
  public currentHidingId: string | null = null;

  // Mobile / Touch controls for Android & Horizontal Play
  public touchMove = { x: 0, z: 0 };
  public touchLook = { x: 0, y: 0 };
  public touchSprint = false;
  public onTouchInteract?: () => void;
  public onTouchFlashlight?: () => void;
  public onTouchUseBattery?: () => void;
  public onTouchThrowDecoy?: () => void;
  public isTouchDevice = false;

  // Puzzle & World progression
  public currentObjective = 'Escape via Front Gate, Garage Car, or Underground River Boat. Check drawers & rooms!';
  public doorsUnlocked: Record<string, boolean> = {
    masterBedroom: false,
    attic: false,
    exitDoor: false,
  };
  public doorsOpen: Record<string, boolean> = {};
  public drawersOpen: Record<string, boolean> = {};
  public diariesRead: string[] = [];
  public activeDiaryNote: DiaryEntry | null = null;

  // Ghost proximity & AI observation
  public ghostDistance = 50;
  public ghostState: 'patrol' | 'investigate' | 'search' | 'chase' = 'patrol';
  public ghostAlertLevel = 0;
  public screenGlitchIntensity = 0;

  // UI notifications
  public subtitleText = '';
  public subtitleTimer: number | null = null;
  public dayTransitionTimer: number | null = null;

  // Checkpoint coordinate
  public checkpointPos: [number, number, number] = [0, 1.6, 12];
  public checkpointRot = 0;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public notify() {
    this.listeners.forEach((cb) => cb());
  }

  public loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  public saveSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
    this.notify();
  }

  public toggleSong(): boolean {
    const nextState = !this.settings.songEnabled;
    this.saveSettings({ songEnabled: nextState });
    return nextState;
  }

  public hasSave(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  public saveGame(playerPos: [number, number, number], playerRotY: number) {
    const data: SaveData = {
      currentDay: this.currentDay,
      hasPhotoFrame: this.hasPhotoFrame,
      hasBrassKey: this.hasBrassKey,
      hasAtticKey: this.hasAtticKey,
      hasGateKey: this.hasGateKey,
      hasBoltCutters: this.hasBoltCutters,
      hasCrowbar: this.hasCrowbar,
      hasTantricBell: this.hasTantricBell,
      hasFuelCan: this.hasFuelCan,
      hasCarBattery: this.hasCarBattery,
      hasCarKey: this.hasCarKey,
      hasBoatOars: this.hasBoatOars,
      carFueled: this.carFueled,
      carBatteryInstalled: this.carBatteryInstalled,
      secretPassageOpen: this.secretPassageOpen,
      breakerPowerOn: this.breakerPowerOn,
      decoys: this.decoys,
      batteries: this.batteries,
      flashlightBattery: this.flashlightBattery,
      currentObjective: this.currentObjective,
      framePlacedOnDoor: this.framePlacedOnDoor,
      exitUnlocked: this.exitUnlocked,
      gateChainsCut: this.gateChainsCut,
      gatePadlockUnlocked: this.gatePadlockUnlocked,
      cellarBarsPried: this.cellarBarsPried,
      cellarSealBroken: this.cellarSealBroken,
      diariesRead: this.diariesRead,
      playerPos,
      playerRotY,
      timestamp: Date.now(),
      villainType: this.settings.villainType,
      songEnabled: this.settings.songEnabled,
      difficulty: this.settings.difficulty,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      this.showSubtitle('Game progress saved at checkpoint.');
    } catch (e) {
      console.warn('Save game failed:', e);
    }
  }

  public loadGame(): SaveData | null {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (!stored) return null;
      const data: SaveData = JSON.parse(stored);
      this.resetGame();
      this.currentDay = data.currentDay || 1;
      this.hasPhotoFrame = !!data.hasPhotoFrame;
      this.hasBrassKey = !!data.hasBrassKey;
      this.hasAtticKey = !!data.hasAtticKey;
      this.hasGateKey = !!data.hasGateKey;
      this.hasBoltCutters = !!data.hasBoltCutters;
      this.hasCrowbar = !!data.hasCrowbar;
      this.hasTantricBell = !!data.hasTantricBell;
      this.hasFuelCan = !!data.hasFuelCan;
      this.hasCarBattery = !!data.hasCarBattery;
      this.hasCarKey = !!data.hasCarKey;
      this.hasBoatOars = !!data.hasBoatOars;
      this.carFueled = !!data.carFueled;
      this.carBatteryInstalled = !!data.carBatteryInstalled;
      this.secretPassageOpen = !!data.secretPassageOpen;
      this.breakerPowerOn = data.breakerPowerOn !== undefined ? !!data.breakerPowerOn : true;
      this.decoys = typeof data.decoys === 'number' ? data.decoys : 2;
      this.batteries = typeof data.batteries === 'number' ? data.batteries : 2;
      this.flashlightBattery = typeof data.flashlightBattery === 'number' ? data.flashlightBattery : 100;
      this.currentObjective = data.currentObjective || this.currentObjective;
      this.framePlacedOnDoor = !!data.framePlacedOnDoor;
      this.exitUnlocked = !!data.exitUnlocked;
      this.gateChainsCut = !!data.gateChainsCut;
      this.gatePadlockUnlocked = !!data.gatePadlockUnlocked;
      this.cellarBarsPried = !!data.cellarBarsPried;
      this.cellarSealBroken = !!data.cellarSealBroken;
      this.diariesRead = data.diariesRead || [];
      if (this.hasBrassKey) this.doorsUnlocked.masterBedroom = true;
      if (this.hasAtticKey) this.doorsUnlocked.attic = true;
      if (this.exitUnlocked) this.doorsUnlocked.exitDoor = true;
      if (data.difficulty) {
        this.settings.difficulty = data.difficulty;
      }
      this.checkpointPos = Array.isArray(data.playerPos) ? data.playerPos : [0, 1.6, 12];
      this.checkpointRot = typeof data.playerRotY === 'number' ? data.playerRotY : 0;
      this.notify();
      return data;
    } catch (e) {
      console.warn('Load game failed:', e);
      return null;
    }
  }

  public useSpareBattery(): boolean {
    if (this.batteries <= 0 || this.flashlightBattery >= 95) {
      return false;
    }
    this.batteries -= 1;
    this.flashlightBattery = 100;
    this.flashlightOn = true;
    this.notify();
    return true;
  }

  public advanceDay(): boolean {
    if (this.currentDay >= this.maxDays) {
      this.isGameOver = true;
      this.notify();
      return false;
    }

    this.currentDay += 1;
    this.isDayTransitioning = true;
    this.dayTransitionText =
      this.currentDay === 4
        ? 'FINAL DAY (DAY 4)\nLAST CHANCE TO ESCAPE KALAPUR...'
        : `DAY ${this.currentDay}\nTHE CURSE GROWS STRONGER...`;

    this.flashlightBattery = Math.min(100, this.flashlightBattery + 45);
    this.showSubtitle(`Woke up... ${this.dayTransitionText.replace('\n', ' - ')}`, 4500);

    if (this.dayTransitionTimer) {
      clearTimeout(this.dayTransitionTimer);
    }
    this.dayTransitionTimer = window.setTimeout(() => {
      this.dayTransitionTimer = null;
      this.isDayTransitioning = false;
      this.notify();
    }, 3200);

    this.notify();
    return true;
  }

  public resetGame() {
    if (this.dayTransitionTimer) {
      clearTimeout(this.dayTransitionTimer);
      this.dayTransitionTimer = null;
    }
    this.currentDay = 1;
    this.isDayTransitioning = false;
    this.dayTransitionText = 'DAY 1';
    this.isGameOver = false;
    this.isVictory = false;
    this.gameStartTime = Date.now();
    this.escapeTimeSeconds = 0;

    this.hasPhotoFrame = false;
    this.hasBrassKey = false;
    this.hasAtticKey = false;
    this.hasGateKey = false;
    this.hasBoltCutters = false;
    this.hasCrowbar = false;
    this.hasTantricBell = false;
    this.hasBoatOars = false;
    this.hasFuelCan = false;
    this.hasCarBattery = false;
    this.hasCarKey = false;
    this.carFueled = false;
    this.carBatteryInstalled = false;
    this.carStarted = false;

    this.cellarBarsPried = false;
    this.cellarSealBroken = false;
    this.cellarValveTurned = false;
    this.cellarUnlocked = false;
    this.escapeRouteTaken = null;

    this.batteries = 2;
    this.flashlightBattery = 100;
    this.flashlightOn = true;
    this.decoys = 2;
    this.breakerPowerOn = true;
    this.secretPassageOpen = false;
    this.showBlueprintMap = false;

    this.stamina = 100;
    this.isSprinting = false;
    this.isCrouching = false;
    this.touchSprint = false;
    this.touchMove = { x: 0, z: 0 };
    this.touchLook = { x: 0, y: 0 };
    this.isHiding = null;
    this.currentHidingId = null;

    this.currentObjective = 'Day 1: Search the haveli for tools! 3 Escapes: Front Gate, Garage Car, or River Crypt Boat.';
    this.framePlacedOnDoor = false;
    this.exitUnlocked = false;
    this.gateChainsCut = false;
    this.gatePadlockUnlocked = false;
    this.gateUnlocked = false;
    this.doorsUnlocked = {
      masterBedroom: false,
      attic: false,
      exitDoor: false,
    };
    this.doorsOpen = {};
    this.drawersOpen = {};
    this.diariesRead = [];
    this.activeDiaryNote = null;
    this.ghostDistance = 50;
    this.ghostState = 'patrol';
    this.ghostAlertLevel = 0;
    this.screenGlitchIntensity = 0;
    this.checkpointPos = [0, 1.6, 12];
    this.checkpointRot = 0;
    this.notify();
  }

  public showSubtitle(text: string, durationMs = 3800) {
    if (!this.settings.showSubtitles) return;
    this.subtitleText = text;
    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    this.subtitleTimer = window.setTimeout(() => {
      this.subtitleText = '';
      this.notify();
    }, durationMs);
    this.notify();
  }

  public setObjective(obj: string) {
    this.currentObjective = obj;
    this.showSubtitle(`Objective Updated: ${obj}`, 4500);
    this.notify();
  }
}

export const gameState = new GameStateManager();
