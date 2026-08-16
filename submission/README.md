# Drift-Sense: AI-Powered Semiconductor Navigation Error Recovery

This repository implements an advanced mechatronic-aligned image registration engine to solve the **Applied Materials "Drift-Sense"** navigation-error recovery challenge for sub-10nm wafer inspection tools.

## 📂 Repository Layout

```
submission/
├── configs/
│   └── requirements.txt         # Environment package requirements
├── results/
│   ├── benchmark_results.csv    # 30-pair empirical coordinates manifest
│   └── validation_report.txt    # Radially computed threshold metrics summary
├── references/
│   └── references.txt           # Academic & patent citations justifying physical models
├── src/
│   ├── generate_dataset.py      # Standalone procedural DRAM/FinFET pair generator
│   ├── localize.py              # Standalone template localization inference script
│   └── test_drift_sense.py      # Standalone validation and benchmarking harness
├── solution_presentation.pptx   # Executive 12-slide presentation detailing architecture
└── README.md                    # This setup and execution guide
```

## ⚙️ Environment Setup & Installation

Install the required lightweight python packages directly via pip:

```bash
pip install -r configs/requirements.txt
```

*Note: Tested and verified on Python 3.12 with OpenCV and NumPy.*

## 🚀 Execution & Usage Guide

All scripts are configured as separate, standalone, runnable command-line utilities.

### 1. Dataset Generation (`generate_dataset.py`)
To generate a set of procedural, physics-degraded reference and wide search image pairs:

```bash
python3 src/generate_dataset.py --style DRAM --num_pairs 30 --out_dir ./test_dataset
```

This generates:
- Grayscale `ref_i.png` pairs representing 100x close-up (1000x1000px, 1px = 1nm).
- Grayscale `search_i.png` pairs representing wider 10x captures (1000x1000px, 1px = 10nm).
- `ground_truth_manifest.csv` containing perfect target center coordinates and stage drift variables.

### 2. Standalone Localization Inference (`localize.py`)
To run localization on any pair of reference and search images:

```bash
python3 src/localize.py ./test_dataset/ref_0.png ./test_dataset/search_0.png
```

**Stdout Output Format:**
The script prints the sub-pixel coordinates to stdout in the exact expected format:
```
(521.805, 430.397)
```

### 3. Standalone Benchmarking & Validation Suite (`test_drift_sense.py`)
To run a complete validation pipeline over 30 randomized pairs (15 DRAM and 15 FinFET) and generate empirical report assets:

```bash
python3 src/test_drift_sense.py
```

## 📐 Mechatronic Assumptions & Coordinate Conventions
- **Origin `(0, 0)`**: Top-left corner of the image, with X increasing rightwards and Y increasing downwards.
- **Center-Bias Selection**: For repeating layouts, matches are sorted by correlation score and penalized by distance to the search center `(500, 500)` representing expected physical stage limits, effectively suppressing distant grid-ambiguity aliasing.
- **Sub-Pixel Parabolic Fitting**: Achieves high-repeatability sub-pixel coordinates by fitting a 1D quadratic model over the local 3x3 correlation response window.
