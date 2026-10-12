# TaskFlow Frontend

This client uses only HTML, CSS, and browser JavaScript. It does not use React, Vite, Vue, Angular, or a frontend framework.

## Start TaskFlow locally

1. Install Node.js 20 or newer and start MongoDB locally or through MongoDB Atlas.
2. In a terminal, open `project-management-tool/server`, install dependencies if needed, and copy `.env.example` to `.env`.
3. Set `MONGODB_URI` to your database URL and replace `JWT_SECRET` with a private random secret of at least 32 characters. Do not commit or share `.env`.
4. Start the complete app from the server directory:

   ```bash
   npm install
   npm run dev
   ```

   The backend validates its configuration, waits for MongoDB, and retries a bounded number of times before it starts accepting requests. It serves both the API and frontend from the same origin.
5. Open `http://localhost:5001/`. Do not open `index.html` directly as a `file://` URL. If you serve the static client separately on localhost (for example, VS Code Live Server on port `5500` or `5173`), `js/config.js` directs API requests to port `5001`; the exact client origin must also be listed in the backend's `CLIENT_ORIGIN`.

## Runtime configuration

- `PORT` selects the app's HTTP port (defaults to `5001`); `HOST` selects its bind address (defaults to `0.0.0.0`).
- `PUBLIC_API_BASE_URL` is the public API URL injected into the client at runtime. Keep `/api` for the combined same-origin app. A local static frontend uses `http://localhost:5001/api`. For a separately hosted production client, configure its runtime script to set `window.TASKFLOW_API_BASE_URL` to the public API URL and set `CLIENT_ORIGIN` to that exact client origin.
- `CLIENT_ORIGIN` is an optional comma-separated allowlist of exact frontend origins for a separately hosted client. The example includes `localhost` and `127.0.0.1` on ports `5500` and `5173`; same-origin hosting does not need CORS.
- MongoDB retries are bounded and use exponential backoff. Configure `MONGODB_RETRY_ATTEMPTS`, `MONGODB_RETRY_BASE_DELAY_MS`, `MONGODB_RETRY_MAX_DELAY_MS`, and `MONGODB_SERVER_SELECTION_TIMEOUT_MS` as needed.
- `/api/health/live` checks that the process is alive. `/api/health/ready` and `/api/health` check readiness, including the MongoDB connection.

## Try the main features

1. Select **Create an account** and register a user. The backend requires a name between 2 and 80 characters, a valid email, and a password between 8 and 128 characters.
2. Create a project from the dashboard.
3. On the project board, add tasks with a title, optional description, optional due date, and an assignee.
4. To try assigning a task to another user, open the app in a separate browser profile or private window, register a second user, and copy that user's email. Sign back in as the project owner, add the registered email in the **Project team** panel, then choose that teammate in a task's **Assign to** list.
5. Change status using the status dropdown on a task or drag its card to **To Do**, **In Progress**, or **Done**.
6. Open **Comments** on a task to read and post comments.
7. Edit or delete projects you own from their dashboard cards. Edit tasks from the board. Only the project owner can delete project tasks.

## API and session notes

- `js/config.js` and the server-generated `/runtime-config.js` centralize the API base URL. `js/api.js` adds auth headers, request timeouts, and explicit HTTP/network errors.
- `npm test` runs regression tests for API URL selection, preserving methods, and reporting 405 responses.
- The backend returns the JWT in the login/register JSON response and does not issue an HttpOnly cookie. For this learning app, the client keeps the token in `sessionStorage`, clears it when you log out, and never stores your password. Browser JavaScript can access session storage, so this is not a substitute for an HttpOnly cookie in a production app.
- The frontend does not contain the MongoDB URL or JWT signing secret. Those remain in the backend environment.
