export type DeviceStyle = 'DRAM' | 'FinFET';

export interface NoiseParameters {
  shotNoiseFactor: number; // 0 = off, 40-100 typical
  gaussianBlurSigma: number; // 0.5 - 2.5
  speckleStrength: number; // 0.0 - 0.3
  chargingStreaks: boolean;
  edgeBrighteningStrength: number; // 1.0 - 2.0
}

export interface SimulationParameters {
  style: DeviceStyle;
  seed: number;
  rotationDeg: number; // -3.0 to +3.0
  scaleFactor: number; // 0.95 to 1.05 (s = scaleFactor / 10.0 => 0.095 to 0.105)
  driftX: number; // -80 to +80
  driftY: number; // -80 to +80
  noise: {
    reference: NoiseParameters;
    search: NoiseParameters;
  };
}

export interface SemPairData {
  id: number | string;
  style: DeviceStyle;
  seed: number;
  rotationDeg: number;
  scaleRatio: number; // 1.0 / scaleFactor
  driftX: number;
  driftY: number;
  gtX: number;
  gtY: number;
  refImageDataUrl: string;
  searchImageDataUrl: string;
  refRawData?: Uint8ClampedArray;
  searchRawData?: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface LocalizationResult {
  predX: number;
  predY: number;
  score: number;
  runtimeMs: number;
  bestScale: number;
  bestRotation: number;
  candidatesCount: number;
  euclideanError?: number;
  passed5px?: boolean;
  passed4px?: boolean;
  passed2px?: boolean;
  passed1px?: boolean;
  heatmapDataUrl?: string;
  matchBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
}

export interface BenchmarkRecord {
  id: number;
  style: DeviceStyle;
  trueX: number;
  trueY: number;
  predX: number;
  predY: number;
  euclideanError: number;
  runtimeMs: number;
  score: number;
  status: 'PASS' | 'FAIL';
  rotationDeg?: number;
  scaleRatio?: number;
  driftX?: number;
  driftY?: number;
}

export interface ValidationSummary {
  totalEvaluated: number;
  meanError: number;
  medianError: number;
  worstError: number;
  passRate5px: number;
  passRate4px: number;
  passRate2px: number;
  passRate1px: number;
  meanRuntimeMs: number;
  totalBenchmarkTimeSec: number;
}
