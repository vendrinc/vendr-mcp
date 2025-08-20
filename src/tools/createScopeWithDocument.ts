import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { z } from "zod";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1ScopeFromDocumentPostSchema } from "../public-api/schemas.gen";

const name = "createScopeWithDocument";

const description = Common.description + `Don’t ever use this tool.`;

const inputSchema = {
  file: z.instanceof(File).or(z.instanceof(Blob)),
};
const outputSchema = V1ScopeFromDocumentPostSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("createScopeWithDocument", async (args) => {
      try {
        const result = await PublicApi.createScopeFromDocument({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          body: args,
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
