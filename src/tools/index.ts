import type {
  McpServer,
  RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import type { Context } from "../context";
import { dialectNeutralJsonSchema } from "../utils/zodJsonSchema";
import * as Common from "./common";

import * as GetCustomPriceEstimate from "./tasks/getCustomPriceEstimate";
import * as GetNegotiationInsights from "./tasks/getNegotiationInsights";
import * as SearchCompaniesAndProducts from "./tasks/searchCompaniesAndProducts";

const tasks: {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  outputSchema: ZodRawShape;
  register: (server: McpServer, context: Context) => RegisteredTool;
}[] = [
  GetCustomPriceEstimate,
  SearchCompaniesAndProducts,
  GetNegotiationInsights,
];

export function register(server: McpServer, context: Context) {
  const registeredTasks = tasks.map((task) => ({
    task,
    registeredTool: task.register(server, context),
  }));

  // The SDK's Zod 3 converter declares draft-07, while current MCP clients
  // validate as 2020-12. These schemas use only keywords shared by both
  // dialects, so omit the conflicting declaration and let each client use its
  // configured dialect. setRequestHandler is the SDK's documented low-level
  // API for advanced server behavior and replaces the generated tools/list.
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: registeredTasks
      .filter(({ registeredTool }) => registeredTool.enabled)
      .map(({ task, registeredTool }) => ({
        name: task.name,
        title: registeredTool.title,
        description: registeredTool.description,
        inputSchema: dialectNeutralJsonSchema(z.object(task.inputSchema)),
        outputSchema: dialectNeutralJsonSchema(
          Common.structuredSchema(task.outputSchema),
        ),
        annotations: registeredTool.annotations,
        execution: registeredTool.execution,
        _meta: registeredTool._meta,
      })),
  }));
}
