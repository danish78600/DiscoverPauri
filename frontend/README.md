# Discover Pauri

Full-stack app:

- **Backend**: Express + MongoDB (Mongoose) + JWT auth + Cloudinary uploads
- **Frontend**: Vite + React + React Router

## Folder structure

- `backend/` – API server
- `frontend/` – web app

## Prerequisites

- Node.js 18+ (20+ recommended)
- A MongoDB database (MongoDB Atlas or local)
- Cloudinary account (required only for image uploads)

## Environment variables

### Backend (`backend/.env`)

Create a file `backend/.env` (do **not** commit it):

```env
# App
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/discover-pauri

# Auth
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

# Cloudinary (required for POST /api/uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=discover-pauri
```

### Frontend (`frontend/.env`)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Run locally (development)

### 1) Backend

From the repo root:

```bash
cd backend
npm install
npm run start
```

By default the API listens on `http://localhost:5000`.

### 2) Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173`).

## Seed sample treks (optional)

```bash
cd backend
npm run seed:treks
```

## Deploy (simple approach)

### Backend

Deploy the `backend/` as a Node web service.

You must set these environment variables in the hosting dashboard:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional)

Use a production start command like:

```bash
node src/index.js
```

### Frontend

Deploy the `frontend/` as a static site.

Build:

```bash
cd frontend
npm run build
```

Set the environment variable:

- `VITE_API_URL=https://<your-backend-host>`

If you want to run everything locally, set `VITE_API_URL=http://localhost:5000` instead.

Because this is an SPA using React Router, configure a rewrite so all routes serve `index.html`.

## Notes

- Secrets are intentionally ignored via `.gitignore`. Rotate any credentials that were previously committed.
