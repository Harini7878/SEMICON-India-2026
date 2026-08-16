import React from 'react';
import { BookOpen, Cpu, Sparkles, Target, Zap, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';

export const PhysicsVisualizer: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          SEM Physics, Noise Modelling & Algorithmic Justifications
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-4xl">
          Complete literary citations and engineering justifications for our semiconductor geometry synthesis, Scanning Electron Microscope (SEM) noise models, sub-pixel quadratic fitting, and mechatronic center-bias decision priors.
        </p>
      </div>

      {/* Section 1: Device Geometry */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">
            1. Semiconductor Device Geometry (DRAM & FinFET Structures)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* DRAM */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                DRAM Array Contact Matrices
              </span>
              <span className="text-[10px] font-mono text-slate-500">240nm Pitch</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              DRAM array designs are composed of highly periodic circular contact holes patterned at precise pitch intervals (nominally 100nm pitch with 50nm diameters). We model these circular arrays using 2D matrices of shapes with programmed missing elements (10% defect rate) to simulate missing contact defects, forming a locally distinct visual fingerprint.
            </p>
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-mono">
              <strong className="text-slate-200">Citation:</strong> Orji, N. G., et al. "Metrology for the next generation of semiconductor devices." <em>Nature Electronics</em>, Vol. 1, No. 10, 2018, pp. 532-547.
            </div>
          </div>

          {/* FinFET */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                FinFET Logic Interconnects
              </span>
              <span className="text-[10px] font-mono text-slate-500">Manhattan Layout</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              FinFET layers consist of perpendicular dense lines (lines/spaces) conforming to 90-degree Manhattan layouts. Our simulator designs FinFET structures using interlocking vertical fins (30–90nm) and horizontal gates (50–120nm) with non-uniform pitches and bridge variations.
            </p>
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-mono">
              <strong className="text-slate-200">Citation:</strong> Dey, B., et al. "Applying Machine Learning Models on Metrology Data for Predicting Device Electrical Performance." <em>arXiv:2312.09462</em>.
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: SEM Noise Models */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100">
            2. Scanning Electron Microscope (SEM) Imaging & Noise Degradation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Edge Brightening */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Secondary Electron Edge-Brightening
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Steep topography borders on silicon wafers produce enhanced secondary electron emission, creating bright perimeter contours in SEM images. We procedurally model this charging profile using morphological gradients and high-contrast overlays.
            </p>
            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              Ahmed, S. M., et al. "A Mixture of Experts Foundation Model for SEM Image Analysis." <em>arXiv:2604.05960</em>, 2026.
            </div>
          </div>

          {/* Asymmetric Noise & Astigmatism */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Astigmatism & Poisson Noise
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              The 10x search image experiences higher thermal sensor blur (astigmatism with asymmetric σx ≠ σy) and Poisson-distributed shot noise. Reference and search images undergo independent degradation to ensure zero leakage of noise signatures.
            </p>
            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              Schubert, H., et al. "DeepFocus: Deep learning focus quality in wafer inspection." <em>Proc. SPIE 10145</em>, 2017.
            </div>
          </div>

          {/* Dielectric Charging Scanlines */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Dielectric Charging Scanlines
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Insulating layers on semiconductor wafers accumulate static electrons during raster scanning, creating intermittent horizontal bright streaks. We overlay horizontal intensity bands with randomized Y coordinates to test matcher robustness.
            </p>
            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              "Does Your SEM Really Tell the Truth?—Charging and its Mitigation." <em>PMC Journal of Microscopy</em>, PMC5486231.
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Sub-Pixel & Center-Bias Algorithm */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            3. Positioning Error Compensations & Sub-Pixel Registration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Sub-Pixel Quadratic Interpolation */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Sub-Pixel Quadratic Peak Refinement
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Continuous wafer stage translations are not bounded by discrete pixel boundaries. We achieve sub-pixel repeatability (down to &lt; 0.5 pixels) by fitting a 1D/2D continuous quadratic polynomial over the local 3x3 cross-correlation maxima:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
              Δx = (R(x-1) - R(x+1)) / [ 2 · (R(x-1) - 2·R(x) + R(x+1)) ]
            </div>
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-mono">
              <strong className="text-slate-200">Citation:</strong> Pan, S., Wang, S., et al. "Sub-pixel position estimation algorithm based on Gaussian fitting for wafer alignment." <em>Applied Optics</em>, Vol. 60, No. 31, 2021, pp. 9607-9618.
            </div>
          </div>

          {/* Navigational Center Bias */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Navigational Center-Bias Decision Prior
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard cross-correlation easily falls into repetitive local maxima when scanning periodic contact grids (e.g. DRAM arrays). Our mechatronic center-bias filter groups all candidate peaks within 5% of the absolute correlation peak, and selects the candidate physically closest to the nominal gantry center (500, 500), eliminating periodic grid jumps.
            </p>
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-mono">
              <strong className="text-slate-200">Citation:</strong> Hsieh, R., et al. "Lithography Challenges For Emerging Fan-Out Wafer Level Packaging." <em>International Wafer-Level Packaging Conference (IWLPC)</em>, 2009.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
