import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.url(),
    BACKEND_SYNC_SECRET: z.string().min(1).optional(),
    GOOGLE_API_KEY: z.string().min(1),
    GOOGLE_MODEL: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
