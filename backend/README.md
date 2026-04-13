# Backend Structure

This backend is now scaffolded for `Express + PostgreSQL`.

Current setup:

- `src/server.js` starts the server
- `src/app.js` configures middleware and routes
- `src/config/db.js` creates the PostgreSQL pool
- `src/routes/auth.routes.js` contains auth endpoints
- `src/controllers/auth.controller.js` handles signup, login, and current-user logic
- `src/middleware/requireAuth.js` protects private routes
- `schema.sql` contains the PostgreSQL schema and starter admin account

Quick start:

1. Copy `.env.example` to `.env`
2. Create your PostgreSQL database
3. Run the SQL in `schema.sql`
4. Install dependencies with `npm install`
5. Start the server with `npm run dev`

Starter auth routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
