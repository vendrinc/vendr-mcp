# Vendr MCP Tools - Claude Desktop Extension Installation

This guide walks you through installing the Vendr MCP Tools as a Desktop Extension (DXT) in Claude Desktop.

## Prerequisites

- [Claude Desktop](https://claude.ai/download) installed on your computer
- A Vendr API key (contact your Vendr administrator)
- Your Vendr user identifier

## Installation Steps

### 1. Download the Extension

The extension is packaged as `vendr-mcp.dxt` (18.4MB).

### 2. Install in Claude Desktop

1. **Open Claude Desktop**
2. **Go to Settings**: Click your initials or name in the lower left corner, then select "Settings"
3. **Navigate to Extensions**: Click "Extensions" under **Desktop app** and then "Advanced Settings"
4. **Install Extension**: Click "Install extension" and choose the `.dxt` file

### 3. Configure the Extension

After installation, you'll need to configure the extension with your Vendr credentials:

#### Required Configuration:
- **Vendr API Key**: Your API key for accessing Vendr's pricing data
- **User Identifier**: A unique identifier for the end user
- **Vendr API Base URL**: Defaults to `https://api.vendr.com`
- **User IP Address**: IP address of the end user
- **User Email**: Email address of the end user
- **Organization Name**: Name of the user's organization

### 4. Verify Installation

1. Start a new conversation in Claude Desktop
2. The Vendr tools should now be available
3. Try asking: "Can you show me companies in the CRM category?"

## Available Tools

The extension provides the following tools for software pricing insights:

### Company Information
- **listCompanies**: Retrieve a paginated list of companies from Vendr's catalog
- **getCompany**: Get detailed information about a specific company

### Product Catalog
- **listProducts**: Retrieve a paginated list of software products
- **getProduct**: Get detailed information about a specific software product
- **listProductFamilies**: Retrieve a list of product families/categories
- **getProductFamily**: Get detailed information about a product family
- **listCategories**: Retrieve a list of software categories

### Pricing Analysis
- **getBasicPriceEstimate**: Get basic pricing estimates for software products
- **getAdvancedPriceEstimate**: Get advanced pricing estimates with detailed parameters
- **createScope**: Create a new pricing scope for analysis
- **getScope**: Retrieve information about an existing pricing scope

## Example Usage

Once installed, you can ask Claude questions like:

- "What companies are in the project management software category?"
- "Can you get pricing estimates for Salesforce for a 100-person company?"
- "Show me products from Microsoft in our catalog"
- "Create a pricing scope for CRM software evaluation"

## Troubleshooting

### Extension Won't Install
- Ensure you're running the latest version of Claude Desktop
- Check that you have sufficient disk space (extension is 18.4MB)
- Try redownloading the `.dxt` file

### Extension Appears Installed but Tools Aren't Available
- Restart Claude Desktop to refresh the extension registry
- Check the extension's configuration settings for missing required fields
- Verify your API key and user identifier are entered correctly

### Configuration Issues
- Navigate to Settings > Extensions and click on the Vendr extension to review settings
- Ensure all required configuration fields (API Key, User Identifier) are completed
- Contact your Vendr administrator if you need help obtaining API credentials

### Permission or Security Errors
- **macOS**: Check System Preferences > Security & Privacy if you receive security warnings
- **Windows**: Ensure Claude Desktop has necessary permissions to access required directories

## Enterprise Policy Controls

For enterprise environments, administrators can control desktop extensions through system policies. See the [Anthropic documentation](https://support.anthropic.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) for details on enterprise configuration.

## Support

For technical issues with the extension:
1. Check your configuration settings in Claude Desktop
2. Verify your Vendr API credentials are valid
3. Contact your Vendr administrator for API-related questions
4. Refer to Claude Desktop's extension troubleshooting guide

## Version Information

- **Extension Version**: 1.0.0
- **Package Size**: 18.4MB
- **Total Files**: 3,622
- **Node.js Runtime**: Included (no separate installation required)

## License

This extension is licensed under the MIT License.
