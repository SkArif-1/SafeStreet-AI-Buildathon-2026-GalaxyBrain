# SafeStreet AI — Backend API

Backend for the existing SafeStreet AI citizen/admin frontend. Express + SQLite; data persists locally in `data/safestreet.sqlite`.

## Start (Windows / VS Code)
1. Install Node.js 20+.
2. Extract this folder next to the frontend project.
3. Open terminal in `SafeStreetAI-backend`.
4. Run:
   ```bash
   npm install
   copy .env.example .env
   ```
   Open `.env` and set `JWT_SECRET` to a random secret of 32+ characters and change `ADMIN_PASSWORD`.
5. Start the server:
   ```bash
   npm run seed:admin
   npm run dev
   ```
   API health: `http://localhost:5000/api/health`

## Connect the static frontend
Use a local static server for HTML (VS Code Live Server is fine). Backend allows `FRONTEND_ORIGIN` in `.env`; set it to the actual Live Server origin (commonly `http://127.0.0.1:5500` or `http://localhost:5500`). Existing HTML still contains demo arrays/TODO markers and must be connected to these API endpoints to display live data. The backend is implemented; frontend wiring is a separate step.

## API overview
- `POST /api/auth/register` citizen registration: `{name,email,password,area}`
- `POST /api/auth/login` `{email,password,role}` → `{token,user}`
- `GET /api/auth/me` bearer token
- `POST /api/auth/forgot-password` `{email}` — reset link printed in server console for local demo; configure mail delivery before production
- `GET /api/auth/reset-password/:token`
- `POST /api/auth/reset-password` `{token,password}`
- `GET /api/reports` public report map feed; optional `status`, `category`, `limit`
- `POST /api/reports` authenticated multipart form: `category,description,lat,lng,image?`
- `GET /api/reports/:id` authenticated (owner or admin)
- `GET /api/my/reports` citizen's reports
- `PATCH /api/reports/:id/status` admin `{status,note}`
- `GET /api/admin/reports` admin filters: `status,category,severity,search`
- `GET /api/admin/analytics` admin metrics
- `GET /api/admin/reports/:id/history` admin status audit
- `GET /api/admin/users` admin user listing
- `GET /api/routes` route catalog + evidence dimensions
- `POST /api/routes/compare` `{from,to}`
- `POST /api/routes/:id/observations` authenticated `{dimension,score}`

Send `Authorization: Bearer <token>` on protected endpoints.

## Honest AI / data notes
- Report classification, severity and summary work with local transparent keyword rules by default. Add `OPENAI_API_KEY` to `.env` to activate the optional OpenAI classifier. The API stores provider/confidence and treats output as a suggestion, not verification.
- Route data and route observations are initially empty. No fabricated live city route or evidence records are seeded. Add verified routes/observations to SQLite before using route comparison; empty evidence returns limited/no-data output.
- Duplicate detection is a nearby-coordinate/category suggestion, not an automatic merge.
- Reset email is development console output, not production email delivery.
- Admin seed runs once and will not overwrite an existing admin.

## Security notes
Set production secrets, HTTPS, trusted frontend origin, durable upload storage and email provider before deployment. Add jurisdiction-appropriate privacy/retention rules and moderation process before collecting real public reports.
