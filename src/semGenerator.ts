import { DeviceStyle, NoiseParameters, SemPairData, SimulationParameters } from '../types';

// Pseudo-random number generator with seed
export class SeededRNG {
  private m = 0x80000000; // 2**31
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? (seed >>> 0) % (this.m - 1) : Math.floor(Math.random() * (this.m - 1));
  }

  next(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }

  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  gaussian(mean = 0, stdev = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 === 0) u1 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdev + mean;
  }

  poisson(lambda: number): number {
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= this.next();
      } while (p > L);
      return k - 1;
    } else {
      // Gaussian approximation for large lambda
      return Math.max(0, Math.round(this.gaussian(lambda, Math.sqrt(lambda))));
    }
  }
}

/**
 * Generate synthetic semiconductor master layout (12000x12000 virtual space)
 * Returns a generator function that samples pixel intensity at (x, y).
 */
export function createSemLayoutGenerator(style: DeviceStyle, seed: number) {
  const rng = new SeededRNG(seed);

  if (style === 'DRAM') {
    const pitchX = 240;
    const pitchY = 240;
    const masterDim = 12000;
    const contacts: { cx: number; cy: number; r: number; exists: boolean }[] = [];

    for (let y = pitchY / 2; y < masterDim; y += pitchY) {
      for (let x = pitchX / 2; x < masterDim; x += pitchX) {
        const dx = Math.round(rng.uniform(-20, 20));
        const dy = Math.round(rng.uniform(-20, 20));
        const radius = Math.round(rng.uniform(55, 85));
        const exists = rng.next() > 0.10; // 10% missing contact defect
        contacts.push({ cx: x + dx, cy: y + dy, r: radius, exists });
      }
    }

    return {
      style,
      contacts,
      sampleAt: (x: number, y: number): number => {
        // Quick bounding cell check
        const cellX = Math.floor((x + 120) / pitchX) * pitchX + pitchX / 2;
        const cellY = Math.floor((y + 120) / pitchY) * pitchY + pitchY / 2;

        // Check nearest candidate contacts
        for (let dy = -pitchY; dy <= pitchY; dy += pitchY) {
          for (let dx = -pitchX; dx <= pitchX; dx += pitchX) {
            const targetX = cellX + dx;
            const targetY = cellY + dy;
            const idx = Math.floor(targetY / pitchY) * (masterDim / pitchX) + Math.floor(targetX / pitchX);
            const contact = contacts[idx];
            if (contact && contact.exists) {
              const distSq = (x - contact.cx) ** 2 + (y - contact.cy) ** 2;
              if (distSq <= contact.r ** 2) {
                return 0.8;
              }
            }
          }
        }
        return 0.0;
      },
    };
  } else {
    // FinFET Logic: vertical fins and horizontal gates
    const masterDim = 12000;
    const verticalFins: { x: number; w: number }[] = [];
    const horizontalGates: { y: number; h: number }[] = [];

    let currX = 100;
    while (currX < masterDim - 100) {
      const w = Math.round(rng.uniform(30, 90));
      verticalFins.push({ x: currX, w });
      currX += w + Math.round(rng.uniform(100, 300));
    }

    let currY = 100;
    while (currY < masterDim - 100) {
      const h = Math.round(rng.uniform(50, 120));
      horizontalGates.push({ y: currY, h });
      currY += h + Math.round(rng.uniform(150, 450));
    }

    return {
      style,
      verticalFins,
      horizontalGates,
      sampleAt: (x: number, y: number): number => {
        let intensity = 0.0;
        // Check horizontal gates
        for (const gate of horizontalGates) {
          if (y >= gate.y && y <= gate.y + gate.h) {
            intensity = Math.max(intensity, 0.9);
            break;
          }
        }
        // Check vertical fins
        for (const fin of verticalFins) {
          if (x >= fin.x && x <= fin.x + fin.w) {
            intensity = Math.max(intensity, 0.6);
            break;
          }
        }
        return intensity;
      },
    };
  }
}

/**
 * Procedurally rasterize and apply SEM edge-brightening & noise filters to 1000x1000 ImageData
 */
export function generateSemImageBuffer(
  samplePixel: (x: number, y: number) => number,
  width: number,
  height: number,
  noise: NoiseParameters,
  seed: number,
): Float32Array {
  const rng = new SeededRNG(seed);
  const raw = new Float32Array(width * height);

  // 1. Base sampling with morphological edge brightening approximation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      raw[idx] = samplePixel(x, y);
    }
  }

  // Edge brightening via simple morphological gradient / derivative
  if (noise.edgeBrighteningStrength > 0) {
    const gradient = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = raw[idx];
        const maxN = Math.max(
          raw[idx - 1],
          raw[idx + 1],
          raw[idx - width],
          raw[idx + width],
          raw[idx - width - 1],
          raw[idx - width + 1],
          raw[idx + width - 1],
          raw[idx + width + 1],
        );
        const minN = Math.min(
          raw[idx - 1],
          raw[idx + 1],
          raw[idx - width],
          raw[idx + width],
          raw[idx - width - 1],
          raw[idx - width + 1],
          raw[idx + width - 1],
          raw[idx + width + 1],
        );
        gradient[idx] = Math.max(0, maxN - minN);
      }
    }

    for (let i = 0; i < raw.length; i++) {
      raw[i] = Math.min(1.0, Math.max(0.0, raw[i] + gradient[i] * noise.edgeBrighteningStrength));
    }
  }

  // 2. Gaussian Blur (Asymmetric astigmatism)
  if (noise.gaussianBlurSigma > 0.1) {
    const sigmaX = noise.gaussianBlurSigma * rng.uniform(0.8, 1.2);
    const sigmaY = noise.gaussianBlurSigma * rng.uniform(0.8, 1.2);
    applyFastGaussianBlur2D(raw, width, height, sigmaX, sigmaY);
  }

  // 3. Poisson / Shot Noise
  if (noise.shotNoiseFactor > 0) {
    const scale = noise.shotNoiseFactor;
    for (let i = 0; i < raw.length; i++) {
      const lambda = raw[i] * scale;
      raw[i] = Math.min(1.0, Math.max(0.0, rng.poisson(lambda) / scale));
    }
  }

  // 4. Speckle Noise
  if (noise.speckleStrength > 0) {
    for (let i = 0; i < raw.length; i++) {
      const n = rng.gaussian(0, noise.speckleStrength);
      raw[i] = Math.min(1.0, Math.max(0.0, raw[i] + raw[i] * n));
    }
  }

  // 5. Charging streaks (horizontal scanlines)
  if (noise.chargingStreaks) {
    const numStreaks = Math.floor(rng.uniform(5, 15));
    for (let s = 0; s < numStreaks; s++) {
      const y = Math.floor(rng.uniform(0, height));
      const streakW = Math.floor(rng.uniform(1, 4));
      const intensity = rng.uniform(0.05, 0.25);
      for (let sy = y; sy < Math.min(height, y + streakW); sy++) {
        for (let x = 0; x < width; x++) {
          const idx = sy * width + x;
          raw[idx] = Math.min(1.0, raw[idx] + intensity);
        }
      }
    }
  }

  return raw;
}

/**
 * 2D separable Gaussian blur
 */
function applyFastGaussianBlur2D(
  buffer: Float32Array,
  width: number,
  height: number,
  sigmaX: number,
  sigmaY: number,
) {
  const kernelX = makeGaussianKernel(sigmaX);
  const kernelY = makeGaussianKernel(sigmaY);
  const temp = new Float32Array(width * height);

  const radiusX = Math.floor(kernelX.length / 2);
  const radiusY = Math.floor(kernelY.length / 2);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radiusX; k <= radiusX; k++) {
        const nx = Math.min(width - 1, Math.max(0, x + k));
        sum += buffer[rowOffset + nx] * kernelX[k + radiusX];
      }
      temp[rowOffset + x] = sum;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let k = -radiusY; k <= radiusY; k++) {
        const ny = Math.min(height - 1, Math.max(0, y + k));
        sum += temp[ny * width + x] * kernelY[k + radiusY];
      }
      buffer[y * width + x] = sum;
    }
  }
}

function makeGaussianKernel(sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 2.5));
  const size = 2 * radius + 1;
  const kernel = new Float32Array(size);
  let sum = 0;
  const twoSigmaSq = 2 * sigma * sigma;

  for (let i = -radius; i <= radius; i++) {
    const val = Math.exp(-(i * i) / twoSigmaSq);
    kernel[i + radius] = val;
    sum += val;
  }
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

/**
 * Generate full Reference (100x zoom) and Search (10x zoom) image pair
 */
export function generateSyntheticSemPair(params: SimulationParameters): SemPairData {
  const { style, seed, rotationDeg, scaleFactor, driftX, driftY, noise } = params;
  const layout = createSemLayoutGenerator(style, seed);
  const rng = new SeededRNG(seed + 1234);

  const dim = 1000;
  const X_m = rng.uniform(4000, 8000);
  const Y_m = rng.uniform(4000, 8000);

  // 1. Reference Image: 1000x1000 centered at (X_m, Y_m) (100x zoom, 1.0 master scale)
  const refStartX = X_m - dim / 2;
  const refStartY = Y_m - dim / 2;

  const sampleRef = (px: number, py: number) => {
    const mx = refStartX + px;
    const my = refStartY + py;
    return layout.sampleAt(mx, my);
  };

  const refBuffer = generateSemImageBuffer(sampleRef, dim, dim, noise.reference, seed + 101);

  // 2. Search Image: 1000x1000 at 10x zoom with rotation theta, scale ratio s, drift (dx, dy)
  const thetaRad = (rotationDeg * Math.PI) / 180.0;
  const s = scaleFactor / 10.0; // scale factor ~ 0.10
  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);

  // Ground truth center in Search image:
  // x_s = cosT * s * (X_m - 6000) - sinT * s * (Y_m - 6000) + 500 + driftX
  // y_s = sinT * s * (X_m - 6000) + cosT * s * (Y_m - 6000) + 500 + driftY
  const gtX = cosT * s * (X_m - 6000) - sinT * s * (Y_m - 6000) + 500 + driftX;
  const gtY = sinT * s * (X_m - 6000) + cosT * s * (Y_m - 6000) + 500 + driftY;

  // Inverse mapping to sample master layout for Search Image:
  // [ px - (500 + dx) ] = s * R * [ mx - 6000 ]
  // [ mx - 6000 ] = (1/s) * R^(-1) * [ px - (500 + dx) ]
  const invS = 1.0 / s;
  const sampleSearch = (px: number, py: number) => {
    const relX = px - 500 - driftX;
    const relY = py - 500 - driftY;
    const rotRelX = cosT * relX + sinT * relY;
    const rotRelY = -sinT * relX + cosT * relY;
    const mx = rotRelX * invS + 6000;
    const my = rotRelY * invS + 6000;
    return layout.sampleAt(mx, my);
  };

  const searchBuffer = generateSemImageBuffer(sampleSearch, dim, dim, noise.search, seed + 202);

  // Convert to Data URLs for display in Canvas/Image
  const refDataUrl = bufferToDataUrl(refBuffer, dim, dim);
  const searchDataUrl = bufferToDataUrl(searchBuffer, dim, dim);

  return {
    id: seed,
    style,
    seed,
    rotationDeg,
    scaleRatio: 1.0 / scaleFactor,
    driftX,
    driftY,
    gtX,
    gtY,
    refImageDataUrl: refDataUrl,
    searchImageDataUrl: searchDataUrl,
    width: dim,
    height: dim,
  };
}

export function bufferToDataUrl(buffer: Float32Array, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(width, height);
  const d = imgData.data;

  for (let i = 0; i < buffer.length; i++) {
    const val = Math.min(255, Math.max(0, Math.round(buffer[i] * 255)));
    const idx = i * 4;
    d[idx] = val;
    d[idx + 1] = val;
    d[idx + 2] = val;
    d[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
