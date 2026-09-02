import assert from "node:assert/strict";
import test from "node:test";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { makeServer } from "../src/server";

const toolNames = [
  "getCustomPriceEstimate",
  "searchCompaniesAndProducts",
  "getNegotiationInsights",
].sort();

test("all tool schemas use JSON Schema 2020-12 and a client can call every tool", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = input instanceof Request ? input.url : String(input);
    const body = url.includes("/v1/negotiation/faqs/")
      ? {
          faqs: [
            {
              question: "How should I negotiate?",
              answer: "<p>Ask for benchmark-backed pricing.</p>",
            },
          ],
          lastUpdatedAt: "2026-09-02T12:00:00.000Z",
        }
      : {
          title: "Expected test response",
          detail: "The mocked API rejected this request after tool execution.",
          status: 400,
        };

    return new Response(JSON.stringify(body), {
      status: url.includes("/v1/negotiation/faqs/") ? 200 : 400,
      headers: { "content-type": "application/json" },
    });
  };

  const server = makeServer({
    apiKey: "test-api-key",
    baseUrl: "https://api.vendr.test",
    userIdentifyingHeaders: {
      "x-vendr-end-user-identifier": "test-user",
      "x-vendr-end-user-ip": "127.0.0.1",
      "x-vendr-end-user-email": "test@vendr.com",
      "x-vendr-end-user-organization-name": "Vendr",
    },
  });
  const client = new Client({ name: "schema-regression-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      toolNames,
    );

    const ajv = new Ajv2020({ strict: true });
    addFormats(ajv);
    for (const tool of tools) {
      assert.equal(
        tool.outputSchema?.$schema,
        "https://json-schema.org/draft/2020-12/schema",
      );
      assert.doesNotThrow(() => ajv.compile(tool.outputSchema));
    }

    const searchResult = await client.callTool({
      name: "searchCompaniesAndProducts",
      arguments: { companyName: "Salesforce" },
    });
    assert.equal(searchResult.isError, true);

    const estimateResult = await client.callTool({
      name: "getCustomPriceEstimate",
      arguments: {
        scopeTerms: [
          {
            termLength: 12,
            purchaseType: "new_purchase",
            startDate: "2026-09-02T12:00:00.000Z",
          },
        ],
        productTerms: [
          {
            productId: "00000000-0000-4000-8000-000000000001",
            pricingDimensions: [
              {
                id: "00000000-0000-4000-8000-000000000002",
                value: 100,
              },
            ],
            startDate: "2026-09-02T12:00:00.000Z",
          },
        ],
      },
    });
    assert.equal(estimateResult.isError, true);

    const result = await client.callTool({
      name: "getNegotiationInsights",
      arguments: { companyId: "00000000-0000-4000-8000-000000000000" },
    });

    assert.equal(result.isError, false);
    assert.deepEqual(result.structuredContent, {
      isError: false,
      errorMessage: undefined,
      data: {
        faqs: [
          {
            question: "How should I negotiate?",
            answer: "Ask for benchmark-backed pricing.",
          },
        ],
        lastUpdatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
    await client.close();
  }
});
