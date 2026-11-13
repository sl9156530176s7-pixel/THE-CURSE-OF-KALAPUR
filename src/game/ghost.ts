import * as THREE from 'three';
import {
  createGhostFaceTexture,
  createTatyaDollFaceTexture,
  createTatyaPlaidShirtTexture,
  createTatyaWallPhotoTexture,
} from './textures';
import { soundManager } from '../audio/SoundManager';
import { gameState } from './gameState';
import { getMansionFloorHeight, InteractiveObject } from './houseGeometry';

export type GhostState = 'patrol' | 'investigate' | 'search' | 'chase';

export class KalapurGhost {
  public mesh: THREE.Group;
  public state: GhostState = 'patrol';

  // Navigation
  public position: THREE.Vector3;
  private waypoints: THREE.Vector3[];
  private currentWaypointIndex = 0;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();

  // Speeds
  public patrolSpeed = 2.0;
  public chaseSpeed = 4.2;
  public currentSpeed = 2.0;

  // AI Timers & memory
  private stateTimer = 0;
  public sightKillTimer = 0;
  private lastKnownPlayerPos: THREE.Vector3 = new THREE.Vector3();
  private hasDirectVision = false;
  private footstepTimer = 0;
  private floatOffset = 0;

  // Meshes for animation
  private headMesh: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private shroudMesh: THREE.Mesh;
  private eyesLight: THREE.PointLight;

  // Tatya Vinchu specific parts
  public ghostGroup: THREE.Group;
  public tatyaGroup: THREE.Group;
  private tatyaHead: THREE.Group;
  private tatyaJaw: THREE.Group;
  private tatyaLeftArm: THREE.Group;
  private tatyaRightArm: THREE.Group;
  private tatyaLeftLeg: THREE.Group;
  private tatyaRightLeg: THREE.Group;
  private tatyaBlade: THREE.Group;
  private lastSpottedDialogueTime = 0;
  private isChantingDialogue = false;

  constructor(waypoints: THREE.Vector3[]) {
    this.waypoints = waypoints;
    this.position = waypoints[0]?.clone() || new THREE.Vector3(0, 4.5, -14);

    this.mesh = new THREE.Group();
    this.mesh.name = 'KalapurVillain';
    this.mesh.position.copy(this.position);

    // ==========================================
    // 1. THE KALAPUR GHOST (Matriarch Specter)
    // ==========================================
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.name = 'KalapurGhost';

    // Shroud Body
    const shroudGeo = new THREE.ConeGeometry(0.75, 2.4, 12, 4, true);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0xcdc5b5,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    this.shroudMesh = new THREE.Mesh(shroudGeo, shroudMat);
    this.shroudMesh.position.y = 1.2;
    this.shroudMesh.castShadow = true;
    this.ghostGroup.add(this.shroudMesh);

    // Frills
    for (let f = 0; f < 8; f++) {
      const angle = (f / 8) * Math.PI * 2;
      const frill = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.6), shroudMat);
      frill.position.set(Math.cos(angle) * 0.7, 0.25, Math.sin(angle) * 0.7);
      frill.rotation.y = -angle;
      this.ghostGroup.add(frill);
    }

    // Torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.8 })
    );
    torso.position.y = 1.8;
    this.ghostGroup.add(torso);

    // Head
    const faceTex = createGhostFaceTexture();
    this.headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7, metalness: 0.1 })
    );
    this.headMesh.position.y = 2.45;
    this.headMesh.castShadow = true;
    this.ghostGroup.add(this.headMesh);

    // Hair
    const hair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.45, 1.4, 8, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x090706, roughness: 0.95 })
    );
    hair.position.set(0, 2.1, -0.05);
    this.ghostGroup.add(hair);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0xb5aea0, roughness: 0.8 });
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.42, 2.1, 0);
    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8), armMat);
    upperArmL.position.set(0, -0.4, 0.1);
    upperArmL.rotation.x = -0.5;
    this.leftArm.add(upperArmL);
    this.ghostGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.42, 2.1, 0);
    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8), armMat);
    upperArmR.position.set(0, -0.4, 0.1);
    upperArmR.rotation.x = -0.6;
    this.rightArm.add(upperArmR);
    this.ghostGroup.add(this.rightArm);

    this.mesh.add(this.ghostGroup);

    // ==========================================
    // 2. TATYA VINCHOO (Upgraded Authentic Indian Horror Puppet Doll)
    // ==========================================
    this.tatyaGroup = new THREE.Group();
    this.tatyaGroup.name = 'TatyaVinchoo';

    const tatyaPlaidTex = createTatyaPlaidShirtTexture();
    const tatyaFaceTex = createTatyaDollFaceTexture();

    const plaidMat = new THREE.MeshStandardMaterial({
      map: tatyaPlaidTex,
      roughness: 0.75,
      metalness: 0.05,
    });

    const dollSkinMat = new THREE.MeshStandardMaterial({
      map: tatyaFaceTex,
      color: 0xfde2d7,
      roughness: 0.45,
      metalness: 0.08,
    });

    const bluePantMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.85,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.35,
      metalness: 0.15,
    });

    const woodSoleMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.85,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.25,
    });

    const steelBladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.12,
    });

    const bloodMat = new THREE.MeshStandardMaterial({
      color: 0x990000,
      roughness: 0.1,
      metalness: 0.2,
    });

    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.3,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.95,
    });

    // --- Tatya Torso & Authentic Outfit ---
    const tatyaTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.46, 0.95, 14),
      plaidMat
    );
    tatyaTorso.position.y = 1.05;
    tatyaTorso.castShadow = true;
    this.tatyaGroup.add(tatyaTorso);

    // Shirt 3D Collar Flaps
    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.22), plaidMat);
    collarL.position.set(-0.16, 1.48, 0.22);
    collarL.rotation.set(0.3, 0.2, -0.2);
    const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.22), plaidMat);
    collarR.position.set(0.16, 1.48, 0.22);
    collarR.rotation.set(0.3, -0.2, 0.2);
    this.tatyaGroup.add(collarL, collarR);

    // Denim Dungarees / Suspenders Straps over Shoulders
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.04), bluePantMat);
    strapL.position.set(-0.2, 1.05, 0.4);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.04), bluePantMat);
    strapR.position.set(0.2, 1.05, 0.4);
    // Brass Buckles on Straps
    const buckleL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), brassMat);
    buckleL.position.set(-0.2, 1.25, 0.42);
    const buckleR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), brassMat);
    buckleR.position.set(0.2, 1.25, 0.42);
    this.tatyaGroup.add(strapL, strapR, buckleL, buckleR);

    // Dark Wooden Buttons down Shirt Placket
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), shoeMat);
      btn.position.set(0, 0.85 + b * 0.22, 0.43);
      btn.rotation.x = Math.PI / 2;
      this.tatyaGroup.add(btn);
    }

    // Blue Bowtie at Collar
    const bowTieL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), bluePantMat);
    bowTieL.rotation.z = Math.PI / 2;
    bowTieL.position.set(-0.11, 1.46, 0.42);
    const bowTieR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), bluePantMat);
    bowTieR.rotation.z = -Math.PI / 2;
    bowTieR.position.set(0.11, 1.46, 0.42);
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), bluePantMat);
    bowKnot.position.set(0, 1.46, 0.44);
    this.tatyaGroup.add(bowTieL, bowTieR, bowKnot);

    // Sacred Tantrik Neck Cord with Brass Scorpion (Vinchu) Amulet
    const neckThread = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 20), bloodMat);
    neckThread.position.set(0, 1.48, 0.05);
    neckThread.rotation.x = Math.PI / 2;
    const scorpionAmulet = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 5), brassMat);
    scorpionAmulet.position.set(0, 1.34, 0.42);
    scorpionAmulet.rotation.z = Math.PI;
    this.tatyaGroup.add(neckThread, scorpionAmulet);

    // --- ARTICULATED HEAD (With Real Movie Face Photo & Articulated Puppet Jaw) ---
    this.tatyaHead = new THREE.Group();
    this.tatyaHead.position.set(0, 1.82, 0);

    // Real Zapatlela Movie Photo Texture
    const tatyaPhotoTex = createTatyaWallPhotoTexture();
    const tatyaPhotoMat = new THREE.MeshStandardMaterial({
      map: tatyaPhotoTex,
      roughness: 0.52,
      metalness: 0.04,
    });

    // Head Cranium
    const headCranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 24, 24),
      dollSkinMat
    );
    headCranium.castShadow = true;
    this.tatyaHead.add(headCranium);

    // Front Face Mask with Real Tatya Vinchu Photo (authentic relief)
    const faceMaskGeo = new THREE.CylinderGeometry(0.366, 0.354, 0.54, 32, 1, true, -Math.PI * 0.38, Math.PI * 0.76);
    faceMaskGeo.rotateY(Math.PI);
    const faceMask = new THREE.Mesh(faceMaskGeo, tatyaPhotoMat);
    faceMask.position.set(0, -0.01, 0.04);
    faceMask.renderOrder = 2;
    this.tatyaHead.add(faceMask);

    // Red Tantrik Tilak on Forehead
    const tilak = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), bloodMat);
    tilak.position.set(0, 0.16, 0.36);
    tilak.rotation.x = Math.PI / 2;
    const chandanDot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), brassMat);
    chandanDot.position.set(0, 0.12, 0.37);
    this.tatyaHead.add(tilak, chandanDot);

    // Eyeballs (3D Glossy Demonic Glass Doll Eyes)
    const eyeSocketL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), shoeMat);
    eyeSocketL.position.set(-0.13, 0.06, 0.32);
    const eyeballL = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
    );
    eyeballL.position.set(-0.13, 0.06, 0.33);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), bloodMat);
    pupilL.position.set(-0.13, 0.06, 0.39);
    this.tatyaHead.add(eyeSocketL, eyeballL, pupilL);

    const eyeSocketR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), shoeMat);
    eyeSocketR.position.set(0.13, 0.06, 0.32);
    const eyeballR = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
    );
    eyeballR.position.set(0.13, 0.06, 0.33);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), bloodMat);
    pupilR.position.set(0.13, 0.06, 0.39);
    this.tatyaHead.add(eyeSocketR, eyeballR, pupilR);

    // High Arched Menacing Wooden Eyebrows
    const browL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.04), shoeMat);
    browL.position.set(-0.14, 0.15, 0.34);
    browL.rotation.set(0.1, 0, -0.35);
    const browR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.04), shoeMat);
    browR.position.set(0.14, 0.15, 0.34);
    browR.rotation.set(0.1, 0, 0.35);
    this.tatyaHead.add(browL, browR);

    // Pointed Puppet Nose
    const puppetNose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), dollSkinMat);
    puppetNose.position.set(0, -0.01, 0.39);
    puppetNose.rotation.x = Math.PI / 2;
    this.tatyaHead.add(puppetNose);

    // Upper Teeth (Sharp Carved Wooden Teeth pointing down)
    const upperJawGroup = new THREE.Group();
    upperJawGroup.position.set(0, -0.11, 0.31);
    for (let t = -3; t <= 3; t++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.045, 4), teethMat);
      tooth.position.set(t * 0.035, 0, 0);
      tooth.rotation.x = Math.PI;
      upperJawGroup.add(tooth);
    }
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.04), bloodMat);
    upperLip.position.set(0, 0.02, 0.02);
    upperJawGroup.add(upperLip);
    this.tatyaHead.add(upperJawGroup);

    // MOVABLE LOWER PUPPET JAW (Articulates when speaking mantra / screaming)
    this.tatyaJaw = new THREE.Group();
    this.tatyaJaw.position.set(0, -0.17, 0.22); // Jaw pivot point

    const chinMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.14, 0.18),
      dollSkinMat
    );
    chinMesh.position.set(0, -0.06, 0.08);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.04), bloodMat);
    lowerLip.position.set(0, 0.01, 0.16);
    this.tatyaJaw.add(lowerLip);

    // Lower Row of Sharp Teeth
    for (let t = -3; t <= 3; t++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.045, 4), teethMat);
      tooth.position.set(t * 0.035, 0.02, 0.14);
      this.tatyaJaw.add(tooth);
    }

    // Ventriloquist doll jaw slit seams on sides
    const slitL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.14), shoeMat);
    slitL.position.set(-0.13, -0.06, 0.08);
    const slitR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.14), shoeMat);
    slitR.position.set(0.13, -0.06, 0.08);
    this.tatyaJaw.add(chinMesh, slitL, slitR);
    this.tatyaHead.add(this.tatyaJaw);

    // Wooden Doll Ears with Brass Joint Rivets
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), dollSkinMat);
      ear.position.set(side * 0.36, 0.02, 0.02);
      const earRivet = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), brassMat);
      earRivet.position.set(side * 0.38, 0.02, 0.02);
      this.tatyaHead.add(ear, earRivet);
    }

    // Voluminous Wild Frizzy Puppet Hair (58 bushy tufts framing sides and back)
    for (let h = 0; h < 58; h++) {
      // Focus hair heavily on temples, sides, and back (classic balding frizzy puppet look)
      const hAngle = 0.5 + (h / 58) * (Math.PI * 2 - 1.0);
      const hRadius = 0.33 + (Math.sin(h * 3) * 0.5 + 0.5) * 0.09;
      const hHeight = 0.24 + Math.random() * 0.22;
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.065, hHeight, 5), hairMat);
      tuft.position.set(
        Math.cos(hAngle) * hRadius,
        0.16 + Math.random() * 0.18,
        Math.sin(hAngle) * hRadius - 0.05
      );
      tuft.rotation.set(
        (Math.random() - 0.5) * 0.8,
        hAngle + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.8
      );
      this.tatyaHead.add(tuft);
    }

    this.tatyaGroup.add(this.tatyaHead);

    // --- LEGS (Denim Pants, Wooden Knee Joints, Black Doll Shoes with Brown Soles) ---
    this.tatyaLeftLeg = new THREE.Group();
    this.tatyaLeftLeg.position.set(-0.2, 0.62, 0);
    const pantL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.65, 10), bluePantMat);
    pantL.position.y = -0.32;
    // Wooden Knee Joint Ball
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), woodSoleMat);
    kneeL.position.y = -0.32;
    // Denim Folded Cuff
    const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), bluePantMat);
    cuffL.position.y = -0.58;
    // Black Leather Doll Boot with Wooden Sole
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.36), shoeMat);
    shoeL.position.set(0, -0.66, 0.07);
    shoeL.castShadow = true;
    const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.38), woodSoleMat);
    soleL.position.set(0, -0.73, 0.07);
    this.tatyaLeftLeg.add(pantL, kneeL, cuffL, shoeL, soleL);
    this.tatyaGroup.add(this.tatyaLeftLeg);

    this.tatyaRightLeg = new THREE.Group();
    this.tatyaRightLeg.position.set(0.2, 0.62, 0);
    const pantR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.65, 10), bluePantMat);
    pantR.position.y = -0.32;
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), woodSoleMat);
    kneeR.position.y = -0.32;
    const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), bluePantMat);
    cuffR.position.y = -0.58;
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.36), shoeMat);
    shoeR.position.set(0, -0.66, 0.07);
    shoeR.castShadow = true;
    const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.38), woodSoleMat);
    soleR.position.set(0, -0.73, 0.07);
    this.tatyaRightLeg.add(pantR, kneeR, cuffR, shoeR, soleR);
    this.tatyaGroup.add(this.tatyaRightLeg);

    // --- ARMS (Articulated Ball Joints, Fingers with Red Claws, Curved Ritual Dagger) ---
    this.tatyaLeftArm = new THREE.Group();
    this.tatyaLeftArm.position.set(-0.46, 1.35, 0);
    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.55, 8), plaidMat);
    sleeveL.position.set(-0.08, -0.25, 0.08);
    sleeveL.rotation.z = 0.35;
    // Wooden Ball Elbow Joint
    const elbowL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), woodSoleMat);
    elbowL.position.set(-0.12, -0.38, 0.12);
    // Doll Hand with Claws
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), dollSkinMat);
    handL.position.set(-0.16, -0.55, 0.18);
    const nailL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), bloodMat);
    nailL.position.set(-0.18, -0.62, 0.24);
    nailL.rotation.x = Math.PI / 2;
    this.tatyaLeftArm.add(sleeveL, elbowL, handL, nailL);
    this.tatyaGroup.add(this.tatyaLeftArm);

    this.tatyaRightArm = new THREE.Group();
    this.tatyaRightArm.position.set(0.46, 1.35, 0);
    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.55, 8), plaidMat);
    sleeveR.position.set(0.08, -0.25, 0.08);
    sleeveR.rotation.z = -0.35;
    const elbowR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), woodSoleMat);
    elbowR.position.set(0.12, -0.38, 0.12);
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), dollSkinMat);
    handR.position.set(0.16, -0.55, 0.18);
    const nailR = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), bloodMat);
    nailR.position.set(0.18, -0.62, 0.24);
    nailR.rotation.x = Math.PI / 2;

    // CURVED RITUAL TANTRIK DAGGER (Held firmly in right hand with wet blood)
    this.tatyaBlade = new THREE.Group();
    this.tatyaBlade.position.set(0.18, -0.45, 0.28);
    this.tatyaBlade.rotation.set(Math.PI / 2 - 0.2, 0, 0.3);

    // Brass Pommel & Grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), brassMat);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), brassMat);
    pommel.position.y = -0.1;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.05), brassMat);
    guard.position.y = 0.09;
    this.tatyaBlade.add(grip, pommel, guard);

    // Curved Sacrificial Steel Blade
    const bladeBody = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.015), steelBladeMat);
    bladeBody.position.y = 0.24;
    const bladeCurve = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 4), steelBladeMat);
    bladeCurve.position.set(0.02, 0.44, 0);
    bladeCurve.rotation.z = -0.25;
    // Dripping Fresh Blood on Blade Tip
    const bloodTip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), bloodMat);
    bloodTip.position.set(0.04, 0.48, 0);
    bloodTip.rotation.z = -0.25;
    const bloodDrop = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), bloodMat);
    bloodDrop.position.set(0.05, 0.38, 0);
    this.tatyaBlade.add(bladeBody, bladeCurve, bloodTip, bloodDrop);

    this.tatyaRightArm.add(sleeveR, elbowR, handR, nailR, this.tatyaBlade);
    this.tatyaGroup.add(this.tatyaRightArm);

    this.mesh.add(this.tatyaGroup);

    // Eyes Point Light (shared with red glow)
    this.eyesLight = new THREE.PointLight(0xff1100, 2.5, 8.0, 2.0);
    this.eyesLight.position.set(0, 1.82, 0.42);
    this.mesh.add(this.eyesLight);

    // Configure initial active villain
    this.updateVillainModel();
    this.selectNextWaypoint();
  }

  public updateVillainModel() {
    const isTatya = gameState.settings.villainType === 'tatya';
    this.tatyaGroup.visible = isTatya;
    this.ghostGroup.visible = !isTatya;
    this.eyesLight.position.y = isTatya ? 1.82 : 2.45;
  }

  private selectNextWaypoint() {
    if (this.waypoints.length === 0) return;
    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    this.targetPosition.copy(this.waypoints[this.currentWaypointIndex]);
  }

  // AI Update Tick
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerHiding: boolean,
    isPlayerSprinting: boolean,
    isPlayerCrouching: boolean,
    isPlayerMoving: boolean,
    isFlashlightOn: boolean,
    colliders: THREE.Box3[],
    onCatchPlayer: () => void,
    interactives?: InteractiveObject[]
  ) {
    this.stateTimer += delta;
    this.floatOffset += delta * 2.5;

    const isTatya = gameState.settings.villainType === 'tatya';

    // 0. Door Bursting: Villain bashes through any closed interior doors in their path!
    if (interactives) {
      for (const item of interactives) {
        if (item.type === 'door' && !item.isOpen && item.doorId !== 'exitDoor') {
          const doorDist = this.position.distanceTo(item.position);
          if (doorDist < 2.0) {
            item.isOpen = true;
            item.mesh.rotation.y = Math.PI / 2;
            soundManager.playDoorSound(true);
            soundManager.playCreepyThud(0.85);
            if (isTatya) {
              gameState.showSubtitle("TATYA BASHED THE DOOR OPEN! 'OM PHAT SWAHA!'", 3500);
              soundManager.playTatyaVoiceChant(0, true);
            } else {
              gameState.showSubtitle("THE GHOST BASHED THE DOOR OPEN! RUN!", 2800);
            }
          }
        }
      }
    }

    if (isTatya) {
      // Tatya Vinchu puppet mechanical walking animation
      const walkCycle = performance.now() * 0.008;
      this.tatyaLeftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
      this.tatyaRightLeg.rotation.x = -Math.sin(walkCycle) * 0.45;
      this.tatyaLeftArm.rotation.x = -Math.sin(walkCycle) * 0.35;

      // Raise dagger high during chase / aggressive stance
      if (this.state === 'chase') {
        this.tatyaRightArm.rotation.x = 0.85 + Math.sin(walkCycle * 2) * 0.25;
        this.tatyaRightArm.rotation.z = -0.15;
      } else {
        this.tatyaRightArm.rotation.x = Math.sin(walkCycle) * 0.35;
        this.tatyaRightArm.rotation.z = -0.35;
      }

      // Creepy puppet head twitching & tilt
      this.tatyaHead.rotation.z = Math.sin(walkCycle * 0.5) * 0.12;

      // ARTICULATED VENTRILOQUIST JAW: opens & drops rapidly while chanting dialogue or chasing!
      if (this.isChantingDialogue || this.state === 'chase') {
        const jawOpen = Math.max(0, Math.sin(performance.now() * 0.025) * 0.48);
        this.tatyaJaw.rotation.x = THREE.MathUtils.damp(this.tatyaJaw.rotation.x, jawOpen, 18, delta);
        this.eyesLight.intensity = THREE.MathUtils.damp(this.eyesLight.intensity, 4.2, 10, delta);
      } else {
        this.tatyaJaw.rotation.x = THREE.MathUtils.damp(this.tatyaJaw.rotation.x, 0, 10, delta);
        this.eyesLight.intensity = THREE.MathUtils.damp(this.eyesLight.intensity, 2.2, 5, delta);
      }

      this.mesh.position.y = this.position.y; // Firmly on floor
    } else {
      // Ghost walking on floor - firmly on ground, NO FLYING!
      const walkCycle = performance.now() * 0.006;
      this.leftArm.rotation.z = Math.sin(walkCycle * 1.5) * 0.15;
      this.rightArm.rotation.z = -Math.sin(walkCycle * 1.5) * 0.15;
      this.headMesh.rotation.y = Math.sin(walkCycle * 0.7) * 0.2;
      this.mesh.position.y = this.position.y; // Walks firmly on floor - NO FLYING!
    }

    // Distance to player
    const distToPlayer = this.position.distanceTo(playerPos);
    gameState.ghostDistance = distToPlayer;

    // Trigger dialogue and head lock when player spots Tatya directly
    if (isTatya && distToPlayer < 14 && !isPlayerHiding) {
      const now = performance.now();
      if (this.hasDirectVision && now - this.lastSpottedDialogueTime > 14000) {
        this.lastSpottedDialogueTime = now;
        this.isChantingDialogue = true;
        soundManager.playTatyaVoiceChant(distToPlayer / 14, true);
        gameState.showSubtitle("TATYA VINCHOO: 'OM PHAT SWAHA! MAZE NAAV TATYA VINCHOO!'", 4500);
      }
    }

    // Spatial Ghost Footstep audio
    this.footstepTimer += delta;
    const stepInterval = this.state === 'chase' ? 0.35 : 0.65;
    if (this.footstepTimer > stepInterval) {
      this.footstepTimer = 0;
      if (distToPlayer < 24) {
        const pan = Math.max(-1, Math.min(1, (this.position.x - playerPos.x) / 12));
        soundManager.playGhostStep(pan, distToPlayer / 24);
      }
    }

    // 1. SOUND & NOISE DETECTION SYSTEM:
    // Only hears player if player is making noise AND ghost is near enough to hear it!
    let noiseRadius = 0;
    if (!isPlayerHiding) {
      if (isPlayerSprinting && isPlayerMoving) {
        noiseRadius = 10.0; // Loud sprint footsteps heard within 10m
      } else if (isPlayerMoving && !isPlayerCrouching) {
        noiseRadius = 3.5; // Normal walk footsteps heard only within 3.5m
      }
      // Crouching (C) or standing still generates 0 noise!
    }

    const ghostHearsNoise = noiseRadius > 0 && distToPlayer <= noiseRadius;

    // 2. LINE OF SIGHT SIGHT CONE
    this.hasDirectVision = !isPlayerHiding && this.checkLineOfSight(playerPos, colliders, distToPlayer, isFlashlightOn, isPlayerCrouching);

    // --- State Machine ---
    switch (this.state) {
      case 'patrol': {
        this.currentSpeed = this.patrolSpeed;
        gameState.ghostState = 'patrol';
        gameState.ghostAlertLevel = Math.max(0, gameState.ghostAlertLevel - delta * 0.3);

        // A. If ghost HEARS noise from nearby player
        if (ghostHearsNoise) {
          if (isTatya) {
            gameState.showSubtitle("The floor creaked... Tatya whispers: 'Om Phat Swaha...'", 3000);
          } else {
            gameState.showSubtitle('The floor creaked... The ghost heard your footsteps!', 2800);
          }
          this.investigatePosition(playerPos);
          break;
        }

        // B. If ghost actually SEES player directly in forward vision cone
        if (this.hasDirectVision) {
          this.startChase(playerPos);
          break;
        }

        // Move toward waypoint or linger eerily
        const distToWp = this.position.distanceTo(this.targetPosition);
        if (distToWp < 1.2) {
          // Standing dead-still in hallway, slowly turning head (unnatural horror presence!)
          this.currentSpeed = 0;
          const headTurn = Math.sin(this.stateTimer * 2.0) * 0.6;
          this.tatyaHead.rotation.y = headTurn;
          this.headMesh.rotation.y = headTurn;

          if (this.stateTimer > 2.2) {
            this.stateTimer = 0;
            this.selectNextWaypoint();
          }
        } else {
          this.currentSpeed = this.patrolSpeed;
          this.moveToward(this.targetPosition, delta, colliders);
        }
        break;
      }

      case 'investigate': {
        this.currentSpeed = this.patrolSpeed * 1.1;
        gameState.ghostState = 'investigate';
        gameState.ghostAlertLevel = 0.5;

        // If player makes more noise while investigating, redirect
        if (ghostHearsNoise && distToPlayer < 8.0) {
          this.targetPosition.copy(playerPos);
        }

        // If ghost visually sees player
        if (this.hasDirectVision) {
          this.startChase(playerPos);
          break;
        }

        this.moveToward(this.targetPosition, delta, colliders);

        if (this.position.distanceTo(this.targetPosition) < 1.4 || this.stateTimer > 6.0) {
          this.state = 'search';
          this.stateTimer = 0;
        }
        break;
      }

      case 'search': {
        this.currentSpeed = this.patrolSpeed * 0.35;
        gameState.ghostState = 'search';
        gameState.ghostAlertLevel = 0.4;

        // Unnatural mechanical head snap looking around
        const headTurn = Math.sin(this.stateTimer * 2.8) * 0.8;
        this.tatyaHead.rotation.y = headTurn;
        this.headMesh.rotation.y = headTurn;

        if (ghostHearsNoise) {
          this.investigatePosition(playerPos);
          break;
        }

        if (this.hasDirectVision) {
          this.startChase(playerPos);
          break;
        }

        if (this.stateTimer > 4.5) {
          this.state = 'patrol';
          this.stateTimer = 0;
          this.selectNextWaypoint();
        }
        break;
      }

      case 'chase': {
        gameState.ghostState = 'chase';
        gameState.ghostAlertLevel = 1.0;
        this.eyesLight.color.set(0xff0000);
        this.eyesLight.intensity = 5.0;

        // If player hid while ghost was chasing
        if (isPlayerHiding) {
          this.sightKillTimer = 0;
          this.state = 'search';
          this.stateTimer = 0;
          this.targetPosition.copy(playerPos);
          soundManager.setMusicMood('tense');
          break;
        }

        if (this.hasDirectVision) {
          this.lastKnownPlayerPos.copy(playerPos);
          this.stateTimer = 0; // reset chase memory timer
          this.sightKillTimer += delta;
          this.currentSpeed = 5.6; // supernatural puppet surge
        } else {
          this.sightKillTimer = Math.max(0, this.sightKillTimer - delta * 2.0);
          this.currentSpeed = this.chaseSpeed;
        }

        // Move directly toward player / last known position
        this.moveToward(this.lastKnownPlayerPos, delta, colliders);

        // TATYA SIGHT-KILL / PROXIMITY STRIKE:
        // If player remains in direct line of sight for 1.05s OR comes within 2.2m:
        if ((this.sightKillTimer >= 1.05 && this.hasDirectVision) || (distToPlayer < 2.2 && !isPlayerHiding)) {
          this.sightKillTimer = 0;
          onCatchPlayer();
          return;
        }

        // Lost sight for too long
        if (!this.hasDirectVision && this.stateTimer > 5.0) {
          this.state = 'search';
          this.stateTimer = 0;
          soundManager.setMusicMood('explore');
        }
        break;
      }
    }

    // Dynamic music and heartbeat based on ghost proximity
    if (this.state === 'chase') {
      soundManager.setMusicMood('chase');
      soundManager.setHeartbeatRate(135, true);
      gameState.screenGlitchIntensity = Math.min(1.0, (1 - distToPlayer / 16) * 1.2);
      if (gameState.settings.villainType === 'tatya') {
        soundManager.playTatyaVoiceChant(distToPlayer / 14);
      }
    } else if (distToPlayer < 12) {
      soundManager.setMusicMood('tense');
      soundManager.setHeartbeatRate(95, true);
      gameState.screenGlitchIntensity = Math.max(0, (1 - distToPlayer / 12) * 0.5);
      if (gameState.settings.villainType === 'tatya') {
        soundManager.playTatyaVoiceChant(distToPlayer / 14);
      }
    } else {
      soundManager.setHeartbeatRate(70, false);
      gameState.screenGlitchIntensity = 0;
      if (this.state === 'patrol') {
        soundManager.setMusicMood('explore');
      }
    }
  }

  // Vision cone and Raycast check (Fair & Realistic)
  private checkLineOfSight(
    playerPos: THREE.Vector3,
    colliders: THREE.Box3[],
    dist: number,
    isFlashlightOn: boolean,
    isPlayerCrouching: boolean
  ): boolean {
    // Distance limits: crouching gives stealth; flashlight gives away position
    let maxVisionDist = 7.0;
    if (isFlashlightOn) {
      maxVisionDist = 11.0;
    } else if (isPlayerCrouching) {
      maxVisionDist = 3.5;
    }

    if (dist > maxVisionDist) return false;

    // Check angle between ghost facing direction and player
    const ghostDir = new THREE.Vector3();
    this.mesh.getWorldDirection(ghostDir);

    const toPlayer = playerPos.clone().sub(this.position).normalize();
    const dot = ghostDir.dot(toPlayer);

    // Realistic frontal sight cone (~70 degrees, cannot see behind its back!)
    if (dot < 0.35) return false;

    // Raycast through colliders to check for wall blockage
    const ray = new THREE.Ray(
      new THREE.Vector3(this.position.x, this.position.y + 1.8, this.position.z),
      toPlayer
    );

    for (const box of colliders) {
      const intersect = ray.intersectBox(box, new THREE.Vector3());
      if (intersect) {
        const distToBox = this.position.distanceTo(intersect);
        if (distToBox < dist - 0.5) {
          // Blocked by wall or furniture obstacle
          return false;
        }
      }
    }

    return true;
  }

  public investigatePosition(pos: THREE.Vector3) {
    if (this.state === 'chase') return;
    this.state = 'investigate';
    this.stateTimer = 0;
    this.targetPosition.copy(pos);
    soundManager.setMusicMood('tense');
  }

  private startChase(playerPos: THREE.Vector3) {
    if (this.state !== 'chase') {
      soundManager.playPuppetScreech();
      soundManager.setMusicMood('chase');
      const isTatya = gameState.settings.villainType === 'tatya';
      if (isTatya) {
        this.isChantingDialogue = true;
        this.eyesLight.intensity = 4.8;
        soundManager.playTatyaVoiceChant(0, true);
        gameState.showSubtitle("TATYA VINCHOO: 'OM BHAG BHUGE BHAGNI BHAGODARI... BHAG MASE YAUNI OM PHAT SWAHA! AATA MAAZHI SUTKA NAHI... TU MAZHYAT SHINAAR!'", 5500);
      } else {
        gameState.showSubtitle('THE GHOST HAS SEEN YOU! BREAK LINE OF SIGHT!', 3000);
      }
    }
    this.state = 'chase';
    this.stateTimer = 0;
    this.lastKnownPlayerPos.copy(playerPos);
  }

  private moveToward(target: THREE.Vector3, delta: number, colliders?: THREE.Box3[]) {
    const dir = target.clone().sub(this.position);
    dir.y = 0; // maintain horizontal movement
    const dist = dir.length();
    if (dist < 0.05) return;

    dir.normalize();

    // Rotate villain smoothly toward movement direction
    const targetAngle = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = THREE.MathUtils.damp(this.mesh.rotation.y, targetAngle, 8, delta);

    const stepX = dir.x * this.currentSpeed * delta;
    const stepZ = dir.z * this.currentSpeed * delta;
    const nextX = this.position.x + stepX;
    const nextZ = this.position.z + stepZ;

    // Obstacle & Wall Collision Sliding: Test X and Z independently so villain slides smoothly around obstacles
    if (colliders && colliders.length > 0) {
      const villainRadius = 0.35;
      const boxX = new THREE.Box3(
        new THREE.Vector3(nextX - villainRadius, this.position.y + 0.1, this.position.z - villainRadius),
        new THREE.Vector3(nextX + villainRadius, this.position.y + 1.8, this.position.z + villainRadius)
      );
      const boxZ = new THREE.Box3(
        new THREE.Vector3(this.position.x - villainRadius, this.position.y + 0.1, nextZ - villainRadius),
        new THREE.Vector3(this.position.x + villainRadius, this.position.y + 1.8, nextZ + villainRadius)
      );

      let collideX = false;
      let collideZ = false;

      for (const box of colliders) {
        // Vertical elevation filter: only collide with obstacles on villain's current floor
        if (box.max.y < this.position.y || box.min.y > this.position.y + 2.0) {
          continue;
        }
        if (box.intersectsBox(boxX)) collideX = true;
        if (box.intersectsBox(boxZ)) collideZ = true;
      }

      if (!collideX) this.position.x = nextX;
      if (!collideZ) this.position.z = nextZ;

      // If fully wedged on both axes while patrolling, advance to next waypoint
      if (collideX && collideZ && this.state === 'patrol') {
        this.selectNextWaypoint();
      }
    } else {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // FIRMLY LOCK TO FLOOR ELEVATION (Stairs and floors) - NEVER FLY!
    const floorY = getMansionFloorHeight(this.position.x, this.position.z, this.position.y);
    this.position.y = THREE.MathUtils.damp(this.position.y, floorY, 14, delta);

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  }

  public resetToStart() {
    if (this.waypoints.length > 0) {
      this.position.copy(this.waypoints[0]);
      this.mesh.position.copy(this.position);
    }
    this.state = 'patrol';
    this.stateTimer = 0;
    this.currentWaypointIndex = 0;
    this.eyesLight.intensity = 2.0;
    this.isChantingDialogue = false;
  }
}
