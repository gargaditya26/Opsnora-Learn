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

## Parent portal

Parent accounts use the same login form with the `PARENT` role and hashed PINs. A parent can only read students connected to that account through the `Parent_Students` sheet. The dashboard includes XP, level, solved questions, accuracy, current streak, earned badges, topic performance, quiz history, coding progress, teacher feedback, and selected-versus-correct answer review. Parent sessions cannot submit answers, award XP, reset progress, or call administrator actions.

To enable the module, copy `Parent.gs`, `ParentOperations.gs`, and the updated `Auth.gs`, `Code.gs`, `Config.gs`, `Utils.gs`, and `Setup.gs` into Apps Script. Run the public `setupDatabase()` wrapper once to safely create the missing parent, learning-session, and billing sheets; existing rows are not recreated or deleted. Deploy a new Apps Script version. Then sign in as an administrator on the website and use **Parent Accounts** to create a parent ID, set its initial PIN, and link the correct student.

The extended portal adds read-only Sessions, Assignments, Achievements, Reports, Billing & Plans, Profile, Change PIN, and Support pages. Because `Sessions` is already the authentication-session table, scheduled classes are stored separately in `Learning_Sessions`. Billing uses `Plans`, `Subscriptions`, `Invoices`, and `Payments`; setup only creates missing tabs and headers. Placeholder plan display labels live in `web/src/parent-config.js` and do not enforce entitlements.

Optional support details can be added as rows in `Settings` using keys `SUPPORT_EMAIL`, `SUPPORT_PHONE`, and `SUPPORT_WHATSAPP`. Empty values are not shown. No payment gateway or PDF generator is enabled; payments are recorded only through an explicit administrator action and PDF controls remain disabled.

## Calendar, notifications, and progress emails

Students and linked parents have a shared read-only learning calendar with month/week views, event details, and an upcoming-events list. The initial `Aahana01` schedule is seeded idempotently from `Setup.gs`; administrators can edit recurring rules, create dated learning sessions, and configure approved progress-email recipients from Parent Operations. Authentication sessions remain in `Sessions`; scheduled classes remain in `Learning_Sessions`.

In-app notifications persist read/unread state in `Notifications`. Progress emails are generated only by Apps Script after server-side learning events. They never include PINs, tokens, answer keys, or attachments. Parent email categories are enabled by default and can be changed from the parent profile. Failed email delivery is logged and never rolls back quiz, XP, assignment, badge, or streak updates.

To enable this module:

1. Copy new `CalendarNotifications.gs` and the updated `Code.gs`, `Config.gs`, `Setup.gs`, `Quiz.gs`, `Assignments.gs`, `Parent.gs`, and `ParentOperations.gs` into the existing Apps Script project.
2. Run public `setupDatabase()` once. It creates missing tabs/columns and seeds the recurring schedule without deleting existing rows.
3. Run `setupAutomationTriggers()` once and approve the requested Apps Script permissions. It creates one six-hour trigger for session/deadline reminders, weekly summaries, and failed-email retries.
4. Add the parent's real email in **Admin → Parent Accounts**. Optional mentor/teacher recipients can be enabled in **Admin → Parent Operations**.
5. Save, then publish a **new version** of the existing Web App deployment. The `/exec` URL normally remains unchanged.

New sheets are `ScheduleRules`, `Notifications`, `EmailLog`, `NotificationPreferences`, and `NotificationRecipients`. Existing `Parents` and `Learning_Sessions` gain appended contact and scheduling columns. Google Apps Script `MailApp` quotas apply; delivery status and errors are visible in the administrator communication log.

## Public information pages

The logged-out website includes public `/about`, `/privacy`, `/terms`, and `/contact` routes. These pages share the OPSNORA visual system and do not expose dashboards or learning data. The login page and each public page use the same information footer.

Optional public configuration:

```env
VITE_SUPPORT_EMAIL=support@example.com
VITE_ADSENSE_CLIENT_ID=
```

Only set `VITE_SUPPORT_EMAIL` after an official support mailbox exists. `VITE_ADSENSE_CLIENT_ID` is reserved for future integration; the current application does not load advertising scripts or render advertisements. Values prefixed with `VITE_` are public browser configuration and must never contain secrets or student information.

## Apps Script update

The initialized Google Sheet does not need to be recreated or modified. Existing rows and accounts are preserved.

1. Open the existing Apps Script project connected to the OPSNORA spreadsheet.
2. Update these Apps Script files from the repository: `Code.gs`, `Config.gs`, `Utils.gs`, `Setup.gs`, `Quiz.gs`, `Gamification.gs`, `Progress.gs`, and `Admin.gs`.
3. `Auth.gs` and the existing account records remain compatible and do not need migration.
4. Save the project, select `setupDatabase_`, and run it once. It preserves all existing rows and only creates missing quiz sheets/headers plus the `HTML Explorer` badge definition.
5. Confirm the new `Quiz_Runs` and `Quiz_Run_Answers` tabs exist. Do not manually edit their rows.
6. Open **Deploy → Manage deployments**.
7. Edit the existing Web App deployment.
8. Select **New version** and deploy it.
9. Keep **Execute as: Me** and **Who has access: Anyone**.
10. Copy the final `/exec` Web App URL—not a `/dev` test URL.

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

Questions are sorted deterministically by `QuestionID`. Practice filters them by Topic. Quizzes split each topic into groups of 10 without requiring a Quiz column: questions 1–10 become Quiz 1, 11–20 become Quiz 2, and so on. Normal question additions therefore require no frontend code changes.

## Practice, quizzes, and badge progress

- Practice completion continues using the existing `Attempts`, `Progress`, and `XP_Log` sheets.
- Every quiz start creates a `Quiz_Runs` row containing the frozen question-ID list for that run.
- Each submitted quiz answer appends a `Quiz_Run_Answers` row. Completed runs store score, correct/wrong totals, XP earned, and support best-score calculation and answer review.
- Retry creates a new run. Existing quiz XP deduplication still prevents farming XP for the same question.
- Badge progress is calculated server-side: XP badges use `Students.TotalXP`, correct-answer badges use `Students.CorrectAnswers`, streak badges use `Students.CurrentStreak`, completion badges use completed `Progress` rows, and topic badges match completed Progress question IDs against active Questions for that topic.
- Active questions use a safe 60-second Apps Script cache. Authentication, submissions, XP changes, and session data are never cached.

## Git update commands

```bash
git status
git add Code.gs Config.gs Utils.gs Setup.gs Quiz.gs Gamification.gs Progress.gs Admin.gs api web package.json package-lock.json vite.config.js vercel.json .env.example .gitignore README.md
git commit -m "Add practice quizzes badge progress and shared header"
git push origin main
```

If the Vercel project is connected to this GitHub branch, Vercel automatically creates a new deployment after the push. Confirm that `APPS_SCRIPT_API_URL` is already configured in Vercel before testing it.

## Coding Assignments migration

Update/copy these Apps Script files into the existing script.google.com project:

- `Code.gs`
- `Config.gs`
- `Setup.gs`
- `Progress.gs`
- `Gamification.gs`
- new `Assignments.gs`

The other backend files must remain present because the assignment approval flow reuses existing authentication, XP, level, and badge functions. After saving the files, run `setupDatabase_` once from the Apps Script editor. It safely creates and seeds the new sheets only when empty.

### Assignments columns

```text
AssignmentID, Title, Topic, Difficulty, ShortDescription, Instructions,
Requirements, StarterHTML, StarterCSS, XP, Order, Status, CreatedAt, UpdatedAt
```

### Assignment_Submissions columns

```text
SubmissionID, StudentID, AssignmentID, HTMLCode, CSSCode, Status, StartedAt,
LastSavedAt, SubmittedAt, ReviewedAt, ReviewedBy, XPAwarded, TeacherRemarks
```

No existing sheet is recreated, reordered, or deleted. Three beginner assignments are added only if `Assignments` is empty.

### Coding assignment test

1. Deploy a new Apps Script version and confirm the health endpoint.
2. Sign in as `Aahana01`, open **Coding Assignments**, and start `A001`.
3. Type HTML/CSS and click **Run Code**. The preview must appear only inside the iframe.
4. Click **Save Progress**, sign out, sign back in, and confirm **Continue Assignment** restores the saved code.
5. Submit it. Confirm no XP is awarded yet and the status is `Submitted`.
6. Sign in as `Teacher01`, open **Coding Assignments**, then review the submission.
7. Choose **Needs Revision** with remarks. Sign in as the student and confirm feedback/editing/resubmission work.
8. Review again and choose **Approve & Award XP**. Confirm `XP_Log`, `Students.TotalXP`, level, badges, and submission status update.
9. Attempt approval again. It must return the completed result without another XP transaction.

### Coding performance and security

- Assignment details and saved work load in one initial lab request.
- Manual save plus a 7-second debounce avoids saving on every keystroke; unchanged code is not sent.
- The dashboard assignment summary is included in the existing dashboard response.
- Student identity comes from the authenticated session, never from browser input.
- Admin review actions require an `ADMIN` session on the backend.
- Approval reads XP from `Assignments`; the browser cannot choose it.
- Both submission status/XPAwarded and the existing XP ledger deduplication protect against double awards.
- HTML/CSS preview uses an iframe with an empty `sandbox` attribute and a restrictive CSP. JavaScript, forms, navigation, same-origin access, and parent DOM access are not enabled.

### Git commands for the coding module

```bash
git status
git add Assignments.gs Code.gs Config.gs Setup.gs Progress.gs api/backend.js web/index.html web/src/api.js web/src/main.js web/src/styles.css README.md
git commit -m "Add coding assignments and secure coding lab"
git push origin main
```

With GitHub integration enabled, Vercel redeploys automatically after the push. Apps Script does not: manually use **Deploy → Manage deployments → Edit → New version → Deploy**. The existing `/exec` URL remains the same.
