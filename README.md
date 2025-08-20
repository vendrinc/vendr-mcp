# Vendr MCP Tools

Model Context Protocol tools for Vendr software pricing insights.

## Overview

This package provides MCP (Model Context Protocol) tools that give AI assistants access to Vendr's proprietary software pricing catalog. These tools help users navigate software categories, companies, products, and generate customized price estimates.

## Features

- **Catalog Navigation**: Browse software categories, companies, and product families
- **Product Information**: Get detailed information about specific software products
- **Price Estimation**: Generate basic and advanced price estimates based on user requirements
- **Scope Management**: Create and manage pricing scopes with custom dimensions

## Installation

```bash
npm install
```

## Usage

### Basic Setup

```typescript
import { makeServer } from "./src/server";
import { Context } from "./src/context";

// Create a context with your API configuration
const context: Context = {
  apiKey: "your-api-key",
  baseUrl: "https://api.vendr.com",
  userIdentifyingHeaders: {
    "x-vendr-end-user-email": "user@example.com"
  }
};

// Create the MCP server
const server = makeServer(context);
```

### Available Tools

#### Catalog Tools
- **listCategories**: Browse software categories
- **listCompanies**: List companies in the catalog
- **getCompany**: Get detailed company information
- **listProductFamilies**: List product families for a company
- **getProductFamily**: Get detailed product family information
- **listProducts**: List products for a company
- **getProduct**: Get detailed product information

#### Pricing Tools
- **createScope**: Create a pricing scope with dimension values
- **getScope**: Retrieve an existing scope
- **getBasicPriceEstimate**: Get a basic price estimate for a scope
- **getAdvancedPriceEstimate**: Get an advanced price estimate for a scope

## API Requirements

To use these tools, you'll need:

1. **API Key**: A valid Vendr API key
2. **Base URL**: The Vendr API endpoint
3. **User Headers**: Optional user identifying headers for personalization

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Start

```bash
npm run start
```

## Dependencies

- **@modelcontextprotocol/sdk**: Core MCP functionality
- **result-type-ts**: Type-safe result handling
- **zod**: Runtime type validation

## License

MIT

## Support

For questions about Vendr's software pricing tools or to connect with pricing experts, visit [Vendr](https://vendr.com).
