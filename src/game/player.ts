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

  // Speeds (Granny Ch 3 balanced control: crisp corners, zero sliding)
  public walkSpeed = 3.25;
  public sprintSpeed = 5.15;
  public crouchSpeed = 1.75;

  // Touch / Mobile Input controls for Android / Google Play Store
  public touchMove = { x: 0, z: 0 };
  public touchLook = { x: 0, y: 0 };

  // Flashlight
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public flashlightBulb: THREE.PointLight;

  // Held Item (Photo Frame in hands)
  public heldFrameMesh: THREE.Group;

  // Vertical Jump & Floor Physics (Granny Ch 3 crisp grounded feel)
  public feetY = 0;
  public verticalVelocity = 0;
  public isGrounded = true;
  private currentEyeHeight = 1.6;

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
    this.camera.rotation.order = 'YXZ';
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
    gameState.onTouchUseBattery = () => {
      this.reloadBattery();
    };
    gameState.onTouchThrowDecoy = () => {
      this.throwDecoy();
    };
    gameState.onTouchStun = () => {
      this.useStunFlash();
    };
    gameState.onTouchJump = () => {
      this.jump();
    };
  }

  public jump() {
    if (
      gameState.isHiding !== null ||
      !this.isGrounded ||
      gameState.isDayTransitioning ||
      gameState.isGameOver ||
      gameState.isVictory
    ) {
      return;
    }
    if (gameState.isCrouching) {
      gameState.isCrouching = false;
      gameState.notify();
    }
    this.verticalVelocity = 6.35;
    this.isGrounded = false;
    soundManager.playJumpSound();
  }

  public throwDecoy() {
    if (gameState.isHiding !== null) {
      gameState.showSubtitle('Step out of hiding before throwing a Decoy Lota!');
      return;
    }
    if (gameState.decoys <= 0) {
      gameState.showSubtitle('No Brass Decoy Lotas left! Search Foyer, Garage, or Secret Passage.');
      return;
    }
    gameState.decoys -= 1;
    this.camera.getWorldDirection(this.tmpLookDir);
    const origin = this.camera.position;
    window.dispatchEvent(
      new CustomEvent('kalapur:throwDecoy', {
        detail: {
          origin: [origin.x + this.tmpLookDir.x * 0.4, origin.y - 0.1, origin.z + this.tmpLookDir.z * 0.4],
          dir: [this.tmpLookDir.x, this.tmpLookDir.y, this.tmpLookDir.z],
        },
      })
    );
    gameState.showSubtitle(`Threw Brass Decoy Lota! (${gameState.decoys} left)`);
    gameState.notify();
  }

  public useStunFlash() {
    if (gameState.isHiding !== null) {
      gameState.showSubtitle('Step out of hiding before scattering Sacred Vibhuti!');
      return;
    }
    if (gameState.stunCooldown > 0) {
      return;
    }
    if (gameState.stunCharges <= 0) {
      gameState.showSubtitle('No Sacred Vibhuti pouches left! Find more in Puja Shrine or 3F Attic.');
      return;
    }
    gameState.stunCharges -= 1;
    gameState.stunCooldown = 2.5;
    soundManager.playStunBlast();
    window.dispatchEvent(
      new CustomEvent('kalapur:stunBlast', {
        detail: {
          origin: [this.position.x, this.position.y, this.position.z],
        },
      })
    );
    gameState.notify();
  }

  public reloadBattery() {
    if (gameState.useSpareBattery()) {
      this.flashlight.visible = true;
      this.flashlightBulb.visible = true;
      soundManager.playFlashlightClick(true);
      soundManager.playItemPickup();
      gameState.showSubtitle(`Battery replaced! (${gameState.batteries} spare remaining)`);
    } else if (gameState.batteries <= 0) {
      gameState.showSubtitle('No spare batteries left! Search drawers and tables.');
    } else {
      gameState.showSubtitle('Flashlight battery is already full.');
    }
  }

  private setupListeners(domElement: HTMLElement) {
    this.onKeyDownHandler = (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }
      if (e.code === 'KeyR') {
        this.reloadBattery();
      }
      if (e.code === 'KeyQ') {
        this.throwDecoy();
      }
      if (e.code === 'KeyG' && !e.repeat) {
        this.useStunFlash();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        gameState.showBlueprintMap = !gameState.showBlueprintMap;
        gameState.notify();
      }
      if (e.code === 'KeyC') {
        gameState.isCrouching = !gameState.isCrouching;
        gameState.notify();
      }
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.jump();
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
      const userSens = gameState.settings.mouseSensitivity || 0.85;
      const sens = 0.0021 * userSens;
      const dx = Math.max(-160, Math.min(160, e.movementX));
      const dy = Math.max(-160, Math.min(160, e.movementY));

      this.targetYaw -= dx * sens;
      this.targetPitch -= dy * sens;
      this.targetPitch = Math.max(-Math.PI / 2.35, Math.min(Math.PI / 2.35, this.targetPitch));

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
    if (gameState.stunCooldown > 0) {
      gameState.stunCooldown = Math.max(0, gameState.stunCooldown - delta);
    }

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
          this.flashlight.intensity = Math.random() < 0.3 ? 0.08 : (1.2 + Math.random() * 2.6);
          this.flashlightBulb.intensity = Math.random() < 0.3 ? 0.08 : 0.4;
        } else {
          this.flashlight.intensity = 4.6;
          this.flashlightBulb.intensity = 0.95;
        }
      } else if (gameState.flashlightBattery < 15) {
        this.flashlight.intensity = Math.random() > 0.3 ? 3.8 : 0.7;
        this.flashlightBulb.intensity = Math.random() > 0.3 ? 0.9 : 0.25;
      } else {
        this.flashlight.intensity = 4.5;
        this.flashlightBulb.intensity = 0.95;
      }
    }

    // 2. Held Photo Frame Visibility
    this.heldFrameMesh.visible = gameState.hasPhotoFrame && !gameState.framePlacedOnDoor && gameState.isHiding === null;

    // 2B. Apply Touch / Drag Look with full unclamped float continuity
    const rawLookX = this.touchLook.x + gameState.touchLook.x;
    const rawLookY = this.touchLook.y + gameState.touchLook.y;
    if (rawLookX !== 0 || rawLookY !== 0) {
      const lookX = Math.max(-180, Math.min(180, rawLookX));
      const lookY = Math.max(-180, Math.min(180, rawLookY));
      const touchSens = 0.0032 * (gameState.settings.mouseSensitivity || 0.85);
      this.targetYaw -= lookX * touchSens;
      this.targetPitch -= lookY * touchSens;
      this.targetPitch = Math.max(-Math.PI / 2.35, Math.min(Math.PI / 2.35, this.targetPitch));
      if (gameState.isHiding !== null) {
        this.targetYaw = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetYaw));
        this.targetPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetPitch));
      }
    }
    this.touchLook.x = 0;
    this.touchLook.y = 0;
    gameState.touchLook.x = 0;
    gameState.touchLook.y = 0;

    // Silky velvet camera glide (smooth sub-frame interpolation for zero stutter when looking left/right/up/down)
    this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 16.5, delta);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 16.5, delta);
    if (Math.abs(this.targetYaw - this.yaw) < 0.00005) this.yaw = this.targetYaw;
    if (Math.abs(this.targetPitch - this.pitch) < 0.00005) this.pitch = this.targetPitch;

    // 3. If player is hiding in wardrobe or under bed
    if (gameState.isHiding !== null) {
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
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

    // 5. Compute Move Direction (Keyboard + Touch Joystick with Deadzone & Crisp Response)
    const keyX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const keyZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);
    let rawTouchX = this.touchMove.x + gameState.touchMove.x;
    let rawTouchZ = this.touchMove.z + gameState.touchMove.z;
    const touchMag = Math.hypot(rawTouchX, rawTouchZ);
    if (touchMag > 0.08) {
      const scaledMag = Math.min(1, (touchMag - 0.08) / 0.92);
      rawTouchX = (rawTouchX / touchMag) * scaledMag;
      rawTouchZ = (rawTouchZ / touchMag) * scaledMag;
    } else {
      rawTouchX = 0;
      rawTouchZ = 0;
    }

    const moveX = keyX + rawTouchX;
    const moveZ = keyZ + rawTouchZ;
    const inputLen = Math.hypot(moveX, moveZ);
    const isMoving = inputLen > 0.05;
    this.isMoving = isMoving;

    const moveSens = Math.max(0.5, Math.min(1.8, gameState.settings.movementSensitivity ?? 1.0));
    let targetSpeed = this.walkSpeed * moveSens;
    if (gameState.isSprinting) targetSpeed = this.sprintSpeed * moveSens;
    if (gameState.isCrouching) targetSpeed = this.crouchSpeed * moveSens;

    const speedFactor = Math.min(1, inputLen);
    this.tmpMoveVec.set(moveX, 0, moveZ);
    if (this.tmpMoveVec.lengthSq() > 0) {
      this.tmpMoveVec.normalize();
      this.tmpMoveVec.applyAxisAngle(this.tmpUpVec, this.yaw);
    }

    // Granny Ch 3 Crisp Grounded Movement: instant stop on release, snappy accel on press (zero sliding!)
    const targetVelX = this.tmpMoveVec.x * targetSpeed * speedFactor;
    const targetVelZ = this.tmpMoveVec.z * targetSpeed * speedFactor;
    if (isMoving) {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, 26, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, 26, delta);
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 55, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 55, delta);
      if (Math.abs(this.velocity.x) < 0.05) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.05) this.velocity.z = 0;
    }

    // 6. Proposed new position with elevation-aware wall & closed-door collision + sliding
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    // Player bounding radius = 0.28m (Smooth sliding through doorways and corners)
    const playerRadius = 0.28;
    const playerKneeY = this.feetY + 0.32;
    const playerHeadY = this.feetY + (gameState.isCrouching ? 0.95 : 1.7);

    this.tmpBoxMin.set(nextX - playerRadius, playerKneeY, this.position.z - playerRadius);
    this.tmpBoxMax.set(nextX + playerRadius, playerHeadY, this.position.z + playerRadius);
    this.tmpBoxX.set(this.tmpBoxMin, this.tmpBoxMax);

    this.tmpBoxMin.set(this.position.x - playerRadius, playerKneeY, nextZ - playerRadius);
    this.tmpBoxMax.set(this.position.x + playerRadius, playerHeadY, nextZ + playerRadius);
    this.tmpBoxZ.set(this.tmpBoxMin, this.tmpBoxMax);

    let collideX = false;
    let collideZ = false;

    for (const box of colliders) {
      if (box.max.y <= playerKneeY || box.min.y >= playerHeadY) {
        continue;
      }
      if (box.intersectsBox(this.tmpBoxX)) collideX = true;
      if (box.intersectsBox(this.tmpBoxZ)) collideZ = true;
    }

    // Closed doors & closed secret revolving bookcase block movement until opened
    for (const item of interactives) {
      if (
        (item.type === 'door' || item.type === 'secret_bookcase') &&
        !item.isOpen &&
        item.colliderBox
      ) {
        const box = item.colliderBox;
        if (box.max.y <= playerKneeY || box.min.y >= playerHeadY) {
          continue;
        }
        if (box.intersectsBox(this.tmpBoxX)) collideX = true;
        if (box.intersectsBox(this.tmpBoxZ)) collideZ = true;
      }
    }

    if (!collideX) this.position.x = nextX;
    if (!collideZ) this.position.z = nextZ;

    // 7. Vertical Jump Gravity, Surface-Top Landing & Multi-Level Floor Elevation
    let supportY = getMansionFloorHeight(this.position.x, this.position.z, this.feetY);
    for (const box of colliders) {
      if (
        box.min.x <= this.position.x + 0.24 &&
        box.max.x >= this.position.x - 0.24 &&
        box.min.z <= this.position.z + 0.24 &&
        box.max.z >= this.position.z - 0.24 &&
        box.max.y <= this.feetY + 0.24 &&
        box.max.y >= supportY &&
        box.max.y - supportY <= 1.55
      ) {
        supportY = box.max.y;
      }
    }

    this.verticalVelocity -= 18.5 * delta;
    this.feetY += this.verticalVelocity * delta;

    // Clamp head clearance inside low Underground Crypt chamber (ceiling at -0.25)
    if (this.feetY < -0.45 && this.feetY > -1.98 && this.position.z < -6.8) {
      this.feetY = -1.98;
      if (this.verticalVelocity > 0) this.verticalVelocity = 0;
    }

    if (this.feetY <= supportY) {
      if (!this.isGrounded && this.verticalVelocity < -3.2) {
        const landSurface: 'wood' | 'stone' | 'water' =
          supportY < -0.5
            ? 'water'
            : supportY < 1.5 && (Math.abs(this.position.x) < 6.0 || this.position.z > 16.5 || this.position.z < -8.0 || this.position.x < -5.8)
            ? 'stone'
            : 'wood';
        soundManager.playLandSound(landSurface);
      }
      this.feetY = supportY;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    } else if (this.feetY > supportY + 0.08) {
      this.isGrounded = false;
    }

    const targetEyeOffset = gameState.isCrouching ? 0.9 : 1.6;
    this.currentEyeHeight = THREE.MathUtils.damp(this.currentEyeHeight, targetEyeOffset, 22, delta);
    this.position.y = this.feetY + this.currentEyeHeight;

    // Sync live checkpoint coordinates
    gameState.checkpointPos[0] = this.position.x;
    gameState.checkpointPos[1] = this.position.y;
    gameState.checkpointPos[2] = this.position.z;
    gameState.checkpointRot = this.yaw;

    // 8. Rock-Solid Granny Ch 3 Camera Stability + Grounded Footsteps
    const nowSec = performance.now() * 0.001;
    if (isMoving && this.isGrounded) {
      const bobFreq = gameState.isSprinting ? 12 : gameState.isCrouching ? 6.5 : 9;
      this.headbobTimer += delta * bobFreq;
      const bobY = gameState.settings.cameraHeadBob
        ? Math.sin(this.headbobTimer) * (gameState.isSprinting ? 0.028 : 0.015)
        : 0;
      this.camera.position.set(this.position.x, this.position.y + bobY, this.position.z);

      // Surface-aware Footstep Audio
      this.footstepTimer += delta;
      const stepDelay = gameState.isSprinting ? 0.31 : gameState.isCrouching ? 0.62 : 0.47;
      if (this.footstepTimer > stepDelay) {
        this.footstepTimer = 0;
        const surface: 'wood' | 'stone' | 'water' =
          supportY < -0.5
            ? 'water'
            : supportY < 1.5 && (Math.abs(this.position.x) < 6.0 || this.position.z > 16.5 || this.position.z < -8.0 || this.position.x < -5.8)
            ? 'stone'
            : 'wood';
        soundManager.playFootstep(gameState.isSprinting, 0, surface);
      }
    } else {
      // Zero idle sway — completely steady horizon when standing still or airborne
      this.camera.position.set(this.position.x, this.position.y, this.position.z);
    }

    // Steady FOV (minimal sprint widening, zero chase jitter)
    let targetFov = 74;
    if (gameState.isSprinting && isMoving) {
      targetFov = 76;
    } else if (gameState.isCrouching) {
      targetFov = 72;
    }
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, delta);
    if (Math.abs(nextFov - this.camera.fov) > 0.02) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }

    // Crisp Flashlight Beam Centered on Crosshair
    this.flashlightTarget.position.x = THREE.MathUtils.damp(this.flashlightTarget.position.x, 0, 42, delta);
    this.flashlightTarget.position.y = THREE.MathUtils.damp(this.flashlightTarget.position.y, 0, 42, delta);

    // Apply Gimbal-Free 'YXZ' Camera Orientation (Zero horizon roll/tilt!)
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // Subtle held frame sway
    if (this.heldFrameMesh.visible) {
      const swayTime = nowSec * 1.5;
      this.heldFrameMesh.position.y = -0.28 + Math.sin(swayTime * 2) * 0.008;
      this.heldFrameMesh.rotation.z = 0.08;
    }

    // 9. Raycast for interactive objects
    this.checkInteractives(interactives);
  }

  private checkInteractives(interactives: InteractiveObject[]) {
    this.raycaster.setFromCamera(this.tmpScreenCenter, this.camera);
    this.camera.getWorldDirection(this.tmpLookDir);
    let closest: InteractiveObject | null = null;
    let closestScore = 3.0; // interaction reach (meters)

    for (const item of interactives) {
      if (item.collected) continue;
      // Never allow grabbing a key/tool through a closed drawer
      if (item.type !== 'drawer' && item.drawerId && !gameState.drawersOpen[item.drawerId]) {
        continue;
      }
      if (item.drawerId) {
        item.mesh.getWorldPosition(item.position);
      }
      const dist = this.camera.position.distanceTo(item.position);
      if (dist < 3.0) {
        this.tmpToObj.copy(item.position).sub(this.camera.position).normalize();
        if (this.tmpLookDir.dot(this.tmpToObj) > 0.66) {
          // Prioritize items resting inside an open drawer over closing the drawer itself
          const effectiveScore = item.type === 'drawer' && item.isOpen ? dist + 0.55 : dist;
          if (effectiveScore < closestScore) {
            closestScore = effectiveScore;
            closest = item;
          }
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

        // Smooth sliding target for GameCanvas animation loop
        if (item.drawerMesh) {
          if (item.drawerMesh.userData.baseZ === undefined) {
            item.drawerMesh.userData.baseZ = item.drawerMesh.position.z;
          }
          item.drawerMesh.userData.targetPosZ =
            item.drawerMesh.userData.baseZ + (item.isOpen ? 0.42 : 0);
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
          item.targetLight.userData.switchedOff = !item.isOn;
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
            // Already unlocked, toggle smooth swing open/closed
            item.isOpen = !item.isOpen;
            soundManager.playDoorSound(item.isOpen);
            item.mesh.userData.targetRotY = item.isOpen ? -Math.PI / 2 : 0;
            gameState.showSubtitle(item.isOpen ? 'Exit door open! Escape to the courtyard!' : 'Exit door closed.');
          }
          gameState.notify();
          break;
        }

        // Interior doors (Sanctum Key also serves as a Master Skeleton Key for Master Bedroom)
        const hasMatchingKey =
          !item.requiresKey ||
          !!gameState[item.requiresKey as keyof typeof gameState] ||
          (item.requiresKey === 'hasBrassKey' && gameState.hasAtticKey);
        if (!hasMatchingKey) {
          gameState.showSubtitle(`Locked! You need the Brass Key or Sanctum Key (search drawers).`);
          soundManager.playCreepyThud(0.3);
          return;
        }

        item.isOpen = !item.isOpen;
        soundManager.playDoorSound(item.isOpen);
        item.mesh.userData.targetRotY = item.isOpen ? Math.PI / 2 : 0;
        item.prompt = item.isOpen ? `Close ${item.name}` : `Open ${item.name}`;
        gameState.showSubtitle(item.isOpen ? `Opened ${item.name}` : `Closed ${item.name}`);
        break;
      }

      case 'key': {
        if (item.id === 'key-brass') {
          gameState.hasBrassKey = true;
          gameState.showSubtitle('Collected Old Brass Key! Can unlock Master Bedroom upstairs.');
        } else if (item.id === 'key-attic') {
          gameState.hasAtticKey = true;
          gameState.showSubtitle('Collected Sanctum Master Key! Mystic Sanctum is open — also unlocks Master Bedroom!');
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

      case 'fuel_can': {
        gameState.hasFuelCan = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Pour Petrol into the 1954 Escape Car inside the East Courtyard Garage!');
        gameState.showSubtitle('Acquired Fuel Jerrycan! Head to the East Garage via Courtyard or Puja side door.');
        gameState.notify();
        break;
      }

      case 'car_battery': {
        gameState.hasCarBattery = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Install the Car Battery under the hood of the 1954 Sedan in the East Garage!');
        gameState.showSubtitle('Acquired 12V Car Battery! Install it in the 1954 Garage Sedan.');
        gameState.notify();
        break;
      }

      case 'car_key': {
        gameState.hasCarKey = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Start the fueled & powered 1954 Sedan in the East Garage to drive out!');
        gameState.showSubtitle('Acquired Car Ignition Key! Now start the 1954 Vintage Sedan in the East Garage!');
        gameState.notify();
        break;
      }

      case 'oars': {
        gameState.hasBoatOars = true;
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.setObjective('Descend to the Underground River Crypt Boat Dock beneath Storage Wing!');
        gameState.showSubtitle('Acquired Wooden Boat Oars! Break the Crypt floodgate bars & seal to row to freedom!');
        gameState.notify();
        break;
      }

      case 'decoy_pickup': {
        if (gameState.decoys >= gameState.maxDecoys) {
          gameState.showSubtitle('Decoy Lota pouch is already full!');
          return;
        }
        gameState.decoys = Math.min(gameState.maxDecoys, gameState.decoys + 1);
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.showSubtitle(`Picked up Brass Decoy Lota! Press [Q] or LURE to distract Tatya. (${gameState.decoys}/${gameState.maxDecoys})`);
        gameState.notify();
        break;
      }

      case 'stun_pickup': {
        if (gameState.stunCharges >= gameState.maxStunCharges) {
          gameState.showSubtitle('Sacred Vibhuti pouch is already full!');
          return;
        }
        gameState.stunCharges = Math.min(gameState.maxStunCharges, gameState.stunCharges + 1);
        item.collected = true;
        item.action?.();
        soundManager.playItemPickup();
        gameState.showSubtitle(`Collected Sacred Vibhuti Ash! Press [G] or STUN near Villain to freeze them for 9s! (${gameState.stunCharges}/${gameState.maxStunCharges})`);
        gameState.notify();
        break;
      }

      case 'secret_bookcase': {
        item.isOpen = !item.isOpen;
        gameState.secretPassageOpen = item.isOpen;
        item.mesh.userData.targetRotY = item.isOpen ? Math.PI / 2 : 0;
        soundManager.playSecretPassageGrind();
        item.prompt = item.isOpen ? 'Close Revolving Bookshelf [E]' : 'Pull Suspicious Book [E]';
        gameState.showSubtitle(
          item.isOpen
            ? 'RUMBLE... The antique bookshelf swings open, revealing the Secret Archive shortcut to Mystic Sanctum!'
            : 'The revolving bookshelf latches shut.'
        );
        gameState.notify();
        break;
      }

      case 'breaker_box': {
        if (!gameState.breakerPowerOn) {
          gameState.breakerPowerOn = true;
          soundManager.playBreakerRestore();
          gameState.showSubtitle('CLACK! Main Breaker restored! The haveli lanterns flare back to life!');
        } else {
          soundManager.playLightSwitch(true);
          gameState.showSubtitle('Main Power Breaker is ON and energized.');
        }
        gameState.notify();
        break;
      }

      case 'mirror_spook': {
        soundManager.playWhisper();
        soundManager.playTantricWhisper(0);
        gameState.screenGlitchIntensity = 0.65;
        gameState.showSubtitle('Your reflection freezes and grins back... Tatya Vinchu watches through the silver glass!', 3600);
        window.setTimeout(() => {
          if (gameState.ghostState !== 'chase') {
            gameState.screenGlitchIntensity = 0;
          }
        }, 500);
        gameState.notify();
        break;
      }

      case 'escape_car': {
        if (!gameState.carFueled) {
          if (gameState.hasFuelCan) {
            gameState.carFueled = true;
            soundManager.playValveTurnSound();
            gameState.showSubtitle('GLUG... Petrol poured into the 1954 Sedan! Now wire the Car Battery & turn Ignition Key.');
            gameState.setObjective('1954 Sedan fueled! Install Car Battery and turn Ignition Key in East Garage.');
            gameState.notify();
          } else {
            gameState.showSubtitle('The 1954 Sedan fuel tank is bone dry! Find the Fuel Jerrycan hidden inside the haveli drawers.');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        if (!gameState.carBatteryInstalled) {
          if (gameState.hasCarBattery) {
            gameState.carBatteryInstalled = true;
            soundManager.playBreakerRestore();
            gameState.showSubtitle('SNAP! 12V Battery wired — twin headlights blaze through the garage mist! Turn the Ignition Key!');
            gameState.setObjective('Headlights blazing! Use the Car Ignition Key to smash out of Kalapur Garage!');
            gameState.notify();
          } else {
            gameState.showSubtitle('No electrical spark! Find and install the 12V Car Battery first.');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        if (!gameState.hasCarKey) {
          gameState.showSubtitle('Dashboard lights are glowing, but the Car Ignition Key is missing! Search drawers!');
          soundManager.playCreepyThud(0.4);
          return;
        }

        gameState.carStarted = true;
        gameState.escapeRouteTaken = 'car';
        gameState.isVictory = true;
        gameState.escapeTimeSeconds = Math.round((Date.now() - gameState.gameStartTime) / 1000);
        soundManager.playCarIgnitionRoar();
        setTimeout(() => soundManager.playVictoryCelebration(), 700);
        gameState.showSubtitle('VROOOOM! The 1954 Sedan smashes through the garage shutter into the storm! YOU ESCAPED!');
        window.dispatchEvent(new CustomEvent('kalapur:escaped'));
        gameState.notify();
        break;
      }

      case 'escape_boat': {
        // Multi-stage Escape Route 2: Underground River Crypt Boat Dock (Y = -3.0)
        if (!gameState.cellarBarsPried) {
          if (gameState.hasCrowbar) {
            gameState.cellarBarsPried = true;
            item.action?.();
            soundManager.playCrowbarPrySound();
            gameState.showSubtitle('CRUNCH! You pried open the rusted floodgate iron bars with the Heavy Crowbar!');
            gameState.setObjective('Floodgate bars removed! Dispel the Crimson Blood Seal with the Sacred Tantric Bell.');
            gameState.notify();
          } else {
            gameState.showSubtitle('Rusted iron floodgate bars block the river boat! Find the Heavy Steel Crowbar in drawers.');
            soundManager.playCreepyThud(0.4);
          }
          return;
        }

        if (!gameState.cellarSealBroken) {
          if (gameState.hasTantricBell) {
            gameState.cellarSealBroken = true;
            item.action?.();
            soundManager.playTantricSealBreak();
            gameState.showSubtitle('SHINGG! The Sacred Tantric Bell shatters Tatya\'s river blood ward! Now row out with Boat Oars!');
            gameState.setObjective('Canal ward broken! Use the Wooden Boat Oars (Secret Archive) to row down the underground river!');
            gameState.notify();
          } else {
            gameState.showSubtitle('A glowing Tantric Blood Seal blocks the canal arch! Ring the Sacred Tantric Bell to shatter it.');
            soundManager.playTantricWhisper();
          }
          return;
        }

        if (!gameState.hasBoatOars) {
          gameState.showSubtitle('The boat is unsealed, but has no paddles! Find Wooden Boat Oars inside the Secret Library Archive.');
          soundManager.playCreepyThud(0.4);
          return;
        }

        gameState.cellarValveTurned = true;
        gameState.cellarUnlocked = true;
        gameState.escapeRouteTaken = 'cellar';
        gameState.isVictory = true;
        gameState.escapeTimeSeconds = Math.round((Date.now() - gameState.gameStartTime) / 1000);
        soundManager.playBoatOarSplash();
        setTimeout(() => soundManager.playVictoryCelebration(), 600);
        gameState.showSubtitle('SPLASH... You row silently down the underground Kalapur river into the storm! YOU ESCAPED!');
        window.dispatchEvent(new CustomEvent('kalapur:escaped'));
        gameState.notify();
        break;
      }

      case 'exit_gate': {
        // Multi-stage Escape Route 1: Front Courtyard Iron Gate
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
    this.feetY = Math.max(-3.0, pos[1] - 1.6);
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.currentEyeHeight = 1.6;
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
    this.camera.rotation.set(0, rotY, 0, 'YXZ');
    this.camera.fov = 74;
    this.camera.updateProjectionMatrix();
    this.flashlight.visible = gameState.flashlightOn && gameState.flashlightBattery > 0;
    this.flashlightBulb.visible = this.flashlight.visible;
    gameState.isHiding = null;
    gameState.currentHidingId = null;
    gameState.isCrouching = false;
    gameState.isSprinting = false;
    gameState.touchSprint = false;
    gameState.stamina = 100;
    gameState.checkpointPos = [pos[0], pos[1], pos[2]];
    gameState.checkpointRot = rotY;
    gameState.notify();
  }
}
