import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional().default(""),
  GOOGLE_GENAI_API_KEY: z.string().optional().default(""),
});

const { error, data } = envSchema.safeParse(process.env);

if (error) throw new Error(`Invalid environment variables:\n${error.message}`);

export const env = data;
