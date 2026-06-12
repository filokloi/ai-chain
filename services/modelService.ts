import { ApiKeys, ModelWithProvider, LocalLlmConfig, Model } from '../types';

let openRouterModelsCache: Model[] | null = null;

/**
 * Providers that `apiService.getAiResponse` can call directly with their own key.
 * Any other provider can only be reached through the OpenRouter aggregator.
 */
export const DIRECT_SUPPORTED_PROVIDERS = ['openai', 'google', 'zhipu', 'anthropic', 'groq', 'local'] as const;

async function fetchOpenRouterModels(): Promise<Model[]> {
    if (openRouterModelsCache) {
        return openRouterModelsCache;
    }
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) throw new Error('Failed to fetch OpenRouter models');
        const { data } = await response.json();
        openRouterModelsCache = Array.isArray(data) ? data : [];
        return openRouterModelsCache;
    } catch (error) {
        console.error("Could not fetch OpenRouter models:", error);
        return []; // Return empty array on failure
    }
}

/** Allow tests / callers to reset the in-memory model cache. */
export function __resetModelCache() {
    openRouterModelsCache = null;
}

function getModelCapabilities(model: ModelWithProvider) {
    const isMultimodal = model.architecture?.modality === 'multimodal' || model.id.includes('vision') || model.id.includes('claude-3') || model.id.includes('gpt-4o') || model.provider === 'google';
    const hasLargeContext = (model.context_length || 0) >= 128000;
    const topTierModels = ['gpt-4o', 'claude-3.5-sonnet', 'command-r-plus', 'command-r+', 'glm-4', 'gemini-1.5', 'claude-3-opus'];
    const isTopTier = topTierModels.some(topModel => model.id.includes(topModel));
    return { isMultimodal, hasLargeContext, isTopTier };
}

/**
 * A model is only usable if the app can actually reach it: either its provider has
 * direct support AND the matching credential is present, or an OpenRouter key exists
 * as a universal fallback. This prevents "phantom" models that are listed but always
 * fail at request time.
 */
export function isModelCallable(model: ModelWithProvider, apiKeys: ApiKeys, localConfig: LocalLlmConfig): boolean {
    if (model.provider === 'local') return Boolean(localConfig.serverUrl);
    if (apiKeys.openrouter) return true; // OpenRouter can proxy anything.
    switch (model.provider) {
        case 'openai': return Boolean(apiKeys.openai);
        case 'google': return Boolean(apiKeys.google);
        case 'zhipu': return Boolean(apiKeys.zhipu);
        case 'anthropic': return Boolean(apiKeys.anthropic);
        case 'groq': return Boolean(apiKeys.groq);
        default: return false; // cohere/mistral/xai/alibaba/moonshot need OpenRouter.
    }
}

export async function fetchAndBuildModelStrategy(apiKeys: ApiKeys, localConfig: LocalLlmConfig): Promise<ModelWithProvider[]> {
    let combinedModels: ModelWithProvider[] = [];

    // 1. Add Local LLM if configured
    if (localConfig.serverUrl) {
        combinedModels.push({
            id: 'local/local-model', // Prefixed for consistency
            name: 'Local LLM',
            provider: 'local',
            description: 'A model running on your local machine.',
            architecture: { modality: 'multimodal' },
            context_length: 32000,
        });
    }

    // 2. Add curated list of direct-keyed models with FULL provider-prefixed IDs
    if (apiKeys.google) {
        combinedModels.push({ id: 'google/gemini-1.5-pro-latest', provider: 'google', name: 'Gemini 1.5 Pro', description: "Google's top-tier multimodal model", architecture: { modality: 'multimodal' }, context_length: 1000000 });
        combinedModels.push({ id: 'google/gemini-1.5-flash-latest', provider: 'google', name: 'Gemini 1.5 Flash', description: "Google's fast and powerful multimodal model", architecture: { modality: 'multimodal' }, context_length: 1000000 });
    }
    if (apiKeys.openai) {
        combinedModels.push({ id: 'openai/gpt-4o', provider: 'openai', name:'GPT-4o', description: "OpenAI's flagship model", architecture: { modality: 'multimodal' }, context_length: 128000 });
        combinedModels.push({ id: 'openai/gpt-4-turbo', provider: 'openai', name:'GPT-4 Turbo', description: "OpenAI's powerful turbo model", architecture: { modality: 'multimodal' }, context_length: 128000 });
    }
    if (apiKeys.anthropic) {
        combinedModels.push({ id: 'anthropic/claude-3.5-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', description: "Anthropic's latest model", architecture: { modality: 'multimodal' }, context_length: 200000 });
        combinedModels.push({ id: 'anthropic/claude-3-opus', provider: 'anthropic', name: 'Claude 3 Opus', description: "Anthropic's most powerful model", architecture: { modality: 'multimodal' }, context_length: 200000 });
    }
    if (apiKeys.groq) {
        combinedModels.push({ id: 'groq/llama-3.3-70b-versatile', provider: 'groq', name: 'Llama 3.3 70B (Groq)', description: "Fast Llama inference on Groq", architecture: { modality: 'text' }, context_length: 128000 });
    }
    if (apiKeys.cohere) combinedModels.push({ id: 'cohere/command-r+', provider: 'cohere', name: 'Command R+', description: "Cohere's powerful model", architecture: { modality: 'multimodal' }, context_length: 128000 });
    if (apiKeys.mistral) combinedModels.push({ id: 'mistralai/mistral-large-latest', provider: 'mistral', name: 'Mistral Large', description: "Mistral's flagship model", architecture: { modality: 'text' }, context_length: 32000 });
    if (apiKeys.xai) combinedModels.push({ id: 'xai/grok-1', provider: 'xai', name: 'Grok-1', description: "X.ai's model", architecture: { modality: 'text' }, context_length: 8192 });
    if (apiKeys.alibaba) combinedModels.push({ id: 'alibaba/qwen-turbo', provider: 'alibaba', name: 'Qwen Turbo', description: "Alibaba's fast model", architecture: { modality: 'text' }, context_length: 8000 });
    if (apiKeys.zhipu) combinedModels.push({ id: 'zhipu/glm-4', provider: 'zhipu', name: 'GLM-4', description: 'Zhipu AI model', architecture: { modality: 'text' }, context_length: 128000 });
    if (apiKeys.moonshot) combinedModels.push({ id: 'moonshot/moonshot-v1-128k', provider: 'moonshot', name: 'Moonshot v1', description: 'Model with a very large context window', architecture: { modality: 'text' }, context_length: 128000 });

    // 3. Fetch, curate, and add OpenRouter & Groq models
    if (apiKeys.openrouter || apiKeys.groq) {
        const allApiModels = await fetchOpenRouterModels();

        const curatedModels: ModelWithProvider[] = allApiModels
            .map(model => {
                const isFree = (model.pricing?.prompt === "0.000000" && model.pricing?.completion === "0.000000") || model.id.endsWith(':free');
                let provider = model.id.split('/')[0] || 'openrouter';
                if (provider === 'mistralai') provider = 'openrouter'; // Fix for mistralai provider name
                if (model.id.startsWith('groq/')) provider = 'groq';

                return { ...model, provider, isFree };
            })
            .filter(model => {
                const isChatModel = model.id.includes('chat') || model.id.includes('instruct') || model.architecture?.modality === 'multimodal' || model.provider === 'groq' || model.id.includes('claude') || model.id.includes('gpt');
                const isExcluded = ['sdxl', 'dall-e', 'stable-diffusion', 'whisper', 'tts', 'pdx-cs-ai', 'image', 'edit'].some(term => model.id.includes(term));

                const hasKey = (model.provider === 'groq' && apiKeys.groq) || (model.provider !== 'groq' && apiKeys.openrouter);

                return hasKey && isChatModel && !isExcluded;
            });

        combinedModels.push(...curatedModels);
    }

    // 4. Remove duplicates, prioritizing direct-keyed models over OpenRouter versions
    const uniqueModels = new Map<string, ModelWithProvider>();
    for (const model of combinedModels) {
        // Use the full ID for uniqueness to allow for different providers for the same model name
        if (!uniqueModels.has(model.id) || (model.provider !== 'openrouter' && model.provider !== 'groq')) {
            uniqueModels.set(model.id, model);
        }
    }

    // 5. Drop any model the app cannot actually reach with the current credentials.
    const callableModels = Array.from(uniqueModels.values()).filter(m => isModelCallable(m, apiKeys, localConfig));

    return sortModelsForDisplay(callableModels);
}

/**
 * Economy strategy: choose the FREE model with the highest intelligence score
 * from the AIchain catalog. Falls back to the first free model when no catalog
 * data is available, and to index 0 when nothing is free.
 */
export function pickEconomyModelIndex(
    strategy: ModelWithProvider[],
    intelligenceById?: Map<string, number>,
): number {
    let bestIdx = -1;
    let bestScore = -1;
    strategy.forEach((model, idx) => {
        if (!model.isFree) return;
        const baseId = model.id.toLowerCase().replace(/:free$/, '');
        const score = intelligenceById?.get(baseId) ?? intelligenceById?.get(model.id.toLowerCase()) ?? 0;
        if (bestIdx === -1 || score > bestScore) {
            bestScore = score;
            bestIdx = idx;
        }
    });
    return bestIdx !== -1 ? bestIdx : 0;
}

/**
 * Economy ordering: ALL free models first (ranked by AIchain catalog
 * intelligence, descending), then paid models in their original order.
 * This makes the entire failover chain walk free options before spending
 * a single token of credit.
 */
export function orderStrategyForEconomy(
    strategy: ModelWithProvider[],
    intelligenceById?: Map<string, number>,
): ModelWithProvider[] {
    const score = (m: ModelWithProvider) => {
        const baseId = m.id.toLowerCase().replace(/:free$/, '');
        return intelligenceById?.get(baseId) ?? intelligenceById?.get(m.id.toLowerCase()) ?? 0;
    };
    const free = strategy.filter(m => m.isFree);
    const paid = strategy.filter(m => !m.isFree);
    const freeRanked = free
        .map((m, i) => ({ m, i, s: score(m) }))
        .sort((a, b) => (b.s - a.s) || (a.i - b.i)) // stable: original order on ties
        .map(x => x.m);
    return [...freeRanked, ...paid];
}

export function sortModelsForDisplay(models: ModelWithProvider[]): ModelWithProvider[] {
    const DIRECT_KEY_MODEL_PRIORITY: Record<string, number> = {
        'openai/gpt-4o': 1,
        'anthropic/claude-3.5-sonnet': 2,
        'google/gemini-1.5-pro-latest': 3,
        'anthropic/claude-3-opus': 4,
        'cohere/command-r+': 5,
        'openai/gpt-4-turbo': 10,
        'google/gemini-1.5-flash-latest': 11,
        'zhipu/glm-4': 12,
        'mistralai/mistral-large-latest': 13,
        'moonshot/moonshot-v1-128k': 20,
    };

    return [...models].sort((a, b) => {
        const priorityA = DIRECT_KEY_MODEL_PRIORITY[a.id];
        const priorityB = DIRECT_KEY_MODEL_PRIORITY[b.id];

        if (priorityA !== undefined && priorityB !== undefined) return priorityA - priorityB;
        if (priorityA !== undefined) return -1;
        if (priorityB !== undefined) return 1;

        const popularityA = a.popularity || 0;
        const popularityB = b.popularity || 0;

        if (popularityA !== popularityB) return popularityB - popularityA;

        return a.id.localeCompare(b.id);
    });
}

export { getModelCapabilities };
