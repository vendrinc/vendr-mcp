import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { V1ScopePostSchema } from "../public-api/schemas.gen";

const name = "createScope";

const description =
  Common.description +
  `When the user shares dimension values after reviewing dimension questions, use this tool to register those values as a scope and get a scope ID in return. After getting scope ID, immediately call getBasicPriceForecast or getAdvancedPriceForecast tool with the scope ID to get a price estimate. 

When the user uploads a quote/contract for analysis, extract dimensions and their values from it. Use this tool to register those dimension values as a scope and get a scope ID in return. After getting scope ID, immediately call getBasicPriceForecast or getAdvancedPriceForecast tool with the scope ID to get a price estimate. Show the user Vendr’s price estimate range for their quote/contract along with a comparison between the quote/contract and Vendr’s estimate so that the user knows whether they have received a fair price or not.`;

const inputSchema = V1ScopePostSchema.inputSchema;
const outputSchema = V1ScopePostSchema.outputSchema;

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
          const result = await PublicApi.createScope({
            baseUrl: context.baseUrl,
            headers: {
              Authorization: `Bearer ${context.apiKey}`,
              ...context.userIdentifyingHeaders,
            },
            body: {
              ...args,
              previousScopeId: args.previousScopeId ?? undefined,
              productTerms: args.productTerms.map((pt) => ({
                ...pt,
                startDate: pt?.startDate?.toJSON() ?? undefined,
                endDate: pt?.endDate?.toJSON() ?? undefined,
                discount: pt.discount ? Math.round(pt.discount) : undefined,
                finalPrice: pt.finalPrice
                  ? Math.round(pt.finalPrice)
                  : undefined,
                listPrice: pt.listPrice ? Math.round(pt.listPrice) : undefined,
              })),
              scopeTerms: args.scopeTerms.map((st) => ({
                ...st,
                autoRenew: st.autoRenew ?? undefined,
                startDate: st?.startDate?.toJSON() ?? undefined,
                endDate: st?.endDate?.toJSON() ?? undefined,
                discount: st.discount ? Math.round(st.discount) : undefined,
                finalPrice: st.finalPrice
                  ? Math.round(st.finalPrice)
                  : undefined,
                listPrice: st.listPrice ? Math.round(st.listPrice) : undefined,
              })),
            },
          });

          if (result.data) {
            const output: Common.OutputSchema<typeof outputSchema>["data"] = {
              ...result.data,
              productTerms: result.data.productTerms.map((pt) => ({
                ...pt,
                listPrice: pt.listPrice ? Math.round(pt.listPrice) : undefined,
                discount: pt.discount ? Math.round(pt.discount) : undefined,
                finalPrice: pt.finalPrice
                  ? Math.round(pt.finalPrice)
                  : undefined,
              })),
              scopeTerms: result.data.scopeTerms.map((st) => ({
                ...st,
                listPrice: st.listPrice ? Math.round(st.listPrice) : undefined,
                discount: st.discount ? Math.round(st.discount) : undefined,
                finalPrice: st.finalPrice
                  ? Math.round(st.finalPrice)
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
      },
      // Custom attributes for this tool
      (args) => ({
        "mcp.tool.product_count": args.productTerms.length,
        "mcp.tool.scope_count": args.scopeTerms.length,
      }),
    ),
  );
}
