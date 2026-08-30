import test from "node:test";
import assert from "node:assert/strict";
import { canUseAutomationMode } from "../src/constants/licenseEntitlements.js";

test("Starter can use manual and preset but not full automation", () => {
  assert.equal(canUseAutomationMode("starter", "manual"), true);
  assert.equal(canUseAutomationMode("starter", "preset"), true);
  assert.equal(canUseAutomationMode("starter", "full"), false);
});

test("paid Pro, Agency and Lifetime plans can use every workflow", () => {
  for (const plan of ["monthly", "agency", "lifetime"] as const) {
    assert.equal(canUseAutomationMode(plan, "manual"), true);
    assert.equal(canUseAutomationMode(plan, "preset"), true);
    assert.equal(canUseAutomationMode(plan, "full"), true);
  }
});

test("trial can exercise every workflow before purchase", () => {
  assert.equal(canUseAutomationMode("trial", "manual"), true);
  assert.equal(canUseAutomationMode("trial", "preset"), true);
  assert.equal(canUseAutomationMode("trial", "full"), true);
});

test("inactive installations cannot run production workflows", () => {
  for (const mode of ["manual", "preset", "full"] as const) assert.equal(canUseAutomationMode("none", mode), false);
});
