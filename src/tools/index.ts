import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Context } from "../context";

import * as CreateScope from "./createScope";
import * as GetAdvancedPriceEstimate from "./getAdvancedPriceEstimate";
import * as GetBasicPriceEstimate from "./getBasicPriceEstimate";
import * as GetCompany from "./getCompany";
import * as GetProduct from "./getProduct";
import * as GetProductFamily from "./getProductFamily";
import * as GetScope from "./getScope";
import * as ListCategories from "./listCategories";
import * as ListCompanies from "./listCompanies";
import * as ListProductFamilies from "./listProductFamilies";
import * as ListProducts from "./listProducts";

const tools = [
  CreateScope,  GetAdvancedPriceEstimate,
  GetBasicPriceEstimate,
  GetCompany,
  GetProduct,
  ListProductFamilies,
  GetScope,
  ListCategories,
  ListCompanies,
  GetProductFamily,
  ListProducts,
];

export function register(server: McpServer, context: Context) {
  for (const tool of tools) {
    tool.register(server, context);
  }
}
