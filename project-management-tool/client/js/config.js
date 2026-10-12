"use strict";

(() => {
  const configuredApiBaseUrl =
    window.TASKFLOW_API_BASE_URL || window.TASKFLOW_CONFIG?.apiBaseUrl;
  const isLocalFrontend = ["localhost", "127.0.0.1", "[::1]"].includes(
    window.location.hostname
  );
  const apiBaseUrl = configuredApiBaseUrl
    ? configuredApiBaseUrl
    : isLocalFrontend && window.location.port !== "5001"
      ? `http://${window.location.hostname}:5001/api`
      : "/api";

  window.TaskFlowConfig = Object.freeze({
    apiBaseUrl: apiBaseUrl.trim().replace(/\/+$/, "")
  });
})();
