# 🌌 MindMesh

[![React v19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![Vite v8](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&style=flat-square)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests-76E2B2?logo=vitest&style=flat-square)](https://vitest.dev/)

> **MindMesh** is a professional, AI-powered personal organizer, task tracker, and wellness/relationship dashboard. Using a warm, emotionally intelligent AI core named **ARIA** (powered by Gemini 2.0), MindMesh automates the friction of scheduling, habits logging, and staying in touch with the people who matter most. 

All user data is stored **100% locally** in the browser's `localStorage`, requiring no complex database setups, servers, or cloud configurations.

---

## ✨ Core Features

### 🤖 1. ARIA: Emotionally Intelligent AI Core
*   **Natural Speech Task Extraction**: Voice-to-task capabilities via the browser's Web Speech API. ARIA parses sentences like *"I need to submit my work report by Friday, high priority"* and extracts tasks, deadlines, priorities, and estimated hours.
*   **Structured Auto-Scheduling**: Validates and transforms conversational replies into structured JSON database entries.
*   **Robust Security & Limits**: Features strict XSS input sanitization and a session rate limiter (20 calls per session) to prevent API abuse.

### 🔥 2. Unified Productivity Dashboard
*   **Today's Priorities**: Real-time sorted task list prioritized by high-to-low importance and category indicators (💼 Work, 🌸 Personal, ❤️ Relationship, 💪 Health).
*   **Wellness Tracker**: Custom-drawn canvas/SVG animated progress indicator displaying the completion percentage of daily habits.
*   **Relationship Pulse Card**: Nudges the user when vital connections (family, friends, mentors) have been neglected, displaying days elapsed since last contact.
*   **Upcoming Deadlines**: Color-coded deadline countdowns (`Overdue`, `Due today!`, `Due tomorrow`, `N days left`).

### 📅 3. Interactive Scheduling Calendar
*   A visual calendar to view your upcoming deadlines, review daily commitments, and identify scheduling conflicts flagged by ARIA.

### 🌱 4. Habit Builder
*   Checklists for core positive habits: **Study**, **Exercise**, **Sleep**, **Hydration**, and **Journaling**.
*   Directly feeds into your daily Wellness Score.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React 19 (Hooks, Context API, Protected Router), Vite 8.
*   **Styling**: Tailwind CSS v4 (using the `@tailwindcss/vite` native plugin) paired with refined Vanilla CSS custom properties for cohesive micro-animations and typography.
*   **Database & Auth**: Client-side `localStorage` Database and Instant Guest login.
*   **AI Models**: Google Generative AI (`gemini-2.0-flash`) via the official `@google/generative-ai` SDK.
*   **Testing**: Vitest for ultra-fast, native ES modules unit testing.
*   **Linter**: Oxlint for lightning-fast Rust-based JS verification.

---

## 📂 Project Structure

```
MindMesh/
├── .env.example            # Environment variables template
├── .gitignore              # Files ignored in version control
├── .oxlintrc.json          # Oxlint configuration rules
├── index.html              # App entry HTML template
├── vercel.json             # Vercel single-page application routing configurations
├── package.json            # Scripts, dependencies, and test configurations
├── vite.config.js          # Vite config bundling Tailwind & React
├── src/
│   ├── main.jsx            # React root mount point
│   ├── App.jsx             # Router definition and route guarding
│   ├── App.css             # Main styling transitions
│   ├── index.css           # Global design system & Tailwind v4 imports
│   ├── gemini.js           # Gemini SDK wrapper, sanitizers, and rate-limiting
│   ├── gemini.test.js      # Vitest unit test suite
│   ├── components/         # Reusable presentation and utility components
│   │   ├── CircularProgress.jsx # Animated SVG habit score circle
│   │   ├── ErrorBoundary.jsx    # Catches app errors gracefully
│   │   ├── Layout.jsx           # Sidebar and responsive frame layout
│   │   ├── ProtectedRoute.jsx   # Auth guard component
│   │   └── SkeletonLoader.jsx   # UI shimmer loaders during fetches
│   ├── contexts/
│   │   └── AuthContext.jsx      # Context provider handling login/session state
│   ├── utils/
│   │   └── localDb.js           # Client-side localStorage database engine
│   └── pages/              # Primary route-based views
│       ├── AriaChat.jsx         # Conversational voice/text AI assistant page
│       ├── Calendar.jsx         # Deadline and scheduling grid view
│       ├── Dashboard.jsx        # Landing dashboard tracking priority metrics
│       ├── Habits.jsx           # Daily habit checkbox list
│       ├── Login.jsx            # Clean, premium guest sign-in layout
│       ├── Profile.jsx          # Profile overview, statistics, and settings
│       ├── RelationshipPulse.jsx# Connection logs and relationship nudges
│       └── ConfigSetupGuide.jsx # Setup instructions displayed if Gemini API key is missing
```

---

## 🚀 Getting Started

### 📋 Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (v9 or higher)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/MindMesh.git
cd MindMesh
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` template into a new `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in the Gemini API key obtained from your Google AI Studio:
```ini
# Gemini API Key (https://aistudio.google.com/app/apikey)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 💻 Available Scripts

### Run Development Server
Spins up a hot-reloading development server:
```bash
npm run dev
```

### Build Production Artifacts
Compiles static optimized assets into the `dist/` directory:
```bash
npm run build
```

### Preview Production Build
Locally preview the built assets:
```bash
npm run preview
```

### Linting
Validate codebase syntax and formatting rules instantly using Oxlint:
```bash
npm run lint
```

---

## 🧪 Testing

We use **Vitest** for verifying core business and AI integration logic.

### Run Tests (Single Run)
```bash
npm run test
```

### Run Tests in Watch Mode (Interactive)
```bash
npm run test:watch
```

The test runner will validate utility functions like:
*   Sanitization of user text against potential HTML XSS scripts.
*   Parsing precision of Markdown-wrapped JSON response objects from ARIA.
*   Rate limiter capacity bounds of `sessionStorage`.
