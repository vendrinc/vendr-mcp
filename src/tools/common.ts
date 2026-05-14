import type { IncomingHttpHeaders } from "node:http";
import type { Result } from "result-type-ts";
import * as Zod from "zod";
import { serializers } from "../utils/json";

export const description = `
Vendr MCP Tools provide software pricing insights by adding Vendr's proprietary catalog data to publicly available pricing information. When asked about software pricing, use these tools together (sequentially or in parallel) to guide users through Vendr's hierarchical catalog (categories → sub-categories → companies → product families → products → pricing dimensions) and help them to generate customized software price estimates. 
`;

export type SchemaType<S extends Zod.ZodRawShape> = {
  [Property in keyof S]: Zod.infer<S[Property]>;
};

/**
 * Wraps an output schema shape with standard error/success structure.
 */
export function structuredSchema<S extends Zod.ZodRawShape>(success: S) {
  return Zod.object({
    isError: Zod.boolean(),
    errorMessage: Zod.string().nullish(),
    data: Zod.object(success).nullish(),
  });
}

const userIdentifyingHeadersSchema = Zod.object({
  "x-vendr-end-user-identifier": Zod.string().optional(),
  "x-vendr-end-user-ip": Zod.string().optional(),
  "x-vendr-end-user-email": Zod.string().optional(),
  "x-vendr-end-user-organization-name": Zod.string().optional(),
});

export type UserIdentifyingHeaders = Zod.infer<
  typeof userIdentifyingHeadersSchema
>;

export function getUserIdentifyingHeaders(
  headers: IncomingHttpHeaders,
): UserIdentifyingHeaders {
  return userIdentifyingHeadersSchema.parse(headers);
}

/**
 * Type helper to get the inferred output type for a structured schema.
 */
export type OutputSchema<S extends Zod.ZodRawShape> = Zod.infer<
  ReturnType<typeof structuredSchema<S>>
>;

/**
 * Type for tool callback - uses any to prevent deep type inference
 * on complex nested schemas which can cause TypeScript memory issues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolHandler<Args = any> = (args: Args, extra: any) => any;

export function structureContent<S>(result: Result<S, string>) {
  const isError = result.isFailure;

  const structuredContent = {
    isError,
    errorMessage: result.error,
    data: result.value,
  };

  return {
    isError,
    structuredContent,
    content: [
      {
        type: "text" as const,
        text: serializers.response(structuredContent),
      },
    ],
  };
}

export function captureException(
  error: unknown,
  {
    tags,
    extra,
  }: {
    tags: Record<string, string>;
    extra: Record<string, unknown>;
  },
) {
  // No-op for distribution build (removes Sentry dependency)
  console.error("Error:", error);
}

// No-op instrumentation wrapper for distribution build (removes Sentry dependency)
export function withInstrumentation<T extends readonly unknown[], R>(
  toolName: string,
  handler: (...args: T) => Promise<R>,
  getAttributes?: (...args: T) => Record<string, string | number | boolean>,
): (...args: T) => Promise<R> {
  // Simply return the handler without any instrumentation
  return handler;
}

function formatOneLayerError(error: Error): string {
  const message = error.message.trim() !== "" ? error.message : error.name;
  const withMeta = error as Error & {
    code?: unknown;
    errno?: unknown;
    syscall?: unknown;
    address?: unknown;
    port?: unknown;
  };
  const hints: string[] = [];
  if (typeof withMeta.code === "string") {
    hints.push(`code=${withMeta.code}`);
  }
  if (typeof withMeta.errno === "number") {
    hints.push(`errno=${String(withMeta.errno)}`);
  }
  if (typeof withMeta.syscall === "string") {
    hints.push(`syscall=${withMeta.syscall}`);
  }
  if (typeof withMeta.address === "string") {
    hints.push(`address=${withMeta.address}`);
  }
  if (typeof withMeta.port === "number") {
    hints.push(`port=${String(withMeta.port)}`);
  }
  const suffix = hints.length > 0 ? ` [${hints.join(", ")}]` : "";
  return `${message}${suffix}`;
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isProblemDetailsLike(record: Record<string, unknown>): boolean {
  const hasDetail = typeof record.detail === "string";
  const hasTitle = typeof record.title === "string";
  const hasStatus = typeof record.status === "number";
  return hasDetail && (hasTitle || hasStatus);
}

/**
 * Formats a Vendr public API / RFC 7807-style error body when present.
 * Returns null if the value does not look like that shape (avoids false positives).
 */
function formatProblemDetailsPayload(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const r = value as Record<string, unknown>;
  if (!isProblemDetailsLike(r)) {
    return null;
  }
  const segments: string[] = [];
  if (typeof r.status === "number") {
    segments.push(`HTTP ${String(r.status)}`);
  }
  if (typeof r.title === "string" && r.title.trim() !== "") {
    segments.push(r.title.trim());
  }
  if (typeof r.detail === "string" && r.detail.trim() !== "") {
    segments.push(r.detail.trim());
  }
  if (typeof r.type === "string" && r.type.trim() !== "") {
    segments.push(`type=${r.type.trim()}`);
  }
  if (typeof r.instance === "string" && r.instance.trim() !== "") {
    segments.push(`instance=${r.instance.trim()}`);
  }
  const trace = r.trace;
  if (trace && typeof trace === "object" && trace !== null) {
    const t = trace as Record<string, unknown>;
    if (typeof t.requestId === "string" && t.requestId.trim() !== "") {
      segments.push(`requestId=${t.requestId.trim()}`);
    }
    if (typeof t.buildId === "string" && t.buildId.trim() !== "") {
      segments.push(`buildId=${t.buildId.trim()}`);
    }
    if (typeof t.rayId === "string" && t.rayId.trim() !== "") {
      segments.push(`rayId=${t.rayId.trim()}`);
    }
    if (typeof t.timestamp === "string" && t.timestamp.trim() !== "") {
      segments.push(`at=${t.timestamp.trim()}`);
    }
  }
  return segments.length > 0 ? segments.join(" — ") : null;
}

/**
 * Formats a failed {@link @hey-api/client-fetch} call: problem+json body
 * (title, detail, trace.requestId, …) plus request path from `Response` when available.
 * Use this for `if (!result.data)` branches; use {@link describeClientError} for thrown errors.
 */
export function describePublicApiFailure(
  error: unknown,
  response?: Response,
): string {
  let base = formatProblemDetailsPayload(error);
  if (!base && error !== undefined && error !== null) {
    base = describeClientError(error);
  }
  if (!base) {
    base = "Unknown error";
  }
  if (response?.url) {
    try {
      const u = new URL(response.url);
      return `${base} (${u.pathname}${u.search})`;
    } catch {
      // ignore malformed URL
    }
  }
  return base;
}

/**
 * Builds a client-facing error string for HTTP/SDK failures. Node's `fetch`
 * often surfaces only `TypeError: fetch failed` while the useful detail lives
 * on {@link Error.cause} or inside {@link AggregateError.errors}.
 */
export function describeClientError(error: unknown): string {
  const describeInner = (current: unknown, depth: number): string => {
    if (depth > 10) {
      return "… (error detail truncated)";
    }

    if (current instanceof AggregateError) {
      const head =
        current.message.trim() !== ""
          ? current.message
          : `AggregateError (${String(current.errors.length)} nested errors)`;
      const nested = current.errors
        .slice(0, 5)
        .map((e) => describeInner(e, depth + 1));
      const overflow =
        current.errors.length > 5
          ? `… and ${String(current.errors.length - 5)} more nested errors`
          : undefined;
      return [head, ...nested, overflow].filter(Boolean).join(" | ");
    }

    if (current instanceof Error) {
      const head = formatOneLayerError(current);
      const withResponse = current as Error & { response?: Response };
      let responseHint = "";
      if (withResponse.response instanceof Response) {
        try {
          const u = new URL(withResponse.response.url);
          responseHint = ` [${String(withResponse.response.status)} ${withResponse.response.statusText} ${u.pathname}]`;
        } catch {
          responseHint = ` [HTTP ${String(withResponse.response.status)}]`;
        }
      }
      if (current.cause !== undefined && current.cause !== null) {
        return `${head}${responseHint} | Caused by: ${describeInner(current.cause, depth + 1)}`;
      }
      return `${head}${responseHint}`;
    }

    if (typeof current === "object" && current !== null) {
      const problem = formatProblemDetailsPayload(current);
      if (problem) {
        return problem;
      }
    }

    if (current === undefined || current === null) {
      return "";
    }

    return stringifyUnknown(current);
  };

  const out = describeInner(error, 0).trim();
  return out.length > 0 ? out : "Unknown error";
}