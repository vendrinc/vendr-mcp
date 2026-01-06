import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { z } from "zod";
import type { Context } from "../../context";
import * as PublicApi from "../../public-api";
import {
  V1PricingAdvancedScopeidGetSchema,
  V1ScopePostSchema,
} from "../../public-api/schemas.gen";
import * as Common from "../common";
import * as Shared from "./shared";

type PercentileEstimate = {
  percentile10: number;
  percentile15: number;
  percentile20: number;
  percentile25: number;
  percentile30: number;
  percentile35: number;
  percentile40: number;
  percentile45: number;
  percentile50: number;
  percentile55: number;
  percentile60: number;
  percentile65: number;
  percentile70: number;
  percentile75: number;
  percentile80: number;
  percentile85: number;
  percentile90: number;
};

/**
 * Rounds all percentile values in an estimate object to the nearest integer.
 */
function roundPercentiles(estimate: PercentileEstimate): PercentileEstimate {
  return {
    percentile10: Math.round(estimate.percentile10),
    percentile15: Math.round(estimate.percentile15),
    percentile20: Math.round(estimate.percentile20),
    percentile25: Math.round(estimate.percentile25),
    percentile30: Math.round(estimate.percentile30),
    percentile35: Math.round(estimate.percentile35),
    percentile40: Math.round(estimate.percentile40),
    percentile45: Math.round(estimate.percentile45),
    percentile50: Math.round(estimate.percentile50),
    percentile55: Math.round(estimate.percentile55),
    percentile60: Math.round(estimate.percentile60),
    percentile65: Math.round(estimate.percentile65),
    percentile70: Math.round(estimate.percentile70),
    percentile75: Math.round(estimate.percentile75),
    percentile80: Math.round(estimate.percentile80),
    percentile85: Math.round(estimate.percentile85),
    percentile90: Math.round(estimate.percentile90),
  };
}

export const name = "getCustomPriceEstimate";
export const description =
  Shared.description +
  `If available in this tool’s response, present upto 3 realSimilarPurchases following the price benchmark with a statement "Here are recent examples of real purchases on Vendr that are similar to your requirement. I measure similarity based on products purchased, quantity, term length and recency.” Present in this order - productNames, primaryDimensionName, primaryDimensionValue, numberOfOtherDimensions, negotiatedPrice and startDate.`;

// Input schema - we'll use the company name to search
export const inputSchema = V1ScopePostSchema.inputSchema;

// Output schema - combined results from getCompany and listProducts
export const outputSchema = {
  ...V1PricingAdvancedScopeidGetSchema.outputSchema,
  estimate: V1PricingAdvancedScopeidGetSchema.outputSchema.estimate
    .nullish()
    .describe(
      "A customized price estimate, if it's not null/undefined then this is an accurate estimate for their scope.",
    ),
  productEstimates:
    V1PricingAdvancedScopeidGetSchema.outputSchema.productEstimates
      .nullish()
      .describe(
        "A customized price estimate for each product in scope, if it's not null/undefined then this is an accurate estimate for their scope.",
      ),
  companyDefaultPriceRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .nullish()
    .describe(
      "The range the company typically sell products for, use this as a fallback if estimate is null/undefined.",
    ),
};

export function register(server: McpServer, context: Context) {
  type Args = Common.SchemaType<typeof inputSchema>;

  const handler: Common.ToolHandler<Args> = async (args) => {
    try {
      const headers = {
        Authorization: `Bearer ${context.apiKey}`,
        ...context.userIdentifyingHeaders,
      };

      const scopeResult = await PublicApi.createScope({
        baseUrl: context.baseUrl,
        headers,
        body: {
          ...args,
          previousScopeId: args.previousScopeId ?? undefined,
          productTerms: args.productTerms.map((pt) => ({
            ...pt,
            startDate: pt?.startDate?.toJSON() ?? undefined,
            endDate: pt?.endDate?.toJSON() ?? undefined,
            discount: pt.discount ? Math.round(pt.discount) : undefined,
            finalPrice: pt.finalPrice ? Math.round(pt.finalPrice) : undefined,
            listPrice: pt.listPrice ? Math.round(pt.listPrice) : undefined,
          })),
          scopeTerms: args.scopeTerms.map((st) => ({
            ...st,
            autoRenew: st.autoRenew ?? undefined,
            startDate: st?.startDate?.toJSON() ?? undefined,
            endDate: st?.endDate?.toJSON() ?? undefined,
            discount: st.discount ? Math.round(st.discount) : undefined,
            finalPrice: st.finalPrice ? Math.round(st.finalPrice) : undefined,
            listPrice: st.listPrice ? Math.round(st.listPrice) : undefined,
          })),
        },
      });

      if (scopeResult.data) {
        const priceEstimateResult = await PublicApi.getAdvancedPriceEstimate({
          baseUrl: context.baseUrl,
          headers: {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          },
          path: { scopeId: scopeResult.data.id },
        });

        if (priceEstimateResult.data) {
          const output: Common.OutputSchema<typeof outputSchema>["data"] = {
            ...priceEstimateResult.data,
            estimate: priceEstimateResult.data.estimate
              ? roundPercentiles(priceEstimateResult.data.estimate)
              : null,
            productEstimates: priceEstimateResult.data.productEstimates.map(
              (pe) => ({
                ...pe,
                estimate:
                  pe.status === "success" && pe.estimate
                    ? roundPercentiles(pe.estimate)
                    : undefined,
              }),
            ),
            // Not provided by the API - added for schema extension
            companyDefaultPriceRange: null,
          };

          return Common.structureContent(Result.success(output));
        } else {
          return Common.structureContent(
            Result.failure(priceEstimateResult.error.detail),
          );
        }
      } else {
        return Common.structureContent(
          Result.failure(scopeResult.error.detail),
        );
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
  };

  return server.registerTool(
    name,
    {
      description,
      inputSchema: inputSchema as Record<string, unknown>,
      outputSchema: Common.structuredSchema(outputSchema),
      annotations: {
        title: "Get Custom Price Estimate",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    } as Parameters<typeof server.registerTool>[1],
    handler as Parameters<typeof server.registerTool>[2],
  );
}
