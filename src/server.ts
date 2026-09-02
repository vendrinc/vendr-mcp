import { McpServer } from "@modelcontextprotocol/server";
import type { Context } from "./context";
import * as Tools from "./tools";

export function makeServer(context: Context) {
  const server = new McpServer({
    name: "@vendrinc/mcp",
    version: "1.1.0",
  });

  Tools.register(server, context);

  return server;
}
