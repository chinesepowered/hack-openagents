/**
 * Uniswap trade-api gateway client.
 * Docs: https://developers.uniswap.org/api/quote
 *
 * Uniswap is not deployed on 0G testnet, so we use this for live routing
 * intelligence — the agent reads real mainnet pool state into its reasoning.
 * The actual settlement happens on our 0G testnet router.
 */

const DEFAULT_BASE = "https://trade-api.gateway.uniswap.org/v1";

type QuoteInput = {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: string;
  chainId?: number;
  swapper?: `0x${string}`;
};

type QuoteOutput = {
  amountOut: string;
  route: string;
  priceImpact: number;
  gasFeeUsd: string;
  quoteId: string;
  raw: unknown;
};

export const uniswap = {
  async getQuote(input: QuoteInput): Promise<QuoteOutput> {
    const base = process.env.UNISWAP_API_BASE_URL ?? DEFAULT_BASE;
    const key = process.env.UNISWAP_API_KEY;
    const chainId =
      input.chainId ??
      Number(process.env.UNISWAP_QUOTE_CHAIN_ID ?? 1);
    if (!key) return mockQuote(input);

    try {
      const res = await fetch(`${base}/quote`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key
        },
        body: JSON.stringify({
          type: "EXACT_INPUT",
          tokenInChainId: chainId,
          tokenOutChainId: chainId,
          tokenIn: input.tokenIn,
          tokenOut: input.tokenOut,
          amount: input.amountIn,
          swapper:
            input.swapper ?? "0x0000000000000000000000000000000000000000"
        })
      });
      if (!res.ok) {
        console.warn("[uniswap] non-200, mocking:", res.status);
        return mockQuote(input);
      }
      const json = (await res.json()) as Record<string, any>;
      const q = json.quote ?? {};
      return {
        amountOut: q.output?.amount ?? "0",
        route: routeSummary(q.route),
        priceImpact: Number(q.priceImpact ?? 0),
        gasFeeUsd: String(q.gasFeeUSD ?? "0"),
        quoteId: q.quoteId ?? json.requestId ?? "",
        raw: json
      };
    } catch (err) {
      console.warn("[uniswap] error, mocking:", err);
      return mockQuote(input);
    }
  }
};

function routeSummary(route: any): string {
  if (!Array.isArray(route)) return "—";
  const hops = route[0] ?? [];
  return hops
    .map(
      (h: any) =>
        `${h.tokenIn?.symbol ?? "?"} → V${h.type?.endsWith("3-pool") ? 3 : 4} ${(h.fee / 10_000).toFixed(2)}% → ${h.tokenOut?.symbol ?? "?"}`
    )
    .join(" | ");
}

function mockQuote(input: QuoteInput): QuoteOutput {
  return {
    amountOut: input.amountIn,
    route: "MOCK USDC → V3 0.05% → WETH",
    priceImpact: 0.01,
    gasFeeUsd: "0.15",
    quoteId: `mock_${Date.now().toString(36)}`,
    raw: null
  };
}
