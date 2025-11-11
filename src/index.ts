import { makeServer } from "./server";
import type { Context } from "./context";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  // Create a context object with configuration from environment variables
  const context: Context = {
    apiKey: process.env.VENDR_API_KEY || "",
    baseUrl: process.env.VENDR_BASE_URL || "https://api.vendr.com",
    userIdentifyingHeaders: {
      "x-vendr-end-user-identifier": "",
      "x-vendr-end-user-ip": process.env.VENDR_USER_IP || "",
      "x-vendr-end-user-email": process.env.VENDR_USER_EMAIL || "",
      "x-vendr-end-user-organization-name": process.env.VENDR_ORGANIZATION_NAME || "",
    },
  };

  // Validate required configuration
  if (!context.apiKey) {
    console.error("Error: VENDR_API_KEY environment variable is required");
    process.exit(1);
  }
  
  if (!context.userIdentifyingHeaders["x-vendr-end-user-email"]) {
    console.error("Error: VENDR_USER_EMAIL environment variable is required");
    process.exit(1);
  }

  console.error("Starting MCP server...");

  // Create the MCP server
  const server = makeServer(context);

  // Create and connect to stdio transport
  const transport = new StdioServerTransport();
  console.error("Connecting to transport...");

  // Start the server
  await server.connect(transport);

  console.error("MCP server connected and running on stdio");
  console.error("Waiting for client connections...");
  console.error("EXAMPLE CALL:");
  console.error('{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"listCompanies","arguments":{}}}');
}

main().catch(console.error);
