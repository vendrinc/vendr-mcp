import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Package from "../package.json";
import type { Context } from "./context";
import * as Tools from "./tools";

export function makeServer(context: Context) {
  const server = new McpServer({
      name: Package.name,
      version: Package.version,
    });

  Tools.register(server, context);

  return server;
}
