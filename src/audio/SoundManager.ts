/**
 * Procedural Web Audio Engine for "THE CURSE OF KALAPUR"
 * Generates all Indian horror ambient drones, monsoon rain, thunder,
 * spatial footsteps, creaks, ghost whispers, heartbeat, and music cues.
 */

export type MusicMood = 'menu' | 'explore' | 'tense' | 'chase' | 'victory' | 'gameover' | 'none';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Ambient sound sources
  private rainNode: AudioBufferSourceNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;

  // Music state
  private currentMood: MusicMood = 'none';
  private droneOscs: OscillatorNode[] = [];
  private droneFilter: BiquadFilterNode | null = null;
  private musicTimer: number | null = null;

  // Authentic Count the Doors Horror Song Track
  private songAudio: HTMLAudioElement | null = null;
  public isSongEnabled = true;
  private songCurrentVol = 1.0;

  // Heartbeat state
  private heartbeatTimer: number | null = null;
  private heartbeatRate = 70; // BPM

  // Settings
  public masterVolume = 0.8;
  public musicVolume = 0.7;
  public sfxVolume = 0.9;
  public isMuted = false;

  private initialized = false;

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      this.startRainAndWind();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public setVolumes(master: number, music: number, sfx: number) {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : master, now);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(music, now);
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(sfx, now);

    if (this.songAudio) {
      this.songAudio.volume = this.isMuted || !this.isSongEnabled
        ? 0
        : Math.max(0, Math.min(1, master * music * this.songCurrentVol));
    }
  }

  // --- Rain and Wind Noise Generators ---
  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 3; // 3-second seamless loop buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation for rain & wind rumble
      lastOut = (lastOut * 0.95) + (white * 0.05);
      data[i] = lastOut * 3;
    }
    return buffer;
  }

  private startRainAndWind() {
    if (!this.ctx || !this.sfxGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    // Rain loop
    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = noiseBuffer;
    this.rainNode.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);
    this.rainNode.start();

    // Wind loop with LFO swell
    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.windNode.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);
    this.windNode.start();
  }

  public setRainIntensity(volume: number) {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume * 0.35)), this.ctx.currentTime, 0.5);
    }
  }

  // --- Thunder FX ---
  public playThunder(closeness: number = 0.5) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Deep sub boom
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.6);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.7 * closeness, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 2.3);

    // Crack noise
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(450 * closeness + 200, now);
      noiseFilter.frequency.linearRampToValueAtTime(100, now + 2.0);

      const crackGain = this.ctx.createGain();
      crackGain.gain.setValueAtTime(0.5 * closeness, now + 0.05);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noise.connect(noiseFilter);
      noiseFilter.connect(crackGain);
      crackGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 2.1);
    }
  }

  // --- Dynamic Indian Horror Drone & Music ---
  public setMusicMood(mood: MusicMood) {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    if (!this.ctx || !this.musicGain) return;

    this.stopDrone();

    if (mood === 'none') return;

    const now = this.ctx.currentTime;
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.connect(this.musicGain);

    if (mood === 'menu') {
      // Mystical, deep Indian drone (C2 + G2 + C# micro-dissonance)
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(380, now);
      this.createOscDrone([65.41, 98.0, 130.81, 69.3], 0.22);
      this.scheduleArpeggioNotes([130.81, 138.59, 155.56, 196.0, 246.94], 3500);
    } else if (mood === 'explore') {
      // Quiet, unsettling dark haveli ambience
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(280, now);
      this.createOscDrone([55.0, 82.41, 110.0, 58.27], 0.18);
      this.scheduleArpeggioNotes([110.0, 116.54, 130.81, 164.81], 5000);
    } else if (mood === 'tense') {
      // Ghost is nearby: rising tension, nervous metallic hum
      this.droneFilter.type = 'bandpass';
      this.droneFilter.frequency.setValueAtTime(450, now);
      this.droneFilter.Q.setValueAtTime(2.0, now);
      this.createOscDrone([73.42, 77.78, 146.83, 155.56], 0.35);
      this.playWhisper();
    } else if (mood === 'chase') {
      // Terrifying chase: dissonant cluster, thumping pulse
      this.droneFilter.type = 'peaking';
      this.droneFilter.frequency.setValueAtTime(600, now);
      this.createOscDrone([87.31, 92.5, 123.47, 185.0, 261.63], 0.5);
      this.startChaseRhythm();
    } else if (mood === 'victory') {
      // Melancholic, emotional Indian string drone
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(500, now);
      this.createOscDrone([65.41, 98.0, 130.81, 164.81, 196.0], 0.35);
    }
  }

  private createOscDrone(freqs: number[], masterAmp: number) {
    if (!this.ctx || !this.droneFilter) return;
    const now = this.ctx.currentTime;
    this.droneOscs = freqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for ominous phasing
      osc.detune.setValueAtTime((Math.random() - 0.5) * 14, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(masterAmp / freqs.length, now + 1.8);

      osc.connect(gain);
      gain.connect(this.droneFilter!);
      osc.start(now);
      return osc;
    });
  }

  private scheduleArpeggioNotes(notes: number[], intervalMs: number) {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || Math.random() > 0.6) return;
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.playIndianTanpuraPluck(note);
    }, intervalMs);
  }

  private startChaseRhythm() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    let step = 0;
    this.musicTimer = window.setInterval(() => {
      if (this.currentMood !== 'chase' || !this.ctx) return;
      this.playCreepyThud(step % 2 === 0 ? 0.7 : 0.4);
      step++;
    }, 280);
  }

  private stopDrone() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.droneOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.droneOscs = [];
  }

  // Pluck tone simulating sitar/tanpura harmonic resonance
  private playIndianTanpuraPluck(freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.99, now + 1.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 2.3);
  }

  // --- Sound Effects ---

  // Cinematic deep impact (for logo & intro)
  public playCinematicImpact() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 2.6);

    this.playNoiseSwoosh(1.2, 0.4);
  }

  public playNoiseSwoosh(duration = 1.0, volume = 0.3) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration + 0.1);
  }

  // Footstep (wood / stone)
  public playFootstep(isSprinting = false, pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isSprinting ? 95 : 75, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.28 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // Subtle wood floor creak on some footsteps
    if (Math.random() > 0.6) {
      this.playWoodCreak(0.08, pan);
    }
  }

  // Ghost Footstep (heavier, dragging, with spatial pan)
  public playGhostStep(pan = 0, distanceFactor = 1) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const volume = Math.max(0.02, Math.min(0.4, 0.4 * (1 - distanceFactor)));

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Wooden floor creak
  public playWoodCreak(volume = 0.2, pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Door opening / closing creak
  public playDoorSound(open = true) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = open ? 180 : 350;
    const endFreq = open ? 380 : 120;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.7);

    // Thud when door latches
    setTimeout(() => {
      this.playCreepyThud(0.3);
    }, 550);
  }

  public playCreepyThud(volume = 0.3) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Flashlight click
  public playFlashlightClick(turnOn = true) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(turnOn ? 1400 : 900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Key pickup / inventory jingle
  public playItemPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [659.25, 880.0, 1174.66].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.32);
    });
  }

  // Photo Frame Placement & Mystery Solve Sting
  public playFramePlacement() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy stone click
    this.playCreepyThud(0.6);

    // Mystical resonant bell chime
    [261.63, 392.0, 523.25, 622.25, 783.99].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 2.0);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 2.2);
    });
  }

  // Heavy lock opening mechanism
  public playHeavyLockUnlock() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metallic ratchet & clunk
    [180, 240, 120, 80].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.12);
    });
  }

  // Heavy brass padlock snapping open sound
  public playPadlockUnlockSound() {
    this.playHeavyLockUnlock();
    this.playCreepyThud(0.8);
  }

  // --- Authentic User-Uploaded Horror Song Track ("Count the Doors") ---
  private tatyaSubDrone: OscillatorNode[] = [];

  public startSongTrack() {
    this.init();
    if (!this.isSongEnabled) {
      return;
    }

    // Start procedural demonic sub-bass dread drone (38Hz + 57Hz tritone)
    if (this.ctx && this.musicGain && this.tatyaSubDrone.length === 0) {
      const now = this.ctx.currentTime;
      [38, 57].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(110, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(now);
        this.tatyaSubDrone.push(osc);
      });
    }

    if (this.songAudio) {
      if (this.songAudio.paused) {
        this.songAudio.volume = this.isMuted || !this.isSongEnabled
          ? 0
          : Math.max(0, Math.min(1, this.masterVolume * this.musicVolume * this.songCurrentVol));
        this.songAudio.play().catch(() => {});
      }
      return;
    }

    try {
      this.songAudio = new Audio('./assets/aistudio/Count_the_Doors_e8e142b1.mp3');
      this.songAudio.loop = true;
      this.songAudio.volume = this.isMuted || !this.isSongEnabled
        ? 0
        : Math.max(0, Math.min(1, this.masterVolume * this.musicVolume * this.songCurrentVol));
      this.songAudio.play().catch(() => {
        // Autoplay policy fallback: resume upon first user interaction
        const resumeOnFirstGesture = () => {
          if (this.isSongEnabled && this.songAudio && this.songAudio.paused) {
            this.songAudio.play().catch(() => {});
          }
          window.removeEventListener('click', resumeOnFirstGesture);
          window.removeEventListener('keydown', resumeOnFirstGesture);
          window.removeEventListener('touchstart', resumeOnFirstGesture);
        };
        window.addEventListener('click', resumeOnFirstGesture);
        window.addEventListener('keydown', resumeOnFirstGesture);
        window.addEventListener('touchstart', resumeOnFirstGesture);
      });
    } catch (e) {
      console.warn('Failed to load Count the Doors horror song track:', e);
    }
  }

  public stopSongTrack() {
    this.tatyaSubDrone.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.tatyaSubDrone = [];

    if (this.songAudio) {
      this.songAudio.pause();
      this.songAudio.currentTime = 0;
    }
  }

  public pauseSongTrack() {
    if (this.songAudio) {
      this.songAudio.pause();
    }
  }

  public toggleSong(): boolean {
    this.isSongEnabled = !this.isSongEnabled;
    if (!this.isSongEnabled) {
      this.pauseSongTrack();
    } else {
      this.startSongTrack();
      if (this.songAudio) {
        this.songAudio.volume = this.isMuted ? 0 : Math.max(0, Math.min(1, this.masterVolume * this.musicVolume * this.songCurrentVol));
        this.songAudio.play().catch(() => {});
      }
    }
    return this.isSongEnabled;
  }

  public setSongTrackVolume(vol: number) {
    this.songCurrentVol = vol;
    if (this.songAudio) {
      this.songAudio.volume = this.isMuted || !this.isSongEnabled
        ? 0
        : Math.max(0, Math.min(1, vol * this.masterVolume * this.musicVolume));
    }
  }

  // Backwards compatibility aliases
  public startTatyaTrack() {
    this.startSongTrack();
  }

  public stopTatyaTrack() {
    this.stopSongTrack();
  }

  public setTatyaTrackVolume(vol: number) {
    this.setSongTrackVolume(vol);
  }

  // --- Authentic Original Tatya Vinchu Voice Chant ("Om Bhag Bhuge...") ---
  private tatyaVoiceAudio: HTMLAudioElement | null = null;
  private lastTatyaVoiceTime = 0;

  public playTatyaVoiceChant(distanceFactor = 0, force = false) {
    if (this.isMuted) return;
    const now = Date.now();
    // Prevent overlapping sound spam unless forced (e.g. on chase / spot)
    if (!force && now - this.lastTatyaVoiceTime < 11000) return;
    this.lastTatyaVoiceTime = now;

    try {
      if (!this.tatyaVoiceAudio) {
        this.tatyaVoiceAudio = new Audio('./assets/aistudio/Untitled_c0ca65a3.mp3');
      }
      // Calculate spatial loudness (closer = louder, 0 distanceFactor = full 1.0)
      const volume = Math.max(0.15, Math.min(1.0, (1 - distanceFactor) * 1.2));
      this.tatyaVoiceAudio.volume = Math.max(0, Math.min(1, volume * this.masterVolume * this.sfxVolume));
      this.tatyaVoiceAudio.currentTime = 0;
      this.tatyaVoiceAudio.play().catch(() => {});
    } catch (e) {
      console.warn('Failed to play Tatya voice chant:', e);
    }
  }

  public stopTatyaVoiceChant() {
    if (this.tatyaVoiceAudio) {
      this.tatyaVoiceAudio.pause();
      this.tatyaVoiceAudio.currentTime = 0;
    }
  }

  // Sliding wooden drawer opening/closing sound
  public playDrawerSound(opening = true) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(opening ? 85 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(opening ? 140 : 75, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);

    this.playWoodCreak(0.18);
  }

  // Chain cutting sound (heavy bolt cutter snap)
  public playChainCutSound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [600, 1100, 1850, 2600].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.35);
    });

    this.playCreepyThud(0.7);
  }

  // Heavy steel crowbar prying metal hatch
  public playCrowbarPrySound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metal groaning screeches
    [320, 580, 890, 1420].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.3);

      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.48);
    });
    this.playCreepyThud(0.8);
  }

  // Tantric Blood Seal Shatter (Mystic bell + energy discharge)
  public playTantricSealBreak() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Resonant Indian temple bell chime
    [220, 440, 660, 880, 1320, 1760].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 2.5);
    });

    // Magical shatter whoosh
    this.playNoiseSwoosh(0.8, 0.4);
  }

  // Underground Sluice / Floodgate Valve Wheel Turn
  public playValveTurnSound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Grinding gears
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + i * 35, now + i * 0.09);
      osc.frequency.linearRampToValueAtTime(90, now + i * 0.09 + 0.08);

      gain.gain.setValueAtTime(0.25, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.1);
    }
  }

  // Grand Victory Celebration Audio (Majestic Indian celebratory chimes & horns)
  public playVictoryCelebration() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Stop intense chase drone
    this.stopDrone();
    this.stopTatyaTrack();

    const victoryChords = [
      [261.63, 329.63, 392.0, 523.25], // C major
      [293.66, 369.99, 440.0, 587.33], // D major
      [329.63, 415.30, 493.88, 659.25], // E major
      [392.0, 493.88, 587.33, 783.99], // G major
    ];

    victoryChords.forEach((chord, step) => {
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const time = now + step * 0.9;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + 2.0);
      });
    });
  }

  // Interactive Running Water Tap
  private tapNoiseNode: AudioBufferSourceNode | null = null;
  private tapGainNode: GainNode | null = null;

  public playWaterTap(running: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metal valve turn squeak
    const squeak = this.ctx.createOscillator();
    const squeakGain = this.ctx.createGain();
    squeak.type = 'sawtooth';
    squeak.frequency.setValueAtTime(running ? 650 : 850, now);
    squeak.frequency.exponentialRampToValueAtTime(running ? 850 : 450, now + 0.08);
    squeakGain.gain.setValueAtTime(0.12, now);
    squeakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    squeak.connect(squeakGain);
    squeakGain.connect(this.sfxGain);
    squeak.start(now);
    squeak.stop(now + 0.11);

    if (running) {
      if (!this.tapNoiseNode) {
        // Continuous filtered water gush noise
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        }

        this.tapNoiseNode = this.ctx.createBufferSource();
        this.tapNoiseNode.buffer = buffer;
        this.tapNoiseNode.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(1.8, now);

        this.tapGainNode = this.ctx.createGain();
        this.tapGainNode.gain.setValueAtTime(0.01, now);
        this.tapGainNode.gain.linearRampToValueAtTime(0.25, now + 0.2);

        this.tapNoiseNode.connect(filter);
        filter.connect(this.tapGainNode);
        this.tapGainNode.connect(this.sfxGain);
        this.tapNoiseNode.start(now);
      }
    } else {
      if (this.tapGainNode && this.tapNoiseNode) {
        this.tapGainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
        setTimeout(() => {
          try {
            this.tapNoiseNode?.stop();
            this.tapNoiseNode?.disconnect();
          } catch {
            // ignore
          }
          this.tapNoiseNode = null;
          this.tapGainNode = null;
        }, 180);
      }
      this.playWaterDrip();
    }
  }

  // Water droplet drip sound
  public playWaterDrip(pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'sine';
    const startFreq = 1600 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Interactive Light Switch Click
  public playLightSwitch(turningOn = true) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(turningOn ? 1800 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.035);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Grandfather Clock Tick-Tock
  private isClockTickAlt = false;
  public playClockTick(pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.isClockTickAlt = !this.isClockTickAlt;
    const freq = this.isClockTickAlt ? 580 : 440;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + 0.055);
  }

  // Whisper voice simulation
  public playWhisper() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(6.0, now);
    filter.frequency.linearRampToValueAtTime(1100, now + 0.8);
    filter.frequency.linearRampToValueAtTime(700, now + 1.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 1.9);
  }

  // Chilling Indian puppet laugh / giggle
  public playPuppetGiggle(pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

    const gigglePitches = [480, 560, 640, 520, 680, 440, 600, 720];
    gigglePitches.forEach((pitch, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = now + i * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.3, time + 0.07);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.08);
    });
  }

  // Whispered Tantric Curse ("Om Phat Swaha")
  public playTantricWhisper(pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(8.0, now);
    filter.frequency.linearRampToValueAtTime(650, now + 0.5);
    filter.frequency.linearRampToValueAtTime(1400, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 2.1);
  }

  // Terrifying sudden kitchen crash (falling brass thali/plates)
  public playKitchenCrash() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metallic high clang
    [780, 1120, 1680, 2400].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.6);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.9);
    });

    // Sub floor impact
    this.playCreepyThud(0.8);
  }

  // Blood-curdling dissonant violin shriek
  public playViolinShriek() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [1174, 1244, 1318, 1760, 2093].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f + (Math.random() - 0.5) * 80, now + 0.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  // Sudden heavy door slam
  public playDoorSlam(pan = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    this.playCreepyThud(1.0);
    this.playWoodCreak(0.4);
  }

  // Ghost detection scream / jumpscare sting
  public playJumpscare() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High shriek cluster
    [850, 910, 1150, 1420].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 1.2);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.4);
    });

    // Sub smash
    this.playCinematicImpact();
    this.playViolinShriek();
  }

  // Terrifying puppet alert screech (triggered the moment Tatya spots the player)
  public playPuppetScreech() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High dissonant harmonic screech
    [1180, 1260, 1420, 1850].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.25, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.9);
    });

    this.playPuppetGiggle(0);
  }

  // The ultimate Tatya Curse Death Strike (locks eyes and curses the player down)
  public playTatyaCurseStrike() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Infrasound sub boom (shaking chest impact)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 2.2);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 2.6);

    // Multi-voice screech cluster
    [740, 784, 987, 1046, 1318, 1568, 2093].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.15, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, now + 1.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.55 / 7, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 2.1);
    });

    this.playViolinShriek();
    this.playNoiseSwoosh(1.8, 0.6);
  }

  // Dynamic Heartbeat System
  public setHeartbeatRate(bpm: number, active = true) {
    this.heartbeatRate = bpm;
    if (!active) {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      return;
    }

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    const intervalMs = (60 / this.heartbeatRate) * 1000;
    this.heartbeatTimer = window.setInterval(() => {
      this.triggerHeartbeatPulse();
    }, intervalMs);
  }

  private triggerHeartbeatPulse() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // First thump (lub)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Second thump (dub)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55, now + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(25, now + 0.24);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.28, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.28);
  }

  // Enter/Exit hiding spot (wardrobe/bed creak)
  public playHidingAction(entering: boolean) {
    this.playWoodCreak(0.25);
    setTimeout(() => {
      this.playCreepyThud(0.2);
    }, 180);
  }

  // Brass Decoy Lota / Bell impact clang to lure Tatya/Ghost
  public playDecoyThrowClang() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [980, 1460, 2180, 2940].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.85);
      gain.gain.setValueAtTime(0.28 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.0);
    });
    this.playCreepyThud(0.35);
  }

  // Power Outage Breaker Trip (Electrical buzz down + sub hum drop)
  public playBreakerOutage() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.05);
    this.playLightSwitch(false);
  }

  // Breaker Restored Clunk + Electrical Surge Hum
  public playBreakerRestore() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playHeavyLockUnlock();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);
    gain.gain.setValueAtTime(0.01, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now + 0.05);
    osc.stop(now + 0.65);
  }

  // 1954 Sedan Engine Crank & Roar
  public playCarIgnitionRoar() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Starter cranking pulses
    for (let i = 0; i < 3; i++) {
      const crank = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      crank.type = 'sawtooth';
      const t = now + i * 0.22;
      crank.frequency.setValueAtTime(85, t);
      crank.frequency.linearRampToValueAtTime(135, t + 0.15);
      cGain.gain.setValueAtTime(0.25, t);
      cGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      crank.connect(cGain);
      cGain.connect(this.sfxGain);
      crank.start(t);
      crank.stop(t + 0.21);
    }
    // Engine roar catch
    const roar = this.ctx.createOscillator();
    const rFilter = this.ctx.createBiquadFilter();
    const rGain = this.ctx.createGain();
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(62, now + 0.66);
    roar.frequency.linearRampToValueAtTime(145, now + 1.3);
    roar.frequency.linearRampToValueAtTime(95, now + 2.2);
    rFilter.type = 'lowpass';
    rFilter.frequency.setValueAtTime(420, now + 0.66);
    rGain.gain.setValueAtTime(0.01, now + 0.66);
    rGain.gain.linearRampToValueAtTime(0.5, now + 0.85);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);
    roar.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(this.sfxGain);
    roar.start(now + 0.66);
    roar.stop(now + 2.4);
  }

  // Subterranean Boat Oar Water Splash
  public playBoatOarSplash() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.7);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 0.9);
  }

  // Secret Bookshelf Stone Grind
  public playSecretPassageGrind() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.linearRampToValueAtTime(48, now + 1.1);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.25);
    this.playNoiseSwoosh(1.0, 0.25);
  }

  public dispose() {
    this.stopDrone();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const soundManager = new SoundManager();
