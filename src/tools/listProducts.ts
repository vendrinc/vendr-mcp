import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogCompaniesCompanyidProductsGetSchema } from "../public-api/schemas.gen";

const name = "listProducts";

const description =
  Common.description +
  `Use this tool to retrieve a list of products for a given company or product family, including all details of the product. You would typically need to use it when the user wants to learn about the various products offered by a company.`;

const inputSchema = V1CatalogCompaniesCompanyidProductsGetSchema.inputSchema;
const outputSchema = V1CatalogCompaniesCompanyidProductsGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("listProducts", async (args) => {
      try {
        const result = await PublicApi.getCompanyProducts({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          path: {
            companyId: args.companyId,
          },
          query: args,
        });

        if (result.data) {
          const output: Common.OutputSchema<typeof outputSchema>["data"] = {
            ...result.data,
            data: result.data.data.map((row) => ({
              ...row,
              competitors: row.competitors.map((competitor) => ({
                ...competitor,
                defaultPrice: undefined,
              })),
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
