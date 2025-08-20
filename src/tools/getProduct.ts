import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogProductsProductidGetSchema } from "../public-api/schemas.gen";

const name = "getProduct";

const description =
  Common.description +
  `Use this tool to retrieve details about a product including all the attributes of its pricing dimensions and details of included features.  When the user asks about the price of a software product, ask them to share pricing dimension values to get a customized price estimate. Using the dimension description and unitName, guide them about what the dimension means. With the quantity properties of pricing dimensions, help them provide the right answers. ”
`;

const inputSchema = V1CatalogProductsProductidGetSchema.inputSchema;
const outputSchema = V1CatalogProductsProductidGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("getProduct", async (args) => {
      try {
        const result = await PublicApi.getProduct({
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
            defaultPrice: undefined,
            competitors: result.data.competitors.map((competitor) => ({
              ...competitor,
              defaultPrice: undefined,
            })),
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
