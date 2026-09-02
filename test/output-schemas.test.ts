import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import AjvDraft07 from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { makeServer } from "../src/server";

const toolNames = [
  "searchCompaniesAndProducts",
  "getCustomPriceEstimate",
  "getNegotiationInsights",
] as const;

test("all tool schemas are valid for draft-07 and 2020-12 clients", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        faqs: [{ question: "How should I negotiate?", answer: "<p>Ask.</p>" }],
        lastUpdatedAt: "2026-09-02T12:00:00.000Z",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const validators = [
      new AjvDraft07({ strict: true, allErrors: true }),
      new Ajv2020({ strict: true, allErrors: true }),
    ];
    validators.forEach(addFormats);

    for (const validator of validators) {
      const server = makeServer({
        apiKey: "test-api-key",
        baseUrl: "https://example.invalid",
        userIdentifyingHeaders: {},
      });
      const client = new Client(
        { name: "schema-regression-test", version: "1" },
        { jsonSchemaValidator: new AjvJsonSchemaValidator(validator) },
      );
      const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();

      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      try {
        const { tools } = await client.listTools();

        for (const toolName of toolNames) {
          const tool = tools.find(({ name }) => name === toolName);
          assert.ok(tool, `${toolName} should be advertised`);

          for (const schema of [tool.inputSchema, tool.outputSchema]) {
            assert.ok(schema);
            assert.equal(schema.$schema, undefined);
            assert.doesNotThrow(() => validator.compile(schema));
          }
        }

        const result = await client.callTool({
          name: "getNegotiationInsights",
          arguments: { companyId: "00000000-0000-4000-8000-000000000000" },
        });
        assert.equal(result.isError, false);
        assert.deepEqual(result.structuredContent, {
          isError: false,
          errorMessage: undefined,
          data: {
            faqs: [{ question: "How should I negotiate?", answer: "Ask." }],
            lastUpdatedAt: "2026-09-02T12:00:00.000Z",
          },
        });
      } finally {
        await client.close();
        await server.close();
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
