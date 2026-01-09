# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This repository is a full-stack web application for a parental-control product branded as **CipherGuard**. It is organized as a simple JS/TS monorepo with:

- `backend/`: Node.js + Express + MongoDB API for authentication, children/parent relationships, URL monitoring, and alerts.
- `frontend/`: Vite + React + TypeScript + Tailwind + shadcn-ui marketing site and dashboard that consumes the backend API.

The frontend assumes a running backend instance exposed via a `VITE_BACKENDURL` environment variable.

## Running and building the project

All commands are run from the repo root unless noted.

### Backend (Express + MongoDB)

Install dependencies:

```sh path=null start=null
cd backend
npm install
```

Run the development server (plain Node.js):

```sh path=null start=null
cd backend
npm run dev
```

Notes:
- `npm run dev` runs `node server.js` (there is a `nodemon` devDependency but no script wired to it yet).
- The server listens on `process.env.PORT || 5000`.

Environment required for the backend (e.g. in `backend/.env`):

```sh path=null start=null
MONGO_URI="mongodb connection string"
JWT_SECRET="jwt signing secret"
PORT=5000 # optional, defaults to 5000
```

There are no real backend tests configured yet:
- `npm test` in `backend/` is the default placeholder that exits with status 1.

### Frontend (Vite + React + TypeScript)

Install dependencies:

```sh path=null start=null
cd frontend
npm install
```

Run the Vite dev server:

```sh path=null start=null
cd frontend
npm run dev
```

Build for production:

```sh path=null start=null
cd frontend
npm run build
```

Lint the frontend code:

```sh path=null start=null
cd frontend
npm run lint
```

Preview the production build locally:

```sh path=null start=null
cd frontend
npm run build
npm run preview
```

Environment required for the frontend (e.g. in `frontend/.env`):

```sh path=null start=null
VITE_BACKENDURL="http://localhost:5000" # or the deployed backend URL
```

The frontend does not define any test scripts; there is currently no configured way to run a single automated test.

## Backend architecture

### Entry point and HTTP layer

- `backend/server.js` is the main entry point.
- Uses Express with JSON and URL-encoded body parsers and CORS configured for:
  - Chrome extensions (`chrome-extension://*`),
  - ngrok tunnels (`https://*.ngrok-free.app`),
  - local dev origins (`http://localhost:3000`, `5173`, `5000`).
- Connects to MongoDB via `mongoose.connect(process.env.MONGO_URI)`; process exits on connection failure.
- Mounts feature routers under these base paths:
  - `/api/auth` → `routes/authRoutes.js`
  - `/api/parent` → `routes/parentRoutes.js`
  - `/api/child` → `routes/child.js`
  - `/api/monitor` → `routes/monitorRoutes.js`

### Data model

All models are standard Mongoose schemas under `backend/models/`:

- `parent.js`
  - Fields: `name`, `email` (unique), `password` (currently stored as plain text), `children` (ObjectId refs to `Child`).
- `child.js`
  - Top-level fields: `name`, `email` (unique), `extensionToken`, `blockedUrls` (string array), `monitoredUrls` (array of `urlSchema`), `incognitoAlerts` (array of `{ url, timestamp }`).
  - `urlSchema` tracks:
    - `url` and `domain`,
    - `category` (string),
    - `dailyTimeSpent` as a `Map<string, number>` keyed by date (`YYYY-MM-DD`),
    - `lastUpdated` timestamp.
- `log.js`
  - Generic activity log: `child` ref, `type`, `domain`, `timestamp`, `message`. Not heavily used by current routes.

### Auth and security model

- JWTs are used for both parent and child/extension authentication.
- `utillity/jwt.js` exposes `generateToken(email)` which signs `{ email }` with `JWT_SECRET` and `expiresIn: '7d'`.

#### Middleware

- `middleware/authMiddleware.js`
  - `verifyToken` reads the `Authorization: Bearer <token>` header.
  - Verifies the token with `JWT_SECRET` and attaches the decoded payload to `req.user`.
  - Used on most authenticated routes (e.g. parent and child APIs, monitor routes).

- `middleware/extensionAuth.js`
  - Intended for Chrome extension traffic.
  - Verifies a bearer token, looks up the `Child` by decoded `email`, and attaches the child document as `req.user`.
  - Currently defined but not wired into `monitorRoutes` (which instead uses standard JWT verification and manual decoding in `monitorController`).

#### Auth routes and controllers

- `routes/authRoutes.js` → `controller/authContoller.js`:
  - `POST /api/auth/signup` → `register`
    - Creates a `Parent` with `{ name, email, password }`.
    - Password hashing with `bcrypt` is present but commented out; passwords are currently stored in plain text.
    - Returns a JWT generated from the parent email.
  - `POST /api/auth/login` → `login`
    - Looks up parent by `email` and does a plain equality check on `password` (bcrypt compare is also commented out).
    - Returns a JWT.
  - `GET /api/auth/user` → `getParent`
    - Protected by `verifyToken`.
    - Reads `req.user.email`, looks up the `Parent`, and returns `{ name, email }`.

### Parent-facing APIs

- `routes/parentRoutes.js` uses `verifyToken` for all routes via `router.use(verifyToken)`.
- `controller/parentContoller.js` exposes:
  - `GET /api/parent/children` → `getAllChildren`
    - Finds the parent by `req.user.email` and populates the `children` field, returning an array of child profiles.
  - `GET /api/parent/children/:id` → `getChildDetails`
    - Returns a specific `Child` document.
  - `GET /api/parent/children/:id/urls` → `getChildUrls`
    - Returns `child.monitoredUrls` for that child.
  - `GET /api/parent/children/:id/alerts` → `getChildAlerts`
    - Returns `child.incognitoAlerts`.
  - `POST /api/parent/children/block` → `blockUrl`
    - Body: `{ url, email }`. Looks up the child by email and appends to `blockedUrls` if not already present.
  - `POST /api/parent/children/:id/unblock` → `unblockUrl`
    - Removes a specific URL from the child’s `blockedUrls`.
  - `POST /api/parent/children/:id/reset` → `resetTimeSpent`
    - Iterates over `monitoredUrls` and resets `timeSpent` for each (note: tracks `dailyTimeSpent` map; `timeSpent` field is separate).

### Child and monitoring APIs

- `routes/child.js` → `controller/childController.js`:
  - `POST /api/child/add-child` (protected) → `createChild`
    - Uses `req.user.email` to find the parent.
    - Creates a `Child` with `name`, `email`, `parent: parent._id`, and a UUID `extensionToken`.
    - Adds the child’s ObjectId to `parent.children` and returns a JWT for the child email.
  - `GET /api/child/all` (protected) → `getChildren`
    - Returns children for `req.user.id`.
  - Stats endpoints (currently unauthenticated in the router):
    - `GET /api/child/web-usage/:email` → `getWebUsageStats` (aggregates today’s time across `monitoredUrls` into a `totalTime` string like `"2h 15m"`).
    - `GET /api/child/alerts/:email` → `getAlerts` (returns `incognitoAlerts`).
    - `GET /api/child/blocked/:email` → `getBlockedStats` (returns `count` of blocked URLs).
    - `GET /api/child/web-usagefull/:email` → `getWebUsageStatsFull` (returns detailed per-domain usage for today and a human-readable total).
    - `GET /api/child/alertsfull/:email` → `getAlertsFull` (returns alerts with `{ message, timestamp }`).
    - `GET /api/child/blockedfull/:email` → `getBlockedStatsFull` (returns `blockedList` of domains and total count).
  - `POST /api/child/web-usage-filtered` → `getSearchActivities`
    - Body: `{ timeFrame, childEmail }` where `timeFrame` is `today | yesterday | week | month | ...`.
    - Computes `dateLimit` based on `timeFrame`, filters `child.monitoredUrls` by `lastUpdated >= dateLimit`, and returns normalized `activities` sorted by timestamp.
  - `DELETE /api/child/delete-alerts/:email` → `clearAlerts` (clears `incognitoAlerts`).

- `routes/monitorRoutes.js` → `controller/monitorController.js`:
  - `POST /api/monitor/monitor-url`
    - **Auth**: Uses `verifyToken` middleware plus manual JWT verification inside the controller.
    - Body: `{ domain, category = 'general', timeSpent = 60 }`.
    - For the child identified by email in the JWT:
      - Finds existing `monitoredUrls` entry by `domain` and increments `dailyTimeSpent[today]` by `timeSpent`, or
      - Pushes a new `monitoredUrls` object initialized with a `dailyTimeSpent` map containing today’s value.
  - `POST /api/monitor/incognito-alert`
    - **Auth**: `verifyToken`.
    - Body: `{ url }`.
    - Ensures that duplicate alerts for the same URL within the last 5 minutes are skipped, otherwise pushes a new entry into `incognitoAlerts`.
  - `POST /api/monitor/check-url`
    - **Auth**: `verifyToken`.
    - Body: `{ url }`.
    - Checks whether any `blockedUrls` entry for the child is a substring of `url` and returns `{ blocked: boolean }`.

These monitor endpoints are intended to be called from a browser extension or client-side code that tracks active URLs.

## Frontend architecture

The frontend is a Vite React TypeScript app organized under `frontend/src/`.

### Entry point, routing, and providers

- `src/main.tsx`
  - Mounts `<App />` into `#root` and imports global CSS.
- `src/App.tsx`
  - Creates a `QueryClient` (React Query) and wraps the app with:
    - `QueryClientProvider`,
    - `TooltipProvider` (shadcn UI),
    - `Toaster` and `Sonner` for toast/notification UIs,
    - `BrowserRouter` from `react-router-dom`.
  - Defines routes via `Routes`/`Route`:
    - `/` → `pages/Index`
    - `/dashboard` → `pages/Dashboard`
    - `/contact` → `pages/Contact`
    - `/login` → `pages/signin`
    - `/signup` → `pages/signup`
    - `/add-child` → `pages/AddChild`
    - `*` → `pages/NotFound`
  - Uses a `ScrollToTop` helper component to reset scroll on route changes.

### Layout and navigation

- `components/Navbar.tsx`
  - Fixed top navigation bar using `react-router-dom` for navigation plus manual smooth-scrolling to sections on the landing page (`features`, `how-it-works`, `pricing`, `faq`).
  - Reads the JWT from `localStorage` to decide whether to show a "Login" button.
  - Uses a responsive layout with a collapsible mobile menu.
- `components/Footer.tsx`
  - Shared footer (imported on the landing page and dashboard).
- `components/GridOverlay.tsx`
  - Visual background grid overlay used globally in `App`.

### Landing page (marketing)

- `pages/Index.tsx` is the marketing/landing page.
  - Uses `SectionHeading`, `FeatureCard`, `PricingCard`, `DashboardPreview`, `FAQ`, `Testimonial`, and `ShieldLogo` components to render:
    - Hero section with CTA,
    - Features grid,
    - "How it works" section reusing the dashboard preview,
    - Testimonials,
    - Pricing plans,
    - FAQ section,
    - Final CTA.
  - Section IDs (`features`, `how-it-works`, `pricing`, `faq`) are targets for in-page scrolling from the navbar.

### Auth and user flows

- `pages/signin.tsx`
  - Renders a login form using shadcn UI primitives.
  - On submit, POSTs to `${import.meta.env.VITE_BACKENDURL}/api/auth/login` with `{ email, password }`.
  - On success, stores `data.token` in `localStorage` under `"token"`.

- `pages/signup.tsx`
  - Renders a sign-up form for new parents.
  - On submit, POSTs to `${import.meta.env.VITE_BACKENDURL}/api/auth/signup` with `{ name, email, password }`.
  - On success, stores the returned JWT in `localStorage` and redirects to `/dashboard`.

- `pages/AddChild.tsx`
  - (Not fully detailed here) integrates with the backend `POST /api/child/add-child` to create child profiles, using the parent token.

### Dashboard and monitoring UI

`pages/Dashboard.tsx` orchestrates most of the interactive, data-driven frontend.

- On mount, it:
  - Reads the parent JWT from `localStorage`.
  - Builds an `Authorization: Bearer <token>` header.
  - In parallel, fetches:
    - Parent profile from `/api/auth/user`.
    - Children list from `/api/parent/children`.
    - A placeholder `/api/notifications` endpoint (not currently implemented on the backend).
  - Populates local state: `parentName`, `parentEmail`, `children`, `notifications`.
  - Tracks `selectedChildEmail` to drive child-specific stats and activity components.

The dashboard composes several subcomponents:

- `components/DashboardControls.tsx`
  - Left-side control panel for switching `activeView` between `overview`, `devices`, `protect`, `profiles`, `reports`, and `settings`.
  - Maintains small bits of UI state (e.g. elapsed time since last interaction, fake notification count, theme toggle) and uses the shared `toast` hook to provide feedback.

- `components/DashboardStats.tsx`
  - Receives `childEmail` and fetches summary stats directly from backend endpoints:
    - `GET /api/child/web-usage/:email` → total screen time today.
    - `GET /api/child/alerts/:email` → number of incognito alerts.
    - `GET /api/child/blocked/:email` → count of blocked domains.
  - Displays these in a responsive grid of stat cards.

- `components/DashboardPreview.tsx`
  - Receives `childEmail` and is responsible for more detailed metrics and charts.
  - Internal responsibilities include:
    - Creating a small `RealtimeChart` using Recharts to visualize screen time over the last several days.
    - Fetching alerts from `GET /api/child/alertsfull/:email` with auth.
    - Fetching detailed web usage from `GET /api/child/web-usagefull/:email` with auth, then:
      - Sorting sites by `lastUpdated` to find the most recent activity.
      - Computing simple per-category counts to visualize categories of sites visited.
    - Fetching blocked sites from `GET /api/child/blockedfull/:email` with auth and surfacing them in the UI.
    - Managing local state like `blockedWebsites`, `websiteCategories`, and associated UI for blocking/unblocking within the dashboard.

- `components/ActivityMonitor.tsx`
  - Receives `childEmail` and a `timeFrame` (`today | yesterday | week | month`).
  - Calls `POST /api/child/web-usage-filtered` with `{ childEmail, timeFrame }`.
  - Renders a scrollable table of normalized `activities` with icon, content, and timestamp for each item.

- `components/DeviceList.tsx`
  - Purely client-side simulated device list and controls (no backend integration yet).
  - Manages device lock/shutdown UI, filters, and sorting.

- `components/ProtectionStatus.tsx`
  - Simple presentational component that renders overall protection status (active vs disabled) with a CTA button; currently UI-only.

### UI library and utilities

- `components/ui/*`
  - Standard shadcn-ui component implementations (buttons, inputs, dialogs, toasts, etc.).
- `hooks/use-toast.ts`
  - Shared toast hook used throughout to display non-blocking notifications.
- `lib/utils.ts`
  - Utility helpers (e.g. class name merging) shared across components.
- `hooks/use-mobile.tsx`
  - Hook for responsive behavior on small screens.

### Environment and configuration

- `tsconfig.json`
  - Uses `baseUrl: '.'` with a path alias `@/*` mapped to `./src/*`.
  - Some strictness flags are relaxed (`noImplicitAny`, `noUnusedParameters`, `noUnusedLocals`, `strictNullChecks` are disabled).

### README status

- `frontend/README.md` currently contains merge-conflict markers between the default Vite template README and a Lovable-generated README.
- When editing documentation, prefer this `WARP.md` for up-to-date developer guidance and treat `frontend/README.md` as needing cleanup.

## Things to watch for when making changes

- **Auth and security**
  - Passwords are currently stored and compared in plain text (`authContoller.js`); be cautious when modifying auth logic, and consider adding proper hashing if you are tasked with improving security.
  - Several child stats endpoints are unauthenticated; if you tighten auth, you will need to update the frontend fetch calls to send JWTs.

- **Token and identity flow**
  - Parents authenticate via `/api/auth/login` and their JWT is stored in `localStorage` under `"token"`.
  - Parent-facing APIs derive identity from `req.user.email` or `req.user.id` (set by `verifyToken`).
  - The monitoring APIs rely on the email present in the JWT payload to find the correct child.

- **Date/time handling**
  - The backend uses `new Date().toISOString().split('T')[0]` to derive a `YYYY-MM-DD` key for `dailyTimeSpent` maps; any changes to this convention need corresponding updates wherever those maps are read.

- **Environment variables**
  - Frontend expects `VITE_BACKENDURL` to point to the root of the backend API (e.g. `http://localhost:5000`).
  - Backend expects `MONGO_URI` and `JWT_SECRET` to be configured before starting.

If you need to extend the system, align with the existing split:
- Add new HTTP endpoints in `backend/routes/*` with logic in `backend/controller/*` and data access in `backend/models/*`.
- Surface new features in the dashboard by composing additional components under `frontend/src/components` and wiring them into `pages/Dashboard.tsx` or new routes via `App.tsx`.