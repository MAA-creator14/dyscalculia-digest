import { z } from "zod";

export const polishBodySchema = z.object({
  section: z.enum(["hook", "line", "sinker"]),
  text: z.string().trim().min(1).max(2000),
  audience: z.enum(["leadership", "team", "partners", "other"]),
});

export type PolishBody = z.infer<typeof polishBodySchema>;

export type PolishResponse =
  | { ok: true; text: string }
  | { ok: false; reason: "changed-numbers" | "bad-request" | "unavailable"; message: string };
