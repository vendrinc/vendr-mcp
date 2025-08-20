import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogCompaniesGetSchema } from "../public-api/schemas.gen";

const name = "listCompanies";

const description =
  Common.description +
  `Use this tool to retrieve a paginated list of companies from Vendr’s catalog along with their attributes. You can also filter the information you retrieve using a category or sub-category ID.`;

const inputSchema = V1CatalogCompaniesGetSchema.inputSchema;
const outputSchema = V1CatalogCompaniesGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("listCompanies", async (args) => {
      try {
        const result = await PublicApi.listCompanies({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          query: args,
        });

        if (result.data) {
          return Common.structureContent(Result.success(result.data));
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
