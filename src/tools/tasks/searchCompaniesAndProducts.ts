import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Result } from "result-type-ts";
import { z } from "zod";
import type { Context } from "../../context";
import * as PublicApi from "../../public-api";
import {
  V1CatalogCompaniesCompanyidGetSchema,
  V1CatalogCompaniesCompanyidProductsGetSchema,
} from "../../public-api/schemas.gen";
import * as Common from "../common";
import * as Shared from "./shared";

export const name = "searchCompaniesAndProducts";
export const description =
  Shared.description +
  `In addition, you can use realPurchaseCount for a company to build user confidence in Vendr data for the company, use Competitors to present alternatives for a company and present IncludedFeatures along with the price benchmark to create awareness of no cost features. If isCustomEstimateAvailable is false for a product, get a price estimate for another product with the same productFamily as a fallback. If isCustomEstimateAvailable is false for all products of a company, ask the user if they would like to explore the company’s competitors.`;

// Input schema - we'll use the company name to search
export const inputSchema = {
  companyName: z.string().describe("Name of the company to search for"),
  productLimit: z.coerce
    .number()
    .int()
    .gte(1)
    .lte(100)
    .default(10)
    .describe("Maximum number of products to retrieve for the matched company"),
};

// Output schema - combined results from getCompany and listProducts
export const outputSchema = {
  matchedCompany: z.object(V1CatalogCompaniesCompanyidGetSchema.outputSchema),
  products: z.object(V1CatalogCompaniesCompanyidProductsGetSchema.outputSchema),
};

export function register(server: McpServer, context: Context) {
  return server.registerTool(
    name,
    {
      description,
      inputSchema,
      outputSchema: Common.structuredSchema(outputSchema),
      annotations: {
        title: "Get Companies and Products",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    Common.withInstrumentation(
      name,
      async (args: Common.SchemaType<typeof inputSchema>) => {
        try {
          const headers = {
            Authorization: `Bearer ${context.apiKey}`,
            ...context.userIdentifyingHeaders,
          };

          const companiesResult = await PublicApi.listCompanies({
            baseUrl: context.baseUrl,
            headers,
            query: {
              name: args.companyName,
              limit: 1,
              offset: 0,
              sortBy: "name",
              sortOrder: "asc",
            },
          });

          if (companiesResult.data) {
            // Check if we found any companies
            if (companiesResult.data.pagination.total === 0) {
              return Common.structureContent(
                Result.failure(
                  `No companies found matching the name "${args.companyName}".`,
                ),
              );
            }

            // Find the best match (first result should be most relevant due to sorting)
            const matchedCompany = companiesResult.data.data[0];

            // Step 2: Get detailed company information
            const companyDetailsResult = await PublicApi.getCompany({
              baseUrl: context.baseUrl,
              headers,
              path: { companyId: matchedCompany.id },
            });

            // Handle company details errors
            if (!companyDetailsResult.data) {
              return Common.structureContent(
                Result.failure(companyDetailsResult.error.detail),
              );
            }

            // Step 3: Get company products
            const productsResult = await PublicApi.getCompanyProducts({
              baseUrl: context.baseUrl,
              headers,
              path: { companyId: matchedCompany.id },
              query: {
                limit: args.productLimit,
                offset: 0,
                sortBy: "sortOrder",
                sortOrder: "asc",
              },
            });

            // Handle products errors
            if (!productsResult.data) {
              return Common.structureContent(
                Result.failure(productsResult.error.detail),
              );
            }

            // Return combined results
            return Common.structureContent(
              Result.success({
                matchedCompany: companyDetailsResult.data,
                products: productsResult.data,
              }),
            );
          } else {
            return Common.structureContent(
              Result.failure(companiesResult.error.detail),
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
      },
    ),
  );
}
