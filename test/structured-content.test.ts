import assert from "node:assert/strict";
import test from "node:test";
import { Result } from "result-type-ts";
import { structureContent } from "../src/tools/common";

test("keeps the existing success payload shape", () => {
  const response = structureContent(Result.success({ value: 42 }));

  assert.equal(response.isError, false);
  assert.deepEqual(response.structuredContent, {
    isError: false,
    errorMessage: undefined,
    data: { value: 42 },
  });
  assert.deepEqual(JSON.parse(response.content[0].text), {
    isError: false,
    data: { value: 42 },
  });
});

test("normalizes blank failure messages", () => {
  const response = structureContent(Result.failure("  \t  "));

  assert.equal(response.isError, true);
  assert.equal(
    response.structuredContent.errorMessage,
    "Vendr tool execution failed.",
  );
  assert.deepEqual(JSON.parse(response.content[0].text), {
    isError: true,
    errorMessage: "Vendr tool execution failed.",
  });
});

test("trims non-blank failure messages", () => {
  const response = structureContent(Result.failure("  API unavailable  "));

  assert.equal(response.structuredContent.errorMessage, "API unavailable");
});
