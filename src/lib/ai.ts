/**
 * Minimal OpenAI chat helper. Graceful: returns null when OPENAI_API_KEY is
 * not configured, so AI features degrade instead of breaking the app.
 */
export const isAIEnabled = Boolean(
  typeof window === "undefined" && process.env.OPENAI_API_KEY
);

export async function aiComplete(
  system: string,
  user: string,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  if (!isAIEnabled) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        temperature: opts?.temperature ?? 0.4,
        max_tokens: opts?.maxTokens ?? 320,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
