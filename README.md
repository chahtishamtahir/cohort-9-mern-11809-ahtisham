# NotionFlow 📝

> **A modern, minimalist MERN-stack workspace and note-taking platform inspired by the Mobbin monochrome design philosophy.**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-brightgreen?logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-success)](https://github.com/)

---

## 🌟 Overview

**NotionFlow** is a full-featured, responsive, full-stack MERN application built for effortless personal knowledge management. Combining an ultra-clean, stadium-pill design aesthetic with robust backend validation and real-time user feedback, NotionFlow provides a distraction-free environment to write, categorize, search, and manage your thoughts.

---

## ✨ Key Features

### 🔐 1. Authentication & Account Management
- **Secure Authentication**: User signup, login, and token-based sessions using JWT and `bcryptjs` password hashing.
- **Pre-Hash Schema Validation**: Enforces strict minimum password length checks (`>= 6` characters) and regex-based email format validation *prior* to hashing.
- **Editable User Profile**:
  - **Profile Details**: View account creation date, workspace plan, and total note stats. Edit your **Display Name** inline with instant navbar synchronization.
  - **Security & Password Management**: Change your password securely with required current password verification, length enforcement, and confirmation match validation.
- **Persistent Modals**: Modal backdrops do not dismiss on outside click, preventing accidental data loss while editing profiles or drafting notes.

### 📝 2. Rich Text Note Workspace
- **WYSIWYG Rich Editor**: Support for multiple formatting styles:
  - Headings (H1, H2, H3), Paragraphs, Blockquotes, and Monospace Code Blocks.
  - Bold, Italic, Underline, and Strikethrough text styling.
  - Bulleted (`<ul>`) and Numbered (`<ol>`) lists.
  - Deep format unwrap engine (**Clear Formatting**) that cleans nested formats without losing cursor focus.
- **Pin & Prioritize**: One-click note pinning with immediate visual elevation to the top of your workspace.
- **Categories & Tags**: Organize notes into Work, Personal, Ideas, Todo, or General categories with badge indicators.
- **Instant Search & Filter**: Real-time debounced title and content search with ReDoS protection (safe regex escaping) combined with category tabs.
- **Safe HTML Sanitization**: Built-in protection against malicious script injection while preserving rich formatting.

### 📤 3. Multi-Format Import & Export
- **Multi-Format Export**:
  - **JSON**: Complete structured data backup with metadata (timestamps, categories, pinned state).
  - **TXT / Markdown**: Clean, human-readable text document for portability and archiving.
- **Multi-Format Import**:
  - Import JSON backups directly into your database.
  - Import raw text/markdown files as new notes.
  - Clear directional visual indicators (upload vs. download arrows).

### 🎨 4. Design & User Experience
- **Mobbin Monochrome Aesthetic**: Premium black-and-white stadium pills, 20px card border radii, subtle micro-transitions, and custom typography.
- **Responsive Navigation**: Centered floating navigation stadium pill with dark/light mode toggle and responsive mobile overflow handling.
- **Global Brand Identity**: 30% white squircle logo with a bold black `N` unified across the navbar, favicon, modals, and high-contrast dark footer.
- **Non-Obtrusive Toast Feedback**: Floating bottom-right toast notification system providing feedback for authentication, note operations, exports, and imports.
- **Custom Confirmation Modals**: Seamless in-app confirmation modals for destructive actions (no native browser `alert()` or `confirm()`).

---

## 🏗️ Architecture & Tech Stack

```
NotionFlow/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # Database connection & Pino logger
│   │   ├── controllers/      # Auth & Note controller logic
│   │   ├── middleware/       # JWT auth & centralized error handler
│   │   ├── models/           # Mongoose schemas (User, Note)
│   │   ├── routes/           # REST endpoints (/api/auth, /api/notes)
│   │   └── server.js         # Express app entry point
│   └── test/                 # Mocha + Chai + Supertest integration tests
│
└── frontend/                 # React 19 SPA (Vite)
    ├── src/
    │   ├── components/       # UI Components (auth, editor, layout, notes, profile)
    │   ├── context/          # State management (AuthContext, ToastContext)
    │   ├── pages/            # LandingPage, DashboardPage
    │   ├── services/         # API client layer (Fetch API)
    │   ├── styles/           # Tailwind 4 theme & custom design tokens
    │   └── test/             # Vitest + React Testing Library suite
```

### Technology Breakdown

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, TailwindCSS 4, Lucide React, CSS Variables |
| **Backend** | Node.js, Express 4.21, Mongoose 8, Pino Logger, bcryptjs, jsonwebtoken |
| **Database** | MongoDB Atlas |
| **Testing** | Vitest, React Testing Library, Mocha, Chai, Supertest, Sinon |
| **Linting** | Oxlint (0 warnings, 0 errors) |

---

## 🔌 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Protected | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/signup` | Register a new user | No | `{ name, email, password }` |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | No | `{ email, password }` |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes | *None* |
| `PUT` | `/api/auth/profile` | Update display name and/or password | Yes | `{ name?, currentPassword?, newPassword? }` |

### Notes (`/api/notes`)

| Method | Endpoint | Description | Protected | Parameters / Body |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/notes` | List user notes (with search & category filter) | Yes | `?search=...&category=...` |
| `POST` | `/api/notes` | Create a new note | Yes | `{ title, content, category, isPinned }` |
| `PUT` | `/api/notes/:id` | Update an existing note | Yes | `{ title?, content?, category?, isPinned? }` |
| `DELETE`| `/api/notes/:id` | Permanently delete a note | Yes | *None* |
| `GET` | `/api/notes/export/all`| Export all notes as JSON payload | Yes | *None* |
| `POST` | `/api/notes/import`| Batch import notes | Yes | `[ { title, content, category, isPinned }, ... ]` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

---

### 1. Clone the Repository
```bash
git clone https://github.com/chahtishamtahir/cohort-9-mern-11809-ahtisham.git
cd cohort-9-mern-11809-ahtisham
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Populate `.env` with your credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/notionflow?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Server will run at `http://localhost:5000` with live Pino logging.*

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Application will be live at `http://localhost:5173`.*

---

## 🧪 Testing & Quality Assurance

NotionFlow is backed by end-to-end automated unit and integration tests across both the backend and frontend.

### Run Backend Tests (Mocha + Chai + Supertest)
```bash
cd backend
npm test
```
- **22 passing tests** covering authentication, pre-hash validation, profile updates, notes CRUD, export/import, and error translation.

### Run Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm test
```
- **17 passing tests** verifying rich text formatting, entity decoding, note card rendering, modal dismissal persistence, profile editing, and toast feedback.

### Run Code Linter (Oxlint)
```bash
cd frontend
npm run lint
```
- **0 warnings, 0 errors** across all files.

### Verify Production Build
```bash
cd frontend
npm run build
```
- Client bundles cleanly with zero warnings in ~500ms.

---

## 👨‍💻 Author & Project Information

- **Author**: Ahtisham Tahir
- **Cohort**: Cohort 9 — MERN Stack
- **Roll Number / Student ID**: 11809
- **Project**: NotionFlow — Full Stack MERN Notes Application
- **License**: ISC
