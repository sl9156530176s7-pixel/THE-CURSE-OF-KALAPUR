import * as THREE from 'three';
import { gameState } from './gameState';
import {
  createWoodFloorTexture,
  createHaveliWallTexture,
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

export interface InteractiveObject {
  id: string;
  type: 'door' | 'key' | 'frame' | 'battery' | 'diary' | 'hiding' | 'switch' | 'exit_gate' | 'drawer' | 'cutters' | 'gate_key' | 'tap' | 'crowbar' | 'bell' | 'cellar_hatch';
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
  hiddenItem?: InteractiveObject;
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
}

// Floor elevation calculator for player and villains (smooth stairs, solid ground and upper floors)
export function getMansionFloorHeight(x: number, z: number, currentY: number): number {
  // 1. Central Staircase zone:
  // Starts at Z = 7.5 (ground Y=0) and ascends smoothly to Z = -1.5 (upper floor Y=4.5)
  if (Math.abs(x) <= 2.2 && z >= -1.8 && z <= 7.8) {
    const progress = (7.5 - z) / 9.0;
    return Math.max(0, Math.min(4.5, progress * 4.5));
  }

  // 2. Upper floor rooms (only when entity is already elevated upstairs)
  if (currentY >= 2.25) {
    // Upper floor rooms:
    // Hallway & Mezzanine galleries
    if (Math.abs(x) <= 4.2 && z >= -8.5 && z <= 8.5) return 4.5;
    // Master Bedroom (East)
    if (x >= 3.0 && x <= 20.5 && z >= -8.0 && z <= 8.0) return 4.5;
    // Guest Bedroom (West)
    if (x >= -20.5 && x <= -3.0 && z >= -8.0 && z <= 8.0) return 4.5;
    // Mystic Sanctum (North Upper)
    if (Math.abs(x) <= 8.5 && z >= -20.5 && z <= -7.5) return 4.5;
  }

  // 3. Ground floor foundation & courtyard
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

  // Reusable materials
  const bathroomTileTex = createBathroomTilesTexture();
  const bathroomTileMat = new THREE.MeshStandardMaterial({
    map: bathroomTileTex,
    roughness: 0.35,
    metalness: 0.1,
  });

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xede9e3,
    roughness: 0.25,
    metalness: 0.05,
  });

  const mirrorTex = createMirrorReflectionTexture();
  const mirrorMat = new THREE.MeshStandardMaterial({
    map: mirrorTex,
    roughness: 0.1,
    metalness: 0.85,
  });

  const clockFaceTex = createClockFaceTexture();
  const clockFaceMat = new THREE.MeshStandardMaterial({
    map: clockFaceTex,
    roughness: 0.4,
    metalness: 0.1,
  });

  const curtainTex = createVelvetCurtainTexture();
  const curtainMat = new THREE.MeshStandardMaterial({
    map: curtainTex,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const gasStoveTex = createIndianGasStoveTexture();
  const gasStoveMat = new THREE.MeshStandardMaterial({
    map: gasStoveTex,
    roughness: 0.35,
    metalness: 0.7,
  });

  const lpgCylinderTex = createLpgCylinderTexture();
  const lpgCylinderMat = new THREE.MeshStandardMaterial({
    map: lpgCylinderTex,
    roughness: 0.5,
    metalness: 0.2,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.3,
    metalness: 0.85,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75,
  });

  const strangeLogoTex = createStrangeCreationLogoTexture();
  const strangeLogoMat = new THREE.MeshStandardMaterial({
    map: strangeLogoTex,
    roughness: 0.35,
    metalness: 0.8,
  });
  const woodFloorTex = createWoodFloorTexture();
  const haveliWallTex = createHaveliWallTexture();
  const stoneTileTex = createStoneTileTexture();
  const doorTex = createDoorTexture();
  const emptyMountTex = createEmptyFrameMountTexture();
  const portraitTex = createKalapurPortraitTexture();

  const woodFloorMat = new THREE.MeshStandardMaterial({
    map: woodFloorTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: haveliWallTex,
    roughness: 0.82,
    metalness: 0.05,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTileTex,
    roughness: 0.75,
    metalness: 0.2,
  });

  const ceilingTex = createCeilingPlanksTexture();
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTex,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const roofTilesTex = createRoofTilesTexture();
  const roofTilesMat = new THREE.MeshStandardMaterial({
    map: roofTilesTex,
    roughness: 0.85,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: 0x24140b,
    roughness: 0.65,
    metalness: 0.15,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb58e3b,
    roughness: 0.35,
    metalness: 0.85,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.6,
    metalness: 0.7,
  });

  // Helper to add solid walls with box collider & carved teak baseboard skirting
  function addWall(x: number, y: number, z: number, w: number, h: number, d: number, mat = wallMat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    // Carved Dark Teak Baseboard Skirting (gives crystal-clear wall definition!)
    if (h >= 3.0) {
      const skirtH = 0.24;
      const skirtGeo = new THREE.BoxGeometry(w > d ? w + 0.05 : w + 0.06, skirtH, d > w ? d + 0.05 : d + 0.06);
      const skirtMesh = new THREE.Mesh(skirtGeo, darkTeakMat);
      skirtMesh.position.set(x, y + skirtH / 2, z);
      skirtMesh.castShadow = true;
      root.add(skirtMesh);

      // Crown moulding at top of wall
      const crownH = 0.15;
      const crownGeo = new THREE.BoxGeometry(w > d ? w + 0.04 : w + 0.05, crownH, d > w ? d + 0.04 : d + 0.05);
      const crownMesh = new THREE.Mesh(crownGeo, darkTeakMat);
      crownMesh.position.set(x, y + h - crownH / 2, z);
      root.add(crownMesh);
    }

    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);
    return mesh;
  }

  // Helper to create floors
  function addFloor(x: number, y: number, z: number, w: number, d: number, mat = woodFloorMat) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  // Helper to create detailed beamed ceilings (Clear, visible architecture with 3D rafters!)
  function addCeiling(x: number, y: number, z: number, w: number, d: number) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, ceilingMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    root.add(mesh);

    // 3D Heavy Teak Wood Rafters running along the ceiling
    const rafterSpacing = 2.6;
    for (let rz = z - d / 2 + 1.2; rz <= z + d / 2 - 0.8; rz += rafterSpacing) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, 0.28), darkTeakMat);
      rafter.position.set(x, y - 0.16, rz);
      rafter.castShadow = true;
      rafter.receiveShadow = true;
      root.add(rafter);
    }

    return mesh;
  }

  // --- 1. GAPLESS GROUND FLOOR FOUNDATION (Zero Missing Floors!) ---
  // One continuous solid wooden foundation spanning the entire mansion interior (X: -20 to 20, Z: -8 to 17)
  const fullGroundFloor = addFloor(0, 0, 4.5, 40, 25, woodFloorMat);
  fullGroundFloor.name = 'FullGroundFoundation';

  // Ground Stone Floor in Kitchen & Storage (X: -20 to -6, Z: -8 to 17)
  const kitchenGroundStone = addFloor(-13, 0.005, 4.5, 14, 25, stoneMat);
  kitchenGroundStone.name = 'KitchenGroundStone';

  // Courtyard & Final Escape Ground (South Outdoor, X: -12 to 12, Z: 17 to 33)
  const courtyardStone = addFloor(0, 0, 25, 24, 16, stoneMat);
  courtyardStone.name = 'CourtyardStone';

  // Ground Dirt/Stone beneath North Upper Sanctum (X: -10 to 10, Z: -20 to -8)
  addFloor(0, 0, -14, 20, 14, stoneMat);

  // --- 2. GROUND FLOOR CEILINGS (Separated from Open Stairwell) ---
  // Ceiling over Living Room (East, Y = 4.3)
  addCeiling(13, 4.3, 4.5, 14, 25);
  // Ceiling over Kitchen & Storage (West, Y = 4.3)
  addCeiling(-13, 4.3, 4.5, 14, 25);
  // Ceiling over South Foyer Entrance (Z: 7.5 to 17, Y = 4.3)
  addCeiling(0, 4.3, 12.25, 12, 9.5);

  // --- 3. FIRST FLOOR STRUCTURE (Y = 4.5 with OPEN STAIRWELL) ---
  // Stairwell Opening: X: -2.0 to 2.0, Z: -1.5 to 7.5 is OPEN so player can climb through!
  // North Hallway Landing (at top of stairs, Z: -8 to -1.5)
  addFloor(0, 4.5, -4.75, 8, 6.5, woodFloorMat);
  // Left Mezzanine Walkway (X: -3.8 to -2.0, Z: -1.5 to 7.5)
  addFloor(-2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  // Right Mezzanine Walkway (X: 2.0 to 3.8, Z: -1.5 to 7.5)
  addFloor(2.9, 4.5, 3.0, 1.8, 9.0, woodFloorMat);
  // South Mezzanine Balcony (Z: 7.5 to 8.5)
  addFloor(0, 4.5, 8.0, 7.6, 1.5, woodFloorMat);

  // Master Bedroom Floor (East, X: 4 to 20, Z: -8 to 8)
  addFloor(12, 4.5, 0, 16, 16, woodFloorMat);
  // Guest Bedroom Floor (West, X: -20 to -4, Z: -8 to 8)
  addFloor(-12, 4.5, 0, 16, 16, woodFloorMat);
  // Mystic Sanctum Floor (North Upper, X: -8 to 8, Z: -20 to -8)
  addFloor(0, 4.5, -14, 16, 12, woodFloorMat);

  // --- 4. FIRST FLOOR CEILINGS & PITCHED MANSION ROOF ---
  // Ceilings over upstairs rooms at Y = 8.6 with heavy wood rafters
  addCeiling(0, 8.6, 0, 8, 17); // Hallway ceiling
  addCeiling(12, 8.6, 0, 16, 16); // Master Bedroom ceiling
  addCeiling(-12, 8.6, 0, 16, 16); // Guest Bedroom ceiling
  addCeiling(0, 8.6, -14, 16, 12); // Mystic Sanctum ceiling

  // Grand Pitched Terracotta Roof (Authentic Maharashtrian Wada Khaprail Tiles)
  // West Roof Slope
  const roofSlopeWest = new THREE.Mesh(
    new THREE.PlaneGeometry(23, 40),
    roofTilesMat
  );
  roofSlopeWest.rotation.set(0, 0, 0.28);
  roofSlopeWest.position.set(-10.5, 10.2, -1.5);
  roofSlopeWest.castShadow = true;
  roofSlopeWest.receiveShadow = true;
  root.add(roofSlopeWest);

  // East Roof Slope
  const roofSlopeEast = new THREE.Mesh(
    new THREE.PlaneGeometry(23, 40),
    roofTilesMat
  );
  roofSlopeEast.rotation.set(0, 0, -0.28);
  roofSlopeEast.position.set(10.5, 10.2, -1.5);
  roofSlopeEast.castShadow = true;
  roofSlopeEast.receiveShadow = true;
  root.add(roofSlopeEast);

  // Ridge Beam along the Roof Peak (Y = 12.0, Z: -21 to 18)
  const roofRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 40),
    darkTeakMat
  );
  roofRidge.position.set(0, 12.0, -1.5);
  root.add(roofRidge);

  // South Gable Pediment (facing courtyard entrance)
  const gableSouth = new THREE.Mesh(
    new THREE.BufferGeometry(),
    wallMat
  );
  // Triangle vertices: Left (-21, 8.6, 17.2), Right (21, 8.6, 17.2), Peak (0, 12.0, 17.2)
  const gableVertices = new Float32Array([
    -21, 8.6, 17.2,
    21, 8.6, 17.2,
    0, 12.0, 17.2,
    // back face
    21, 8.6, 17.2,
    -21, 8.6, 17.2,
    0, 12.0, 17.2,
  ]);
  gableSouth.geometry.setAttribute('position', new THREE.BufferAttribute(gableVertices, 3));
  gableSouth.geometry.computeVertexNormals();
  root.add(gableSouth);

  // North Gable Pediment
  const gableNorth = new THREE.Mesh(
    new THREE.BufferGeometry(),
    wallMat
  );
  const gableNorthVerts = new Float32Array([
    21, 8.6, -20.2,
    -21, 8.6, -20.2,
    0, 12.0, -20.2,
    // back face
    -21, 8.6, -20.2,
    21, 8.6, -20.2,
    0, 12.0, -20.2,
  ]);
  gableNorth.geometry.setAttribute('position', new THREE.BufferAttribute(gableNorthVerts, 3));
  gableNorth.geometry.computeVertexNormals();
  root.add(gableNorth);

  // Solid Attic Floor Slab to completely seal any gaps
  const atticSlab = new THREE.Mesh(
    new THREE.BoxGeometry(42, 0.3, 39),
    darkTeakMat
  );
  atticSlab.position.set(0, 8.75, -1.5);
  root.add(atticSlab);

  // --- 5. GROUND FLOOR WALLS & ROOM PERIMETERS ---
  const WH = 4.2; // Wall Height
  const TH = 0.4; // Wall Thickness

  // South Wall (Main entrance side with exit door in center)
  // South Wall (Main entrance side with exit door in center)
  addWall(-4.5, 0, 17, 7, WH, TH);
  addWall(4.5, 0, 17, 7, WH, TH);
  addWall(0, 3.2, 17, 2, 1.0, TH); // doorway lintel

  // --- WADA CARVED PILLAR COLONNADES (Replaced the 2 big barrier walls with grand open haveli colonnades!) ---
  // Beautiful carved teak pillars with ornamental capitals and arch brackets that open up the entire house!
  function createColonnadePillar(px: number, pz: number) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(px, 0, pz);

    // Stone Plinth Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), stoneMat);
    base.position.y = 0.2;
    base.castShadow = true;
    pillarGroup.add(base);

    // Carved Teak Wooden Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), darkTeakMat);
    shaft.position.y = 2.1;
    shaft.castShadow = true;
    pillarGroup.add(shaft);

    // Fluted Ornamental Capital & Bracket
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.65), darkTeakMat);
    capital.position.y = 3.95;
    capital.castShadow = true;
    pillarGroup.add(capital);

    // Arch brackets extending to ceiling beams
    const bracketE = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.8), darkTeakMat);
    bracketE.position.set(0, 4.05, 0);
    pillarGroup.add(bracketE);

    root.add(pillarGroup);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(px, 2.0, pz),
      new THREE.Vector3(0.55, 4.0, 0.55)
    ));
    return pillarGroup;
  }

  // Left & Right Wada Colonnades (Spacious, open, authentic Indian architecture!)
  for (const pz of [2.0, 6.0, 10.0, 14.5]) {
    createColonnadePillar(-6.0, pz); // West Colonnade
    createColonnadePillar(6.0, pz);  // East Colonnade
  }

  // Outer East Wall (complete continuous mansion enclosure)
  addWall(20, 0, 4.5, TH, WH, 25);
  // Outer West Wall (complete continuous mansion enclosure)
  addWall(-20, 0, 4.5, TH, WH, 25);
  // North Ground Wall
  addWall(0, 0, -8, 40, WH, TH);

  // --- NEW ROOM 1: PUJA / PRAYER SHRINE ROOM (East Wing South, Z: 10.5 to 17, X: 6 to 20) ---
  // Partition wall dividing Puja Room from Living Baithak with carved wooden entrance archway
  addWall(9.5, 0, 10.5, 7.0, WH, TH);
  addWall(17.5, 0, 10.5, 5.0, WH, TH);
  addWall(13.5, 2.8, 10.5, 2.5, 1.4, TH); // arched doorway lintel
  // Puja Room South Wall
  addWall(13, 0, 17, 14, WH, TH);

  // Sacred Deity Altar & Brass Diya Lamps inside Puja Room
  const pujaAltar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.0), darkTeakMat);
  pujaAltar.position.set(13.5, 0.45, 16.2);
  pujaAltar.castShadow = true;
  root.add(pujaAltar);
  colliders.push(new THREE.Box3().setFromObject(pujaAltar));

  // Sacred Silk Carpet in Puja Room
  const pujaCarpet = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.5), new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.9,
  }));
  pujaCarpet.rotation.x = -Math.PI / 2;
  pujaCarpet.position.set(13.5, 0.01, 13.5);
  root.add(pujaCarpet);

  // Hanging Temple Bell in Puja Room
  const bellGroup = new THREE.Group();
  bellGroup.position.set(13.5, 3.2, 13.5);
  const bellChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9), brassMat);
  bellChain.position.y = 0.45;
  const bellBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 12), brassMat);
  bellGroup.add(bellChain, bellBody);
  root.add(bellGroup);

  // --- NEW ROOM 2: GRAND DINING ROOM / BHOJNALAYA (East Wing North, Z: -8 to 1.5, X: 6 to 20) ---
  // Partition wall dividing Dining Hall from Living Baithak with arched doorway
  addWall(9.5, 0, 1.5, 7.0, WH, TH);
  addWall(17.5, 0, 1.5, 5.0, WH, TH);
  addWall(13.5, 2.8, 1.5, 2.5, 1.4, TH); // arched doorway lintel

  // Large Antique Banquet Dining Table in Dining Hall
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 1.6), darkTeakMat);
  diningTable.position.set(13.5, 0.85, -3.5);
  diningTable.castShadow = true;
  root.add(diningTable);
  for (const dx of [-1.7, 1.7]) {
    for (const dz of [-0.65, 0.65]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.82, 8), darkTeakMat);
      leg.position.set(13.5 + dx, 0.41, -3.5 + dz);
      root.add(leg);
    }
  }
  colliders.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(13.5, 0.45, -3.5),
    new THREE.Vector3(4.0, 0.9, 1.6)
  ));

  // Brass Candelabra on dining table
  const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.5, 8), brassMat);
  candelabra.position.set(13.5, 1.15, -3.5);
  root.add(candelabra);
  const candleGlow = new THREE.PointLight(0xff9933, 1.1, 7.0, 1.8);
  candleGlow.position.set(13.5, 1.5, -3.5);
  candleGlow.castShadow = true;
  root.add(candleGlow);
  flickerLights.push(candleGlow);

  // --- ROOM 3: LIVING BAITHAK (East Wing Center, Z: 1.5 to 10.5, X: 6 to 20) ---
  // Wide open to central Diwankhana via the open colonnade!

  // --- ROOM 4: HAUNTED KITCHEN & HEARTH (West Wing South, Z: 5.0 to 17, X: -20 to -6) ---
  addWall(-13, 0, 17, 14, WH, TH); // Kitchen South Wall

  // --- ROOM 5: STORAGE ROOM & TOOL SHED (West Wing North, Z: -8 to 5.0, X: -20 to -6) ---
  // Partition wall dividing Kitchen from Storage Room
  addWall(-16.5, 0, 5.0, 7, WH, TH);
  addWall(-9.5, 0, 5.0, 5, WH, TH);
  addWall(-13, 2.8, 5.0, 2, 1.4, TH); // doorway lintel

  // Bloody Tantric Decals on Walls (Chilling horror markings!)
  const tantricTex = createTantricWallWritingTexture();
  const tantricMat = new THREE.MeshBasicMaterial({
    map: tantricTex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  // Foyer entrance warning ("ॐ फट् स्वाहा" and bloody handprint flat on wall)
  const bloodDecal1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), tantricMat);
  bloodDecal1.position.set(4.38, 2.3, 16.78);
  bloodDecal1.rotation.y = Math.PI;
  root.add(bloodDecal1);

  // Upper Corridor warning
  const bloodDecal2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), tantricMat);
  bloodDecal2.position.set(-3.58, 6.4, -2.5);
  bloodDecal2.rotation.y = Math.PI / 2;
  root.add(bloodDecal2);

  // --- 6. CENTRAL STAIRCASE (Smooth Climbing - NO Step Colliders!) ---
  // Steps rising from Z = 7.5 to Z = -1.5, Y from 0 to 4.5
  const stepCount = 20;
  const stairWidth = 3.4;
  const startZ = 7.5;
  const endZ = -1.5;
  const dz = (endZ - startZ) / stepCount;
  const dy = 4.5 / stepCount;

  for (let s = 0; s < stepCount; s++) {
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, dy, Math.abs(dz) + 0.05),
      darkTeakMat
    );
    stepMesh.position.set(0, s * dy + dy / 2, startZ + s * dz);
    stepMesh.receiveShadow = true;
    root.add(stepMesh);
    // NOTICE: Do NOT push stepMesh into colliders! This completely fixes stair climbing!
  }

  // Left & Right Stair Guardrails (prevent falling off sides, but allow walking straight up!)
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

  // Mezzanine Open Well Railings (Upper floor around the stairwell)
  const mezRailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 9.2), brassMat);
  mezRailL.position.set(-2.0, 5.05, 3.0);
  root.add(mezRailL);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-2.0, 5.05, 3.0), new THREE.Vector3(0.2, 1.2, 9.2)));

  const mezRailR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 9.2), brassMat);
  mezRailR.position.set(2.0, 5.05, 3.0);
  root.add(mezRailR);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(2.0, 5.05, 3.0), new THREE.Vector3(0.2, 1.2, 9.2)));

  // South balcony railing overlooking entrance
  const mezRailS = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 0.1), brassMat);
  mezRailS.position.set(0, 5.05, 8.2);
  root.add(mezRailS);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 5.05, 8.2), new THREE.Vector3(4.0, 1.2, 0.2)));

  // --- 7. UPPER FLOOR WALLS & ROOM PERIMETERS ---
  const UWH = 4.1;
  // Hallway West Wall (door to Guest Room)
  addWall(-3.8, 4.5, -4.5, TH, UWH, 5);
  addWall(-3.8, 4.5, 4.5, TH, UWH, 5);
  addWall(-3.8, 7.2, 0.0, TH, 1.3, 3); // doorway

  // Hallway East Wall (door to Master Bedroom)
  addWall(3.8, 4.5, -4.5, TH, UWH, 5);
  addWall(3.8, 4.5, 4.5, TH, UWH, 5);
  addWall(3.8, 7.2, 0.0, TH, 1.3, 3); // doorway

  // Hallway North Wall (door to Mystic Sanctum)
  addWall(-2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(2.2, 4.5, -8, 2.5, UWH, TH);
  addWall(0, 7.2, -8, 2, 1.3, TH); // doorway

  // Master Bedroom & Cursed Doll Nursery Outer Walls (East Wing)
  addWall(20, 4.5, 0, TH, UWH, 16);
  addWall(12, 4.5, 8, 16, UWH, TH);
  addWall(12, 4.5, -8, 16, UWH, TH);

  // Partition Wall dividing Master Bedchamber from Cursed Doll Nursery (Z = 0)
  addWall(7.5, 4.5, 0, 7.0, UWH, TH);
  addWall(17.5, 4.5, 0, 5.0, UWH, TH);
  addWall(12.5, 7.2, 0, 3.0, 1.3, TH); // arched doorway lintel

  // Guest Bedroom & Old Library Outer Walls (West Wing)
  addWall(-20, 4.5, 0, TH, UWH, 16);
  addWall(-12, 4.5, 8, 16, UWH, TH);
  addWall(-12, 4.5, -8, 16, UWH, TH);

  // Partition Wall dividing Guest Bedroom from Old Library & Study (Z = 0)
  addWall(-7.5, 4.5, 0, 7.0, UWH, TH);
  addWall(-17.5, 4.5, 0, 5.0, UWH, TH);
  addWall(-12.5, 7.2, 0, 3.0, 1.3, TH); // arched doorway lintel

  // Mystic Sanctum Walls
  addWall(-8, 4.5, -14, TH, UWH, 12);
  addWall(8, 4.5, -14, TH, UWH, 12);
  addWall(0, 4.5, -20, 16, UWH, TH);

  // --- 8. COURTYARD & ESCAPE GATE ---
  addWall(-12, 0, 25, TH, 3.5, 16, stoneMat);
  addWall(12, 0, 25, TH, 3.5, 16, stoneMat);
  addWall(-6.5, 0, 33, 11, 3.5, TH, stoneMat);
  addWall(6.5, 0, 33, 11, 3.5, TH, stoneMat);

  // Tulsi Vrindavan in Courtyard center (Indian sacred shrine)
  const tulsiGroup = new THREE.Group();
  tulsiGroup.position.set(0, 0, 24);
  const tulsiBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), stoneMat);
  tulsiBase.position.y = 0.7;
  tulsiBase.castShadow = true;
  tulsiGroup.add(tulsiBase);

  // Brass diya lamp on tulsi altar
  const tulsiDiya = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.15, 8), brassMat);
  tulsiDiya.position.y = 1.48;
  tulsiGroup.add(tulsiDiya);

  // Sacred tulsi plant foliage
  const plantGeo = new THREE.DodecahedronGeometry(0.5, 1);
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x1f3b18, roughness: 0.9 });
  const plantMesh = new THREE.Mesh(plantGeo, plantMat);
  plantMesh.position.y = 1.9;
  tulsiGroup.add(plantMesh);

  root.add(tulsiGroup);
  colliders.push(new THREE.Box3().setFromObject(tulsiBase));

  // --- ANCIENT HAUNTED STONE WELL (The Kalapur Kuan) ---
  const wellGroup = new THREE.Group();
  wellGroup.position.set(-6.5, 0, 23);

  // Stone well rim cylinder
  const wellRimOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.7, 1.2, 16, 1, true),
    stoneMat
  );
  wellRimOuter.position.y = 0.6;
  wellRimOuter.castShadow = true;
  wellRimOuter.receiveShadow = true;
  wellGroup.add(wellRimOuter);

  const wellRimInner = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 1.2, 16, 1, true),
    stoneMat
  );
  wellRimInner.position.y = 0.6;
  wellGroup.add(wellRimInner);

  // Stone coping ring on top of rim
  const wellCap = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.65, 16),
    stoneMat
  );
  wellCap.rotation.x = -Math.PI / 2;
  wellCap.position.y = 1.2;
  wellGroup.add(wellCap);

  // Ominous deep stagnant water inside well
  const wellWater = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 16),
    new THREE.MeshStandardMaterial({
      color: 0x071317,
      roughness: 0.1,
      metalness: 0.9,
    })
  );
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.y = 0.25;
  wellGroup.add(wellWater);

  // Wooden Winch Posts
  const postLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), darkTeakMat);
  postLeft.position.set(-1.4, 1.3, 0);
  postLeft.castShadow = true;
  wellGroup.add(postLeft);

  const postRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), darkTeakMat);
  postRight.position.set(1.4, 1.3, 0);
  postRight.castShadow = true;
  wellGroup.add(postRight);

  // Wooden Crossbeam & Winch Spool
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.18), darkTeakMat);
  crossBeam.position.set(0, 2.5, 0);
  crossBeam.castShadow = true;
  wellGroup.add(crossBeam);

  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), darkTeakMat);
  spool.rotation.z = Math.PI / 2;
  spool.position.set(0, 2.3, 0);
  wellGroup.add(spool);

  // Iron chain & ancient brass bucket
  const wellChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3), ironMat);
  wellChain.position.set(0, 1.6, 0);
  wellGroup.add(wellChain);

  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.45, 12), brassMat);
  bucket.position.set(0, 0.8, 0);
  bucket.castShadow = true;
  wellGroup.add(bucket);

  // Eerie green/amber light glow deep inside the well
  const wellGlow = new THREE.PointLight(0x22c55e, 0.8, 4.0, 2.0);
  wellGlow.position.set(0, 0.6, 0);
  wellGroup.add(wellGlow);

  root.add(wellGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-6.5, 0.6, 23), new THREE.Vector3(3.2, 1.2, 3.2)));

  // Well interaction for eerie lore hint
  interactives.push({
    id: 'haunted-well',
    type: 'diary',
    name: 'Ancient Kalapur Well',
    position: new THREE.Vector3(-6.5, 1.0, 21.5),
    mesh: wellGroup,
    prompt: 'Examine Ancient Well',
  });

  // Final Fortified Iron Escape Gate (at Z = 31, X = 0)
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 31);

  // Twin Heavy Stone Gate Pillars with carved caps
  for (const px of [-1.9, 1.9]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.0, 0.7), stoneMat);
    pillar.position.set(px, 2.0, 0);
    pillar.castShadow = true;
    gateGroup.add(pillar);

    // Pillar Cap Stone
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), stoneMat);
    cap.position.set(px, 4.1, 0);
    gateGroup.add(cap);

    // Stone Guardian Finial / Urn
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), stoneMat);
    finial.position.set(px, 4.35, 0);
    gateGroup.add(finial);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(px, 2.0, 31),
      new THREE.Vector3(0.7, 4.0, 0.7)
    ));
  }

  // Wrought Iron Spiked Gate Leaves
  for (let b = -1.45; b <= 1.45; b += 0.22) {
    if (Math.abs(b) < 0.08) continue; // Center split between gate leaves
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 3.4, 8), ironMat);
    bar.position.set(b, 1.7, 0);
    bar.castShadow = true;
    gateGroup.add(bar);

    // Intimidating Gothic Spear / Spikes on top of each bar
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 6), ironMat);
    spike.position.set(b, 3.55, 0);
    gateGroup.add(spike);
  }

  // Horizontal Crossbars & Decorative scrolls
  for (const yBar of [0.6, 1.8, 3.3]) {
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.08), ironMat);
    crossBar.position.set(0, yBar, 0);
    gateGroup.add(crossBar);
  }

  // Heavy Wrapped Iron Chains Mesh (removed when Bolt Cutters cut them!)
  const gateChainMesh = new THREE.Group();
  gateChainMesh.position.set(0, 1.7, 0);
  for (let c = 0; c < 12; c++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 12), ironMat);
    link.position.set((Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.3, (c % 2 === 0 ? 0.08 : -0.08));
    link.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, c * 0.5);
    link.castShadow = true;
    gateChainMesh.add(link);
  }
  gateGroup.add(gateChainMesh);

  // Heavy Brass Security Padlock (removed when Gate Key unlocks it!)
  const padlockGroup = new THREE.Group();
  padlockGroup.position.set(0, 1.65, 0.12);
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.1), brassMat);
  lockBody.castShadow = true;
  padlockGroup.add(lockBody);

  const lockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 16, Math.PI), ironMat);
  lockShackle.position.set(0, 0.16, 0);
  padlockGroup.add(lockShackle);

  // Keyhole detail
  const keyhole = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.08, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
  );
  keyhole.position.set(0, -0.04, 0.052);
  padlockGroup.add(keyhole);

  gateGroup.add(padlockGroup);
  const gatePadlockMesh = lockBody; // for visibility toggling

  root.add(gateGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 1.8, 31), new THREE.Vector3(3.2, 3.6, 0.5)));

  // --- 7. MAIN EXIT DOOR (PUZZLE HUB) ---
  // Located at X = 0, Z = 17 (Ground floor Foyer exit)
  const exitDoorMesh = new THREE.Group();
  exitDoorMesh.position.set(-1.0, 0, 17); // Hinge anchor at left

  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.15), new THREE.MeshStandardMaterial({
    map: doorTex,
    roughness: 0.8,
    metalness: 0.15,
  }));
  doorLeaf.position.set(1.0, 1.6, 0);
  doorLeaf.castShadow = true;
  exitDoorMesh.add(doorLeaf);

  // Empty Photo Frame Mount on the door
  const frameMountGeo = new THREE.PlaneGeometry(0.9, 1.15);
  const frameMountMat = new THREE.MeshStandardMaterial({
    map: emptyMountTex,
    roughness: 0.5,
    metalness: 0.4,
  });
  const frameMountMesh = new THREE.Mesh(frameMountGeo, frameMountMat);
  frameMountMesh.position.set(1.0, 1.7, -0.09); // Facing into foyer
  frameMountMesh.rotation.y = Math.PI;
  exitDoorMesh.add(frameMountMesh);

  // Placed Frame (starts invisible, shown when attached!)
  const placedFrameGeo = new THREE.BoxGeometry(0.95, 1.2, 0.06);
  const placedFrameMat = new THREE.MeshStandardMaterial({
    map: portraitTex,
    roughness: 0.4,
    metalness: 0.5,
  });
  const placedFrameMesh = new THREE.Mesh(placedFrameGeo, placedFrameMat);
  placedFrameMesh.position.set(1.0, 1.7, -0.09);
  placedFrameMesh.rotation.y = Math.PI;
  placedFrameMesh.visible = false;
  exitDoorMesh.add(placedFrameMesh);

  root.add(exitDoorMesh);

  // Interactive exit door definition
  interactives.push({
    id: 'exit-door',
    type: 'door',
    name: 'Grand Exit Door',
    position: new THREE.Vector3(0, 1.6, 16.5),
    mesh: exitDoorMesh,
    prompt: 'Examine Grand Exit Door',
    doorId: 'exitDoor',
  });

  // Final escape trigger zone
  const escapeTriggerMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshBasicMaterial({ visible: false }));
  escapeTriggerMesh.position.set(0, 1.5, 30);
  root.add(escapeTriggerMesh);
  interactives.push({
    id: 'escape-gate',
    type: 'exit_gate',
    name: 'Mansion Gate',
    position: new THREE.Vector3(0, 1.5, 30),
    mesh: escapeTriggerMesh,
    prompt: 'Escape into the Storm!',
  });

  // Helper to add interactive interior doors
  function createInteriorDoor(id: string, name: string, x: number, y: number, z: number, rotY = 0, reqKey?: string) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);
    doorGroup.rotation.y = rotY;

    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.12), new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.8,
    }));
    leaf.position.set(0.8, 1.4, 0); // hinge offset
    leaf.castShadow = true;
    doorGroup.add(leaf);

    // Brass door handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25), brassMat);
    handle.position.set(1.4, 1.4, 0.1);
    doorGroup.add(handle);

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

  // Interior doors
  createInteriorDoor('door-master', 'Master Bedroom Door', 3, 4.5, 0.5, Math.PI / 2, 'hasBrassKey');
  createInteriorDoor('door-guest', 'Guest Bedroom Door', -3, 4.5, 0.5, -Math.PI / 2);
  createInteriorDoor('door-attic', 'Mystic Sanctum Gate', 0, 4.5, -8, 0, 'hasAtticKey');
  createInteriorDoor('door-kitchen', 'Kitchen Door', -6, 0, 10.5, Math.PI / 2);

  // --- 8. FURNITURE & HIDING PLACES (Wardrobes & Charpai Beds) ---
  // Helper to build an Antique Indian Teak Wardrobe (Hiding place!)
  function createWardrobe(id: string, name: string, x: number, y: number, z: number, rotY = 0) {
    const wardrobeGroup = new THREE.Group();
    wardrobeGroup.position.set(x, y, z);
    wardrobeGroup.rotation.y = rotY;

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.0, 1.0), darkTeakMat);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    wardrobeGroup.add(body);

    // Brass handles
    const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), brassMat);
    handleL.position.set(-0.15, 1.5, 0.52);
    wardrobeGroup.add(handleL);

    const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), brassMat);
    handleR.position.set(0.15, 1.5, 0.52);
    wardrobeGroup.add(handleR);

    root.add(wardrobeGroup);
    colliders.push(new THREE.Box3().setFromObject(body));

    interactives.push({
      id,
      type: 'hiding',
      name,
      position: new THREE.Vector3(x, y + 1.5, z),
      mesh: wardrobeGroup,
      prompt: `Hide inside ${name}`,
      hidingType: 'wardrobe',
      hidingCameraOffset: new THREE.Vector3(x, y + 1.6, z),
    });

    return wardrobeGroup;
  }

  // Helper to build an Indian Wooden Charpai Bed (Hiding place!)
  function createCharpaiBed(id: string, name: string, x: number, y: number, z: number, rotY = 0) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(x, y, z);
    bedGroup.rotation.y = rotY;

    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 3.2), darkTeakMat);
    frame.position.set(0, 0.8, 0);
    frame.castShadow = true;
    bedGroup.add(frame);

    // Mattress / weathered cloth
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x47382d, roughness: 0.9 });
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 3.0), mattressMat);
    mattress.position.set(0, 0.95, 0);
    bedGroup.add(mattress);

    // 4 Corner Legs
    for (const lx of [-1.0, 1.0]) {
      for (const lz of [-1.4, 1.4]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), darkTeakMat);
        leg.position.set(lx, 0.4, lz);
        leg.castShadow = true;
        bedGroup.add(leg);
      }
    }

    // Four poster poles
    for (const px of [-1.0, 1.0]) {
      for (const pz of [-1.4, 1.4]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), darkTeakMat);
        post.position.set(px, 1.7, pz);
        bedGroup.add(post);
      }
    }

    root.add(bedGroup);
    colliders.push(new THREE.Box3().setFromObject(frame));

    interactives.push({
      id,
      type: 'hiding',
      name,
      position: new THREE.Vector3(x, y + 0.5, z),
      mesh: bedGroup,
      prompt: `Hide beneath ${name}`,
      hidingType: 'underbed',
      hidingCameraOffset: new THREE.Vector3(x, y + 0.35, z),
    });

    return bedGroup;
  }

  // Master Bedroom furniture (East Wing South, Z: 0 to 8)
  createWardrobe('hide-master-wardrobe', 'Antique Teak Almirah', 17, 4.5, 4.5, Math.PI);
  createCharpaiBed('hide-master-bed', 'Royal Zamindar Bed', 12, 4.5, 4.0, 0);

  // Guest Bedroom furniture (West Wing South, Z: 0 to 8)
  createWardrobe('hide-guest-wardrobe', 'Carved Wooden Wardrobe', -17, 4.5, 4.5, 0);
  createCharpaiBed('hide-guest-bed', 'Guest Charpai Bed', -12, 4.5, 3.5, 0);

  // Cursed Doll Nursery Furniture (East Wing North, Z: -8 to 0)
  const cribGroup = new THREE.Group();
  cribGroup.position.set(13.5, 4.5, -4.5);
  const cribBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.2), darkTeakMat);
  cribBase.position.y = 0.5;
  cribBase.castShadow = true;
  cribGroup.add(cribBase);
  for (const cx of [-0.75, 0.75]) {
    const cribRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 2.2), darkTeakMat);
    cribRail.position.set(cx, 0.9, 0);
    cribGroup.add(cribRail);
  }
  for (const cz of [-1.05, 1.05]) {
    const cribHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.06), darkTeakMat);
    cribHead.position.set(0, 0.9, cz);
    cribGroup.add(cribHead);
  }
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.8 }));
  pillow.position.set(0, 0.75, 0.5);
  cribGroup.add(pillow);
  root.add(cribGroup);
  colliders.push(new THREE.Box3().setFromObject(cribGroup));

  // Old Library & Study Furniture (West Wing North, Z: -8 to 0)
  const bookshelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.0, 3.4), darkTeakMat);
  bookshelf.position.set(-19.1, 6.0, -4.0);
  bookshelf.castShadow = true;
  root.add(bookshelf);
  colliders.push(new THREE.Box3().setFromObject(bookshelf));

  // =========================================================================
  // INTERACTIVE FIXTURE HELPERS: WORKING WATER TAPS & LIGHT SWITCHES
  // =========================================================================

  // Interactive Running Water Tap Helper
  function createInteractiveWaterTap(id: string, name: string, x: number, y: number, z: number, rotY = 0) {
    const tapGroup = new THREE.Group();
    tapGroup.position.set(x, y, z);
    tapGroup.rotation.y = rotY;

    // Vintage Brass curved pipe & faucet head
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), brassMat);
    pipe.position.set(0, 0.07, 0.05);
    pipe.rotation.x = Math.PI / 3;

    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.06, 8), brassMat);
    spout.position.set(0, 0.03, 0.1);

    const valveHandle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.025), brassMat);
    valveHandle.position.set(0, 0.12, 0.05);
    tapGroup.add(pipe, spout, valveHandle);

    // Glistening translucent water stream mesh
    const streamGeo = new THREE.CylinderGeometry(0.012, 0.022, 0.35, 8);
    const streamMesh = new THREE.Mesh(streamGeo, waterMat);
    streamMesh.position.set(0, -0.15, 0.1);
    streamMesh.visible = false;
    tapGroup.add(streamMesh);
    waterStreams.push(streamMesh);

    root.add(tapGroup);

    interactives.push({
      id,
      type: 'tap',
      name,
      position: new THREE.Vector3(x, y, z),
      mesh: tapGroup,
      prompt: `Press E to turn on ${name}`,
      isOpen: false,
      waterStreamMesh: streamMesh,
    });

    return tapGroup;
  }

  // Interactive Room Light Switch Helper
  function createInteractiveLightSwitch(id: string, name: string, x: number, y: number, z: number, rotY = 0, targetLight?: THREE.PointLight) {
    const switchGroup = new THREE.Group();
    switchGroup.position.set(x, y, z);
    switchGroup.rotation.y = rotY;

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.025), darkTeakMat);
    const toggle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.03), brassMat);
    toggle.position.z = 0.02;
    switchGroup.add(plate, toggle);
    root.add(switchGroup);

    interactives.push({
      id,
      type: 'switch',
      name,
      position: new THREE.Vector3(x, y, z),
      mesh: switchGroup,
      prompt: `Press E to toggle ${name}`,
      isOn: true,
      targetLight,
    });

    return switchGroup;
  }

  // Grandfather Clock with Roman Numerals & Swinging Pendulum
  function createGrandfatherClock(x: number, y: number, z: number, rotY = 0) {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(x, y, z);
    clockGroup.rotation.y = rotY;

    // Solid Teak wood tall casing
    const clockCase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.9, 0.55), darkTeakMat);
    clockCase.position.y = 1.45;
    clockCase.castShadow = true;
    clockGroup.add(clockCase);

    // Carved crown molding on top
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 0.62), darkTeakMat);
    crown.position.y = 2.92;
    clockGroup.add(crown);

    // Clock Face with Roman Numerals
    const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), clockFaceMat);
    clockFace.position.set(0, 2.32, 0.28);
    clockGroup.add(clockFace);

    // Glass panel window for pendulum
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35, roughness: 0.1 })
    );
    glass.position.set(0, 1.15, 0.28);
    clockGroup.add(glass);

    // Swinging Pendulum (pivots at y = 1.8)
    const pendulumPivot = new THREE.Group();
    pendulumPivot.position.set(0, 1.8, 0.15);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85), brassMat);
    rod.position.y = -0.42;
    const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), brassMat);
    bob.position.y = -0.85;
    bob.rotation.x = Math.PI / 2;
    pendulumPivot.add(rod, bob);
    clockGroup.add(pendulumPivot);
    pendulums.push(pendulumPivot);

    root.add(clockGroup);
    colliders.push(new THREE.Box3().setFromObject(clockCase));
    return clockGroup;
  }

  // Velvet Curtains on Windows
  function addCurtains(x: number, y: number, z: number, rotY = 0, width = 2.2, height = 3.2) {
    const curtainGroup = new THREE.Group();
    curtainGroup.position.set(x, y, z);
    curtainGroup.rotation.y = rotY;

    // Brass curtain rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, width + 0.4), brassMat);
    rod.position.y = height / 2 + 0.08;
    rod.rotation.z = Math.PI / 2;
    curtainGroup.add(rod);

    // Left & Right pleated maroon velvet drapes
    const drapeL = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.38, height), curtainMat);
    drapeL.position.set(-width * 0.35, 0, 0.02);
    drapeL.castShadow = true;

    const drapeR = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.38, height), curtainMat);
    drapeR.position.set(width * 0.35, 0, 0.02);
    drapeR.castShadow = true;

    // Golden tiebacks
    const tieL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 12), brassMat);
    tieL.position.set(-width * 0.35, -height * 0.15, 0.05);
    const tieR = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 12), brassMat);
    tieR.position.set(width * 0.35, -height * 0.15, 0.05);

    curtainGroup.add(drapeL, drapeR, tieL, tieR);
    root.add(curtainGroup);
    return curtainGroup;
  }

  // =========================================================================
  // 1. DELUXE INDIAN LIVING BAITHAK SUITE
  // =========================================================================
  const diwanGroup = new THREE.Group();
  diwanGroup.position.set(13, 0, 10);

  // Carved wooden platform base
  const diwanBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.6), darkTeakMat);
  diwanBase.position.y = 0.225;
  diwanBase.castShadow = true;
  diwanGroup.add(diwanBase);

  // 4 turned legs
  for (const dx of [-1.6, 1.6]) {
    for (const dz of [-0.65, 0.65]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.25, 8), darkTeakMat);
      leg.position.set(dx, 0.125, dz);
      diwanGroup.add(leg);
    }
  }

  // Carved Teak Backrest rail with spindles
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.55, 0.12), darkTeakMat);
  backRail.position.set(0, 0.72, -0.74);
  diwanGroup.add(backRail);

  // Plush Brocade Mattress (Gaddi)
  const gaddi = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.22, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 })
  );
  gaddi.position.y = 0.56;
  diwanGroup.add(gaddi);

  // Cylindrical Bolsters (Gol Takiya) on left and right sides
  for (const sx of [-1.4, 1.4]) {
    const bolster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.25, 12),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
    );
    bolster.position.set(sx, 0.8, -0.05);
    bolster.rotation.x = Math.PI / 2;
    const cap1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), brassMat);
    cap1.position.set(sx, 0.8, -0.68);
    const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), brassMat);
    cap2.position.set(sx, 0.8, 0.58);
    diwanGroup.add(bolster, cap1, cap2);
  }

  // Embroidered throw cushions
  for (let c = -1; c <= 1; c++) {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.48, 0.16),
      new THREE.MeshStandardMaterial({ color: c === 0 ? 0xf59e0b : 0x7c2d12, roughness: 0.85 })
    );
    cushion.position.set(c * 0.8, 0.85, -0.55);
    cushion.rotation.x = 0.2;
    diwanGroup.add(cushion);
  }

  root.add(diwanGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(13, 0.6, 10),
    new THREE.Vector3(3.6, 1.2, 1.6)
  ));

  // Sheesham Armchairs flanking coffee table
  function createSheeshamArmchair(x: number, y: number, z: number, rotY = 0) {
    const chair = new THREE.Group();
    chair.position.set(x, y, z);
    chair.rotation.y = rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85), new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.8 }));
    seat.position.y = 0.45;
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.1), darkTeakMat);
    chairBack.position.set(0, 0.9, -0.38);

    for (const cx of [-0.36, 0.36]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.75), darkTeakMat);
      arm.position.set(cx, 0.68, 0);
      chair.add(arm);
    }
    chair.add(seat, chairBack);
    root.add(chair);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y + 0.5, z), new THREE.Vector3(0.9, 1.0, 0.9)));
    return chair;
  }
  createSheeshamArmchair(9.5, 0, 7.0, Math.PI / 2);
  createSheeshamArmchair(16.5, 0, 7.0, -Math.PI / 2);

  // Coffee table in living room with brass chai kettle, glasses & vintage 1924 newspaper
  const tableMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.4), darkTeakMat);
  tableMesh.position.set(13, 0.275, 7);
  tableMesh.castShadow = true;
  root.add(tableMesh);
  colliders.push(new THREE.Box3().setFromObject(tableMesh));

  // Brass Chai Tray with Kettle & Glasses
  const chaiTray = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.03, 16), brassMat);
  chaiTray.position.set(13, 0.565, 7);
  const chaiKettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 12), brassMat);
  chaiKettle.position.set(13, 0.72, 7);
  root.add(chaiTray, chaiKettle);

  // Grandfather Clocks in Living Room & Upstairs Hallway
  createGrandfatherClock(18.5, 0, 4.5, -Math.PI / 4);
  createGrandfatherClock(-3.2, 4.5, 2.5, Math.PI / 2);

  // =========================================================================
  // 2. UPGRADED AUTHENTIC INDIAN KITCHEN & BHOJNALAYA
  // =========================================================================
  // L-Shaped Polished Black Kadappa Stone Counter
  const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.95, 1.6), stoneMat);
  kitchenCounter.position.set(-13, 0.475, 15);
  kitchenCounter.castShadow = true;
  root.add(kitchenCounter);
  colliders.push(new THREE.Box3().setFromObject(kitchenCounter));

  // Indian Stainless Steel 2-Burner Gas Stove
  const gasStove = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.0), gasStoveMat);
  gasStove.position.set(-14.2, 1.01, 15);
  root.add(gasStove);

  // Red Indian 14.2 KG LPG Gas Cylinder beneath counter
  const lpgCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 16), lpgCylinderMat);
  lpgCylinder.position.set(-15.8, 0.55, 15);
  lpgCylinder.castShadow = true;
  root.add(lpgCylinder);
  colliders.push(new THREE.Box3().setFromObject(lpgCylinder));

  // Kitchen Sink & Working Interactive Water Tap
  const kitchenSink = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.1), ceramicMat);
  kitchenSink.position.set(-11.2, 0.7, 15);
  root.add(kitchenSink);
  createInteractiveWaterTap('tap-kitchen-sink', 'Kitchen Tap', -11.2, 1.05, 15.3, Math.PI);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0xdde4ea, metalness: 0.85, roughness: 0.25 });

  // Vintage Refrigerator in kitchen corner
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(-18.5, 0, 15);
  const fridgeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.6 })
  );
  fridgeBody.position.y = 1.2;
  fridgeBody.castShadow = true;
  const fridgeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), steelMat);
  fridgeHandle.position.set(0.5, 1.3, 0.62);
  fridgeGroup.add(fridgeBody, fridgeHandle);
  root.add(fridgeGroup);
  colliders.push(new THREE.Box3().setFromObject(fridgeBody));

  // Indian Utensil Rack on Kitchen Wall (Thalis, Kadai, Chai Pan, Chakla-Belan, Matka)
  const utensilRack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.45), darkTeakMat);
  utensilRack.position.set(-13, 1.9, 16.6);
  root.add(utensilRack);

  // Stacked Thalis (Stainless Steel plates)
  for (let t = 0; t < 5; t++) {
    const thali = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.02, 14), steelMat);
    thali.position.set(-13.8 + t * 0.08, 2.05, 16.5);
    thali.rotation.x = Math.PI / 2;
    root.add(thali);
  }

  // Brass Kadai (Wok) with twin loop handles
  const kadai = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), brassMat);
  kadai.position.set(-12.8, 1.98, 16.5);
  kadai.rotation.x = Math.PI;
  root.add(kadai);

  // Traditional Terracotta Water Pot (Matka)
  const matka = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 })
  );
  matka.position.set(-9.8, 1.3, 15);
  root.add(matka);

  // =========================================================================
  // 3. FULLY FURNISHED GROUND FLOOR BATHROOM (SNANAGHAR)
  // Location: West Wing X: -16.5, Z: 0.5
  // =========================================================================
  // Tiled floor
  addFloor(-16.5, 0.01, 0.5, 6.0, 6.0, bathroomTileMat);

  // Bathroom walls
  addWall(-19.8, 0, 0.5, 0.4, WH, 6.0, wallMat);
  addWall(-13.5, 0, 2.5, 0.4, WH, 2.0, wallMat);
  addWall(-13.5, 0, -1.5, 0.4, WH, 2.0, wallMat);
  addWall(-16.5, 0, 3.5, 6.0, WH, 0.4, wallMat);
  addWall(-16.5, 0, -2.5, 6.0, WH, 0.4, wallMat);

  // Ceramic Bathtub with dirty water & Working Tap
  const gfBathtub = new THREE.Group();
  gfBathtub.position.set(-18.0, 0, 0.5);
  const tubRim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 1.2), ceramicMat);
  tubRim.position.y = 0.375;
  tubRim.castShadow = true;
  const tubWater = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), waterMat);
  tubWater.rotation.x = -Math.PI / 2;
  tubWater.position.y = 0.6;
  gfBathtub.add(tubRim, tubWater);
  root.add(gfBathtub);
  colliders.push(new THREE.Box3().setFromObject(tubRim));
  createInteractiveWaterTap('tap-bath-gf-tub', 'Bathtub Tap', -19.0, 0.85, 0.5, Math.PI / 2);

  // Ceramic Toilet Commode
  const gfToilet = new THREE.Group();
  gfToilet.position.set(-18.2, 0, -1.8);
  const commodeBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.45, 12), ceramicMat);
  commodeBowl.position.y = 0.225;
  const commodeTank = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.65), ceramicMat);
  commodeTank.position.set(-0.25, 0.65, 0);
  gfToilet.add(commodeBowl, commodeTank);
  root.add(gfToilet);
  colliders.push(new THREE.Box3().setFromObject(gfToilet));

  // Ceramic Washbasin on Pedestal & Distressed Mirror
  const gfBasin = new THREE.Group();
  gfBasin.position.set(-14.5, 0, 2.4);
  const basinPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.85, 10), ceramicMat);
  basinPedestal.position.y = 0.425;
  const basinBowl = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.75), ceramicMat);
  basinBowl.position.y = 0.85;
  gfBasin.add(basinPedestal, basinBowl);
  root.add(gfBasin);
  colliders.push(new THREE.Box3().setFromObject(gfBasin));
  createInteractiveWaterTap('tap-bath-gf-sink', 'Washbasin Tap', -14.5, 1.05, 2.7, Math.PI);

  // Weathered Mirror with Ghostly Cracked Reflection above basin
  const gfMirror = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.1), mirrorMat);
  gfMirror.position.set(-14.5, 1.9, 3.28);
  gfMirror.rotation.y = Math.PI;
  root.add(gfMirror);

  // Ground Floor Bathroom Light & Wall Switch
  const bathGfLight = new THREE.PointLight(0x2dd4bf, 1.2, 8.0, 1.8);
  bathGfLight.position.set(-16.5, 3.2, 0.5);
  bathGfLight.castShadow = true;
  root.add(bathGfLight);
  flickerLights.push(bathGfLight);
  createInteractiveLightSwitch('switch-bath-gf', 'Bathroom Switch', -13.7, 1.4, 0.5, -Math.PI / 2, bathGfLight);

  // =========================================================================
  // 4. FULLY FURNISHED UPPER MASTER BATHROOM & SHOWER
  // Location: East Wing X: 16.5, Z: -5.5
  // =========================================================================
  addFloor(16.5, 4.51, -5.5, 6.0, 5.0, bathroomTileMat);

  // Master Bathroom Walls
  addWall(19.8, 4.5, -5.5, 0.4, UWH, 5.0, wallMat);
  addWall(13.5, 4.5, -7.0, 0.4, UWH, 2.0, wallMat);
  addWall(13.5, 4.5, -4.0, 0.4, UWH, 2.0, wallMat);

  // Walk-in Shower Stall with Brass Showerhead
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 12), brassMat);
  showerHead.position.set(18.5, 7.2, -7.0);
  const showerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5), brassMat);
  showerPipe.position.set(18.5, 7.45, -7.0);
  root.add(showerHead, showerPipe);

  // Master Bathtub with working water tap
  const ufBathtub = new THREE.Group();
  ufBathtub.position.set(17.5, 4.5, -4.0);
  const ufTubRim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.2), ceramicMat);
  ufTubRim.position.y = 0.4;
  ufTubRim.castShadow = true;
  const ufTubWater = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), waterMat);
  ufTubWater.rotation.x = -Math.PI / 2;
  ufTubWater.position.y = 0.65;
  ufBathtub.add(ufTubRim, ufTubWater);
  root.add(ufBathtub);
  colliders.push(new THREE.Box3().setFromObject(ufTubRim));
  createInteractiveWaterTap('tap-bath-uf-tub', 'Master Bathtub Tap', 18.5, 5.35, -4.0, -Math.PI / 2);

  // Double Vanity Washbasin Counter & Grand Mirror
  const vanityCounter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.9), darkTeakMat);
  vanityCounter.position.set(15.5, 4.95, -7.4);
  vanityCounter.castShadow = true;
  root.add(vanityCounter);
  colliders.push(new THREE.Box3().setFromObject(vanityCounter));
  createInteractiveWaterTap('tap-bath-uf-sink1', 'Vanity Tap (Left)', 14.8, 5.5, -7.4, 0);
  createInteractiveWaterTap('tap-bath-uf-sink2', 'Vanity Tap (Right)', 16.2, 5.5, -7.4, 0);

  const ufMirror = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), mirrorMat);
  ufMirror.position.set(15.5, 6.4, -7.82);
  root.add(ufMirror);

  // Master Bathroom Light & Switch
  const bathUfLight = new THREE.PointLight(0x06b6d4, 1.2, 8.0, 1.8);
  bathUfLight.position.set(16.5, 7.4, -5.5);
  bathUfLight.castShadow = true;
  root.add(bathUfLight);
  flickerLights.push(bathUfLight);
  createInteractiveLightSwitch('switch-bath-uf', 'Master Bathroom Switch', 13.7, 5.9, -5.5, Math.PI / 2, bathUfLight);

  // =========================================================================
  // 5. OFFICIAL STRANGE CREATION STUDIO MEMORIAL BRASS PLAQUE
  // Location: Grand Entry Foyer X: 3.2, Y: 0, Z: 14.0
  // =========================================================================
  const plaquePedestal = new THREE.Group();
  plaquePedestal.position.set(3.2, 0, 14.0);

  // Carved Teakwood Plinth Base
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.8), darkTeakMat);
  plinth.position.y = 0.55;
  plinth.castShadow = true;
  plaquePedestal.add(plinth);

  // Slanted Brass Plaque facing the foyer
  const plaquePlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05), strangeLogoMat);
  plaquePlate.position.set(0, 1.2, 0);
  plaquePlate.rotation.x = -0.4;
  plaquePlate.rotation.y = -0.2;
  plaquePedestal.add(plaquePlate);

  root.add(plaquePedestal);
  colliders.push(new THREE.Box3().setFromObject(plinth));

  interactives.push({
    id: 'strange-creation-plaque',
    type: 'diary',
    name: 'STRANGE CREATION Studio Memorial Plaque',
    position: new THREE.Vector3(3.2, 1.2, 14.0),
    mesh: plaquePedestal,
    prompt: 'Press E to inspect STRANGE CREATION Memorial Plaque',
    action: () => {
      gameState.showSubtitle("STRANGE CREATION: Directed by Soham Dnyaneshwar Lokhande (Channel: MR STRANGE 1229)", 5000);
    },
  });

  // Storage Crates in Storage Room
  for (let c = 0; c < 3; c++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), darkTeakMat);
    crate.position.set(-10 - c * 1.6, 0.6, -4 + (c % 2) * 1.2);
    crate.castShadow = true;
    root.add(crate);
    colliders.push(new THREE.Box3().setFromObject(crate));
  }

  // Window Velvet Curtains draped on East Living Windows & Hallway Window
  addCurtains(19.8, 2.2, 7.0, -Math.PI / 2, 2.2, 3.2);
  addCurtains(19.8, 2.2, 12.0, -Math.PI / 2, 2.2, 3.2);
  addCurtains(0, 6.4, -19.8, 0, 3.2, 3.6);

  // --- 8B. AUTHENTIC INDIAN HAVELI ARCHITECTURE & ATMOSPHERIC PROPS ---
  const carpetTex = createCarpetTexture();
  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    roughness: 0.85,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const pillarTex = createCarvedWoodPillarTexture();
  const pillarMat = new THREE.MeshStandardMaterial({
    map: pillarTex,
    roughness: 0.75,
    metalness: 0.15,
  });

  const windowTex = createWindowRainTexture();
  const windowMat = new THREE.MeshStandardMaterial({
    map: windowTex,
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x050c18,
    emissiveIntensity: 0.4,
  });

  // 1. Royal Indian Kashmiri Carpets
  // Grand Foyer Carpet
  const foyerCarpet = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 7.0), carpetMat);
  foyerCarpet.rotation.x = -Math.PI / 2;
  foyerCarpet.position.set(0, 0.02, 11);
  foyerCarpet.receiveShadow = true;
  root.add(foyerCarpet);

  // Living Room Carpet
  const livingCarpet = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 7.5), carpetMat);
  livingCarpet.rotation.x = -Math.PI / 2;
  livingCarpet.position.set(13, 0.02, 10);
  livingCarpet.receiveShadow = true;
  root.add(livingCarpet);

  // Master Bedroom Carpet
  const bedroomCarpet = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 6.5), carpetMat);
  bedroomCarpet.rotation.x = -Math.PI / 2;
  bedroomCarpet.position.set(12, 4.52, 0);
  bedroomCarpet.receiveShadow = true;
  root.add(bedroomCarpet);

  // 2. Carved Teak Haveli Pillars (Grand Foyer & Living Room)
  const addHaveliPillar = (x: number, y: number, z: number, h = 4.2) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, y, z);

    // Carved square base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), darkTeakMat);
    base.position.y = 0.25;
    pillarGroup.add(base);

    // Fluted shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, h - 0.9, 12), pillarMat);
    shaft.position.y = (h - 0.9) / 2 + 0.45;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // Carved capital with brackets (traditional Indian torana bracket)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), darkTeakMat);
    cap.position.y = h - 0.2;
    pillarGroup.add(cap);

    root.add(pillarGroup);
    colliders.push(new THREE.Box3().setFromObject(base));
  };

  // Pillars in Foyer
  addHaveliPillar(-4.5, 0, 7.5);
  addHaveliPillar(4.5, 0, 7.5);
  addHaveliPillar(-4.5, 0, 14.5);
  addHaveliPillar(4.5, 0, 14.5);

  // Pillars in Living Room
  addHaveliPillar(8.5, 0, 5.5);
  addHaveliPillar(17.5, 0, 5.5);
  addHaveliPillar(8.5, 0, 14.5);
  addHaveliPillar(17.5, 0, 14.5);

  // 3. Coffered Teak Ceiling Beams
  const addCeilingBeams = (xCenter: number, y: number, zCenter: number, lengthX: number, lengthZ: number) => {
    // Cross beams X
    for (let z = zCenter - lengthZ / 2 + 2; z <= zCenter + lengthZ / 2 - 2; z += 3.5) {
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(lengthX, 0.35, 0.35), darkTeakMat);
      beamX.position.set(xCenter, y - 0.18, z);
      beamX.castShadow = true;
      root.add(beamX);
    }
  };
  addCeilingBeams(0, 4.2, 10, 12, 14); // Foyer beams
  addCeilingBeams(13, 4.2, 10, 14, 14); // Living room beams
  addCeilingBeams(0, 8.5, 0, 6, 18); // Upstairs hallway beams
  addCeilingBeams(11, 8.5, 0, 16, 14); // Master bedroom beams

  // 4. Grand Haveli Chandelier in Foyer
  const chandelierGroup = new THREE.Group();
  chandelierGroup.position.set(0, 3.4, 11);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2), brassMat);
  chain.position.y = 0.6;
  chandelierGroup.add(chain);

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 8, 24), brassMat);
  ring1.rotation.x = Math.PI / 2;
  chandelierGroup.add(ring1);

  // Candle globes on chandelier
  for (let c = 0; c < 6; c++) {
    const ang = (c / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa44 }));
    bulb.position.set(Math.cos(ang) * 0.9, 0.1, Math.sin(ang) * 0.9);
    chandelierGroup.add(bulb);

    // Small hanging crystals
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), new THREE.MeshStandardMaterial({
      color: 0xddddff,
      roughness: 0.1,
      metalness: 0.9,
    }));
    crystal.position.set(Math.cos(ang) * 0.9, -0.15, Math.sin(ang) * 0.9);
    chandelierGroup.add(crystal);
  }
  root.add(chandelierGroup);

  // 5. Traditional Indian Brass Urli Bowl in Foyer center
  const urliGroup = new THREE.Group();
  urliGroup.position.set(0, 0, 11);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.25, 16), brassMat);
  bowl.position.y = 0.13;
  bowl.castShadow = true;
  urliGroup.add(bowl);
  // Dark water inside
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16), new THREE.MeshStandardMaterial({
    color: 0x0e181c,
    roughness: 0.1,
    metalness: 0.9,
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.24;
  urliGroup.add(water);
  // Floating marigold petals
  for (let m = 0; m < 7; m++) {
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 6, 6),
      new THREE.MeshStandardMaterial({ color: m % 2 === 0 ? 0xff7700 : 0xffbb00 })
    );
    petal.position.set((Math.random() - 0.5) * 0.5, 0.25, (Math.random() - 0.5) * 0.5);
    urliGroup.add(petal);
  }
  root.add(urliGroup);

  // 7. Vintage Gramophone in Living Room
  const gramophoneTable = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), darkTeakMat);
  gramophoneTable.position.set(18.5, 0.45, 15.5);
  gramophoneTable.castShadow = true;
  root.add(gramophoneTable);
  colliders.push(new THREE.Box3().setFromObject(gramophoneTable));

  const gramoHorn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 12, 1, true), brassMat);
  gramoHorn.position.set(18.5, 1.35, 15.5);
  gramoHorn.rotation.z = -0.6;
  gramoHorn.rotation.y = -Math.PI / 4;
  root.add(gramoHorn);

  // 8. Rainy Storm Windows overlooking the monsoon
  // Living room east windows
  for (let w = 0; w < 2; w++) {
    const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), windowMat);
    winMesh.position.set(19.832, 2.2, 7 + w * 5);
    winMesh.rotation.y = -Math.PI / 2;
    root.add(winMesh);
  }

  // Upstairs hallway north arched window
  const northWin = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.4), windowMat);
  northWin.position.set(0, 6.4, -19.832);
  root.add(northWin);

  // --- 9. WALL PORTRAITS: EXTENSIVE TATYA VINCHU & INDIAN FAMILY ARCHIVE GALLERY ---
  // Pasted directly onto wall plaster (Offset = 0.018m for a 0.035m frame depth - ZERO floating in air!)
  const tatyaPhotoTex = createTatyaWallPhotoTexture();
  const tatyaCloseupEyesTex = createTatyaCloseupEyesTexture();
  const tatyaDaggerTex = createTatyaDaggerPortraitTexture();
  const tatyaArchiveTex = createTatyaVintageArchiveTexture();
  const tatyaShrineTex = createTatyaShrineTexture();
  const annabellePhotoTex = createAnnabelleDollTexture();
  const dollFamilyTex0 = createCursedDollFamilyTexture(0);
  const dollFamilyTex1 = createCursedDollFamilyTexture(1);
  const dollFamilyTex2 = createCursedDollFamilyTexture(2);
  const familyPhotoTex0 = createIndianFamilyPhotoTexture(0);
  const familyPhotoTex1 = createIndianFamilyPhotoTexture(1);
  const familyPhotoTex2 = createIndianFamilyPhotoTexture(2);
  const ancestorGalleryTexes = [
    createAncestorGalleryTexture(0),
    createAncestorGalleryTexture(1),
    createAncestorGalleryTexture(2),
    createAncestorGalleryTexture(3),
  ];

  type PortraitType =
    | 'tatya'
    | 'tatya_eyes'
    | 'tatya_dagger'
    | 'tatya_archive'
    | 'tatya_shrine'
    | 'annabelle'
    | 'doll_family_0'
    | 'doll_family_1'
    | 'doll_family_2'
    | 'ancestor_0'
    | 'ancestor_1'
    | 'ancestor_2'
    | 'ancestor_3'
    | 'family_0'
    | 'family_1'
    | 'family_2';

  function getPortraitTexture(type: PortraitType): THREE.Texture {
    switch (type) {
      case 'tatya': return tatyaPhotoTex;
      case 'tatya_eyes': return tatyaCloseupEyesTex;
      case 'tatya_dagger': return tatyaDaggerTex;
      case 'tatya_archive': return tatyaArchiveTex;
      case 'tatya_shrine': return tatyaShrineTex;
      case 'annabelle': return annabellePhotoTex;
      case 'doll_family_0': return dollFamilyTex0;
      case 'doll_family_1': return dollFamilyTex1;
      case 'doll_family_2': return dollFamilyTex2;
      case 'ancestor_0': return ancestorGalleryTexes[0];
      case 'ancestor_1': return ancestorGalleryTexes[1];
      case 'ancestor_2': return ancestorGalleryTexes[2];
      case 'ancestor_3': return ancestorGalleryTexes[3];
      case 'family_0': return familyPhotoTex0;
      case 'family_1': return familyPhotoTex1;
      case 'family_2': return familyPhotoTex2;
      default: return tatyaPhotoTex;
    }
  }

  function addPastedWallPortrait(
    x: number,
    y: number,
    z: number,
    rotY = 0,
    width = 1.0,
    height = 1.3,
    type: PortraitType = 'tatya'
  ) {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(x, y, z);
    frameGroup.rotation.y = rotY;

    // Distressed dark teak wood frame border (Frame depth = 0.035m)
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.14, height + 0.14, 0.035),
      darkTeakMat
    );
    border.castShadow = true;
    frameGroup.add(border);

    // Inner brass filigree beading
    const beading = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.03, height + 0.03, 0.036),
      brassMat
    );
    frameGroup.add(beading);

    // Canvas picture surface flush with front face
    const photoMat = new THREE.MeshStandardMaterial({
      map: getPortraitTexture(type),
      roughness: 0.4,
      metalness: 0.05,
    });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(width, height), photoMat);
    photo.position.z = 0.019;
    frameGroup.add(photo);

    root.add(frameGroup);
    return frameGroup;
  }

  // --- PASTED WALL PORTRAITS OF TATYA VINCHU & DOLLS THROUGHOUT KALAPUR MANSION ---
  // 1. Entrance Foyer (South Wall inner face at Z = 16.85, pasted at Z = 16.832)
  addPastedWallPortrait(4.5, 2.3, 16.832, Math.PI, 1.1, 1.4, 'tatya');
  addPastedWallPortrait(-4.5, 2.3, 16.832, Math.PI, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(2.2, 2.3, 16.832, Math.PI, 0.9, 1.2, 'tatya_archive');
  addPastedWallPortrait(-2.2, 2.3, 16.832, Math.PI, 0.9, 1.2, 'annabelle');

  // 2. Living Baithak (East Wall inner face at X = 19.85, pasted at X = 19.832 & South Wall)
  addPastedWallPortrait(19.832, 2.3, 5.0, -Math.PI / 2, 1.2, 1.5, 'tatya_dagger');
  addPastedWallPortrait(19.832, 2.3, 8.5, -Math.PI / 2, 1.1, 1.4, 'tatya_shrine');
  addPastedWallPortrait(19.832, 2.3, 11.0, -Math.PI / 2, 1.1, 1.4, 'tatya');
  addPastedWallPortrait(19.832, 2.3, 2.5, -Math.PI / 2, 1.0, 1.3, 'tatya_eyes');
  // 1920s Indian Family & Ancestor portraits in Living Room
  addPastedWallPortrait(13.0, 2.3, 16.832, Math.PI, 1.4, 1.7, 'family_0'); // 1920s Zamindar family group
  addPastedWallPortrait(10.0, 2.3, 16.832, Math.PI, 1.2, 1.5, 'family_1'); // 1921 Wedding portrait
  addPastedWallPortrait(16.0, 2.3, 16.832, Math.PI, 1.2, 1.5, 'family_2'); // Stern Kalapur Ancestor
  addPastedWallPortrait(19.832, 2.3, 13.5, -Math.PI / 2, 1.1, 1.4, 'doll_family_0');

  // 3. Puja Prayer Room (South Wall at Z = 16.832 & East Wall at X = 19.832)
  addPastedWallPortrait(13.5, 2.3, 16.832, Math.PI, 1.3, 1.6, 'tatya_shrine'); // Sacred Tatya Shrine
  addPastedWallPortrait(16.5, 2.3, 16.832, Math.PI, 1.0, 1.3, 'tatya_eyes');
  addPastedWallPortrait(19.832, 2.3, 14.0, -Math.PI / 2, 1.1, 1.4, 'tatya_dagger');
  addPastedWallPortrait(19.832, 2.3, 16.0, -Math.PI / 2, 1.0, 1.3, 'family_2');

  // 4. Grand Dining Hall (North Wall inner face at Z = -7.85, pasted at Z = -7.832 & East Wall at X = 19.832)
  addPastedWallPortrait(13.5, 2.3, -7.832, 0, 1.3, 1.6, 'tatya_archive'); // 1924 Case File
  addPastedWallPortrait(16.8, 2.3, -7.832, 0, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(10.5, 2.3, -7.832, 0, 1.4, 1.7, 'family_0'); // Dining Zamindar Family portrait
  addPastedWallPortrait(19.832, 2.3, -3.5, -Math.PI / 2, 1.2, 1.5, 'tatya_dagger');
  addPastedWallPortrait(19.832, 2.3, -6.5, -Math.PI / 2, 1.0, 1.3, 'tatya');
  addPastedWallPortrait(19.832, 2.3, -1.5, -Math.PI / 2, 1.1, 1.4, 'doll_family_1');

  // 5. Kitchen & Bathrooms (South Wall at Z = 16.832 & West Wall inner face at X = -19.85, pasted at X = -19.832)
  addPastedWallPortrait(-13.5, 2.2, 16.832, Math.PI, 1.1, 1.4, 'tatya');
  addPastedWallPortrait(-16.5, 2.2, 16.832, Math.PI, 1.0, 1.3, 'tatya_eyes');
  addPastedWallPortrait(-19.832, 2.2, 11.0, Math.PI / 2, 1.1, 1.4, 'tatya_archive');
  addPastedWallPortrait(-19.832, 2.2, 7.5, Math.PI / 2, 1.1, 1.4, 'tatya_dagger');
  // Ground floor Snanaghar (Bathroom) wall
  addPastedWallPortrait(-16.5, 2.0, 3.48, Math.PI, 0.9, 1.1, 'family_2');
  addPastedWallPortrait(-19.78, 2.0, 2.0, Math.PI / 2, 0.9, 1.1, 'tatya_eyes');

  // 6. Storage Room / Tool Shed (West Wall at X = -19.832 & North Wall at Z = -7.832)
  addPastedWallPortrait(-19.832, 2.2, -2.0, Math.PI / 2, 1.2, 1.5, 'tatya_eyes');
  addPastedWallPortrait(-19.832, 2.2, 2.0, Math.PI / 2, 1.1, 1.4, 'tatya_dagger');
  addPastedWallPortrait(-13.5, 2.2, -7.832, 0, 1.2, 1.5, 'tatya_archive');
  addPastedWallPortrait(-16.8, 2.2, -7.832, 0, 1.0, 1.3, 'tatya_shrine');

  // 7. Staircase Climb Wall (North Wall Z = -7.832 overlooking staircase ascent)
  addPastedWallPortrait(-2.8, 2.8, -7.832, 0, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(2.8, 2.8, -7.832, 0, 1.1, 1.4, 'tatya_dagger');
  addPastedWallPortrait(0, 3.2, -7.832, 0, 1.4, 1.7, 'family_0'); // Grand family portrait on stair landing!

  // 8. Upstairs Central Corridor (Hallway Walls at X = -3.8 and X = 3.8; inner faces at -3.65 & 3.65)
  // East Hallway Wall (Facing West, pasted at X = 3.632)
  addPastedWallPortrait(3.632, 6.3, 5.5, -Math.PI / 2, 1.1, 1.4, 'tatya_shrine');
  addPastedWallPortrait(3.632, 6.3, 2.5, -Math.PI / 2, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(3.632, 6.3, 0.0, -Math.PI / 2, 1.1, 1.4, 'family_1');
  addPastedWallPortrait(3.632, 6.3, -2.5, -Math.PI / 2, 1.1, 1.4, 'tatya_dagger');
  addPastedWallPortrait(3.632, 6.3, -5.5, -Math.PI / 2, 1.1, 1.4, 'tatya_archive');

  // West Hallway Wall (Facing East, pasted at X = -3.632)
  addPastedWallPortrait(-3.632, 6.3, 5.5, Math.PI / 2, 1.1, 1.4, 'tatya_archive');
  addPastedWallPortrait(-3.632, 6.3, 2.5, Math.PI / 2, 1.1, 1.4, 'tatya');
  addPastedWallPortrait(-3.632, 6.3, 0.0, Math.PI / 2, 1.1, 1.4, 'family_2');
  addPastedWallPortrait(-3.632, 6.3, -2.5, Math.PI / 2, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(-3.632, 6.3, -5.5, Math.PI / 2, 1.1, 1.4, 'tatya_dagger');

  // 9. Cursed Doll Nursery (Upper East North: North Wall Z = -7.832, East Wall X = 19.832)
  addPastedWallPortrait(12.0, 6.3, -7.832, 0, 1.3, 1.6, 'tatya_eyes'); // Staring down at crib
  addPastedWallPortrait(16.5, 6.3, -7.832, 0, 1.1, 1.4, 'tatya_shrine');
  addPastedWallPortrait(19.832, 6.3, -4.0, -Math.PI / 2, 1.2, 1.5, 'tatya_dagger');
  addPastedWallPortrait(19.832, 6.3, -6.5, -Math.PI / 2, 1.0, 1.3, 'tatya_archive');
  addPastedWallPortrait(16.0, 6.3, -0.168, Math.PI, 1.2, 1.5, 'tatya');
  addPastedWallPortrait(12.0, 6.3, -0.168, Math.PI, 1.1, 1.4, 'doll_family_2');

  // 10. Master Bedchamber (Upper East South: East Wall X = 19.832, South Wall Z = 7.832)
  addPastedWallPortrait(19.832, 6.3, 4.0, -Math.PI / 2, 1.3, 1.6, 'tatya');
  addPastedWallPortrait(19.832, 6.3, 6.5, -Math.PI / 2, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(12.0, 6.3, 7.832, Math.PI, 1.3, 1.6, 'family_1'); // Royal Wedding above Zamindar bed
  addPastedWallPortrait(16.5, 6.3, 7.832, Math.PI, 1.1, 1.4, 'family_0');
  addPastedWallPortrait(9.0, 6.3, 7.832, Math.PI, 1.0, 1.3, 'tatya_shrine');
  // Master Bathroom wall portrait
  addPastedWallPortrait(19.78, 6.3, -4.0, -Math.PI / 2, 0.9, 1.1, 'tatya_eyes');

  // 11. Old Library & Study (Upper West North: North Wall Z = -7.832, West Wall X = -19.832)
  addPastedWallPortrait(-12.0, 6.3, -7.832, 0, 1.3, 1.6, 'tatya_archive'); // The 1924 Tantrik Dossier
  addPastedWallPortrait(-16.5, 6.3, -7.832, 0, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(-19.832, 6.3, -4.0, Math.PI / 2, 1.2, 1.5, 'tatya_dagger');
  addPastedWallPortrait(-19.832, 6.3, -6.5, Math.PI / 2, 1.0, 1.3, 'tatya');
  addPastedWallPortrait(-12.0, 6.3, -0.168, 0, 1.2, 1.5, 'family_2');

  // 12. Guest Bedchamber (Upper West South: West Wall X = -19.832, South Wall Z = 7.832)
  addPastedWallPortrait(-19.832, 6.3, 4.0, Math.PI / 2, 1.2, 1.5, 'tatya_eyes');
  addPastedWallPortrait(-19.832, 6.3, 6.5, Math.PI / 2, 1.0, 1.3, 'tatya_shrine');
  addPastedWallPortrait(-12.0, 6.3, 7.832, Math.PI, 1.2, 1.5, 'tatya_dagger');
  addPastedWallPortrait(-16.5, 6.3, 7.832, Math.PI, 1.0, 1.3, 'tatya_archive');
  addPastedWallPortrait(-9.0, 6.3, 7.832, Math.PI, 1.1, 1.4, 'family_0');

  // 13. Mystic Sanctum / Altar Room (Upper North: Altar Wall Z = -19.832, East Wall X = 7.832, West Wall X = -7.832)
  addPastedWallPortrait(0, 6.6, -19.832, 0, 1.6, 2.0, 'tatya_shrine'); // Grand Altar Icon
  addPastedWallPortrait(-3.5, 6.4, -19.832, 0, 1.3, 1.6, 'tatya_eyes');
  addPastedWallPortrait(3.5, 6.4, -19.832, 0, 1.3, 1.6, 'tatya_dagger');
  addPastedWallPortrait(7.832, 6.3, -14.0, -Math.PI / 2, 1.2, 1.5, 'tatya_archive');
  addPastedWallPortrait(-7.832, 6.3, -14.0, Math.PI / 2, 1.2, 1.5, 'tatya');
  addPastedWallPortrait(7.832, 6.3, -17.0, -Math.PI / 2, 1.1, 1.4, 'tatya_eyes');
  addPastedWallPortrait(-7.832, 6.3, -17.0, Math.PI / 2, 1.1, 1.4, 'tatya_dagger');

  // --- 9. TABLES WITH SLIDING DRAWERS & HIDDEN KEYS / TOOLS ---
  function createTableWithDrawer(
    id: string,
    tableName: string,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    itemConfig?: {
      id: string;
      type: 'cutters' | 'gate_key' | 'key' | 'battery' | 'crowbar' | 'bell';
      name: string;
      mesh: THREE.Group;
    }
  ) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);
    tableGroup.rotation.y = rotY;

    // Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.9), darkTeakMat);
    top.position.y = 0.85;
    top.castShadow = true;
    tableGroup.add(top);

    // 4 Turned Teak Legs
    for (const lx of [-0.65, 0.65]) {
      for (const lz of [-0.35, 0.35]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.82, 8), darkTeakMat);
        leg.position.set(lx, 0.41, lz);
        leg.castShadow = true;
        tableGroup.add(leg);
      }
    }

    // Apron / housing frame under tabletop
    const apronBack = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 0.04), darkTeakMat);
    apronBack.position.set(0, 0.74, -0.38);
    tableGroup.add(apronBack);
    for (const sx of [-0.66, 0.66]) {
      const apronSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.76), darkTeakMat);
      apronSide.position.set(sx, 0.74, 0);
      tableGroup.add(apronSide);
    }

    // Pullable Sliding Drawer Group
    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0, 0.73, 0); // resting closed inside apron

    // Drawer Front Face
    const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.04), darkTeakMat);
    drawerFront.position.set(0, 0, 0.38);
    drawerFront.castShadow = true;
    drawerGroup.add(drawerFront);

    // Brass Pull Knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brassMat);
    knob.position.set(0, 0, 0.41);
    drawerGroup.add(knob);

    // Drawer Interior Bottom Tray
    const drawerBottom = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.65), darkTeakMat);
    drawerBottom.position.set(0, -0.06, 0.05);
    drawerGroup.add(drawerBottom);

    // If an item is hidden inside this drawer, attach it inside the drawer tray!
    if (itemConfig) {
      itemConfig.mesh.position.set(0, -0.02, 0.1);
      drawerGroup.add(itemConfig.mesh);

      // Register interactive item inside drawer
      interactives.push({
        id: itemConfig.id,
        type: itemConfig.type,
        name: itemConfig.name,
        position: new THREE.Vector3(x, y + 0.8, z),
        mesh: itemConfig.mesh,
        prompt: `Press E to pick up ${itemConfig.name}`,
        drawerId: id,
        action: () => {
          itemConfig.mesh.visible = false;
        },
      });
    }

    tableGroup.add(drawerGroup);
    root.add(tableGroup);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y + 0.45, z),
      new THREE.Vector3(1.5, 0.9, 0.9)
    ));

    // Interactive Drawer definition
    interactives.push({
      id: `drawer-${id}`,
      type: 'drawer',
      name: `${tableName} Drawer`,
      position: new THREE.Vector3(x, y + 0.75, z + (rotY === 0 ? 0.45 : rotY === Math.PI ? -0.45 : 0)),
      mesh: drawerGroup,
      drawerMesh: drawerGroup,
      drawerId: id,
      prompt: `Press E to open ${tableName} Drawer`,
    });

    return { tableGroup, drawerGroup };
  }

  // --- TOOL 1: HEAVY BOLT CUTTERS ---
  const boltCuttersGroup = new THREE.Group();
  const redHandleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
  for (const hx of [-0.08, 0.08]) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.42, 8), redHandleMat);
    handle.rotation.z = hx < 0 ? -0.15 : 0.15;
    handle.rotation.x = Math.PI / 2;
    handle.position.set(hx, 0, 0.1);
    boltCuttersGroup.add(handle);
  }
  const cutterJaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.15), ironMat);
  cutterJaw.position.set(0, 0, -0.12);
  boltCuttersGroup.add(cutterJaw);
  const pivotBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), brassMat);
  pivotBolt.position.set(0, 0.02, -0.06);
  boltCuttersGroup.add(pivotBolt);

  // --- TOOL 2: OLD BRASS KEY ---
  const brassKeyGroup = new THREE.Group();
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16), brassMat);
  const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24), brassMat);
  keyStem.rotation.x = Math.PI / 2;
  keyStem.position.z = 0.12;
  const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.014, 0.05), brassMat);
  keyBit.position.set(0.03, 0, 0.2);
  brassKeyGroup.add(keyRing, keyStem, keyBit);

  // --- TOOL 3: SANCTUM KEY ---
  const sanctumKeyGroup = new THREE.Group();
  const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 16), ironMat);
  const sStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26), ironMat);
  sStem.rotation.x = Math.PI / 2;
  sStem.position.z = 0.13;
  sanctumKeyGroup.add(sRing, sStem);

  // --- TOOL 4: HEAVY GATE KEY ---
  const gateKeyGroup = new THREE.Group();
  const gRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), brassMat);
  const gStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28), brassMat);
  gStem.rotation.x = Math.PI / 2;
  gStem.position.z = 0.14;
  const gFlag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.06), brassMat);
  gFlag.position.set(0.04, 0, 0.22);
  gateKeyGroup.add(gRing, gStem, gFlag);

  // --- TOOL 5: HEAVY STEEL CROWBAR (Escape Route 2 Tool) ---
  const crowbarGroup = new THREE.Group();
  const crowbarMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.85 });
  const crowbarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6), crowbarMat);
  crowbarShaft.rotation.x = Math.PI / 2;
  const crowbarCurve = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI / 1.7), crowbarMat);
  crowbarCurve.position.set(0, 0.04, -0.2);
  crowbarGroup.add(crowbarShaft, crowbarCurve);

  // --- TOOL 6: SACRED TANTRIC BELL (Escape Route 2 Holy Ward) ---
  const tantricBellGroup = new THREE.Group();
  const tantricBellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.085, 0.13, 14), brassMat);
  tantricBellBody.position.y = 0.065;
  const bellHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.15, 8), brassMat);
  bellHandle.position.y = 0.18;
  const bellFinial = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brassMat);
  bellFinial.position.y = 0.26;
  tantricBellGroup.add(tantricBellBody, bellHandle, bellFinial);

  // --- TOOL 7: SPARE FLASHLIGHT BATTERY ---
  const battGroup = new THREE.Group();
  const batt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14), brassMat);
  batt.rotation.x = Math.PI / 2;
  battGroup.add(batt);

  // --- PROCEDURAL TOOL SHUFFLE ACROSS 7 HAVELI ROOMS ---
  const toolPool = [
    {
      id: 'cutters-kitchen',
      type: 'cutters' as const,
      name: 'Heavy Bolt Cutters',
      mesh: boltCuttersGroup,
    },
    {
      id: 'key-gate',
      type: 'gate_key' as const,
      name: 'Heavy Gate Key',
      mesh: gateKeyGroup,
    },
    {
      id: 'key-brass',
      type: 'key' as const,
      name: 'Old Brass Key',
      mesh: brassKeyGroup,
    },
    {
      id: 'key-attic',
      type: 'key' as const,
      name: 'Sanctum Key',
      mesh: sanctumKeyGroup,
    },
    {
      id: 'tool-crowbar',
      type: 'crowbar' as const,
      name: 'Heavy Steel Crowbar',
      mesh: crowbarGroup,
    },
    {
      id: 'sacred-bell',
      type: 'bell' as const,
      name: 'Sacred Tantric Bell',
      mesh: tantricBellGroup,
    },
    {
      id: 'batt-drawer',
      type: 'battery' as const,
      name: 'Flashlight Battery',
      mesh: battGroup,
    },
  ];

  // Fisher-Yates procedural shuffle
  for (let i = toolPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = toolPool[i];
    toolPool[i] = toolPool[j];
    toolPool[j] = temp;
  }

  // Deploy drawers across 7 distinct haveli rooms!
  createTableWithDrawer('kitchen', 'Kitchen Table', -11, 0, 14, Math.PI, toolPool[0]);
  createTableWithDrawer('living', 'Living Room Table', 14, 0, 7, -Math.PI / 2, toolPool[1]);
  createTableWithDrawer('storage', 'Storage Room Workbench', -13, 0, -3, 0, toolPool[2]);
  createTableWithDrawer('master', 'Master Bedroom Vanity', 12, 4.5, 1.5, 0, toolPool[3]);
  createTableWithDrawer('library', 'Library Study Desk', -13, 4.5, -4, 0, toolPool[4]);
  createTableWithDrawer('guest', 'Guest Bedroom Nightstand', -12, 4.5, 4, Math.PI / 2, toolPool[5]);
  createTableWithDrawer('dining', 'Grand Dining Room Buffet', 13, 0, -5, Math.PI / 2, toolPool[6]);

  // Extra Battery in Kitchen pantry shelf
  const extraBattGroup = new THREE.Group();
  extraBattGroup.position.set(-14.5, 1.1, 11);
  const extraBatt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14), brassMat);
  extraBattGroup.add(extraBatt);
  root.add(extraBattGroup);
  interactives.push({
    id: 'batt-kitchen',
    type: 'battery',
    name: 'Flashlight Battery',
    position: new THREE.Vector3(-14.5, 1.1, 11),
    mesh: extraBattGroup,
    prompt: 'Press E to pick up Battery',
    action: () => {
      extraBattGroup.visible = false;
    },
  });

  // =========================================================================
  // --- ESCAPE ROUTE 2: UNDERGROUND CATACOMB ESCAPE HATCH ---
  // Location: Tool Shed & Storage Chamber (Ground floor X: -16.5, Z: -5.5)
  // =========================================================================
  const cellarHatchGroup = new THREE.Group();
  cellarHatchGroup.position.set(-16.5, 0.02, -5.5);

  // Stone rim well collar
  const stoneRim = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.28, 16), stoneMat);
  stoneRim.position.y = 0.14;
  stoneRim.castShadow = true;
  cellarHatchGroup.add(stoneRim);

  // Dark bottomless abyss pit inside
  const abyssPit = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 16),
    new THREE.MeshBasicMaterial({ color: 0x020204 })
  );
  abyssPit.rotation.x = -Math.PI / 2;
  abyssPit.position.y = 0.26;
  cellarHatchGroup.add(abyssPit);

  // Heavy Cross Iron Bars (Pried open with Heavy Crowbar)
  const hatchBars = new THREE.Group();
  for (let b = -0.65; b <= 0.65; b += 0.26) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), ironMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.29, b);
    hatchBars.add(bar);
  }
  cellarHatchGroup.add(hatchBars);

  // Red glowing tantric demonic blood seal glyph (Dispelled by Sacred Tantric Bell)
  const sealTex = createTantricWallWritingTexture();
  const sealMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 16),
    new THREE.MeshStandardMaterial({
      map: sealTex,
      transparent: true,
      opacity: 0.95,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
    })
  );
  sealMesh.rotation.x = -Math.PI / 2;
  sealMesh.position.y = 0.32;
  cellarHatchGroup.add(sealMesh);

  // Bronze floodgate release valve wheel
  const valveWheel = new THREE.Group();
  valveWheel.position.set(0.75, 0.42, 0.75);
  const vRim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 16), brassMat);
  vRim.rotation.x = Math.PI / 2;
  const vPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), brassMat);
  vPost.position.y = -0.15;
  valveWheel.add(vRim, vPost);
  cellarHatchGroup.add(valveWheel);

  // Red atmospheric glow light hovering over hatch
  const hatchLight = new THREE.PointLight(0xef4444, 1.5, 6.0, 1.8);
  hatchLight.position.set(0, 1.1, 0);
  cellarHatchGroup.add(hatchLight);
  flickerLights.push(hatchLight);

  root.add(cellarHatchGroup);
  colliders.push(
    new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-16.5, 0.3, -5.5), new THREE.Vector3(2.5, 0.6, 2.5))
  );

  interactives.push({
    id: 'cellar-hatch',
    type: 'cellar_hatch',
    name: 'Underground Catacomb Hatch',
    position: new THREE.Vector3(-16.5, 0.5, -5.5),
    mesh: cellarHatchGroup,
    prompt: 'Press E to inspect Underground Catacombs',
    action: () => {
      if (gameState.cellarBarsPried) {
        hatchBars.visible = false;
      }
      if (gameState.cellarSealBroken) {
        sealMesh.visible = false;
        hatchLight.color.set(0x38bdf8);
      }
    },
  });

  // --- ITEM 6: THE CURSED ANCESTOR PHOTO FRAME (The Core Mission Puzzle!)
  // Located on the Altar in Mystic Sanctum (X = 0, Y = 5.2, Z = -17)
  const sanctumAltar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.4), darkTeakMat);
  sanctumAltar.position.set(0, 5.0, -17);
  sanctumAltar.castShadow = true;
  root.add(sanctumAltar);
  colliders.push(new THREE.Box3().setFromObject(sanctumAltar));

  const photoFrameGroup = new THREE.Group();
  photoFrameGroup.position.set(0, 5.8, -17);

  // Antique Carved Frame border
  const borderGeo = new THREE.BoxGeometry(1.0, 1.25, 0.08);
  const borderMesh = new THREE.Mesh(borderGeo, brassMat);
  borderMesh.castShadow = true;
  photoFrameGroup.add(borderMesh);

  // Portrait inside frame
  const portraitFaceGeo = new THREE.PlaneGeometry(0.85, 1.1);
  const portraitFaceMat = new THREE.MeshStandardMaterial({
    map: portraitTex,
    roughness: 0.4,
  });
  const portraitFaceMesh = new THREE.Mesh(portraitFaceGeo, portraitFaceMat);
  portraitFaceMesh.position.z = 0.05;
  photoFrameGroup.add(portraitFaceMesh);

  root.add(photoFrameGroup);

  interactives.push({
    id: 'photo-frame-pickup',
    type: 'frame',
    name: 'Cursed Kalapur Photo Frame',
    position: new THREE.Vector3(0, 5.8, -17),
    mesh: photoFrameGroup,
    prompt: 'Press E to take Ancestor Photo Frame',
    action: () => {
      photoFrameGroup.visible = false;
    },
  });

  // DIARY ENTRIES (Interactive Notes)
  const createDiaryItem = (id: string, title: string, x: number, y: number, z: number) => {
    const pageGroup = new THREE.Group();
    pageGroup.position.set(x, y, z);
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a5, roughness: 0.9 });
    const page = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.45), pageMat);
    pageGroup.add(page);
    root.add(pageGroup);

    interactives.push({
      id,
      type: 'diary',
      name: title,
      position: new THREE.Vector3(x, y, z),
      mesh: pageGroup,
      prompt: `Press E to read ${title}`,
    });
  };
  createDiaryItem('diary1', 'Zamindar\'s Final Journal', 13, 0.65, 7);
  createDiaryItem('diary2', 'Tantric Binding Seal', -12, 5.0, 2);
  createDiaryItem('diary3', 'Hidden Chamber Note', 0.8, 5.55, -17);

  // --- 10. ATMOSPHERIC LIGHTING & FLICKERING DIYAS ---
  // Ambient moonlight fill (cool blue-grey)
  const hemiLight = new THREE.HemisphereLight(0x1a2638, 0x050403, 0.35);
  root.add(hemiLight);

  // Courtyard storm directional light (faint moonlight)
  const moonLight = new THREE.DirectionalLight(0x354b6b, 0.4);
  moonLight.position.set(8, 16, 24);
  moonLight.castShadow = true;
  root.add(moonLight);

  // Helper for antique hanging diya / wall lantern
  function addLantern(x: number, y: number, z: number, color = 0xff8833, intensity = 1.2, distance = 9) {
    const light = new THREE.PointLight(color, intensity, distance, 1.6);
    light.position.set(x, y, z);
    light.castShadow = true;
    root.add(light);
    flickerLights.push(light);

    // Visible small flame / diya dish
    const diyaMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffaa44 })
    );
    diyaMesh.position.set(x, y, z);
    root.add(diyaMesh);
    return light;
  }

  // Lanterns throughout Kalapur mansion
  addLantern(0, 3.2, 10, 0xff7722, 1.4, 10); // Foyer
  addLantern(13, 3.2, 10, 0xff6611, 1.1, 9); // Living Room
  addLantern(-13, 3.0, 10, 0xff5511, 0.8, 7); // Kitchen
  addLantern(-13, 3.0, -2, 0xff4411, 0.7, 7); // Storage
  addLantern(0, 7.0, 0, 0xff6622, 1.2, 9); // Upstairs Hallway
  addLantern(11, 7.0, 0, 0xff5511, 1.0, 9); // Master Bedroom
  addLantern(-11, 7.0, 0, 0xff5511, 0.9, 8); // Guest Bedroom
  addLantern(0, 6.8, -14, 0xee2211, 1.6, 12); // Mystic Sanctum (eerie ritual red)

  // --- HAUNTED ROCKING CHAIR IN LIVING ROOM ---
  const rockingChair = new THREE.Group();
  rockingChair.position.set(17.5, 0, 7.5);
  rockingChair.rotation.y = -Math.PI / 3;

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), darkTeakMat);
  seat.position.y = 0.55;
  seat.castShadow = true;
  rockingChair.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.08), darkTeakMat);
  backrest.position.set(0, 1.02, -0.38);
  backrest.castShadow = true;
  rockingChair.add(backrest);

  for (const rx of [-0.36, 0.36]) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.35), darkTeakMat);
    runner.position.set(rx, 0.05, 0);
    rockingChair.add(runner);

    const legF = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), darkTeakMat);
    legF.position.set(rx, 0.28, 0.32);
    rockingChair.add(legF);

    const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), darkTeakMat);
    legB.position.set(rx, 0.28, -0.32);
    rockingChair.add(legB);
  }
  root.add(rockingChair);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(17.5, 0.6, 7.5), new THREE.Vector3(1.2, 1.2, 1.2)));

  // --- 11. GHOST & TATYA FULL-HOUSE PATROL WAYPOINTS ---
  // Connects every single room across both floors through open doorways, arches, and the central staircase!
  // Visits: Mystic Sanctum -> Upstairs Hallway -> Cursed Doll Nursery -> Master Bedchamber ->
  // Old Library & Study -> Guest Bedchamber -> Staircase -> Grand Foyer -> Courtyard Gate ->
  // Puja Shrine Room -> Living Baithak -> Grand Dining Hall -> Central Chowk ->
  // Haunted Kitchen -> Storage Room & Tool Shed -> Staircase -> Upstairs
  const ghostWaypoints: THREE.Vector3[] = [
    // --- UPSTAIRS PATROL ---
    new THREE.Vector3(0, 4.5, -14),      // 0. Mystic Sanctum Altar (START)
    new THREE.Vector3(0, 4.5, -9.0),     // 1. Mystic Sanctum North Archway
    new THREE.Vector3(0, 4.5, -4.5),     // 2. North Staircase Landing
    // East Suite (Master Bedroom & Cursed Doll Nursery)
    new THREE.Vector3(3.8, 4.5, -1.5),   // 3. East Suite Doorway Threshold
    new THREE.Vector3(12.0, 4.5, -4.0),  // 4. Inside Cursed Doll Nursery (examining crib)
    new THREE.Vector3(12.5, 4.5, 0.0),   // 5. Partition Arch between Nursery & Master Bed
    new THREE.Vector3(12.0, 4.5, 4.5),   // 6. Inside Master Bedchamber (examining Zamindar bed)
    new THREE.Vector3(3.8, 4.5, 0.0),    // 7. Exiting East Suite into Upper Hallway
    // Upper Mezzanine & Balcony
    new THREE.Vector3(0, 4.5, 2.0),      // 8. Upstairs Central Hallway
    new THREE.Vector3(0, 4.5, 6.5),      // 9. South Mezzanine Balcony (peers down over Foyer)
    new THREE.Vector3(0, 4.5, 2.0),      // 10. Returning along Upper Hallway
    // West Suite (Old Library & Guest Bedchamber)
    new THREE.Vector3(-3.8, 4.5, 0.0),   // 11. West Suite Doorway Threshold
    new THREE.Vector3(-12.0, 4.5, 3.5),  // 12. Inside Guest Bedchamber
    new THREE.Vector3(-12.5, 4.5, 0.0),  // 13. Partition Arch between Guest Bed & Library
    new THREE.Vector3(-12.0, 4.5, -4.0), // 14. Inside Old Library & Study (examining bookshelf)
    new THREE.Vector3(-3.8, 4.5, -1.5),  // 15. Exiting West Suite into Upper Landing
    new THREE.Vector3(0, 4.5, -2.0),     // 16. Top of Central Staircase
    // Descending Staircase
    new THREE.Vector3(0, 3.4, 0.5),      // 17. Staircase Upper Steps
    new THREE.Vector3(0, 2.25, 3.0),     // 18. Staircase Midpoint
    new THREE.Vector3(0, 1.1, 5.25),     // 19. Staircase Lower Steps
    new THREE.Vector3(0, 0, 7.5),        // 20. Staircase Ground Landing
    // --- GROUND FLOOR PATROL ---
    new THREE.Vector3(0, 0, 11.5),       // 21. Grand Foyer Center
    new THREE.Vector3(0, 0, 16.5),       // 22. South Mansion Exit Door (stalking the locked exit!)
    new THREE.Vector3(0, 0, 12.0),       // 23. Turning back into Foyer
    // East Wing (Puja Shrine, Living Baithak, Dining Room)
    new THREE.Vector3(5.5, 0, 11.5),     // 24. East Colonnade Passage
    new THREE.Vector3(13.5, 0, 11.0),    // 25. Puja Shrine Entrance Archway
    new THREE.Vector3(13.5, 0, 14.5),    // 26. Inside Puja Prayer Shrine (examining deity altar)
    new THREE.Vector3(13.5, 0, 11.0),    // 27. Exiting Puja Shrine
    new THREE.Vector3(13.5, 0, 6.0),     // 28. Inside Living Baithak (checking gramophone & sofa)
    new THREE.Vector3(13.5, 0, 1.5),     // 29. Dining Room Entrance Archway
    new THREE.Vector3(13.5, 0, -3.5),    // 30. Inside Grand Dining Room (stalking banquet table)
    new THREE.Vector3(13.5, 0, 1.5),     // 31. Exiting Dining Room
    new THREE.Vector3(5.5, 0, 5.5),      // 32. Passing East Colonnade into Diwankhana
    new THREE.Vector3(0, 0, 8.0),        // 33. Central Diwankhana / Chowk
    // West Wing (Haunted Kitchen & Storage Room / Tool Shed)
    new THREE.Vector3(-5.5, 0, 8.0),     // 34. Passing West Colonnade into Kitchen
    new THREE.Vector3(-13.0, 0, 11.0),   // 35. Inside Haunted Kitchen (inspecting hearth & pots)
    new THREE.Vector3(-13.0, 0, 5.0),    // 36. Doorway between Kitchen & Storage Room
    new THREE.Vector3(-13.0, 0, -2.0),   // 37. Inside Storage Room & Tool Shed (stalking workbench)
    new THREE.Vector3(-13.0, 0, 5.0),    // 38. Exiting Storage Room back into Kitchen
    new THREE.Vector3(-5.5, 0, 7.5),     // 39. Passing West Colonnade to Staircase Base
    new THREE.Vector3(0, 0, 7.5),        // 40. At Base of Staircase
    // Ascending back to Mystic Sanctum
    new THREE.Vector3(0, 1.1, 5.25),     // 41. Climbing Staircase Lower Steps
    new THREE.Vector3(0, 2.25, 3.0),     // 42. Climbing Staircase Midpoint
    new THREE.Vector3(0, 3.4, 0.5),      // 43. Climbing Staircase Upper Steps
    new THREE.Vector3(0, 4.5, -2.0),     // 44. Reaching Upstairs Landing
    new THREE.Vector3(0, 4.5, -9.0),     // 45. Entering Mystic Sanctum Archway
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
  };
}
