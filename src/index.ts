import { makeServer } from "./server";
import { Context } from "./context";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  // Create a context object with required configuration
  const context: Context = {
    apiKey: "your-api-key",
    baseUrl: "https://api.vendr.com",
    userIdentifyingHeaders: {
      "x-vendr-end-user-identifier": "your-user-identifier",
      "x-vendr-end-user-ip": "your-ip-address",
      "x-vendr-end-user-email": "your-email",
      "x-vendr-end-user-organization-name": "your-organization-name",
    },
  };
  
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

  console.error("EXAMPLE CALL:")
  console.error('{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"listCompanies","arguments":{}}}')
}

main().catch(console.error);