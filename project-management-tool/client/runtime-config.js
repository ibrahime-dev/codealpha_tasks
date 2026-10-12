"use strict";

(() => {
  if (typeof window.TASKFLOW_API_BASE_URL === "string" && window.TASKFLOW_API_BASE_URL.trim()) {
    window.TASKFLOW_CONFIG = Object.freeze({
      apiBaseUrl: window.TASKFLOW_API_BASE_URL.trim()
    });
  }
})();
