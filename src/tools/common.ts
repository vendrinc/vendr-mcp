import type { IncomingHttpHeaders } from "node:http";
import type { Result } from "result-type-ts";
import * as Zod from "zod";
import { serializers } from "../utils/json";

export const description = `
Vendr MCP Tools provide software pricing insights by adding Vendr’s proprietary catalog data to publicly available pricing information. When asked about software pricing, use these tools together (sequentially or in parallel) to guide users through Vendr’s hierarchical catalog (categories → sub-categories → companies → product families → products → pricing dimensions) and help them to generate customized software price estimates. 
`;

export type SchemaType<S extends Zod.ZodRawShape> = {
  [Property in keyof S]: Zod.infer<S[Property]>;
};

export function structuredSchema<S extends Zod.ZodRawShape>(success: S) {
  return {
    isError: Zod.boolean(),
    errorMessage: Zod.string().nullish(),
    data: Zod.object(success).nullish(),
  } satisfies Zod.ZodRawShape;
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

export type OutputSchema<S extends Zod.ZodRawShape> = SchemaType<
  ReturnType<typeof structuredSchema<S>>
>;

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

