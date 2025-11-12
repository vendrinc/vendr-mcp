import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import type { Context } from "../../context";
import * as PublicApi from "../../public-api";
import { V1NegotiationFaqsCompanyidGetSchema } from "../../public-api/schemas.gen";
import * as Common from "../common";
import * as Shared from "./shared";

export const name = "getNegotiationInsights";

export const inputSchema = V1NegotiationFaqsCompanyidGetSchema.inputSchema;
export const outputSchema = V1NegotiationFaqsCompanyidGetSchema.outputSchema;

export const description = Shared.description;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
      annotations: {
        title: "Get Negotiation Insights",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    Common.withInstrumentation(
      name,
      async (args) => {
        try {
          const result = await PublicApi.getFaqs({
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
              faqs: result.data.faqs.map((faq) => ({
                ...faq,
                answer: faq.answer.replace(/<[^>]*>?/g, ""),
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
          return Common.structureContent(
            Result.failure(e instanceof Error ? e.message : String(e)),
          );
        }
      },
      // Custom attributes for this tool
      (args) => ({
        "mcp.tool.company_id": args.companyId,
      }),
    ),
  );
}
