import { BenchmarkRecord, ValidationSummary } from '../types';

export const INITIAL_BENCHMARK_RECORDS: BenchmarkRecord[] = [
  { id: 0, style: 'DRAM', trueX: 455.155, trueY: 575.269, predX: 455.500, predY: 574.500, euclideanError: 0.843, runtimeMs: 1866.6, score: 0.908, status: 'PASS', rotationDeg: -1.830, scaleRatio: 0.991, driftX: 58.525, driftY: -51.225 },
  { id: 1, style: 'DRAM', trueX: 306.786, trueY: 561.822, predX: 308.000, predY: 561.000, euclideanError: 1.467, runtimeMs: 1347.9, score: 0.922, status: 'PASS', rotationDeg: -0.857, scaleRatio: 0.962, driftX: -67.082, driftY: -16.209 },
  { id: 2, style: 'DRAM', trueX: 579.639, trueY: 566.496, predX: 579.000, predY: 566.000, euclideanError: 0.809, runtimeMs: 1018.2, score: 0.916, status: 'PASS', rotationDeg: 2.078, scaleRatio: 0.994, driftX: -36.338, driftY: 17.435 },
  { id: 3, style: 'DRAM', trueX: 589.392, trueY: 559.059, predX: 589.000, predY: 559.000, euclideanError: 0.396, runtimeMs: 1245.0, score: 0.948, status: 'PASS', rotationDeg: -2.240, scaleRatio: 1.035, driftX: -24.140, driftY: -36.070 },
  { id: 4, style: 'DRAM', trueX: 438.623, trueY: 574.998, predX: 439.500, predY: 574.500, euclideanError: 1.008, runtimeMs: 973.5, score: 0.938, status: 'PASS', rotationDeg: -2.764, scaleRatio: 1.031, driftX: -72.862, driftY: 7.662 },
  { id: 5, style: 'DRAM', trueX: 400.496, trueY: 588.624, predX: 402.000, predY: 589.000, euclideanError: 1.550, runtimeMs: 1005.2, score: 0.945, status: 'PASS', rotationDeg: -2.124, scaleRatio: 1.052, driftX: 17.128, driftY: 37.514 },
  { id: 6, style: 'DRAM', trueX: 398.872, trueY: 679.073, predX: 399.500, predY: 678.500, euclideanError: 0.851, runtimeMs: 1214.5, score: 0.916, status: 'PASS', rotationDeg: -1.462, scaleRatio: 1.041, driftX: -70.100, driftY: 36.750 },
  { id: 7, style: 'DRAM', trueX: 361.087, trueY: 742.454, predX: 361.500, predY: 741.500, euclideanError: 1.040, runtimeMs: 1951.3, score: 0.926, status: 'PASS', rotationDeg: -1.667, scaleRatio: 1.036, driftX: 7.050, driftY: 55.175 },
  { id: 8, style: 'DRAM', trueX: 357.755, trueY: 380.258, predX: 359.500, predY: 380.500, euclideanError: 1.761, runtimeMs: 1000.6, score: 0.917, status: 'PASS', rotationDeg: 1.610, scaleRatio: 0.978, driftX: -72.537, driftY: -64.409 },
  { id: 9, style: 'DRAM', trueX: 356.548, trueY: 295.599, predX: 357.000, predY: 297.000, euclideanError: 1.472, runtimeMs: 933.2, score: 0.951, status: 'PASS', rotationDeg: 1.040, scaleRatio: 0.958, driftX: 41.595, driftY: 56.630 },
  { id: 10, style: 'DRAM', trueX: 575.313, trueY: 505.878, predX: 574.500, predY: 505.500, euclideanError: 0.897, runtimeMs: 1354.0, score: 0.907, status: 'PASS', rotationDeg: 2.989, scaleRatio: 1.039, driftX: 59.366, driftY: -27.358 },
  { id: 11, style: 'DRAM', trueX: 535.524, trueY: 596.679, predX: 534.500, predY: 596.500, euclideanError: 1.040, runtimeMs: 1068.2, score: 0.917, status: 'PASS', rotationDeg: 1.588, scaleRatio: 0.994, driftX: -47.382, driftY: -68.018 },
  { id: 12, style: 'DRAM', trueX: 596.139, trueY: 391.234, predX: 596.500, predY: 392.500, euclideanError: 1.316, runtimeMs: 1216.3, score: 0.926, status: 'PASS', rotationDeg: 2.431, scaleRatio: 1.046, driftX: 46.172, driftY: 67.661 },
  { id: 13, style: 'DRAM', trueX: 381.641, trueY: 386.756, predX: 383.500, predY: 387.500, euclideanError: 2.002, runtimeMs: 1218.4, score: 0.917, status: 'PASS', rotationDeg: -0.241, scaleRatio: 1.011, driftX: -42.782, driftY: 72.375 },
  { id: 14, style: 'DRAM', trueX: 303.399, trueY: 507.975, predX: 304.500, predY: 507.500, euclideanError: 1.199, runtimeMs: 1562.4, score: 0.938, status: 'PASS', rotationDeg: -1.499, scaleRatio: 1.027, driftX: -37.268, driftY: -59.463 },
  { id: 15, style: 'FinFET', trueX: 461.025, trueY: 351.908, predX: 456.000, predY: 462.000, euclideanError: 110.207, runtimeMs: 999.0, score: 0.935, status: 'FAIL', rotationDeg: -1.081, scaleRatio: 0.965, driftX: 63.007, driftY: -73.676 },
  { id: 16, style: 'FinFET', trueX: 377.139, trueY: 488.097, predX: 378.500, predY: 489.500, euclideanError: 1.955, runtimeMs: 1000.2, score: 0.919, status: 'PASS', rotationDeg: 1.293, scaleRatio: 1.027, driftX: -64.834, driftY: -67.953 },
  { id: 17, style: 'FinFET', trueX: 697.288, trueY: 375.536, predX: 696.500, predY: 376.500, euclideanError: 1.245, runtimeMs: 1549.5, score: 0.918, status: 'PASS', rotationDeg: -0.625, scaleRatio: 1.041, driftX: -51.965, driftY: 0.054 },
  { id: 18, style: 'FinFET', trueX: 511.662, trueY: 598.517, predX: 511.000, predY: 598.000, euclideanError: 0.840, runtimeMs: 1199.4, score: 0.928, status: 'PASS', rotationDeg: -1.538, scaleRatio: 0.965, driftX: 4.648, driftY: 4.461 },
  { id: 19, style: 'FinFET', trueX: 505.455, trueY: 426.075, predX: 504.500, predY: 427.500, euclideanError: 1.715, runtimeMs: 1355.1, score: 0.909, status: 'PASS', rotationDeg: -2.275, scaleRatio: 1.050, driftX: -79.485, driftY: 0.036 },
  { id: 20, style: 'FinFET', trueX: 593.948, trueY: 475.945, predX: 593.000, predY: 477.000, euclideanError: 1.418, runtimeMs: 1502.8, score: 0.928, status: 'PASS', rotationDeg: 1.507, scaleRatio: 0.971, driftX: 31.158, driftY: -36.008 },
  { id: 21, style: 'FinFET', trueX: 292.555, trueY: 449.151, predX: 294.500, predY: 449.500, euclideanError: 1.976, runtimeMs: 998.0, score: 0.940, status: 'PASS', rotationDeg: -0.724, scaleRatio: 1.044, driftX: -5.643, driftY: -42.972 },
  { id: 22, style: 'FinFET', trueX: 423.512, trueY: 515.527, predX: 424.500, predY: 515.500, euclideanError: 0.989, runtimeMs: 1057.4, score: 0.914, status: 'PASS', rotationDeg: -0.462, scaleRatio: 1.048, driftX: -36.134, driftY: 42.981 },
  { id: 23, style: 'FinFET', trueX: 379.530, trueY: 342.949, predX: 381.000, predY: 344.000, euclideanError: 1.807, runtimeMs: 1510.1, score: 0.932, status: 'PASS', rotationDeg: -1.865, scaleRatio: 1.016, driftX: 63.589, driftY: -76.270 },
  { id: 24, style: 'FinFET', trueX: 483.379, trueY: 654.752, predX: 484.000, predY: 654.000, euclideanError: 0.975, runtimeMs: 1232.5, score: 0.935, status: 'PASS', rotationDeg: 1.724, scaleRatio: 1.038, driftX: -50.671, driftY: -35.140 },
  { id: 25, style: 'FinFET', trueX: 457.853, trueY: 690.692, predX: 459.000, predY: 690.000, euclideanError: 1.339, runtimeMs: 1231.7, score: 0.924, status: 'PASS', rotationDeg: 2.962, scaleRatio: 0.972, driftX: 41.801, driftY: -16.483 },
  { id: 26, style: 'FinFET', trueX: 305.849, trueY: 696.462, predX: 306.500, predY: 695.500, euclideanError: 1.162, runtimeMs: 1587.2, score: 0.924, status: 'PASS', rotationDeg: 1.192, scaleRatio: 0.956, driftX: -49.462, driftY: -78.575 },
  { id: 27, style: 'FinFET', trueX: 431.159, trueY: 405.982, predX: 433.000, predY: 407.000, euclideanError: 2.103, runtimeMs: 1103.6, score: 0.953, status: 'PASS', rotationDeg: 1.460, scaleRatio: 1.032, driftX: -62.227, driftY: 49.325 },
  { id: 28, style: 'FinFET', trueX: 618.254, trueY: 563.784, predX: 618.000, predY: 564.000, euclideanError: 0.333, runtimeMs: 1033.7, score: 0.920, status: 'PASS', rotationDeg: -2.745, scaleRatio: 0.970, driftX: 24.831, driftY: 40.951 },
  { id: 29, style: 'FinFET', trueX: 532.411, trueY: 703.030, predX: 533.000, predY: 702.000, euclideanError: 1.187, runtimeMs: 1481.7, score: 0.920, status: 'PASS', rotationDeg: 2.770, scaleRatio: 1.001, driftX: 78.734, driftY: -21.953 },
];

export function calculateSummary(records: BenchmarkRecord[]): ValidationSummary {
  if (records.length === 0) {
    return {
      totalEvaluated: 0,
      meanError: 0,
      medianError: 0,
      worstError: 0,
      passRate5px: 0,
      passRate4px: 0,
      passRate2px: 0,
      passRate1px: 0,
      meanRuntimeMs: 0,
      totalBenchmarkTimeSec: 0,
    };
  }

  const errors = records.map((r) => r.euclideanError).sort((a, b) => a - b);
  const runtimes = records.map((r) => r.runtimeMs);

  const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const medianError =
    errors.length % 2 === 0
      ? (errors[errors.length / 2 - 1] + errors[errors.length / 2]) / 2
      : errors[Math.floor(errors.length / 2)];
  const worstError = Math.max(...errors);

  const passRate5px = (errors.filter((e) => e <= 5.0).length / errors.length) * 100;
  const passRate4px = (errors.filter((e) => e <= 4.0).length / errors.length) * 100;
  const passRate2px = (errors.filter((e) => e <= 2.0).length / errors.length) * 100;
  const passRate1px = (errors.filter((e) => e <= 1.0).length / errors.length) * 100;

  const totalRuntimeMs = runtimes.reduce((sum, t) => sum + t, 0);
  const meanRuntimeMs = totalRuntimeMs / runtimes.length;

  return {
    totalEvaluated: records.length,
    meanError,
    medianError,
    worstError,
    passRate5px,
    passRate4px,
    passRate2px,
    passRate1px,
    meanRuntimeMs,
    totalBenchmarkTimeSec: totalRuntimeMs / 1000,
  };
}
