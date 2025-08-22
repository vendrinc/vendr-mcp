/**
 * Safely serialize objects to JSON with size limits to prevent memory issues
 * with large payloads in logging and tracing.
 */

/**
 * Sanitize strings to remove problematic Unicode characters that can cause
 * ByteString conversion errors. This specifically handles characters like
 * Unicode Line Separator (8232) and Paragraph Separator (8233).
 */
export function sanitizeUnicodeString(str: string): string {
  // Replace problematic Unicode characters with safe alternatives
  return str
    .replace(/\u2028/g, '\n')  // Line Separator (8232) -> newline
    .replace(/\u2029/g, '\n\n')  // Paragraph Separator (8233) -> double newline
    .replace(/[\u0080-\u009F]/g, '')  // Remove other control characters
    .replace(/[^\x00-\x7F]/g, (char) => {
      // For other non-ASCII characters, try to preserve them but escape if needed
      const code = char.charCodeAt(0);
      if (code > 255) {
        // Replace with a safe placeholder or remove
        return '';
      }
      return char;
    });
}

/**
 * Recursively sanitize an object to remove problematic Unicode characters
 * from all string values.
 */
export function sanitizeObjectStrings<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeUnicodeString(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings) as T;
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {} as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeUnicodeString(key)] = sanitizeObjectStrings(value);
    }
    return sanitized as T;
  }
  
  return obj;
}

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
