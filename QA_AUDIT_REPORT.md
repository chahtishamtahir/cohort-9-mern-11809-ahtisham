# NotionFlow — Quality Assurance & Application Audit Report

**Date:** September 4, 2026  
**Auditor:** Antigravity Autonomous QA Subsystem  
**Application Stack:** MERN (MongoDB Atlas + Express.js 4 + React 19 + TailwindCSS 4 / Vite 8 + Pino)  
**Target Repository:** `cohort-9-mern-11809-ahtisham`

---

## Executive Summary

A comprehensive end-to-end quality assurance audit was conducted across the entire NotionFlow codebase, including live API integration tests, schema and route validations, React 19 component lifecycle tests, visual and responsive layout inspections, and user feedback journey mapping.

While the application features a strong foundational design inspired by the Mobbin monochrome design system, the audit identified **34 distinct findings** spanning:
- **7 Backend Bugs & API Vulnerabilities** (including an unhandled Regex Denial of Service / 500 error, unhandled Mongoose `CastError` and `ValidationError` returning 500s, and bypassed password validation).
- **8 Frontend Bugs & State Issues** (including a React 19 bad setState in render warning, `Invalid Date` rendering, unescaped HTML entities, and missing XSS sanitization).
- **9 UI Misalignments & Responsive Glitches** (including container width mismatches between the Navbar `1080px` and Dashboard `1280px`, mobile nav pill overflow, and grid auto-fill overflow on small viewports).
- **10 Critical Places Where User Feedback / Messages Are Missing** (most prominently the complete absence of a success message or welcome toast after registering).

---

## Table of Contents
1. [Backend Bugs & API Issues](#1-backend-bugs--api-issues)
2. [Frontend Bugs & State Management Issues](#2-frontend-bugs--state-management-issues)
3. [UI Misalignments & Styling Bugs](#3-ui-misalignments--styling-bugs)
4. [Places Where User Feedback / Messages Should Be Added](#4-places-where-user-feedback--messages-should-be-added)
5. [Automated Test Suite & Live Reproduction Results](#5-automated-test-suite--live-reproduction-results)
6. [Remediation Roadmap](#6-remediation-roadmap)

---

## 1. Backend Bugs & API Issues

### Bug BE-01: Unescaped Regular Expression in Search Causes 500 Internal Server Error (ReDoS / Crash)
- **Severity:** High
- **File:** [`backend/src/controllers/noteController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/noteController.js#L20-L24)
- **Description:** The search endpoint constructs a raw regular expression directly from user query parameters without escaping special regex meta-characters.
  ```javascript
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { content: searchRegex }];
  }
  ```
- **Live Reproduction:** Sending `GET /api/notes?search=(unclosed[regex` causes `new RegExp()` to throw `SyntaxError: Invalid regular expression: Unterminated character class`, triggering a **500 Internal Server Error** and exposing backend call stacks.
- **Expected:** Regex special characters should be escaped (e.g. `search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) or MongoDB text index / `$regex` with literal option used.

---

### Bug BE-02: Unhandled Mongoose `CastError` on Invalid Note IDs Returns 500 Internal Server Error
- **Severity:** Medium
- **Files:**
  - [`backend/src/middleware/errorHandler.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/middleware/errorHandler.js#L9-L11)
  - [`backend/src/controllers/noteController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/noteController.js#L48-L63)
- **Description:** Passing any non-hexadecimal 24-character string in `GET /api/notes/:id`, `PUT /api/notes/:id`, or `DELETE /api/notes/:id` (e.g. `/api/notes/invalid-id`) causes Mongoose to throw a `CastError`. Because `CastError` does not define `err.statusCode`, the global error handler falls back to status `500` instead of `400 Bad Request` or `404 Not Found`.
- **Live Reproduction:**
  `GET /api/notes/not-a-valid-id` -> Returns `500 Internal Server Error` with `Cast to ObjectId failed`.
- **Expected:** The error handler should check `if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });`.

---

### Bug BE-03: Note Update with Whitespace/Empty Title Throws Unhandled `ValidationError` Returning 500
- **Severity:** Medium
- **File:** [`backend/src/controllers/noteController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/noteController.js#L113)
- **Description:** `updateNote` strips whitespace with `updateFields.title = title.trim()`. If an update payload is `{ title: "   " }`, `title` becomes `""`. Because `{ runValidators: true }` is enabled, Mongoose rejects the empty title with `ValidationError: Note title is required`. Because `ValidationError` lacks `err.statusCode`, the client receives `500 Internal Server Error` rather than `400 Bad Request`.
- **Live Reproduction:**
  `PUT /api/notes/<id>` with body `{"title": "   "}` -> Returns `500 Internal Server Error`.
- **Expected:** Pre-validate `if (title !== undefined && title.trim() === '') return res.status(400)...` and handle `ValidationError` in `errorHandler.js` as status `400`.

---

### Bug BE-04: Password Minimum Length Validation is Completely Bypassed in Backend
- **Severity:** Medium
- **Files:**
  - [`backend/src/models/User.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/models/User.js#L20)
  - [`backend/src/controllers/authController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/authController.js#L35-L43)
- **Description:** The Mongoose user schema defines `minlength: [6, 'Password must be at least 6 characters']`. However, `authController.signup` runs `bcrypt.hash(password, 10)` *before* calling `User.create({ password: hashedPassword })`. The resulting hash is always 60 characters, which always satisfies the schema.
- **Live Reproduction:** A direct API call `POST /api/auth/signup` with `{ name: "Audit", email: "audit@test.com", password: "1" }` succeeds and creates an account with a 1-character password!
- **Expected:** Validate `if (password.length < 6) return res.status(400)...` in `authController.signup` prior to bcrypt hashing.

---

### Bug BE-05: Backend Email Format Validation Missing
- **Severity:** Medium
- **Files:**
  - [`backend/src/models/User.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/models/User.js#L11-L16)
  - [`backend/src/controllers/authController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/authController.js#L16-L24)
- **Description:** Neither the schema nor the controller verifies email syntax. A user can register with `email: "not-an-email"`.
- **Live Reproduction:** `POST /api/auth/signup` with `{ email: "not-an-email" }` successfully registers the user.
- **Expected:** Add regex email validation `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` in both controller and schema.

---

### Bug BE-06: `POST /api/auth/signup` Response Omits `user.created_at`
- **Severity:** Low
- **File:** [`backend/src/controllers/authController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/authController.js#L55-L59)
- **Description:** In `authController.js`, `login` returns `created_at: user.created_at`, but `signup` returns only `{ id, name, email }`. When a newly registered user immediately views their profile in the frontend, `user.created_at` is undefined, causing the frontend to fall back to a hardcoded string.
- **Expected:** Return `created_at: user.created_at` in the signup response payload.

---

### Bug BE-07: String Boolean Coercion Flaw in `createNote` and `updateNote`
- **Severity:** Low
- **File:** [`backend/src/controllers/noteController.js`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/backend/src/controllers/noteController.js#L87-L116)
- **Description:** `is_pinned: Boolean(isPinned)`. In JavaScript, `Boolean("false") === true`. If a client submits a form with multipart or stringified boolean `"false"`, the note is pinned instead of unpinned.
- **Expected:** Use `isPinned === true || isPinned === 'true'`.

---

## 2. Frontend Bugs & State Management Issues

### Bug FE-01: React 19 Warning: `Cannot update a component ('AuthProvider') while rendering a different component ('DashboardPage')`
- **Severity:** High
- **File:** [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L95-L99)
- **Description:** Inside `handleDeleteNote`, the state update is written as:
  ```javascript
  setNotes((prev) => {
    const updated = prev.filter((n) => (n.id || n._id) !== noteId);
    if (setNoteCount) setNoteCount(updated.length); // BAD: Updating parent state inside child state updater
    return updated;
  });
  ```
  Updating `AuthProvider`'s state synchronously inside `setNotes` causes React 19 to trigger a console warning and can lead to inconsistent render cycles and state tearing.
- **Expected:** Call `setNoteCount(updatedNotes.length)` outside the state updater or derive `noteCount` from notes array using a `useEffect`.

---

### Bug FE-02: `Invalid Date` Rendered on Note Cards When Timestamps are Missing
- **Severity:** Medium
- **File:** [`frontend/src/components/notes/NoteCard.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/notes/NoteCard.jsx#L14)
- **Description:** `NoteCard` renders the date using:
  ```javascript
  const formattedDate = new Date(note.updated_at || note.created_at).toLocaleDateString(...);
  ```
  If an imported note or mock note does not have `updated_at` or `created_at`, `new Date(undefined)` evaluates to an invalid Date object, rendering the literal text `"Invalid Date"` on the note card footer.
- **Expected:** Guard with `const dateVal = note.updated_at || note.created_at; const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString(...) : 'Recently';`.

---

### Bug FE-03: Raw HTML Entities Rendered in Note Card Preview Text
- **Severity:** Medium
- **File:** [`frontend/src/components/notes/NoteCard.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/notes/NoteCard.jsx#L10-L12)
- **Description:** The preview text is generated with:
  ```javascript
  const plainTextContent = note.content
    ? note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : 'No content';
  ```
  This strips HTML tags, but leaves raw encoded HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`). A note containing `"React &amp; Vite"` shows `"React &amp; Vite"` rather than `"React & Vite"`.
- **Expected:** Decode entities using a DOMParser or safe textarea decoding method.

---

### Bug FE-04: Search Debounce Triggers Aggressive Full-Screen Loading Flicker
- **Severity:** Medium
- **File:** [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L41-L63)
- **Description:** Inside `fetchNotes`, `setLoading(true)` is called immediately. Every time the user types a character in the search bar, after the 250ms debounce, `loading` becomes `true`, which completely unmounts the note grid and shows the full-screen `<RefreshCw className="spin" /> Loading your notes...` indicator. This causes severe UI flicker and ruins the user's scroll position.
- **Expected:** Only show the full spinner on initial page load; for searches, show a subtle inline spinner inside the search input or keep the previous grid visible during background re-fetching.

---

### Bug FE-05: Missing Sanitization / Stored XSS Exposure in Rich Text Editor
- **Severity:** High
- **Files:**
  - [`frontend/src/components/editor/RichTextEditor.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/editor/RichTextEditor.jsx#L25-L29)
  - [`frontend/src/components/notes/NoteEditorModal.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/notes/NoteEditorModal.jsx#L173)
- **Description:** In `RichTextEditor.jsx`:
  ```javascript
  editorRef.current.innerHTML = value || '';
  ```
  Raw HTML strings from the database (or from imported JSON files) are inserted directly into `contentEditable` via `innerHTML` without DOMPurify or tag whitelisting. If an imported JSON contains `<img src=x onerror=alert(1)>`, script execution occurs when the modal is opened.
- **Expected:** Sanitize HTML content with `DOMPurify.sanitize()` before passing it to `innerHTML`.

---

### Bug FE-06: Fast Refresh Warning in `AuthContext.jsx` (Linter & Build Warning)
- **Severity:** Low
- **File:** [`frontend/src/context/AuthContext.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/context/AuthContext.jsx#L110)
- **Description:** `oxlint` warns:
  `react(only-export-components): Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components.`
  Exporting both `AuthProvider` (component) and `useAuth` (custom hook) in the same file breaks React Fast Refresh hot-reloading during development.
- **Expected:** Either separate `useAuth` into `useAuth.js` or configure lint exemption.

---

### Bug FE-07: `noteCount` Out of Sync When Viewing Profile Modal from Non-Dashboard Views
- **Severity:** Low
- **File:** [`frontend/src/context/AuthContext.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/context/AuthContext.jsx#L12)
- **Description:** `noteCount` is stored in `AuthContext` state, but it is only updated when `DashboardPage` loads. If an authenticated user clicks "Product Overview" (Landing page) and opens their Profile modal, `Total Notes` displays `0` because `noteCount` was never loaded from an initial API call.
- **Expected:** Initialize `noteCount` when fetching `/api/auth/me` or fetch note count directly.

---

### Bug FE-08: Deprecated `document.execCommand` and Inconsistent Block Formatting
- **Severity:** Low
- **File:** [`frontend/src/components/editor/RichTextEditor.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/editor/RichTextEditor.jsx#L39-L53)
- **Description:** The rich text editor uses `document.execCommand('formatBlock', false, '<h2')`. This API is deprecated by W3C and behaves inconsistently between Chromium and Firefox. Additionally, clicking "Clear Formatting" does not reset headings back to standard paragraphs.

---

## 3. UI Misalignments & Styling Bugs

### UI-01: Container Width Misalignment between Navbar (`1080px`) and Dashboard (`1280px`)
- **Severity:** High
- **Files:**
  - [`frontend/src/styles/index.css`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/styles/index.css#L239) (`.nav-pill-wrapper { max-width: 1080px; }`)
  - [`frontend/src/App.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/App.jsx#L25) (`maxWidth: '1280px'`)
  - [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L179) (`maxWidth: '1280px'`)
  - [`frontend/src/styles/index.css`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/styles/index.css#L112) (`.container { max-width: 1080px; }`)
- **Visual Issue:** On wide displays (1440px+), the floating stadium Navbar is `1080px` wide, while the sub-nav bar and Dashboard notes grid expand to `1280px`. As a result, the notes grid sticks out by 100px on both sides, creating a noticeable staggered alignment.
- **Recommended Fix:** Unify the container widths. Either adjust `.nav-pill-wrapper` to `max-width: 1280px` or set `DashboardPage` and the sub-bar to `1080px`.

---

### UI-02: Mobile Navbar Pill Burst / Overflow on Viewports < 400px
- **Severity:** High
- **File:** [`frontend/src/components/layout/Navbar.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/layout/Navbar.jsx#L11-L45)
- **Visual Issue:** On mobile viewports (e.g., iPhone SE 375px width), the navigation stadium pill contains:
  - App icon + "NotionFlow" wordmark (approx. 130px)
  - Dark/light theme toggle button (approx. 32px)
  - User button with avatar circle + full user name (e.g. "QA Auditor" approx. 130px)
  - Logout icon button (approx. 32px)
  - Gaps and internal padding (approx. 60px)
  Total required width exceeds 380px. Because `white-space: nowrap` and `border-radius: var(--rounded-full)` are used, elements wrap awkwardly onto multiple lines, which distorts the stadium pill container.
- **Recommended Fix:** Hide the user name on mobile (`display: none` below 640px), showing only the user's avatar icon circle next to the theme toggle.

---

### UI-03: Dashboard Notes Grid Horizontal Overflow on Narrow Screens (< 360px)
- **Severity:** Medium
- **File:** [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L405-L444)
- **Visual Issue:** The grid is styled with:
  ```javascript
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
  ```
  On a 320px or 360px viewport with `padding: 24px` on each side, the available screen width is 272px – 312px. The card forces a minimum width of `320px`, causing horizontal scrolling on small phones.
- **Recommended Fix:** Use `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`.

---

### UI-04: Brand Logo in Navbar Uses Dead Link `#` Causing Scroll Jump
- **Severity:** Medium
- **File:** [`frontend/src/components/layout/Navbar.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/layout/Navbar.jsx#L14-L15)
- **Visual Issue:** The brand link is `<a href="#">`. Clicking it does not navigate home or toggle views; instead, it appends `#` to the browser URL and jolts the scroll position to the top of the viewport.
- **Recommended Fix:** Replace with a button or handle click with `e.preventDefault()`.

---

### UI-05: Dark Mode Card Contrast & Border Inconsistency
- **Severity:** Low
- **File:** [`frontend/src/styles/index.css`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/styles/index.css#L77-L82)
- **Visual Issue:** In dark mode, `.card-canvas` has `background-color: var(--canvas)` (`#090a0f`), which is identical to the page background (`#090a0f`). Its border is `--hairline-soft` (`#1e2330`), which has an extremely low contrast ratio (~1.2:1), making card edges almost imperceptible on standard monitors.
- **Recommended Fix:** Give `.card-canvas` a slightly elevated background in dark mode, such as `var(--canvas-soft)` (`#12151e`).

---

### UI-06: Category Badge Discrepancy between Landing Page Features and Filter List
- **Severity:** Low
- **Files:**
  - [`frontend/src/components/landing/CaptureSpotlight.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/landing/CaptureSpotlight.jsx#L42) (`#Reflections`)
  - [`frontend/src/components/landing/OrganizeSpotlight.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/landing/OrganizeSpotlight.jsx#L59) (`#Travel`, `#Reading Notes`, `#Recipes`)
  - [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L18) (`CATEGORIES = ['All', 'General', 'Work', 'Personal', 'Ideas', 'Study', 'Meeting']`)
- **Visual Issue:** The marketing landing page highlights categories like `#Reflections`, `#Travel`, `#Reading Notes`, and `#Recipes`. However, the dashboard hardcodes a completely different fixed list of categories. Any imported notes tagged `#Travel` cannot be filtered using the category pills.

---

### UI-07: Blocking Native Browser Dialogs (`window.confirm`, `window.alert`) Clash with Design
- **Severity:** Medium
- **File:** [`frontend/src/pages/DashboardPage.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/pages/DashboardPage.jsx#L92-L165)
- **Visual Issue:**
  - Deleting a note calls `window.confirm('Are you sure you want to delete this note?')`.
  - Importing notes calls `alert(res.message || 'Notes imported successfully!')`.
  - Export errors call `alert(...)`.
  These native operating system alert popups freeze JavaScript execution, block animations, and clash heavily with the custom Mobbin design system.
- **Recommended Fix:** Replace with a custom non-blocking confirmation dialog and toast notifications.

---

### UI-08: Modal Horizontal Padding Compresses Form Controls on Small Mobile Screens
- **Severity:** Low
- **File:** [`frontend/src/styles/index.css`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/styles/index.css#L380-L389)
- **Visual Issue:** `.modal-content` specifies `padding: var(--space-8)` (32px). On a 360px screen with overlay padding of 20px, the modal has `(20 * 2) + (32 * 2) = 104px` of horizontal whitespace, leaving only 256px for text inputs and buttons.
- **Recommended Fix:** Add a media query `@media (max-width: 480px) { .modal-content { padding: 20px 16px; } }`.

---

### UI-09: Rich Text Editor Toolbar Overflow on Mobile
- **Severity:** Low
- **File:** [`frontend/src/components/editor/RichTextEditor.jsx`](file:///d:/NotionFlow/cohort-9-mern-11809-ahtisham/frontend/src/components/editor/RichTextEditor.jsx#L68-L77)
- **Visual Issue:** The rich editor toolbar has 10 buttons and 3 vertical separators in a single row with `flex-wrap: wrap`. On phones, the buttons break across 3 to 4 lines, consuming over 140px of vertical space before the user can even see the note text area.
- **Recommended Fix:** Use `overflow-x: auto` with `flex-wrap: nowrap` for a smooth horizontal-scrolling toolbar on mobile.

---

## 4. Places Where User Feedback / Messages Should Be Added

The application frequently performs critical state-changing actions silently, leaving the user unsure whether their operation succeeded or failed. Below is the complete catalog of locations requiring user-facing messages:

| Area / Action | Current Behavior | Problem / UX Friction | Recommended Message / Feedback |
| :--- | :--- | :--- | :--- |
| **1. User Registration (Signup)** *(User Requested)* | The Auth Modal abruptly unmounts and closes. The dashboard immediately renders with zero acknowledgement. | High ambiguity: The user does not know if their account was actually created or if the modal just dismissed. | Show a success toast/banner: **"Account created successfully! Welcome to NotionFlow, [Name]."** |
| **2. User Login** | The Auth Modal closes immediately. | The user experiences a sudden screen switch without login confirmation. | Show a toast: **"Logged in successfully. Welcome back!"** |
| **3. User Logout** | Clicking the logout icon instantly clears token and resets user state to null. | No confirmation dialog and no departure feedback; easy to trigger accidentally. | Show a toast: **"You have been logged out of your workspace."** |
| **4. Note Creation** | Clicking "Create Note" saves to DB, closes modal, and refreshes list. | No visual feedback that the new note was saved. | Show a toast: **"Note created successfully."** |
| **5. Note Edit / Update** | Clicking "Save Changes" closes the modal and re-fetches. | User has no confirmation that edits were persisted. | Show a toast: **"Note updated successfully."** |
| **6. Note Deletion** | Native `window.confirm` dialog pops up. If confirmed, note disappears silently. | Native modal looks unstyled, and there is no post-deletion toast or undo option. | Show a non-blocking toast: **"Note deleted."** with an **Undo** action button. |
| **7. Pin / Unpin Note** | Icon color changes from gray to blue or vice-versa. | In long lists, the note jumps to the top section with no notification. | Show a toast: **"Note pinned to top"** or **"Note unpinned"**. |
| **8. Export Notes** | Browser file download starts silently in the background. | On slow connections, user doesn't know if export succeeded or was blocked by a popup blocker. | Show a toast: **"Export complete. Your notes were downloaded as JSON."** |
| **9. Import Notes** | Displays a blocking browser native `window.alert(...)`. | Archaic alert box interrupts user flow. | Replace with modern toast: **"Import successful! [X] notes added to your workspace."** |
| **10. Session Expiration** | If JWT expires, `restoreSession` silently removes token and shows guest view. | User is suddenly logged out while working without understanding why. | Show an alert toast: **"Your session has expired. Please log in again."** |

---

## 5. Automated Test Suite & Live Reproduction Results

### Automated Backend Tests
- **Sinon/Supertest Suite (`backend/test/*.test.js`):** 17/17 tests passing (Mocked MongoDB).
- **Live Integration API Audit Suite (`scratch/api_test_suite.js`):** Run against live MongoDB Atlas instance:
  - `POST /api/auth/signup` with empty payload: PASSED (400)
  - `POST /api/auth/signup` with invalid email format: **FAILED (Accepted invalid email, created user)**
  - `POST /api/auth/signup` with 3-char password: **FAILED (Accepted short password, created user)**
  - `POST /api/auth/signup` response structure: **FAILED (`created_at` missing)**
  - `GET /api/notes?search=(unclosed[regex`: **FAILED (500 SyntaxError regex crash)**
  - `GET /api/notes/invalid-id`: **FAILED (500 CastError instead of 400/404)**
  - `PUT /api/notes/<id>` with empty title: **FAILED (500 ValidationError instead of 400)**
  - `POST /api/notes/import/all` with empty title note: **FAILED (500 ValidationError instead of 400)**
  - Cross-user note isolation: **PASSED (404 Unauthorized)**

### Automated Frontend Tests
- **Vitest Unit Suite (`frontend/src/test/`):**
  - `RichTextEditor.test.jsx`: 2/2 tests PASSED
  - `NoteCard.test.jsx`: 5/5 tests PASSED
  - `AuditScenarios.test.jsx`: 6/6 tests PASSED
    - Form validation rejection in `AuthModal`: PASSED
    - Absence of post-registration toast: **CONFIRMED (Zero toast/alert elements rendered after signup)**
    - NoteCard `Invalid Date` render bug: **CONFIRMED**
    - NoteCard unescaped HTML entities bug: **CONFIRMED**
    - React 19 `Cannot update a component ('AuthProvider') while rendering a different component ('DashboardPage')`: **CONFIRMED**

---

## 6. Remediation Roadmap

### Priority 1: High Impact (Backend Crashes & Security)
1. **Sanitize search input:** Escape regular expression symbols in `noteController.js`.
2. **Handle Mongoose `CastError` & `ValidationError` in `errorHandler.js`:** Return clean status `400` with clear JSON error messages instead of falling back to `500`.
3. **Validate password length & email format in `authController.signup`:** Enforce minimum 6 characters and valid email format before hashing.
4. **Sanitize rich text content:** Add `DOMPurify` before rendering HTML in `RichTextEditor.jsx`.

### Priority 2: Medium Impact (User Experience & Feedback Toasts)
1. **Implement Toast Notification System:** Create a lightweight `ToastContext` / `<ToastContainer />` with success, error, and info toasts.
2. **Add Post-Registration Feedback:** After `signup` resolves, trigger `toast.success("Welcome to NotionFlow! Your account has been created.")`.
3. **Add CRUD Toasts:** Add toast notifications for note creation, note update, note deletion, pin toggle, export, and import.
4. **Fix React 19 State Warning in `DashboardPage.jsx`:** Decouple `setNoteCount` from the `setNotes` functional updater.
5. **Fix NoteCard `Invalid Date` and HTML entities:** Add null-checking and HTML entity decoding in `NoteCard.jsx`.

### Priority 3: Visual Polish & Responsive Alignment
1. **Unify Layout Max-Widths:** Set both the Navbar container and the Dashboard container to a consistent `1200px` or `1280px`.
2. **Mobile Nav Optimization:** Hide the user display name on screens below 640px, keeping only the circular avatar.
3. **Mobile Notes Grid Width:** Adjust CSS grid column definition to `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`.
4. **Replace Native `window.confirm`:** Build a sleek modal confirmation dialog for note deletion that matches the Mobbin styling.
