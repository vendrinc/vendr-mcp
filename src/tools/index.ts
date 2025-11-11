import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import type { Context } from "../context";

import * as GetCustomPriceEstimate from "./tasks/getCustomPriceEstimate";
import * as GetNegotiationInsights from "./tasks/getNegotiationInsights";
import * as SearchCompaniesAndProducts from "./tasks/searchCompaniesAndProducts";

const tasks: {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  outputSchema: ZodRawShape;
  register: (server: McpServer, context: Context) => void;
}[] = [
  GetCustomPriceEstimate,
  SearchCompaniesAndProducts,
  GetNegotiationInsights,
];

export function register(server: McpServer, context: Context) {
  for (const task of tasks) {
    task.register(server, context);
  }
}
