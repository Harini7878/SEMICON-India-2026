import React, { useState } from 'react';
import { Settings, Copy, Check, Download, FileCode } from 'lucide-react';

export const ConfigModal: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const configJson = {
    project_name: "Drift-Sense",
    description: "Synthetic SEM Dataset Generator and Sub-Pixel Pattern Localization Inference Tool",
    version: "1.0.0",
    dataset_generation: {
      style: "DRAM",
      num_pairs: 30,
      out_dir: "./dataset",
      master_dimensions: {
        width: 12000,
        height: 12000
      },
      crop_dimensions: {
        width: 1000,
        height: 1000
      },
      simulation_parameters: {
        rotation_deg_range: [-3.0, 3.0],
        scale_factor_range: [0.95, 1.05],
        drift_px_range: [-80, 80],
        seed_base: 1000
      },
      noise_models: {
        reference: {
          shot_noise_factor: 100,
          gaussian_blur_sigma: 0.8,
          speckle_strength: 0.05,
          charging_streaks: false
        },
        search: {
          shot_noise_factor: 40,
          gaussian_blur_sigma: 1.5,
          speckle_strength: 0.15,
          charging_streaks: true
        }
      }
    },
    localization_inference: {
      scales: [0.09, 0.095, 0.10, 0.105, 0.11],
      rotations: [-3.0, -1.5, 0.0, 1.5, 3.0],
      preprocessing: {
        search_blur_kernel: [3, 3],
        template_blur_kernel: [3, 3]
      },
      matching: {
        method: "TM_CCOEFF_NORMED",
        candidate_threshold_ratio: 0.90,
        center_bias_score_ratio: 0.95,
        default_reference_center: [500.0, 500.0]
      }
    },
    benchmarking: {
      default_num_pairs: 30,
      output_dir: "/workspace/scratch/test_dataset",
      seed_base: 5000,
      pass_thresholds_pixels: [5.0, 4.0, 2.0, 1.0]
    }
  };

  const jsonString = JSON.stringify(configJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            System Configuration Manifest (`configs/config.json`)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Global metrology hyperparameters, scale grids, rotation intervals, and acceptance criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download config.json</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl overflow-hidden font-mono">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            /configs/config.json
          </span>
          <span className="text-[10px] text-slate-500">JSON Schema v1.0.0</span>
        </div>

        <pre className="text-xs text-cyan-300 overflow-x-auto leading-relaxed max-h-[600px] scrollbar-thin">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
