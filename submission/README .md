# Drift-Sense: SEM Pattern Localization & Metrology Dataset Generator

**Drift-Sense** is an end-to-end semiconductor metrology and computer vision framework for **sub-pixel pattern localization** in high-resolution Scanning Electron Microscope (SEM) imaging [25]. Designed for advanced wafer inspection, it pairs a **physically rigorous synthetic SEM dataset generator** with a **scale-, rotation-, and noise-robust pattern matching engine** [25].

This solution was developed for the **Applied Materials "Drift-Sense" Problem Statement** as part of **Hackathon 2026** (organized as part of **SEMICON India**) [1].

---

## 🔬 Overview

In semiconductor manufacturing and CD-SEM (Critical Dimension Scanning Electron Microscopy), inspection tools frequently need to revisit precise relative locations across repeat dies [1]. However, mechanical stage drift, thermal expansion, or vibration can cause the tool to land away from its target [1].

This recovery task requires locating a clean, high-resolution **Reference Image (100x Magnification)** inside a wider, lower-resolution, and noisier **Search Image (10x Magnification)** [2, 3]. Doing so is highly challenging due to several physical and geometric factors [27]:
*   **Mechatronic Translation Drift:** Stage positioning shifts of up to $\pm 80\text{ px}$ [27].
*   **Stage Rotation:** Wafer placement angle variations up to $\pm 3.0^\circ$ [27].
*   **Magnification Calibration Drift:** Electron-beam scaling variations ranging between $0.95\times$ and $1.05\times$ (representing a nominal $9:1$ to $11:1$ ratio instead of a perfect $10:1$ ratio) [6, 27].
*   **Severe SEM Noise:** Poisson electron shot noise, asymmetric beam astigmatism blur ($\sigma_x \neq \sigma_y$), secondary electron edge-brightening (blooming), and dielectric charging scanlines [7, 27].
*   **Periodic Structure Ambiguity:** Dense DRAM arrays with repeated patterns, which create false local maxima for conventional cross-correlation techniques [2, 27].

### The Drift-Sense Solution
Drift-Sense overcomes these challenges by combining:
1.  **Multi-scale and Multi-rotation Normalized Cross-Correlation (NCC)** [28].
2.  **A Navigational Center-Bias Prior Filter** to select the candidate physically nearest to the expected stage center, resolving periodic pattern ambiguity [28].
3.  **Quadratic Polynomial Sub-pixel Interpolation** (continuous 1D/2D parabolic fitting) to achieve sub-pixel precision down to $< 0.5\text{ px}$ [28].

**Performance:** Achieves a **96.67% pass rate** at a $\le 5\text{ px}$ threshold and a **median error of 1.22 pixels** [28].

---

## 🚀 Key Features

### 1. Synthetic SEM Dataset Generator
*   **Procedural Device Geometries:** Accurately models **DRAM Contact Arrays** (incorporating a realistic $10\%$ missing contact defect rate) and **FinFET Logic Gates/Fins** (modeled as structured Manhattan grid layouts) rendered onto a massive $12,000 \times 12,000$ virtual master space [28].
*   **SEM Physical Modeling Pipeline:** Replicates secondary electron edge blooming, 2D Gaussian astigmatism, Poisson shot noise, speckle noise, and horizontal scanline dielectric charging [28].

### 2. Sub-Pixel Localization Inference Engine
*   **Multi-Scale & Multi-Rotation Sweep:** Searches across scale ratios ($0.09\times$, $0.095\times$, $0.10\times$, $0.105\times$, $0.11\times$) and rotation angles ($-3.0^\circ$ to $+3.0^\circ$) to counter magnification and alignment drift [28].
*   **Navigational Center-Bias Filter:** Implements the **closest-to-center tie-breaker rule** to correctly choose between identical matching features in highly repetitive arrays [2, 6, 28].
*   **Quadratic Peak Refinement:** Uses 2D parabolic curve fitting on the correlation surface to locate the true coordinate with sub-pixel precision [28].

### 3. Interactive Web App & Benchmark Suite
*   **Real-time Sandbox:** Split-screen visual reticles, live correlation heatmaps, and transformed overlay blending [28].
*   **Automated Evaluation:** Evaluates 30-pair test suites, reporting latencies, error distributions, and exporting compliant CSV manifests and validation reports [8, 28].

---

## 🏗 Repository Structure

```
├── configs/
│   └── config.json                # Master configuration (ranges, scales, blur kernels)
├── references/
│   └── references.txt             # Literature citations and academic papers
├── results/
│   ├── benchmark_results (1).csv  # Quantitative 30-pair benchmark metrics
│   ├── manifest (2).csv           # Ground-truth transformation metadata
│   └── validation_report (1).txt  # Automated summary text report
├── src/
│   ├── components/                # React UI components (Live simulator, Charts, Physics)
│   ├── data/                      # Benchmark dataset records
│   ├── engine/
│   │   ├── semGenerator.ts        # Synthetic SEM procedural generator & noise engine
│   │   └── semLocalizer.ts        # Multi-scale NCC & sub-pixel localization algorithm
│   ├── types.ts                   # Shared TypeScript definitions
│   ├── App.tsx                    # Main application shell
│   └── main.tsx                   # Web entry point
├── package.json                   # NPM dependencies and scripts
└── README.md                      # Project documentation
```

---

## ⚙️ Configuration (`configs/config.json`)

The behavior of both the procedural SEM generator and the localization engine is defined in `configs/config.json` [26, 30]. This allows fine-tuning parameters without code modifications [7].

Key configuration properties include:
*   `geometries`: Parameters for DRAM contact radius, pitch, defect rates, and FinFET gate/fin dimensions.
*   `noise_pipeline`: Configurations for Poisson noise coefficients, Gaussian blur kernels, and charging scanline intensities.
*   `search_parameters`: Scale ranges ($0.09\times$ to $0.11\times$), angular search steps, and center-bias weighting coefficients.

---

## 🏁 Getting Started

### Web Interactive UI (React + TypeScript)
The interactive simulator, visualization reticles, and benchmarking tools are built using React and TypeScript [28].

#### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   NPM (comes with Node.js)

#### Installation & Development Run
1.  Navigate to the repository root directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
4.  Open the displayed localhost URL (usually `http://localhost:5173`) in your web browser.

#### Building for Production
To compile and bundle the web application:
```bash
npm run build
```

---

## 📊 Applied Materials Hackathon Evaluation Criteria

Our solution conforms strictly to the validation, input/output, and coordinate conventions specified by Applied Materials [16].

### 1. Input/Output & Coordinate Conventions
*   **Reference Image:** $1000 \times 1000$ pixels, grayscale, representing the 100x high-resolution reference pattern [5].
*   **Search Image:** $1000 \times 1000$ pixels, grayscale, representing the wider 10x area [6].
*   **Coordinate Origin:** $(0, 0)$ is defined as the **top-left corner** [6, 18]. The x-coordinate increases to the right, and the y-coordinate increases downwards [6].
*   **Multiple Matches Tie-Breaker:** If multiple identical patterns match, the engine selects the match whose center is **closest to the center of the Search Image** [2, 6].

### 2. Validation & Robustness Requirements
The framework is validated using **at least 30 independent, varied image pairs** representing a mix of DRAM and FinFET geometries across different noise, scale, and rotation profiles [8, 16].

For each test case, the **Euclidean localization error** is calculated as:
$$\text{Error} = \sqrt{(x_{\text{pred}} - x_{\text{true}})^2 + (y_{\text{pred}} - y_{\text{true}})^2}$$ [8]

The evaluation reports the following key metrics in `results/validation_report (1).txt` [8, 10, 30]:
*   **Pass Rate at Thresholds:** Metric pass rates at $\le 5\text{ px}$, $\le 4\text{ px}$, $\le 2\text{ px}$, and $\le 1\text{ px}$ thresholds [8].
*   **Error Statistics:** Mean, Median, and Worst-Case localization errors [8].
*   **Inference Performance:** Runtime per image pair, specifying hardware configuration and timing method [8].
*   **Failure Analysis:** Detailed documentation of at least one failure mode (e.g., severe pattern ambiguity or extreme noise) with root-cause analysis [8].

---

## 📚 Academic Citations & Literature

For details on the physics-based SEM noise modeling and semiconductor design dimensions used to construct the generator, please refer to `/references/references.txt` [11, 30]. The generation pipeline has been built using public knowledge and literature-supported designs for DRAM cell layouts and FinFET 3D geometries [11, 14].

---

## 📄 License

This project is submitted for the SEMICON India Hackathon 2026. All rights reserved.
