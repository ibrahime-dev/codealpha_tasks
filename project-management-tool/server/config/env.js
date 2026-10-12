const parsePort = (value) => {
  if (value === undefined || value === "") {
    return 5001;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
};

const parseOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      let parsed;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error(`CLIENT_ORIGIN contains an invalid URL: ${origin}`);
      }

      if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
        throw new Error(`CLIENT_ORIGIN must contain only HTTP(S) origins: ${origin}`);
      }

      return parsed.origin;
    });

const parseApiBaseUrl = (value) => {
  const apiBaseUrl = (value || "/api").trim();
  if (!apiBaseUrl) {
    throw new Error("PUBLIC_API_BASE_URL must not be empty.");
  }

  if (apiBaseUrl.startsWith("/") && !apiBaseUrl.startsWith("//")) {
    return apiBaseUrl.replace(/\/+$/, "");
  }

  let parsed;
  try {
    parsed = new URL(apiBaseUrl);
  } catch {
    throw new Error("PUBLIC_API_BASE_URL must be a path such as /api or an absolute HTTP(S) URL.");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("PUBLIC_API_BASE_URL must use HTTP(S) and must not contain credentials, a query, or a fragment.");
  }

  return apiBaseUrl.replace(/\/+$/, "");
};

const parsePositiveInteger = (value, fallback, name, maximum) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }

  return parsed;
};

const loadConfig = (env) => {
  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to a private secret with at least 32 characters.");
  }

  const mongoUri = env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Set it in server/.env or the server environment.");
  }
  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error("MONGODB_URI must be a mongodb:// or mongodb+srv:// connection string.");
  }

  const host = env.HOST?.trim() || "0.0.0.0";
  if (/\s/.test(host)) {
    throw new Error("HOST must be a valid hostname or IP address.");
  }

  const retryBaseDelayMs = parsePositiveInteger(
    env.MONGODB_RETRY_BASE_DELAY_MS,
    1000,
    "MONGODB_RETRY_BASE_DELAY_MS",
    60000
  );
  const retryMaxDelayMs = parsePositiveInteger(
    env.MONGODB_RETRY_MAX_DELAY_MS,
    10000,
    "MONGODB_RETRY_MAX_DELAY_MS",
    60000
  );
  if (retryBaseDelayMs > retryMaxDelayMs) {
    throw new Error("MONGODB_RETRY_BASE_DELAY_MS must not exceed MONGODB_RETRY_MAX_DELAY_MS.");
  }

  return {
    clientOrigins: parseOrigins(env.CLIENT_ORIGIN || ""),
    host,
    jwtSecret,
    mongoRetryAttempts: parsePositiveInteger(
      env.MONGODB_RETRY_ATTEMPTS,
      5,
      "MONGODB_RETRY_ATTEMPTS",
      10
    ),
    mongoRetryBaseDelayMs: retryBaseDelayMs,
    mongoRetryMaxDelayMs: retryMaxDelayMs,
    mongoServerSelectionTimeoutMs: parsePositiveInteger(
      env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      5000,
      "MONGODB_SERVER_SELECTION_TIMEOUT_MS",
      120000
    ),
    mongoUri,
    port: parsePort(env.PORT),
    publicApiBaseUrl: parseApiBaseUrl(env.PUBLIC_API_BASE_URL)
  };
};

export default loadConfig;
