import { LocalizationResult } from '../types';

/**
 * Sub-pixel Pattern Localization Inference Engine
 * Implements scale & rotation invariant Normalized Cross-Correlation (NCC)
 * with center-bias decision rule and quadratic sub-pixel interpolation.
 */

export interface LocalizerConfig {
  scales: number[];
  rotations: number[];
  searchBlur: number;
  templateBlur: number;
  candidateThresholdRatio: number;
  centerBiasScoreRatio: number;
  nominalCenter: [number, number];
}

export const DEFAULT_LOCALIZER_CONFIG: LocalizerConfig = {
  scales: [0.09, 0.095, 0.10, 0.105, 0.11],
  rotations: [-3.0, -1.5, 0.0, 1.5, 3.0],
  searchBlur: 3,
  templateBlur: 3,
  candidateThresholdRatio: 0.90,
  centerBiasScoreRatio: 0.95,
  nominalCenter: [500.0, 500.0],
};

interface Candidate {
  score: number;
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
  corrMap?: Float32Array;
  mapW?: number;
  mapH?: number;
  localX?: number;
  localY?: number;
  wScaled?: number;
  hScaled?: number;
}

/**
 * Extract ImageData from an image or data URL
 */
export async function loadImageData(src: string): Promise<{ data: Float32Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context error'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const grayscale = new Float32Array(img.width * img.height);
      for (let i = 0; i < grayscale.length; i++) {
        grayscale[i] = imgData.data[i * 4] / 255.0;
      }
      resolve({ data: grayscale, width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Perform sub-pixel pattern localization
 */
export async function locatePatternAsync(
  refSrc: string,
  searchSrc: string,
  config: LocalizerConfig = DEFAULT_LOCALIZER_CONFIG,
  groundTruth?: { x: number; y: number },
): Promise<LocalizationResult> {
  const startTime = performance.now();

  const [refImg, searchImg] = await Promise.all([
    loadImageData(refSrc),
    loadImageData(searchSrc),
  ]);

  const searchW = searchImg.width;
  const searchH = searchImg.height;
  const refW = refImg.width;
  const refH = refImg.height;

  // Pre-filter search image with Gaussian blur (3x3)
  const searchFiltered = boxBlurGrayscale(searchImg.data, searchW, searchH, config.searchBlur);

  const candidates: Candidate[] = [];
  let bestCandidate: Candidate | null = null;
  let bestScore = -1;

  for (const scale of config.scales) {
    const wScaled = Math.round(refW * scale);
    const hScaled = Math.round(refH * scale);
    if (wScaled <= 0 || hScaled <= 0) continue;

    // Rescale reference template
    const refScaled = resizeBilinear(refImg.data, refW, refH, wScaled, hScaled);
    const refScaledFiltered = boxBlurGrayscale(refScaled, wScaled, hScaled, config.templateBlur);

    for (const angle of config.rotations) {
      let template = refScaledFiltered;
      if (Math.abs(angle) > 0.01) {
        template = rotateGrayscale(refScaledFiltered, wScaled, hScaled, angle);
      }

      // Normalized Cross-Correlation
      const { map, mapW, mapH, maxVal, maxX, maxY } = matchTemplateNCC(
        searchFiltered,
        searchW,
        searchH,
        template,
        wScaled,
        hScaled,
      );

      const threshold = Math.max(0.5, maxVal * config.candidateThresholdRatio);

      // Collect local peaks above threshold
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          const score = map[y * mapW + x];
          if (score >= threshold) {
            // Is it a local peak?
            const isPeak =
              (x === 0 || score >= map[y * mapW + x - 1]) &&
              (x === mapW - 1 || score >= map[y * mapW + x + 1]) &&
              (y === 0 || score >= map[(y - 1) * mapW + x]) &&
              (y === mapH - 1 || score >= map[(y + 1) * mapW + x]);

            if (isPeak) {
              const cx = x + wScaled / 2.0;
              const cy = y + hScaled / 2.0;
              candidates.push({
                score,
                cx,
                cy,
                scale,
                rotation: angle,
                corrMap: map,
                mapW,
                mapH,
                localX: x,
                localY: y,
                wScaled,
                hScaled,
              });
            }
          }
        }
      }

      if (maxVal > bestScore) {
        bestScore = maxVal;
      }
    }
  }

  if (candidates.length === 0) {
    const runtimeMs = performance.now() - startTime;
    return {
      predX: 500.0,
      predY: 500.0,
      score: 0.0,
      runtimeMs,
      bestScale: 0.10,
      bestRotation: 0.0,
      candidatesCount: 0,
      euclideanError: groundTruth ? Math.hypot(500.0 - groundTruth.x, 500.0 - groundTruth.y) : undefined,
    };
  }

  // Sort candidates descending by score
  candidates.sort((a, b) => b.score - a.score);
  const peakScore = candidates[0].score;

  // Center-bias rule: Top candidates within 5% of peak score, closest to stage center (500, 500)
  const topCandidates = candidates.filter((c) => c.score >= peakScore * config.centerBiasScoreRatio);
  let minDist = Infinity;
  const [nomX, nomY] = config.nominalCenter;

  for (const cand of topCandidates) {
    const dist = Math.hypot(cand.cx - nomX, cand.cy - nomY);
    if (dist < minDist) {
      minDist = dist;
      bestCandidate = cand;
    }
  }

  if (!bestCandidate) {
    bestCandidate = candidates[0];
  }

  // Quadratic sub-pixel peak refinement
  let subX = bestCandidate.cx;
  let subY = bestCandidate.cy;

  if (bestCandidate.corrMap && bestCandidate.mapW && bestCandidate.mapH && bestCandidate.localX !== undefined && bestCandidate.localY !== undefined) {
    const { corrMap, mapW, mapH, localX, localY, wScaled = 100, hScaled = 100 } = bestCandidate;
    if (localX > 0 && localX < mapW - 1 && localY > 0 && localY < mapH - 1) {
      const idx = localY * mapW + localX;
      const c = corrMap[idx];
      const l = corrMap[idx - 1];
      const r = corrMap[idx + 1];
      const u = corrMap[(localY - 1) * mapW + localX];
      const d = corrMap[(localY + 1) * mapW + localX];

      // Quadratic peak offset dx = (l - r) / (2 * (l - 2*c + r))
      const denomX = 2 * (l - 2 * c + r);
      const deltaX = Math.abs(denomX) > 1e-5 ? (l - r) / denomX : 0;

      const denomY = 2 * (u - 2 * c + d);
      const deltaY = Math.abs(denomY) > 1e-5 ? (u - d) / denomY : 0;

      // Bound subpixel shift to [-0.5, 0.5]
      const clampedDeltaX = Math.max(-0.5, Math.min(0.5, deltaX));
      const clampedDeltaY = Math.max(-0.5, Math.min(0.5, deltaY));

      subX = localX + clampedDeltaX + wScaled / 2.0;
      subY = localY + clampedDeltaY + hScaled / 2.0;
    }
  }

  const runtimeMs = performance.now() - startTime;
  const euclideanError = groundTruth ? Math.hypot(subX - groundTruth.x, subY - groundTruth.y) : undefined;

  const wScaled = bestCandidate.wScaled || 100;
  const hScaled = bestCandidate.hScaled || 100;

  // Generate correlation heatmap data URL
  let heatmapDataUrl: string | undefined;
  if (bestCandidate.corrMap && bestCandidate.mapW && bestCandidate.mapH) {
    heatmapDataUrl = generateCorrelationHeatmap(
      bestCandidate.corrMap,
      bestCandidate.mapW,
      bestCandidate.mapH,
      searchW,
      searchH,
    );
  }

  return {
    predX: Number(subX.toFixed(3)),
    predY: Number(subY.toFixed(3)),
    score: Number(bestCandidate.score.toFixed(3)),
    runtimeMs: Number(runtimeMs.toFixed(1)),
    bestScale: bestCandidate.scale,
    bestRotation: bestCandidate.rotation,
    candidatesCount: candidates.length,
    euclideanError: euclideanError !== undefined ? Number(euclideanError.toFixed(3)) : undefined,
    passed5px: euclideanError !== undefined ? euclideanError <= 5.0 : undefined,
    passed4px: euclideanError !== undefined ? euclideanError <= 4.0 : undefined,
    passed2px: euclideanError !== undefined ? euclideanError <= 2.0 : undefined,
    passed1px: euclideanError !== undefined ? euclideanError <= 1.0 : undefined,
    heatmapDataUrl,
    matchBoundingBox: {
      x: subX - wScaled / 2.0,
      y: subY - hScaled / 2.0,
      width: wScaled,
      height: hScaled,
      rotation: bestCandidate.rotation,
    },
  };
}

/**
 * Normalized Cross Correlation (TM_CCOEFF_NORMED)
 */
function matchTemplateNCC(
  search: Float32Array,
  sW: number,
  sH: number,
  template: Float32Array,
  tW: number,
  tH: number,
): { map: Float32Array; mapW: number; mapH: number; maxVal: number; maxX: number; maxY: number } {
  const mapW = sW - tW + 1;
  const mapH = sH - tH + 1;
  const map = new Float32Array(mapW * mapH);

  if (mapW <= 0 || mapH <= 0) {
    return { map, mapW: 0, mapH: 0, maxVal: 0, maxX: 0, maxY: 0 };
  }

  // Pre-calculate template mean and variance
  let tSum = 0;
  const tCount = tW * tH;
  for (let i = 0; i < tCount; i++) {
    tSum += template[i];
  }
  const tMean = tSum / tCount;

  let tVar = 0;
  const tDiff = new Float32Array(tCount);
  for (let i = 0; i < tCount; i++) {
    const diff = template[i] - tMean;
    tDiff[i] = diff;
    tVar += diff * diff;
  }
  const tStd = Math.sqrt(tVar) || 1e-6;

  let maxVal = -1;
  let maxX = 0;
  let maxY = 0;

  // Step sampling for speed if large, then refine
  const step = 2; // 2px step for high FPS, covers the full space reliably
  for (let y = 0; y < mapH; y += step) {
    for (let x = 0; x < mapW; x += step) {
      let sSum = 0;
      for (let ty = 0; ty < tH; ty++) {
        const sRowOffset = (y + ty) * sW + x;
        for (let tx = 0; tx < tW; tx++) {
          sSum += search[sRowOffset + tx];
        }
      }
      const sMean = sSum / tCount;

      let sVar = 0;
      let cross = 0;
      for (let ty = 0; ty < tH; ty++) {
        const sRowOffset = (y + ty) * sW + x;
        const tRowOffset = ty * tW;
        for (let tx = 0; tx < tW; tx++) {
          const sDiff = search[sRowOffset + tx] - sMean;
          sVar += sDiff * sDiff;
          cross += sDiff * tDiff[tRowOffset + tx];
        }
      }

      const sStd = Math.sqrt(sVar) || 1e-6;
      const score = Math.max(0, cross / (tStd * sStd));
      map[y * mapW + x] = score;

      if (score > maxVal) {
        maxVal = score;
        maxX = x;
        maxY = y;
      }
    }
  }

  // Refine locally around best coarse peak with 1px step
  const refineRadius = 4;
  const rMinX = Math.max(0, maxX - refineRadius);
  const rMaxX = Math.min(mapW - 1, maxX + refineRadius);
  const rMinY = Math.max(0, maxY - refineRadius);
  const rMaxY = Math.min(mapH - 1, maxY + refineRadius);

  for (let y = rMinY; y <= rMaxY; y++) {
    for (let x = rMinX; x <= rMaxX; x++) {
      if (map[y * mapW + x] > 0 && (x % step === 0 && y % step === 0)) continue;

      let sSum = 0;
      for (let ty = 0; ty < tH; ty++) {
        const sRowOffset = (y + ty) * sW + x;
        for (let tx = 0; tx < tW; tx++) {
          sSum += search[sRowOffset + tx];
        }
      }
      const sMean = sSum / tCount;

      let sVar = 0;
      let cross = 0;
      for (let ty = 0; ty < tH; ty++) {
        const sRowOffset = (y + ty) * sW + x;
        const tRowOffset = ty * tW;
        for (let tx = 0; tx < tW; tx++) {
          const sDiff = search[sRowOffset + tx] - sMean;
          sVar += sDiff * sDiff;
          cross += sDiff * tDiff[tRowOffset + tx];
        }
      }

      const sStd = Math.sqrt(sVar) || 1e-6;
      const score = Math.max(0, cross / (tStd * sStd));
      map[y * mapW + x] = score;

      if (score > maxVal) {
        maxVal = score;
        maxX = x;
        maxY = y;
      }
    }
  }

  return { map, mapW, mapH, maxVal, maxX, maxY };
}

function resizeBilinear(
  src: Float32Array,
  sW: number,
  sH: number,
  dW: number,
  dH: number,
): Float32Array {
  const dst = new Float32Array(dW * dH);
  const scaleX = sW / dW;
  const scaleY = sH / dH;

  for (let y = 0; y < dH; y++) {
    const srcY = y * scaleY;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(sH - 1, y0 + 1);
    const dy = srcY - y0;

    for (let x = 0; x < dW; x++) {
      const srcX = x * scaleX;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(sW - 1, x0 + 1);
      const dx = srcX - x0;

      const p00 = src[y0 * sW + x0];
      const p10 = src[y0 * sW + x1];
      const p01 = src[y1 * sW + x0];
      const p11 = src[y1 * sW + x1];

      const top = p00 * (1 - dx) + p10 * dx;
      const bot = p01 * (1 - dx) + p11 * dx;
      dst[y * dW + x] = top * (1 - dy) + bot * dy;
    }
  }

  return dst;
}

function rotateGrayscale(
  src: Float32Array,
  w: number,
  h: number,
  angleDeg: number,
): Float32Array {
  const dst = new Float32Array(w * h);
  const rad = (angleDeg * Math.PI) / 180.0;
  const cosA = Math.cos(-rad);
  const sinA = Math.sin(-rad);
  const cx = w / 2;
  const cy = h / 2;

  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const sx = cx + (dx * cosA - dy * sinA);
      const sy = cy + (dx * sinA + dy * cosA);

      if (sx >= 0 && sx < w - 1 && sy >= 0 && sy < h - 1) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;

        const p00 = src[y0 * w + x0];
        const p10 = src[y0 * w + x0 + 1];
        const p01 = src[(y0 + 1) * w + x0];
        const p11 = src[(y0 + 1) * w + x0 + 1];

        dst[y * w + x] = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
      } else {
        // Border replicate
        const clampX = Math.min(w - 1, Math.max(0, Math.round(sx)));
        const clampY = Math.min(h - 1, Math.max(0, Math.round(sy)));
        dst[y * w + x] = src[clampY * w + clampX];
      }
    }
  }

  return dst;
}

function boxBlurGrayscale(src: Float32Array, w: number, h: number, kernelSize = 3): Float32Array {
  if (kernelSize <= 1) return new Float32Array(src);
  const dst = new Float32Array(w * h);
  const r = Math.floor(kernelSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < h) {
          const rowOffset = ny * w;
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < w) {
              sum += src[rowOffset + nx];
              count++;
            }
          }
        }
      }
      dst[y * w + x] = sum / count;
    }
  }
  return dst;
}

function generateCorrelationHeatmap(
  map: Float32Array,
  mapW: number,
  mapH: number,
  canvasW: number,
  canvasH: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(canvasW, canvasH);
  const d = imgData.data;

  const scaleX = mapW / canvasW;
  const scaleY = mapH / canvasH;

  for (let y = 0; y < canvasH; y++) {
    const my = Math.min(mapH - 1, Math.floor(y * scaleY));
    const rowOffset = my * mapW;
    for (let x = 0; x < canvasW; x++) {
      const mx = Math.min(mapW - 1, Math.floor(x * scaleX));
      const score = map[rowOffset + mx]; // 0.0 to 1.0

      const idx = (y * canvasW + x) * 4;
      if (score < 0.5) {
        d[idx + 3] = 0; // Transparent
      } else {
        // Jet-like colormap from cyan/yellow to intense red
        const norm = (score - 0.5) / 0.5; // 0.0 to 1.0
        d[idx] = Math.round(255 * Math.min(1.0, norm * 1.8)); // R
        d[idx + 1] = Math.round(255 * (1.0 - Math.abs(norm - 0.5) * 2)); // G
        d[idx + 2] = Math.round(255 * (1.0 - norm)); // B
        d[idx + 3] = Math.round(180 * norm); // Alpha
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
