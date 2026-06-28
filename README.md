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

## Deployment on Render

Deploy as a static site. Use `admin-web` as the root directory.

Build command:

```bash
npm ci && npm run build
```

Publish directory:

```text
dist
```

Production environment variable:

```text
VITE_API_BASE_URL=https://your-backend-domain.onrender.com/api
```

For Render Blueprint deploys, this directory includes `render.yaml`. Set the
`VITE_API_BASE_URL` value in Render after creating the service.

This repository is independent from the mini program and backend repositories.
