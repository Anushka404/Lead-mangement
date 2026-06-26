import Groq from "groq-sdk";
import { z } from "zod";

const Classification = z.object({
  category: z.enum(["Sales", "Support", "Partnership", "Hiring", "Other"]),
  priority: z.enum(["High", "Medium", "Low"]),
});

export type LeadClassification = z.infer<typeof Classification>;

const SYSTEM = `You classify inbound sales leads. Respond ONLY with JSON of the form:
{"category": <one of: Sales, Support, Partnership, Hiring, Other>, "priority": <one of: High, Medium, Low>}
category = the kind of request. priority = how urgently sales should follow up (High = clear buying intent or urgency, Low = vague or informational).`;

/**
 * Classifies a lead's requirement into a category + priority using Groq
 * (free tier, Llama 3.3). Returns null when GROQ_API_KEY is unset or the call
 * fails — callers treat classification as best-effort and never block on it.
 */
export async function classifyRequirement(
  requirement: string,
): Promise<LeadClassification | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const groq = new Groq({ apiKey });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 100,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: requirement },
      ],
    });

    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = Classification.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("[classify]", (err as Error).message);
    return null;
  }
}
