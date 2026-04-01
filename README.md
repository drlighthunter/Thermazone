# 🔥 ThermaZone: Real-Time Thermal Ablation Assessment System

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)](https://tailwindcss.com/)

**ThermaZone** is a cutting-edge, open-source clinical decision support platform designed for interventional radiologists. It provides real-time spatial and kinetic assessment of thermal ablation procedures (RFA, MWA, CRYO) through advanced image fusion and radiomics AI.

---

## 🚀 Key Features

### 🌡️ Multi-Modality Thermal Monitoring
- **RFA & MWA**: Real-time heating kinetics with lethal threshold alerts (>60°C).
- **Cryoablation**: Dynamic "Ice Ball" visualization with sub-zero monitoring (<-40°C).
- **Spatial Assessment**: 2D axial heatmap interpolation for real-time ablation zone estimation.

### 🧬 Radiomics & Image Fusion Engine
- **Multi-Phase CT Fusion**: Seamlessly overlay thermal data onto Pre, Intra, and Post-procedure CT scans.
- **AI Feature Extraction**: Real-time analysis of Voxel Heterogeneity, Sphericity, and Entropy.
- **Efficacy Metrics**: Automated assessment of **Margin Coverage**, **Needle Placement Accuracy**, and **Ablation Completeness**.

### 🏥 Clinical Intelligence
- **Guideline Integration**: Contextual access to **CIRSE, SIR, and ACR** guidelines for Liver, Lung, Kidney, and Bone procedures.
- **HIPAA Guard**: Local-first processing architecture ensuring PHI never leaves the clinical environment.

### 🛠️ Open-Source Hardware Ready
- Designed to interface with low-cost hardware like the **Raspberry Pi Pico W**.
- Support for MAX31855 thermocouple amplifiers for multi-probe thermal sensing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, TypeScript
- **Styling**: Tailwind CSS 4, Lucide Icons
- **Animations**: Framer Motion
- **Data Viz**: Recharts (High-performance real-time charting)
- **AI/Radiomics**: Simulated Python-driven feature extraction engine

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/thermazone.git
   cd thermazone
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📐 System Architecture

ThermaZone follows a modular architecture designed for high-frequency data ingestion:
1. **Hardware Layer**: Thermocouple probes -> Raspberry Pi Pico -> Web Serial/Wi-Fi.
2. **Processing Layer**: Real-time interpolation and kinetic modeling.
3. **Visualization Layer**: React-based dashboard with SVG/Canvas overlays for image fusion.
4. **AI Layer**: Radiomics engine for texture analysis and clinical recommendations.

---

## 🛡️ HIPAA & Privacy

ThermaZone is built with a **Privacy-First** mindset.
- All image fusion and DICOM rendering are performed client-side.
- Radiomics analysis uses anonymized feature vectors.
- No Protected Health Information (PHI) is stored or transmitted to external servers.

---

## 🤝 Contributing

We welcome contributions from the medical and engineering communities! Whether it's improving the radiomics models, adding new modality support, or refining the UI, please feel free to open a PR.

---

## 📜 License

This project is licensed under the **Apache License 2.0**.

---

**Disclaimer**: *ThermaZone is currently intended for research and educational purposes only. It is not a cleared medical device and should not be used for primary clinical diagnosis or treatment decisions.*
