export class GeminiIntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GeminiIntegrationError';
  }
}

export const GEMINI_MODEL_CONFIG = {
  imageModel: (import.meta.env?.VITE_GEMINI_MODEL as string | undefined)?.trim() || 'gemini-2.5-flash-image',
  recommendedAlternative: 'gemini-3.1-flash-image',
  note: 'A documentação atual destaca os modelos de geração de imagens Nano Banana / Gemini 3.1 Flash Image como opções mais recentes para migração.',
} as const;

export const getConfiguredGeminiModel = () => GEMINI_MODEL_CONFIG.imageModel;

export const getGeminiApiKey = () => {
  const viteKey = (import.meta.env?.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  const viteLegacyKey = (import.meta.env?.GEMINI_API_KEY as string | undefined)?.trim() || '';
  const processKey = (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '')?.trim() || '';
  const legacyProcessKey = (typeof process !== 'undefined' ? process.env?.API_KEY : '')?.trim() || '';

  return viteKey || viteLegacyKey || processKey || legacyProcessKey || '';
};
