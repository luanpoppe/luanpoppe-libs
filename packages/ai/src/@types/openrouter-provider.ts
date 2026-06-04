/**
 * Preferências de roteamento de providers do OpenRouter.
 * @see https://openrouter.ai/docs/guides/routing/provider-selection
 */
export type OpenRouterProviderSort =
  | "price"
  | "latency"
  | "throughput"
  | { by: "price" | "latency" | "throughput"; partition?: "model" | "none" };

/** Teto de preço em USD por milhão de tokens (prompt/completion) ou por request/imagem. */
export type OpenRouterMaxPrice = {
  prompt?: number;
  completion?: number;
  image?: number;
  request?: number;
};

export type OpenRouterProviderPreferences = {
  only?: string[];
  order?: string[];
  ignore?: string[];
  allow_fallbacks?: boolean;
  require_parameters?: boolean;
  sort?: OpenRouterProviderSort;
  max_price?: OpenRouterMaxPrice;
};
