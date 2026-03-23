import { z } from "zod";

export const entityIdSchema = z.uuid();

export const isoDateSchema = z.iso.date();

export const isoDateTimeSchema = z.iso.datetime();

export const trimmedNonEmpty = z.string().trim().min(1);

/** `numeric(p,s)` serialized as string at API boundaries */
export const positiveDecimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Must be a positive decimal string")
  .refine((s) => Number(s) > 0, "Must be > 0");

export const optionalPositiveDecimalStringSchema = positiveDecimalStringSchema.nullable().optional();

export const ratioStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/)
  .refine((s) => {
    const n = Number(s);
    return !Number.isNaN(n) && n >= 0 && n <= 1;
  }, "Ratio must be between 0 and 1");

export const structuredScheduleJsonSchema = z.union([
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

export const jsonObjectSchema = z.record(z.string(), z.unknown());
