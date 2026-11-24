import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildKalapurHouse, getFloorColliders, getMansionFloorHeight, HouseData, InteractiveObject } from '../game/houseGeometry';
import { PlayerController } from '../game/player';
import { KalapurGhost } from '../game/ghost';
import { soundManager } from '../audio/SoundManager';
import { gameState } from '../game/gameState';

interface GameCanvasProps {
  mode: 'menu' | 'playing' | 'ending';
  sessionKey: number;
  isContinueSession: boolean;
  onCatchPlayer: () => void;
  onInteractiveChange: (interactive: InteractiveObject | null) => void;
  onSaveProgress: () => void;
}

const CLOCK_1_POS = new THREE.Vector3(18.5, 1.4, 4.5);
const CLOCK_2_POS = new THREE.Vector3(-3.2, 5.5, 2.5);
const GF_BATH_POS = new THREE.Vector3(-16.5, 1.0, 2.8);
const UF_BATH_POS = new THREE.Vector3(16.5, 5.5, -5.5);
const FOG_DARK_COLOR = new THREE.Color(0x020306);
const FOG_DARK_CRYPT_COLOR = new THREE.Color(0x010608);
const FOG_LIGHT_COLOR = new THREE.Color(0x9cb4d0);
const FOG_LIGHT_CRYPT_COLOR = new THREE.Color(0x748ca3);
const FOG_FLASH_COLOR = new THREE.Color(0x28354d);
const LIGHT_POOL_SIZE = 4;

function configureHouseQuality(houseData: HouseData, isMobile: boolean) {
  // Detach individual room PointLights from scene graph so our fixed 4-slot pool handles them with zero shader recompiles
  for (const light of houseData.flickerLights) {
    light.castShadow = false;
    light.parent?.remove(light);
  }
  if (isMobile || gameState.settings.graphicsQuality !== 'high') {
    houseData.root.traverse((obj) => {
      if (obj instanceof THREE.PointLight || obj instanceof THREE.DirectionalLight) {
        obj.castShadow = false;
      }
    });
  }
}

function syncHouseWithGameState(houseData: HouseData) {
  for (const item of houseData.interactives) {
    if (item.type === 'frame' && (gameState.hasPhotoFrame || gameState.framePlacedOnDoor)) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.id === 'key-brass' && gameState.hasBrassKey) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.id === 'key-attic' && gameState.hasAtticKey) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'cutters' && gameState.hasBoltCutters) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'gate_key' && gameState.hasGateKey) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'crowbar' && gameState.hasCrowbar) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'bell' && gameState.hasTantricBell) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'fuel_can' && gameState.hasFuelCan) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'car_battery' && gameState.hasCarBattery) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'car_key' && gameState.hasCarKey) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'oars' && gameState.hasBoatOars) {
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'drawer' && item.drawerId && gameState.drawersOpen[item.drawerId]) {
      item.isOpen = true;
      if (item.drawerMesh) {
        if (item.drawerMesh.userData.baseZ === undefined) {
          item.drawerMesh.userData.baseZ = item.drawerMesh.position.z;
        }
        const openZ = (item.drawerMesh.userData.baseZ as number) + 0.42;
        item.drawerMesh.position.z = openZ;
        item.drawerMesh.userData.targetPosZ = openZ;
      }
      item.prompt = `Press E to close ${item.name}`;
    } else if (item.type === 'secret_bookcase' && gameState.secretPassageOpen) {
      item.isOpen = true;
      item.mesh.rotation.y = Math.PI / 2;
      item.mesh.userData.targetRotY = Math.PI / 2;
      item.prompt = 'Close Revolving Bookshelf [E]';
    } else if (item.type === 'escape_boat') {
      if (gameState.cellarBarsPried || gameState.cellarSealBroken) {
        item.action?.();
      }
    } else if (item.type === 'door' && item.doorId === 'exitDoor' && gameState.exitUnlocked) {
      item.prompt = 'Open Grand Exit Door';
    }
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  sessionKey,
  isContinueSession,
  onCatchPlayer,
  onInteractiveChange,
  onSaveProgress,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const ghostRef = useRef<KalapurGhost | null>(null);
  const houseDataRef = useRef<HouseData | null>(null);

  const isMobileRef = useRef(false);
  const isJumpscaringRef = useRef(false);
  const catchTimeoutRef = useRef<number | null>(null);
  const kitchenScaredRef = useRef(false);
  const whisperTimerRef = useRef(7.0);
  const creakTimerRef = useRef(12.0);
  const breathingTimerRef = useRef(1.2);
  const clockTickTimerRef = useRef(1.0);
  const waterDripTimerRef = useRef(3.0);
  const lastAppliedSessionRef = useRef(0);

  // Live callback & mode refs so WebGL scene never tears down on mode transitions
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const callbacksRef = useRef({
    onCatchPlayer,
    onInteractiveChange,
    onSaveProgress,
  });
  callbacksRef.current = {
    onCatchPlayer,
    onInteractiveChange,
    onSaveProgress,
  };

  // Sync mode transitions (audio, pointer lock, pending jumpscare cleanup)
  useEffect(() => {
    if (mode !== 'playing') {
      isJumpscaringRef.current = false;
      if (catchTimeoutRef.current !== null) {
        clearTimeout(catchTimeoutRef.current);
        catchTimeoutRef.current = null;
      }
      soundManager.stopTatyaTrack();
      callbacksRef.current.onInteractiveChange(null);
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } else {
      soundManager.startTatyaTrack();
    }
  }, [mode]);

  // Reset / Restore game session without destroying WebGL context
  useEffect(() => {
    if (sessionKey <= 0 || sessionKey === lastAppliedSessionRef.current) return;
    const scene = sceneRef.current;
    const player = playerRef.current;
    const ghost = ghostRef.current;
    if (!scene || !player || !ghost) return;

    isJumpscaringRef.current = false;
    if (catchTimeoutRef.current !== null) {
      clearTimeout(catchTimeoutRef.current);
      catchTimeoutRef.current = null;
    }
    kitchenScaredRef.current = false;
    whisperTimerRef.current = 7.0;

    // Rebuild house geometry on subsequent fresh games for clean randomized drawers
    if (lastAppliedSessionRef.current > 0 && !isContinueSession && houseDataRef.current) {
      scene.remove(houseDataRef.current.root);
      const freshHouse = buildKalapurHouse();
      configureHouseQuality(freshHouse, isMobileRef.current);
      houseDataRef.current = freshHouse;
      scene.add(freshHouse.root);
    } else if (isContinueSession && houseDataRef.current) {
      syncHouseWithGameState(houseDataRef.current);
    }

    lastAppliedSessionRef.current = sessionKey;
    player.setPosition(gameState.checkpointPos, gameState.checkpointRot);
    ghost.resetToStart();
    ghost.updateVillainModel();
    soundManager.startTatyaTrack();
    soundManager.setMusicMood('explore');
  }, [sessionKey, isContinueSession]);

  // Persistent Three.js WebGL Setup (Created ONCE on mount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const isMobile =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
    isMobileRef.current = isMobile;
    gameState.isTouchDevice = isMobile;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.0175);
    sceneRef.current = scene;

    // Gentle ambient hemisphere clarity light (keeps rooms & tools crystal-clear while preserving dark horror mood)
    const hemiFill = new THREE.HemisphereLight(0x9fb4d8, 0x261a14, 0.3);
    scene.add(hemiFill);

    const initW = Math.max(1, container.clientWidth);
    const initH = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(74, initW / initH, 0.1, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setSize(initW, initH);
    const quality = gameState.settings.graphicsQuality || 'smooth90';
    const dprCap =
      quality === 'low' ? 0.8 : quality === 'smooth90' ? (isMobile ? 0.95 : 1.15) : quality === 'medium' ? 1.1 : isMobile ? 1.25 : 1.5;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, dprCap)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.shadowMap.enabled = !isSoftwareGl && (quality === 'high' || (quality === 'medium' && !isMobile));
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    const handleContextRestored = () => {
      renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    container.appendChild(renderer.domElement);

    // Studio Reflection Environment (applied only on Balanced/High desktop presets to double mobile fill-rate)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnvironmentTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
    if (!isMobile && (quality === 'high' || quality === 'medium')) {
      scene.environment = sceneEnvironmentTex;
    }

    // Fixed 4-slot PointLight pool (always visible, zero mid-game shader recompilation stutters)
    const lightPool: THREE.PointLight[] = [];
    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const pl = new THREE.PointLight(0xff8833, 0, 10, 1.6);
      scene.add(pl);
      lightPool.push(pl);
    }
    const poolBestDistSq = new Float64Array(LIGHT_POOL_SIZE);
    const poolBestLights: (THREE.PointLight | null)[] = new Array(LIGHT_POOL_SIZE).fill(null);

    // Build Kalapur House Architecture
    const houseData = buildKalapurHouse();
    configureHouseQuality(houseData, isMobile);
    houseDataRef.current = houseData;
    scene.add(houseData.root);

    // Build Kalapur Ghost
    const ghost = new KalapurGhost(houseData.ghostWaypoints);
    ghostRef.current = ghost;
    scene.add(ghost.mesh);

    // Build Player Controller
    const player = new PlayerController(camera, renderer.domElement);
    playerRef.current = player;
    scene.add(camera);

    // Apply initial session if Canvas mounted directly into playing mode
    if (sessionKey > 0) {
      lastAppliedSessionRef.current = sessionKey;
      if (isContinueSession) {
        syncHouseWithGameState(houseData);
      }
      player.setPosition(gameState.checkpointPos, gameState.checkpointRot);
      ghost.resetToStart();
      ghost.updateVillainModel();
      soundManager.startTatyaTrack();
    }

    // Monsoon Rain Particle System (Outdoors & Courtyard ONLY)
    const rainCount = isMobile ? 450 : 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      if (Math.random() < 0.65) {
        rainPos[i * 3] = (Math.random() - 0.5) * 25;
        rainPos[i * 3 + 1] = Math.random() * 20;
        rainPos[i * 3 + 2] = 17 + Math.random() * 16;
      } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        rainPos[i * 3] = (20.5 + Math.random() * 10) * side;
        rainPos[i * 3 + 1] = Math.random() * 20;
        rainPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);

    // Atmospheric Haveli Floating Dust Motes
    const dustCount = isMobile ? 80 : 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 24;
      dustPos[i * 3 + 1] = Math.random() * 8;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 32;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xecdcb6,
      size: 0.075,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // Lightning Flash Light
    const lightningLight = new THREE.DirectionalLight(0xaabbdd, 0);
    lightningLight.position.set(10, 30, 20);
    scene.add(lightningLight);

    let nextLightningTime = 8 + Math.random() * 12;
    let lightningDuration = 0;

    // Thrown Decoy Brass Lotas (zero-GC shared geometry/material)
    const decoyGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const decoyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
    const activeDecoys: Array<{
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      landed: boolean;
      age: number;
    }> = [];

    const handleThrowDecoy = (ev: Event) => {
      const detail = (ev as CustomEvent<{ origin: [number, number, number]; dir: [number, number, number] }>).detail;
      if (!detail) return;
      const mesh = new THREE.Mesh(decoyGeo, decoyMat);
      mesh.position.set(detail.origin[0], detail.origin[1], detail.origin[2]);
      scene.add(mesh);
      const vel = new THREE.Vector3(detail.dir[0] * 11.5, detail.dir[1] * 11.5 + 2.4, detail.dir[2] * 11.5);
      activeDecoys.push({ mesh, vel, landed: false, age: 0 });
    };
    window.addEventListener('kalapur:throwDecoy', handleThrowDecoy);

    // Sacred Vibhuti Stun Flash Light & Villain Stun Handler
    const stunFlashLight = new THREE.PointLight(0xfbbf24, 0, 14, 1.5);
    scene.add(stunFlashLight);
    let stunFlashTimer = 0;

    const handleStunBlast = (ev: Event) => {
      const detail = (ev as CustomEvent<{ origin: [number, number, number] }>).detail;
      if (!detail) return;
      stunFlashLight.position.set(detail.origin[0], detail.origin[1] + 0.1, detail.origin[2]);
      stunFlashTimer = 0.55;
      stunFlashLight.intensity = 9.0;

      const dist = ghost.position.distanceTo(player.position);
      const vertDiff = Math.abs(ghost.position.y - player.feetY);
      if (dist <= 6.2 && vertDiff <= 3.0) {
        ghost.stun(9.0);
        gameState.showSubtitle(
          `VIBHUTI FLASH! Villain stunned for 9 seconds — RUN! (${gameState.stunCharges} left)`,
          4200
        );
      } else {
        gameState.showSubtitle(
          `Scattered Sacred Vibhuti Ash — Villain was out of range! (${gameState.stunCharges} left)`,
          3000
        );
      }
    };
    window.addEventListener('kalapur:stunBlast', handleStunBlast);

    let lastBreakerVisual: boolean | null = null;
    let lastCarBattVisual: boolean | null = null;
    let lastAppliedQuality: 'low' | 'smooth90' | 'medium' | 'high' | null = null;
    let lastAppliedLighting: 'dark' | 'light' | null = null;
    let lastLightingSceneMode: string | null = null;

    const applyLightingAndQuality = (
      q: 'low' | 'smooth90' | 'medium' | 'high',
      lightMode: 'dark' | 'light',
      sceneMode: string
    ) => {
      lastAppliedQuality = q;
      lastAppliedLighting = lightMode;
      lastLightingSceneMode = sceneMode;

      const cap =
        q === 'low'
          ? 0.8
          : q === 'smooth90'
          ? isMobile
            ? 0.95
            : 1.15
          : q === 'medium'
          ? isMobile
            ? 1.05
            : 1.25
          : isMobile
          ? 1.25
          : 1.5;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, cap));
      const shadowsOn = !isSoftwareGl && (q === 'high' || (q === 'medium' && !isMobile));
      renderer.shadowMap.enabled = shadowsOn;
      player.flashlight.castShadow = shadowsOn;
      const activeH = houseDataRef.current || houseData;
      activeH.root.traverse((obj) => {
        if (obj instanceof THREE.DirectionalLight) {
          obj.castShadow = shadowsOn && q === 'high' && !isMobile;
        }
      });

      const isLightMode = lightMode === 'light';
      const isDarkPlaying = !isLightMode && sceneMode === 'playing';

      if (isLightMode) {
        // LIGHT MODE: All lights on, bright architectural illumination, no dark corners
        scene.environment = !isSoftwareGl ? sceneEnvironmentTex : null;
        (scene.background as THREE.Color).setHex(0x88a5c9);
        hemiFill.color.setHex(0xfff9ed);
        hemiFill.groundColor.setHex(0xc8b49d);
        hemiFill.intensity = 1.65;
        if (activeH.hemiLight) {
          activeH.hemiLight.color.setHex(0xfff5e4);
          activeH.hemiLight.groundColor.setHex(0xb39a82);
          activeH.hemiLight.intensity = 1.25;
        }
        if (activeH.moonLight) {
          activeH.moonLight.color.setHex(0xfff7e6);
          activeH.moonLight.intensity = 1.55;
        }
        (scene.fog as THREE.FogExp2).density = 0.0042;
        renderer.toneMappingExposure = 1.48;
      } else if (isDarkPlaying) {
        // DARK MODE (GAMEPLAY): Zero house/ambient light — strictly Flashlight Only
        scene.environment = null;
        (scene.background as THREE.Color).setHex(0x020306);
        hemiFill.intensity = 0;
        if (activeH.hemiLight) activeH.hemiLight.intensity = 0;
        if (activeH.moonLight) activeH.moonLight.intensity = 0;
        (scene.fog as THREE.FogExp2).density = 0.022;
        renderer.toneMappingExposure = 1.28;
      } else {
        // DARK MODE (MENU / ENDING PREVIEW): Faint haunted moonlight silhouette
        scene.environment = !isSoftwareGl && (q === 'high' || (q === 'medium' && !isMobile)) ? sceneEnvironmentTex : null;
        (scene.background as THREE.Color).setHex(0x060810);
        hemiFill.color.setHex(0x9fb4d8);
        hemiFill.groundColor.setHex(0x261a14);
        hemiFill.intensity = 0.32;
        if (activeH.hemiLight) {
          activeH.hemiLight.color.setHex(0x283e63);
          activeH.hemiLight.groundColor.setHex(0x060405);
          activeH.hemiLight.intensity = 0.4;
        }
        if (activeH.moonLight) {
          activeH.moonLight.color.setHex(0x5b7fb8);
          activeH.moonLight.intensity = 0.55;
        }
        (scene.fog as THREE.FogExp2).density = q === 'low' || q === 'smooth90' ? 0.0155 : 0.0175;
        renderer.toneMappingExposure = q === 'low' || q === 'smooth90' ? 1.32 : 1.28;
      }

      dustParticles.visible = q === 'high' || (q === 'medium' && !isMobile);
      const rainRatio = q === 'low' ? 0.25 : q === 'smooth90' ? 0.35 : q === 'medium' ? 0.65 : 1.0;
      rainGeo.setDrawRange(0, Math.floor(rainCount * rainRatio));
    };
    const initLightingMode = gameState.settings.lightingMode || 'dark';
    applyLightingAndQuality(quality, initLightingMode, modeRef.current);

    // Menu & Ending Cinematic Camera
    const menuCam = new THREE.PerspectiveCamera(65, initW / initH, 0.1, 80);
    let menuCamAngle = 0;

    // Pre-compile shaders cleanly to eliminate initial turn stutter
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let lastTime = performance.now();
    let frameId = 0;
    let isDisposed = false;
    let lastInteractiveNotified: InteractiveObject | null = null;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 16);
        return;
      }
      const poll = () => {
        if (isDisposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 4);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 16);
        }
      };
      frameId = window.setTimeout(poll, 4);
    };

    const tick = () => {
      if (isDisposed) return;

      const q = gameState.settings.graphicsQuality || 'smooth90';
      const lightingMode = gameState.settings.lightingMode || 'dark';
      const currentMode = modeRef.current;
      if (
        q !== lastAppliedQuality ||
        lightingMode !== lastAppliedLighting ||
        currentMode !== lastLightingSceneMode
      ) {
        applyLightingAndQuality(q, lightingMode, currentMode);
      }

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const activeHouse = houseDataRef.current || houseData;
      const isLightMode = lightingMode === 'light';
      const isDarkPlaying = !isLightMode && currentMode === 'playing';

      // 1. Rain Animation (scaled seamlessly to quality preset)
      const activeRainCount = Math.floor(
        rainCount * (q === 'low' ? 0.25 : q === 'smooth90' ? 0.35 : q === 'medium' ? 0.65 : 1.0)
      );
      const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 1; i < activeRainCount * 3; i += 3) {
        positions[i] -= delta * 22;
        if (positions[i] < 0) {
          positions[i] = 24 + Math.random() * 2;
        }
      }
      posAttr.needsUpdate = true;

      // 1B. Floating Dust Motes Motion (desktop high/medium only)
      if (dustParticles.visible) {
        const dPosAttr = dustGeo.attributes.position as THREE.BufferAttribute;
        const dPos = dPosAttr.array as Float32Array;
        const refPx = player.position.x;
        const refPz = player.position.z;
        for (let i = 0; i < dustCount; i++) {
          const idx = i * 3;
          dPos[idx + 1] -= delta * 0.12;
          dPos[idx] += Math.sin(now * 0.001 + i) * delta * 0.08;
          if (dPos[idx + 1] < 0.1) {
            dPos[idx + 1] = 7.5;
            dPos[idx] = refPx + (Math.random() - 0.5) * 16;
            dPos[idx + 2] = refPz + (Math.random() - 0.5) * 16;
          }
        }
        dPosAttr.needsUpdate = true;
      }

      // 1C. Clock Pendulum, Mandala Seal, Item Glints & Water Shimmer
      if (activeHouse.pendulums) {
        for (const p of activeHouse.pendulums) {
          p.rotation.z = Math.sin(now * 0.0028) * 0.28;
        }
      }
      if (activeHouse.mandalaMesh) {
        activeHouse.mandalaMesh.rotation.z += delta * 0.22;
      }
      if (activeHouse.glintRings && q !== 'low') {
        const pulse = 0.88 + Math.sin(now * 0.004) * 0.14;
        for (const gr of activeHouse.glintRings) {
          if (gr.parent && gr.parent.visible) {
            gr.rotation.z += delta * 1.4;
            gr.scale.set(pulse, pulse, 1);
          }
        }
      }
      if (activeHouse.waterStreams) {
        for (const ws of activeHouse.waterStreams) {
          if (ws.visible) {
            ws.scale.x = 0.85 + Math.sin(now * 0.02) * 0.15;
            ws.scale.z = 0.85 + Math.cos(now * 0.02) * 0.15;
          }
        }
      }

      // 2. Distant Lightning & Crypt Atmospheric Fog (Disabled in strict Flashlight-Only Dark Gameplay; soft sky in Light Mode)
      const baseFog = isLightMode
        ? player.position.y < -0.8
          ? FOG_LIGHT_CRYPT_COLOR
          : FOG_LIGHT_COLOR
        : player.position.y < -0.8
        ? FOG_DARK_CRYPT_COLOR
        : FOG_DARK_COLOR;
      nextLightningTime -= delta;
      if (nextLightningTime <= 0) {
        lightningDuration = isLightMode || isDarkPlaying ? 0 : 0.45;
        nextLightningTime = 10 + Math.random() * 16;
        if (!isLightMode) {
          soundManager.playThunder(0.7 + Math.random() * 0.3);
        }
      }
      if (lightningDuration > 0 && !isLightMode && !isDarkPlaying) {
        lightningDuration = Math.max(0, lightningDuration - delta);
        const flashFactor = (lightningDuration / 0.45) * (Math.random() > 0.35 ? 1 : 0.25);
        lightningLight.intensity = flashFactor * 4.5;
        (scene.fog as THREE.FogExp2).color.copy(baseFog).lerp(FOG_FLASH_COLOR, flashFactor);
      } else {
        lightningLight.intensity = 0;
        (scene.fog as THREE.FogExp2).color.copy(baseFog);
      }

      if (stunFlashTimer > 0) {
        stunFlashTimer = Math.max(0, stunFlashTimer - delta);
        stunFlashLight.intensity = (stunFlashTimer / 0.55) * 9.0;
      } else {
        stunFlashLight.intensity = 0;
      }

      // 3. Pooled Diya / Room Lantern System (Light Mode = ALL room lights bright; Dark Mode playing = 0 room light, ONLY flashlight!)
      const powerOn = gameState.breakerPowerOn;
      if (lastBreakerVisual !== powerOn) {
        lastBreakerVisual = powerOn;
        if (activeHouse.breakerLedMesh) {
          const ledMat = activeHouse.breakerLedMesh.material as THREE.MeshBasicMaterial;
          ledMat.color.setHex(powerOn ? 0x22c55e : 0xef4444);
        }
      }
      if (isDarkPlaying) {
        for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
          lightPool[i].intensity = 0;
        }
      } else {
        const refCamPos = currentMode === 'playing' ? player.position : menuCam.position;
        const maxLightDistSq = isLightMode
          ? 784
          : q === 'low'
          ? 196
          : q === 'smooth90'
          ? 289
          : q === 'medium'
          ? 324
          : 441;
        const poolSlots = isLightMode
          ? LIGHT_POOL_SIZE
          : q === 'low'
          ? 2
          : q === 'smooth90'
          ? 3
          : LIGHT_POOL_SIZE;
        for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
          poolBestDistSq[i] = maxLightDistSq;
          poolBestLights[i] = null;
        }
        for (const light of activeHouse.flickerLights) {
          if (!isLightMode && light.userData.switchedOff) continue;
          const ldx = light.position.x - refCamPos.x;
          const ldy = light.position.y - refCamPos.y;
          const ldz = light.position.z - refCamPos.z;
          const distSq = ldx * ldx + ldy * ldy + ldz * ldz;
          if (distSq >= poolBestDistSq[poolSlots - 1]) continue;

          let insertAt = poolSlots - 1;
          while (insertAt > 0 && distSq < poolBestDistSq[insertAt - 1]) {
            poolBestDistSq[insertAt] = poolBestDistSq[insertAt - 1];
            poolBestLights[insertAt] = poolBestLights[insertAt - 1];
            insertAt--;
          }
          poolBestDistSq[insertAt] = distSq;
          poolBestLights[insertAt] = light;
        }
        for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
          const dst = lightPool[i];
          const src = i < poolSlots ? poolBestLights[i] : null;
          if (!src) {
            dst.intensity = 0;
            continue;
          }
          dst.position.copy(src.position);
          dst.color.copy(src.color);
          dst.distance = isLightMode ? src.distance * 1.55 : src.distance;
          if (isLightMode) {
            const baseInt = (src.userData.baseIntensity as number) || 1.2;
            dst.intensity = baseInt * 2.2;
          } else if (!powerOn) {
            dst.intensity = 0.08;
          } else {
            const baseInt = (src.userData.baseIntensity as number) || 1.1;
            dst.intensity = baseInt * (0.85 + Math.sin(now * 0.008 + src.position.x) * 0.16);
          }
        }
      }

      // 3B. 1954 Garage Car Headlights (only enabled when Battery installed)
      const carBattOn = gameState.carBatteryInstalled;
      if (lastCarBattVisual !== carBattOn) {
        lastCarBattVisual = carBattOn;
        if (activeHouse.carHeadlights) {
          for (const hl of activeHouse.carHeadlights) {
            hl.visible = carBattOn;
            hl.intensity = carBattOn ? 4.8 : 0;
          }
        }
        if (activeHouse.carHeadlightBulbs) {
          for (const bulb of activeHouse.carHeadlightBulbs) {
            (bulb.material as THREE.MeshBasicMaterial).color.setHex(carBattOn ? 0xfef08a : 0x334155);
          }
        }
      }

      // 4. Update Photo Frame on Door & Outer Gate Security Meshes
      if (activeHouse.placedFrameMesh) {
        activeHouse.placedFrameMesh.visible = gameState.framePlacedOnDoor;
      }
      if (activeHouse.frameMountMesh) {
        activeHouse.frameMountMesh.visible = !gameState.framePlacedOnDoor;
      }
      if (activeHouse.gateChainMesh) {
        activeHouse.gateChainMesh.visible = !gameState.gateChainsCut;
      }
      if (activeHouse.gatePadlockMesh) {
        activeHouse.gatePadlockMesh.visible = !gameState.gatePadlockUnlocked;
      }

      // 5. Mode-based updates
      if (currentMode === 'menu') {
        menuCamAngle += delta * 0.08;
        menuCam.position.set(
          Math.sin(menuCamAngle) * 14,
          4.5 + Math.sin(menuCamAngle * 0.5) * 0.8,
          20 + Math.cos(menuCamAngle) * 6
        );
        menuCam.lookAt(0, 2.5, 12);
        renderer.render(scene, menuCam);
      } else if (currentMode === 'playing') {
        if (
          !isJumpscaringRef.current &&
          !gameState.isDayTransitioning &&
          !gameState.isGameOver &&
          !gameState.isVictory
        ) {
          const inKitchen = player.position.x < -8 && player.position.z > 6;
          const inSanctum = player.position.z < -8;
          soundManager.setTatyaTrackVolume(inKitchen || inSanctum ? 0.95 : 0.65);

          // Haunted Rocking Chair
          if (activeHouse.rockingChair) {
            activeHouse.rockingChair.rotation.x = Math.sin(now * 0.0025) * 0.12;
          }

          // Ambient Clock Ticking (Zero-GC)
          clockTickTimerRef.current -= delta;
          if (clockTickTimerRef.current <= 0) {
            clockTickTimerRef.current = 1.0;
            const dClock1 = player.position.distanceTo(CLOCK_1_POS);
            const dClock2 = player.position.distanceTo(CLOCK_2_POS);
            const minClockDist = Math.min(dClock1, dClock2);
            if (minClockDist < 12) {
              const pan =
                dClock1 < dClock2
                  ? Math.max(-1, Math.min(1, (CLOCK_1_POS.x - player.position.x) / 10))
                  : Math.max(-1, Math.min(1, (CLOCK_2_POS.x - player.position.x) / 10));
              soundManager.playClockTick(pan);
            }
          }

          // Ambient Water Dripping near bathrooms (Zero-GC)
          waterDripTimerRef.current -= delta;
          if (waterDripTimerRef.current <= 0) {
            waterDripTimerRef.current = 4 + Math.random() * 6;
            const dGfBath = player.position.distanceTo(GF_BATH_POS);
            const dUfBath = player.position.distanceTo(UF_BATH_POS);
            if (dGfBath < 10) {
              soundManager.playWaterDrip(Math.max(-1, Math.min(1, (GF_BATH_POS.x - player.position.x) / 8)));
            } else if (dUfBath < 10) {
              soundManager.playWaterDrip(Math.max(-1, Math.min(1, (UF_BATH_POS.x - player.position.x) / 8)));
            }
          }

          // Paranormal Kitchen Crash Scare
          if (!kitchenScaredRef.current && inKitchen) {
            kitchenScaredRef.current = true;
            soundManager.playKitchenCrash();
            gameState.screenGlitchIntensity = 0.9;
            gameState.showSubtitle(
              'A heavy brass vessel crashed to the floor in the kitchen! Something is here...',
              4200
            );
            setTimeout(() => {
              gameState.screenGlitchIntensity = 0;
            }, 600);
          }

          // Chilling Spatial Puppet Giggle / Tantric Whisper
          whisperTimerRef.current -= delta;
          if (whisperTimerRef.current <= 0) {
            whisperTimerRef.current = 9 + Math.random() * 14;
            const distToGhost = ghost.position.distanceTo(player.position);
            if (distToGhost < 16) {
              const pan = Math.max(-1, Math.min(1, (ghost.position.x - player.position.x) / 10));
              if (gameState.settings.villainType === 'tatya' && Math.random() > 0.35) {
                soundManager.playPuppetGiggle(pan);
                gameState.showSubtitle('A sinister wooden giggle echoes in the dark...', 2800);
              } else {
                soundManager.playTantricWhisper(pan);
                gameState.showSubtitle("A chilling whisper mutters: 'Om Phat Swaha...'", 3000);
              }
            }
          }

          // Spooky Phantom Floorboard Creaks in Nearby Empty Rooms
          creakTimerRef.current -= delta;
          if (creakTimerRef.current <= 0) {
            creakTimerRef.current = 14 + Math.random() * 14;
            soundManager.playPhantomCreak((Math.random() - 0.5) * 1.6);
          }

          // Scared Heavy Breathing during chases or when exhausted
          breathingTimerRef.current -= delta;
          if (breathingTimerRef.current <= 0) {
            const ghostClose = gameState.ghostState === 'chase' && gameState.ghostDistance < 9.0;
            const winded = gameState.stamina < 18;
            if (ghostClose || winded) {
              breathingTimerRef.current = ghostClose ? 0.72 : 1.05;
              soundManager.playHeavyBreathing(ghostClose ? 0.9 : 0.45);
            } else {
              breathingTimerRef.current = 0.6;
            }
          }

          // Update Thrown Brass Decoy Lotas
          for (let i = activeDecoys.length - 1; i >= 0; i--) {
            const dec = activeDecoys[i];
            dec.age += delta;
            if (!dec.landed) {
              dec.vel.y -= 18 * delta;
              dec.mesh.position.addScaledVector(dec.vel, delta);
              dec.mesh.rotation.x += delta * 10;
              dec.mesh.rotation.z += delta * 8;
              const floorY = getMansionFloorHeight(dec.mesh.position.x, dec.mesh.position.z, Math.max(-3.0, dec.mesh.position.y - 0.1));
              if (dec.mesh.position.y <= floorY + 0.1 || dec.age > 1.8) {
                dec.landed = true;
                dec.age = 0;
                dec.mesh.position.y = floorY + 0.1;
                soundManager.playDecoyThrowClang();
                if (ghost.position.distanceTo(dec.mesh.position) < 26) {
                  ghost.investigatePosition(dec.mesh.position);
                  gameState.showSubtitle('CLANG! The Brass Lota echoed — Villain is investigating the sound!', 3200);
                }
              }
            } else if (dec.age > 3.2) {
              scene.remove(dec.mesh);
              activeDecoys.splice(i, 1);
            }
          }

          // Smooth Granny-style Door, Secret Bookshelf & Drawer animations (Zero-GC)
          for (const item of activeHouse.interactives) {
            if (item.mesh.userData.targetRotY !== undefined) {
              const targetY = item.mesh.userData.targetRotY as number;
              if (Math.abs(item.mesh.rotation.y - targetY) > 0.002) {
                item.mesh.rotation.y = THREE.MathUtils.damp(item.mesh.rotation.y, targetY, 12, delta);
              } else {
                item.mesh.rotation.y = targetY;
              }
            }
            if (item.drawerMesh && item.drawerMesh.userData.targetPosZ !== undefined) {
              const targetZ = item.drawerMesh.userData.targetPosZ as number;
              if (Math.abs(item.drawerMesh.position.z - targetZ) > 0.001) {
                item.drawerMesh.position.z = THREE.MathUtils.damp(item.drawerMesh.position.z, targetZ, 14, delta);
              } else {
                item.drawerMesh.position.z = targetZ;
              }
            }
          }

          // Update Player with floor-bucketed spatial colliders (~3x fewer Box3 checks per frame)
          const playerFloorColliders = getFloorColliders(
            activeHouse.colliderBuckets,
            player.feetY,
            activeHouse.colliders
          );
          player.update(delta, playerFloorColliders, activeHouse.interactives);
          if (player.currentInteractive !== lastInteractiveNotified) {
            lastInteractiveNotified = player.currentInteractive;
            callbacksRef.current.onInteractiveChange(player.currentInteractive);
          }

          // Update Ghost AI with floor-bucketed spatial colliders
          const ghostFloorColliders = getFloorColliders(
            activeHouse.colliderBuckets,
            ghost.position.y,
            activeHouse.colliders
          );
          ghost.update(
            delta,
            player.position,
            gameState.isHiding !== null,
            gameState.isSprinting,
            gameState.isCrouching,
            player.isMoving,
            gameState.flashlightOn,
            ghostFloorColliders,
            () => {
              isJumpscaringRef.current = true;
              soundManager.playTatyaCurseStrike();
              gameState.screenGlitchIntensity = 1.0;

              const villainName =
                gameState.settings.villainType === 'tatya' ? 'TATYA VINCHOO' : 'THE KALAPUR GHOST';
              gameState.showSubtitle(`${villainName} CURSE STRUCK! "OM PHAT SWAHA!"`, 4000);

              const targetLookY = gameState.settings.villainType === 'tatya' ? 1.8 : 2.4;
              player.camera.lookAt(ghost.position.x, ghost.position.y + targetLookY, ghost.position.z);

              if (catchTimeoutRef.current !== null) {
                clearTimeout(catchTimeoutRef.current);
              }
              catchTimeoutRef.current = window.setTimeout(() => {
                catchTimeoutRef.current = null;
                isJumpscaringRef.current = false;
                gameState.screenGlitchIntensity = 0;

                if (modeRef.current !== 'playing') return;

                const isAlive = gameState.advanceDay();
                callbacksRef.current.onCatchPlayer();

                if (!isAlive) {
                  soundManager.stopTatyaTrack();
                  gameState.isGameOver = true;
                  gameState.notify();
                } else {
                  // Respawn next day cleanly in the exact same starting Grand Foyer spot
                  player.setPosition([0, 1.6, 12], 0);
                  ghost.resetToStart();
                  soundManager.setMusicMood('explore');
                }
              }, 2200);
            },
            activeHouse.interactives
          );
        }

        ghost.updateVillainModel();
        renderer.render(scene, camera);
      } else if (currentMode === 'ending') {
        menuCamAngle += delta * 0.05;
        menuCam.position.set(0, 3 + menuCamAngle * 0.5, 26 + menuCamAngle * 2);
        menuCam.lookAt(0, 2, 16);
        renderer.render(scene, menuCam);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      menuCam.aspect = w / h;
      menuCam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const handleEscaped = () => {
      callbacksRef.current.onSaveProgress();
    };
    window.addEventListener('kalapur:escaped', handleEscaped);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (catchTimeoutRef.current !== null) {
        clearTimeout(catchTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('kalapur:escaped', handleEscaped);
      window.removeEventListener('kalapur:throwDecoy', handleThrowDecoy);
      window.removeEventListener('kalapur:stunBlast', handleStunBlast);
      decoyGeo.dispose();
      decoyMat.dispose();
      sceneEnvironmentTex.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      player.dispose();
      soundManager.stopTatyaTrack();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};
