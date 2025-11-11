import { Result } from "result-type-ts";
import type { Context } from "./context";
import * as PublicApi from "./public-api";

export async function getCompanyPriceRange(args: {
  scopeId: string;
  context: Context;
}) {
  const scopeResult = await PublicApi.getScopeById({
    baseUrl: args.context.baseUrl,
    headers: {
      Authorization: `Bearer ${args.context.apiKey}`,
      ...args.context.userIdentifyingHeaders,
    },
    path: {
      scopeId: args.scopeId,
    },
  });

  if (!scopeResult.data) {
    return Result.failure(scopeResult.error.detail);
  }

  const scopeDetails = scopeResult.data;
  const productId = scopeDetails.productTerms[0]?.productId;

  if (!productId) {
    return Result.failure("Unable to find products on the scope.");
  }

  const productResult = await PublicApi.getProduct({
    baseUrl: args.context.baseUrl,
    headers: {
      Authorization: `Bearer ${args.context.apiKey}`,
      ...args.context.userIdentifyingHeaders,
    },
    path: {
      productId: productId,
    },
  });

  if (!productResult.data) {
    return Result.failure(productResult.error.detail);
  }

  const productDetails = productResult.data;

  const companyResult = await PublicApi.getCompany({
    baseUrl: args.context.baseUrl,
    headers: {
      Authorization: `Bearer ${args.context.apiKey}`,
      ...args.context.userIdentifyingHeaders,
    },
    path: {
      companyId: productDetails.company.id,
    },
  });

  if (!companyResult.data) {
    return Result.failure(companyResult.error.detail);
  }

  const companyDetails = companyResult.data;

  if (companyDetails.defaultPriceRange) {
    return Result.success(companyDetails.defaultPriceRange);
  } else {
    return Result.failure("Company does not have default price range.");
  }
}
