import * as THREE from 'three';
import { gameState } from './gameState';
import { soundManager } from '../audio/SoundManager';
import { InteractiveObject, getMansionFloorHeight } from './houseGeometry';
import { createKalapurPortraitTexture } from './textures';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.6, 12);
  public velocity: THREE.Vector3 = new THREE.Vector3();

  // Pitch & Yaw with smooth interpolation
  public yaw = 0;
  public pitch = 0;
  public targetYaw = 0;
  public targetPitch = 0;

  // Speeds
  public walkSpeed = 3.6;
  public sprintSpeed = 6.2;
  public crouchSpeed = 1.8;

  // Touch / Mobile Input controls for Android / Google Play Store
  public touchMove = { x: 0, z: 0 };
  public touchLook = { x: 0, y: 0 };

  // Flashlight
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public flashlightBulb: THREE.PointLight;

  // Held Item (Photo Frame in hands)
  public heldFrameMesh: THREE.Group;

  // Input states
  public keys: Record<string, boolean> = {};
  public isLocked = false;
  public isMoving = false;
  private footstepTimer = 0;
  private headbobTimer = 0;

  // Interaction
  public currentInteractive: InteractiveObject | null = null;
  private raycaster = new THREE.Raycaster();
  private domElement: HTMLElement;

  // Reusable zero-GC scratch objects
  private tmpMoveVec = new THREE.Vector3();
  private tmpUpVec = new THREE.Vector3(0, 1, 0);
  private tmpBoxX = new THREE.Box3();
  private tmpBoxZ = new THREE.Box3();
  private tmpBoxMin = new THREE.Vector3();
  private tmpBoxMax = new THREE.Vector3();
  private tmpScreenCenter = new THREE.Vector2(0, 0);
  private tmpToObj = new THREE.Vector3();
  private tmpLookDir = new THREE.Vector3();

  // Bound handlers for clean disposal
  private onKeyDownHandler!: (e: KeyboardEvent) => void;
  private onKeyUpHandler!: (e: KeyboardEvent) => void;
  private onMouseMoveHandler!: (e: MouseEvent) => void;
  private onPointerLockChangeHandler!: () => void;
  private onDomClickHandler!: () => void;
  private onDomContextMenuHandler!: (e: MouseEvent) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.camera.position.copy(this.position);

    const isMobile =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);

    // Setup Flashlight (Powerful cinematic horror beam with crisp illumination of walls & roof)
    this.flashlight = new THREE.SpotLight(0xfffaed, 5.5, 34, Math.PI / 5, 0.35, 1.2);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
    this.flashlight.shadow.bias = -0.0008;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlight.target = this.flashlightTarget;

    this.flashlightBulb = new THREE.PointLight(0xffe8c6, 0.85, 10.0, 1.5); // forward fill light to illuminate walls and ceilings
    this.flashlightBulb.position.set(0, 0, -1.8);

    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.camera.add(this.flashlightBulb);
    this.flashlightTarget.position.set(0, 0, -6);

    // Setup Held Photo Frame in Player's Hands
    this.heldFrameMesh = new THREE.Group();
    const frameBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xb58e3b, roughness: 0.4, metalness: 0.8 })
    );
    const portraitTex = createKalapurPortraitTexture();
    const portraitPhoto = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.4),
      new THREE.MeshStandardMaterial({ map: portraitTex, roughness: 0.5 })
    );
    portraitPhoto.position.z = 0.016;
    this.heldFrameMesh.add(frameBorder, portraitPhoto);
    this.heldFrameMesh.position.set(0.32, -0.28, -0.55);
    this.heldFrameMesh.rotation.set(-0.25, -0.3, 0.1);
    this.heldFrameMesh.visible = false;
    this.camera.add(this.heldFrameMesh);

    this.setupListeners(domElement);

    // Bind Mobile Touch Actions from HUD
    gameState.onTouchInteract = () => {
      this.handleInteraction();
    };
    gameState.onTouchFlashlight = () => {
      this.toggleFlashlight();
    };
  }

  private setupListeners(domElement: HTMLElement) {
    this.onKeyDownHandler = (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }
      if (e.code === 'KeyC') {
        gameState.isCrouching = !gameState.isCrouching;
        gameState.notify();
      }
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }
    };

    this.onKeyUpHandler = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    this.onDomClickHandler = () => {
      if (!this.isLocked && gameState.isHiding === null && !gameState.isTouchDevice) {
        domElement.requestPointerLock?.();
      }
    };

    this.onPointerLockChangeHandler = () => {
      this.isLocked = document.pointerLockElement === domElement;
    };

    this.onMouseMoveHandler = (e: MouseEvent) => {
      if (!this.isLocked && gameState.isHiding === null) return;
      const sens = 0.0022 * (gameState.settings.mouseSensitivity || 1.0);

      this.targetYaw -= e.movementX * sens;
      this.targetPitch -= e.movementY * sens;
      this.targetPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetPitch));

      if (gameState.isHiding) {
        this.targetYaw = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetYaw));
        this.targetPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetPitch));
      }
    };

    this.onDomContextMenuHandler = (e: MouseEvent) => {
      e.preventDefault();
      this.toggleFlashlight();
    };

    window.addEventListener('keydown', this.onKeyDownHandler);
    window.addEventListener('keyup', this.onKeyUpHandler);
    window.addEventListener('mousemove', this.onMouseMoveHandler);
    document.addEventListener('pointerlockchange', this.onPointerLockChangeHandler);
    domElement.addEventListener('click', this.onDomClickHandler);
    domElement.addEventListener('contextmenu', this.onDomContextMenuHandler);
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDownHandler);
    window.removeEventListener('keyup', this.onKeyUpHandler);
    window.removeEventListener('mousemove', this.onMouseMoveHandler);
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeHandler);
    this.domElement.removeEventListener('click', this.onDomClickHandler);
    this.domElement.removeEventListener('contextmenu', this.onDomContextMenuHandler);
  }

  public toggleFlashlight() {
    if (gameState.flashlightBattery <= 0) {
      soundManager.playFlashlightClick(false);
      gameState.showSubtitle('Flashlight battery is dead!');
      return;
    }
    gameState.flashlightOn = !gameState.flashlightOn;
    this.flashlight.visible = gameState.flashlightOn;
    this.flashlightBulb.visible = gameState.flashlightOn;
    soundManager.playFlashlightClick(gameState.flashlightOn);
    gameState.notify();
  }

  public update(delta: number, colliders: THREE.Box3[], interactives: InteractiveObject[]) {
    // 1. Flashlight Battery Drain
    if (gameState.flashlightOn && gameState.flashlightBattery > 0) {
      gameState.flashlightBattery = Math.max(0, gameState.flashlightBattery - delta * 0.4);
      if (gameState.flashlightBattery <= 0) {
        gameState.flashlightOn = false;
        this.flashlight.visible = false;
        this.flashlightBulb.visible = false;
        gameState.showSubtitle('Flashlight died! Find spare batteries.');
      }
      // Supernatural horror flashlight disturbance when Tatya approaches or chases
      if (gameState.ghostDistance < 7.0 || gameState.ghostState === 'chase') {
        const proximityRatio = Math.max(0, 1 - gameState.ghostDistance / 7.0);
        if (Math.random() < 0.28 + proximityRatio * 0.45) {
          this.flashlight.intensity = Math.random() < 0.3 ? 0.05 : (1.0 + Math.random() * 2.5);
          this.flashlightBulb.intensity = Math.random() < 0.3 ? 0.05 : 0.35;
        } else {
          this.flashlight.intensity = 4.2;
          this.flashlightBulb.intensity = 0.85;
        }
      } else if (gameState.flashlightBattery < 15) {
        this.flashlight.intensity = Math.random() > 0.3 ? 3.5 : 0.6;
        this.flashlightBulb.intensity = Math.random() > 0.3 ? 0.85 : 0.2;
      } else {
        this.flashlight.intensity = 4.0;
        this.flashlightBulb.intensity = 0.85;
      }
    }

    // 2. Held Photo Frame Visibility
    this.heldFrameMesh.visible = gameState.hasPhotoFrame && !gameState.framePlacedOnDoor && gameState.isHiding === null;

    // 2B. Apply Touch Look (Mobile / Android Touch drag) even while hiding
    const lookX = this.touchLook.x + gameState.touchLook.x;
    const lookY = this.touchLook.y + gameState.touchLook.y;
    if (lookX !== 0 || lookY !== 0) {
      const touchSens = 0.0034 * (gameState.settings.mouseSensitivity || 1.0);
      this.targetYaw -= lookX * touchSens;
      this.targetPitch -= lookY * touchSens;
      this.targetPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetPitch));
      if (gameState.isHiding !== null) {
        this.targetYaw = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetYaw));
        this.targetPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetPitch));
      }
      this.touchLook.x = 0;
      this.touchLook.y = 0;
      gameState.touchLook.x = 0;
      gameState.touchLook.y = 0;
    }

    // Silky smooth camera look damping (eliminates touch micro-stutters)
    this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 28, delta);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 28, delta);

    // 3. If player is hiding in wardrobe or under bed
    if (gameState.isHiding !== null) {
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.checkInteractives(interactives);
      return;
    }

    // 4. Sprint & Stamina
    const wantsSprint =
      ((this.keys['ShiftLeft'] || this.keys['ShiftRight']) || gameState.touchSprint) &&
      !gameState.isCrouching;
    if (wantsSprint && gameState.stamina > 5) {
      gameState.isSprinting = true;
      gameState.stamina = Math.max(0, gameState.stamina - delta * 24);
    } else {
      gameState.isSprinting = false;
      if (gameState.stamina <= 5) {
        gameState.touchSprint = false;
      }
      gameState.stamina = Math.min(100, gameState.stamina + delta * 12);
    }

    // 5. Compute Move Direction (Keyboard + Touch Joystick)
    const keyX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const keyZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);
    const totalTouchMoveX = this.touchMove.x + gameState.touchMove.x;
    const totalTouchMoveZ = this.touchMove.z + gameState.touchMove.z;
    const moveX = keyX + totalTouchMoveX;
    const moveZ = keyZ + totalTouchMoveZ;
    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
    this.isMoving = isMoving;

    let targetSpeed = this.walkSpeed;
    if (gameState.isSprinting) targetSpeed = this.sprintSpeed;
    if (gameState.isCrouching) targetSpeed = this.crouchSpeed;

    this.tmpMoveVec.set(moveX, 0, moveZ);
    if (this.tmpMoveVec.lengthSq() > 0) {
      this.tmpMoveVec.normalize();
      this.tmpMoveVec.applyAxisAngle(this.tmpUpVec, this.yaw);
    }

    // Smooth velocity damping
    const targetVelX = this.tmpMoveVec.x * targetSpeed;
    const targetVelZ = this.tmpMoveVec.z * targetSpeed;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, 16, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, 16, delta);

    // 6. Proposed new position with elevation-aware wall collision check & sliding
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    // Player bounding radius = 0.28m (Smooth sliding through doorways and corners)
    const playerRadius = 0.28;
    this.tmpBoxMin.set(nextX - playerRadius, this.position.y - 1.1, this.position.z - playerRadius);
    this.tmpBoxMax.set(nextX + playerRadius, this.position.y + 0.2, this.position.z + playerRadius);
    this.tmpBoxX.set(this.tmpBoxMin, this.tmpBoxMax);

    this.tmpBoxMin.set(this.position.x - playerRadius, this.position.y - 1.1, nextZ - playerRadius);
    this.tmpBoxMax.set(this.position.x + playerRadius, this.position.y + 0.2, nextZ + playerRadius);
    this.tmpBoxZ.set(this.tmpBoxMin, this.tmpBoxMax);

    let collideX = false;
    let collideZ = false;

    // Only test colliders near player's vertical elevation
    for (const box of colliders) {
      if (box.max.y < this.position.y - 1.2 || box.min.y > this.position.y + 0.3) {
        continue;
      }
      if (box.intersectsBox(this.tmpBoxX)) collideX = true;
      if (box.intersectsBox(this.tmpBoxZ)) collideZ = true;
    }

    if (!collideX) this.position.x = nextX;
    if (!collideZ) this.position.z = nextZ;

    // 7. Universal Smooth Floor & Staircase Elevation (Climbs Stairs Naturally!)
    const currentFloorBaseY = getMansionFloorHeight(this.position.x, this.position.z, this.position.y);
    const targetEyeY = currentFloorBaseY + (gameState.isCrouching ? 0.9 : 1.6);
    this.position.y = THREE.MathUtils.damp(this.position.y, targetEyeY, 20, delta);

    // 8. Head bobbing & footsteps
    if (isMoving) {
      const bobFreq = gameState.isSprinting ? 14 : gameState.isCrouching ? 7 : 10;
      this.headbobTimer += delta * bobFreq;
      const bobY = Math.sin(this.headbobTimer) * (gameState.isSprinting ? 0.08 : 0.04);
      const bobX = Math.cos(this.headbobTimer * 0.5) * 0.025;
      this.camera.position.set(this.position.x + bobX, this.position.y + bobY, this.position.z);

      // Footstep audio trigger
      this.footstepTimer += delta;
      const stepDelay = gameState.isSprinting ? 0.28 : gameState.isCrouching ? 0.6 : 0.45;
      if (this.footstepTimer > stepDelay) {
        this.footstepTimer = 0;
        soundManager.playFootstep(gameState.isSprinting, 0);
      }
    } else {
      this.camera.position.copy(this.position);
    }

    // Apply Camera Rotations
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Subtle held frame breathing sway
    if (this.heldFrameMesh.visible) {
      const swayTime = performance.now() * 0.002;
      this.heldFrameMesh.position.y = -0.28 + Math.sin(swayTime * 2) * 0.015;
      this.heldFrameMesh.rotation.z = 0.1 + Math.sin(swayTime) * 0.03;
    }

    // 9. Raycast for interactive objects
    this.checkInteractives(interactives);
  }

  private checkInteractives(interactives: InteractiveObject[]) {
    this.raycaster.setFromCamera(this.tmpScreenCenter, this.camera);
    this.camera.getWorldDirection(this.tmpLookDir);
    let closest: InteractiveObject | null = null;
    let closestDist = 2.8; // interaction reach (meters)

    for (const item of interactives) {
      if (item.collected) continue;
      const dist = this.camera.position.distanceTo(item.position);
      if (dist < closestDist) {
        this.tmpToObj.copy(item.position).sub(this.camera.position).normalize();
        if (this.tmpLookDir.dot(this.tmpToObj) > 0.7) {
          closestDist = dist;
          closest = item;
        }
      }
    }

    this.currentInteractive = closest;
  }

  public handleInteraction() {
    // If player is currently hiding, pressing E unhides them!
    if (gameState.isHiding !== null) {
      soundManager.playHidingAction(false);
      gameState.isHiding = null;
      gameState.currentHidingId = null;
      gameState.showSubtitle('You stepped out of hiding.');
      gameState.notify();
      return;
    }

    if (!this.currentInteractive) return;
    const item = this.currentInteractive;

    switch (item.type) {
      case 'drawer': {
        const isCurrentlyOpen = !!item.isOpen;
        item.isOpen = !isCurrentlyOpen;
        if (item.drawerId) {
          gameState.drawersOpen[item.drawerId] = item.isOpen;
        }

        // Animate drawer sliding
        if (item.drawerMesh) {
          item.drawerMesh.position.z += item.isOpen ? 0.42 : -0.42;
        }

        soundManager.playDrawerSound(item.isOpen);
        item.prompt = item.isOpen ? `Press E to close ${item.name}` : `Press E to open ${item.name}`;
        gameState.showSubtitle(item.isOpen ? `Opened ${item.name}. Look inside!` : `Closed ${item.name}.`);
        gameState.notify();
        break;
      }

      case 'tap': {
        item.isOpen = !item.isOpen;
        soundManager.playWaterTap(item.isOpen);
        if (item.waterStreamMesh) {
          item.waterStreamMesh.visible = item.isOpen;
        }
        item.prompt = item.isOpen ? `Press E to turn off ${item.name}` : `Press E to turn on ${item.name}`;
        item.action?.();
        gameState.showSubtitle(item.isOpen ? `Turned on ${item.name}. Water echoes through the haveli.` : `Turned off ${item.name}.`);
        gameState.notify();
        break;
      }

      case 'switch': {
        item.isOn = item.isOn === undefined ? false : !item.isOn;
        soundManager.playLightSwitch(item.isOn);
        if (item.targetLight) {
          item.targetLight.visible = item.isOn;
        }
        item.prompt = item.isOn ? `Press E to turn off ${item.name}` : `Press E to turn on ${item.name}`;
        item.action?.();
        gameState.showSubtitle(item.isOn ? `Flipped ${item.name} ON.` : `Flipped ${item.name} OFF.`);
        gameState.notify();
        break;
      }

      case 'cutters': {
        gameState.hasBoltCutters = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Use Heavy Bolt Cutters to cut the outer Iron Gate chains.');
        gameState.showSubtitle('Acquired Heavy Bolt Cutters! You can now cut the chains on the outer Iron Gate.');
        gameState.notify();
        break;
      }

      case 'gate_key': {
        gameState.hasGateKey = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Use Heavy Gate Key to unlock the outer Iron Gate padlock.');
        gameState.showSubtitle('Acquired Heavy Gate Key! You can now unlock the brass padlock on the outer Iron Gate.');
        gameState.notify();
        break;
      }

      case 'door': {
        // Exit Door Special Puzzle Logic
        if (item.doorId === 'exitDoor') {
          if (!gameState.framePlacedOnDoor) {
            if (gameState.hasPhotoFrame) {
              // ATTACH THE PHOTO FRAME TO THE DOOR!
              gameState.framePlacedOnDoor = true;
              gameState.hasPhotoFrame = false;
              gameState.exitUnlocked = true;
              gameState.doorsUnlocked.exitDoor = true;
              soundManager.playFramePlacement();
              soundManager.playHeavyLockUnlock();
              gameState.setObjective('The mansion exit is unsealed! Now cut the gate chains and unlock the padlock to escape!');
              gameState.showSubtitle('The ancestor portrait locks into place! The ancient mansion door unlatches! Rush to the courtyard gate!');
            } else {
              gameState.setObjective('Find the missing photo frame from the Mystic Sanctum to unlock the Exit Door.');
              gameState.showSubtitle('The exit door has an empty photo frame recess. "Objective: Find the missing photo frame."');
              soundManager.playCreepyThud(0.4);
            }
          } else {
            // Already unlocked, toggle open
            item.isOpen = !item.isOpen;
            soundManager.playDoorSound(item.isOpen);
            item.mesh.rotation.y = item.isOpen ? -Math.PI / 2 : 0;
            gameState.showSubtitle(item.isOpen ? 'Exit door open! Escape to the courtyard!' : 'Exit door closed.');
          }
          gameState.notify();
          break;
        }

        // Interior doors
        if (item.requiresKey && !gameState[item.requiresKey as keyof typeof gameState]) {
          gameState.showSubtitle(`Locked! You need the ${item.requiresKey === 'hasBrassKey' ? 'Brass Key (check living room drawer)' : 'Sanctum Key (check storage workbench)'}.`);
          soundManager.playCreepyThud(0.3);
          return;
        }

        item.isOpen = !item.isOpen;
        soundManager.playDoorSound(item.isOpen);
        item.mesh.rotation.y = item.isOpen ? Math.PI / 2 : 0;
        gameState.showSubtitle(item.isOpen ? `Opened ${item.name}` : `Closed ${item.name}`);
        break;
      }

      case 'key': {
        if (item.id === 'key-brass') {
          gameState.hasBrassKey = true;
          gameState.showSubtitle('Collected Old Brass Key! Can unlock Master Bedroom upstairs.');
        } else if (item.id === 'key-attic') {
          gameState.hasAtticKey = true;
          gameState.showSubtitle('Collected Sanctum Key! Can unlock the Mystic Sanctum attic.');
        }
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.notify();
        break;
      }

      case 'frame': {
        // Collect Cursed Photo Frame
        gameState.hasPhotoFrame = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        soundManager.playWhisper();
        gameState.setObjective('Bring the Ancestor Photo Frame back to the Grand Exit Door.');
        gameState.showSubtitle('You picked up the Cursed Kalapur Photo Frame! Take it to the exit door without getting caught!');
        gameState.notify();
        break;
      }

      case 'battery': {
        gameState.batteries += 1;
        gameState.flashlightBattery = 100;
        gameState.flashlightOn = true;
        this.flashlight.visible = true;
        this.flashlightBulb.visible = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.showSubtitle('Battery replaced! Flashlight fully charged.');
        gameState.notify();
        break;
      }

      case 'diary': {
        import('./gameState').then(({ DIARY_LORE }) => {
          gameState.activeDiaryNote = DIARY_LORE[item.id] || null;
          if (!gameState.diariesRead.includes(item.id)) {
            gameState.diariesRead.push(item.id);
          }
          soundManager.playItemPickup();
          gameState.notify();
        });
        break;
      }

      case 'hiding': {
        // Enter hiding spot!
        soundManager.playHidingAction(true);
        gameState.isHiding = item.hidingType || 'wardrobe';
        gameState.currentHidingId = item.id;
        if (item.hidingCameraOffset) {
          this.camera.position.copy(item.hidingCameraOffset);
        }
        gameState.showSubtitle(`Hiding inside ${item.name}. Press E to exit.`);
        gameState.notify();
        break;
      }

      case 'crowbar': {
        gameState.hasCrowbar = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Use Heavy Crowbar to pry open the Underground Catacomb Hatch in the Storage Room.');
        gameState.showSubtitle('Acquired Heavy Steel Crowbar! You can pry the iron bars on the Underground Catacomb Hatch.');
        gameState.notify();
        break;
      }

      case 'bell': {
        gameState.hasTantricBell = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Use Sacred Tantric Bell to dispel Tatya Vinchu\'s demonic seal on the Catacomb Hatch.');
        gameState.showSubtitle('Acquired Sacred Tantric Bell! Ringing this will banish the blood seal guarding the Underground Catacombs.');
        gameState.notify();
        break;
      }

      case 'cellar_hatch': {
        // Multi-stage Escape Route 2: Underground Storm Drainage Hatch (Storage Room)
        // Stage 1: Pry rusted cross iron bars with Heavy Crowbar
        if (!gameState.cellarBarsPried) {
          if (gameState.hasCrowbar) {
            gameState.cellarBarsPried = true;
            item.action?.();
            soundManager.playCrowbarPrySound();
            gameState.showSubtitle('CRUNCH! You wedged the Crowbar and shattered the rusted crossbars!');
            gameState.setObjective('The iron bars are pried! Now dispel the glowing Tantric Blood Seal with the Sacred Tantric Bell.');
            gameState.notify();
          } else {
            gameState.showSubtitle('The Underground Hatch is held tight by rusted iron bars! You need the Heavy Steel Crowbar.');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        // Stage 2: Dispel glowing Tantric Blood Seal with Sacred Bell (Ghanta)
        if (!gameState.cellarSealBroken) {
          if (gameState.hasTantricBell) {
            gameState.cellarSealBroken = true;
            item.action?.();
            soundManager.playTantricSealBreak();
            gameState.showSubtitle('SHINGG! The Sacred Tantric Bell resonates! Tatya\'s demonic blood seal shatters into blue mist!');
            gameState.setObjective('The demonic curse is broken! Turn the Bronze Floodgate Sluice Valve to escape under the river!');
            gameState.notify();
          } else {
            gameState.showSubtitle('A glowing red Tantric Blood Seal curses this hatch: "ॐ फट् स्वाहा"! Ring the Sacred Tantric Bell to dispel it.');
            soundManager.playTantricWhisper();
          }
          return;
        }

        // Stage 3: Turn Bronze Floodgate Sluice Valve and Escape!
        gameState.cellarValveTurned = true;
        gameState.cellarUnlocked = true;
        gameState.escapeRouteTaken = 'cellar';
        gameState.isVictory = true;
        gameState.escapeTimeSeconds = Math.round((Date.now() - gameState.gameStartTime) / 1000);
        soundManager.playValveTurnSound();
        setTimeout(() => soundManager.playVictoryCelebration(), 500);
        gameState.showSubtitle('CREAK... The subterranean floodgate opens! YOU ESCAPED THROUGH THE KALAPUR CATACOMBS!');
        window.dispatchEvent(new CustomEvent('kalapur:escaped'));
        gameState.notify();
        break;
      }

      case 'exit_gate': {
        // Multi-stage Hard Escape Gate Logic
        if (!gameState.exitUnlocked) {
          gameState.showSubtitle('The mansion exit is sealed! You must unlock the Grand Exit Door with the Ancestor Photo Frame first.');
          soundManager.playCreepyThud(0.5);
          return;
        }

        // 1. Cut Chains with Bolt Cutters
        if (!gameState.gateChainsCut) {
          if (gameState.hasBoltCutters) {
            gameState.gateChainsCut = true;
            soundManager.playChainCutSound();
            gameState.showSubtitle('You cut through the heavy rusted iron chains with the Bolt Cutters!');
            gameState.setObjective('Now unlock the heavy brass padlock with the Gate Key.');
            gameState.notify();
          } else {
            gameState.showSubtitle('The gate is bound with heavy iron chains! You need Bolt Cutters (hidden in drawers).');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        // 2. Unlock Padlock with Gate Key
        if (!gameState.gatePadlockUnlocked) {
          if (gameState.hasGateKey) {
            gameState.gatePadlockUnlocked = true;
            soundManager.playPadlockUnlockSound();
            gameState.showSubtitle('The heavy brass padlock snaps open! The gate is unlocked!');
            gameState.setObjective('Push open the Iron Gate and escape into the storm!');
            gameState.notify();
          } else {
            gameState.showSubtitle('A heavy brass padlock secures the gate latch! You need the Gate Key (hidden in drawers).');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        // 3. Victory Escape!
        gameState.gateUnlocked = true;
        gameState.escapeRouteTaken = 'gate';
        gameState.isVictory = true;
        gameState.escapeTimeSeconds = Math.round((Date.now() - gameState.gameStartTime) / 1000);
        soundManager.playVictoryCelebration();
        gameState.showSubtitle('YOU PUSHED OPEN THE FORTIFIED IRON GATE AND ESCAPED KALAPUR!');
        window.dispatchEvent(new CustomEvent('kalapur:escaped'));
        break;
      }
    }
  }

  public setPosition(pos: [number, number, number], rotY = 0) {
    this.position.set(pos[0], pos[1], pos[2]);
    this.camera.position.copy(this.position);
    this.velocity.set(0, 0, 0);
    this.keys = {};
    this.touchMove.x = 0;
    this.touchMove.z = 0;
    this.touchLook.x = 0;
    this.touchLook.y = 0;
    this.yaw = rotY;
    this.targetYaw = rotY;
    this.pitch = 0;
    this.targetPitch = 0;
    gameState.isHiding = null;
    gameState.currentHidingId = null;
    gameState.isCrouching = false;
    gameState.isSprinting = false;
    gameState.touchSprint = false;
    gameState.stamina = 100;
    gameState.notify();
  }
}
