# CipherGuard Backend

The CipherGuard backend is a Node.js + Express API that powers the parental-control dashboard and monitoring features. It exposes REST endpoints for parent authentication, child profile management, and tracking of children’s browsing activity, backed by MongoDB via Mongoose.

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT) via `jsonwebtoken`
- `dotenv` for environment configuration
- `cors` for CORS handling

## Project Structure

- `server.js` – Express app entry point; sets up CORS, body parsers, MongoDB connection, and mounts routers.
- `routes/`
  - `authRoutes.js` – parent signup/login and current user route.
  - `parentRoutes.js` – parent-facing routes for managing and inspecting children.
  - `child.js` – child-centric stats and activity endpoints.
  - `monitorRoutes.js` – endpoints for URL monitoring, incognito alerts, and URL block checks.
- `controller/`
  - `authContoller.js` – register/login and current parent controller logic.
  - `parentContoller.js` – controllers for listing children, details, alerts, URLs, and block/unblock/reset actions.
  - `childController.js` – controllers for creating children and serving various stats and activity views.
  - `monitorController.js` – controllers that handle URL time tracking and incognito alerts.
- `models/`
  - `parent.js` – parent schema.
  - `child.js` – child schema, including monitored URLs and alerts.
  - `log.js` – generic log model (not heavily used yet).
- `middleware/`
  - `authMiddleware.js` – JWT verification for parent/child tokens.
  - `extensionAuth.js` – helper for verifying extension tokens (present but not fully wired in).
- `utillity/jwt.js` – helper for generating JWTs.

## Data Model Overview

### Parent

- `name` – parent’s name.
- `email` – unique email used for login.
- `password` – current implementation stores plain text (bcrypt integration is scaffolded but commented out).
- `children` – array of ObjectId references to `Child` documents.

### Child

- `name`, `email` – identifying information for the child.
- `extensionToken` – UUID token for associating browser extension traffic.
- `blockedUrls` – list of blocked URL substrings.
- `monitoredUrls` – array of URL entries with:
  - `url`, `domain`, `category`.
  - `dailyTimeSpent` – `Map<YYYY-MM-DD, seconds>` tracking time per day.
  - `lastUpdated` – timestamp for last activity.
- `incognitoAlerts` – list of `{ url, timestamp }` incognito events.

## API Overview

Base URL defaults to `http://localhost:5000` (configurable via `PORT`).

### Auth (`/api/auth`)

- `POST /api/auth/signup` – create a new parent account, returns a JWT.
- `POST /api/auth/login` – log in an existing parent, returns a JWT.
- `GET /api/auth/user` – get the current parent’s `{ name, email }` from the JWT (protected by `verifyToken`).

### Parent (`/api/parent`)

All routes under this prefix use `verifyToken` middleware.

- `GET /api/parent/children` – list children for the authenticated parent.
- `GET /api/parent/children/:id` – get details for a specific child.
- `GET /api/parent/children/:id/urls` – get monitored URLs for a child.
- `GET /api/parent/children/:id/alerts` – get incognito alerts for a child.
- `POST /api/parent/children/block` – block a URL for a child (`{ url, email }` in body).
- `POST /api/parent/children/:id/unblock` – unblock a URL for a child.
- `POST /api/parent/children/:id/reset` – reset time spent counters for monitored URLs for a child.

### Child (`/api/child`)

- `POST /api/child/add-child` – create a child linked to the authenticated parent and return a JWT for the child email (protected).
- `GET /api/child/all` – list all children for the authenticated parent (protected).
- Stats/endpoints keyed by child email:
  - `GET /api/child/web-usage/:email` – aggregate today’s total screen time.
  - `GET /api/child/alerts/:email` – return incognito alerts.
  - `GET /api/child/blocked/:email` – return count of blocked URLs.
  - `GET /api/child/web-usagefull/:email` – detailed usage per domain plus today’s total.
  - `GET /api/child/alertsfull/:email` – alerts with `{ message, timestamp }`.
  - `GET /api/child/blockedfull/:email` – list of blocked domains and total count.
- Filtered activity:
  - `POST /api/child/web-usage-filtered` – body `{ timeFrame, childEmail }`, returns normalized `activities` filtered by time window.
- Alerts maintenance:
  - `DELETE /api/child/delete-alerts/:email` – clear incognito alerts for a child.

### Monitor (`/api/monitor`)

These endpoints are designed for browser extensions or clients sending usage data.

- `POST /api/monitor/monitor-url` – (protected) increment time spent for a `domain`/`category` for the child referenced in the JWT.
- `POST /api/monitor/incognito-alert` – (protected) record an incognito-mode alert if not duplicated within the last 5 minutes.
- `POST /api/monitor/check-url` – (protected) check if a given URL is blocked for the child in the JWT.

## Environment Configuration

Create `backend/.env` with:

```sh
MONGO_URI="<your-mongodb-connection-uri>"
JWT_SECRET="<jwt-signing-secret>"
PORT=5000 # optional
```

## Installation and Development

Install dependencies:

```sh
cd backend
npm install
```

Run the development server:

```sh
npm run dev
```

The server will start on `http://localhost:5000` by default.

## Testing

A `test` script exists in `package.json` but is currently just a placeholder and will exit with an error. There are no automated backend tests configured yet.
