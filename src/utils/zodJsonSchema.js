import { zodToJsonSchema } from "zod-to-json-schema";

/** @param {import("zod").ZodSchema} schema */
export function dialectNeutralJsonSchema(schema) {
  const jsonSchema = zodToJsonSchema(schema, { strictUnions: true });
  delete jsonSchema.$schema;
  return jsonSchema;
}
