# TaskFlow Backend

This folder contains the Express API and MongoDB models for TaskFlow.

## Set up and run

1. Install Node.js 20 or newer and start MongoDB locally, or create a MongoDB Atlas database.
2. Open a terminal in `project-management-tool/server`.
3. Install the packages:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Set `MONGODB_URI` to your MongoDB connection string. Replace `JWT_SECRET` with a private random value of at least 32 characters. Do not share or commit `.env`.
6. Start the complete application:

   ```bash
   npm run dev
   ```

   The server retries MongoDB connection failures with bounded exponential backoff and only starts listening after the database is connected. It also serves the client, so open `http://localhost:5001/` rather than opening an HTML file or starting a second static server.

7. Check readiness at `http://localhost:5001/api/health/ready`. A successful response is:

   ```json
   { "status": "ready", "database": "connected" }
   ```

`/api/health/live` reports process liveness. `/api/health` remains available for compatibility and returns a non-success status when the database is disconnected. Use `npm start` to run without file watching; `npm run check` validates JavaScript syntax.

When a known API endpoint is called with an unsupported method, the API returns `405 Method Not Allowed` with an `Allow` header. Unknown API paths return `404`.

## Environment

See `.env.example` for all supported settings:

- `PORT` (default `5001`) and `HOST` (default `0.0.0.0`) configure where the app listens.
- `MONGODB_URI` and `JWT_SECRET` are required. The server exits with a clear error when either is invalid or missing.
- `PUBLIC_API_BASE_URL` is injected into the served frontend by `/runtime-config.js`; keep `/api` for same-origin hosting. For a separately hosted static client, inject `window.TASKFLOW_CONFIG.apiBaseUrl` in that client's deployment and set `CLIENT_ORIGIN` to its exact origin.
- `CLIENT_ORIGIN` is an optional comma-separated list of exact origins allowed to call the API cross-origin.
- MongoDB retry count, delay limits, and server-selection timeout have bounded defaults and can be adjusted with the `MONGODB_*` settings.

The server shuts down gracefully on `SIGINT` and `SIGTERM`, closing HTTP connections and MongoDB. An occupied port is reported as a startup error rather than triggering another server process.

Run `npm test` for API URL-selection, request-method, and method-not-allowed regression tests.

## Data models

Mongoose stores related document IDs as references:

- **User**: `name`, normalized `email`, and `passwordHash`. Password hashes are hidden from normal user queries. `createdAt` and `updatedAt` are added automatically.
- **Project**: `name`, `description`, `owner` (a User reference), and `members` (User references). A project owner is automatically allowed to access the project even though they do not need to be duplicated in `members`.
- **Task**: `title`, `description`, `status`, `project` (Project reference), `createdBy` (User reference), optional `assignedTo` (User reference), and optional `dueDate`. Status is limited to `todo`, `inProgress`, and `done`.
- **Comment**: `text`, `task` (Task reference), and `user` (User reference for the author).

All four models include automatic `createdAt` and `updatedAt` timestamps.

## API routes

Registration and login are public. Every other route requires this header:

```text
Authorization: Bearer YOUR_JWT
```

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register and receive a JWT |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/projects` | List projects you own or belong to |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/:projectId` | View an accessible project |
| `PUT` | `/api/projects/:projectId` | Edit a project (owner only) |
| `DELETE` | `/api/projects/:projectId` | Delete a project and its tasks/comments (owner only) |
| `POST` | `/api/projects/:projectId/members` | Add a member by email (owner only) |
| `DELETE` | `/api/projects/:projectId/members/:userId` | Remove a member (owner only) |
| `GET` | `/api/projects/:projectId/tasks` | List a project's tasks |
| `POST` | `/api/projects/:projectId/tasks` | Create a task |
| `GET` | `/api/tasks/:taskId` | View a task |
| `PUT` | `/api/tasks/:taskId` | Edit task details or assignment |
| `PATCH` | `/api/tasks/:taskId/status` | Change task status |
| `DELETE` | `/api/tasks/:taskId` | Delete a task and its comments (owner only) |
| `GET` | `/api/tasks/:taskId/comments` | List task comments |
| `POST` | `/api/tasks/:taskId/comments` | Add a task comment |

Project members can access project tasks and comments, create tasks, edit task details, and update task statuses. The project owner manages the project and membership and is the only user allowed to delete its tasks. An assignee must already be a project member or the project owner.

## Test with an API client

Postman or another HTTP client is beginner-friendly for trying these routes:

1. Send `POST http://localhost:5001/api/auth/register` with JSON:

   ```json
   {
     "name": "Alex Example",
     "email": "alex@example.com",
     "password": "a-long-password"
   }
   ```

   Copy the `token` from the response.
2. For protected routes, select **Bearer Token** authorization in the client and paste that token.
3. Send `POST http://localhost:5001/api/projects` with:

   ```json
   {
     "name": "Website launch",
     "description": "Tasks for the first release"
   }
   ```

   Copy the returned project `_id`.
4. Create a task with `POST http://localhost:5001/api/projects/PROJECT_ID/tasks`:

   ```json
   {
     "title": "Create the landing page",
     "description": "Build the first page",
     "status": "todo"
   }
   ```

5. Copy the task `_id`. Update its status with `PATCH http://localhost:5001/api/tasks/TASK_ID/status` and JSON:

   ```json
   { "status": "inProgress" }
   ```

6. Add a comment with `POST http://localhost:5001/api/tasks/TASK_ID/comments`:

   ```json
   { "text": "The layout is underway." }
   ```

Use the IDs returned by your own requests. To test authorization, register a second user and try accessing the first user's project before its owner adds the second user as a member; the API should return `403 Forbidden`.
