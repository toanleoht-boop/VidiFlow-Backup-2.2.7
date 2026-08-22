import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  isSupportedImageContent,
  resolveAllowedLocalMediaPath,
  validateLocalRequest,
} from "../src/server/security/localRequestSecurity.ts";

test("allows same-origin requests on the local VidiFlow port", () => {
  assert.deepEqual(
    validateLocalRequest({
      host: "127.0.0.1:3105",
      origin: "http://127.0.0.1:3105",
      fetchSite: "same-origin",
    }),
    { allowed: true },
  );
});

test("allows local command-line clients without an Origin header", () => {
  assert.deepEqual(validateLocalRequest({ host: "localhost:3105" }), {
    allowed: true,
  });
});

test("blocks foreign hosts, cross-site requests and mismatched ports", () => {
  assert.equal(
    validateLocalRequest({ host: "192.168.1.10:3105" }).allowed,
    false,
  );
  assert.equal(
    validateLocalRequest({
      host: "127.0.0.1:3105",
      origin: "https://example.com",
    }).allowed,
    false,
  );
  assert.equal(
    validateLocalRequest({
      host: "127.0.0.1:3105",
      origin: "http://localhost:3000",
    }).allowed,
    false,
  );
  assert.equal(
    validateLocalRequest({
      host: "127.0.0.1:3105",
      fetchSite: "cross-site",
    }).allowed,
    false,
  );
});

test("serves only absolute media paths", () => {
  const imagePath = path.resolve("fixtures", "preview.jpg");
  assert.equal(resolveAllowedLocalMediaPath(imagePath), imagePath);
  assert.throws(
    () => resolveAllowedLocalMediaPath(path.resolve("fixtures", "secret.json")),
    /LOCAL_MEDIA_TYPE_NOT_ALLOWED/,
  );
  assert.throws(
    () => resolveAllowedLocalMediaPath("relative-preview.jpg"),
    /LOCAL_MEDIA_PATH_INVALID/,
  );
});

test("validates PNG, JPEG and WebP file signatures", () => {
  assert.equal(
    isSupportedImageContent(
      "image/png",
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    true,
  );
  assert.equal(
    isSupportedImageContent(
      "image/jpeg",
      Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]),
    ),
    true,
  );
  assert.equal(
    isSupportedImageContent(
      "image/webp",
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ),
    true,
  );
  assert.equal(
    isSupportedImageContent("image/png", Uint8Array.from([1, 2, 3, 4])),
    false,
  );
});
