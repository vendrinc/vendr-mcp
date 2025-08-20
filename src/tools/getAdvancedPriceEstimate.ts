import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { getCompanyPriceRange } from "../companyLevelEstimates";
import { V1PricingAdvancedScopeidGetSchema } from "../public-api/schemas.gen";

const name = "getAdvancedPriceEstimate";

const description =
  Common.description +
  `Use this tool by giving it a scope ID to generate product level price estimate values breakup, in case the user asks for a multi-product price estimate.`;

const inputSchema = V1PricingAdvancedScopeidGetSchema.inputSchema;
const outputSchema = V1PricingAdvancedScopeidGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("getAdvancedPriceEstimate", async (args) => {
      try {
        const result = await PublicApi.getAdvancedPriceEstimate({
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
            estimate: {
              percentile10: Math.round(result.data.estimate.percentile10),
              percentile15: Math.round(result.data.estimate.percentile15),
              percentile20: Math.round(result.data.estimate.percentile20),
              percentile25: Math.round(result.data.estimate.percentile25),
              percentile30: Math.round(result.data.estimate.percentile30),
              percentile35: Math.round(result.data.estimate.percentile35),
              percentile40: Math.round(result.data.estimate.percentile40),
              percentile45: Math.round(result.data.estimate.percentile45),
              percentile50: Math.round(result.data.estimate.percentile50),
              percentile55: Math.round(result.data.estimate.percentile55),
              percentile60: Math.round(result.data.estimate.percentile60),
              percentile65: Math.round(result.data.estimate.percentile65),
              percentile70: Math.round(result.data.estimate.percentile70),
              percentile75: Math.round(result.data.estimate.percentile75),
              percentile80: Math.round(result.data.estimate.percentile80),
              percentile85: Math.round(result.data.estimate.percentile85),
              percentile90: Math.round(result.data.estimate.percentile90),
            },
            productEstimates: result.data.productEstimates.map((pe) => ({
              ...pe,
              estimate:
                pe.status === "success" && pe.estimate
                  ? {
                      percentile10: Math.round(pe.estimate.percentile10),
                      percentile15: Math.round(pe.estimate.percentile15),
                      percentile20: Math.round(pe.estimate.percentile20),
                      percentile25: Math.round(pe.estimate.percentile25),
                      percentile30: Math.round(pe.estimate.percentile30),
                      percentile35: Math.round(pe.estimate.percentile35),
                      percentile40: Math.round(pe.estimate.percentile40),
                      percentile45: Math.round(pe.estimate.percentile45),
                      percentile50: Math.round(pe.estimate.percentile50),
                      percentile55: Math.round(pe.estimate.percentile55),
                      percentile60: Math.round(pe.estimate.percentile60),
                      percentile65: Math.round(pe.estimate.percentile65),
                      percentile70: Math.round(pe.estimate.percentile70),
                      percentile75: Math.round(pe.estimate.percentile75),
                      percentile80: Math.round(pe.estimate.percentile80),
                      percentile85: Math.round(pe.estimate.percentile85),
                      percentile90: Math.round(pe.estimate.percentile90),
                    }
                  : undefined,
            })),
          };

          return Common.structureContent(Result.success(output));
        } else {
          const companyResult = await getCompanyPriceRange({
            context,
            scopeId: args.scopeId,
          });

          if (companyResult.value) {
            const range = companyResult.value;

            const output: Common.OutputSchema<typeof outputSchema>["data"] = {
              currency: range.currency,
              timestamp: new Date().toJSON(),
              productEstimates: [],
              estimate: {
                percentile10: 0,
                percentile15: 0,
                percentile20: 0,
                percentile25: Math.round(range.min),
                percentile30: 0,
                percentile35: 0,
                percentile40: 0,
                percentile45: 0,
                percentile50: Math.round((range.min + range.max) / 2),
                percentile55: 0,
                percentile60: 0,
                percentile65: 0,
                percentile70: 0,
                percentile75: Math.round(range.max),
                percentile80: 0,
                percentile85: 0,
                percentile90: 0,
              },
            };

            return Common.structureContent(Result.success(output));
          } else {
            return Common.structureContent(Result.failure(companyResult.error));
          }
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
