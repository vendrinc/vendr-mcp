/**
 * Safely serialize objects to JSON with size limits to prevent memory issues
 * with large payloads in logging and tracing.
 */

const DEFAULT_MAX_LENGTH = 10000; // 10KB limit by default
const TRUNCATION_SUFFIX = "... [truncated]";

interface JsonSerializationOptions {
  maxLength?: number;
  pretty?: boolean;
  truncationSuffix?: string;
}

/**
 * Serialize an object to JSON with optional size limiting and truncation.
 * This prevents memory issues when logging large payloads.
 */
export function safeJsonStringify(
  value: unknown,
  options: JsonSerializationOptions = {},
): string {
  const {
    maxLength = DEFAULT_MAX_LENGTH,
    pretty = false,
    truncationSuffix = TRUNCATION_SUFFIX,
  } = options;

  try {
    const serialized = pretty
      ? JSON.stringify(value, null, 2)
      : JSON.stringify(value);

    if (serialized.length <= maxLength) {
      return serialized;
    }

    // Truncate and add suffix
    const truncatedLength = maxLength - truncationSuffix.length;
    return serialized.substring(0, truncatedLength) + truncationSuffix;
  } catch (error) {
    // Handle circular references and other serialization errors
    return `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

/**
 * Create a serializer with preset options for specific use cases.
 */
export const createJsonSerializer = (
  options: JsonSerializationOptions = {},
) => {
  return (value: unknown) => safeJsonStringify(value, options);
};

// Pre-configured serializers for common use cases
export const serializers = {
  /** For logging arguments in traces - smaller limit */
  tracing: createJsonSerializer({ maxLength: 2000 }),

  /** For error logging - allow more detail */
  error: createJsonSerializer({ maxLength: 5000, pretty: true }),

  /** For general logging - medium limit */
  logging: createJsonSerializer({ maxLength: 3000 }),

  /** For response bodies - larger limit but still bounded */
  response: createJsonSerializer({ maxLength: 15000 }),
} as const;
