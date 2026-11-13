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
} from './textures';

export type InteractiveType =
  | 'door'
  | 'key'
  | 'frame'
  | 'battery'
  | 'decoy_pickup'
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
 * Multi-Level Floor Height Calculator (Three Full Vertical Levels: -3.0 Crypt, 0.0 Ground, +4.5 Upper)
 */
export function getMansionFloorHeight(x: number, z: number, currentY: number): number {
  // 1. Central Grand Staircase: Z = 7.5 (Y=0) ascending North to Z = -1.5 (Y=4.5)
  if (Math.abs(x) <= 2.2 && z >= -1.8 && z <= 7.8 && currentY >= -0.8) {
    const progress = (7.5 - z) / 9.0;
    return Math.max(0, Math.min(4.5, progress * 4.5));
  }

  // 2. Crypt Staircase (Storage Wing West Alcove): Z = -0.5 (Y=0) descending North to Z = -7.0 (Y=-3.0)
  if (x >= -19.0 && x <= -15.4 && z >= -7.4 && z <= -0.2 && currentY < 2.2) {
    const progress = (-0.5 - z) / 6.5;
    return -Math.max(0, Math.min(1, progress)) * 3.0;
  }

  // 3. Subterranean Underground River Crypt Level (Y = -3.0)
  if (currentY <= -0.85 && x >= -21.5 && x <= -4.5 && z >= -21.5 && z <= -6.8) {
    return -3.0;
  }

  // 4. Upper Level Rooms (Y = 4.5)
  if (currentY >= 2.25) {
    if (Math.abs(x) <= 4.2 && z >= -8.5 && z <= 8.5) return 4.5;
    if (x >= 3.0 && x <= 20.5 && z >= -8.0 && z <= 8.0) return 4.5;
    if (x >= -20.5 && x <= -3.0 && z >= -8.0 && z <= 8.0) return 4.5;
    if (Math.abs(x) <= 8.5 && z >= -20.5 && z <= -7.5) return 4.5;
    // Secret Library-to-Sanctum Passage (NW Upper Alcove)
    if (x >= -16.5 && x <= -7.5 && z >= -16.5 && z <= -7.5) return 4.5;
  }

  // 5. Ground Level, East Garage & Courtyard
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
  // 2. GROUND FLOOR FOUNDATION (WITH CRYPT STAIR OPENING AT NW)
  // =========================================================================
  // East Half (X: 0..20, Z: -8..17)
  addFloor(10, 0, 4.5, 20, 25, woodFloorMat);
  // West-Inner Half (X: -15.5..0, Z: -8..17)
  addFloor(-7.75, 0, 4.5, 15.5, 25, stoneMat);
  // Far-West South of Crypt Stairs (X: -20..-15.5, Z: -0.5..17)
  addFloor(-17.75, 0, 8.25, 4.5, 17.5, stoneMat);
  // Thin strip West of Crypt Stairs (X: -20..-19, Z: -8..-0.5)
  addFloor(-19.5, 0, -4.25, 1.0, 7.5, stoneMat);
  // Thin strip North of Crypt Stairs (X: -19..-15.5, Z: -8..-7.0)
  addFloor(-17.25, 0, -7.5, 3.5, 1.0, stoneMat);

  // Grand Checkered Marble Overlay in Central Atrium Foyer (X: -6..6, Z: -2..17)
  addFloor(0, 0.015, 7.5, 12, 19, marbleFloorMat);

  // South Monsoon Courtyard Stone (X: -12..12, Z: 17..33)
  addFloor(0, 0, 25, 24, 16, stoneMat);
  // East Garage Oil-Stained Concrete Floor (X: 12..24, Z: 17..31)
  addFloor(18, 0.006, 24, 12, 14, garageWallMat);

  // Ground Floors under Upper North Wings (outside Crypt footprint)
  addFloor(2, 0, -14, 16, 12, stoneMat);

  // Ground Ceilings (Y = 4.3, Leaving Central Stairwell Open)
  addCeiling(13, 4.3, 4.5, 14, 25);
  addCeiling(-13, 4.3, 4.5, 14, 25);
  addCeiling(0, 4.3, 12.25, 12, 9.5);

  // =========================================================================
  // 3. UPPER FLOOR STRUCTURE (Y = 4.5 + SECRET ARCHIVE ALCOVE)
  // =========================================================================
  addFloor(0, 4.5, -4.75, 8, 6.5, woodFloorMat);
  addFloor(-2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  addFloor(2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  addFloor(0, 4.5, 8.0, 7.6, 1.5, woodFloorMat);

  addFloor(12, 4.5, 0, 16, 16, woodFloorMat);
  addFloor(-12, 4.5, 0, 16, 16, woodFloorMat);
  addFloor(0, 4.5, -14, 16, 12, marbleFloorMat); // Mystic Sanctum Marble
  // NEW Secret Library-to-Sanctum Archive Passage (X: -16..-8, Z: -16..-8, Y = 4.5)
  addFloor(-12, 4.5, -12, 8, 8, woodFloorMat);

  // Mystic Sanctum Glowing Crimson Tantric Mandala Floor Seal
  const mandalaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.MeshBasicMaterial({ map: mandalaTex, transparent: true, opacity: 0.92, depthWrite: false })
  );
  mandalaMesh.rotation.x = -Math.PI / 2;
  mandalaMesh.position.set(0, 4.525, -14);
  root.add(mandalaMesh);

  // Upper Ceilings (Y = 8.6) & Wada Pitched Roof
  addCeiling(0, 8.6, 0, 8, 17);
  addCeiling(12, 8.6, 0, 16, 16);
  addCeiling(-12, 8.6, 0, 16, 16);
  addCeiling(0, 8.6, -14, 16, 12);
  addCeiling(-12, 8.6, -12, 8, 8);

  const roofSlopeWest = new THREE.Mesh(new THREE.PlaneGeometry(23, 40), roofTilesMat);
  roofSlopeWest.rotation.set(0, 0, 0.28);
  roofSlopeWest.position.set(-10.5, 10.2, -1.5);
  root.add(roofSlopeWest);

  const roofSlopeEast = new THREE.Mesh(new THREE.PlaneGeometry(23, 40), roofTilesMat);
  roofSlopeEast.rotation.set(0, 0, -0.28);
  roofSlopeEast.position.set(10.5, 10.2, -1.5);
  root.add(roofSlopeEast);

  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 40), darkTeakMat);
  roofRidge.position.set(0, 12.0, -1.5);
  root.add(roofRidge);

  const atticSlab = new THREE.Mesh(new THREE.BoxGeometry(42, 0.3, 39), darkTeakMat);
  atticSlab.position.set(0, 8.75, -1.5);
  root.add(atticSlab);

  // =========================================================================
  // 4. GROUND FLOOR WALLS, HAVELI COLONNADES & BREAKER BOX
  // =========================================================================
  const WH = 4.2;
  const TH = 0.4;

  // South Foyer Entrance Wall (exit door center X=0, Z=17)
  addWall(-4.5, 0, 17, 7, WH, TH);
  addWall(4.5, 0, 17, 7, WH, TH);
  addWall(0, 3.2, 17, 2, 1.0, TH);

  // Open Haveli Colonnade Pillars
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

  // Main Ground Outer Walls
  addWall(20, 0, 4.5, TH, WH, 25);
  addWall(-20, 0, 4.5, TH, WH, 25);
  addWall(0, 0, -8, 40, WH, TH);

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
  // Plus a Side Service Doorway at X = 15, Z = 17 leading directly into the East Garage!
  addWall(9.5, 0, 10.5, 7.0, WH, TH);
  addWall(17.5, 0, 10.5, 5.0, WH, TH);
  addWall(13.5, 2.8, 10.5, 2.5, 1.4, TH);
  addWall(10.0, 0, 17, 8.0, WH, TH);   // X: 6..14
  addWall(18.0, 0, 17, 4.0, WH, TH);   // X: 16..20
  addWall(15.0, 2.8, 17, 2.0, 1.4, TH); // Garage service doorway lintel at X: 14..16

  const pujaAltar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.0), darkTeakMat);
  pujaAltar.position.set(11.5, 0.45, 16.0);
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

  // Haunted Kitchen & Storage Room (West Wing)
  addWall(-13, 0, 17, 14, WH, TH);
  addWall(-16.5, 0, 5.0, 7, WH, TH);
  addWall(-9.5, 0, 5.0, 5, WH, TH);
  addWall(-13, 2.8, 5.0, 2, 1.4, TH);

  // Tantric Blood Decals
  const tantricTex = createTantricWallWritingTexture();
  const tantricMat = new THREE.MeshBasicMaterial({ map: tantricTex, transparent: true, opacity: 0.9, depthWrite: false });
  const bloodDecal1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), tantricMat);
  bloodDecal1.position.set(4.38, 2.3, 16.78);
  bloodDecal1.rotation.y = Math.PI;
  root.add(bloodDecal1);

  const bloodDecal2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), tantricMat);
  bloodDecal2.position.set(-3.58, 6.4, -2.5);
  bloodDecal2.rotation.y = Math.PI / 2;
  root.add(bloodDecal2);

  // =========================================================================
  // 5. LEVEL -1: CRYPT STAIRCASE & FLOODED UNDERGROUND RIVER BOAT DOCK (Y = -3.0)
  // =========================================================================
  // Crypt Steps descending from Z = -0.5 (Y = 0.0) to Z = -7.0 (Y = -3.0) along X = -17.2
  const cryptSteps = 14;
  for (let s = 0; s < cryptSteps; s++) {
    const sy = -(s + 0.5) * (3.0 / cryptSteps);
    const sz = -0.5 - s * (6.5 / cryptSteps);
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.55), stoneMat);
    step.position.set(-17.2, sy, sz);
    step.receiveShadow = true;
    root.add(step);
  }

  // Safety Iron Railing along East edge of Crypt Stairwell on Ground Level (X = -15.5, Z: -7.5..-0.5)
  const cryptGuardRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 7.0), ironMat);
  cryptGuardRail.position.set(-15.5, 0.5, -4.0);
  root.add(cryptGuardRail);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-15.5, 0.5, -4.0), new THREE.Vector3(0.2, 1.2, 7.0)));

  // Crypt Underground Chamber (X: -21..-5, Z: -21..-7, Floor Y = -3.0, Ceiling Y = -0.25)
  addFloor(-13, -3.0, -10.8, 16, 7.6, stoneMat); // Solid Dock Stone Floor (Z: -14.6..-7.0)
  addCeiling(-13, -0.25, -14, 16, 14, catacombMat);

  // Catacomb Perimeter Walls (Y = -3.0 to -0.25)
  addWall(-21, -3.0, -14, TH, 2.8, 14, catacombMat); // West Crypt Wall
  addWall(-5, -3.0, -14, TH, 2.8, 14, catacombMat);  // East Crypt Wall
  addWall(-13, -3.0, -21, 16, 2.8, TH, catacombMat); // North Canal Far Wall
  addWall(-10, -3.0, -7.0, 10, 2.8, TH, catacombMat); // South Crypt Wall East of Stairs (X: -15..-5)
  addWall(-20, -3.0, -7.0, 2.0, 2.8, TH, catacombMat); // South Crypt Wall West of Stairs

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

  // Upper Floor Walls
  const UWH = 4.1;
  addWall(-3.8, 4.5, -4.5, TH, UWH, 5);
  addWall(-3.8, 4.5, 4.5, TH, UWH, 5);
  addWall(-3.8, 7.2, 0.0, TH, 1.3, 3);

  addWall(3.8, 4.5, -4.5, TH, UWH, 5);
  addWall(3.8, 4.5, 4.5, TH, UWH, 5);
  addWall(3.8, 7.2, 0.0, TH, 1.3, 3);

  addWall(-2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(0, 7.2, -8, 2, 1.3, TH);

  // Master Bedchamber & Nursery (East Upper)
  addWall(20, 4.5, 0, TH, UWH, 16);
  addWall(12, 4.5, 8, 16, UWH, TH);
  addWall(12, 4.5, -8, 16, UWH, TH);
  addWall(7.5, 4.5, 0, 7.0, UWH, TH);
  addWall(17.5, 4.5, 0, 5.0, UWH, TH);
  addWall(12.5, 7.2, 0, 3.0, 1.3, TH);

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

  // Mystic Sanctum Walls (West wall has Secret Archive opening Z: -13..-11)
  addWall(-8, 4.5, -9.5, TH, UWH, 3);
  addWall(-8, 4.5, -16.5, TH, UWH, 7);
  addWall(-8, 7.2, -12, TH, 1.3, 2.5);
  addWall(8, 4.5, -14, TH, UWH, 12);
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

  interactives.push({
    id: 'secret-library-bookcase',
    type: 'secret_bookcase',
    name: 'Revolving Antique Bookshelf',
    position: new THREE.Vector3(-12.0, 5.9, -7.8),
    mesh: secretBookcaseGroup,
    prompt: 'Pull Suspicious Book [E]',
    isOpen: false,
  });

  // =========================================================================
  // 7. COURTYARD, EAST GARAGE + 1954 ESCAPE CAR & FORTIFIED IRON GATE
  // =========================================================================
  // West Courtyard Wall & Open East Driveway Wall into Garage
  addWall(-12, 0, 25, TH, 3.5, 16, stoneMat);
  addWall(12, 0, 18.5, TH, 3.6, 3.0, stoneMat); // North pier of driveway
  addWall(12, 0, 29.5, TH, 3.6, 7.0, stoneMat); // South pier of driveway
  addWall(-6.5, 0, 33, 11, 3.5, TH, stoneMat);
  addWall(6.5, 0, 33, 11, 3.5, TH, stoneMat);

  // --- EAST COURTYARD GARAGE / CARRIAGE SHED (X: 12..24, Z: 17..31) ---
  addWall(24, 0, 24, TH, 3.8, 14, garageWallMat); // East wall
  addWall(20.5, 0, 17, 7, 3.8, TH, garageWallMat); // North wall East of Puja door
  // Garage South Roll-Up Exit Shutter (X: 18, Z: 31)
  const garageShutter = new THREE.Mesh(new THREE.BoxGeometry(11.6, 3.5, 0.25), garageWallMat);
  garageShutter.position.set(18, 1.75, 31);
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

  function createInteriorDoor(id: string, name: string, x: number, y: number, z: number, rotY = 0, reqKey?: string) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);
    doorGroup.rotation.y = rotY;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.12), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.8 }));
    leaf.position.set(0.8, 1.4, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25), brassMat);
    handle.position.set(1.4, 1.4, 0.1);
    doorGroup.add(leaf, handle);
    root.add(doorGroup);
    interactives.push({
      id,
      type: 'door',
      name,
      position: new THREE.Vector3(x + 0.8, y + 1.4, z),
      mesh: doorGroup,
      prompt: reqKey ? `Unlock ${name}` : `Open ${name}`,
      requiresKey: reqKey,
      doorId: id,
    });
    return doorGroup;
  }

  createInteriorDoor('door-master', 'Master Bedroom Door', 3, 4.5, 0.5, Math.PI / 2, 'hasBrassKey');
  createInteriorDoor('door-guest', 'Guest Bedroom Door', -3, 4.5, 0.5, -Math.PI / 2);
  createInteriorDoor('door-attic', 'Mystic Sanctum Gate', 0, 4.5, -8, 0, 'hasAtticKey');
  createInteriorDoor('door-kitchen', 'Kitchen Door', -6, 0, 10.5, Math.PI / 2);

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

  // Living Diwan Sofa
  const diwan = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0x6b141a, roughness: 0.85 }));
  diwan.position.set(13, 0.3, 10);
  root.add(diwan);
  colliders.push(new THREE.Box3().setFromObject(diwan));

  // Kitchen Counter & Gas Stove & Sink
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

  // Bathrooms & Haunted Cursed Mirrors
  addFloor(-16.5, 0.01, 0.5, 6.0, 6.0, bathroomTileMat);
  addWall(-19.8, 0, 0.5, 0.4, WH, 6.0, wallMat);
  addWall(-13.5, 0, 2.5, 0.4, WH, 2.0, wallMat);
  addWall(-13.5, 0, -1.5, 0.4, WH, 2.0, wallMat);
  addWall(-16.5, 0, 3.5, 6.0, WH, 0.4, wallMat);
  addWall(-16.5, 0, -2.5, 6.0, WH, 0.4, wallMat);
  const gfMirror = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.15), mirrorMat);
  gfMirror.position.set(-14.5, 1.85, 3.28);
  gfMirror.rotation.y = Math.PI;
  root.add(gfMirror);
  interactives.push({
    id: 'haunted-mirror-gf',
    type: 'mirror_spook',
    name: 'Cracked Silver Mirror',
    position: new THREE.Vector3(-14.5, 1.6, 2.9),
    mesh: gfMirror,
    prompt: 'Peer into Cracked Mirror [E]',
  });

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
  createGrandfatherClock(-3.2, 4.5, 2.5, Math.PI / 2);

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
    [13, 0.025, 10, 6.5, 7.5],
    [12, 4.525, 0, 5.5, 6.5],
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
    winMesh.position.set(19.83, 2.2, wz);
    winMesh.rotation.y = -Math.PI / 2;
    root.add(winMesh);
    addMoonbeam(17.5, 1.9, wz, -Math.PI / 2);
  }
  const northWin = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.4), windowMat);
  northWin.position.set(0, 6.4, -19.83);
  root.add(northWin);
  addMoonbeam(0, 5.8, -17.5, 0);

  // Wall Portraits
  const tatyaPhotoTex = createTatyaWallPhotoTexture();
  const tatyaEyesTex = createTatyaCloseupEyesTexture();
  const tatyaDaggerTex = createTatyaDaggerPortraitTexture();
  const tatyaArchiveTex = createTatyaVintageArchiveTexture();
  const tatyaShrineTex = createTatyaShrineTexture();
  const annabelleTex = createAnnabelleDollTexture();
  const dollFamTex = createCursedDollFamilyTexture(0);
  const famTex = createIndianFamilyPhotoTexture(0);
  const ancTex = createAncestorGalleryTexture(0);

  function addPastedWallPortrait(x: number, y: number, z: number, rotY: number, w: number, h: number, tex: THREE.Texture) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.035), darkTeakMat);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
    photo.position.z = 0.019;
    g.add(frame, photo);
    root.add(g);
  }

  addPastedWallPortrait(4.5, 2.3, 16.832, Math.PI, 1.1, 1.4, tatyaPhotoTex);
  addPastedWallPortrait(-4.5, 2.3, 16.832, Math.PI, 1.1, 1.4, tatyaEyesTex);
  addPastedWallPortrait(19.832, 2.3, 5.0, -Math.PI / 2, 1.2, 1.5, tatyaDaggerTex);
  addPastedWallPortrait(13.5, 2.3, 16.832, Math.PI, 1.3, 1.6, tatyaShrineTex);
  addPastedWallPortrait(-13.5, 2.2, -7.832, 0, 1.2, 1.5, tatyaArchiveTex);
  addPastedWallPortrait(0, 3.2, -7.832, 0, 1.4, 1.7, famTex);
  addPastedWallPortrait(3.632, 6.3, 0, -Math.PI / 2, 1.1, 1.4, dollFamTex);
  addPastedWallPortrait(-3.632, 6.3, 0, Math.PI / 2, 1.1, 1.4, annabelleTex);
  addPastedWallPortrait(0, 6.6, -19.832, 0, 1.6, 2.0, tatyaShrineTex);
  addPastedWallPortrait(-3.5, 6.4, -19.832, 0, 1.3, 1.6, ancTex);

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

    if (itemConfig) {
      itemConfig.mesh.position.set(0, -0.01, 0.1);
      attachItemGlint(itemConfig.mesh, 0xfbbf24, 0.14);
      drawerGroup.add(itemConfig.mesh);

      interactives.push({
        id: itemConfig.id,
        type: itemConfig.type,
        name: itemConfig.name,
        position: new THREE.Vector3(x, y + 0.8, z),
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
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y + 0.45, z), new THREE.Vector3(1.5, 0.9, 0.9)));

    interactives.push({
      id: `drawer-${id}`,
      type: 'drawer',
      name: `${tableName} Drawer`,
      position: new THREE.Vector3(x, y + 0.75, z + (rotY === 0 ? 0.45 : rotY === Math.PI ? -0.45 : 0)),
      mesh: drawerGroup,
      drawerMesh: drawerGroup,
      drawerId: id,
      prompt: `Open ${tableName} Drawer [E]`,
    });
  }

  // Build 9 Distinct Procedural 3D Tools for the 3 Escapes!
  const boltCuttersGroup = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 });
  for (const hx of [-0.07, 0.07]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.4, 8), redMat);
    h.rotation.set(Math.PI / 2, 0, hx < 0 ? -0.15 : 0.15);
    h.position.set(hx, 0, 0.1);
    boltCuttersGroup.add(h);
  }
  boltCuttersGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.15), ironMat));

  const brassKeyGroup = new THREE.Group();
  brassKeyGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16), brassMat));
  const bkStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24), brassMat);
  bkStem.rotation.x = Math.PI / 2;
  bkStem.position.z = 0.12;
  brassKeyGroup.add(bkStem);

  const sanctumKeyGroup = new THREE.Group();
  sanctumKeyGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 16), ironMat));
  const skStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26), ironMat);
  skStem.rotation.x = Math.PI / 2;
  skStem.position.z = 0.13;
  sanctumKeyGroup.add(skStem);

  const gateKeyGroup = new THREE.Group();
  gateKeyGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), brassMat));
  const gkStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28), brassMat);
  gkStem.rotation.x = Math.PI / 2;
  gkStem.position.z = 0.14;
  gateKeyGroup.add(gkStem);

  const crowbarGroup = new THREE.Group();
  const cbShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6), ironMat);
  cbShaft.rotation.x = Math.PI / 2;
  crowbarGroup.add(cbShaft);

  const tantricBellGroup = new THREE.Group();
  const tbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.085, 0.14, 14), brassMat);
  tbBody.position.y = 0.07;
  tantricBellGroup.add(tbBody);

  // Car Escape Tools: Fuel Jerrycan, Car Battery, Ignition Key
  const fuelCanGroup = new THREE.Group();
  const canBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.16), redMat);
  canBody.position.y = 0.15;
  fuelCanGroup.add(canBody);

  const carBatteryGroup = new THREE.Group();
  const cbBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.18), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }));
  cbBox.position.y = 0.1;
  const term1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), redMat);
  term1.position.set(-0.07, 0.21, 0);
  carBatteryGroup.add(cbBox, term1);

  const carKeyGroup = new THREE.Group();
  carKeyGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 14), steelMat));
  const ckStem = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.18), steelMat);
  ckStem.position.z = 0.1;
  carKeyGroup.add(ckStem);

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

  // Inside Master Bedroom (locked by Brass Key): Wooden Boat Oars + Spare Battery!
  const masterBattGroup = new THREE.Group();
  const masterBatt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14), brassMat);
  masterBattGroup.add(masterBatt);
  createTableWithDrawer('master', 'Master Vanity', 12, 4.5, 1.5, 0, {
    id: 'batt-master',
    type: 'battery',
    name: 'Flashlight Battery',
    mesh: masterBattGroup,
  });

  // Wooden Boat Oars in Secret Library Archive (X = -14.2, Y = 5.1, Z = -12.0) — always reachable & rewarding!
  const oarsGroup = new THREE.Group();
  oarsGroup.position.set(-14.2, 5.1, -12.0);
  for (const ox of [-0.15, 0.15]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 8), darkTeakMat);
    shaft.rotation.z = ox * 0.6;
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.03), brassMat);
    paddle.position.y = -0.68;
    shaft.add(paddle);
    oarsGroup.add(shaft);
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

  // Extra Battery & Brass Decoy Lota Pickups across wings
  const extraBatteries: [string, number, number, number][] = [
    ['batt-kitchen', -14.5, 1.1, 11],
    ['batt-garage', 22.0, 0.95, 25.0],
    ['batt-crypt', -18.5, -2.0, -12.5],
  ];
  for (const [bid, bx, by, bz] of extraBatteries) {
    const bg = new THREE.Group();
    bg.position.set(bx, by, bz);
    bg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16), brassMat));
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
  ];
  for (const [did, dx, dy, dz] of decoyPickups) {
    const dg = new THREE.Group();
    dg.position.set(dx, dy, dz);
    const lota = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), brassMat);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.06, 10), brassMat);
    rim.position.y = 0.11;
    dg.add(lota, rim);
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

  // =========================================================================
  // 10. ATMOSPHERIC NOCTURNAL LIGHTING & ROCKING CHAIR
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
  addLantern(0, 7.0, 0, 0xff7733, 1.3, 10);
  addLantern(11, 7.0, 0, 0xff6622, 1.1, 9);
  addLantern(-11, 7.0, 0, 0x60a5fa, 1.0, 9); // Cold moonlight library accent
  addLantern(-12, 6.8, -12, 0xf59e0b, 1.1, 8); // Secret Archive glow
  addLantern(0, 6.8, -14, 0xdc2626, 1.75, 12); // Ritual crimson sanctum

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
  // 11. MULTI-LEVEL VILLAIN PATROL WAYPOINTS (Covers Upper, Ground, Garage & Crypt!)
  // =========================================================================
  const ghostWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 4.5, -14),       // Mystic Sanctum Altar
    new THREE.Vector3(0, 4.5, -9.0),
    new THREE.Vector3(0, 4.5, -4.5),
    new THREE.Vector3(3.8, 4.5, 0.0),
    new THREE.Vector3(12.0, 4.5, -4.0),   // Doll Nursery
    new THREE.Vector3(12.0, 4.5, 4.5),    // Master Bedroom
    new THREE.Vector3(3.8, 4.5, 0.0),
    new THREE.Vector3(0, 4.5, 2.0),
    new THREE.Vector3(-3.8, 4.5, 0.0),
    new THREE.Vector3(-12.0, 4.5, 3.5),   // Guest Bedroom
    new THREE.Vector3(-12.0, 4.5, -4.0),  // Old Library
    new THREE.Vector3(-3.8, 4.5, -1.5),
    new THREE.Vector3(0, 4.5, -2.0),      // Descend Central Stairs
    new THREE.Vector3(0, 2.25, 3.0),
    new THREE.Vector3(0, 0, 7.5),
    new THREE.Vector3(0, 0, 13.5),        // Grand Foyer & Breaker Box
    new THREE.Vector3(5.5, 0, 12.0),
    new THREE.Vector3(14.5, 0, 14.0),     // Puja Room
    new THREE.Vector3(15.0, 0, 19.5),     // Into East Garage near Escape Car!
    new THREE.Vector3(15.0, 0, 25.0),
    new THREE.Vector3(15.0, 0, 19.5),
    new THREE.Vector3(14.5, 0, 14.0),
    new THREE.Vector3(13.5, 0, 6.0),      // Living Baithak
    new THREE.Vector3(13.5, 0, -3.5),     // Dining Hall
    new THREE.Vector3(5.5, 0, 5.5),
    new THREE.Vector3(0, 0, 8.0),
    new THREE.Vector3(-5.5, 0, 8.0),
    new THREE.Vector3(-13.0, 0, 11.0),    // Kitchen
    new THREE.Vector3(-13.0, 0, 5.0),
    new THREE.Vector3(-13.0, 0, -2.0),    // Storage Room
    new THREE.Vector3(-17.2, -0.3, -1.0), // Down Crypt Staircase!
    new THREE.Vector3(-17.2, -3.0, -7.2),
    new THREE.Vector3(-12.0, -3.0, -12.0), // Underground River Boat Dock!
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
