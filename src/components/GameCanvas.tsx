import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildKalapurHouse, HouseData, InteractiveObject } from '../game/houseGeometry';
import { PlayerController } from '../game/player';
import { KalapurGhost } from '../game/ghost';
import { soundManager } from '../audio/SoundManager';
import { gameState } from '../game/gameState';

interface GameCanvasProps {
  mode: 'menu' | 'playing' | 'ending';
  onCatchPlayer: () => void;
  onInteractiveChange: (interactive: InteractiveObject | null) => void;
  onSaveProgress: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  onCatchPlayer,
  onInteractiveChange,
  onSaveProgress,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const ghostRef = useRef<KalapurGhost | null>(null);
  const houseDataRef = useRef<HouseData | null>(null);
  const isJumpscaringRef = useRef(false);
  const kitchenScaredRef = useRef(false);
  const whisperTimerRef = useRef(7.0);
  const clockTickTimerRef = useRef(1.0);
  const waterDripTimerRef = useRef(3.0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
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
    gameState.isTouchDevice = isMobile;

    // Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x090b14, 0.022); // Crisp visibility of haveli walls and roof!

    const initW = Math.max(1, container.clientWidth);
    const initH = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(75, initW / initH, 0.1, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25; // Clear and atmospheric illumination
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Build Kalapur House Architecture
    const houseData = buildKalapurHouse();
    if (isMobile || gameState.settings.graphicsQuality !== 'high') {
      // Prevent costly 6-pass PointLight cubemap shadows on mobile GPUs (keeps SpotLight/Moon shadows sharp)
      houseData.root.traverse((obj) => {
        if (obj instanceof THREE.PointLight) {
          obj.castShadow = false;
        }
      });
    }
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

    if (mode === 'playing') {
      soundManager.startTatyaTrack();
    }

    // Monsoon Rain Particle System (Outdoors & Courtyard ONLY - Zero rain inside mansion rooms!)
    const rainCount = isMobile ? 450 : 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      if (Math.random() < 0.65) {
        // Courtyard zone (Z: 17 to 34, X: -13 to 13)
        rainPos[i * 3] = (Math.random() - 0.5) * 25;
        rainPos[i * 3 + 1] = Math.random() * 20;
        rainPos[i * 3 + 2] = 17 + Math.random() * 16;
      } else {
        // Outside mansion perimeter flanks
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

    // Atmospheric Haveli Floating Dust Motes (Indoors suspended motes catching flashlight)
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

    // Menu Cinematic Camera
    const menuCam = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      80
    );
    let menuCamAngle = 0;

    // Animation Loop
    let lastTime = performance.now();
    let frameId = 0;

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Rain Animation
      const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 1; i < rainCount * 3; i += 3) {
        positions[i] -= delta * 22; // fall speed
        if (positions[i] < 0) {
          positions[i] = 24 + Math.random() * 2;
        }
      }
      posAttr.needsUpdate = true;

      // 1B. Floating Dust Motes Motion
      const dPosAttr = dustGeo.attributes.position as THREE.BufferAttribute;
      const dPos = dPosAttr.array as Float32Array;
      const refPx = playerRef.current ? playerRef.current.position.x : 0;
      const refPz = playerRef.current ? playerRef.current.position.z : 10;
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

      // 1C. Clock Pendulum Swing & Water Stream Shimmer
      if (houseData.pendulums) {
        for (const p of houseData.pendulums) {
          p.rotation.z = Math.sin(now * 0.0028) * 0.28;
        }
      }
      if (houseData.waterStreams) {
        for (const ws of houseData.waterStreams) {
          if (ws.visible) {
            ws.scale.x = 0.85 + Math.sin(now * 0.02) * 0.15;
            ws.scale.z = 0.85 + Math.cos(now * 0.02) * 0.15;
          }
        }
      }

      // 2. Random Distant Lightning & Thunder
      nextLightningTime -= delta;
      if (nextLightningTime <= 0) {
        lightningDuration = 0.25;
        nextLightningTime = 10 + Math.random() * 16;
        soundManager.playThunder(0.7 + Math.random() * 0.3);
      }
      if (lightningDuration > 0) {
        lightningDuration -= delta;
        lightningLight.intensity = Math.random() > 0.4 ? 4.5 : 0.8;
        scene.fog!.color.set(0x253045);
      } else {
        lightningLight.intensity = 0;
        scene.fog!.color.set(0x060810);
      }

      // 3. Flickering Diya Lamps
      for (const light of houseData.flickerLights) {
        light.intensity = 0.9 + Math.sin(now * 0.008 + light.position.x) * 0.25 + (Math.random() - 0.5) * 0.15;
      }

      // 4. Update Photo Frame on Door & Outer Gate Security Meshes
      if (houseData.placedFrameMesh) {
        houseData.placedFrameMesh.visible = gameState.framePlacedOnDoor;
      }
      if (houseData.frameMountMesh) {
        houseData.frameMountMesh.visible = !gameState.framePlacedOnDoor;
      }
      if (houseData.gateChainMesh) {
        houseData.gateChainMesh.visible = !gameState.gateChainsCut;
      }
      if (houseData.gatePadlockMesh) {
        houseData.gatePadlockMesh.visible = !gameState.gatePadlockUnlocked;
      }

      // 5. Mode-based updates
      if (mode === 'menu') {
        // Orbit camera around atmospheric haveli entrance
        menuCamAngle += delta * 0.08;
        menuCam.position.set(
          Math.sin(menuCamAngle) * 14,
          4.5 + Math.sin(menuCamAngle * 0.5) * 0.8,
          20 + Math.cos(menuCamAngle) * 6
        );
        menuCam.lookAt(0, 2.5, 12);
        renderer.render(scene, menuCam);
      } else if (mode === 'playing') {
        if (!isJumpscaringRef.current && !gameState.isGameOver && !gameState.isVictory) {
          // Dynamic Tatya horror chant volume (higher in kitchen and near upper sanctum)
          const inKitchen = player.position.x < -8 && player.position.z > 6;
          const inSanctum = player.position.z < -8;
          const chantVol = inKitchen || inSanctum ? 0.95 : 0.65;
          soundManager.setTatyaTrackVolume(chantVol);

          // Haunted Rocking Chair gently rocking on its own
          if (houseData.rockingChair) {
            houseData.rockingChair.rotation.x = Math.sin(now * 0.0025) * 0.12;
          }

          // Ambient Haveli Sounds: Clock Ticking when near grandfather clock
          clockTickTimerRef.current -= delta;
          if (clockTickTimerRef.current <= 0) {
            clockTickTimerRef.current = 1.0;
            const dClock1 = player.position.distanceTo(new THREE.Vector3(18.5, 1.4, 4.5));
            const dClock2 = player.position.distanceTo(new THREE.Vector3(-3.2, 5.5, 2.5));
            const minClockDist = Math.min(dClock1, dClock2);
            if (minClockDist < 12) {
              const pan = dClock1 < dClock2
                ? Math.max(-1, Math.min(1, (18.5 - player.position.x) / 10))
                : Math.max(-1, Math.min(1, (-3.2 - player.position.x) / 10));
              soundManager.playClockTick(pan);
            }
          }

          // Ambient Haveli Sounds: Mysterious Water Dripping near bathrooms
          waterDripTimerRef.current -= delta;
          if (waterDripTimerRef.current <= 0) {
            waterDripTimerRef.current = 4 + Math.random() * 6;
            const dGfBath = player.position.distanceTo(new THREE.Vector3(-16.5, 1.0, 0.5));
            const dUfBath = player.position.distanceTo(new THREE.Vector3(16.5, 5.5, -5.5));
            if (dGfBath < 10) {
              soundManager.playWaterDrip(Math.max(-1, Math.min(1, (-16.5 - player.position.x) / 8)));
            } else if (dUfBath < 10) {
              soundManager.playWaterDrip(Math.max(-1, Math.min(1, (16.5 - player.position.x) / 8)));
            }
          }

          // Paranormal Kitchen Crash Scare
          if (!kitchenScaredRef.current && inKitchen) {
            kitchenScaredRef.current = true;
            soundManager.playKitchenCrash();
            gameState.screenGlitchIntensity = 0.9;
            gameState.showSubtitle("A heavy brass vessel crashed to the floor in the kitchen! Something is here...", 4200);
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
                gameState.showSubtitle("A sinister wooden giggle echoes in the dark...", 2800);
              } else {
                soundManager.playTantricWhisper(pan);
                gameState.showSubtitle("A chilling whisper mutters: 'Om Phat Swaha...'", 3000);
              }
            }
          }

          // Update Player
          player.update(delta, houseData.colliders, houseData.interactives);
          onInteractiveChange(player.currentInteractive);

          // Update Ghost AI
          ghost.update(
            delta,
            player.position,
            gameState.isHiding !== null,
            gameState.isSprinting,
            gameState.isCrouching,
            player.isMoving,
            gameState.flashlightOn,
            houseData.colliders,
            () => {
              // VILLAIN CURSE STRUCK / CAUGHT PLAYER!
              isJumpscaringRef.current = true;
              soundManager.playTatyaCurseStrike();
              gameState.screenGlitchIntensity = 1.0;

              const villainName = gameState.settings.villainType === 'tatya' ? 'TATYA VINCHOO' : 'THE KALAPUR GHOST';
              gameState.showSubtitle(`${villainName} CURSE STRUCK! "OM PHAT SWAHA!"`, 4000);

              // Jumpscare camera snap toward villain face
              const targetLookY = gameState.settings.villainType === 'tatya' ? 1.8 : 2.4;
              player.camera.lookAt(ghost.position.x, ghost.position.y + targetLookY, ghost.position.z);

              setTimeout(() => {
                isJumpscaringRef.current = false;
                gameState.screenGlitchIntensity = 0;
                const isAlive = gameState.advanceDay();
                onCatchPlayer();

                if (!isAlive) {
                  // 4 Days failed - Game Over!
                  soundManager.stopTatyaTrack();
                  gameState.isGameOver = true;
                  gameState.notify();
                } else {
                  // Wake up next day on bed in Guest Bedchamber
                  player.setPosition([-12, 4.5, 3.5], 0);
                  ghost.resetToStart();
                  soundManager.setMusicMood('explore');
                }
              }, 2200);
            },
            houseData.interactives
          );
        }

        ghost.updateVillainModel();
        renderer.render(scene, camera);
      } else if (mode === 'ending') {
        // Cinematic pull-back camera for ending
        menuCamAngle += delta * 0.05;
        menuCam.position.set(0, 3 + menuCamAngle * 0.5, 26 + menuCamAngle * 2);
        menuCam.lookAt(0, 2, 16);
        renderer.render(scene, menuCam);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Resize & Orientation Change Handler
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

    // Listen for custom escape event
    const handleEscaped = () => {
      onSaveProgress();
    };
    window.addEventListener('kalapur:escaped', handleEscaped);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('kalapur:escaped', handleEscaped);
      player.dispose();
      soundManager.stopTatyaTrack();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode, onCatchPlayer, onInteractiveChange, onSaveProgress]);

  // Expose player controller methods
  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};
