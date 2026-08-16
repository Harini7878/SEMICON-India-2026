# Drift-Sense: SEM Pattern Localization & Metrology Dataset Generator

[![SEMICON India 2026](https://img.shields.io/badge/SEMICON_India-2026-0284c7.svg)](https://github.com/Harini7878/SEMICON-India-2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)](https://www.python.org/)
[![Accuracy Pass Rate](https://img.shields.io/badge/Pass_Rate_(%E2%89%A45px)-96.67%25-brightgreen.svg)]()
[![Sub-Pixel Precision](https://img.shields.io/badge/Median_Error-1.22_px-cyan.svg)]()

> **Drift-Sense** is an end-to-end semiconductor metrology and computer vision framework for **sub-pixel pattern localization** in high-resolution Scanning Electron Microscope (SEM) imaging. Designed for advanced wafer inspection, it pairs a **physically rigorous synthetic SEM dataset generator** with a **scale-, rotation-, and noise-robust pattern matching engine**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [SEM Physical Modeling & Physics Justifications](#-sem-physical-modeling--physics-justifications)
  - [1. Device Geometries](#1-device-geometries)
  - [2. SEM Noise & Degradation Pipeline](#2-sem-noise--degradation-pipeline)
  - [3. Sub-Pixel Localization & Navigational Priors](#3-sub-pixel-localization--navigational-priors)
- [Benchmark Results](#-benchmark-results)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Web Interactive UI (React + TypeScript)](#web-interactive-ui-react--typescript)
  - [Python Environment](#python-environment)
- [Configuration (`configs/config.json`)](#-configuration)
- [Academic Citations & Literature](#-academic-citations--literature)
- [License](#-license)

---

## 🔬 Overview

In semiconductor manufacturing and CD-SEM (Critical Dimension Scanning Electron Microscopy), finding a high-magnification **Reference Template** (100x zoom, clean) inside a wide-field **Search Image** (10x zoom, degraded) is challenging due to:
- **Mechatronic Translation Drift**: Stage positioning shifts up to $\pm 80\text{ px}$.
- **Stage Rotation**: Wafer placement angle variations up to $\pm 3.0^\circ$.
- **Magnification Calibration Drift**: Optical/e-beam scaling variations between $0.95\times$ and $1.05\times$ ($9:1$ to $11:1$ ratio).
- **Severe Physical SEM Noise**: Poisson electron shot noise, asymmetric beam astigmatism blur ($\sigma_x \neq \sigma_y$), secondary electron edge-brightening, and dielectric charging scanlines.
- **Periodic Structure Ambiguity**: Dense DRAM arrays lead to false local maxima in standard cross-correlation.

**Drift-Sense** solves this by combining multi-scale/multi-rotation Normalized Cross-Correlation (NCC), quadratic polynomial sub-pixel interpolation, and a mechatronic **center-bias decision prior**, achieving **96.67% pass rate** at $\le 5\text{ px}$ threshold and a **median error of 1.22 pixels**.

---

## 🚀 Key Features

- **Synthetic SEM Dataset Generator**:
  - Procedural generation of **DRAM Contact Arrays** (with 10% missing contact defects) and **FinFET Logic Gates/Fins** (Manhattan grid layouts) on a $12,000 \times 12,000$ virtual master space.
  - Realistic SEM degradation engine: Secondary electron emission edge blooming, 2D Gaussian astigmatism, Poisson shot noise, speckle noise, and horizontal scanline charging.
- **Sub-Pixel Localization Inference Engine**:
  - Multi-scale search space ($0.09\times, 0.095\times, 0.10\times, 0.105\times, 0.11\times$) and rotation sweep ($-3.0^\circ$ to $+3.0^\circ$).
  - **Navigational Center-Bias Filter**: Selects the candidate physically nearest to the expected stage center within top candidate clusters, preventing periodic DRAM grid jumping.
  - **Quadratic Peak Refinement**: Continuous 1D/2D parabolic fitting achieving sub-pixel precision down to $< 0.5\text{ px}$.
- **Interactive Web App & Benchmark Suite**:
  - Real-time parameter sandbox with split-screen visual reticles, correlation heatmaps, and transformed overlay blend modes.
  - Automated 30-pair evaluation with latency metrics, error distribution charts, and exportable CSV / validation report.

---

## 🏗 System Architecture

```mermaid
graph TD
    A[Synthetic Layout Generator<br/>DRAM / FinFET Master 12000x12000] --> B[Crop Ref Template 100x<br/>1000x1000 Clean]
    A --> C[Transform & Degrade Search 10x<br/>Rotation, Scale, Drift, SEM Noise]
    
    B --> D[Multi-Scale & Multi-Rotation Pyramids<br/>s in [0.09, 0.11], theta in [-3°, +3°]]
    C --> E[Gaussian Pre-Filtering<br/>3x3 Kernel Blur]
    
    D & E --> F[Normalized Cross-Correlation<br/>TM_CCOEFF_NORMED]
    F --> G[Peak Candidate Collection<br/>Threshold = 0.90 * MaxVal]
    G --> H[Center-Bias Decision Rule<br/>Argmin ||Candidate - (500,500)|| within 95% of peak]
    H --> I[Quadratic Sub-Pixel Refinement<br/>Continuous Parabolic 3x3 Interpolation]
    I --> J[Final Sub-Pixel Coordinate (X, Y)<br/>Confidence Score & Bounding Box]