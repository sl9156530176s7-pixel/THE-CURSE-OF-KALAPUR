import * as THREE from 'three';
import { gameState } from './gameState';
import {
  createWoodFloorTexture,
  createGothicWallTexture,
  createCheckeredMarbleTexture,
  createCatacombBrickTexture,
  createGarageMetalTexture,
  createTantricMandalaTexture,
  createBreakerPanelTexture,
  createStoneTileTexture,
  createDoorTexture,
  createEmptyFrameMountTexture,
  createKalapurPortraitTexture,
  createCarpetTexture,
  createCarvedWoodPillarTexture,
  createWindowRainTexture,
  createAncestorGalleryTexture,
  createCeilingPlanksTexture,
  createRoofTilesTexture,
  createTantricWallWritingTexture,
  createTatyaWallPhotoTexture,
  createTatyaCloseupEyesTexture,
  createTatyaDaggerPortraitTexture,
  createTatyaVintageArchiveTexture,
  createTatyaShrineTexture,
  createAnnabelleDollTexture,
  createCursedDollFamilyTexture,
  createBathroomTilesTexture,
  createMirrorReflectionTexture,
  createClockFaceTexture,
  createVelvetCurtainTexture,
  createIndianGasStoveTexture,
  createLpgCylinderTexture,
  createIndianFamilyPhotoTexture,
  createStrangeCreationLogoTexture,
  createHauntedPaintingTexture,
  createBasementSignTexture,
  createFloorSignTexture,
  createCobwebTexture,
  createContactShadowTexture,
} from './textures';

export type InteractiveType =
  | 'door'
  | 'key'
  | 'frame'
  | 'battery'
  | 'decoy_pickup'
  | 'stun_pickup'
  | 'diary'
  | 'hiding'
  | 'switch'
  | 'exit_gate'
  | 'drawer'
  | 'cutters'
  | 'gate_key'
  | 'tap'
  | 'crowbar'
  | 'bell'
  | 'oars'
  | 'fuel_can'
  | 'car_battery'
  | 'car_key'
  | 'escape_car'
  | 'escape_boat'
  | 'secret_bookcase'
  | 'breaker_box'
  | 'mirror_spook';

export interface InteractiveObject {
  id: string;
  type: InteractiveType;
  name: string;
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  prompt: string;
  requiresKey?: string;
  doorId?: string;
  drawerId?: string;
  hidingType?: 'wardrobe' | 'underbed';
  hidingCameraOffset?: THREE.Vector3;
  isOpen?: boolean;
  isOn?: boolean;
  collected?: boolean;
  action?: () => void;
  drawerMesh?: THREE.Group;
  targetLight?: THREE.PointLight;
  waterStreamMesh?: THREE.Mesh;
  colliderBox?: THREE.Box3;
}

export interface HouseData {
  root: THREE.Group;
  colliders: THREE.Box3[];
  interactives: InteractiveObject[];
  exitDoorMesh: THREE.Group;
  frameMountMesh: THREE.Mesh;
  placedFrameMesh: THREE.Mesh;
  flickerLights: THREE.PointLight[];
  ghostWaypoints: THREE.Vector3[];
  rockingChair?: THREE.Group;
  gateChainMesh?: THREE.Group;
  gatePadlockMesh?: THREE.Mesh;
  pendulums?: THREE.Group[];
  waterStreams?: THREE.Mesh[];
  carHeadlights?: THREE.SpotLight[];
  carHeadlightBulbs?: THREE.Mesh[];
  breakerLedMesh?: THREE.Mesh;
  secretBookcaseMesh?: THREE.Group;
  mandalaMesh?: THREE.Mesh;
  glintRings?: THREE.Mesh[];
}

/**
 * Multi-Level Floor Height Calculator (4 Vertical Levels: -3.0 Crypt, 0.0 Ground, +4.5 Upper 2F, +8.8 Attic 3F)
 * feetY is always the entity's foot elevation so jumping never clips between floors.
 */
export function getMansionFloorHeight(x: number, z: number, feetY: number): number {
  // 1. Central Grand Staircase: Z = 7.5 (Y=0) ascending North to Z = -1.5 (Y=4.5)
  if (Math.abs(x) <= 2.15 && z >= -1.8 && z <= 7.8 && feetY >= -0.8 && feetY <= 4.9) {
    const progress = (7.5 - z) / 9.0;
    return Math.max(0, Math.min(4.5, progress * 4.5));
  }

  // 1B. Floor 2 -> Floor 3 Attic Staircase (West Upper Wing): Z = 7.0 (Y=4.5) ascending North to Z = 0.6 (Y=8.8)
  if (x >= -7.45 && x <= -4.55 && z >= 0.4 && z <= 7.25 && feetY >= 3.6 && feetY <= 9.2) {
    const progress = (7.0 - z) / 6.4;
    return 4.5 + Math.max(0, Math.min(1, progress)) * 4.3;
  }

  // 2. Crypt / Basement Staircase (Storage Wing West Alcove): Z = 0.0 (Y=0) descending North to Z = -7.0 (Y=-3.0)
  if (x >= -19.5 && x <= -15.0 && z >= -7.4 && z <= 0.2 && feetY < 2.2) {
    const progress = (0.0 - z) / 7.0;
    return -Math.max(0, Math.min(1, progress)) * 3.0;
  }

  // 3. Subterranean Underground River Crypt + East Bone Ritual Vault Level (Y = -3.0)
  if (
    feetY < -0.45 &&
    ((x >= -21.5 && x <= -4.5 && z >= -21.5 && z <= -6.8) ||
      (x >= -5.2 && x <= 5.5 && z >= -16.5 && z <= -6.8))
  ) {
    return -3.0;
  }

  // 3B. 3rd Floor Grand Attic & Doll Workshop (Y = 8.8)
  if (feetY >= 7.1 && x >= -12.6 && x <= 12.6 && z >= -12.6 && z <= 8.4) {
    return 8.8;
  }

  // 4. Upper 2nd Floor Level Rooms (Y = 4.5)
  if (feetY >= 2.8) {
    if (Math.abs(x) <= 4.2 && z >= -8.5 && z <= 8.5) return 4.5;
    if (x >= 3.0 && x <= 20.5 && z >= -8.0 && z <= 8.0) return 4.5;
    if (x >= -20.5 && x <= -3.0 && z >= -8.0 && z <= 8.0) return 4.5;
    if (Math.abs(x) <= 8.5 && z >= -20.5 && z <= -7.5) return 4.5;
    // NE Wing: Zamindar Astrology & Study Chamber (X: 8..20, Z: -20..-8)
    if (x >= 7.5 && x <= 20.5 && z >= -20.5 && z <= -7.5) return 4.5;
    // Secret Library-to-Sanctum Passage (NW Upper Alcove)
    if (x >= -16.5 && x <= -7.5 && z >= -16.5 && z <= -7.5) return 4.5;
  }

  // 5. Ground Level (+ North Trophy Corridor), East Garage & Courtyard
  return 0.0;
}

export function buildKalapurHouse(): HouseData {
  const root = new THREE.Group();
  root.name = 'KalapurHouse';

  const colliders: THREE.Box3[] = [];
  const interactives: InteractiveObject[] = [];
  const flickerLights: THREE.PointLight[] = [];
  const pendulums: THREE.Group[] = [];
  const waterStreams: THREE.Mesh[] = [];
  const carHeadlights: THREE.SpotLight[] = [];
  const carHeadlightBulbs: THREE.Mesh[] = [];
  const glintRings: THREE.Mesh[] = [];

  // =========================================================================
  // 1. NOCTURNAL GOTHIC-TANTRIC MATERIALS PALETTE
  // =========================================================================
  const woodFloorTex = createWoodFloorTexture();
  const gothicWallTex = createGothicWallTexture();
  const marbleFloorTex = createCheckeredMarbleTexture();
  const catacombBrickTex = createCatacombBrickTexture();
  const garageMetalTex = createGarageMetalTexture();
  const mandalaTex = createTantricMandalaTexture();
  const breakerTex = createBreakerPanelTexture();
  const stoneTileTex = createStoneTileTexture();
  const doorTex = createDoorTexture();
  const emptyMountTex = createEmptyFrameMountTexture();
  const portraitTex = createKalapurPortraitTexture();
  const bathroomTileTex = createBathroomTilesTexture();
  const mirrorTex = createMirrorReflectionTexture();
  const clockFaceTex = createClockFaceTexture();
  const curtainTex = createVelvetCurtainTexture();
  const gasStoveTex = createIndianGasStoveTexture();
  const lpgCylinderTex = createLpgCylinderTexture();
  const strangeLogoTex = createStrangeCreationLogoTexture();
  const ceilingTex = createCeilingPlanksTexture();
  const roofTilesTex = createRoofTilesTexture();

  const woodFloorMat = new THREE.MeshStandardMaterial({ map: woodFloorTex, roughness: 0.82, metalness: 0.1 });
  const marbleFloorMat = new THREE.MeshStandardMaterial({ map: marbleFloorTex, roughness: 0.35, metalness: 0.25 });
  const wallMat = new THREE.MeshStandardMaterial({ map: gothicWallTex, roughness: 0.85, metalness: 0.06 });
  const catacombMat = new THREE.MeshStandardMaterial({ map: catacombBrickTex, roughness: 0.9, metalness: 0.05 });
  const garageWallMat = new THREE.MeshStandardMaterial({ map: garageMetalTex, roughness: 0.65, metalness: 0.5 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTileTex, roughness: 0.72, metalness: 0.2 });
  const bathroomTileMat = new THREE.MeshStandardMaterial({ map: bathroomTileTex, roughness: 0.35, metalness: 0.1 });
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.05 });
  const mirrorMat = new THREE.MeshStandardMaterial({ map: mirrorTex, roughness: 0.1, metalness: 0.85 });
  const clockFaceMat = new THREE.MeshStandardMaterial({ map: clockFaceTex, roughness: 0.4, metalness: 0.1 });
  const curtainMat = new THREE.MeshStandardMaterial({ map: curtainTex, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide });
  const gasStoveMat = new THREE.MeshStandardMaterial({ map: gasStoveTex, roughness: 0.35, metalness: 0.7 });
  const lpgCylinderMat = new THREE.MeshStandardMaterial({ map: lpgCylinderTex, roughness: 0.5, metalness: 0.2 });
  const strangeLogoMat = new THREE.MeshStandardMaterial({ map: strangeLogoTex, roughness: 0.35, metalness: 0.8 });
  const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.82, metalness: 0.1, side: THREE.DoubleSide });
  const roofTilesMat = new THREE.MeshStandardMaterial({ map: roofTilesTex, roughness: 0.85, metalness: 0.15, side: THREE.DoubleSide });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0d9488,
    roughness: 0.1,
    metalness: 0.45,
    transparent: true,
    opacity: 0.82,
  });

  const darkTeakMat = new THREE.MeshStandardMaterial({ color: 0x1b110c, roughness: 0.65, metalness: 0.15 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc89d42, roughness: 0.32, metalness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.55, metalness: 0.78 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 });

  // Subtle item highlight ring helper (makes pickups crisp and satisfying to spot)
  function attachItemGlint(parent: THREE.Object3D, color = 0xfbbf24, radius = 0.22) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 6, 18),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    parent.add(ring);
    glintRings.push(ring);
  }

  // Volumetric Moonlight Shaft helper for tall haunted windows
  function addMoonbeam(x: number, y: number, z: number, rotY: number) {
    const beamGeo = new THREE.ConeGeometry(1.5, 5.2, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, y, z);
    beam.rotation.order = 'YXZ';
    beam.rotation.y = rotY;
    beam.rotation.x = 0.48;
    root.add(beam);
  }

  function addWall(x: number, y: number, z: number, w: number, h: number, d: number, mat = wallMat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    if (h >= 3.0) {
      const skirtH = 0.24;
      const skirtGeo = new THREE.BoxGeometry(w > d ? w + 0.05 : w + 0.06, skirtH, d > w ? d + 0.05 : d + 0.06);
      const skirtMesh = new THREE.Mesh(skirtGeo, darkTeakMat);
      skirtMesh.position.set(x, y + skirtH / 2, z);
      root.add(skirtMesh);

      const crownH = 0.14;
      const crownGeo = new THREE.BoxGeometry(w > d ? w + 0.04 : w + 0.05, crownH, d > w ? d + 0.04 : d + 0.05);
      const crownMesh = new THREE.Mesh(crownGeo, darkTeakMat);
      crownMesh.position.set(x, y + h - crownH / 2, z);
      root.add(crownMesh);
    }

    colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  }

  function addFloor(x: number, y: number, z: number, w: number, d: number, mat = woodFloorMat) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  function addCeiling(x: number, y: number, z: number, w: number, d: number, mat = ceilingMat) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    root.add(mesh);

    const rafterSpacing = 2.8;
    for (let rz = z - d / 2 + 1.3; rz <= z + d / 2 - 0.8; rz += rafterSpacing) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.26), darkTeakMat);
      rafter.position.set(x, y - 0.15, rz);
      root.add(rafter);
    }
    return mesh;
  }

  // =========================================================================
  // 2. GROUND FLOOR FOUNDATION (WITH WIDE BASEMENT STAIR OPENING AT NW)
  // =========================================================================
  // East Half (X: 0..20, Z: -8..17)
  addFloor(10, 0, 4.5, 20, 25, woodFloorMat);
  // West-Inner Half (X: -15.0..0, Z: -8..17)
  addFloor(-7.5, 0, 4.5, 15.0, 25, stoneMat);
  // Far-West South of Basement Stairs (X: -20..-15.0, Z: 0.0..17)
  addFloor(-17.5, 0, 8.5, 5.0, 17.0, stoneMat);
  // Thin strip West of Basement Stairs (X: -20..-19.3, Z: -8..0.0)
  addFloor(-19.65, 0, -4.0, 0.7, 8.0, stoneMat);
  // Thin strip North of Basement Stairs (X: -19.3..-15.0, Z: -8..-7.0)
  addFloor(-17.15, 0, -7.5, 4.3, 1.0, stoneMat);

  // Grand Checkered Marble Overlay in Central Atrium Foyer (X: -6..6, Z: -2..17)
  addFloor(0, 0.015, 7.5, 12, 19, marbleFloorMat);

  // South Monsoon Courtyard Stone (X: -12..+12, Z: 17..31) & Exterior Fog Road (Z: 31..55)
  addFloor(0, 0, 24, 24, 14, stoneMat);
  addFloor(0, -0.04, 43, 64, 26, stoneMat);
  // East Garage Oil-Stained Concrete Floor (X: 12..24, Z: 17..31)
  addFloor(18, 0.006, 24, 12, 14, garageWallMat);

  // Ground Floor under Full Open North Trophy Gallery (X: -20 .. +20, Z: -20 .. -8)
  addFloor(0, 0, -14, 40, 12, stoneMat);

  // Ground Ceilings (Y = 4.3, Leaving Central Stairwell Open)
  addCeiling(13, 4.3, 4.5, 14, 25);
  addCeiling(-13, 4.3, 4.5, 14, 25);
  addCeiling(0, 4.3, 12.25, 12, 9.5);
  addCeiling(0, 4.3, -14, 40, 12);

  // =========================================================================
  // 3. UPPER FLOOR 2 (Y = 4.5) + FLOOR 3 ATTIC & DOLL WORKSHOP (Y = 8.8)
  // =========================================================================
  addFloor(0, 4.5, -4.75, 8, 6.5, woodFloorMat);
  addFloor(-2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  addFloor(2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  addFloor(0, 4.5, 8.0, 7.6, 1.5, woodFloorMat);

  addFloor(12, 4.5, 0, 16, 16, woodFloorMat);
  addFloor(-12, 4.5, 0, 16, 16, woodFloorMat);
  addFloor(0, 4.5, -14, 16, 12, marbleFloorMat); // Mystic Sanctum Marble
  addFloor(14, 4.5, -14, 12, 12, woodFloorMat);  // NE Zamindar Astrology Study Floor
  // Secret Library-to-Sanctum Archive Passage (X: -16..-8, Z: -16..-8, Y = 4.5)
  addFloor(-12, 4.5, -12, 8, 8, woodFloorMat);

  // Mystic Sanctum Glowing Crimson Tantric Mandala Floor Seal
  const mandalaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.MeshBasicMaterial({ map: mandalaTex, transparent: true, opacity: 0.92, depthWrite: false })
  );
  mandalaMesh.rotation.x = -Math.PI / 2;
  mandalaMesh.position.set(0, 4.525, -14);
  root.add(mandalaMesh);

  // Upper 2F Ceilings (Y = 8.6) — Split cleanly around 3F Attic Stairwell Opening (X: -7.4..-4.6, Z: 0.4..7.2)
  addCeiling(0, 8.6, 0, 8, 17);
  addCeiling(12, 8.6, 0, 16, 16);
  addCeiling(-12, 8.6, -3.8, 16, 8.4);   // North of Attic Stairs
  addCeiling(-13.7, 8.6, 4.2, 12.6, 7.6); // West of Attic Stairs
  addCeiling(-4.3, 8.6, 4.2, 0.6, 7.6);   // East lip of Attic Stairs
  addCeiling(-6.0, 8.6, 7.6, 2.8, 0.8);   // South lip of Attic Stairs
  addCeiling(0, 8.6, -14, 16, 12);
  addCeiling(14, 8.6, -14, 12, 12);      // NE Astrology Study Ceiling
  addCeiling(-12, 8.6, -12, 8, 8);

  // 3rd Floor Grand Attic Plank Floor (Y = 8.8, X: -12..+12, Z: -12..+8) with Stairwell Opening
  addFloor(0, 8.8, -5.8, 24, 12.4, woodFloorMat);      // Z: -12 .. 0.4
  addFloor(-9.7, 8.8, 4.2, 4.6, 7.6, woodFloorMat);   // X: -12 .. -7.4, Z: 0.4 .. 8
  addFloor(3.7, 8.8, 4.2, 16.6, 7.6, woodFloorMat);   // X: -4.6 .. 12, Z: 0.4 .. 8
  addFloor(-6.0, 8.8, 7.6, 2.8, 0.8, woodFloorMat);   // South lip

  // Floor 3 Staircase Steps (X = -6.0, width 2.4, Z = 6.8 Y=4.5 ascending North -> Z = 0.6 Y=8.8)
  const atticSteps = 18;
  for (let s = 0; s < atticSteps; s++) {
    const sy = 4.5 + (s + 0.5) * (4.3 / atticSteps);
    const sz = 6.8 - s * (6.2 / atticSteps);
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.22, 0.42), darkTeakMat);
    step.position.set(-6.0, sy, sz);
    step.receiveShadow = true;
    root.add(step);
  }

  // Floor 3 Attic Stair Safety Guardrails around Stairwell Hole
  const atticRailW = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 6.9), brassMat);
  atticRailW.position.set(-7.38, 9.32, 3.85);
  root.add(atticRailW);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7.38, 9.35, 3.85), new THREE.Vector3(0.22, 1.3, 6.9)));

  const atticRailE = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 6.9), brassMat);
  atticRailE.position.set(-4.62, 9.32, 3.85);
  root.add(atticRailE);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-4.62, 9.35, 3.85), new THREE.Vector3(0.22, 1.3, 6.9)));

  const atticRailS = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.05, 0.14), brassMat);
  atticRailS.position.set(-6.0, 9.32, 7.28);
  root.add(atticRailS);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-6.0, 9.35, 7.28), new THREE.Vector3(2.9, 1.3, 0.22)));

  // High Pitched Timber & Terracotta Roof Over 3F Attic (Seated cleanly above Attic walls Y = 12.35 .. 16.1)
  const roofSlopeWest = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.18, 22), roofTilesMat);
  roofSlopeWest.rotation.set(0, 0, 0.30);
  roofSlopeWest.position.set(-6.4, 14.1, -2.0);
  root.add(roofSlopeWest);

  const roofSlopeEast = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.18, 22), roofTilesMat);
  roofSlopeEast.rotation.set(0, 0, -0.30);
  roofSlopeEast.position.set(6.4, 14.1, -2.0);
  root.add(roofSlopeEast);

  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 22), darkTeakMat);
  roofRidge.position.set(0, 16.05, -2.0);
  root.add(roofRidge);

  // =========================================================================
  // 4. GROUND FLOOR WALLS, HAVELI COLONNADES, NORTH ARCHWAYS & BREAKER
  // =========================================================================
  const WH = 4.2;
  const TH = 0.4;

  // South Facade (Z = 17): Full Enclosed Front Haveli Wall + Grand Exit Door (X: -1..+1) + Garage Doorway (X: 14..16)
  addWall(-10.5, 0, 17, 19.0, WH, TH);   // Solid West South Facade (X: -20.0 .. -1.0)
  addWall(0, 3.2, 17, 2.0, 1.0, TH);      // Grand Exit Door Lintel (X: -1.0 .. +1.0)
  addWall(7.5, 0, 17, 13.0, WH, TH);      // Solid East South Facade (X: +1.0 .. +14.0)
  addWall(15.0, 2.8, 17, 2.0, 1.4, TH);   // Garage Service Door Lintel (X: +14.0 .. +16.0)
  addWall(17.1, 0, 17, 2.2, WH, TH);      // Pier between Garage Door & Garage Wall (X: +16.0 .. +18.2)

  // Open Haveli Colonnade Pillars in Central Foyer
  for (const pz of [2.0, 6.0, 10.0, 14.5]) {
    for (const px of [-6.0, 6.0]) {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0, pz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), stoneMat);
      base.position.y = 0.2;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), darkTeakMat);
      shaft.position.y = 2.1;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.65), darkTeakMat);
      cap.position.y = 3.95;
      pGroup.add(base, shaft, cap);
      root.add(pGroup);
      colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(px, 2.0, pz), new THREE.Vector3(0.55, 4.0, 0.55)));
    }
  }

  // Main Ground Outer Enclosure & Z = -8 North Wall with Twin Haveli Archways into North Trophy Gallery
  addWall(20, 0, -1.5, TH, WH, 37);     // Full Continuous East Outer Wall (Z: -20 .. +17)
  addWall(-20, 0, -1.5, TH, WH, 37);    // Full Continuous West Outer Wall (Z: -20 .. +17)
  addWall(-10.9, 0, -8, 18.2, WH, TH);  // Z = -8 West Partition (X: -20.0 .. -1.8)
  addWall(0, 3.0, -8, 3.6, 1.2, TH);    // Z = -8 Central North Archway Lintel (X: -1.8 .. +1.8)
  addWall(4.1, 0, -8, 4.6, WH, TH);     // Z = -8 Mid Partition (X: +1.8 .. +6.4)
  addWall(7.8, 3.0, -8, 2.8, 1.2, TH);  // Z = -8 Dining North Archway Lintel (X: +6.4 .. +9.2)
  addWall(14.6, 0, -8, 10.8, WH, TH);   // Z = -8 East Partition (X: +9.2 .. +20.0)
  addWall(0, 0, -20, 40, WH, TH);       // Full North Back Outer Wall (X: -20 .. +20)

  // Ground North Wing Subdivisions: West Armoury (X: -20..-6), Central Trophy Hall (X: -6..+6), East Servant Quarters (X: +6..+20)
  addWall(-6.0, 0, -10.5, TH, WH, 5.0); // West Armoury partition South (Z: -13..-8)
  addWall(-6.0, 0, -17.5, TH, WH, 5.0); // West Armoury partition North (Z: -20..-15)
  addWall(-6.0, 2.8, -14.0, TH, 1.4, 2.0); // Armoury doorway lintel
  addWall(6.0, 0, -10.5, TH, WH, 5.0);  // East Servant partition South (Z: -13..-8)
  addWall(6.0, 0, -17.5, TH, WH, 5.0);  // East Servant partition North (Z: -20..-15)
  addWall(6.0, 2.8, -14.0, TH, 1.4, 2.0); // Servant Quarters doorway lintel

  // --- MAIN ELECTRICAL BREAKER FUSE BOX (Grand Foyer East Side X=5.6, Y=1.45, Z=14.5) ---
  const breakerGroup = new THREE.Group();
  breakerGroup.position.set(5.58, 1.5, 14.5);
  breakerGroup.rotation.y = -Math.PI / 2;
  const breakerHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.78, 0.18),
    new THREE.MeshStandardMaterial({ map: breakerTex, roughness: 0.4, metalness: 0.65 })
  );
  const breakerLever = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.08), brassMat);
  breakerLever.position.set(0.32, 0.0, 0.05);
  const breakerLedMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  breakerLedMesh.position.set(0, 0.45, 0.08);
  breakerGroup.add(breakerHousing, breakerLever, breakerLedMesh);
  root.add(breakerGroup);

  interactives.push({
    id: 'main-breaker-box',
    type: 'breaker_box',
    name: 'Main Power Breaker Box',
    position: new THREE.Vector3(5.45, 1.5, 14.5),
    mesh: breakerGroup,
    prompt: 'Inspect Main Power Breaker [E]',
  });

  // Puja Prayer Room (East Wing South, Z: 10.5..17, X: 6..20)
  addWall(9.5, 0, 10.5, 7.0, WH, TH);
  addWall(17.5, 0, 10.5, 5.0, WH, TH);
  addWall(13.5, 2.8, 10.5, 2.5, 1.4, TH);

  const pujaAltar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.0), darkTeakMat);
  pujaAltar.position.set(17.5, 0.45, 15.8);
  root.add(pujaAltar);
  colliders.push(new THREE.Box3().setFromObject(pujaAltar));

  const pujaCarpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.9 })
  );
  pujaCarpet.rotation.x = -Math.PI / 2;
  pujaCarpet.position.set(13.5, 0.015, 13.5);
  root.add(pujaCarpet);

  // Hanging Temple Bell in Puja Room
  const bellGroup = new THREE.Group();
  bellGroup.position.set(13.5, 3.2, 13.5);
  const bellChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9), brassMat);
  bellChain.position.y = 0.45;
  const bellBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 12), brassMat);
  bellGroup.add(bellChain, bellBody);
  root.add(bellGroup);

  // Dining Hall (East Wing North, Z: -8..1.5, X: 6..20)
  addWall(9.5, 0, 1.5, 7.0, WH, TH);
  addWall(17.5, 0, 1.5, 5.0, WH, TH);
  addWall(13.5, 2.8, 1.5, 2.5, 1.4, TH);

  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 1.6), darkTeakMat);
  diningTable.position.set(13.5, 0.85, -3.5);
  root.add(diningTable);
  for (const dx of [-1.7, 1.7]) {
    for (const dz of [-0.65, 0.65]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.82, 8), darkTeakMat);
      leg.position.set(13.5 + dx, 0.41, -3.5 + dz);
      root.add(leg);
    }
  }
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(13.5, 0.45, -3.5), new THREE.Vector3(4.0, 0.9, 1.6)));

  const candleGlow = new THREE.PointLight(0xff9933, 1.1, 7.0, 1.8);
  candleGlow.position.set(13.5, 1.5, -3.5);
  root.add(candleGlow);
  flickerLights.push(candleGlow);

  // Kitchen North Doorway (Z = 5.0)
  addWall(-16.5, 0, 5.0, 7.0, WH, TH);
  addWall(-8.5, 0, 5.0, 5.0, WH, TH);
  addWall(-12.0, 2.8, 5.0, 2.0, 1.4, TH);

  // Tantric Blood Decals
  const tantricTex = createTantricWallWritingTexture();
  const tantricMat = new THREE.MeshBasicMaterial({ map: tantricTex, transparent: true, opacity: 0.9, depthWrite: false });
  const bloodDecal1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), tantricMat);
  bloodDecal1.position.set(-19.77, 2.3, 14.5);
  bloodDecal1.rotation.y = Math.PI / 2;
  root.add(bloodDecal1);

  const bloodDecal2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), tantricMat);
  bloodDecal2.position.set(-3.58, 6.4, -2.5);
  bloodDecal2.rotation.y = Math.PI / 2;
  root.add(bloodDecal2);

  // =========================================================================
  // 5. LEVEL -1: OPEN BASEMENT ARCHWAY, CRYPT STAIRCASE & RIVER BOAT DOCK (Y = -3.0)
  // =========================================================================
  // Stone Archway Pillars & Overhead "BASEMENT CRYPT" Signboard right at top of stairs (Z = 0.0)
  for (const ax of [-19.35, -15.0]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.3, 0.45), stoneMat);
    pillar.position.set(ax, 1.65, 0.0);
    root.add(pillar);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(ax, 1.65, 0.0), new THREE.Vector3(0.45, 3.3, 0.45)));
  }
  const basementHeader = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.75, 0.45), stoneMat);
  basementHeader.position.set(-17.175, 3.45, 0.0);
  root.add(basementHeader);

  const signTex = createBasementSignTexture();
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.85),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(-17.175, 3.35, 0.24);
  root.add(signMesh);

  // Crypt Steps descending from Z = 0.0 (Y = 0.0) to Z = -7.0 (Y = -3.0) along X = -17.15 (Wide 3.9m stairs!)
  const cryptSteps = 15;
  for (let s = 0; s < cryptSteps; s++) {
    const sy = -(s + 0.5) * (3.0 / cryptSteps);
    const sz = -0.22 - s * (6.78 / cryptSteps);
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.24, 0.52), stoneMat);
    step.position.set(-17.15, sy, sz);
    step.receiveShadow = true;
    root.add(step);
  }

  // Safety Iron Guardrails flanking Basement Stairwell on Ground Level (West, East & Rear North rail at Z = -7.2)
  const cryptGuardRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 7.0), ironMat);
  cryptGuardRail.position.set(-15.0, 0.52, -3.7);
  root.add(cryptGuardRail);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-15.0, 0.55, -3.7), new THREE.Vector3(0.22, 1.4, 7.0)));

  const cryptGuardWest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 7.0), ironMat);
  cryptGuardWest.position.set(-19.35, 0.52, -3.7);
  root.add(cryptGuardWest);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-19.35, 0.55, -3.7), new THREE.Vector3(0.22, 1.4, 7.0)));

  const cryptGuardNorth = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.05, 0.14), ironMat);
  cryptGuardNorth.position.set(-17.175, 0.52, -7.2);
  root.add(cryptGuardNorth);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-17.175, 0.55, -7.2), new THREE.Vector3(4.5, 1.4, 0.22)));

  // Crypt Underground Chamber (X: -21..-5, Z: -21..-7, Floor Y = -3.0, Ceiling Y = -0.25)
  addFloor(-13, -3.0, -10.8, 16, 7.6, stoneMat); // Solid Dock Stone Floor (Z: -14.6..-7.0)
  addCeiling(-13, -0.25, -14, 16, 14, catacombMat);

  // Catacomb Perimeter Walls (Y = -3.0 to -0.25) — East Wall opens at Z = -12.6..-9.8 into East Bone Ritual Vault!
  addWall(-21, -3.0, -14, TH, 2.8, 14, catacombMat);  // West Crypt Wall
  addWall(-5, -3.0, -16.8, TH, 2.8, 8.4, catacombMat); // East Crypt Wall North of Arch (Z: -21..-12.6)
  addWall(-5, -3.0, -8.4, TH, 2.8, 2.8, catacombMat);  // East Crypt Wall South of Arch (Z: -9.8..-7.0)
  addWall(-5, -0.95, -11.2, TH, 0.75, 2.8, catacombMat); // Vault Stone Archway Lintel
  addWall(-13, -3.0, -21, 16, 2.8, TH, catacombMat);  // North Canal Far Wall
  addWall(-10, -3.0, -7.0, 10, 2.8, TH, catacombMat); // South Crypt Wall East of Stairs (X: -15..-5)
  addWall(-20, -3.0, -7.0, 2.0, 2.8, TH, catacombMat); // South Crypt Wall West of Stairs

  // Underground Bone & Ritual Vault Chamber (X: -5..+5, Z: -16..-7, Y = -3.0)
  addFloor(0, -3.0, -11.5, 10, 9, stoneMat);
  addCeiling(0, -0.25, -11.5, 10, 9, catacombMat);
  addWall(5, -3.0, -11.5, TH, 2.8, 9, catacombMat);   // Vault East Wall
  addWall(0, -3.0, -16, 10, 2.8, TH, catacombMat);    // Vault North Wall
  addWall(0, -3.0, -7.0, 10, 2.8, TH, catacombMat);   // Vault South Wall
  const vaultLight = new THREE.PointLight(0xdc2626, 1.35, 10, 1.6);
  vaultLight.position.set(0.5, -0.8, -11.5);
  root.add(vaultLight);
  flickerLights.push(vaultLight);

  // Subterranean Black River Canal Water (Z: -21..-14.6, Y = -3.35)
  const canalWater = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.4), waterMat);
  canalWater.rotation.x = -Math.PI / 2;
  canalWater.position.set(-13, -3.28, -17.8);
  root.add(canalWater);

  // Crypt Dock Eerie Teal Lanterns
  const cryptLight1 = new THREE.PointLight(0x14b8a6, 1.6, 12, 1.6);
  cryptLight1.position.set(-13, -0.9, -12.5);
  root.add(cryptLight1);
  flickerLights.push(cryptLight1);

  const cryptLight2 = new THREE.PointLight(0xf59e0b, 1.2, 9, 1.8);
  cryptLight2.position.set(-17.2, -1.2, -4.0);
  root.add(cryptLight2);
  flickerLights.push(cryptLight2);

  // --- ESCAPE ROUTE 2: MOORED KALAPUR WOODEN RIVER BOAT & FLOODGATE SEAL ---
  const dockGateGroup = new THREE.Group();
  dockGateGroup.position.set(-12.0, -3.0, -14.6);

  // Rusted Floodgate Iron Bars across Dock Edge (pried by Crowbar)
  const cryptBarsGroup = new THREE.Group();
  for (let bx = -1.6; bx <= 1.6; bx += 0.32) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), ironMat);
    b.position.set(bx, 1.2, 0);
    cryptBarsGroup.add(b);
  }
  dockGateGroup.add(cryptBarsGroup);

  // Glowing Crimson Blood Ward Seal across Canal Arch (dispelled by Sacred Tantric Bell)
  const cryptSealMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.2),
    new THREE.MeshBasicMaterial({ map: mandalaTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  cryptSealMesh.position.set(0, 1.3, 0.06);
  dockGateGroup.add(cryptSealMesh);

  // Wooden Rowboat Floating on Canal (Z = -16.8)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(0, -0.22, -2.1);
  boatGroup.rotation.y = Math.PI / 2;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 1.25), darkTeakMat);
  hull.castShadow = true;
  const bench1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 1.15), brassMat);
  bench1.position.set(-0.6, 0.22, 0);
  const bench2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 1.15), brassMat);
  bench2.position.set(0.6, 0.22, 0);
  const boatLantern = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  boatLantern.position.set(-1.45, 0.42, 0);
  boatGroup.add(hull, bench1, bench2, boatLantern);
  dockGateGroup.add(boatGroup);

  root.add(dockGateGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-12, -2.0, -14.8), new THREE.Vector3(14, 2.2, 0.5)));

  interactives.push({
    id: 'escape-boat-dock',
    type: 'escape_boat',
    name: 'Underground River Escape Boat',
    position: new THREE.Vector3(-12.0, -2.0, -13.9),
    mesh: dockGateGroup,
    prompt: 'Inspect Flooded Canal Boat [E]',
    action: () => {
      if (gameState.cellarBarsPried) cryptBarsGroup.visible = false;
      if (gameState.cellarSealBroken) cryptSealMesh.visible = false;
    },
  });

  // =========================================================================
  // 6. CENTRAL STAIRCASE & UPPER FLOOR WALLS (+ SECRET PASSAGE)
  // =========================================================================
  const stepCount = 20;
  const stairWidth = 3.4;
  const startZ = 7.5;
  const endZ = -1.5;
  const dz = (endZ - startZ) / stepCount;
  const dy = 4.5 / stepCount;

  for (let s = 0; s < stepCount; s++) {
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, dy, Math.abs(dz) + 0.05), darkTeakMat);
    stepMesh.position.set(0, s * dy + dy / 2, startZ + s * dz);
    stepMesh.receiveShadow = true;
    root.add(stepMesh);
  }

  const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 9.5), brassMat);
  railLeft.position.set(-1.8, 2.7, 3.0);
  railLeft.rotation.x = 0.44;
  root.add(railLeft);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-1.85, 2.5, 3.0), new THREE.Vector3(0.25, 4.5, 9.5)));

  const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 9.5), brassMat);
  railRight.position.set(1.8, 2.7, 3.0);
  railRight.rotation.x = 0.44;
  root.add(railRight);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(1.85, 2.5, 3.0), new THREE.Vector3(0.25, 4.5, 9.5)));

  const mezRailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 9.2), brassMat);
  mezRailL.position.set(-2.0, 5.05, 3.0);
  root.add(mezRailL);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-2.0, 5.05, 3.0), new THREE.Vector3(0.2, 1.2, 9.2)));

  const mezRailR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 9.2), brassMat);
  mezRailR.position.set(2.0, 5.05, 3.0);
  root.add(mezRailR);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(2.0, 5.05, 3.0), new THREE.Vector3(0.2, 1.2, 9.2)));

  const mezRailS = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 0.1), brassMat);
  mezRailS.position.set(0, 5.05, 8.2);
  root.add(mezRailS);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 5.05, 8.2), new THREE.Vector3(4.0, 1.2, 0.2)));

  // Upper Floor 2 Walls — Sealed Bedroom Doors & Open South Gallery Archway Z: 5.2 .. 8.0 into Floor 3 Attic Stairs!
  const UWH = 4.1;
  addWall(-3.8, 4.5, -4.4, TH, UWH, 7.2);   // Z: -8.0 .. -0.8 (Seals Guest Door West side)
  addWall(-3.8, 4.5, 3.0, TH, UWH, 4.4);    // Z: +0.8 .. +5.2 (Leaves Z: 5.2..8.0 open to 3F Attic Stairs!)
  addWall(-3.8, 7.2, 6.6, TH, 1.4, 2.8);    // Attic Stairway Arch Lintel
  addWall(-3.8, 7.2, 0.0, TH, 1.4, 1.6);    // Guest Door Lintel

  addWall(3.8, 4.5, -4.4, TH, UWH, 7.2);    // Z: -8.0 .. -0.8 (Seals Master Door East side!)
  addWall(3.8, 4.5, 4.4, TH, UWH, 7.2);     // Z: +0.8 .. +8.0 (Seals Master Door East side!)
  addWall(3.8, 7.2, 0.0, TH, 1.4, 1.6);     // Master Door Lintel

  addWall(-2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(0, 7.2, -8, 2, 1.3, TH);

  // 3rd Floor Attic Perimeter Knee & Gable Walls (Y = 8.8) + Subdivided Seance Parlor & Observatory Loft
  addWall(-12, 8.8, -2.0, TH, 3.5, 20);
  addWall(12, 8.8, -2.0, TH, 3.5, 20);
  addWall(0, 8.8, -12, 24, 4.5, TH);
  addWall(0, 8.8, 8, 24, 4.5, TH);

  // Attic Interior Partitions (height 3.1 so cleanly inside pitched roof beams!)
  addWall(-1.0, 8.8, -10.0, TH, 3.1, 4.0);  // Seance Parlor West Wall North (Z: -12..-8)
  addWall(-1.0, 11.3, -7.0, TH, 0.6, 2.0);  // Seance Parlor Door Lintel
  addWall(-1.0, 8.8, -3.75, TH, 3.1, 4.5);  // Seance Parlor West Wall South (Z: -6..-1.5)
  addWall(1.25, 8.8, -1.5, 4.5, 3.1, TH);   // Seance Parlor South Wall West (X: -1..3.5)
  addWall(4.5, 11.3, -1.5, 2.0, 0.6, TH);   // Seance->Observatory Archway Lintel
  addWall(8.75, 8.8, -1.5, 6.5, 3.1, TH);   // Seance Parlor South Wall East (X: 5.5..12)

  // Master Bedchamber & Nursery (East Upper) — Z = -8 has Doorway (X: 11..13) into NE Zamindar Astrology Study!
  addWall(20, 4.5, 0, TH, UWH, 16);
  addWall(12, 4.5, 8, 16, UWH, TH);
  addWall(7.5, 4.5, -8, 7.0, UWH, TH);      // Z = -8 West pier (X: 4..11)
  addWall(12.0, 7.2, -8, 2.0, 1.4, TH);     // Z = -8 Study Door Lintel
  addWall(16.5, 4.5, -8, 7.0, UWH, TH);     // Z = -8 East pier (X: 13..20)
  addWall(7.5, 4.5, 0, 7.0, UWH, TH);
  addWall(17.5, 4.5, 0, 5.0, UWH, TH);
  addWall(12.5, 7.2, 0, 3.0, 1.3, TH);

  // NE Zamindar Astrology & Study Chamber Perimeter (X: 8..20, Z: -20..-8, Y = 4.5)
  addWall(20, 4.5, -14, TH, UWH, 12);
  addWall(14, 4.5, -20, 12, UWH, TH);

  // Guest Bedchamber & Haunted Library (West Upper) with SECRET BOOKCASE GAP at X = -12, Z = -8!
  addWall(-20, 4.5, 0, TH, UWH, 16);
  addWall(-12, 4.5, 8, 16, UWH, TH);
  addWall(-7.4, 4.5, -8, 6.8, UWH, TH);   // X: -10.8 .. -4.0
  addWall(-16.6, 4.5, -8, 6.8, UWH, TH);  // X: -20.0 .. -13.2
  addWall(-12, 7.2, -8, 2.4, 1.3, TH);    // Secret Passage Door Lintel X: -13.2 .. -10.8
  addWall(-7.5, 4.5, 0, 7.0, UWH, TH);
  addWall(-17.5, 4.5, 0, 5.0, UWH, TH);
  addWall(-12.5, 7.2, 0, 3.0, 1.3, TH);

  // Secret Passage Walls (X: -16..-8, Z: -16..-8) + Archway into Mystic Sanctum at X = -8, Z = -12!
  addWall(-16, 4.5, -12, TH, UWH, 8);
  addWall(-12, 4.5, -16, 8, UWH, TH);

  // Mystic Sanctum Walls (West wall has Secret Archive opening Z: -13..-11; East wall opens Z: -15..-13 into Astrology Study!)
  addWall(-8, 4.5, -9.5, TH, UWH, 3);
  addWall(-8, 4.5, -16.5, TH, UWH, 7);
  addWall(-8, 7.2, -12, TH, 1.3, 2.5);
  addWall(8, 4.5, -10.5, TH, UWH, 5.0);
  addWall(8, 4.5, -17.5, TH, UWH, 5.0);
  addWall(8, 7.2, -14.0, TH, 1.4, 2.0);
  addWall(0, 4.5, -20, 16, UWH, TH);

  // REVOLVING SECRET BOOKCASE DOOR at X = -12, Y = 4.5, Z = -8
  const secretBookcaseGroup = new THREE.Group();
  secretBookcaseGroup.position.set(-13.1, 4.5, -8.0); // Hinge on West side
  const shelfLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.45), darkTeakMat);
  shelfLeaf.position.set(1.1, 1.35, 0);
  // Colored leather antique books on shelf
  for (let row = 0; row < 3; row++) {
    for (let bk = 0; bk < 6; bk++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.35, 0.3),
        new THREE.MeshStandardMaterial({ color: bk % 2 === 0 ? 0x7f1d1d : 0x92400e, roughness: 0.8 })
      );
      book.position.set(0.35 + bk * 0.28, 0.55 + row * 0.72, 0.12);
      secretBookcaseGroup.add(book);
    }
  }
  secretBookcaseGroup.add(shelfLeaf);
  root.add(secretBookcaseGroup);

  const secretBookcaseCollider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(-12.0, 5.85, -8.0),
    new THREE.Vector3(2.3, 2.7, 0.55)
  );
  interactives.push({
    id: 'secret-library-bookcase',
    type: 'secret_bookcase',
    name: 'Revolving Antique Bookshelf',
    position: new THREE.Vector3(-12.0, 5.9, -7.8),
    mesh: secretBookcaseGroup,
    prompt: 'Pull Suspicious Book [E]',
    isOpen: false,
    colliderBox: secretBookcaseCollider,
  });

  // =========================================================================
  // 7. SEALED COURTYARD PERIMETER, EAST GARAGE + 1954 CAR & FORTIFIED IRON GATE
  // =========================================================================
  // West Courtyard Wall aligned flush at X = -12 & Open East Driveway Wall into Garage (Closed tightly at Z = 31!)
  addWall(-12, 0, 24.0, TH, 3.8, 14.4, stoneMat);
  addWall(12, 0, 18.6, TH, 3.8, 3.2, stoneMat); // North pier of driveway
  addWall(12, 0, 28.5, TH, 3.8, 5.4, stoneMat); // South pier of driveway joining gate wall tightly at Z=31
  // Solid Courtyard Perimeter Walls flanking Iron Gate flush at Z = 31 (Zero side gaps!)
  addWall(-7.05, 0, 31.0, 10.1, 3.8, TH, stoneMat);
  addWall(7.05, 0, 31.0, 10.1, 3.8, TH, stoneMat);
  // Iron Gate Stone Header Archway (X = -2.2..+2.2, Y = 3.5..4.2, Z = 31.0)
  addWall(0, 3.5, 31.0, 4.4, 0.7, 0.6, stoneMat);
  // Forged Iron Spikes atop South Courtyard Wall (X: -11.6..-2.4 and 2.4..11.6)
  for (let sx = -11.6; sx <= 11.6; sx += 0.6) {
    if (Math.abs(sx) < 2.3) continue;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.42, 4), ironMat);
    spike.position.set(sx, 4.0, 31.0);
    root.add(spike);
  }

  // --- EAST COURTYARD GARAGE / CARRIAGE SHED (X: 12..24, Z: 17..31) ---
  addWall(24, 0, 24, TH, 3.8, 14.4, garageWallMat); // East wall
  addWall(21.1, 0, 17, 5.8, 3.8, TH, garageWallMat); // North wall East of Garage Archway (X: 18.2..24.0, ZERO overlap!)
  // Garage South Roll-Up Exit Shutter (X: 18, Z: 31)
  const garageShutter = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.8, 0.35), garageWallMat);
  garageShutter.position.set(18, 1.9, 31);
  root.add(garageShutter);
  colliders.push(new THREE.Box3().setFromObject(garageShutter));
  // Garage Roof Slab
  addCeiling(18, 3.85, 24, 12.4, 14.4, garageWallMat);

  // Garage Work Light
  const garageLight = new THREE.PointLight(0xfbbf24, 1.4, 12, 1.5);
  garageLight.position.set(18, 3.4, 24);
  root.add(garageLight);
  flickerLights.push(garageLight);

  // --- ESCAPE ROUTE 3: 1954 VINTAGE KALAPUR ESCAPE SEDAN (Inside Garage at X=18, Z=24) ---
  const carGroup = new THREE.Group();
  carGroup.position.set(18.0, 0, 24.0);
  const carPaintMat = new THREE.MeshStandardMaterial({ color: 0x14332b, roughness: 0.45, metalness: 0.65 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.6 });

  // Lower Chassis Body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 4.4), carPaintMat);
  chassis.position.y = 0.68;
  chassis.castShadow = true;
  carGroup.add(chassis);

  // Upper Cabin & Roof
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.68, 2.2), carPaintMat);
  cabin.position.set(0, 1.35, -0.3);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Front Windshield & Grille (Facing South Z+)
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.56), windshieldMat);
  windshield.position.set(0, 1.32, 0.81);
  windshield.rotation.x = -0.2;
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.08), steelMat);
  grille.position.set(0, 0.65, 2.22);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.15), steelMat);
  bumper.position.set(0, 0.38, 2.26);
  carGroup.add(windshield, grille, bumper);

  // 4 Rubber Wheels with Chrome Hubcaps
  for (const wx of [-1.05, 1.05]) {
    for (const wz of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12), steelMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wx, 0.38, wz);
      carGroup.add(wheel, hub);
    }
  }

  // Twin Working Car Headlights (lit when Car Battery installed!)
  for (const hx of [-0.72, 0.72]) {
    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x334155 })
    );
    bulbMesh.position.set(hx, 0.72, 2.22);
    carGroup.add(bulbMesh);
    carHeadlightBulbs.push(bulbMesh);

    const hLight = new THREE.SpotLight(0xfef9c3, 0, 18, Math.PI / 5, 0.45, 1.4);
    hLight.position.set(hx, 0.75, 2.25);
    const hTarget = new THREE.Object3D();
    hTarget.position.set(hx, 0.4, 9.0);
    carGroup.add(hLight, hTarget);
    hLight.target = hTarget;
    carHeadlights.push(hLight);
  }

  root.add(carGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(18, 0.9, 24), new THREE.Vector3(2.3, 1.8, 4.5)));

  interactives.push({
    id: 'vintage-escape-car',
    type: 'escape_car',
    name: '1954 Vintage Escape Car',
    position: new THREE.Vector3(16.6, 1.1, 24.0),
    mesh: carGroup,
    prompt: 'Inspect 1954 Escape Car [E]',
  });

  // Tulsi Vrindavan & Haunted Stone Well in Courtyard
  const tulsiGroup = new THREE.Group();
  tulsiGroup.position.set(0, 0, 24);
  const tulsiBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), stoneMat);
  tulsiBase.position.y = 0.7;
  const plantMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial({ color: 0x1f3b18, roughness: 0.9 }));
  plantMesh.position.y = 1.9;
  tulsiGroup.add(tulsiBase, plantMesh);
  root.add(tulsiGroup);
  colliders.push(new THREE.Box3().setFromObject(tulsiBase));

  const wellGroup = new THREE.Group();
  wellGroup.position.set(-6.5, 0, 23);
  const wellRimOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 1.2, 16, 1, true), stoneMat);
  wellRimOuter.position.y = 0.6;
  const wellWater = new THREE.Mesh(new THREE.CircleGeometry(1.18, 16), new THREE.MeshStandardMaterial({ color: 0x071317, roughness: 0.1, metalness: 0.9 }));
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.y = 0.25;
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.18), darkTeakMat);
  crossBeam.position.set(0, 2.5, 0);
  const wellGlow = new THREE.PointLight(0x22c55e, 0.8, 4.0, 2.0);
  wellGlow.position.set(0, 0.6, 0);
  wellGroup.add(wellRimOuter, wellWater, crossBeam, wellGlow);
  root.add(wellGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-6.5, 0.6, 23), new THREE.Vector3(3.2, 1.2, 3.2)));

  interactives.push({
    id: 'haunted-well',
    type: 'diary',
    name: 'Ancient Kalapur Well',
    position: new THREE.Vector3(-6.5, 1.0, 21.5),
    mesh: wellGroup,
    prompt: 'Examine Ancient Well',
  });

  // Final Fortified Iron Escape Gate (X=0, Z=31)
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 31);
  for (const px of [-1.9, 1.9]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.0, 0.7), stoneMat);
    pillar.position.set(px, 2.0, 0);
    gateGroup.add(pillar);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(px, 2.0, 31), new THREE.Vector3(0.7, 4.0, 0.7)));
  }
  for (let b = -1.45; b <= 1.45; b += 0.22) {
    if (Math.abs(b) < 0.08) continue;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 3.4, 8), ironMat);
    bar.position.set(b, 1.7, 0);
    gateGroup.add(bar);
  }
  const gateChainMesh = new THREE.Group();
  gateChainMesh.position.set(0, 1.7, 0);
  for (let c = 0; c < 10; c++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 12), ironMat);
    link.position.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.25, c % 2 === 0 ? 0.08 : -0.08);
    link.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, c * 0.5);
    gateChainMesh.add(link);
  }
  gateGroup.add(gateChainMesh);

  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.1), brassMat);
  lockBody.position.set(0, 1.65, 0.12);
  gateGroup.add(lockBody);
  const gatePadlockMesh = lockBody;

  root.add(gateGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 1.8, 31), new THREE.Vector3(3.2, 3.6, 0.5)));

  // Grand Exit Door (X=0, Z=17)
  const exitDoorMesh = new THREE.Group();
  exitDoorMesh.position.set(-1.0, 0, 17);
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.15), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.8 }));
  doorLeaf.position.set(1.0, 1.6, 0);
  exitDoorMesh.add(doorLeaf);

  const frameMountMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.15),
    new THREE.MeshStandardMaterial({ map: emptyMountTex, roughness: 0.5, metalness: 0.4 })
  );
  frameMountMesh.position.set(1.0, 1.7, -0.09);
  frameMountMesh.rotation.y = Math.PI;
  exitDoorMesh.add(frameMountMesh);

  const placedFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.2, 0.06),
    new THREE.MeshStandardMaterial({ map: portraitTex, roughness: 0.4, metalness: 0.5 })
  );
  placedFrameMesh.position.set(1.0, 1.7, -0.09);
  placedFrameMesh.rotation.y = Math.PI;
  placedFrameMesh.visible = false;
  exitDoorMesh.add(placedFrameMesh);
  root.add(exitDoorMesh);

  interactives.push({
    id: 'exit-door',
    type: 'door',
    name: 'Grand Exit Door',
    position: new THREE.Vector3(0, 1.6, 16.5),
    mesh: exitDoorMesh,
    prompt: 'Examine Grand Exit Door',
    doorId: 'exitDoor',
    colliderBox: new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1.6, 17.0),
      new THREE.Vector3(2.1, 3.2, 0.35)
    ),
  });

  const escapeTriggerMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshBasicMaterial({ visible: false }));
  escapeTriggerMesh.position.set(0, 1.5, 30);
  root.add(escapeTriggerMesh);
  interactives.push({
    id: 'escape-gate',
    type: 'exit_gate',
    name: 'Mansion Gate',
    position: new THREE.Vector3(0, 1.5, 30),
    mesh: escapeTriggerMesh,
    prompt: 'Escape through Iron Gate!',
  });

  function createInteriorDoor(
    id: string,
    name: string,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    reqKey?: string,
    width = 1.6
  ) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);
    doorGroup.rotation.y = rotY;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(width, 2.8, 0.12), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.8 }));
    leaf.position.set(width / 2, 1.4, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25), brassMat);
    handle.position.set(width - 0.2, 1.4, 0.1);
    doorGroup.add(leaf, handle);
    root.add(doorGroup);

    // Exact world center of door leaf accounting for rotY
    const centerX = x + Math.cos(rotY) * (width / 2);
    const centerZ = z - Math.sin(rotY) * (width / 2);
    const spanX = Math.abs(Math.cos(rotY)) * width + Math.abs(Math.sin(rotY)) * 0.28;
    const spanZ = Math.abs(Math.sin(rotY)) * width + Math.abs(Math.cos(rotY)) * 0.28;

    interactives.push({
      id,
      type: 'door',
      name,
      position: new THREE.Vector3(centerX, y + 1.4, centerZ),
      mesh: doorGroup,
      prompt: reqKey ? `Unlock ${name}` : `Open ${name}`,
      requiresKey: reqKey,
      doorId: id,
      colliderBox: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(centerX, y + 1.4, centerZ),
        new THREE.Vector3(spanX, 2.8, spanZ)
      ),
    });
    return doorGroup;
  }

  createInteriorDoor('door-master', 'Master Bedroom Door', 3.8, 4.5, 0.8, Math.PI / 2, 'hasBrassKey', 1.6);
  createInteriorDoor('door-guest', 'Guest Bedroom Door', -3.8, 4.5, 0.8, Math.PI / 2, undefined, 1.6);
  createInteriorDoor('door-attic', 'Mystic Sanctum Gate', -0.95, 4.5, -8, 0, undefined, 1.9);
  createInteriorDoor('door-kitchen', 'Kitchen Door', -13.0, 0, 5.0, 0, undefined, 1.9);
  createInteriorDoor('door-garage', 'Garage Service Door', 14.0, 0, 17.0, 0, undefined, 2.0);
  createInteriorDoor('door-armoury', 'Armoury Door', -6.0, 0, -13.0, Math.PI / 2, undefined, 2.0);
  createInteriorDoor('door-servant', 'Servant Quarters Door', 6.0, 0, -13.0, Math.PI / 2, undefined, 2.0);
  createInteriorDoor('door-study', 'Astrology Study Door', 11.0, 4.5, -8.0, 0, undefined, 2.0);
  createInteriorDoor('door-attic-seance', 'Seance Parlor Door', -1.0, 8.8, -6.0, Math.PI / 2, undefined, 2.0);

  // =========================================================================
  // 8. FURNITURE, HIDING PLACES, BATHROOMS, MIRRORS & ARCHIVE PLAQUE
  // =========================================================================
  function createWardrobe(id: string, name: string, x: number, y: number, z: number, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.0, 1.0), darkTeakMat);
    body.position.set(0, 1.5, 0);
    g.add(body);
    root.add(g);
    colliders.push(new THREE.Box3().setFromObject(body));
    interactives.push({
      id,
      type: 'hiding',
      name,
      position: new THREE.Vector3(x, y + 1.5, z),
      mesh: g,
      prompt: `Hide inside ${name}`,
      hidingType: 'wardrobe',
      hidingCameraOffset: new THREE.Vector3(x, y + 1.6, z),
    });
  }

  function createCharpaiBed(id: string, name: string, x: number, y: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 3.2), darkTeakMat);
    frame.position.set(0, 0.8, 0);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 3.0), new THREE.MeshStandardMaterial({ color: 0x47382d, roughness: 0.9 }));
    mattress.position.set(0, 0.95, 0);
    g.add(frame, mattress);
    for (const lx of [-1.0, 1.0]) {
      for (const lz of [-1.4, 1.4]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), darkTeakMat);
        leg.position.set(lx, 0.4, lz);
        g.add(leg);
      }
    }
    root.add(g);
    colliders.push(new THREE.Box3().setFromObject(frame));
    interactives.push({
      id,
      type: 'hiding',
      name,
      position: new THREE.Vector3(x, y + 0.5, z),
      mesh: g,
      prompt: `Hide beneath ${name}`,
      hidingType: 'underbed',
      hidingCameraOffset: new THREE.Vector3(x, y + 0.35, z),
    });
  }

  createWardrobe('hide-master-wardrobe', 'Antique Teak Almirah', 17, 4.5, 4.5, Math.PI);
  createCharpaiBed('hide-master-bed', 'Royal Zamindar Bed', 12, 4.5, 4.0);
  createWardrobe('hide-guest-wardrobe', 'Carved Wooden Wardrobe', -17, 4.5, 4.5, 0);
  createCharpaiBed('hide-guest-bed', 'Guest Charpai Bed', -12, 4.5, 3.5);
  createWardrobe('hide-foyer-closet', 'Foyer Cloak Almirah', -4.2, 0, 2.0, Math.PI / 2);
  createWardrobe('hide-north-wardrobe', 'Trophy Hall Almirah', -3.8, 0, -17.5, 0);
  createWardrobe('hide-armoury-wardrobe', 'Armoury Gear Locker', -18.5, 0, -10.5, Math.PI / 2);
  createCharpaiBed('hide-servant-bed', 'Servant Charpai Cot', 11.5, 0, -17.5);
  createWardrobe('hide-study-wardrobe', 'Astrology Archive Almirah', 18.6, 4.5, -17.5, -Math.PI / 2);
  createWardrobe('hide-attic-wardrobe', 'Attic Dust Trunk Closet', 9.8, 8.8, -8.5, -Math.PI / 2);

  // Living Room Suite: Plush Velvet Diwan, Armchairs, Brass Coffee Table + Tea Tray, Tall Shelf & Gramophone
  const velvetRedMat = new THREE.MeshStandardMaterial({ color: 0x6b141a, roughness: 0.85 });
  const diwan = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.58, 1.4), velvetRedMat);
  diwan.position.set(13, 0.29, 8.6);
  const diwanBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 0.24), darkTeakMat);
  diwanBack.position.set(13, 0.72, 9.2);
  root.add(diwan, diwanBack);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(13, 0.5, 8.7), new THREE.Vector3(3.6, 1.0, 1.5)));

  // Coffee Table with Brass Kettle & Cups
  const coffeeTableTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.1), darkTeakMat);
  coffeeTableTop.position.set(13, 0.52, 6.2);
  root.add(coffeeTableTop);
  for (const lx of [-0.85, 0.85]) {
    for (const lz of [-0.45, 0.45]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.5, 8), darkTeakMat);
      leg.position.set(13 + lx, 0.25, 6.2 + lz);
      root.add(leg);
    }
  }
  const brassKettle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), brassMat);
  brassKettle.position.set(12.8, 0.68, 6.2);
  const brassCup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8), brassMat);
  brassCup.position.set(13.2, 0.61, 6.1);
  root.add(brassKettle, brassCup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(13, 0.3, 6.2), new THREE.Vector3(2.0, 0.6, 1.1)));

  // Living Room Velvet Armchair + Brass Gramophone Side Stand
  const armchair = new THREE.Group();
  armchair.position.set(16.6, 0, 5.4);
  armchair.rotation.y = -Math.PI / 3;
  const acSeat = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.45, 1.0), velvetRedMat);
  acSeat.position.y = 0.225;
  const acBack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.2), darkTeakMat);
  acBack.position.set(0, 0.65, -0.4);
  armchair.add(acSeat, acBack);
  root.add(armchair);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(16.6, 0.5, 5.4), new THREE.Vector3(1.1, 1.0, 1.1)));

  const gramophoneStand = new THREE.Group();
  gramophoneStand.position.set(18.6, 0, 2.6);
  const gBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.85), darkTeakMat);
  gBase.position.y = 0.45;
  const gHorn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 12, 1, true), brassMat);
  gHorn.position.set(0, 1.15, 0.1);
  gHorn.rotation.x = 0.75;
  gramophoneStand.add(gBase, gHorn);
  root.add(gramophoneStand);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(18.6, 0.55, 2.6), new THREE.Vector3(0.9, 1.1, 0.9)));

  // 6 Carved Dining Chairs around the Grand Dining Table + Tall Crockery Sideboard
  for (const cx of [12.1, 13.5, 14.9]) {
    for (const side of [-1.15, 1.15]) {
      const ch = new THREE.Group();
      ch.position.set(cx, 0, -3.5 + side);
      ch.rotation.y = side > 0 ? Math.PI : 0;
      const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), darkTeakMat);
      cSeat.position.y = 0.48;
      const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.07), velvetRedMat);
      cBack.position.set(0, 0.82, -0.24);
      ch.add(cSeat, cBack);
      root.add(ch);
      colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(cx, 0.5, -3.5 + side), new THREE.Vector3(0.58, 1.0, 0.58)));
    }
  }
  const diningCupboard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.5, 2.6), darkTeakMat);
  diningCupboard.position.set(19.2, 1.25, -3.5);
  root.add(diningCupboard);
  colliders.push(new THREE.Box3().setFromObject(diningCupboard));

  // Grand Foyer Coat Rack & Velvet Entry Bench
  const entryBench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 0.75), velvetRedMat);
  entryBench.position.set(3.8, 0.26, 7.2);
  root.add(entryBench);
  colliders.push(new THREE.Box3().setFromObject(entryBench));

  // Kitchen Counter, Vintage Icebox, Wooden Pantry, Prep Island & Hanging Copper Vessels
  const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.95, 1.6), stoneMat);
  kitchenCounter.position.set(-13, 0.475, 15);
  root.add(kitchenCounter);
  colliders.push(new THREE.Box3().setFromObject(kitchenCounter));
  const gasStove = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.0), gasStoveMat);
  gasStove.position.set(-14.2, 1.01, 15);
  root.add(gasStove);
  const lpgCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 16), lpgCylinderMat);
  lpgCylinder.position.set(-15.8, 0.55, 15);
  root.add(lpgCylinder);
  colliders.push(new THREE.Box3().setFromObject(lpgCylinder));

  const vintageFridge = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 2.1, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.45 })
  );
  vintageFridge.position.set(-19.1, 1.05, 14.5);
  root.add(vintageFridge);
  colliders.push(new THREE.Box3().setFromObject(vintageFridge));

  const pantryCupboard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.35, 2.4), darkTeakMat);
  pantryCupboard.position.set(-19.1, 1.175, 8.2);
  root.add(pantryCupboard);
  colliders.push(new THREE.Box3().setFromObject(pantryCupboard));

  const kitchenIsland = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.15), darkTeakMat);
  kitchenIsland.position.set(-14.2, 0.45, 9.5);
  root.add(kitchenIsland);
  colliders.push(new THREE.Box3().setFromObject(kitchenIsland));

  function createInteractiveWaterTap(id: string, name: string, x: number, y: number, z: number, rotY = 0) {
    const tapGroup = new THREE.Group();
    tapGroup.position.set(x, y, z);
    tapGroup.rotation.y = rotY;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), brassMat);
    pipe.position.set(0, 0.07, 0.05);
    pipe.rotation.x = Math.PI / 3;
    const streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.35, 8), waterMat);
    streamMesh.position.set(0, -0.15, 0.1);
    streamMesh.visible = false;
    tapGroup.add(pipe, streamMesh);
    waterStreams.push(streamMesh);
    root.add(tapGroup);
    interactives.push({
      id,
      type: 'tap',
      name,
      position: new THREE.Vector3(x, y, z),
      mesh: tapGroup,
      prompt: `Turn on ${name} [E]`,
      isOpen: false,
      waterStreamMesh: streamMesh,
    });
  }
  createInteractiveWaterTap('tap-kitchen-sink', 'Kitchen Tap', -11.2, 1.05, 15.3, Math.PI);

  // Ground Floor Bathroom (X: -20.0 .. -13.8, Z: 1.8 .. 5.0 — leaves 1.8m wide corridor for Basement Entrance!)
  addFloor(-16.9, 0.012, 3.4, 6.2, 3.2, bathroomTileMat);
  addWall(-16.9, 0, 1.8, 6.2, WH, 0.35, wallMat);
  addWall(-13.8, 0, 2.2, 0.35, WH, 0.8, wallMat);
  addWall(-13.8, 0, 4.5, 0.35, WH, 1.0, wallMat);
  addWall(-13.8, 2.8, 3.3, 0.35, 1.4, 1.4, wallMat);

  // Bathroom Fixtures: Bathtub, Commode, Vanity Sink + Cracked Mirror
  const bathtub = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 1.05), ceramicMat);
  bathtub.position.set(-18.4, 0.325, 2.45);
  root.add(bathtub);
  colliders.push(new THREE.Box3().setFromObject(bathtub));

  const toiletBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.45, 12), ceramicMat);
  toiletBase.position.set(-18.9, 0.225, 4.35);
  const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.22), ceramicMat);
  toiletTank.position.set(-19.15, 0.65, 4.35);
  root.add(toiletBase, toiletTank);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-18.95, 0.45, 4.35), new THREE.Vector3(0.75, 0.9, 0.6)));

  const bathSink = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.55), ceramicMat);
  bathSink.position.set(-15.6, 0.425, 2.25);
  root.add(bathSink);
  colliders.push(new THREE.Box3().setFromObject(bathSink));
  createInteractiveWaterTap('tap-bath-sink', 'Bathroom Tap', -15.6, 0.92, 2.15, 0);

  const gfMirror = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.15), mirrorMat);
  gfMirror.position.set(-15.6, 1.85, 2.02);
  root.add(gfMirror);
  interactives.push({
    id: 'haunted-mirror-gf',
    type: 'mirror_spook',
    name: 'Cracked Silver Mirror',
    position: new THREE.Vector3(-15.6, 1.6, 2.35),
    mesh: gfMirror,
    prompt: 'Peer into Cracked Mirror [E]',
  });

  // Storage Wing Furniture: Jumpable Wooden Crates & Dust-Covered Barrels
  for (const [cx, cy, cz, sx, sy, sz] of [
    [-8.4, 0, -5.6, 1.25, 0.9, 1.25],
    [-9.9, 0, -5.8, 1.0, 0.72, 1.0],
    [-8.2, 0.9, -5.7, 0.75, 0.62, 0.75],
    [-19.1, -3.0, -9.2, 1.15, 0.85, 1.15],
    [-6.6, -3.0, -11.5, 1.1, 0.85, 1.1],
  ] as [number, number, number, number, number, number][]) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), darkTeakMat);
    crate.position.set(cx, cy + sy / 2, cz);
    root.add(crate);
    colliders.push(new THREE.Box3().setFromObject(crate));
  }
  for (const [bx, by, bz] of [
    [-7.2, 0, -2.5],
    [-19.5, -3.0, -12.6],
    [-16.2, -3.0, -13.2],
  ] as [number, number, number][]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.95, 12), darkTeakMat);
    barrel.position.set(bx, by + 0.475, bz);
    root.add(barrel);
    colliders.push(new THREE.Box3().setFromObject(barrel));
  }

  // Crypt Underground Ritual Stone Altar
  const cryptAltar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.92, 0.95), stoneMat);
  cryptAltar.position.set(-14.2, -2.54, -8.3);
  root.add(cryptAltar);
  colliders.push(new THREE.Box3().setFromObject(cryptAltar));

  // Garage Props: Spare Tire Stack, Oil Drums & Mechanic Red Tool Cabinet
  for (let t = 0; t < 3; t++) {
    const tire = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.14, 10, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    tire.rotation.x = Math.PI / 2;
    tire.position.set(13.4, 0.14 + t * 0.26, 28.5);
    root.add(tire);
  }
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(13.4, 0.45, 28.5), new THREE.Vector3(0.95, 0.9, 0.95)));

  const redToolChest = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.15, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.4 })
  );
  redToolChest.position.set(22.9, 0.575, 27.2);
  root.add(redToolChest);
  colliders.push(new THREE.Box3().setFromObject(redToolChest));

  // Upper Floor Room Furniture: Nursery Cradle (West clearance for Washroom), Upper Master Washroom, Bookshelves, Astrology Study
  const crib = new THREE.Group();
  crib.position.set(10.2, 4.5, -4.5);
  const cribBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 1.0), darkTeakMat);
  cribBase.position.y = 0.45;
  crib.add(cribBase);
  root.add(crib);
  colliders.push(new THREE.Box3().setFromObject(cribBase));

  const toyChest = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.68, 0.75), velvetRedMat);
  toyChest.position.set(9.2, 4.84, -6.5);
  root.add(toyChest);
  colliders.push(new THREE.Box3().setFromObject(toyChest));

  // Upper Master Washroom (X: 15.6..20.0, Z: -8.0..-3.6, Y = 4.5) — matches UF_BATH_POS audio!
  addFloor(17.8, 4.512, -5.8, 4.4, 4.4, bathroomTileMat);
  addWall(17.8, 4.5, -3.6, 4.4, UWH, 0.3, wallMat);
  addWall(15.6, 4.5, -6.8, 0.3, UWH, 2.4, wallMat);
  addWall(15.6, 7.3, -4.8, 0.3, 1.3, 1.6, wallMat);
  addWall(15.6, 4.5, -3.8, 0.3, UWH, 0.4, wallMat);

  const ufTub = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 1.05), ceramicMat);
  ufTub.position.set(18.5, 4.825, -7.2);
  root.add(ufTub);
  colliders.push(new THREE.Box3().setFromObject(ufTub));

  const ufToiletBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.45, 12), ceramicMat);
  ufToiletBase.position.set(19.2, 4.725, -4.35);
  const ufToiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.22), ceramicMat);
  ufToiletTank.position.set(19.45, 5.15, -4.35);
  root.add(ufToiletBase, ufToiletTank);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(19.25, 4.95, -4.35), new THREE.Vector3(0.75, 0.9, 0.6)));

  const ufSink = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.55), ceramicMat);
  ufSink.position.set(17.2, 4.925, -4.05);
  root.add(ufSink);
  colliders.push(new THREE.Box3().setFromObject(ufSink));
  createInteractiveWaterTap('tap-uf-bath', 'Upper Washroom Tap', 17.2, 5.42, -3.95, Math.PI);

  const ufMirror = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.15), mirrorMat);
  ufMirror.position.set(17.2, 6.35, -3.77);
  ufMirror.rotation.y = Math.PI;
  root.add(ufMirror);
  interactives.push({
    id: 'haunted-mirror-uf',
    type: 'mirror_spook',
    name: 'Tarnished Washroom Mirror',
    position: new THREE.Vector3(17.2, 6.0, -4.15),
    mesh: ufMirror,
    prompt: 'Peer into Washroom Mirror [E]',
  });

  // Underground Bone Vault Coffin & Chains (X: -5..+5, Z: -16..-7, Y = -3.0)
  const vaultCoffin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.72, 2.2), darkTeakMat);
  vaultCoffin.position.set(1.5, -2.64, -13.6);
  const vaultCoffinTrim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 1.8), brassMat);
  vaultCoffinTrim.position.set(1.5, -2.26, -13.6);
  root.add(vaultCoffin, vaultCoffinTrim);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(1.5, -2.6, -13.6), new THREE.Vector3(1.15, 0.85, 2.25)));

  const vaultCrate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 1.15), darkTeakMat);
  vaultCrate.position.set(3.4, -2.575, -9.0);
  root.add(vaultCrate);
  colliders.push(new THREE.Box3().setFromObject(vaultCrate));

  // West Ground Armoury Weapon Display Rack & Supply Chest (X: -20..-6, Z: -20..-8)
  const armouryRack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.55), darkTeakMat);
  armouryRack.position.set(-16.2, 1.1, -19.2);
  root.add(armouryRack);
  for (const sx of [-17.1, -16.2, -15.3]) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 14), brassMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(sx, 1.55, -18.88);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.03), steelMat);
    blade.position.set(sx, 0.9, -18.88);
    root.add(shield, blade);
  }
  colliders.push(new THREE.Box3().setFromObject(armouryRack));

  const armouryChest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.85), ironMat);
  armouryChest.position.set(-10.8, 0.36, -18.6);
  root.add(armouryChest);
  colliders.push(new THREE.Box3().setFromObject(armouryChest));

  // East Ground Servant Quarters Spice Rack & Wine Barrels (X: +6..+20, Z: -20..-8)
  const spiceShelf = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.1, 0.65), darkTeakMat);
  spiceShelf.position.set(16.5, 1.05, -8.8);
  root.add(spiceShelf);
  colliders.push(new THREE.Box3().setFromObject(spiceShelf));
  for (const [bx, bz] of [
    [18.6, -18.4],
    [17.6, -18.6],
  ] as [number, number][]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.98, 12), darkTeakMat);
    barrel.position.set(bx, 0.49, bz);
    root.add(barrel);
    colliders.push(new THREE.Box3().setFromObject(barrel));
  }

  // NE Upper Astrology Study Brass Celestial Globe Table & Bookcases (X: 8..20, Z: -20..-8, Y = 4.5)
  const studyTable = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.9, 0.82, 8), darkTeakMat);
  studyTable.position.set(14.0, 4.91, -14.0);
  const globeRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 20), brassMat);
  globeRing.position.set(14.0, 5.75, -14.0);
  const globeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.6 })
  );
  globeSphere.position.set(14.0, 5.75, -14.0);
  root.add(studyTable, globeRing, globeSphere);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(14.0, 5.0, -14.0), new THREE.Vector3(2.1, 1.2, 2.1)));

  for (const [sx, sz] of [
    [11.0, -19.3],
    [15.0, -19.3],
  ] as [number, number][]) {
    const studyShelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.55), darkTeakMat);
    studyShelf.position.set(sx, 5.9, sz);
    root.add(studyShelf);
    colliders.push(new THREE.Box3().setFromObject(studyShelf));
  }

  // Tall Library Bookcases along West Library Walls
  for (const [bx, bz, rot] of [
    [-19.2, -4.0, Math.PI / 2],
    [-19.2, -1.5, Math.PI / 2],
    [-16.0, -7.2, 0],
  ] as [number, number, number][]) {
    const bc = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.55), darkTeakMat);
    bc.position.set(bx, 4.5 + 1.45, bz);
    bc.rotation.y = rot;
    root.add(bc);
    colliders.push(new THREE.Box3().setFromObject(bc));
  }

  // 4 Carved Mystic Sanctum Stone Ritual Pillars surrounding the Mandala
  for (const [px, pz] of [
    [-4.2, -11.0],
    [4.2, -11.0],
    [-4.2, -17.0],
    [4.2, -17.0],
  ] as [number, number][]) {
    const sPil = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.0, 0.65), stoneMat);
    sPil.position.set(px, 6.5, pz);
    root.add(sPil);
    colliders.push(new THREE.Box3().setFromObject(sPil));
  }

  // Grandfathers Clocks
  function createGrandfatherClock(x: number, y: number, z: number, rotY = 0) {
    const cg = new THREE.Group();
    cg.position.set(x, y, z);
    cg.rotation.y = rotY;
    const cCase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.9, 0.55), darkTeakMat);
    cCase.position.y = 1.45;
    const cFace = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), clockFaceMat);
    cFace.position.set(0, 2.32, 0.28);
    const pPivot = new THREE.Group();
    pPivot.position.set(0, 1.8, 0.15);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85), brassMat);
    rod.position.y = -0.42;
    pPivot.add(rod);
    pendulums.push(pPivot);
    cg.add(cCase, cFace, pPivot);
    root.add(cg);
    colliders.push(new THREE.Box3().setFromObject(cCase));
  }
  createGrandfatherClock(18.5, 0, 4.5, -Math.PI / 4);
  createGrandfatherClock(-3.1, 4.5, -6.5, Math.PI / 2);

  // Official STRANGE CREATION Memorial Brass Plaque
  const plaquePedestal = new THREE.Group();
  plaquePedestal.position.set(3.2, 0, 14.0);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.8), darkTeakMat);
  plinth.position.y = 0.55;
  const plaquePlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05), strangeLogoMat);
  plaquePlate.position.set(0, 1.2, 0);
  plaquePlate.rotation.set(-0.4, -0.2, 0);
  plaquePedestal.add(plinth, plaquePlate);
  root.add(plaquePedestal);
  colliders.push(new THREE.Box3().setFromObject(plinth));
  interactives.push({
    id: 'strange-creation-plaque',
    type: 'diary',
    name: 'STRANGE CREATION Memorial Plaque',
    position: new THREE.Vector3(3.2, 1.2, 14.0),
    mesh: plaquePedestal,
    prompt: 'Inspect STRANGE CREATION Plaque [E]',
    action: () => {
      gameState.showSubtitle('STRANGE CREATION: Directed by Soham Dnyaneshwar Lokhande (MR STRANGE 1229)', 5000);
    },
  });

  // Carpets & Velvet Curtains + Moonlight Cones
  const carpetMat = new THREE.MeshStandardMaterial({ map: createCarpetTexture(), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const [cx, cy, cz, cw, cd] of [
    [0, 0.025, 11, 5.0, 7.0],
    [13, 0.025, 6.8, 6.5, 6.5],
    [13.5, 0.025, -3.5, 6.0, 4.8],
    [12, 4.525, 4.0, 5.5, 5.5],
    [-12, 4.525, 4.0, 5.5, 5.5],
    [-12, 4.525, -4.0, 5.5, 5.5],
  ] as [number, number, number, number, number][]) {
    const carp = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), carpetMat);
    carp.rotation.x = -Math.PI / 2;
    carp.position.set(cx, cy, cz);
    root.add(carp);
  }

  const windowMat = new THREE.MeshStandardMaterial({
    map: createWindowRainTexture(),
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.45,
  });
  for (const wz of [7, 12]) {
    const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), windowMat);
    winMesh.position.set(19.78, 2.2, wz);
    winMesh.rotation.y = -Math.PI / 2;
    root.add(winMesh);
    addMoonbeam(17.5, 1.9, wz, -Math.PI / 2);
  }
  const northWin = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.4), windowMat);
  northWin.position.set(0, 6.4, -19.78);
  root.add(northWin);
  addMoonbeam(0, 5.8, -17.5, 0);

  // Wall Portraits & Paintings on EVERY Room Wall
  const tatyaPhotoTex = createTatyaWallPhotoTexture();
  const tatyaEyesTex = createTatyaCloseupEyesTexture();
  const tatyaDaggerTex = createTatyaDaggerPortraitTexture();
  const tatyaArchiveTex = createTatyaVintageArchiveTexture();
  const tatyaShrineTex = createTatyaShrineTexture();
  const annabelleTex = createAnnabelleDollTexture();
  const dollFamTex = createCursedDollFamilyTexture(0);
  const dollTwinsTex = createCursedDollFamilyTexture(1);
  const dollMasterTex = createCursedDollFamilyTexture(2);
  const famTex = createIndianFamilyPhotoTexture(0);
  const wedTex = createIndianFamilyPhotoTexture(1);
  const purvajaTex = createIndianFamilyPhotoTexture(2);
  const ancTex = createAncestorGalleryTexture(0);
  const paintTextures = [0, 1, 2, 3, 4, 5].map((i) => createHauntedPaintingTexture(i));

  function addPastedWallPortrait(
    x: number,
    y: number,
    z: number,
    rotY: number,
    w: number,
    h: number,
    tex: THREE.Texture,
    useBrassFrame = false
  ) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.045),
      useBrassFrame ? brassMat : darkTeakMat
    );
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42 })
    );
    photo.position.z = 0.025;
    g.add(frame, photo);
    root.add(g);
  }

  // Grand Foyer Exit Door Jamb Piers (Placed cleanly on remaining 1.2m piers!)
  addPastedWallPortrait(1.6, 2.3, 16.77, Math.PI, 0.9, 1.25, tatyaPhotoTex);
  addPastedWallPortrait(-1.6, 2.3, 16.77, Math.PI, 0.9, 1.25, tatyaEyesTex);

  // Full-Span Open North Trophy Gallery Walls (Z = -19.77, X = -19.77, X = 19.77) — zero floating paintings!
  addPastedWallPortrait(-19.77, 2.3, -13.5, Math.PI / 2, 1.45, 1.08, paintTextures[3], true);
  addPastedWallPortrait(-14.5, 2.3, -19.77, 0, 1.25, 1.55, tatyaArchiveTex);
  addPastedWallPortrait(-8.5, 2.3, -19.77, 0, 1.5, 1.12, paintTextures[2], true); // River boat clue!
  addPastedWallPortrait(-2.5, 2.3, -19.77, 0, 1.45, 1.08, famTex, true);
  addPastedWallPortrait(3.5, 2.3, -19.77, 0, 1.5, 1.85, tatyaPhotoTex, true);
  addPastedWallPortrait(9.5, 2.3, -19.77, 0, 1.45, 1.08, wedTex, true);
  addPastedWallPortrait(15.5, 2.3, -19.77, 0, 1.35, 1.0, paintTextures[0]);
  addPastedWallPortrait(19.77, 2.3, -13.5, -Math.PI / 2, 1.45, 1.08, purvajaTex);

  // Living Room & Dining Hall (East Ground Wing)
  addPastedWallPortrait(19.77, 2.3, 3.6, -Math.PI / 2, 1.25, 1.55, tatyaDaggerTex);
  addPastedWallPortrait(10.0, 2.3, 1.73, 0, 1.45, 1.08, paintTextures[1], true);
  addPastedWallPortrait(16.0, 2.3, 10.27, Math.PI, 1.45, 1.08, paintTextures[0]);
  addPastedWallPortrait(19.77, 2.4, -3.5, -Math.PI / 2, 1.45, 1.08, purvajaTex);
  addPastedWallPortrait(9.2, 2.3, 1.27, Math.PI, 1.4, 1.05, paintTextures[4]);

  // Puja Prayer Room & Garage
  addPastedWallPortrait(19.77, 2.3, 15.0, -Math.PI / 2, 1.3, 1.6, tatyaShrineTex, true);
  addPastedWallPortrait(19.77, 2.3, 12.2, -Math.PI / 2, 1.3, 1.0, paintTextures[4]);
  addPastedWallPortrait(9.0, 2.3, 10.73, 0, 1.4, 1.05, paintTextures[5]);
  addPastedWallPortrait(23.77, 2.1, 22.0, -Math.PI / 2, 1.6, 1.2, paintTextures[3], true);
  addPastedWallPortrait(21.2, 2.1, 17.23, 0, 1.5, 1.12, paintTextures[0]);

  // Kitchen, Storage Wing & Basement Entrance Walls (West Ground Wing)
  addPastedWallPortrait(-19.77, 2.3, 8.2, Math.PI / 2, 1.45, 1.08, paintTextures[5]);
  addPastedWallPortrait(-19.77, 2.3, 11.2, Math.PI / 2, 1.45, 1.08, paintTextures[1]);
  addPastedWallPortrait(-9.0, 2.3, 5.23, 0, 1.35, 1.0, paintTextures[0]);
  addPastedWallPortrait(-9.0, 2.3, 4.77, Math.PI, 1.4, 1.05, paintTextures[4]);

  // Subterranean Basement / River Crypt Walls (Y = -3.0)
  addPastedWallPortrait(-20.77, -1.35, -10.5, Math.PI / 2, 1.45, 1.08, paintTextures[2], true);
  addPastedWallPortrait(-5.23, -1.35, -10.5, -Math.PI / 2, 1.45, 1.08, paintTextures[4]);
  addPastedWallPortrait(-10.0, -1.35, -7.23, Math.PI, 1.35, 1.0, dollMasterTex);

  // Upper Floor Gallery, Master Bedroom, Nursery, Upper Washroom, Guest, Library, Secret Archive, Sanctum & Astrology Study
  addPastedWallPortrait(3.57, 6.3, 0, -Math.PI / 2, 1.15, 1.45, dollFamTex);
  addPastedWallPortrait(-3.57, 6.3, 0, Math.PI / 2, 1.15, 1.45, annabelleTex);
  addPastedWallPortrait(19.77, 6.4, 4.0, -Math.PI / 2, 1.45, 1.08, famTex, true);
  addPastedWallPortrait(12.0, 6.4, 7.77, Math.PI, 1.5, 1.12, paintTextures[1]);
  addPastedWallPortrait(8.0, 6.4, 0.23, 0, 1.35, 1.0, paintTextures[0]);
  addPastedWallPortrait(19.77, 6.4, -1.8, -Math.PI / 2, 1.2, 1.5, dollTwinsTex);
  addPastedWallPortrait(8.0, 6.4, -7.77, 0, 1.45, 1.08, paintTextures[3]);
  addPastedWallPortrait(-19.77, 6.4, 4.0, Math.PI / 2, 1.45, 1.08, paintTextures[5]);
  addPastedWallPortrait(-12.0, 6.4, 7.77, Math.PI, 1.45, 1.08, paintTextures[1]);
  addPastedWallPortrait(-19.77, 6.4, -6.0, Math.PI / 2, 1.3, 1.5, dollMasterTex);
  addPastedWallPortrait(-12.0, 6.4, -15.77, 0, 1.5, 1.12, paintTextures[2], true); // Secret Archive Boat clue!
  addPastedWallPortrait(0, 6.6, -19.77, 0, 1.6, 2.0, tatyaShrineTex, true);
  addPastedWallPortrait(-4.2, 6.5, -19.77, 0, 1.3, 1.6, ancTex);
  addPastedWallPortrait(4.2, 6.5, -19.77, 0, 1.45, 1.08, paintTextures[4], true);
  addPastedWallPortrait(7.77, 6.5, -10.5, -Math.PI / 2, 1.45, 1.08, paintTextures[0]);

  // New Rooms Wall Portraits (Armoury, Servant Quarters, Bone Vault, Astrology Study, Attic Seance Parlor)
  addPastedWallPortrait(-6.23, 2.3, -10.5, -Math.PI / 2, 1.35, 1.0, paintTextures[1]);
  addPastedWallPortrait(6.23, 2.3, -10.5, Math.PI / 2, 1.35, 1.0, paintTextures[5]);
  addPastedWallPortrait(4.77, -1.35, -11.5, -Math.PI / 2, 1.45, 1.08, paintTextures[3], true);
  addPastedWallPortrait(0.5, -1.35, -15.77, 0, 1.35, 1.55, tatyaDaggerTex);
  addPastedWallPortrait(19.77, 6.5, -14.0, -Math.PI / 2, 1.45, 1.75, ancTex, true);
  addPastedWallPortrait(16.0, 6.5, -8.23, Math.PI, 1.45, 1.08, wedTex, true);

  // 3rd Floor Attic Doll Workshop, Seance Parlor & Observatory Paintings (Y = 8.8)
  addPastedWallPortrait(-5.5, 10.9, -11.77, 0, 1.6, 1.85, tatyaEyesTex, true);
  addPastedWallPortrait(-9.0, 10.8, -11.77, 0, 1.35, 1.6, dollTwinsTex);
  addPastedWallPortrait(5.5, 10.8, -11.77, 0, 1.45, 1.08, paintTextures[3], true);
  addPastedWallPortrait(11.77, 10.6, -9.0, -Math.PI / 2, 1.4, 1.1, tatyaPhotoTex, true);
  addPastedWallPortrait(2.5, 10.8, 7.77, Math.PI, 1.45, 1.08, paintTextures[4]);
  addPastedWallPortrait(-11.77, 10.6, -4.0, Math.PI / 2, 1.25, 1.55, annabelleTex);

  // =========================================================================
  // 9. DRAWER TABLES & 3-ESCAPE TOOL SHUFFLE (100% ACCESSIBLE POOL!)
  // =========================================================================
  function createTableWithDrawer(
    id: string,
    tableName: string,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    itemConfig?: {
      id: string;
      type: InteractiveType;
      name: string;
      mesh: THREE.Group;
    }
  ) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);
    tableGroup.rotation.y = rotY;

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.9), darkTeakMat);
    top.position.y = 0.85;
    tableGroup.add(top);

    for (const lx of [-0.65, 0.65]) {
      for (const lz of [-0.35, 0.35]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.82, 8), darkTeakMat);
        leg.position.set(lx, 0.41, lz);
        tableGroup.add(leg);
      }
    }

    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0, 0.73, 0);
    const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.04), darkTeakMat);
    drawerFront.position.set(0, 0, 0.38);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brassMat);
    knob.position.set(0, 0, 0.41);
    const drawerBottom = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.65), darkTeakMat);
    drawerBottom.position.set(0, -0.06, 0.05);
    drawerGroup.add(drawerFront, knob, drawerBottom);

    const frontDirX = Math.sin(rotY);
    const frontDirZ = Math.cos(rotY);

    if (itemConfig) {
      itemConfig.mesh.position.set(0, -0.042, 0.14);
      attachItemGlint(itemConfig.mesh, 0xfbbf24, 0.15);
      drawerGroup.add(itemConfig.mesh);

      interactives.push({
        id: itemConfig.id,
        type: itemConfig.type,
        name: itemConfig.name,
        position: new THREE.Vector3(x + frontDirX * 0.14, y + 0.7, z + frontDirZ * 0.14),
        mesh: itemConfig.mesh,
        prompt: `Pick up ${itemConfig.name} [E]`,
        drawerId: id,
        action: () => {
          itemConfig.mesh.visible = false;
        },
      });
    }

    tableGroup.add(drawerGroup);
    root.add(tableGroup);
    const colSizeX = Math.abs(Math.cos(rotY)) * 1.5 + Math.abs(Math.sin(rotY)) * 0.9;
    const colSizeZ = Math.abs(Math.sin(rotY)) * 1.5 + Math.abs(Math.cos(rotY)) * 0.9;
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y + 0.45, z), new THREE.Vector3(colSizeX, 0.9, colSizeZ)));

    interactives.push({
      id: `drawer-${id}`,
      type: 'drawer',
      name: `${tableName} Drawer`,
      position: new THREE.Vector3(x + frontDirX * 0.42, y + 0.73, z + frontDirZ * 0.42),
      mesh: drawerGroup,
      drawerMesh: drawerGroup,
      drawerId: id,
      prompt: `Open ${tableName} Drawer [E]`,
    });
  }

  // Shared accent materials for crisp realistic keys & tools
  const rubberRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55, metalness: 0.08 });
  const rubberDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.1 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.9 });
  const crimsonGemMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.5, roughness: 0.18, metalness: 0.3 });
  const yellowLabelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  const oakOarMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.55, metalness: 0.08 });

  // Helper to craft a real antique skeleton/padlock key (Ornate bow + collar + shaft + stepped teeth bit)
  function buildRealSkeletonKey(mat: THREE.Material, bowRadius: number, shaftLen: number, addGem = false, teethCount = 3): THREE.Group {
    const g = new THREE.Group();
    const bow = new THREE.Mesh(new THREE.TorusGeometry(bowRadius, bowRadius * 0.24, 10, 22), mat);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(0, 0.018, -shaftLen * 0.35);

    const bowCrossH = new THREE.Mesh(new THREE.CylinderGeometry(bowRadius * 0.13, bowRadius * 0.13, bowRadius * 1.75, 8), mat);
    bowCrossH.rotation.z = Math.PI / 2;
    bowCrossH.position.copy(bow.position);

    const bowCrossV = new THREE.Mesh(new THREE.CylinderGeometry(bowRadius * 0.13, bowRadius * 0.13, bowRadius * 1.75, 8), mat);
    bowCrossV.rotation.x = Math.PI / 2;
    bowCrossV.position.copy(bow.position);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(bowRadius * 0.36, bowRadius * 0.3, 0.024, 12), mat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.018, -shaftLen * 0.35 + bowRadius + 0.012);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.01, shaftLen, 10), mat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0.018, collar.position.z + shaftLen * 0.5);

    const tipPin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.01, 0.018, 8), mat);
    tipPin.rotation.x = Math.PI / 2;
    tipPin.position.set(0, 0.018, shaft.position.z + shaftLen * 0.5 + 0.009);

    g.add(bow, bowCrossH, bowCrossV, collar, shaft, tipPin);

    if (addGem) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(bowRadius * 0.32, 0), crimsonGemMat);
      gem.position.set(bow.position.x, 0.022, bow.position.z);
      g.add(gem);
    }

    // Precision key bit spine + distinct notched key teeth
    const bitStartZ = shaft.position.z + shaftLen * 0.5 - 0.018;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.068), mat);
    spine.position.set(0.018, 0.018, bitStartZ - 0.032);
    g.add(spine);

    for (let t = 0; t < teethCount; t++) {
      const toothLen = t % 2 === 0 ? 0.034 : 0.024;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(toothLen, 0.011, 0.012), mat);
      tooth.position.set(0.036 + toothLen * 0.45, 0.018, bitStartZ - 0.008 - t * 0.018);
      g.add(tooth);
    }
    return g;
  }

  // 1. Old Brass Key (Master Bedroom)
  const brassKeyGroup = buildRealSkeletonKey(brassMat, 0.05, 0.19, false, 3);

  // 2. Sanctum Key (Mystic Attic — Antique blackened iron with ruby gem & 4 teeth)
  const sanctumKeyGroup = buildRealSkeletonKey(ironMat, 0.056, 0.21, true, 4);

  // 3. Heavy Gate Key (Outer Courtyard Padlock — Thick gleaming brass with embossed key tag)
  const gateKeyGroup = buildRealSkeletonKey(brassMat, 0.062, 0.22, false, 4);
  const gateKeyRing = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 14), steelMat);
  gateKeyRing.rotation.x = Math.PI / 2;
  gateKeyRing.position.set(-0.072, 0.018, -0.077);
  gateKeyGroup.add(gateKeyRing);

  // 4. Car Ignition Key (1954 Sedan — Bakelite black grip fob + brass emblem + grooved serrated steel blade)
  const carKeyGroup = new THREE.Group();
  const fobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.018, 12), rubberDarkMat);
  fobBody.position.set(0, 0.016, -0.08);
  const fobBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.021, 10), brassMat);
  fobBadge.position.copy(fobBody.position);
  const keyCollar = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.015, 0.022), steelMat);
  keyCollar.position.set(0, 0.016, -0.032);
  const ckBlade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.135), steelMat);
  ckBlade.position.set(0, 0.016, 0.045);
  carKeyGroup.add(fobBody, fobBadge, keyCollar, ckBlade);
  // 5 realistic serrated ignition cuts along blade edge
  for (let i = 0; i < 5; i++) {
    const serration = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.007, 0.012), steelMat);
    serration.position.set(0.01 + (i % 2) * 0.003, 0.016, -0.005 + i * 0.022);
    carKeyGroup.add(serration);
  }

  // 5. Heavy Bolt Cutters (Dual dipped-red handles, compound steel pivot plates, hex bolts & sharp curved jaws)
  const boltCuttersGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const handleRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 8), steelMat);
    handleRod.rotation.set(Math.PI / 2, 0, side * 0.16);
    handleRod.position.set(side * 0.048, 0.022, -0.05);

    const rubberGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.016, 0.16, 10), rubberRedMat);
    rubberGrip.rotation.copy(handleRod.rotation);
    rubberGrip.position.set(side * 0.062, 0.022, -0.115);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.085), ironMat);
    plate.rotation.y = -side * 0.22;
    plate.position.set(side * 0.024, 0.022, 0.085);

    const pivotBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.022, 6), brassMat);
    pivotBolt.position.set(side * 0.024, 0.024, 0.08);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.016, 0.072), steelMat);
    jaw.rotation.y = side * 0.34;
    jaw.position.set(side * 0.014, 0.022, 0.145);

    boltCuttersGroup.add(handleRod, rubberGrip, plate, pivotBolt, jaw);
  }
  const jawBridge = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.014, 0.024), ironMat);
  jawBridge.position.set(0, 0.022, 0.082);
  boltCuttersGroup.add(jawBridge);

  // 6. Heavy Steel Crowbar (Hexagonal red shaft + gooseneck curved claw hook + beveled chisel pry tip)
  const crowbarGroup = new THREE.Group();
  const cbShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.34, 6), rubberRedMat);
  cbShaft.rotation.x = Math.PI / 2;
  cbShaft.position.set(0, 0.02, 0);
  // Flattened pry chisel tip (front)
  const cbChisel = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.008, 0.055), steelMat);
  cbChisel.rotation.x = 0.22;
  cbChisel.position.set(0, 0.024, 0.185);
  // Gooseneck curved claw (back) lying neatly sideways so height stays compact inside drawer
  const cbBend1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), steelMat);
  cbBend1.rotation.set(Math.PI / 2, 0, -0.65);
  cbBend1.position.set(-0.02, 0.02, -0.185);
  const cbBend2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.01, 0.065, 6), steelMat);
  cbBend2.rotation.set(Math.PI / 2, 0, -1.55);
  cbBend2.position.set(-0.056, 0.02, -0.195);
  const cbClawL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.009, 0.032), steelMat);
  cbClawL.rotation.y = -0.35;
  cbClawL.position.set(-0.084, 0.02, -0.172);
  const cbClawR = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.009, 0.032), steelMat);
  cbClawR.rotation.y = -0.35;
  cbClawR.position.set(-0.068, 0.02, -0.168);
  crowbarGroup.add(cbShaft, cbChisel, cbBend1, cbBend2, cbClawL, cbClawR);

  // 7. Sacred Tantric Bell (Ornate Indian Puja Ghanti — Flared skirt, clapper ball, stepped rings & Trishul/Lotus handle)
  const tantricBellGroup = new THREE.Group();
  const bellWrapper = new THREE.Group();
  bellWrapper.rotation.x = Math.PI / 2.1; // Laid cleanly inside drawer so its full silhouette is clear & fits easily!
  bellWrapper.position.set(0, 0.058, 0.01);
  const tbSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.068, 0.06, 18), brassMat);
  tbSkirt.position.y = -0.025;
  const tbLip = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.008, 8, 20), brassMat);
  tbLip.rotation.x = Math.PI / 2;
  tbLip.position.y = -0.055;
  const tbCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.034, 0.035, 16), brassMat);
  tbCrown.position.y = 0.02;
  const tbClapper = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), copperMat);
  tbClapper.position.y = -0.056;
  const tbHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.085, 12), brassMat);
  tbHandle.position.y = 0.075;
  const tbRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 8, 14), brassMat);
  tbRing.position.y = 0.125;
  bellWrapper.add(tbSkirt, tbLip, tbCrown, tbClapper, tbHandle, tbRing);
  tantricBellGroup.add(bellWrapper);

  // 8. Fuel Jerrycan (Compact realistic Jerrycan laid on side so zero tabletop clipping — molded handle, ribs & cap)
  const fuelCanGroup = new THREE.Group();
  const canBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.095, 0.25), rubberRedMat);
  canBody.position.set(0, 0.05, 0);
  const canStripe = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.025, 0.09), yellowLabelMat);
  canStripe.position.set(0, 0.052, 0.01);
  const canHandleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.11, 8), rubberRedMat);
  canHandleBar.rotation.z = Math.PI / 2;
  canHandleBar.position.set(-0.02, 0.055, -0.14);
  const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.05, 10), brassMat);
  canSpout.rotation.x = Math.PI / 2.2;
  canSpout.position.set(0.068, 0.062, -0.145);
  const canCap = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.014, 12), yellowLabelMat);
  canCap.rotation.x = Math.PI / 2;
  canCap.position.set(0.068, 0.065, -0.172);
  fuelCanGroup.add(canBody, canStripe, canHandleBar, canSpout, canCap);

  // 9. Car Battery (12V Automotive Battery sized cleanly for drawer + dual + / - posts, carry strap & cell caps)
  const carBatteryGroup = new THREE.Group();
  const cbCase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.088, 0.16), rubberDarkMat);
  cbCase.position.set(0, 0.045, 0);
  const cbLid = new THREE.Mesh(new THREE.BoxGeometry(0.244, 0.014, 0.164), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 }));
  cbLid.position.set(0, 0.092, 0);
  const cbLabel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.004, 0.06), yellowLabelMat);
  cbLabel.position.set(0, 0.1, 0.03);
  const posCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.018, 0.008, 12), rubberRedMat);
  posCollar.position.set(-0.078, 0.102, -0.042);
  const posPost = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.011, 0.018, 10), steelMat);
  posPost.position.set(-0.078, 0.11, -0.042);
  const negCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.018, 0.008, 12), steelMat);
  negCollar.position.set(0.078, 0.102, -0.042);
  const negPost = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.011, 0.018, 10), steelMat);
  negPost.position.set(0.078, 0.11, -0.042);
  carBatteryGroup.add(cbCase, cbLid, cbLabel, posCollar, posPost, negCollar, negPost);
  for (let c = -2; c <= 2; c++) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8), rubberRedMat);
    cap.position.set(c * 0.036, 0.102, -0.01);
    carBatteryGroup.add(cap);
  }

  const guaranteedToolPool: Array<{ id: string; type: InteractiveType; name: string; mesh: THREE.Group }> = [
    { id: 'key-brass', type: 'key', name: 'Old Brass Key', mesh: brassKeyGroup },
    { id: 'key-attic', type: 'key', name: 'Sanctum Key', mesh: sanctumKeyGroup },
    { id: 'cutters-tool', type: 'cutters', name: 'Heavy Bolt Cutters', mesh: boltCuttersGroup },
    { id: 'key-gate', type: 'gate_key', name: 'Heavy Gate Key', mesh: gateKeyGroup },
    { id: 'tool-crowbar', type: 'crowbar', name: 'Heavy Steel Crowbar', mesh: crowbarGroup },
    { id: 'sacred-bell', type: 'bell', name: 'Sacred Tantric Bell', mesh: tantricBellGroup },
    { id: 'tool-fuel-can', type: 'fuel_can', name: 'Fuel Jerrycan', mesh: fuelCanGroup },
    { id: 'tool-car-battery', type: 'car_battery', name: 'Car Battery', mesh: carBatteryGroup },
    { id: 'tool-car-key', type: 'car_key', name: 'Car Ignition Key', mesh: carKeyGroup },
  ];

  // Fisher-Yates shuffle across the 9 GUARANTEED-ACCESSIBLE containers (Zero Softlocks!)
  for (let i = guaranteedToolPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [guaranteedToolPool[i], guaranteedToolPool[j]] = [guaranteedToolPool[j], guaranteedToolPool[i]];
  }

  createTableWithDrawer('kitchen', 'Kitchen Table', -11, 0, 14, Math.PI, guaranteedToolPool[0]);
  createTableWithDrawer('living', 'Living Room Table', 14, 0, 7, -Math.PI / 2, guaranteedToolPool[1]);
  createTableWithDrawer('storage', 'Storage Workbench', -13, 0, -3, 0, guaranteedToolPool[2]);
  createTableWithDrawer('dining', 'Grand Dining Buffet', 13, 0, -5, Math.PI / 2, guaranteedToolPool[3]);
  createTableWithDrawer('puja', 'Puja Shrine Cabinet', 17.5, 0, 13.5, -Math.PI / 2, guaranteedToolPool[4]);
  createTableWithDrawer('garage', 'Garage Tool Bench', 22.0, 0, 20.0, -Math.PI / 2, guaranteedToolPool[5]);
  createTableWithDrawer('crypt', 'Crypt Supply Chest', -8.5, -3.0, -10.5, 0, guaranteedToolPool[6]);
  createTableWithDrawer('library', 'Library Study Desk', -13, 4.5, -4, 0, guaranteedToolPool[7]);
  createTableWithDrawer('guest', 'Guest Nightstand', -12, 4.5, 4, Math.PI / 2, guaranteedToolPool[8]);

  // Helper to build a realistic D-cell flashlight battery (Black casing + copper top + positive terminal nub)
  function buildRealFlashlightBattery(scale = 1.0): THREE.Group {
    const g = new THREE.Group();
    const negCap = new THREE.Mesh(new THREE.CylinderGeometry(0.032 * scale, 0.032 * scale, 0.01 * scale, 14), steelMat);
    negCap.position.y = 0.005 * scale;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032 * scale, 0.032 * scale, 0.075 * scale, 14), rubberDarkMat);
    body.position.y = 0.047 * scale;
    const copperTop = new THREE.Mesh(new THREE.CylinderGeometry(0.0325 * scale, 0.0325 * scale, 0.035 * scale, 14), copperMat);
    copperTop.position.y = 0.102 * scale;
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * scale, 0.014 * scale, 0.012 * scale, 10), steelMat);
    nub.position.y = 0.125 * scale;
    g.add(negCap, body, copperTop, nub);
    return g;
  }

  // Inside Master Bedroom (locked by Brass Key): Spare Flashlight Battery!
  const masterBattGroup = buildRealFlashlightBattery(0.82);
  masterBattGroup.rotation.x = Math.PI / 2; // Lies neatly flat inside vanity drawer!
  createTableWithDrawer('master', 'Master Vanity', 12, 4.5, 1.5, 0, {
    id: 'batt-master',
    type: 'battery',
    name: 'Flashlight Battery',
    mesh: masterBattGroup,
  });

  // Wooden Boat Oars in Secret Library Archive (X = -14.2, Y = 5.1, Z = -12.0) — carved handles, shafts, neck collars & contoured blades!
  const oarsGroup = new THREE.Group();
  oarsGroup.position.set(-14.2, 5.1, -12.0);
  for (const ox of [-0.15, 0.15]) {
    const oar = new THREE.Group();
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.2, 10), rubberDarkMat);
    grip.position.y = 0.62;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.9, 10), oakOarMat);
    shaft.position.y = 0.12;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, 10), brassMat);
    collar.position.y = 0.36;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.022), oakOarMat);
    blade.position.y = -0.52;
    const bladeTip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.022, 12), oakOarMat);
    bladeTip.rotation.x = Math.PI / 2;
    bladeTip.position.y = -0.74;
    oar.add(grip, shaft, collar, blade, bladeTip);
    oar.rotation.z = ox * 0.6;
    oarsGroup.add(oar);
  }
  attachItemGlint(oarsGroup, 0x38bdf8, 0.3);
  root.add(oarsGroup);
  interactives.push({
    id: 'boat-oars-pickup',
    type: 'oars',
    name: 'Wooden Boat Oars',
    position: new THREE.Vector3(-14.2, 5.2, -12.0),
    mesh: oarsGroup,
    prompt: 'Pick up Wooden Boat Oars [E]',
    action: () => {
      oarsGroup.visible = false;
    },
  });

  // Extra Battery & Brass Decoy Lota Pickups across wings & newly added chambers
  const extraBatteries: [string, number, number, number][] = [
    ['batt-kitchen', -14.5, 1.1, 11],
    ['batt-garage', 22.0, 0.95, 25.0],
    ['batt-crypt', -18.5, -2.0, -12.5],
    ['batt-north', 2.5, 0.56, -16.5],
    ['batt-servant', 17.6, 1.06, -18.6],
    ['batt-attic', 5.0, 9.65, 4.2],
  ];
  for (const [bid, bx, by, bz] of extraBatteries) {
    const bg = buildRealFlashlightBattery(1.15);
    bg.position.set(bx, by - 0.04, bz);
    attachItemGlint(bg, 0xfacc15, 0.16);
    root.add(bg);
    interactives.push({
      id: bid,
      type: 'battery',
      name: 'Flashlight Battery',
      position: new THREE.Vector3(bx, by, bz),
      mesh: bg,
      prompt: 'Pick up Battery [E]',
      action: () => {
        bg.visible = false;
      },
    });
  }

  const decoyPickups: [string, number, number, number][] = [
    ['decoy-foyer', -3.2, 0.95, 13.5],
    ['decoy-secret', -10.5, 4.95, -13.5],
    ['decoy-garage', 15.0, 0.95, 20.0],
    ['decoy-vault', 3.4, -2.05, -9.0],
    ['decoy-attic', -4.2, 9.65, -9.8],
  ];
  for (const [did, dx, dy, dz] of decoyPickups) {
    const dg = new THREE.Group();
    dg.position.set(dx, dy - 0.02, dz);
    const lotaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.025, 14), brassMat);
    lotaBase.position.y = 0.012;
    const lotaBelly = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), brassMat);
    lotaBelly.scale.set(1, 0.85, 1);
    lotaBelly.position.y = 0.085;
    const lotaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.045, 14), brassMat);
    lotaNeck.position.y = 0.165;
    const lotaRim = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.011, 8, 16), brassMat);
    lotaRim.rotation.x = Math.PI / 2;
    lotaRim.position.y = 0.188;
    dg.add(lotaBase, lotaBelly, lotaNeck, lotaRim);
    attachItemGlint(dg, 0xf97316, 0.18);
    root.add(dg);
    interactives.push({
      id: did,
      type: 'decoy_pickup',
      name: 'Brass Decoy Lota (+1 Lure)',
      position: new THREE.Vector3(dx, dy, dz),
      mesh: dg,
      prompt: 'Pick up Brass Decoy Lota [E]',
      action: () => {
        dg.visible = false;
      },
    });
  }

  // Sacred Vibhuti Stun Ash Pouches (Stuns Tatya / Ghost for 9 seconds via [G] / STUN!)
  const stunMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.45, roughness: 0.4 });
  const stunPickups: [string, number, number, number][] = [
    ['stun-puja', 17.8, 0.98, 15.8],
    ['stun-study', 14.3, 5.4, -14.3],
    ['stun-attic', -8.8, 9.68, -6.5],
  ];
  for (const [sid, sx, sy, sz] of stunPickups) {
    const sg = new THREE.Group();
    sg.position.set(sx, sy, sz);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.09, 0.1, 12), brassMat);
    const ash = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.12, 10), stunMat);
    ash.position.y = 0.08;
    sg.add(bowl, ash);
    attachItemGlint(sg, 0xfbbf24, 0.22);
    root.add(sg);
    interactives.push({
      id: sid,
      type: 'stun_pickup',
      name: 'Sacred Vibhuti Pouch (+1 Stun)',
      position: new THREE.Vector3(sx, sy, sz),
      mesh: sg,
      prompt: 'Collect Sacred Vibhuti Stun Ash [E]',
      action: () => {
        sg.visible = false;
      },
    });
  }

  // --- CURSED ANCESTOR PHOTO FRAME ON SANCTUM ALTAR (X=0, Y=5.8, Z=-17) ---
  const sanctumAltar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.4), darkTeakMat);
  sanctumAltar.position.set(0, 5.0, -17);
  root.add(sanctumAltar);
  colliders.push(new THREE.Box3().setFromObject(sanctumAltar));

  const photoFrameGroup = new THREE.Group();
  photoFrameGroup.position.set(0, 5.8, -17);
  photoFrameGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.25, 0.08), brassMat));
  const portraitFace = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.1), new THREE.MeshStandardMaterial({ map: portraitTex, roughness: 0.4 }));
  portraitFace.position.z = 0.05;
  photoFrameGroup.add(portraitFace);
  root.add(photoFrameGroup);

  interactives.push({
    id: 'photo-frame-pickup',
    type: 'frame',
    name: 'Cursed Kalapur Photo Frame',
    position: new THREE.Vector3(0, 5.8, -17),
    mesh: photoFrameGroup,
    prompt: 'Take Ancestor Photo Frame [E]',
    action: () => {
      photoFrameGroup.visible = false;
    },
  });

  // Diary Lore Pages
  const createDiaryItem = (id: string, title: string, x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.45), new THREE.MeshStandardMaterial({ color: 0xe2d5be, roughness: 0.9 })));
    root.add(g);
    interactives.push({
      id,
      type: 'diary',
      name: title,
      position: new THREE.Vector3(x, y, z),
      mesh: g,
      prompt: `Read ${title} [E]`,
    });
  };
  createDiaryItem('diary1', "Zamindar's Final Journal", 13, 0.65, 7);
  createDiaryItem('diary2', 'Secret Library Archive', -12, 4.95, -11);
  createDiaryItem('diary3', 'Breaker & Curse Warning', 0.8, 5.55, -17);
  createDiaryItem('diary4', "Attic Dollmaker's Confession", -8.8, 9.65, -7.2);
  createDiaryItem('diary5', 'Bone Vault Ledger', 1.5, -2.2, -13.3);
  createDiaryItem('diary6', "Astrologer's Star Chart", 13.5, 5.36, -13.6);

  // =========================================================================
  // 10. ATMOSPHERIC LIGHTING, CHANDELIERS, UTENSILS, NEW ROOMS & SIGNS
  // =========================================================================
  const hemiLight = new THREE.HemisphereLight(0x283e63, 0x060405, 0.42);
  root.add(hemiLight);

  const moonLight = new THREE.DirectionalLight(0x5b7fb8, 0.55);
  moonLight.position.set(8, 16, 24);
  moonLight.castShadow = true;
  root.add(moonLight);

  function addLantern(x: number, y: number, z: number, color = 0xff8833, intensity = 1.25, distance = 9.5) {
    const light = new THREE.PointLight(color, intensity, distance, 1.6);
    light.position.set(x, y, z);
    light.userData.baseIntensity = intensity;
    root.add(light);
    flickerLights.push(light);
    const diyaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color }));
    diyaMesh.position.set(x, y, z);
    root.add(diyaMesh);
    return light;
  }

  addLantern(0, 3.2, 10, 0xff8833, 1.5, 11);
  addLantern(13, 3.2, 10, 0xff7722, 1.2, 9);
  addLantern(-13, 3.0, 10, 0xff6622, 0.9, 8);
  addLantern(-13, 3.0, -2, 0xff5511, 0.9, 8);
  addLantern(0, 3.1, -14, 0xf59e0b, 1.35, 11);      // Central North Trophy Hall
  addLantern(-13.0, 3.1, -14, 0xf59e0b, 1.25, 10);  // West Ground Armoury
  addLantern(13.5, 3.1, -14, 0xff7733, 1.2, 10);    // East Ground Servant Quarters
  addLantern(0, 7.0, 0, 0xff7733, 1.3, 10);
  addLantern(11, 7.0, 0, 0xff6622, 1.1, 9);
  addLantern(17.8, 7.2, -5.8, 0x93c5fd, 1.0, 7);    // Upper Master Washroom
  addLantern(-11, 7.0, 0, 0x60a5fa, 1.0, 9);        // Cold moonlight library accent
  addLantern(-12, 6.8, -12, 0xf59e0b, 1.1, 8);      // Secret Archive glow
  addLantern(0, 6.8, -14, 0xdc2626, 1.75, 12);      // Ritual crimson sanctum
  addLantern(14.0, 7.1, -14.0, 0xf59e0b, 1.35, 11); // NE Zamindar Astrology Study
  addLantern(-7.0, 11.4, -4.5, 0xf59e0b, 1.35, 11); // 3F Attic Workshop lantern
  addLantern(4.5, 11.4, -6.5, 0xef4444, 1.25, 10);  // 3F Attic Seance Parlor lantern
  addLantern(5.5, 11.4, 3.5, 0x93c5fd, 1.15, 11);   // 3F Attic Observatory moonlight

  // Vintage Brass Chandeliers (Foyer & Dining Hall)
  for (const [chX, chY, chZ] of [
    [0, 3.65, 12.2],
    [13.5, 3.65, -3.5],
  ] as [number, number, number][]) {
    const ch = new THREE.Group();
    ch.position.set(chX, chY, chZ);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), brassMat);
    stem.position.y = 0.32;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 8, 18), brassMat);
    ring.rotation.x = Math.PI / 2;
    ch.add(stem, ring);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      bulb.position.set(Math.cos(a) * 0.45, 0.06, Math.sin(a) * 0.45);
      ch.add(bulb);
    }
    root.add(ch);
  }

  // Indian Kitchen Brass Thalis, Handi & Clay Matka Water Pitcher
  const clayMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
  const matkaBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), clayMat);
  matkaBody.position.set(-14.6, 1.08, 9.5);
  const matkaNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.1, 10), clayMat);
  matkaNeck.position.set(-14.6, 1.32, 9.5);
  const steelThali = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.03, 16), steelMat);
  steelThali.position.set(-13.8, 0.97, 9.4);
  const brassHandi = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), brassMat);
  brassHandi.position.set(-12.2, 1.08, 15.0);
  root.add(matkaBody, matkaNeck, steelThali, brassHandi);

  // Central North Trophy Gallery Furnishings (X: -6..+6, Z: -20..-8, Y = 0)
  const northCarpet = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 7.6), carpetMat);
  northCarpet.rotation.x = -Math.PI / 2;
  northCarpet.position.set(0, 0.025, -14.0);
  root.add(northCarpet);

  const northTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), darkTeakMat);
  northTable.position.set(2.5, 0.52, -16.5);
  root.add(northTable);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(2.5, 0.3, -16.5), new THREE.Vector3(2.4, 0.6, 1.2)));

  const northSofa = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 3.2), velvetRedMat);
  northSofa.position.set(17.5, 0.325, -14.5);
  root.add(northSofa);
  colliders.push(new THREE.Box3().setFromObject(northSofa));

  // 3rd Floor Attic Doll Workshop, Seance Parlor & Observatory Furnishings (Y = 8.8)
  const atticWorktable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 1.2), darkTeakMat);
  atticWorktable.position.set(-8.8, 9.225, -6.8);
  root.add(atticWorktable);
  colliders.push(new THREE.Box3().setFromObject(atticWorktable));

  const atticDisplayTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.82, 1.1), darkTeakMat);
  atticDisplayTable.position.set(-4.2, 9.21, -9.8);
  root.add(atticDisplayTable);
  colliders.push(new THREE.Box3().setFromObject(atticDisplayTable));

  // Seance Parlor Round Crimson Table & Haunted Mirror (X: -1..+12, Z: -12..-1.5)
  const seanceTable = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.85, 0.82, 14), velvetRedMat);
  seanceTable.position.set(4.5, 9.21, -6.5);
  const seanceCandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 8), ceramicMat);
  seanceCandle.position.set(4.5, 9.74, -6.5);
  root.add(seanceTable, seanceCandle);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(4.5, 9.25, -6.5), new THREE.Vector3(2.2, 0.9, 2.2)));

  const atticMirror = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.35), mirrorMat);
  atticMirror.position.set(11.77, 10.35, -5.0);
  atticMirror.rotation.y = -Math.PI / 2;
  root.add(atticMirror);
  interactives.push({
    id: 'haunted-mirror-attic',
    type: 'mirror_spook',
    name: 'Antique Seance Mirror',
    position: new THREE.Vector3(11.1, 10.2, -5.0),
    mesh: atticMirror,
    prompt: 'Peer into Seance Mirror [E]',
  });

  // Attic Observatory Loft Table & Brass Telescope Tripod (X: -4.2..+12, Z: -1.5..+8)
  const atticObsTable = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.82, 1.1), darkTeakMat);
  atticObsTable.position.set(5.0, 9.21, 4.2);
  root.add(atticObsTable);
  colliders.push(new THREE.Box3().setFromObject(atticObsTable));

  const telescopeGroup = new THREE.Group();
  telescopeGroup.position.set(8.8, 8.8, 6.2);
  telescopeGroup.rotation.y = -Math.PI / 4;
  const teleStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.35, 1.25, 6), darkTeakMat);
  teleStand.position.y = 0.625;
  const teleTube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.25, 12), brassMat);
  teleTube.position.y = 1.38;
  teleTube.rotation.x = Math.PI / 3;
  telescopeGroup.add(teleStand, teleTube);
  root.add(telescopeGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(8.8, 9.5, 6.2), new THREE.Vector3(0.85, 1.5, 0.85)));

  // Creepy Toppled/Broken Chair & Wooden Storage Trunks in Attic
  const brokenChair = new THREE.Group();
  brokenChair.position.set(-2.5, 9.05, 1.2);
  brokenChair.rotation.set(0.35, 0.4, 1.1);
  brokenChair.add(new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), darkTeakMat));
  const brokenBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.08), darkTeakMat);
  brokenBack.position.set(0, 0.4, -0.28);
  brokenChair.add(brokenBack);
  root.add(brokenChair);

  for (const [cx, cy, cz, sx, sy, sz] of [
    [-10.6, 8.8, 4.0, 1.2, 0.75, 0.85],
    [10.2, 8.8, 3.2, 1.3, 0.85, 0.9],
    [4.5, 8.8, -10.5, 1.4, 0.8, 0.9],
  ] as [number, number, number, number, number, number][]) {
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), darkTeakMat);
    trunk.position.set(cx, cy + sy / 2, cz);
    root.add(trunk);
    colliders.push(new THREE.Box3().setFromObject(trunk));
  }

  // Soft Grounded Contact Shadows beneath Major Furniture & 1954 Sedan
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  for (const [shX, shY, shZ, shW, shD] of [
    [18.0, 0.02, 24.0, 3.2, 5.4],
    [13.5, 0.03, -3.5, 4.8, 2.5],
    [13.0, 0.03, 8.6, 4.2, 2.0],
    [17.5, 0.03, 15.8, 2.6, 1.6],
    [12.0, 4.53, 4.0, 3.2, 4.0],
    [-12.0, 4.53, 3.5, 3.2, 4.0],
  ] as [number, number, number, number, number][]) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(shW, shD), contactShadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(shX, shY, shZ);
    root.add(sh);
  }

  // Translucent Corner Cobwebs across Haveli, Crypt & 3F Attic
  const cobwebMat = new THREE.MeshBasicMaterial({
    map: createCobwebTexture(),
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const [wx, wy, wz, ry] of [
    [-5.7, 3.6, 16.4, Math.PI * 0.25],
    [5.7, 3.6, 16.4, -Math.PI * 0.25],
    [-11.2, 11.4, -11.2, Math.PI * 0.25],
    [11.2, 11.4, -11.2, -Math.PI * 0.25],
    [-19.5, -0.9, -7.6, Math.PI * 0.25],
  ] as [number, number, number, number][]) {
    const web = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), cobwebMat);
    web.position.set(wx, wy, wz);
    web.rotation.y = ry;
    root.add(web);
  }

  // Clear Vintage Directional Plaques (Zero Confusion Navigation!)
  function addDirectionalPlaque(
    x: number,
    y: number,
    z: number,
    rotY: number,
    title: string,
    subtitle: string,
    accentHex = '#fbbf24'
  ) {
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.72),
      new THREE.MeshBasicMaterial({ map: createFloorSignTexture(title, subtitle, accentHex) })
    );
    plaque.position.set(x, y, z);
    plaque.rotation.y = rotY;
    root.add(plaque);
  }
  addDirectionalPlaque(0, 3.35, -7.76, 0, 'NORTH TROPHY HALL ▲', 'DINING LOOP • HIDE & SUPPLIES', '#fbbf24');
  addDirectionalPlaque(0, 3.65, 16.76, Math.PI, 'COURTYARD EXIT DOOR ▼', 'PLACE ANCESTOR PHOTO FRAME', '#34d399');
  addDirectionalPlaque(15.0, 3.35, 16.76, Math.PI, 'EAST GARAGE ▼', '1954 ESCAPE CAR • FUEL & BATTERY', '#34d399');
  addDirectionalPlaque(-3.55, 7.4, 6.6, Math.PI / 2, 'FLOOR 3: ATTIC LOFT ▲', 'DOLL WORKSHOP • STUN ASH & LORE', '#f87171');
  addDirectionalPlaque(0, 7.6, -7.76, 0, 'MYSTIC SANCTUM ▲', 'ANCESTOR PHOTO FRAME ALTAR', '#ef4444');

  // Haunted Rocking Chair
  const rockingChair = new THREE.Group();
  rockingChair.position.set(17.5, 0, 7.5);
  rockingChair.rotation.y = -Math.PI / 3;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), darkTeakMat);
  seat.position.y = 0.55;
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.08), darkTeakMat);
  backrest.position.set(0, 1.02, -0.38);
  rockingChair.add(seat, backrest);
  root.add(rockingChair);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(17.5, 0.6, 7.5), new THREE.Vector3(1.2, 1.2, 1.2)));

  // =========================================================================
  // 11. MULTI-LEVEL VILLAIN PATROL WAYPOINTS (4 Vertical Tiers: Crypt, 1F, 2F & 3F Attic!)
  // =========================================================================
  const ghostWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 4.5, -14),       // Mystic Sanctum Altar (2F)
    new THREE.Vector3(6.0, 4.5, -14.0),   // Archway into NE Astrology Study (2F)
    new THREE.Vector3(10.0, 4.5, -14.0),
    new THREE.Vector3(14.0, 4.5, -17.0),  // Zamindar Astrology Study
    new THREE.Vector3(12.0, 4.5, -10.5),
    new THREE.Vector3(12.0, 4.5, -5.5),   // Doll Nursery (2F)
    new THREE.Vector3(12.0, 4.5, 4.5),    // Master Bedroom (2F)
    new THREE.Vector3(3.8, 4.5, 0.0),
    new THREE.Vector3(0, 4.5, 2.0),
    new THREE.Vector3(-3.8, 4.5, 6.5),    // Climb Up to 3F Attic Workshop!
    new THREE.Vector3(-6.0, 4.5, 6.8),
    new THREE.Vector3(-6.0, 8.8, 0.5),
    new THREE.Vector3(-5.0, 8.8, -7.0),   // 3F Attic Doll Workshop
    new THREE.Vector3(1.5, 8.8, -7.0),    // Through Seance Parlor Door
    new THREE.Vector3(4.5, 8.8, -4.0),    // 3F Attic Seance Parlor
    new THREE.Vector3(4.5, 8.8, 1.5),     // Through Observatory Arch
    new THREE.Vector3(1.5, 8.8, 4.0),     // 3F Attic Observatory Loft
    new THREE.Vector3(-6.0, 8.8, 0.5),    // Descend back to 2F
    new THREE.Vector3(-6.0, 4.5, 6.8),
    new THREE.Vector3(-3.8, 4.5, 6.5),
    new THREE.Vector3(-12.0, 4.5, 3.5),   // Guest Bedroom (2F)
    new THREE.Vector3(-12.0, 4.5, -4.0),  // Old Library (2F)
    new THREE.Vector3(-3.8, 4.5, -1.5),
    new THREE.Vector3(0, 4.5, -2.0),      // Descend Central Stairs
    new THREE.Vector3(0, 2.25, 3.0),
    new THREE.Vector3(0, 0, 7.5),
    new THREE.Vector3(0, 0, -5.0),        // Walk through Open North Archway into Central Trophy Hall!
    new THREE.Vector3(0, 0, -14.0),
    new THREE.Vector3(-8.5, 0, -14.0),    // West Ground Armoury
    new THREE.Vector3(-13.0, 0, -14.0),
    new THREE.Vector3(-8.5, 0, -14.0),
    new THREE.Vector3(0, 0, -14.0),
    new THREE.Vector3(8.5, 0, -14.0),     // East Ground Servant Quarters
    new THREE.Vector3(13.0, 0, -14.0),
    new THREE.Vector3(7.8, 0, -11.5),     // Loop back through Dining North Archway!
    new THREE.Vector3(7.8, 0, -5.0),
    new THREE.Vector3(13.5, 0, -3.5),     // Dining Hall
    new THREE.Vector3(13.5, 0, 6.0),      // Living Baithak
    new THREE.Vector3(14.5, 0, 14.0),     // Puja Room
    new THREE.Vector3(15.0, 0, 19.5),     // East Garage
    new THREE.Vector3(15.0, 0, 25.0),
    new THREE.Vector3(15.0, 0, 19.5),
    new THREE.Vector3(14.5, 0, 14.0),
    new THREE.Vector3(5.5, 0, 12.0),      // Foyer & Breaker Box
    new THREE.Vector3(0, 0, 13.5),
    new THREE.Vector3(-5.5, 0, 8.0),
    new THREE.Vector3(-13.0, 0, 11.0),    // Kitchen -> Garden Door
    new THREE.Vector3(-13.0, 0, 5.0),
    new THREE.Vector3(-13.0, 0, -2.0),    // Storage Room
    new THREE.Vector3(-17.2, -0.3, -1.0), // Down Crypt Staircase
    new THREE.Vector3(-17.2, -3.0, -7.2),
    new THREE.Vector3(-12.0, -3.0, -12.0), // Underground River Boat Dock
    new THREE.Vector3(-6.5, -3.0, -11.2),  // Through Stone Arch into Underground Bone Vault
    new THREE.Vector3(0.5, -3.0, -11.2),
    new THREE.Vector3(-6.5, -3.0, -11.2),
    new THREE.Vector3(-17.2, -3.0, -7.2),
    new THREE.Vector3(-17.2, -0.3, -1.0), // Back up to Ground Floor
    new THREE.Vector3(-13.0, 0, -2.0),
    new THREE.Vector3(-5.5, 0, 7.5),
    new THREE.Vector3(0, 0, 7.5),         // Climb Central Stairs
    new THREE.Vector3(0, 2.25, 3.0),
    new THREE.Vector3(0, 4.5, -2.0),
    new THREE.Vector3(0, 4.5, -9.0),
  ];

  return {
    root,
    colliders,
    interactives,
    exitDoorMesh,
    frameMountMesh,
    placedFrameMesh,
    flickerLights,
    ghostWaypoints,
    rockingChair,
    gateChainMesh,
    gatePadlockMesh,
    pendulums,
    waterStreams,
    carHeadlights,
    carHeadlightBulbs,
    breakerLedMesh,
    secretBookcaseMesh: secretBookcaseGroup,
    mandalaMesh,
    glintRings,
  };
}
