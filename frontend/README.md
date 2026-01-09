# CipherGuard Frontend

CipherGuard Dashboard is a full-featured web dashboard for parental control, built using React, TypeScript, Vite, and Tailwind CSS. It allows parents to monitor, manage, and protect their children’s online activity across devices with a simple and interactive interface.

This `frontend/` app consumes the CipherGuard backend REST API and presents a modern, responsive UI for parents.

## Key Features

- **User Authentication** – Secure login and signup via JWT-based authentication.
- **Parent Dashboard** – Displays parent information and (UI) notifications about children’s activity.
- **Child Profiles** – Add and manage multiple child profiles associated with a parent account.
- **Activity Monitoring** – Visualize browsing activity and time spent per child using stats and charts.
- **Device Protection UI** – UI for viewing and managing devices, with lock/shutdown and risk indicators (currently simulated on the client).
- **Real-time-style Notifications** – In-app notification center UI with mark-as-read and delete interactions.
- **Reports & Analytics UI** – Interfaces for generating and downloading reports about child activity.
- **Responsive & Modern Design** – Tailwind CSS plus shadcn-ui components for a clean, mobile-friendly layout.
- **Modular & Extensible** – Component-based structure for easy future feature additions.

## Technology Stack

- **Framework**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, custom CSS, shadcn-ui components
- **Routing**: React Router DOM
- **Data Fetching**: Fetch API and Axios (for some requests)
- **State**: React hooks + React Query (@tanstack/react-query)
- **UI & Visualization**: Lucide Icons, Recharts, custom toast hook (`use-toast`)

## Project Structure (High Level)

- `src/main.tsx` – App bootstrap.
- `src/App.tsx` – Providers (React Query, tooltip, toasters) and route configuration.
- `src/pages/`
  - `Index.tsx` – Marketing landing page.
  - `Dashboard.tsx` – Main parent dashboard, orchestrating child selection and views.
  - `signin.tsx`, `signup.tsx` – Auth pages.
  - `AddChild.tsx` – Create new child profiles.
  - `Contact.tsx`, `NotFound.tsx` – Supporting pages.
- `src/components/`
  - `Navbar`, `Footer`, `SectionHeading`, etc. – Layout and marketing components.
  - `DashboardControls`, `DashboardStats`, `DashboardPreview`, `ActivityMonitor`, `DeviceList`, `ProtectionStatus` – core dashboard modules.
  - `components/ui/*` – shadcn-ui primitives (buttons, dialogs, forms, toasts, etc.).
- `src/hooks/`
  - `use-toast`, `use-mobile` – shared hooks.
- `src/lib/utils.ts` – small utility helpers.

## Environment Configuration

The frontend needs to know where the backend API is hosted. Create a `.env` file in `frontend/` with:

```sh
VITE_BACKENDURL="http://localhost:5000" # or your deployed backend URL
```

All API calls are made relative to this base URL, e.g. `"${import.meta.env.VITE_BACKENDURL}/api/auth/login"`.

## Installation

From the repo root:

```sh
cd frontend
npm install
```

## Development

Start the Vite dev server:

```sh
npm run dev
```

By default Vite will run on `http://localhost:5173`.

Make sure the backend (`/backend`) is running and `VITE_BACKENDURL` points to it so that auth and dashboard data work correctly.

## Available Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Build the production bundle.
- `npm run build:dev` – Build using the `development` mode.
- `npm run preview` – Preview the built app locally.
- `npm run lint` – Run ESLint on the project.

## Authentication & Data Flow (Frontend View)

1. **Signup/Login** – Parents sign up or log in via the `/signup` and `/login` pages, which call the backend auth endpoints.
2. **Token Storage** – On success, a JWT is stored in `localStorage` under the key `token`.
3. **Authenticated Requests** – The dashboard and other protected views read this token and send it in the `Authorization: Bearer <token>` header when calling the backend.
4. **Dashboard Data** – `Dashboard.tsx` fetches parent info, child list, and various stats/activities, then passes data (or child email) down to components like `DashboardStats`, `DashboardPreview`, and `ActivityMonitor`.

## Goal

CipherGuard Dashboard is designed to empower parents with tools to ensure their children’s online safety. By combining real-time-style monitoring, protection toggles, and analytics in a single interface, it helps parents gain peace of mind while children explore the digital world safely.
