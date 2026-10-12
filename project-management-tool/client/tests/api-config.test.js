import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const clientDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const runClientScript = (scriptPath, { hostname, port, protocol = "http:", apiBaseUrl } = {}) => {
  const window = {
    location: {
      hostname,
      port,
      protocol,
      href: `${protocol}//${hostname}${port ? `:${port}` : ""}/index.html`
    }
  };

  if (apiBaseUrl) {
    window.TASKFLOW_API_BASE_URL = apiBaseUrl;
  }

  vm.runInNewContext(fs.readFileSync(path.join(clientDirectory, scriptPath), "utf8"), {
    window
  });

  return window;
};

test("static frontend on Live Server port 5500 uses the backend when runtime config is missing", () => {
  const window = runClientScript("js/config.js", {
    hostname: "localhost",
    port: "5500"
  });

  assert.equal(window.TaskFlowConfig.apiBaseUrl, "http://localhost:5001/api");
});

test("127.0.0.1 registration frontend on port 5500 targets the backend registration URL", async () => {
  const requests = [];
  const window = runClientScript("js/config.js", {
    hostname: "127.0.0.1",
    port: "5500"
  });
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;

  const registrationBody = {
    name: "TaskFlow Regression",
    email: "registration-regression@example.test",
    password: "valid-test-password"
  };

  vm.runInNewContext(fs.readFileSync(path.join(clientDirectory, "js/api.js"), "utf8"), {
    window,
    sessionStorage: { getItem: () => null, removeItem: () => {} },
    Headers,
    URL,
    AbortController,
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return {
        ok: true,
        status: 201,
        headers: { get: () => "application/json" },
        json: async () => ({ user: { email: registrationBody.email }, token: "test-token" })
      };
    }
  });

  const result = await window.TaskFlow.request("/auth/register", {
    method: "POST",
    body: JSON.stringify(registrationBody)
  });

  assert.equal(requests[0].url, "http://127.0.0.1:5001/api/auth/register");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(
    requests[0].options.headers.get("Content-Type"),
    "application/json"
  );
  assert.deepEqual(JSON.parse(requests[0].options.body), registrationBody);
  assert.equal(result.user.email, registrationBody.email);
  assert.equal(result.token, "test-token");
});

test("HTTPS localhost static frontend still uses the local HTTP backend", () => {
  const window = runClientScript("js/config.js", {
    hostname: "localhost",
    port: "5173",
    protocol: "https:"
  });

  assert.equal(window.TaskFlowConfig.apiBaseUrl, "http://localhost:5001/api");
});

test("backend-served frontend keeps its same-origin API path", () => {
  const window = runClientScript("js/config.js", {
    hostname: "localhost",
    port: "5001"
  });

  assert.equal(window.TaskFlowConfig.apiBaseUrl, "/api");
});

test("production frontend defaults to same-origin API and accepts an explicit deployment URL", () => {
  const sameOriginWindow = runClientScript("js/config.js", {
    hostname: "taskflow.example.com",
    port: "",
    protocol: "https:"
  });
  const separateApiWindow = runClientScript("js/config.js", {
    hostname: "taskflow.example.com",
    port: "",
    protocol: "https:",
    apiBaseUrl: "https://api.example.com/api"
  });

  assert.equal(sameOriginWindow.TaskFlowConfig.apiBaseUrl, "/api");
  assert.equal(
    separateApiWindow.TaskFlowConfig.apiBaseUrl,
    "https://api.example.com/api"
  );
});

test("task status update preserves PATCH and targets the backend API from a static localhost client", async () => {
  const requests = [];
  const window = runClientScript("js/config.js", {
    hostname: "localhost",
    port: "5173"
  });
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;
  window.location.assign = () => {};

  const sessionStorage = {
    getItem: (key) => key === "taskflow.token" ? "test-token" : null,
    removeItem: () => {}
  };
  const response = {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => ({ task: { status: "done" } })
  };

  vm.runInNewContext(fs.readFileSync(path.join(clientDirectory, "js/api.js"), "utf8"), {
    window,
    sessionStorage,
    Headers,
    URL,
    AbortController,
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return response;
    }
  });

  await window.TaskFlow.request("/tasks/example/status", {
    method: "PATCH",
    body: JSON.stringify({ status: "done" })
  });

  assert.equal(
    requests[0].url,
    "http://localhost:5001/api/tasks/example/status"
  );
  assert.equal(requests[0].options.method, "PATCH");
  assert.equal(
    requests[0].options.headers.get("Authorization"),
    "Bearer test-token"
  );
});

test("HTTP 405 identifies the rejected method, URL, and Allow header", async () => {
  const window = runClientScript("js/config.js", {
    hostname: "localhost",
    port: "5001"
  });
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;

  vm.runInNewContext(fs.readFileSync(path.join(clientDirectory, "js/api.js"), "utf8"), {
    window,
    sessionStorage: { getItem: () => null, removeItem: () => {} },
    Headers,
    URL,
    AbortController,
    fetch: async () => ({
      ok: false,
      status: 405,
      headers: { get: (name) => name === "allow" ? "GET, POST" : "text/html" },
      json: async () => null
    })
  });

  await assert.rejects(
    window.TaskFlow.request("/projects", { method: "PUT" }),
    /PUT http:\/\/localhost:5001\/api\/projects is not allowed \(HTTP 405\)\. Allowed methods: GET, POST\./
  );
});
