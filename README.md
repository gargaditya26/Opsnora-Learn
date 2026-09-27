# OPSNORA LEARN

Gamified learning portal with this production architecture:

```text
Vercel frontend → Vercel same-origin API proxy → Google Apps Script API → Google Sheets
```

The existing Apps Script HTML web app remains available for compatibility, but students should use the Vercel URL. The spreadsheet is never accessed from the browser. Answers, XP, levels, streaks, badges, progress, and administrator authorization are calculated by Apps Script.

## Project structure

### Google Apps Script backend

- `Code.gs` — existing HTML entry point plus the allow-listed JSON API router.
- `Config.gs` — spreadsheet ID, timezone, level thresholds, and sheet schemas.
- `Utils.gs` — database and validation helpers.
- `Auth.gs` — hashed PIN verification and expiring/revocable sessions.
- `Quiz.gs` — next incomplete question and locked answer submission.
- `Gamification.gs` — XP ledger, levels, streaks, and badge awards.
- `Progress.gs` — student dashboard data.
- `Admin.gs` — authorized reports, manual XP, and question creation.
- `Setup.gs` — editor-only database/account maintenance.
- `Index.html`, `Styles.html`, `Scripts.html` — preserved legacy Apps Script UI.

### Vercel frontend

- `web/index.html` — Vite application shell.
- `web/src/main.js` — student/admin UI and page controllers.
- `web/src/styles.css` — responsive OPSNORA design system.
- `web/src/api.js` — the only browser-side API service.
- `api/backend.js` — Vercel serverless proxy to Apps Script.
- `vite.config.js`, `vercel.json` — build and route configuration.

`main.html` remains the standalone localStorage demo and does not use live Google Sheet data.

## Apps Script update

The initialized Google Sheet does not need to be recreated or modified. Existing rows and accounts are preserved.

1. Open the existing Apps Script project connected to the OPSNORA spreadsheet.
2. Replace its `Code.gs` with the updated local `Code.gs`.
3. Confirm the other existing `.gs` files match this repository. No sheet headers have changed.
4. Save the project.
5. Open **Deploy → Manage deployments**.
6. Edit the existing Web App deployment.
7. Select **New version** and deploy it.
8. Keep **Execute as: Me** and **Who has access: Anyone**.
9. Copy the final `/exec` Web App URL—not a `/dev` test URL.

You must create a new deployment **version**, but you do not need a separate Apps Script project or a new deployment URL. The existing URL normally remains unchanged.

Test the backend health endpoint:

```text
YOUR_APPS_SCRIPT_EXEC_URL?api=health
```

It should return JSON containing `"ok":true`.

## Environment configuration

The Apps Script URL is server-side configuration. It is intentionally not a `VITE_` variable because every `VITE_` value is embedded in the public browser bundle.

Copy `.env.example` to `.env.local` and set:

```env
APPS_SCRIPT_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Never commit `.env.local`. Do not put PINs, admin credentials, PIN hashes, or the spreadsheet ID in frontend files or Vercel variables.

## Run locally with the live backend

Requirements: Node.js 20+ and Vercel CLI.

```bash
npm install
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run dev
```

If the Vercel project is not configured yet, create `.env.local` manually from `.env.example` before `npm run dev`.

Open the URL shown by `vercel dev`, normally `http://localhost:3000`.

`npm run dev:ui` starts Vite alone on port 5173, but live API calls require the Vercel proxy. Use `npm run dev` for full login and quiz testing.

Validation commands:

```bash
npm run check
npm run build
npm run preview
```

## Deploy to Vercel

### Dashboard method

1. Push this folder to a Git repository. `.env.local`, `node_modules`, `dist`, and `.vercel` are ignored.
2. In Vercel, click **Add New → Project** and import the repository.
3. Vercel detects Vite from `vercel.json`; keep the project root as the repository root.
4. Under **Settings → Environment Variables**, add:
   - Name: `APPS_SCRIPT_API_URL`
   - Value: the Apps Script `/exec` deployment URL
   - Environments: Production, Preview, and Development
5. Deploy. Vercel runs `npm run build` and serves `dist`.
6. Open the Vercel domain at `/` or `/learn`.

### CLI method

```bash
npm install
vercel login
vercel
vercel env add APPS_SCRIPT_API_URL
vercel --prod
```

When prompted for the value, paste the Apps Script `/exec` URL without quotes. No deployment has been performed automatically by this repository.

## Login testing

### Student

1. Open the Vercel URL in an incognito window.
2. Sign in with Student ID `Aahana01` and its already configured PIN.
3. Confirm the dashboard loads existing XP and progress.
4. Submit one question and check `Attempts`, `Progress`, `XP_Log`, and `Students`.
5. Refresh and confirm the question and XP are not duplicated.
6. Sign in again and confirm the next incomplete question loads.

### Administrator

1. Sign out, then sign in with Admin ID `Teacher01` and its configured PIN.
2. Confirm the student table and student detail view load.
3. Award a small test XP amount and verify a new immutable `XP_Log` row.
4. Add a test question and verify it appears in `Questions`; set it to `Inactive` afterward if needed.

Never place real PINs in this README, source code, Git, or Vercel variables.

## API and security notes

- `Code.gs` accepts only an explicit action allow-list. It never accepts sheet names, row numbers, formulas, or arbitrary database operations.
- Protected actions call `requireSession_`; admin actions additionally require the `ADMIN` role.
- Correct answers are returned only after server-side submission validation.
- Quiz XP comes from the server-side Questions sheet.
- Submissions use `LockService`, and XP transactions are deduplicated.
- PINs remain SHA-256 hashes; plain-text PINs are never stored.
- The Vercel proxy keeps the Apps Script endpoint out of the public frontend bundle and avoids browser CORS/redirect issues.
- Session tokens are stored in localStorage for compatibility, hashed in the Sessions sheet, and expire according to `CONFIG.SESSION_HOURS`.

## Updating questions

Google Sheets remains the primary question-management method. Add rows to `Questions` using unique IDs and set `Status` to `Active`. New topics and questions are detected automatically. Set old questions to `Inactive` instead of deleting historical records.
