import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Context } from "./context";
import * as Tools from "./tools";

export function makeServer(context: Context) {
  const server = new McpServer({
    name: "vendr-mcp",
    version: "1.0.0",
  });

  Tools.register(server, context);

  return server;
}
