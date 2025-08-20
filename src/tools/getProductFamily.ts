import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogProductFamiliesProductfamilyidGetSchema } from "../public-api/schemas.gen";

const name = "GetProductFamily";

const description =
  Common.description +
  `Use this tool to retrieve details about a product family, including the products within the product family. To get more details about those products, use the getProduct tool. Show the details to the user and ask them follow up questions to generate a customized price estimate.`;

const inputSchema =
  V1CatalogProductFamiliesProductfamilyidGetSchema.inputSchema;
const outputSchema =
  V1CatalogProductFamiliesProductfamilyidGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("GetProductFamily", async (args) => {
      try {
        const result = await PublicApi.getProductFamily({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          path: args,
        });

        if (result.data) {
          const output: Common.OutputSchema<typeof outputSchema>["data"] = {
            ...result.data,
            defaultPriceRange: undefined,
            products: result.data.products
              ? result.data.products.map((p) => ({
                  ...p,
                  defaultPrice: undefined,
                }))
              : undefined,
          };

          return Common.structureContent(Result.success(output));
        } else {
          return Common.structureContent(Result.failure(result.error.detail));
        }
      } catch (e) {
        Common.captureException(e, {
          tags: { tool: name },
          extra: { args: JSON.stringify(args) },
        });
        return Common.structureContent(Result.failure(String(e)));
      }
    }),
  );
}
