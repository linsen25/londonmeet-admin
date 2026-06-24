# LondonMeet Admin

Vue 3 admin console for LondonMeet.

## Requirements

- Node.js 20+
- npm

## Local development

```powershell
npm install
npm run dev
```

The development server starts at `http://127.0.0.1:5173` and proxies `/api` requests to the backend.

## Build

```powershell
npm run build
```

Static deployment output is generated in `dist/`.

## Deployment

Deploy the `dist/` directory to a static hosting service and route `/api` to the deployed LondonMeet backend, or configure the production API base URL in your hosting environment.

This repository is independent from the mini program and backend repositories.
