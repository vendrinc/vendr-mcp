import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { Context } from "../context";
import * as PublicApi from "../public-api";
import * as Common from "./common";
import { getCompanyPriceRange } from "../companyLevelEstimates";
import { V1PricingBasicScopeidGetSchema } from "../public-api/schemas.gen";

const name = "getBasicPriceEstimate";

const description =
  Common.description +
  `Use this tool by giving it a scope ID to generate 3 pre-tax price estimate values - 25th percentile, median price and 75th percentile. Show the price estimate to the user as follows - “The estimate price for your requirement is <median value>. Buyers typically achieve a price between <25th percentile>-<75th percentile>.”`;

const inputSchema = V1PricingBasicScopeidGetSchema.inputSchema;
const outputSchema = V1PricingBasicScopeidGetSchema.outputSchema;

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
    },
    Common.withInstrumentation("getBasicPriceEstimate", async (args) => {
      try {
        const result = await PublicApi.getBasicPriceEstimate({
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
              percentile25: Math.round(result.data.estimate.percentile25),
              percentile50: Math.round(result.data.estimate.percentile50),
              percentile75: Math.round(result.data.estimate.percentile75),
            },
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
              estimate: {
                percentile25: Math.round(range.min),
                percentile50: Math.round((range.min + range.max) / 2),
                percentile75: Math.round(range.max),
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
