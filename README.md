# Gymate – Gym Partner Matching Platform

Gymate is a location-aware social fitness application that connects compatible gym partners using swipe-based discovery, in-app chat, and safety tooling. This repository hosts the full-stack MVP, including a React Native (Expo) mobile client and a Node.js/Prisma backend API.

## Repository Structure

| Path | Description |
| --- | --- |
| `mobile/` | Expo React Native app that delivers onboarding, swipe experience, chat, and profile management. |
| `server/` | Express + Prisma API that powers auth, profile data, matching, chat, moderation, and analytics. |
| `PRD.md` | Product Requirements Document detailing market context, personas, and feature scope. |

## Key Features

1. **Swipe-based partner discovery** with filters for distance, fitness level, workout times, and goals.
2. **Real-time matches and chat** via Socket.IO channels scoped per match.
3. **Safety & trust controls** including block/report flows and optional verification signals.
4. **Actionable analytics hooks** to track match rates, retention, and premium conversion goals.

## Tech Stack

- **Mobile:** React Native (Expo), React Navigation, Redux Toolkit, Async Storage, deck-swiper UI, Socket.IO client.
- **Backend:** Node.js (Express), Prisma ORM, SQLite (default) with option to point to Postgres, Socket.IO, Redis (for rate limiting).
- **Tooling:** Nodemon for local API dev, Expo CLI for mobile builds.

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Expo CLI (`npm install -g expo-cli`) for running the mobile app locally
- SQLite (bundled) or another database accessible via Prisma datasource

## Setup

Clone the repo and install dependencies for each workspace:

```bash
git clone <repo-url> && cd Gymate

# Mobile client
cd mobile
npm install

# Server API
cd ../server
npm install
```

### Environment Variables

1. **Server** – Copy `.env.example` and update secrets as needed:

```bash
cd server
cp .env.example .env
```

- `DATABASE_URL` defaults to a local SQLite file (`file:./dev.db`). Point it to Postgres/MySQL for production.
- `JWT_SECRET`, OTP limits, and `REDIS_URL` must be customized before deployment.

2. **Mobile** – If the API is not running on `http://localhost:4000`, update any configuration files that reference the backend base URL (e.g., environment or config utilities inside `mobile/src`).

### Database

Prisma ships with a ready-to-use schema (`server/prisma/schema.prisma`). For local development:

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

This seeds/updates the SQLite database defined in `DATABASE_URL`. Switch the datasource in `schema.prisma` when targeting another database.

## Running Locally

1. **Backend API**

```bash
cd server
npm run dev
```

This starts Express on `http://localhost:4000` and mounts Socket.IO for chat rooms.

2. **Mobile App**

```bash
cd mobile
npm run start
```

Expo Dev Tools will open, allowing you to launch the app on iOS Simulator, Android Emulator, or the Expo Go app. Ensure the device can reach the backend URL defined in the mobile config.

## Useful Scripts

| Command | Location | Description |
| --- | --- | --- |
| `npm run dev` | `server/` | Starts the API with Nodemon + Socket.IO. |
| `npm run start` | `server/` | Runs the API in production mode. |
| `npm run start` | `mobile/` | Launches Expo for the React Native client. |
| `npm run android` / `ios` / `web` | `mobile/` | Platform-specific Expo starters. |
| `npm run prisma:migrate` | `server/` | Applies schema migrations in dev. |

## Documentation & Roadmap

- **PRD:** Refer to `PRD.md` for personas, success metrics, and prioritized backlog.
- **Future Enhancements:** Feature flags, media sharing in chat, advanced moderation automation, and monetization flows are outlined in the PRD for post-MVP phases.

## Contributing

1. Create a topic branch (`feat/…`, `fix/…`).
2. Ensure lint/test commands (when added) pass.
3. Submit a PR referencing relevant PRD sections or issues.

## License

This project is licensed under the MIT License (see `server/package.json`). Update or add a root-level license file if distribution requirements change.
