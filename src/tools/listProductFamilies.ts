import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogCompaniesCompanyidProductFamiliesGetSchema } from "../public-api/schemas.gen";

const name = "listProductFamilies";

const description =
  Common.description +
  `Use this tool to retrieve a list of product families for a company, including products within the family. You would typically need to use it when the user specifically asks for a company’s details. For example, if a user asks “Tell me more about Slack pricing”, use this to show the different product families offered by slack along with their description, number of products in the product family and default price range.`;

const inputSchema =
  V1CatalogCompaniesCompanyidProductFamiliesGetSchema.inputSchema;
const outputSchema =
  V1CatalogCompaniesCompanyidProductFamiliesGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("listProductFamilies", async (args) => {
      try {
        const result = await PublicApi.listProductFamilies({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          path: {
            companyId: args.companyId,
          },
          query: {
            limit: args.limit,
            offset: args.offset,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
          },
        });

        if (result.data) {
          const output: Common.OutputSchema<typeof outputSchema>["data"] = {
            ...result.data,
            data: result.data.data.map((d) => ({
              ...d,
              defaultPriceRange: undefined,
              products: d.products
                ? d.products.map((p) => ({
                    ...p,
                    defaultPrice: undefined,
                  }))
                : undefined,
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
