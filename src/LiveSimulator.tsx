import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Zap,
  Crosshair,
  Sliders,
  Sparkles,
  Layers,
  Info,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import { DeviceStyle, LocalizationResult, SemPairData, SimulationParameters } from '../types';
import { generateSyntheticSemPair } from '../engine/semGenerator';
import { locatePatternAsync } from '../engine/semLocalizer';

export const LiveSimulator: React.FC = () => {
  const [style, setStyle] = useState<DeviceStyle>('DRAM');
  const [seed, setSeed] = useState<number>(1042);
  const [rotationDeg, setRotationDeg] = useState<number>(-1.5);
  const [scaleFactor, setScaleFactor] = useState<number>(1.02);
  const [driftX, setDriftX] = useState<number>(35.0);
  const [driftY, setDriftY] = useState<number>(-45.0);

  // Noise controls
  const [shotNoiseFactor, setShotNoiseFactor] = useState<number>(40);
  const [gaussianBlurSigma, setGaussianBlurSigma] = useState<number>(1.2);
  const [speckleStrength, setSpeckleStrength] = useState<number>(0.12);
  const [chargingStreaks, setChargingStreaks] = useState<boolean>(true);
  const [edgeBrightening, setEdgeBrightening] = useState<number>(1.5);

  // Simulation and Inference state
  const [pairData, setPairData] = useState<SemPairData | null>(null);
  const [inferenceResult, setInferenceResult] = useState<LocalizationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  // View modes
  const [viewOverlay, setViewOverlay] = useState<'standard' | 'heatmap' | 'blend'>('standard');
  const [blendAlpha, setBlendAlpha] = useState<number>(0.5);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [showGroundTruth, setShowGroundTruth] = useState<boolean>(true);
  const [showPrediction, setShowPrediction] = useState<boolean>(true);

  // Canvas ref for overlay blend
  const blendCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate pair function
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const params: SimulationParameters = {
        style,
        seed,
        rotationDeg,
        scaleFactor,
        driftX,
        driftY,
        noise: {
          reference: {
            shotNoiseFactor: 100,
            gaussianBlurSigma: 0.8,
            speckleStrength: 0.05,
            chargingStreaks: false,
            edgeBrighteningStrength: edgeBrightening,
          },
          search: {
            shotNoiseFactor,
            gaussianBlurSigma,
            speckleStrength,
            chargingStreaks,
            edgeBrighteningStrength: edgeBrightening,
          },
        },
      };

      const pair = generateSyntheticSemPair(params);
      setPairData(pair);
      setInferenceResult(null);
      setIsGenerating(false);
    }, 50);
  };

  // Run Sub-Pixel Inference
  const handleRunInference = async () => {
    if (!pairData) return;
    setIsInferring(true);
    try {
      const res = await locatePatternAsync(
        pairData.refImageDataUrl,
        pairData.searchImageDataUrl,
        undefined,
        { x: pairData.gtX, y: pairData.gtY },
      );
      setInferenceResult(res);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  // Initial generation
  useEffect(() => {
    handleGenerate();
  }, []);

  // Update blend canvas when view is 'blend'
  useEffect(() => {
    if (viewOverlay === 'blend' && pairData && blendCanvasRef.current) {
      const canvas = blendCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const searchImg = new Image();
      searchImg.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        ctx.clearRect(0, 0, 500, 500);

        // Draw Search image (base)
        ctx.globalAlpha = 1.0;
        ctx.drawImage(searchImg, 0, 0, 500, 500);

        if (inferenceResult && inferenceResult.matchBoundingBox) {
          const refImg = new Image();
          refImg.onload = () => {
            ctx.save();
            ctx.globalAlpha = blendAlpha;
            // Draw transformed reference onto predicted position
            const bbox = inferenceResult.matchBoundingBox!;
            const cx = (bbox.x + bbox.width / 2) / 2;
            const cy = (bbox.y + bbox.height / 2) / 2;
            const w = bbox.width / 2;
            const h = bbox.height / 2;

            ctx.translate(cx, cy);
            ctx.rotate((bbox.rotation * Math.PI) / 180.0);
            ctx.drawImage(refImg, -w / 2, -h / 2, w, h);
            ctx.restore();
          };
          refImg.src = pairData.refImageDataUrl;
        }
      };
      searchImg.src = pairData.searchImageDataUrl;
    }
  }, [viewOverlay, blendAlpha, pairData, inferenceResult]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-cyan-400" />
              Sub-Pixel Pattern Localization Inference Sandbox
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Test multi-scale (9:1–11:1), multi-rotation (±3°), and center-bias pattern matching against synthetic SEM images with severe noise degradation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-randomize-seed"
              onClick={() => {
                setSeed(Math.floor(Math.random() * 9000 + 1000));
                setRotationDeg(Number((Math.random() * 6 - 3).toFixed(2)));
                setScaleFactor(Number((Math.random() * 0.10 + 0.95).toFixed(3)));
                setDriftX(Number((Math.random() * 160 - 80).toFixed(1)));
                setDriftY(Number((Math.random() * 160 - 80).toFixed(1)));
                setTimeout(handleGenerate, 10);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Randomize Case</span>
            </button>

            <button
              id="btn-generate-pair"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Pair</span>
            </button>

            <button
              id="btn-run-subpixel-inference"
              onClick={handleRunInference}
              disabled={isInferring || !pairData}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isInferring ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current text-yellow-300" />
                  <span>Execute Inference</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter & Noise Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Device & Transformation Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Physical & Mechatronic Transforms
            </h3>

            {/* Structure Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Semiconductor Architecture</span>
                <span className="text-cyan-400 font-mono">{style}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="style-dram"
                  onClick={() => setStyle('DRAM')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    style === 'DRAM'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  DRAM Arrays (Contacts)
                </button>
                <button
                  id="style-finfet"
                  onClick={() => setStyle('FinFET')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    style === 'FinFET'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  FinFET Logic (Fins/Gates)
                </button>
              </div>
            </div>

            {/* Seed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Layout Seed</span>
                <span className="text-slate-400 font-mono">#{seed}</span>
              </div>
              <input
                id="input-seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Rotation Deg */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Orientation Offset (θ)</span>
                <span className="text-cyan-400 font-mono">{rotationDeg.toFixed(2)}°</span>
              </div>
              <input
                id="slider-rotation"
                type="range"
                min="-3.0"
                max="3.0"
                step="0.1"
                value={rotationDeg}
                onChange={(e) => setRotationDeg(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-3.00°</span>
                <span>0.00°</span>
                <span>+3.00°</span>
              </div>
            </div>

            {/* Scale Factor */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Magnification Scale Ratio</span>
                <span className="text-cyan-400 font-mono">{(1.0 / scaleFactor).toFixed(3)}x</span>
              </div>
              <input
                id="slider-scale"
                type="range"
                min="0.95"
                max="1.05"
                step="0.005"
                value={scaleFactor}
                onChange={(e) => setScaleFactor(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.950x (10.5:1)</span>
                <span>1.000x (10:1)</span>
                <span>1.050x (9.5:1)</span>
              </div>
            </div>

            {/* Drift Translation dx & dy */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Drift ΔX</span>
                  <span className="text-cyan-400 font-mono">{driftX.toFixed(1)} px</span>
                </div>
                <input
                  id="slider-drift-x"
                  type="range"
                  min="-80"
                  max="80"
                  step="1"
                  value={driftX}
                  onChange={(e) => setDriftX(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Drift ΔY</span>
                  <span className="text-cyan-400 font-mono">{driftY.toFixed(1)} px</span>
                </div>
                <input
                  id="slider-drift-y"
                  type="range"
                  min="-80"
                  max="80"
                  step="1"
                  value={driftY}
                  onChange={(e) => setDriftY(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SEM Noise Model Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              SEM Degradation & Noise Parameters
            </h3>

            {/* Poisson Shot Noise */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Poisson Shot Noise Factor</span>
                <span className="text-amber-400 font-mono">{shotNoiseFactor}</span>
              </div>
              <input
                id="slider-shot-noise"
                type="range"
                min="10"
                max="100"
                step="5"
                value={shotNoiseFactor}
                onChange={(e) => setShotNoiseFactor(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 (Heavy Noise)</span>
                <span>50</span>
                <span>100 (Clean)</span>
              </div>
            </div>

            {/* Gaussian Blur / Astigmatism */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Astigmatism / Gaussian Blur (σ)</span>
                <span className="text-amber-400 font-mono">{gaussianBlurSigma.toFixed(1)}</span>
              </div>
              <input
                id="slider-gaussian-blur"
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={gaussianBlurSigma}
                onChange={(e) => setGaussianBlurSigma(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Speckle Noise */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Speckle Noise Strength</span>
                <span className="text-amber-400 font-mono">{(speckleStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                id="slider-speckle"
                type="range"
                min="0.0"
                max="0.30"
                step="0.01"
                value={speckleStrength}
                onChange={(e) => setSpeckleStrength(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Edge Brightening */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Secondary Emission Edge-Brightening</span>
                <span className="text-amber-400 font-mono">{edgeBrightening.toFixed(1)}x</span>
              </div>
              <input
                id="slider-edge-brightening"
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={edgeBrightening}
                onChange={(e) => setEdgeBrightening(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Charging Streaks Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Dielectric Charging Scanlines</span>
                <span className="text-[11px] text-slate-400">Horizontal electron accumulation streaks</span>
              </div>
              <button
                id="toggle-charging-streaks"
                onClick={() => setChargingStreaks(!chargingStreaks)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  chargingStreaks ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    chargingStreaks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Dual-Canvas & Metrics (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Inference Result KPI Card */}
          {inferenceResult ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      inferenceResult.passed5px
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {inferenceResult.passed5px ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">
                        {inferenceResult.passed5px ? 'LOCALIZATION PASSED' : 'LOCALIZATION FAILED'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inferenceResult.passed1px
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : inferenceResult.passed2px
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                            : inferenceResult.passed5px
                            ? 'bg-blue-950 text-blue-400 border border-blue-700'
                            : 'bg-rose-950 text-rose-400 border border-rose-700'
                        }`}
                      >
                        {inferenceResult.passed1px
                          ? '< 1.0 px (Sub-Pixel Elite)'
                          : inferenceResult.passed2px
                          ? '< 2.0 px (High Precision)'
                          : inferenceResult.passed5px
                          ? '< 5.0 px (Standard Pass)'
                          : '> 5.0 px (Out of Bound)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Predicted ({inferenceResult.predX.toFixed(3)}, {inferenceResult.predY.toFixed(3)}) vs Ground Truth ({pairData?.gtX.toFixed(3)}, {pairData?.gtY.toFixed(3)})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {inferenceResult.euclideanError?.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-slate-400">px error</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    NCC Peak: <span className="text-emerald-400">{inferenceResult.score.toFixed(3)}</span> | Latency: <span className="text-amber-400">{inferenceResult.runtimeMs.toFixed(1)} ms</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Estimated Scale</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{inferenceResult.bestScale.toFixed(3)}x</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Estimated Rotation</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{inferenceResult.bestRotation.toFixed(1)}°</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Candidates Evaluated</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{inferenceResult.candidatesCount} peaks</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Decision Rule</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">Center-Bias NCC</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center">
              <Crosshair className="w-8 h-8 text-cyan-400/60 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">Ready for Sub-Pixel Localization</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Click <span className="text-cyan-400 font-semibold">"Execute Inference"</span> to run multi-scale Normalized Cross-Correlation and sub-pixel quadratic fitting.
              </p>
            </div>
          )}

          {/* Dual SEM Images Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Reference Image (100x Zoom) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    1. Reference Template
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    100x Zoom (1000x1000 px) | Clean Metrology
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-800/60 font-mono">
                  Center (500, 500)
                </span>
              </div>

              <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center group">
                {pairData ? (
                  <img
                    src={pairData.refImageDataUrl}
                    alt="Reference SEM"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-600 text-xs">Generating layout...</div>
                )}

                {/* Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 border border-cyan-400/40 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  </div>
                  <div className="absolute w-full h-[1px] bg-cyan-500/20" />
                  <div className="absolute h-full w-[1px] bg-cyan-500/20" />
                </div>
              </div>
            </div>

            {/* 2. Search Image (10x Zoom) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    2. Search Image
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    10x Zoom (1000x1000 px) | Noisy Field
                  </span>
                </div>

                {/* Overlay Controls */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    id="view-standard"
                    onClick={() => setViewOverlay('standard')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      viewOverlay === 'standard'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    id="view-heatmap"
                    onClick={() => setViewOverlay('heatmap')}
                    disabled={!inferenceResult?.heatmapDataUrl}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      viewOverlay === 'heatmap'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
                    }`}
                  >
                    Heatmap
                  </button>
                  <button
                    id="view-blend"
                    onClick={() => setViewOverlay('blend')}
                    disabled={!inferenceResult}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      viewOverlay === 'blend'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
                    }`}
                  >
                    Blend
                  </button>
                </div>
              </div>

              <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                {viewOverlay === 'blend' ? (
                  <canvas ref={blendCanvasRef} className="w-full h-full object-cover" />
                ) : pairData ? (
                  <img
                    src={pairData.searchImageDataUrl}
                    alt="Search SEM"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-600 text-xs">Generating layout...</div>
                )}

                {/* Heatmap overlay */}
                {viewOverlay === 'heatmap' && inferenceResult?.heatmapDataUrl && (
                  <img
                    src={inferenceResult.heatmapDataUrl}
                    alt="Correlation Heatmap"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none opacity-80"
                  />
                )}

                {/* SVG Visual Overlays: Ground Truth (Green), Prediction (Cyan), Bounding Box */}
                {pairData && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 1000 1000"
                  >
                    {/* Bounding Box of match */}
                    {showBoundingBox && inferenceResult?.matchBoundingBox && (
                      <g
                        transform={`rotate(${inferenceResult.matchBoundingBox.rotation}, ${
                          inferenceResult.matchBoundingBox.x + inferenceResult.matchBoundingBox.width / 2
                        }, ${
                          inferenceResult.matchBoundingBox.y + inferenceResult.matchBoundingBox.height / 2
                        })`}
                      >
                        <rect
                          x={inferenceResult.matchBoundingBox.x}
                          y={inferenceResult.matchBoundingBox.y}
                          width={inferenceResult.matchBoundingBox.width}
                          height={inferenceResult.matchBoundingBox.height}
                          fill="rgba(6, 182, 212, 0.08)"
                          stroke="#06b6d4"
                          strokeWidth="3"
                          strokeDasharray="8 4"
                          className="animate-pulse"
                        />
                      </g>
                    )}

                    {/* Ground Truth marker (Green circle & crosshair) */}
                    {showGroundTruth && (
                      <g>
                        <circle
                          cx={pairData.gtX}
                          cy={pairData.gtY}
                          r="10"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                        <line
                          x1={pairData.gtX - 16}
                          y1={pairData.gtY}
                          x2={pairData.gtX + 16}
                          y2={pairData.gtY}
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <line
                          x1={pairData.gtX}
                          y1={pairData.gtY - 16}
                          x2={pairData.gtX}
                          y2={pairData.gtY + 16}
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <text
                          x={pairData.gtX + 14}
                          y={pairData.gtY - 14}
                          fill="#10b981"
                          fontSize="24"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          GT ({pairData.gtX.toFixed(1)}, {pairData.gtY.toFixed(1)})
                        </text>
                      </g>
                    )}

                    {/* Prediction marker (Cyan crosshair) */}
                    {showPrediction && inferenceResult && (
                      <g>
                        <circle
                          cx={inferenceResult.predX}
                          cy={inferenceResult.predY}
                          r="8"
                          fill="rgba(6, 182, 212, 0.3)"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                        />
                        <line
                          x1={inferenceResult.predX - 14}
                          y1={inferenceResult.predY}
                          x2={inferenceResult.predX + 14}
                          y2={inferenceResult.predY}
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        <line
                          x1={inferenceResult.predX}
                          y1={inferenceResult.predY - 14}
                          x2={inferenceResult.predX}
                          y2={inferenceResult.predY + 14}
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        <text
                          x={inferenceResult.predX + 14}
                          y={inferenceResult.predY + 28}
                          fill="#38bdf8"
                          fontSize="24"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          Pred ({inferenceResult.predX.toFixed(1)}, {inferenceResult.predY.toFixed(1)})
                        </text>

                        {/* Error vector line */}
                        <line
                          x1={pairData.gtX}
                          y1={pairData.gtY}
                          x2={inferenceResult.predX}
                          y2={inferenceResult.predY}
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeDasharray="4 2"
                        />
                      </g>
                    )}
                  </svg>
                )}
              </div>

              {/* Visibility toggles */}
              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showGroundTruth}
                    onChange={(e) => setShowGroundTruth(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-[11px] text-emerald-400 font-semibold">● Ground Truth</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showPrediction}
                    onChange={(e) => setShowPrediction(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-[11px] text-cyan-400 font-semibold">● Predicted Center</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showBoundingBox}
                    onChange={(e) => setShowBoundingBox(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-[11px] text-blue-400 font-semibold">□ Match Box</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
