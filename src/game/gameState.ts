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
    text: 'The villagers whisper of a curse. Since the night of the total solar eclipse, an unspeakable presence stalks our haveli halls. My blood chills at every footstep outside my chamber door. I have locked the sanctuary with the brass key.',
  },
  diary2: {
    id: 'diary2',
    title: 'The Tantric Binding Seal',
    date: '2nd November 1924',
    text: 'To protect the family lineage, the sacred portrait of the Kalapur elders was bound with a warding mantra. If the frame is dislodged from the exit door, the spirit of the betrayed matriarch breaks free. The exit will remain sealed in darkness until the true frame is restored to its cradle.',
  },
  diary3: {
    id: 'diary3',
    title: 'The Cursed Tatya Puppet',
    date: 'Night of the Vanishing',
    text: 'A wandering tantrik brought a ventriloquist puppet into our house. They chanted the forbidden ritual: "Om Phat Swaha". The doll began to walk on its own! It hides in the upper sanctuary. Whatever you do, do not let Tatya Vinchu hear your footsteps...',
  },
  'haunted-well': {
    id: 'haunted-well',
    title: 'The Secrets of the Kalapur Kuan',
    date: 'Midnight Echoes',
    text: 'They say the original tantric talisman was cast into this bottomless stone well a century ago. On dark monsoon nights, ripples form on the water without any wind. The spirit and Tatya were bound together here. Only by placing the ancestor photo frame onto the foyer exit door can the haveli gate be unlocked!',
  },
};

export interface SaveData {
  hasPhotoFrame: boolean;
  hasBrassKey: boolean;
  hasAtticKey: boolean;
  batteries: number;
  flashlightBattery: number;
  currentObjective: string;
  framePlacedOnDoor: boolean;
  exitUnlocked: boolean;
  diariesRead: string[];
  playerPos: [number, number, number];
  playerRotY: number;
  timestamp: number;
  villainType?: 'tatya' | 'ghost';
  songEnabled?: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.9,
  mouseSensitivity: 1.0,
  graphicsQuality: 'high',
  showSubtitles: true,
  villainType: 'tatya',
  songEnabled: true,
};

const SAVE_KEY = 'kalapur_save_v1';
const SETTINGS_KEY = 'kalapur_settings_v1';

export class GameStateManager {
  // Settings
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

  // Inventory & Equipment
  public hasPhotoFrame = false;
  public hasBrassKey = false;
  public hasAtticKey = false;
  public hasGateKey = false; // Heavy Gate Padlock Key (found in bedroom drawer)
  public hasBoltCutters = false; // Wire/Bolt Cutters to cut chains (found in kitchen drawer)
  public hasCrowbar = false; // Heavy Steel Crowbar (pries storm cellar hatch)
  public hasTantricBell = false; // Sacred Tantric Bell (destroys demonic blood seal on underground tunnel)
  public cellarBarsPried = false;
  public cellarSealBroken = false;
  public cellarValveTurned = false;
  public cellarUnlocked = false;
  public escapeRouteTaken: 'gate' | 'cellar' | null = null;
  public batteries = 2;
  public flashlightBattery = 100;
  public flashlightOn = true;

  // Player physical state
  public stamina = 100;
  public isSprinting = false;
  public isCrouching = false;
  public isHiding: 'wardrobe' | 'underbed' | null = null;
  public currentHidingId: string | null = null;

  // Mobile / Touch controls for Android & Play Store
  public touchMove = { x: 0, z: 0 };
  public touchLook = { x: 0, y: 0 };
  public touchSprint = false;
  public onTouchInteract?: () => void;
  public onTouchFlashlight?: () => void;
  public isTouchDevice = false;

  // Puzzle & World progression (Multi-Lock Hard Escape)
  public currentObjective = 'Day 1: Search tables & drawers for tools to unlock the mansion exit.';
  public framePlacedOnDoor = false;
  public exitUnlocked = false;
  public gateChainsCut = false;
  public gatePadlockUnlocked = false;
  public gateUnlocked = false;
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
  public ghostDistance = 50; // meters
  public ghostState: 'patrol' | 'investigate' | 'search' | 'chase' = 'patrol';
  public ghostAlertLevel = 0; // 0 (calm) to 1 (full chase)
  public screenGlitchIntensity = 0;

  // UI notifications
  public subtitleText = '';
  public subtitleTimer: number | null = null;

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
      hasPhotoFrame: this.hasPhotoFrame,
      hasBrassKey: this.hasBrassKey,
      hasAtticKey: this.hasAtticKey,
      batteries: this.batteries,
      flashlightBattery: this.flashlightBattery,
      currentObjective: this.currentObjective,
      framePlacedOnDoor: this.framePlacedOnDoor,
      exitUnlocked: this.exitUnlocked,
      diariesRead: this.diariesRead,
      playerPos,
      playerRotY,
      timestamp: Date.now(),
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
      this.hasPhotoFrame = data.hasPhotoFrame;
      this.hasBrassKey = data.hasBrassKey;
      this.hasAtticKey = data.hasAtticKey;
      this.batteries = data.batteries;
      this.flashlightBattery = data.flashlightBattery;
      this.currentObjective = data.currentObjective;
      this.framePlacedOnDoor = data.framePlacedOnDoor;
      this.exitUnlocked = data.exitUnlocked;
      this.diariesRead = data.diariesRead || [];
      if (data.hasBrassKey) this.doorsUnlocked.masterBedroom = true;
      if (data.hasAtticKey) this.doorsUnlocked.attic = true;
      if (data.exitUnlocked) this.doorsUnlocked.exitDoor = true;
      this.checkpointPos = data.playerPos;
      this.checkpointRot = data.playerRotY;
      this.notify();
      return data;
    } catch (e) {
      console.warn('Load game failed:', e);
      return null;
    }
  }

  public advanceDay(): boolean {
    if (this.currentDay >= this.maxDays) {
      this.isGameOver = true;
      this.notify();
      return false; // Game Over
    }

    this.currentDay += 1;
    this.isDayTransitioning = true;
    this.dayTransitionText =
      this.currentDay === 4
        ? 'FINAL DAY (DAY 4)\nLAST CHANCE TO ESCAPE KALAPUR...'
        : `DAY ${this.currentDay}\nTHE CURSE GROWS STRONGER...`;

    this.flashlightBattery = Math.min(100, this.flashlightBattery + 45);
    this.showSubtitle(`Woke up... ${this.dayTransitionText.replace('\n', ' - ')}`, 4500);

    setTimeout(() => {
      this.isDayTransitioning = false;
      this.notify();
    }, 3200);

    this.notify();
    return true; // Still has days left
  }

  public resetGame() {
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
    this.cellarBarsPried = false;
    this.cellarSealBroken = false;
    this.cellarValveTurned = false;
    this.cellarUnlocked = false;
    this.escapeRouteTaken = null;
    this.batteries = 2;
    this.flashlightBattery = 100;
    this.flashlightOn = true;
    this.stamina = 100;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isHiding = null;
    this.currentHidingId = null;
    this.currentObjective = 'Day 1: Search tables & drawers for tools (Front Gate or Underground Catacombs).';
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
