<div align="center">

# 🏥 CareConnect
### AI-Assisted Healthcare & Wellness Bridge

[![GitHub Stars](https://img.shields.io/github/stars/widgetwalker/hackathon?style=for-the-badge&color=2DD4BF)](https://github.com/widgetwalker/hackathon/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/widgetwalker/hackathon?style=for-the-badge&color=2DD4BF)](https://github.com/widgetwalker/hackathon/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Powered by AI](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge&logo=openai)](https://careconnect.ai)

**CareConnect is a premium, AI-driven platform designed to make healthcare accessible, intelligent, and compassionate for everyone.**

[✨ Discover Features](#-core-features--rationale) • [🚀 Quick Start](#-getting-started) • [🌎 Societal Impact](#-how-this-helps-society) • [🛠 Tech Stack](#-the-modern-stack)

---

</div>

## 📌 Project Overview

**CareConnect** acts as a "wellness bridge," leveraging modern Artificial Intelligence to provide an immediate first layer of health guidance. We connect the dots between symptoms, healthcare professionals, and treatment through a unified, calming interface.

## 🤝 How This Helps Society

Healthcare accessibility is a global challenge. CareConnect addresses this by:

*   **⚡ Rapid Response**: Immediate AI-powered symptom analysis to reduce patient anxiety.
*   **🏥 Optimized Referrals**: Specialty-based filtering to ensure patients reach the right experts faster.
    *   **📦 End-to-End Care**: Integrating medicine delivery to ensure the recovery process starts the moment a consultation ends.
*   **🧬 Proactive Wellness**: Transitioning from reactive sick-care to proactive health management.

---

## ✨ Core Features & Rationale

### 🧠 1. AI Health Assistant
*   **Feature**: A conversational AI interface for symptom checking and wellness advice.
*   **Rationale**: To replace the "search-engine anxiety" with calm, healthcare-themed guidance.

### 🩺 2. Expert Doctor Directory
*   **Feature**: Advanced specialty-filtered directory with real-time availability.
*   **Rationale**: To minimize "decision paralysis" and connect patients with verified specialists directly.

### 📦 3. Pharma Express
*   **Feature**: Integrated medicine search and home delivery checkout mockup.
*   **Rationale**: Recovery should be effortless. In-app ordering ensures treatment starts immediately.

### 📊 4. Wellness Analytics
*   **Feature**: Real-time tracking of vitals like Heart Rate, Sleep Quality, and Stress.
*   **Rationale**: To promote holistic wellness and daily health consciousness.

### 🎨 5. Modern OKLCH Design System
*   **Feature**: A custom theme utilizing the latest light-perceptive color standards.
*   **Rationale**: Healthcare apps should feel calming and trustworthy, not cold and clinical.

---

## 🛠 The Modern Stack

Built with a focus on speed, security, and developer experience:

*   **⚛️ React 18 + TS** - Industry-standard frontend stability.
*   **🎨 Tailwind + OKLCH** - Next-generation color perception.
*   **🔐 Better Auth** - Enterprise-grade, HIPAA-ready authentication.
*   **⚡ Vite** - High-performance build ecosystem.
*   **🗄️ Supabase + Drizzle** - Scalable, type-safe database architecture.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps:

### 1. **Clone the Repository**
```bash
git clone https://github.com/widgetwalker/hackathon.git
cd hackathon
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Configure Environment**

Create a `.env` file in the root directory with your Supabase credentials:

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=your_random_secret_key_here

# Supabase Client (for frontend)
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important Notes:**
- Replace `[PROJECT_REF]` with your Supabase project reference
- Replace `[YOUR_PASSWORD]` with your Supabase database password
- Generate a secure random string for `BETTER_AUTH_SECRET`
- Get your `VITE_SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API

### 4. **Run the Application**

CareConnect uses a dual-server architecture:

**Option A: Run both servers together (Recommended)**
```bash
npm run dev:all
```

**Option B: Run servers separately**

Terminal 1 - Frontend Server:
```bash
npm run dev
```

Terminal 2 - Auth Server:
```bash
npm run dev:auth
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Auth API**: http://localhost:3001

---

## 🔮 Future Enhancements

We are just getting started. The roadmap for CareConnect includes:

-   [ ] **Wearable Sync**: Direct integration with Apple HealthKit & Google Fit for real-time wellness scores.
-   [ ] **Video Consultations**: Integrated WebRTC for face-to-face doctor visits in the browser.
-   [ ] **ML Symptom Prediction**: Moving from rule-based AI to deep-learning models for higher accuracy.
-   [ ] **Multi-lingual Support**: Making healthcare accessible to non-English speaking regions.
-   [ ] **Family Accounts**: Manage the wellness of your elders and children from a single dashboard.

---

## 📄 License

CareConnect is licensed under the **MIT License**. We believe in open-source healthcare for all.

---

<div align="center">

**Built with 💚 by the CareConnect Team**
*Hackathon Entry - Empowering Wellness through AI*

</div>
