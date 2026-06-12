import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isModelCallable,
  sortModelsForDisplay,
  getModelCapabilities,
  fetchAndBuildModelStrategy,
  __resetModelCache,
} from '../modelService';
import type { ModelWithProvider } from '../../types';

const m = (over: Partial<ModelWithProvider>): ModelWithProvider => ({
  id: 'x/y', name: 'y', description: '', provider: 'openrouter', ...over,
});

describe('isModelCallable', () => {
  it('local requires a server URL', () => {
    expect(isModelCallable(m({ provider: 'local' }), {}, { serverUrl: '', apiKey: '' })).toBe(false);
    expect(isModelCallable(m({ provider: 'local' }), {}, { serverUrl: 'http://x', apiKey: '' })).toBe(true);
  });

  it('direct providers need their own key', () => {
    expect(isModelCallable(m({ provider: 'anthropic' }), {}, { serverUrl: '', apiKey: '' })).toBe(false);
    expect(isModelCallable(m({ provider: 'anthropic' }), { anthropic: 'k' }, { serverUrl: '', apiKey: '' })).toBe(true);
    expect(isModelCallable(m({ provider: 'groq' }), { groq: 'k' }, { serverUrl: '', apiKey: '' })).toBe(true);
  });

  it('OpenRouter key makes any provider callable', () => {
    expect(isModelCallable(m({ provider: 'cohere' }), { openrouter: 'k' }, { serverUrl: '', apiKey: '' })).toBe(true);
    expect(isModelCallable(m({ provider: 'mistral' }), { openrouter: 'k' }, { serverUrl: '', apiKey: '' })).toBe(true);
  });

  it('providers without direct support and without OpenRouter are NOT callable', () => {
    expect(isModelCallable(m({ provider: 'cohere' }), { cohere: 'k' }, { serverUrl: '', apiKey: '' })).toBe(false);
    expect(isModelCallable(m({ provider: 'xai' }), { xai: 'k' }, { serverUrl: '', apiKey: '' })).toBe(false);
  });
});

describe('getModelCapabilities', () => {
  it('detects multimodal and top tier', () => {
    const caps = getModelCapabilities(m({ id: 'openai/gpt-4o', provider: 'openai', context_length: 128000 }));
    expect(caps.isMultimodal).toBe(true);
    expect(caps.isTopTier).toBe(true);
    expect(caps.hasLargeContext).toBe(true);
  });
  it('treats all google models as multimodal', () => {
    expect(getModelCapabilities(m({ provider: 'google' })).isMultimodal).toBe(true);
  });
});

describe('sortModelsForDisplay', () => {
  it('orders by explicit priority first', () => {
    const models = [
      m({ id: 'moonshot/moonshot-v1-128k' }),
      m({ id: 'openai/gpt-4o' }),
      m({ id: 'anthropic/claude-3.5-sonnet' }),
    ];
    const sorted = sortModelsForDisplay(models).map(x => x.id);
    expect(sorted[0]).toBe('openai/gpt-4o');
    expect(sorted[1]).toBe('anthropic/claude-3.5-sonnet');
  });
  it('falls back to popularity then id', () => {
    const models = [
      m({ id: 'b/z', popularity: 1 }),
      m({ id: 'a/z', popularity: 5 }),
    ];
    expect(sortModelsForDisplay(models)[0].id).toBe('a/z');
  });
});

describe('fetchAndBuildModelStrategy', () => {
  afterEach(() => { vi.restoreAllMocks(); __resetModelCache(); });
  beforeEach(() => { __resetModelCache(); });

  it('drops phantom models that cannot be reached', async () => {
    // cohere key but no OpenRouter -> cohere model must be filtered out
    const strat = await fetchAndBuildModelStrategy({ cohere: 'k' }, { serverUrl: '', apiKey: '' });
    expect(strat.find(x => x.provider === 'cohere')).toBeUndefined();
  });

  it('keeps directly callable models', async () => {
    const strat = await fetchAndBuildModelStrategy({ openai: 'k', anthropic: 'k' }, { serverUrl: '', apiKey: '' });
    expect(strat.find(x => x.id === 'openai/gpt-4o')).toBeDefined();
    expect(strat.find(x => x.id === 'anthropic/claude-3.5-sonnet')).toBeDefined();
  });

  it('curates OpenRouter models behind a key', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [
        { id: 'meta/llama-3-instruct', name: 'Llama', description: '', pricing: { prompt: '0.000000', completion: '0.000000' } },
        { id: 'stability/sdxl', name: 'SDXL', description: '' },
      ] }),
    } as any);
    const strat = await fetchAndBuildModelStrategy({ openrouter: 'k' }, { serverUrl: '', apiKey: '' });
    expect(strat.find(x => x.id === 'meta/llama-3-instruct')).toBeDefined();
    expect(strat.find(x => x.id === 'stability/sdxl')).toBeUndefined(); // excluded image model
  });
});

describe('pickEconomyModelIndex', () => {
  const strat = [
    m({ id: 'openai/gpt-4o', isFree: false }),
    m({ id: 'weak/model:free', isFree: true }),
    m({ id: 'strong/model:free', isFree: true }),
    m({ id: 'mid/model', isFree: true }),
  ];

  it('picks the smartest free model using catalog intelligence', async () => {
    const { pickEconomyModelIndex } = await import('../modelService');
    const intel = new Map([['weak/model', 40], ['strong/model', 95], ['mid/model', 70]]);
    expect(pickEconomyModelIndex(strat, intel)).toBe(2);
  });

  it('falls back to the first free model without catalog data', async () => {
    const { pickEconomyModelIndex } = await import('../modelService');
    expect(pickEconomyModelIndex(strat)).toBe(1);
    expect(pickEconomyModelIndex(strat, new Map())).toBe(1);
  });

  it('returns 0 when nothing is free', async () => {
    const { pickEconomyModelIndex } = await import('../modelService');
    expect(pickEconomyModelIndex([m({ isFree: false }), m({ isFree: false })])).toBe(0);
  });
});

describe('orderStrategyForEconomy', () => {
  const strat = [
    m({ id: 'openai/gpt-4o', isFree: false }),
    m({ id: 'weak/model:free', isFree: true }),
    m({ id: 'anthropic/claude-3-opus', isFree: false }),
    m({ id: 'strong/model:free', isFree: true }),
  ];

  it('puts ALL free models before ALL paid models', async () => {
    const { orderStrategyForEconomy } = await import('../modelService');
    const ordered = orderStrategyForEconomy(strat);
    expect(ordered.map(x => x.isFree)).toEqual([true, true, false, false]);
  });

  it('ranks free models by catalog intelligence, descending', async () => {
    const { orderStrategyForEconomy } = await import('../modelService');
    const intel = new Map([['weak/model', 40], ['strong/model', 95]]);
    const ordered = orderStrategyForEconomy(strat, intel);
    expect(ordered[0].id).toBe('strong/model:free');
    expect(ordered[1].id).toBe('weak/model:free');
  });

  it('keeps paid models in their original relative order', async () => {
    const { orderStrategyForEconomy } = await import('../modelService');
    const ordered = orderStrategyForEconomy(strat);
    const paid = ordered.filter(x => !x.isFree).map(x => x.id);
    expect(paid).toEqual(['openai/gpt-4o', 'anthropic/claude-3-opus']);
  });

  it('is stable on intelligence ties (original order preserved)', async () => {
    const { orderStrategyForEconomy } = await import('../modelService');
    const ordered = orderStrategyForEconomy(strat, new Map());
    expect(ordered[0].id).toBe('weak/model:free');
  });
});
