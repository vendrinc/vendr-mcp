import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogCompaniesCompanyidGetSchema } from "../public-api/schemas.gen";

const name = "getCompany";

const inputSchema = V1CatalogCompaniesCompanyidGetSchema.inputSchema;
const outputSchema = V1CatalogCompaniesCompanyidGetSchema.outputSchema;

const description =
  Common.description +
  `Use this tool to retrieve detailed information about a single company, including its product offerings, when the user specifically asks for a company’s details or asks to compare multiple companies, for example, “Tell me more about Slack pricing”. Show the details to the user and ask them follow up questions to generate a customized price estimate.`;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation(
      name,
      async (args) => {
        try {
          const result = await PublicApi.getCompany({
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
              productFamilies: result.data.productFamilies.map((pf) => ({
                ...pf,
                defaultPriceRange: undefined,
              })),
              products: result.data.products.map((p) => ({
                ...p,
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
      },
      // Custom attributes for this tool
      (args) => ({
        "mcp.tool.company_id": args.companyId,
      }),
    ),
  );
}
