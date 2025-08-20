import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1ScopeScopeidGetSchema } from "../public-api/schemas.gen";

const name = "getScope";

const description =
  Common.description +
  `Use this tool to retrieve metadata and associations for a previously created scope by its scope ID. You may use it to show the scope to the user later in a conversation thread.`;

const inputSchema = V1ScopeScopeidGetSchema.inputSchema;
const outputSchema = V1ScopeScopeidGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("getScope", async (args) => {
      try {
        const result = await PublicApi.getScopeById({
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
            productTerms: result.data.productTerms.map((pt) => ({
              ...pt,
              listPrice: pt.listPrice ? Math.round(pt.listPrice) : undefined,
              discount: pt.discount ? Math.round(pt.discount) : undefined,
              finalPrice: pt.finalPrice ? Math.round(pt.finalPrice) : undefined,
            })),
            scopeTerms: result.data.scopeTerms.map((st) => ({
              ...st,
              listPrice: st.listPrice ? Math.round(st.listPrice) : undefined,
              discount: st.discount ? Math.round(st.discount) : undefined,
              finalPrice: st.finalPrice ? Math.round(st.finalPrice) : undefined,
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
