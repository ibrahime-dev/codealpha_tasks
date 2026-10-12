import assert from "node:assert/strict";
import test from "node:test";
import methodNotAllowed from "../middleware/methodNotAllowed.js";

test("methodNotAllowed returns a 405 and Allow header for unsupported methods", () => {
  const headers = {};
  let statusCode;
  let responseBody;
  const response = {
    set(name, value) {
      headers[name] = value;
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  methodNotAllowed(["GET", "POST"])(
    { method: "PUT" },
    response
  );

  assert.equal(statusCode, 405);
  assert.equal(headers.Allow, "GET, POST, HEAD, OPTIONS");
  assert.equal(responseBody.message, "Method PUT is not allowed for this endpoint.");
  assert.deepEqual(responseBody.allowedMethods, ["GET", "POST", "HEAD", "OPTIONS"]);
});
