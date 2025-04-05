import { z } from "zod";

export const ServerIdSchema = z.number().or(z.string());

export const ServerArgsSchema = z.object({
  id: ServerIdSchema,
  hostname: z.string(),
  ip: z.string(),
  port: z.number(),
  allowOrigin: z.string(),
})
