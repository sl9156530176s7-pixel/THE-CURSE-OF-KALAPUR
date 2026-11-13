import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generators for Kalapur Mansion
 * Zero external 404s, sharp anisotropic filtering, SRGBColorSpace.
 */

// Helper to configure procedural canvas textures
function createTextureFromCanvas(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.generateMipmaps = true;
  return texture;
}

// 1. Aged Teak Wood Planks Floor
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark wood tone
  ctx.fillStyle = '#22150c';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = 64;
  for (let y = 0; y < 512; y += plankHeight) {
    const shade = (Math.random() - 0.5) * 20;
    const r = Math.floor(38 + shade);
    const g = Math.floor(24 + shade * 0.8);
    const b = Math.floor(15 + shade * 0.5);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 512, plankHeight - 4);

    // Plank seams
    ctx.fillStyle = '#0a0503';
    ctx.fillRect(0, y + plankHeight - 4, 512, 4);

    // Staggered vertical seams
    const vSeam1 = 120 + ((y * 3) % 200);
    const vSeam2 = vSeam1 + 220;
    ctx.fillRect(vSeam1, y, 4, plankHeight);
    ctx.fillRect(vSeam2, y, 4, plankHeight);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(15, 8, 4, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const gy = y + Math.random() * plankHeight;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 8, 350, gy + (Math.random() - 0.5) * 8, 512, gy);
      ctx.stroke();
    }

    // Dirt spots / dust
    for (let d = 0; d < 8; d++) {
      const dx = Math.random() * 512;
      const dy = y + Math.random() * plankHeight;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(dx, dy, Math.random() * 6 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return createTextureFromCanvas(canvas, 4, 4);
}

// 2. Weathered Haveli Wall Plaster (Crisp, atmospheric, exposed red bricks & carved baseboard)
export function createHaveliWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm distressed antique lime plaster (visible, clear architecture!)
  ctx.fillStyle = '#948a77';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tonal variation
  for (let y = 0; y < 512; y += 32) {
    const val = 145 + Math.floor((Math.random() - 0.5) * 16);
    ctx.fillStyle = `rgb(${val},${val - 10},${val - 25})`;
    ctx.fillRect(0, y, 512, 32);
  }

  // Exposed burnt clay haveli bricks where plaster has fallen off
  const drawBrickPatch = (bx: number, by: number, bw: number, bh: number) => {
    ctx.fillStyle = '#68251e';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#451610';
    for (let r = by; r < by + bh; r += 16) {
      ctx.fillRect(bx, r, bw, 2);
      for (let c = bx + ((r % 32 === 0) ? 0 : 16); c < bx + bw; c += 32) {
        ctx.fillRect(c, r, 2, 16);
      }
    }
    // Jagged peeling plaster perimeter
    ctx.strokeStyle = '#c5bbae';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
  };

  drawBrickPatch(40, 240, 90, 70);
  drawBrickPatch(340, 160, 110, 85);
  drawBrickPatch(200, 360, 75, 55);

  // Damp water streaks running from roof down the wall
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * 512;
    const len = Math.random() * 260 + 60;
    const grad = ctx.createLinearGradient(sx, 0, sx, len);
    grad.addColorStop(0, 'rgba(30, 25, 20, 0.65)');
    grad.addColorStop(0.7, 'rgba(45, 38, 28, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, 0, Math.random() * 16 + 6, len);
  }

  // Sinister deep wall cracks
  ctx.strokeStyle = '#18120c';
  ctx.lineWidth = 2;
  for (let c = 0; c < 6; c++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 380;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let seg = 0; seg < 7; seg++) {
      cx += (Math.random() - 0.48) * 45;
      cy += (Math.random() - 0.2) * 50;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Carved Dark Teak Dado / Skirting Board at bottom of wall
  ctx.fillStyle = '#26170d';
  ctx.fillRect(0, 440, 512, 72);
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 436, 512, 6); // Moulding lip
  ctx.fillStyle = '#150c07';
  ctx.fillRect(0, 508, 512, 4);

  return createTextureFromCanvas(canvas, 2, 2);
}

// 2b. Aged Maharashtrian Wada Ceiling Planks (Teak with iron nails & cobwebs)
export function createCeilingPlanksTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2e1c12';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 48;
  for (let x = 0; x < 512; x += plankW) {
    const tone = Math.floor(40 + (Math.random() - 0.5) * 15);
    ctx.fillStyle = `rgb(${tone + 8},${tone - 5},${tone - 14})`;
    ctx.fillRect(x, 0, plankW - 3, 512);

    ctx.fillStyle = '#0f0805';
    ctx.fillRect(x + plankW - 3, 0, 3, 512);

    ctx.strokeStyle = 'rgba(15, 8, 4, 0.45)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 15; g++) {
      const gx = x + Math.random() * plankW;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() - 0.5) * 6, 512);
      ctx.stroke();
    }

    for (let n = 40; n < 512; n += 120) {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(x + plankW / 2, n, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cobwebs
  ctx.strokeStyle = 'rgba(210, 210, 210, 0.15)';
  ctx.lineWidth = 1;
  for (let w = 0; w < 10; w++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 90);
    ctx.lineTo(Math.random() * 90, 0);
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas, 4, 4);
}

// 2c. Mangalore Terracotta Roof Tiles (Weathered red clay)
export function createRoofTilesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c221a';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 32;
  const tileW = 48;
  for (let y = 0; y < 512; y += rowH) {
    const rowOffset = (y / rowH) % 2 === 0 ? 0 : 24;
    for (let x = -24; x < 512; x += tileW) {
      const tileX = x + rowOffset;
      const r = Math.floor(135 + (Math.random() - 0.5) * 25);
      const g = Math.floor(55 + (Math.random() - 0.5) * 15);
      const b = Math.floor(40 + (Math.random() - 0.5) * 10);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(tileX + 2, y + 2, tileW - 4, rowH - 4);

      const grad = ctx.createLinearGradient(tileX, y, tileX + tileW, y);
      grad.addColorStop(0, 'rgba(0,0,0,0.4)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(tileX + 2, y + 2, tileW - 4, rowH - 4);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, y + rowH - 3, 512, 3);
  }

  return createTextureFromCanvas(canvas, 6, 6);
}

// 2d. Tantric Blood Writing & Handprints
export function createTantricWallWritingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // Bloody handprint
  ctx.fillStyle = 'rgba(160, 18, 18, 0.85)';
  ctx.beginPath();
  ctx.ellipse(256, 260, 35, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  [[-25, -50], [-10, -65], [10, -65], [28, -50], [42, -20]].forEach(([fx, fy]) => {
    ctx.beginPath();
    ctx.ellipse(256 + fx, 260 + fy, 8, 22, fx * 0.015, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let d = 0; d < 5; d++) {
    ctx.fillRect(240 + d * 10, 300, 3, Math.random() * 60 + 20);
  }

  ctx.font = 'bold 36px Rozha One, serif';
  ctx.fillStyle = 'rgba(180, 20, 20, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('ॐ फट् स्वाहा', 256, 120);

  ctx.font = 'bold 28px Cinzel, serif';
  ctx.fillText('HE WATCHES YOU', 256, 400);

  return createTextureFromCanvas(canvas, 1, 1);
}

// 3. Ancient Stone / Courtyard Pavers
export function createStoneTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1b19';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const shade = (Math.random() - 0.5) * 18;
      const baseVal = Math.floor(35 + shade);
      ctx.fillStyle = `rgb(${baseVal},${baseVal - 2},${baseVal - 4})`;
      ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);

      // Wet sheen / rain stain
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      for (let s = 0; s < 4; s++) {
        const sx = x + Math.random() * tileSize;
        const sy = y + Math.random() * tileSize;
        ctx.fillStyle = 'rgba(8, 10, 8, 0.4)';
        ctx.fillRect(sx, sy, Math.random() * 8, Math.random() * 8);
      }
    }
  }

  return createTextureFromCanvas(canvas, 4, 4);
}

// 4. The Cursed Kalapur Ancestor Portrait (Key mission photo)
export function createKalapurPortraitTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Antique dark sepia vignette background
  const grad = ctx.createRadialGradient(256, 300, 30, 256, 300, 320);
  grad.addColorStop(0, '#3a2e22');
  grad.addColorStop(0.7, '#1b140e');
  grad.addColorStop(1, '#080503');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 640);

  // Ornate decorative border
  ctx.strokeStyle = '#c49746';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 492, 620);
  ctx.strokeStyle = '#6e4f1a';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 464, 592);

  // Indian Royal Haveli Arch in background
  ctx.strokeStyle = 'rgba(196, 151, 70, 0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 260, 160, Math.PI, 0);
  ctx.stroke();

  // Ancestor Silhouette (Zamindar and Matriarch)
  // Male silhouette (Zamindar in traditional pagadi / turban)
  ctx.fillStyle = '#110d0a';
  // Turban
  ctx.beginPath();
  ctx.ellipse(220, 190, 48, 38, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Face
  ctx.fillStyle = '#453528';
  ctx.beginPath();
  ctx.ellipse(220, 240, 32, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Traditional coat / sherwani
  ctx.fillStyle = '#1c1611';
  ctx.beginPath();
  ctx.moveTo(170, 290);
  ctx.lineTo(270, 290);
  ctx.lineTo(290, 500);
  ctx.lineTo(150, 500);
  ctx.closePath();
  ctx.fill();

  // Matriarch figure beside him (shrouded in sari pallu)
  ctx.fillStyle = '#15100c';
  // Sari drape over head
  ctx.beginPath();
  ctx.ellipse(320, 210, 42, 46, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Face (shadowed)
  ctx.fillStyle = '#3a2b20';
  ctx.beginPath();
  ctx.ellipse(320, 255, 26, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  // Robes
  ctx.fillStyle = '#221914';
  ctx.beginPath();
  ctx.moveTo(275, 305);
  ctx.lineTo(375, 305);
  ctx.lineTo(395, 520);
  ctx.lineTo(260, 520);
  ctx.closePath();
  ctx.fill();

  // Distorted spectral eyes (the cursed secret!)
  ctx.fillStyle = '#ff3322';
  ctx.shadowColor = '#ff2200';
  ctx.shadowBlur = 12;
  // Zamindar eyes
  ctx.fillRect(210, 235, 4, 3);
  ctx.fillRect(230, 235, 4, 3);
  // Matriarch hollow gaze
  ctx.fillRect(312, 252, 4, 3);
  ctx.fillRect(328, 252, 4, 3);
  ctx.shadowBlur = 0;

  // Aged scratch marks and blood-red tantric symbol overlay
  ctx.strokeStyle = 'rgba(180, 30, 20, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Tantric binding trishul / seal
  ctx.moveTo(256, 350);
  ctx.lineTo(256, 440);
  ctx.moveTo(236, 370);
  ctx.lineTo(276, 370);
  ctx.stroke();

  // Weathering / water damage stains
  ctx.fillStyle = 'rgba(15, 10, 5, 0.45)';
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 640;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.random() * 30 + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label at base
  ctx.fillStyle = 'rgba(210, 180, 120, 0.7)';
  ctx.font = 'bold 22px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('KALAPUR GHARANA — 1924', 256, 580);

  return createTextureFromCanvas(canvas);
}

// 5. Empty Frame Mount on Exit Door (Indicates missing photo frame)
export function createEmptyFrameMountTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Dark hollow recess
  ctx.fillStyle = '#0f0a06';
  ctx.fillRect(0, 0, 512, 640);

  // Antique brass mounting brackets
  ctx.strokeStyle = '#82652e';
  ctx.lineWidth = 16;
  ctx.strokeRect(12, 12, 488, 616);

  // 4 corner brass filigree mounts
  const drawCorner = (x: number, y: number) => {
    ctx.fillStyle = '#b38e44';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#423214';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(28, 28);
  drawCorner(484, 28);
  drawCorner(28, 612);
  drawCorner(484, 612);

  // Mystic groove symbols in the wood behind the frame
  ctx.strokeStyle = 'rgba(150, 40, 20, 0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 432, 560);

  // Sanskrit / mystical binding inscription
  ctx.fillStyle = 'rgba(200, 160, 90, 0.5)';
  ctx.font = '22px serif';
  ctx.textAlign = 'center';
  ctx.fillText('[ PLACE ANCESTOR PORTRAIT HERE ]', 256, 310);
  ctx.font = '16px serif';
  ctx.fillStyle = 'rgba(220, 70, 50, 0.7)';
  ctx.fillText('THE SEAL WILL BREAK ONLY WHEN RESTORED', 256, 345);

  return createTextureFromCanvas(canvas);
}

// 6. Old Haveli Wooden Door Texture
export function createDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#26170d';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical wooden planks
  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = '#1e120a';
    ctx.fillRect(x + 4, 10, 120, 492);
    ctx.strokeStyle = '#0a0502';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 4, 10, 120, 492);

    // Iron studs / rivets (classic Indian fort / haveli style)
    for (let y = 50; y < 500; y += 90) {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(x + 64, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(x + 62, y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cross brace
  ctx.fillStyle = '#1a0e07';
  ctx.fillRect(10, 230, 492, 50);
  ctx.strokeStyle = '#050302';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 230, 492, 50);

  return createTextureFromCanvas(canvas);
}

// 7. Ghost Face Texture (unsettling, hollow eyes, cracked skin)
export function createGhostFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Ash-grey / pale spectral base
  ctx.fillStyle = '#c7c2b5';
  ctx.fillRect(0, 0, 256, 256);

  // Sunken eye sockets
  ctx.fillStyle = '#141110';
  ctx.beginPath();
  ctx.ellipse(85, 100, 26, 32, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(171, 100, 26, 32, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Pinprick glowing red demonic irises
  ctx.fillStyle = '#ff1100';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(88, 100, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(168, 100, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Agonized hollow open mouth
  ctx.fillStyle = '#080505';
  ctx.beginPath();
  ctx.ellipse(128, 180, 24, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark veins and cracked porcelain skin
  ctx.strokeStyle = 'rgba(40, 10, 15, 0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    let vx = 50 + Math.random() * 150;
    let vy = 50 + Math.random() * 150;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    for (let s = 0; s < 4; s++) {
      vx += (Math.random() - 0.5) * 25;
      vy += (Math.random() - 0.2) * 25;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas);
}

// 8. Royal Indian Vintage Kashmiri Carpet (Deep Crimson & Ochre Gold)
export function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep crimson velvet base
  ctx.fillStyle = '#3a0c0e';
  ctx.fillRect(0, 0, 512, 512);

  // Outer border with gold filigree pattern
  ctx.strokeStyle = '#9c742a';
  ctx.lineWidth = 18;
  ctx.strokeRect(16, 16, 480, 480);

  ctx.strokeStyle = '#1e0506';
  ctx.lineWidth = 6;
  ctx.strokeRect(32, 32, 448, 448);

  ctx.strokeStyle = '#c49746';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, 428, 428);

  // Center medallion (Mughal/Haveli floral star)
  const cx = 256;
  const cy = 256;
  ctx.fillStyle = '#63181b';
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d4aa55';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Medallion floral petals
  for (let p = 0; p < 12; p++) {
    const angle = (p / 12) * Math.PI * 2;
    const px = cx + Math.cos(angle) * 70;
    const py = cy + Math.sin(angle) * 70;
    ctx.fillStyle = '#825c21';
    ctx.beginPath();
    ctx.ellipse(px, py, 18, 10, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ebd08d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Corner floral spandrels
  const drawSpandrel = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#541416';
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI / 2);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.strokeStyle = '#d4aa55';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };
  drawSpandrel(46, 46, 0);
  drawSpandrel(466, 46, Math.PI / 2);
  drawSpandrel(466, 466, Math.PI);
  drawSpandrel(46, 466, -Math.PI / 2);

  // Dirt & moth-eaten spots
  for (let d = 0; d < 25; d++) {
    const dx = Math.random() * 512;
    const dy = Math.random() * 512;
    ctx.fillStyle = 'rgba(10, 4, 3, 0.4)';
    ctx.beginPath();
    ctx.arc(dx, dy, Math.random() * 14 + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  return createTextureFromCanvas(canvas, 1, 1);
}

// 9. Antique Carved Teak Pillar Texture
export function createCarvedWoodPillarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#26160b';
  ctx.fillRect(0, 0, 256, 512);

  // Fluted pillar vertical grooves
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = '#1b0f07';
    ctx.fillRect(x + 2, 0, 8, 512);
    ctx.fillStyle = '#3a2212';
    ctx.fillRect(x + 10, 0, 16, 512);
    ctx.fillStyle = '#140b05';
    ctx.fillRect(x + 26, 0, 6, 512);
  }

  // Carved horizontal bands
  for (let y = 60; y < 512; y += 120) {
    ctx.fillStyle = '#422815';
    ctx.fillRect(0, y, 256, 16);
    ctx.fillStyle = '#100703';
    ctx.fillRect(0, y + 16, 256, 4);

    // Floral rosette motifs
    for (let rx = 16; rx < 256; rx += 48) {
      ctx.fillStyle = '#825424';
      ctx.beginPath();
      ctx.arc(rx, y + 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return createTextureFromCanvas(canvas, 1, 2);
}

// 10. Rainy Haveli Window Texture
export function createWindowRainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Dark stormy glass
  ctx.fillStyle = '#080c12';
  ctx.fillRect(0, 0, 256, 384);

  // Wooden window mullions / grid
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, 256, 384);
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 384);
  ctx.moveTo(0, 192);
  ctx.lineTo(256, 192);
  ctx.stroke();

  // Arched top outline
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 120, 110, Math.PI, 0);
  ctx.stroke();

  // Streaking rain rivulets
  ctx.strokeStyle = 'rgba(160, 190, 220, 0.35)';
  ctx.lineWidth = 1.5;
  for (let r = 0; r < 24; r++) {
    let rx = Math.random() * 240 + 8;
    let ry = Math.random() * 100;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let s = 0; s < 5; s++) {
      rx += (Math.random() - 0.45) * 8;
      ry += Math.random() * 50 + 20;
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas);
}

// 11. Ancestor Gallery Wall Portrait
export function createAncestorGalleryTexture(index = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#120d09';
  ctx.fillRect(0, 0, 256, 320);

  // Ornate gilded frame
  ctx.strokeStyle = '#a68037';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 308);
  ctx.strokeStyle = '#4a3715';
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, 226, 290);

  // Dark sepia background
  const grad = ctx.createRadialGradient(128, 140, 10, 128, 140, 140);
  grad.addColorStop(0, '#2e241b');
  grad.addColorStop(1, '#080503');
  ctx.fillStyle = grad;
  ctx.fillRect(20, 20, 216, 280);

  // Head silhouette
  ctx.fillStyle = '#1c1510';
  ctx.beginPath();
  ctx.ellipse(128, 130, 36, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.moveTo(70, 220);
  ctx.lineTo(186, 220);
  ctx.lineTo(210, 290);
  ctx.lineTo(46, 290);
  ctx.closePath();
  ctx.fill();

  // Faint eerie glowing eyes
  ctx.fillStyle = index % 2 === 0 ? '#ff3311' : '#ddaa44';
  ctx.shadowColor = '#ff2200';
  ctx.shadowBlur = 8;
  ctx.fillRect(116, 125, 4, 3);
  ctx.fillRect(136, 125, 4, 3);
  ctx.shadowBlur = 0;

  return createTextureFromCanvas(canvas);
}

// 12. Tatya Vinchu Plaid Checkered Flannel Shirt Texture (Iconic Red, Blue & Yellow)
export function createTatyaPlaidShirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bright red base
  ctx.fillStyle = '#b81414';
  ctx.fillRect(0, 0, 512, 512);

  const gridSize = 64;

  // Blue wide tartan stripes
  ctx.fillStyle = '#1e3a8a';
  for (let x = 0; x < 512; x += gridSize * 2) {
    ctx.fillRect(x, 0, 16, 512);
  }
  for (let y = 0; y < 512; y += gridSize * 2) {
    ctx.fillRect(0, y, 512, 16);
  }

  // Black accent bands
  ctx.fillStyle = '#0f172a';
  for (let x = 8; x < 512; x += gridSize * 2) {
    ctx.fillRect(x, 0, 8, 512);
  }
  for (let y = 8; y < 512; y += gridSize * 2) {
    ctx.fillRect(0, y, 512, 8);
  }

  // Yellow/gold fine crossing lines (characteristic Tatya flannel)
  ctx.fillStyle = '#fbbf24';
  for (let x = 32; x < 512; x += gridSize) {
    ctx.fillRect(x, 0, 3, 512);
  }
  for (let y = 32; y < 512; y += gridSize) {
    ctx.fillRect(0, y, 512, 3);
  }

  // Subtle fabric weave texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let i = 0; i < 512; i += 4) {
    ctx.fillRect(i, 0, 1.5, 512);
  }

  return createTextureFromCanvas(canvas, 2, 2);
}

// 13. Tatya Vinchu Puppet Doll Face Texture
export function createTatyaDollFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Smooth porcelain/fabric doll skin (peachy pink)
  ctx.fillStyle = '#f5c6b3';
  ctx.fillRect(0, 0, 512, 512);

  // Soft rosy doll cheeks
  const cheekL = ctx.createRadialGradient(130, 290, 5, 130, 290, 60);
  cheekL.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
  cheekL.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = cheekL;
  ctx.beginPath();
  ctx.arc(130, 290, 60, 0, Math.PI * 2);
  ctx.fill();

  const cheekR = ctx.createRadialGradient(382, 290, 5, 382, 290, 60);
  cheekR.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
  cheekR.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = cheekR;
  ctx.beginPath();
  ctx.arc(382, 290, 60, 0, Math.PI * 2);
  ctx.fill();

  // Eyeballs (Large doll sockets with white sclera)
  const drawDollEye = (cx: number, cy: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2417';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Sinister brown/crimson iris
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Pinprick demonic pupil with red glow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2200';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Specular highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 8, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDollEye(170, 210);
  drawDollEye(342, 210);

  // Curved animated puppet eyebrows
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  // Left eyebrow (curved quizzical)
  ctx.beginPath();
  ctx.moveTo(125, 155);
  ctx.quadraticCurveTo(170, 120, 220, 150);
  ctx.stroke();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(387, 155);
  ctx.quadraticCurveTo(342, 120, 292, 150);
  ctx.stroke();

  // Distinctive pointed doll nose
  ctx.fillStyle = '#e8a995';
  ctx.beginPath();
  ctx.moveTo(256, 195);
  ctx.lineTo(275, 275);
  ctx.lineTo(237, 275);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c27d6b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sinister curved puppet smile (painted red lips)
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(175, 335);
  ctx.quadraticCurveTo(256, 395, 337, 335);
  ctx.stroke();

  // Red lip fill
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(180, 337);
  ctx.quadraticCurveTo(256, 385, 332, 337);
  ctx.quadraticCurveTo(256, 365, 180, 337);
  ctx.fill();

  // Vermilion Tantric Tilak on Doll Forehead
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.ellipse(256, 120, 10, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(256, 135, 4, 0, Math.PI * 2);
  ctx.fill();

  // Aged porcelain/wooden hairline lacquer cracks
  ctx.strokeStyle = 'rgba(75, 40, 25, 0.45)';
  ctx.lineWidth = 1.5;
  // Crack from left eye down to cheek
  ctx.beginPath();
  ctx.moveTo(170, 255);
  ctx.lineTo(155, 290);
  ctx.lineTo(162, 330);
  ctx.lineTo(145, 370);
  ctx.stroke();
  // Crack from right mouth corner
  ctx.beginPath();
  ctx.moveTo(335, 345);
  ctx.lineTo(365, 380);
  ctx.lineTo(355, 420);
  ctx.stroke();

  return createTextureFromCanvas(canvas);
}

// 14. Tatya Vinchu Wall Photo Portrait (Using real uploaded reference photo)
export function createTatyaWallPhotoTexture(): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    '/assets/aistudio/image_476c18a2.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn('Tatya image fallback to canvas');
    }
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 15. The Cursed Annabelle Porcelain Doll Portrait
export function createAnnabelleDollTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Ominous dark vignetted Victorian room background
  const bg = ctx.createRadialGradient(256, 280, 20, 256, 320, 360);
  bg.addColorStop(0, '#2d1814');
  bg.addColorStop(0.5, '#150908');
  bg.addColorStop(1, '#050202');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);

  // Distressed aged photo border
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 496, 624);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 472, 600);

  // Annabelle hair: Twin braided pigtails with red satin bows
  ctx.fillStyle = '#6b3012';
  // Left braid
  ctx.beginPath();
  ctx.ellipse(140, 260, 32, 100, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Right braid
  ctx.beginPath();
  ctx.ellipse(372, 260, 32, 100, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Red ribbon bows at the ends of the braids
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(130, 340, 16, 0, Math.PI * 2);
  ctx.arc(382, 340, 16, 0, Math.PI * 2);
  ctx.fill();

  // Bangs across forehead
  ctx.beginPath();
  ctx.arc(256, 170, 85, Math.PI, 0);
  ctx.fill();

  // Doll dress: Victorian vintage white lace gown with red waist sash
  ctx.fillStyle = '#e2ded5';
  ctx.beginPath();
  ctx.moveTo(180, 370);
  ctx.lineTo(130, 600);
  ctx.lineTo(382, 600);
  ctx.lineTo(332, 370);
  ctx.closePath();
  ctx.fill();

  // Lace ruffle collar
  ctx.fillStyle = '#cfc9be';
  ctx.beginPath();
  ctx.arc(256, 365, 55, 0, Math.PI);
  ctx.fill();

  // Crimson waist sash and rose
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(155, 480, 202, 28);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(256, 494, 18, 0, Math.PI * 2);
  ctx.fill();

  // Pale porcelain doll face
  const faceGrad = ctx.createRadialGradient(256, 260, 10, 256, 260, 95);
  faceGrad.addColorStop(0, '#fffbf5');
  faceGrad.addColorStop(0.7, '#f7eee1');
  faceGrad.addColorStop(1, '#dfcebb');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(256, 265, 78, 92, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rosy round doll cheeks
  ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
  ctx.beginPath();
  ctx.arc(195, 290, 22, 0, Math.PI * 2);
  ctx.arc(317, 290, 22, 0, Math.PI * 2);
  ctx.fill();

  // Large glossy staring blue doll eyes with dark shadows
  const drawAnnabelleEye = (x: number, y: number) => {
    // Sunken eye socket shadow
    ctx.fillStyle = 'rgba(60, 25, 25, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Sclera
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Piercing ice-blue iris
    const iris = ctx.createRadialGradient(x, y, 2, x, y, 13);
    iris.addColorStop(0, '#38bdf8');
    iris.addColorStop(0.7, '#0284c7');
    iris.addColorStop(1, '#082f49');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Dilated black pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Glint highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Thick doll eyelashes
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 2;
    for (let l = -4; l <= 4; l++) {
      ctx.beginPath();
      ctx.moveTo(x + l * 4, y - 16);
      ctx.lineTo(x + l * 5.5, y - 24);
      ctx.stroke();
    }
  };

  drawAnnabelleEye(208, 245);
  drawAnnabelleEye(304, 245);

  // Thin arched doll eyebrows
  ctx.strokeStyle = '#522915';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(208, 235, 24, Math.PI + 0.3, -0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(304, 235, 24, Math.PI + 0.3, -0.3);
  ctx.stroke();

  // Small button porcelain nose
  ctx.fillStyle = '#d4b79b';
  ctx.beginPath();
  ctx.arc(256, 280, 5, 0, Math.PI * 2);
  ctx.fill();

  // Chilling unnerving crimson painted smile
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(215, 318);
  ctx.quadraticCurveTo(256, 345, 297, 318);
  ctx.quadraticCurveTo(256, 328, 215, 318);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Porcelain cracks across cheek and forehead
  ctx.strokeStyle = 'rgba(78, 42, 28, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(225, 270);
  ctx.lineTo(210, 305);
  ctx.lineTo(218, 325);
  ctx.lineTo(200, 345);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(280, 205);
  ctx.lineTo(295, 235);
  ctx.lineTo(320, 248);
  ctx.stroke();

  // Bloody streak down left eye
  ctx.fillStyle = 'rgba(153, 27, 27, 0.75)';
  ctx.fillRect(206, 260, 3.5, 55);

  // Label at bottom
  ctx.font = 'bold 22px Cinzel, serif';
  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'center';
  ctx.fillText('ANNABELLE • 1888', 256, 615);

  return createTextureFromCanvas(canvas);
}

// 16. Cursed Doll Family Portraits (Family gatherings with Tatya & Annabelle)
export function createCursedDollFamilyTexture(index = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const bgGrad = ctx.createRadialGradient(256, 280, 30, 256, 300, 350);
  bgGrad.addColorStop(0, '#221515');
  bgGrad.addColorStop(0.6, '#110b0b');
  bgGrad.addColorStop(1, '#040202');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Antique ornate border
  ctx.strokeStyle = index % 2 === 0 ? '#b45309' : '#991b1b';
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 492, 620);
  ctx.strokeStyle = '#3f1f10';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 468, 596);

  if (index === 0) {
    // "THE CURSED FAMILY GATHERING" — Tatya Vinchu & Annabelle seated together with doll children
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText('THE DOLL FAMILY', 256, 50);

    // Antique sofa bench
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(80, 320, 352, 190);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(90, 330, 332, 70);

    // Tatya Vinchu (Left side, in red plaid shirt)
    // Blue pants
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(125, 420, 85, 110);
    // Red plaid shirt
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(115, 300, 105, 130);
    // Plaid lines
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(125, 310, 85, 110);
    // Tatya Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(165, 230, 48, 0, Math.PI * 2);
    ctx.fill();
    // Wild auburn/red hair
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(165, 205, 54, Math.PI, 0);
    ctx.fill();
    // Tatya staring eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(150, 230, 10, 0, Math.PI * 2);
    ctx.arc(180, 230, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(150, 230, 5, 0, Math.PI * 2);
    ctx.arc(180, 230, 5, 0, Math.PI * 2);
    ctx.fill();
    // Red curved smile
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(165, 250, 18, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Annabelle Doll (Right side, in vintage white dress)
    // White dress
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(295, 320, 100, 190);
    // Red sash
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(300, 410, 90, 18);
    // Head
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(345, 240, 44, 0, Math.PI * 2);
    ctx.fill();
    // Braided hair
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(345, 220, 48, Math.PI, 0);
    ctx.fill();
    // Pigtails
    ctx.fillRect(295, 240, 16, 90);
    ctx.fillRect(380, 240, 16, 90);
    // Annabelle eyes (cyan/blue)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(330, 240, 9, 0, Math.PI * 2);
    ctx.arc(360, 240, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(330, 240, 5, 0, Math.PI * 2);
    ctx.arc(360, 240, 5, 0, Math.PI * 2);
    ctx.fill();
    // Red lips
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(345, 262, 7, 0, Math.PI);
    ctx.fill();

    // Child puppet standing behind them
    ctx.fillStyle = '#475569';
    ctx.fillRect(225, 240, 62, 110);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(256, 175, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(247, 175, 4, 0, Math.PI * 2);
    ctx.arc(265, 175, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '16px Cinzel, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TATYA & ANNABELLE • UNITED IN CURSE', 256, 590);
  } else if (index === 1) {
    // "THE TWIN PORCELAIN SISTERS"
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.fillText('THE CURSED TWINS', 256, 50);

    for (const tx of [180, 332]) {
      // Twin lace dresses
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(tx - 35, 330);
      ctx.lineTo(tx - 65, 540);
      ctx.lineTo(tx + 65, 540);
      ctx.lineTo(tx + 35, 330);
      ctx.fill();

      // Blood splatters on dresses
      ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
      ctx.beginPath();
      ctx.arc(tx - 15, 420, 10, 0, Math.PI * 2);
      ctx.arc(tx + 20, 470, 14, 0, Math.PI * 2);
      ctx.fill();

      // Doll heads
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(tx, 240, 48, 0, Math.PI * 2);
      ctx.fill();

      // Black hair with bangs
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(tx, 220, 52, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(tx - 52, 220, 15, 120);
      ctx.fillRect(tx + 37, 220, 15, 120);

      // Hollow black eye sockets
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(tx - 18, 240, 11, 0, Math.PI * 2);
      ctx.arc(tx + 18, 240, 11, 0, Math.PI * 2);
      ctx.fill();

      // Bleeding eyes
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(tx - 20, 250, 4, 35);
      ctx.fillRect(tx + 16, 250, 4, 35);

      // Subtle cracked mouth
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx - 15, 270);
      ctx.lineTo(tx + 15, 270);
      ctx.stroke();
    }

    // Holding hands
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(215, 360);
    ctx.lineTo(256, 385);
    ctx.lineTo(297, 360);
    ctx.stroke();

    ctx.font = '16px Cinzel, serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText('COME PLAY WITH US FOREVER', 256, 590);
  } else {
    // "THE TANTRIC VENTRILOQUIST"
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('THE PUPPET MASTER', 256, 50);

    // Ominous hooded tantrik silhouette
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(256, 180, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(170, 240, 172, 320);

    // Glowing yellow eyes inside hood
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(236, 180, 7, 0, Math.PI * 2);
    ctx.arc(276, 180, 7, 0, Math.PI * 2);
    ctx.fill();

    // Puppet strings coming down from hands
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (const sx of [120, 160, 200, 312, 352, 392]) {
      ctx.beginPath();
      ctx.moveTo(256, 280);
      ctx.lineTo(sx, 500);
      ctx.stroke();
    }

    // Two small puppet silhouettes at bottom
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(130, 430, 50, 70);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(330, 430, 50, 70);

    ctx.font = '16px Rozha One, serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('ॐ फट् स्वाहा • MASTER OF THE CURSE', 256, 590);
  }

  // Heavy cracked varnish overlay
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < 8; c++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 640);
    ctx.lineTo(Math.random() * 512, Math.random() * 640);
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas);
}

// 18. Menacing Close-Up Portrait of Tatya Vinchu's Staring Demonic Eyes
export function createTatyaCloseupEyesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Dark blood-red and charred black vignette background
  const bg = ctx.createRadialGradient(256, 260, 20, 256, 320, 360);
  bg.addColorStop(0, '#3f0d0c');
  bg.addColorStop(0.5, '#1e0505');
  bg.addColorStop(1, '#050101');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);

  // Distressed aged photo border
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 620);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, 468, 596);

  // Wild spiky black puppet hair silhouette around the head
  ctx.fillStyle = '#0a0a0a';
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const len = 140 + Math.sin(i * 3) * 35;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * 110, 240 + Math.sin(angle) * 110);
    ctx.lineTo(256 + Math.cos(angle) * len, 240 + Math.sin(angle) * len);
    ctx.lineWidth = 9;
    ctx.stroke();
  }

  // Wooden doll head base
  const headGrad = ctx.createRadialGradient(256, 240, 30, 256, 240, 120);
  headGrad.addColorStop(0, '#fde68a');
  headGrad.addColorStop(0.6, '#f59e0b');
  headGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(256, 250, 115, 135, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red Tantrik Tilak on Forehead
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(256, 155, 12, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(256, 172, 5, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows (Extremely angled, wicked, arched puppet brows)
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(140, 195);
  ctx.quadraticCurveTo(190, 160, 240, 190);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(372, 195);
  ctx.quadraticCurveTo(322, 160, 272, 190);
  ctx.stroke();

  // Huge Glowing Demonic Doll Eyes
  const drawDemonEye = (cx: number, cy: number) => {
    // White porcelain eye socket
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 45, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Red blood vessels
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
    ctx.lineWidth = 1.5;
    for (let v = 0; v < 6; v++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const va = (v / 6) * Math.PI * 2;
      ctx.lineTo(cx + Math.cos(va) * 38, cy + Math.sin(va) * 32);
      ctx.stroke();
    }

    // Fiery Scarlet Glowing Demonic Iris
    const irisGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
    irisGrad.addColorStop(0, '#fef08a');
    irisGrad.addColorStop(0.3, '#ef4444');
    irisGrad.addColorStop(0.8, '#991b1b');
    irisGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Black Pinprick Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Red Specular Core
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 7, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDemonEye(190, 230);
  drawDemonEye(322, 230);

  // Puppet Carved Wooden Nose
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(256, 215);
  ctx.lineTo(274, 285);
  ctx.lineTo(238, 285);
  ctx.closePath();
  ctx.fill();

  // Wide Demonic Ventriloquist Puppet Grin with Razor Sharp Teeth
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(256, 335, 75, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharp Carved Wooden Teeth (Upper & Lower Rows)
  ctx.fillStyle = '#fef3c7';
  for (let t = -4; t <= 4; t++) {
    // Upper teeth
    ctx.beginPath();
    ctx.moveTo(256 + t * 14 - 5, 305);
    ctx.lineTo(256 + t * 14 + 5, 305);
    ctx.lineTo(256 + t * 14, 325);
    ctx.closePath();
    ctx.fill();
    // Lower teeth
    ctx.beginPath();
    ctx.moveTo(256 + t * 14 - 5, 365);
    ctx.lineTo(256 + t * 14 + 5, 365);
    ctx.lineTo(256 + t * 14, 345);
    ctx.closePath();
    ctx.fill();
  }

  // Vivid Scarlet Painted Doll Lips
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(170, 325);
  ctx.quadraticCurveTo(256, 400, 342, 325);
  ctx.stroke();

  // Blue Bowtie & Plaid Shirt Collar at Bottom
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.moveTo(256, 435);
  ctx.lineTo(190, 415);
  ctx.lineTo(190, 465);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(256, 435);
  ctx.lineTo(322, 415);
  ctx.lineTo(322, 465);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(256, 435, 14, 0, Math.PI * 2);
  ctx.fill();

  // Cursed Tantrik Mantra Inscription at Base
  ctx.font = 'bold 22px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText('TATYA VINCHOO', 256, 545);
  ctx.font = 'italic 16px Rozha One, serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('ॐ भग भुगे भगनी भागोदरी... ॐ फट् स्वाहा', 256, 580);

  return createTextureFromCanvas(canvas);
}

// 19. Tatya Vinchu Holding Tantrik Ritual Knife in Dark Corridor
export function createTatyaDaggerPortraitTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Moonlit eerie corridor background with candle glow
  const bg = ctx.createLinearGradient(0, 0, 512, 640);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(0.5, '#18181b');
  bg.addColorStop(1, '#27272a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);

  // Distressed golden wood frame border
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 628);

  // Moonbeam from arched window
  ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
  ctx.beginPath();
  ctx.moveTo(100, 0);
  ctx.lineTo(380, 0);
  ctx.lineTo(480, 640);
  ctx.lineTo(160, 640);
  ctx.closePath();
  ctx.fill();

  // Tatya Standing Puppet Figure (Full Body in moonlight)
  // Blue dungarees / pants
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(200, 420, 45, 140);
  ctx.fillRect(265, 420, 45, 140);
  // Black doll boots
  ctx.fillStyle = '#09090b';
  ctx.fillRect(190, 550, 55, 35);
  ctx.fillRect(265, 550, 55, 35);

  // Plaid Flannel Shirt
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(170, 270, 170, 160);
  ctx.fillStyle = '#f59e0b';
  for (let x = 180; x < 330; x += 25) {
    ctx.fillRect(x, 270, 5, 160);
  }
  for (let y = 280; y < 420; y += 25) {
    ctx.fillRect(170, y, 170, 5);
  }

  // Dungaree Straps
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(205, 270, 24, 150);
  ctx.fillRect(280, 270, 24, 150);
  // Brass Buckles
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(208, 360, 18, 14);
  ctx.fillRect(283, 360, 18, 14);

  // Tatya Head & Face
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(256, 210, 65, 0, Math.PI * 2);
  ctx.fill();

  // Messy Black Hair
  ctx.fillStyle = '#18181b';
  for (let h = 0; h < 25; h++) {
    const ha = (h / 25) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ha + Math.PI) * 60, 200 + Math.sin(ha + Math.PI) * 55);
    ctx.lineTo(256 + Math.cos(ha + Math.PI) * 95, 160 + Math.sin(ha + Math.PI) * 80);
    ctx.lineWidth = 7;
    ctx.stroke();
  }

  // Red Glowing Eyes
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(235, 205, 10, 0, Math.PI * 2);
  ctx.arc(277, 205, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(235, 205, 3, 0, Math.PI * 2);
  ctx.arc(277, 205, 3, 0, Math.PI * 2);
  ctx.fill();

  // Grinning Mouth
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 235, 25, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Right Hand Raised Raising Curved Tantrik Dagger
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(380, 270, 16, 0, Math.PI * 2);
  ctx.fill();

  // Curved Katar / Ritual Brass Dagger with Blood Dripping
  ctx.save();
  ctx.translate(385, 260);
  ctx.rotate(-0.4);
  // Brass hilt
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-8, 0, 16, 35);
  ctx.fillRect(-18, 0, 36, 8);
  // Polished Curved Blade
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.quadraticCurveTo(0, -90, 35, -120);
  ctx.quadraticCurveTo(6, -80, 6, 0);
  ctx.closePath();
  ctx.fill();
  // Blood on blade tip
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(20, -100);
  ctx.lineTo(35, -120);
  ctx.lineTo(28, -95);
  ctx.closePath();
  ctx.fill();
  // Dripping blood drops
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(36, -70, 4, 0, Math.PI * 2);
  ctx.arc(38, -40, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Inscription
  ctx.font = 'bold 18px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fca5a5';
  ctx.fillText('NIGHT OF 14TH OCTOBER', 256, 600);

  return createTextureFromCanvas(canvas);
}

// 20. 1924 Vintage Archival Police Case File Portrait of Tatya Vinchu
export function createTatyaVintageArchiveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Aged, yellowed, burned parchment background
  ctx.fillStyle = '#e7d8bf';
  ctx.fillRect(0, 0, 512, 640);

  // Burnt sepia edges
  const vignette = ctx.createRadialGradient(256, 320, 150, 256, 320, 360);
  vignette.addColorStop(0, 'rgba(120, 70, 30, 0)');
  vignette.addColorStop(0.8, 'rgba(80, 40, 15, 0.45)');
  vignette.addColorStop(1, 'rgba(40, 18, 5, 0.85)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 512, 640);

  // Crime File Header
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KALAPUR POLICE ARCHIVES • 1924', 256, 45);
  ctx.font = '14px monospace';
  ctx.fillText('CASE NO. 77/OCT • EXHIBIT A: CURSED ARTIFACT', 256, 70);

  // Center photo frame (Black & White antique photograph)
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(76, 96, 360, 420);

  // Sepia monochromatic photo of Tatya Vinchu sitting on vintage chair
  ctx.fillStyle = '#d6c4a8';
  ctx.fillRect(80, 100, 352, 412);

  // Doll sitting
  ctx.fillStyle = '#443833';
  ctx.beginPath();
  ctx.arc(256, 230, 60, 0, Math.PI * 2); // head
  ctx.fill();

  // Dark hair
  ctx.fillStyle = '#1c1917';
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI;
    ctx.fillRect(256 + Math.cos(a + Math.PI) * 55, 200 + Math.sin(a + Math.PI) * 45, 10, 25);
  }

  // Staring hollow eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(238, 225, 12, 0, Math.PI * 2);
  ctx.arc(274, 225, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(238, 225, 6, 0, Math.PI * 2);
  ctx.arc(274, 225, 6, 0, Math.PI * 2);
  ctx.fill();

  // Puppet suit & bow tie in sepia
  ctx.fillStyle = '#292524';
  ctx.fillRect(200, 290, 112, 160);
  ctx.fillStyle = '#78716c';
  ctx.fillRect(220, 290, 20, 160);
  ctx.fillRect(272, 290, 20, 160);

  // Red "CURSED / DO NOT TOUCH" Rubber Stamp
  ctx.save();
  ctx.translate(256, 460);
  ctx.rotate(-0.18);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 4;
  ctx.strokeRect(-140, -22, 280, 44);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('CURSED • DO NOT TOUCH', 0, 7);
  ctx.restore();

  // Bottom text
  ctx.font = '12px monospace';
  ctx.fillStyle = '#573318';
  ctx.fillText('PROPERTY OF BABA CHAMTARIK • OWNER DECEASED', 256, 560);
  ctx.fillText('TATYA VINCHOO SPIRIT BOUND TO DOLL VESSEL', 256, 585);

  return createTextureFromCanvas(canvas);
}

// 21. Sacred Mandir Puja Shrine Portrait of Tatya Vinchu
export function createTatyaShrineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Deep Temple Vermilion & Sandalwood Background
  const bg = ctx.createRadialGradient(256, 300, 20, 256, 320, 360);
  bg.addColorStop(0, '#781515');
  bg.addColorStop(0.6, '#3c0a0a');
  bg.addColorStop(1, '#180404');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);

  // Carved Indian Temple Arch Border in Brass
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeRect(8, 8, 496, 624);

  // Temple arch top
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(256, 120, 140, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Orange Marigold Garland (Genda phool) around portrait
  for (let m = 0; m < 26; m++) {
    const ma = (m / 26) * Math.PI * 2;
    const mx = 256 + Math.cos(ma) * 170;
    const my = 270 + Math.sin(ma) * 190;
    ctx.fillStyle = m % 2 === 0 ? '#f97316' : '#eab308';
    ctx.beginPath();
    ctx.arc(mx, my, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tatya Doll Face inside shrine
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(256, 270, 75, 0, Math.PI * 2);
  ctx.fill();

  // Messy Hair
  ctx.fillStyle = '#171717';
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI;
    ctx.fillRect(256 + Math.cos(a + Math.PI) * 70, 250 + Math.sin(a + Math.PI) * 65, 8, 30);
  }

  // Sindoor Tilak
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(251, 215, 10, 28);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(256, 235, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(232, 265, 15, 0, Math.PI * 2);
  ctx.arc(280, 265, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(232, 265, 8, 0, Math.PI * 2);
  ctx.arc(280, 265, 8, 0, Math.PI * 2);
  ctx.fill();

  // Sinister smile
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 300, 32, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Traditional Marathi Kurta / Vest
  ctx.fillStyle = '#b45309';
  ctx.fillRect(195, 345, 122, 150);

  // Rudraksha / Tantrik Mala around neck
  ctx.fillStyle = '#78350f';
  for (let r = 0; r < 14; r++) {
    const ra = (r / 14) * Math.PI;
    ctx.beginPath();
    ctx.arc(256 + Math.cos(ra) * 45, 345 + Math.sin(ra) * 20, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Golden Inscription
  ctx.font = 'bold 20px Rozha One, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('तात्या विंचू • भोंदू तांत्रिकाचा अवतार', 256, 560);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#f87171';
  ctx.fillText('OM PHAT SWAHA', 256, 590);

  return createTextureFromCanvas(canvas);
}

// 22. Authentic Indian Haveli Bathroom Tiles (Vintage distressed porcelain & mossy seams)
export function createBathroomTilesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged greenish-teal & cream checkerboard tiles
  const tileSize = 64;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#134e4a' : '#ccfbf1';
      ctx.fillRect(x, y, tileSize, tileSize);

      // Tile grout seam
      ctx.strokeStyle = '#042f2e';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, tileSize, tileSize);

      // Water scale and grime stains
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(67, 56, 202, 0.12)';
        ctx.beginPath();
        ctx.arc(x + Math.random() * tileSize, y + Math.random() * tileSize, Math.random() * 18 + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Hairline cracks on porcelain
  ctx.strokeStyle = 'rgba(4, 47, 46, 0.6)';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < 6; c++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60);
    ctx.lineTo(cx + (Math.random() - 0.5) * 110, cy + (Math.random() - 0.5) * 110);
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas, 3, 3);
}

// 23. Weathered Antique Mirror with Spectral Reflection
export function createMirrorReflectionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Silver mercurial base with heavy corner desilverization
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 320);
  grad.addColorStop(0, '#cbd5e1');
  grad.addColorStop(0.65, '#64748b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Eerie spectral face silhouette barely visible in glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.ellipse(256, 230, 70, 95, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glowing faint eye dots
  ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
  ctx.beginPath();
  ctx.arc(235, 220, 6, 0, Math.PI * 2);
  ctx.arc(277, 220, 6, 0, Math.PI * 2);
  ctx.fill();

  // Spiderweb glass impact cracks
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 2;
  const crackOriginX = 340;
  const crackOriginY = 180;
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    ctx.beginPath();
    ctx.moveTo(crackOriginX, crackOriginY);
    let rx = crackOriginX;
    let ry = crackOriginY;
    for (let seg = 0; seg < 4; seg++) {
      rx += Math.cos(ang) * 45 + (Math.random() - 0.5) * 20;
      ry += Math.sin(ang) * 45 + (Math.random() - 0.5) * 20;
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas);
}

// 24. Vintage Grandfather Clock Roman Numeral Dial
export function createClockFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged ivory porcelain dial
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 512, 512);

  // Concentric brass rings
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 256, 230, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 218, 0, Math.PI * 2);
  ctx.arc(256, 256, 170, 0, Math.PI * 2);
  ctx.stroke();

  // Roman numerals I to XII
  const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const nx = 256 + Math.cos(ang) * 194;
    const ny = 256 + Math.sin(ang) * 194;
    ctx.fillText(numerals[i], nx, ny);
  }

  // Antique mechanical ornate clock hands (frozen at 3:00 AM - the witching hour!)
  ctx.strokeStyle = '#0c0a09';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // Hour hand pointing to III (90 deg)
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(370, 256);
  ctx.stroke();
  // Minute hand pointing to XII (upwards)
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256, 95);
  ctx.stroke();

  // Brass center boss
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(256, 256, 14, 0, Math.PI * 2);
  ctx.fill();

  return createTextureFromCanvas(canvas);
}

// 25. Indian Maroon Damask Velvet Curtain Texture
export function createVelvetCurtainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep maroon velvet base
  ctx.fillStyle = '#450a0a';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical velvet fold shadows
  for (let x = 0; x < 512; x += 40) {
    const foldGrad = ctx.createLinearGradient(x, 0, x + 40, 0);
    foldGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    foldGrad.addColorStop(0.5, 'rgba(185, 28, 28, 0.35)');
    foldGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = foldGrad;
    ctx.fillRect(x, 0, 40, 512);
  }

  // Golden paisley / damask border embroidery
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  for (let y = 30; y < 512; y += 90) {
    ctx.beginPath();
    ctx.ellipse(256, y, 60, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  return createTextureFromCanvas(canvas, 1, 2);
}

// 26. Indian Stainless Steel Gas Stove Top
export function createIndianGasStoveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Brushed stainless steel metallic texture
  const steelGrad = ctx.createLinearGradient(0, 0, 512, 512);
  steelGrad.addColorStop(0, '#94a3b8');
  steelGrad.addColorStop(0.5, '#cbd5e1');
  steelGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = steelGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Cast iron black dual burner rings
  const drawBurner = (bx: number, by: number) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(bx, by, 90, 0, Math.PI * 2);
    ctx.fill();

    // Brass center flame cup
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(bx, by, 38, 0, Math.PI * 2);
    ctx.fill();

    // Pan support prongs
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    for (let p = 0; p < 4; p++) {
      const ang = (p / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(ang) * 35, by + Math.sin(ang) * 35);
      ctx.lineTo(bx + Math.cos(ang) * 105, by + Math.sin(ang) * 105);
      ctx.stroke();
    }
  };

  drawBurner(140, 256);
  drawBurner(372, 256);

  // Front red brand logo
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KALAPUR FLAME • 2-BURNER', 256, 470);

  return createTextureFromCanvas(canvas);
}

// 27. Classic Indian Red LPG Gas Cylinder Texture
export function createLpgCylinderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Industrial Indian Red enamel coat
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical cylinder weld seam
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(250, 0, 12, 512);

  // White stenciled markings
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('14.2 KG', 256, 180);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('LPG DANGER', 256, 240);
  ctx.font = 'bold 20px monospace';
  ctx.fillText('DOMESTIC TARE: 15.8', 256, 310);
  ctx.font = '16px monospace';
  ctx.fillText('CHECK SEAL ON DELIVERY', 256, 360);

  return createTextureFromCanvas(canvas);
}

// 28. Vintage 1920s Indian Zamindar Family Portraits
export function createIndianFamilyPhotoTexture(variant = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Sepia vignette backdrop
  const sepiaBg = ctx.createRadialGradient(256, 300, 40, 256, 320, 360);
  sepiaBg.addColorStop(0, '#583c27');
  sepiaBg.addColorStop(0.7, '#2f1e14');
  sepiaBg.addColorStop(1, '#0e0805');
  ctx.fillStyle = sepiaBg;
  ctx.fillRect(0, 0, 512, 640);

  // Distressed aged border
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 492, 620);

  if (variant === 0) {
    // 1920s Royal Zamindar Family Portrait
    // Patriarch (Father with Maratha Pheta / Turban)
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(200, 190, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4b996';
    ctx.beginPath();
    ctx.ellipse(200, 240, 35, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stern mustache
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(180, 255);
    ctx.quadraticCurveTo(200, 265, 220, 255);
    ctx.stroke();

    // Matriarch (Mother in Traditional Paithani Saree)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(320, 230, 40, 45, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4b996';
    ctx.beginPath();
    ctx.ellipse(320, 245, 32, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Traditional Indian Nath (Nose Ring)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(310, 255, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Standing child between them
    ctx.fillStyle = '#d4b996';
    ctx.beginPath();
    ctx.ellipse(256, 360, 25, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(235, 395, 42, 100);

    // Caption
    ctx.fillStyle = '#fed7aa';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOKHANDE ZAMINDAR KULA • 1924', 256, 595);
  } else if (variant === 1) {
    // Vintage Indian Wedding Portrait
    // Groom with Sehra / Pagdi
    ctx.fillStyle = '#d97706';
    ctx.fillRect(170, 160, 60, 40);
    ctx.fillStyle = '#e2c5a0';
    ctx.beginPath();
    ctx.arc(200, 230, 38, 0, Math.PI * 2);
    ctx.fill();

    // Bride in Wedding Saree & Gold Ornaments
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(310, 215, 48, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2c5a0';
    ctx.beginPath();
    ctx.arc(310, 240, 35, 0, Math.PI * 2);
    ctx.fill();

    // Wedding Jasmine & Marigold Garland (Varmala)
    for (let g = 0; g < 18; g++) {
      const gx = 180 + g * 8;
      const gy = 280 + Math.sin(g * 0.4) * 30;
      ctx.fillStyle = g % 2 === 0 ? '#f97316' : '#ffffff';
      ctx.beginPath();
      ctx.arc(gx, gy, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fed7aa';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHUBHA VIVAH • KALAPUR 1921', 256, 595);
  } else {
    // Stern Ancient Ancestor with Candlelight
    ctx.fillStyle = '#d4b996';
    ctx.beginPath();
    ctx.ellipse(256, 260, 55, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    // Deep sunken unblinking eyes
    ctx.fillStyle = '#0f0a07';
    ctx.beginPath();
    ctx.arc(235, 250, 10, 0, Math.PI * 2);
    ctx.arc(277, 250, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(235, 250, 3, 0, Math.PI * 2);
    ctx.arc(277, 250, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('PURVAJA SMRUTI • KALAPUR', 256, 595);
  }

  return createTextureFromCanvas(canvas);
}

// 29. Official Strange Creation Studio Memorial Brass Plaque
export function createStrangeCreationLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Polished antique bronze & brass metallic plate
  const brassGrad = ctx.createLinearGradient(0, 0, 640, 360);
  brassGrad.addColorStop(0, '#78350f');
  brassGrad.addColorStop(0.25, '#d97706');
  brassGrad.addColorStop(0.5, '#fef08a');
  brassGrad.addColorStop(0.75, '#b45309');
  brassGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = brassGrad;
  ctx.fillRect(0, 0, 640, 360);

  // Ornate filigree rim
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 620, 340);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 600, 320);

  // Embossed Inscriptions
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 34px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE CURSE OF KALAPUR', 320, 80);

  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('STRANGE CREATION', 320, 135);

  ctx.fillStyle = '#292524';
  ctx.font = 'bold 20px serif';
  ctx.fillText('DIRECTED & DEVELOPED BY', 320, 185);

  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 26px serif';
  ctx.fillText('SOHAM DNYANESHWAR LOKHANDE', 320, 230);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('YOUTUBE: MR STRANGE 1229', 320, 280);

  ctx.fillStyle = '#57534e';
  ctx.font = 'italic 15px serif';
  ctx.fillText('AN AUTHENTIC INDIAN HORROR ADVENTURE', 320, 320);

  return createTextureFromCanvas(canvas);
}

