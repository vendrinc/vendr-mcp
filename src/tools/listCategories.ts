import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1CatalogCategoriesGetSchema } from "../public-api/schemas.gen";

const name = "listCategories";

const description =
  Common.description +
  `Use this tool to retrieve a list of categories and sub-categories from Vendr’s catalog along with their description. Use this to understand the sub-categories within a category and companies within a sub-category. If the user asks a category specific question, for example “I’m looking for collaboration and communication software”, you can also get the sub-category and company details by filtering using category ID.`;

const inputSchema = V1CatalogCategoriesGetSchema.inputSchema;
const outputSchema = V1CatalogCategoriesGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation(name, async (args) => {
      try {
        const result = await PublicApi.listCategories({
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
