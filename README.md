# Project Management Application

Welcome to the **Total TPM** repository. This is a Next.js-based project designed to provide a robust and user-friendly platform for handling various project management tasks.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Build and Deployment](#build-and-deployment)
- [Available Scripts](#available-scripts)

---

## Prerequisites

Before you can run this project, ensure you have the following installed on your machine:

1. **Node.js** (Version 20 or higher) - [Download Node.js](https://nodejs.org/)
2. **npm** (Node Package Manager; typically included with Node.js installation)

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/aevan101/totaltpm.git
    ```

2. Navigate into the project directory:

    ```bash
    cd totaltpm
    ```

---

## Installation

To install the required dependencies, run the following command in the project directory:

```bash
npm install
```

This command will install all the necessary packages and dependencies listed in the `package.json`.

---

## Running the Application

### Development Mode

To run the project in development mode, use the command below. This will start the development server with hot reloading enabled:

```bash
npm run dev
```

Once the server is running, open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## Build and Deployment

To create a production build of the application, use the following command:

```bash
npm run build
```

The production-ready files will be generated in the `.next` directory. You can then start the server in production mode using:

```bash
npm run start
```

This will launch the application in production mode, and you can access it via [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

The stack is Next.js (React + TypeScript) with Tailwind CSS, all running on Node.js. There are no other languages involved — no Python backend, no SQL database, no native code.

## Backend Data Storage

The application uses a file-based JSON storage system with a client-side sync layer. There is no external database — all data lives in a single JSON file on the server.

### Architecture

```
Client (Browser)                        Server (Next.js API)
┌──────────────┐    fetch /api/data    ┌──────────────────────┐
│ useApiStorage├───────GET────────────►│ GET  /api/data       │
│   (hook)     │◄─────JSON─────────────│   → reads app-data   │
│              │                       │     .json            │
│              │───────PUT────────────►│ PUT  /api/data       │
│              │◄────success───────────│   → writes app-data  │
│              │                       │     .json            │
└──────┬───────┘                       └──────────┬───────────┘
       │                                          │
  React state                            data/app-data.json
  + debounced                            (single flat file)
    auto-save
```

### How It Works

1. **API Route** (`src/app/api/data/route.ts`) — A Next.js route handler that exposes two endpoints:
   - `GET /api/data` — Reads and returns the contents of `data/app-data.json`. If the file doesn't exist yet, it creates it with empty defaults.
   - `PUT /api/data` — Accepts a JSON body, validates that each top-level field is the correct type (arrays for collections, string or null for `currentProjectId`), and writes it to disk.

2. **Client API layer** (`src/lib/api.ts`) — Thin `fetch` wrappers (`loadData` and `saveData`) that call the API route and normalize the response with nullish-coalescing fallbacks.

3. **Sync hook** (`src/hooks/useApiStorage.ts`) — The `useApiStorage` React hook manages the full lifecycle:
   - Loads data from the API on mount.
   - Exposes an `updateData` function that updates React state immediately and triggers a **debounced save** (300ms) to the server.
   - On unmount, any pending unsaved data is flushed synchronously.

4. **localStorage utilities** (`src/lib/storage.ts`) — Legacy helper functions for `getFromStorage`, `setToStorage`, and `removeFromStorage`. These are still available but the primary persistence path now goes through the API.

### Data Shape

All application data is stored in a single flat JSON structure:

```json
{
  "projects": [],
  "columns": [],
  "cards": [],
  "tasks": [],
  "notes": [],
  "currentProjectId": null
}
```

Each array holds the full set of records for that entity type. Relationships are expressed via ID references (e.g., a task's `cardId` links it to a kanban card, a column's `projectId` links it to a project).

### Trade-offs

- **Simple to run** — No database setup, no migrations, no connection strings. Clone and `npm run dev`.
- **Single-user** — The flat-file approach is designed for individual use. Concurrent writes from multiple users would overwrite each other.
- **No partial updates** — Every save writes the entire data set. This keeps the code simple but means write size grows with data volume.

---

## Additional Configuration
This project uses **TypeScript** and **TailwindCSS** for styling:

1. **TypeScript**: No additional setup is required. You can start using `.tsx` and `.ts` files directly.
2. **TailwindCSS**: Configuration is already managed through the `postcss.config.mjs` and `tailwind.config.js` files. Customize these as per your design requirements.

---

## Available Scripts

The `package.json` includes the following scripts that you can use during development:

- `npm run dev` : Runs the application in development mode.
- `npm run build` : Builds the application for production.
- `npm run start` : Starts a production build of the application.
- `npm run lint` : Lints your codebase for any errors.

---

## Contributing

We welcome contributions! Please fork this repository, make your changes, and submit a pull request for review.

Feel free to check out the [issues section](https://github.com/aevan101/totaltpm/issues) and help us improve the project.

---

## License

This project is licensed under the terms described in the repository. Please check the LICENSE file for details.