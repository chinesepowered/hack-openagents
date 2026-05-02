/**
 * 0G Compute Router — OpenAI-compatible endpoint for verifiable inference.
 * Docs: https://docs.0g.ai (Router base: https://router-api.0g.ai/v1).
 *
 * The Router exposes models like zai-org/GLM-5-FP8 with TEE signature
 * verification on responses. We treat the response signature/id as the
 * "sealed inference receipt" surfaced in the agent console.
 */

type SealedInferenceInput = {
  model?: string;
  prompt: string;
};

type SealedInferenceOutput = {
  text: string;
  receipt: string;
};

export const ogCompute = {
  async sealedInference(
    input: SealedInferenceInput
  ): Promise<SealedInferenceOutput> {
    const endpoint = process.env.OG_COMPUTE_ENDPOINT;
    const apiKey = process.env.OG_COMPUTE_API_KEY;
    const model = input.model ?? process.env.OG_COMPUTE_MODEL ?? "zai-org/GLM-5-FP8";
    if (!endpoint || !apiKey) return mockInference(input);

    try {
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 256,
          messages: [
            {
              role: "system",
              content:
                "You are a disciplined trading analyst. Respond strictly with the requested compact JSON, no prose."
            },
            { role: "user", content: input.prompt }
          ]
        })
      });
      if (!res.ok) {
        console.warn("[og-compute] non-200, falling back:", res.status);
        return mockInference(input);
      }
      const json = (await res.json()) as {
        id: string;
        choices: Array<{ message: { content: string } }>;
      };
      return {
        text: json.choices[0]?.message?.content ?? "",
        receipt: json.id
      };
    } catch (err) {
      console.warn("[og-compute] error, falling back:", err);
      return mockInference(input);
    }
  }
};

function mockInference(_: SealedInferenceInput): SealedInferenceOutput {
  const sides = ["buy", "sell", "hold"] as const;
  const side = sides[Math.floor(Math.random() * sides.length)];
  const slip = 3 + Math.floor(Math.random() * 8);
  const text = JSON.stringify({
    side,
    rationale:
      side === "hold"
        ? "spread inside no-trade band, hold"
        : `momentum + spread favors ${side}, slippage acceptable`,
    expectedSlippageBps: slip
  });
  const receipt = `0xmock${Math.random().toString(16).slice(2, 10)}`;
  return { text, receipt };
}
