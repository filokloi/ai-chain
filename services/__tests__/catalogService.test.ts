import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseCatalogEntry, parseCatalog, filterModels, sortModels,
  formatCost, formatContext, loadCatalog, __resetCatalogCache,
  type CatalogModel,
} from '../catalogService';

const RAW_ENTRY = {
  model: 'openai/codex-mini',
  provider: 'OpenAI',
  display_name: 'openai/codex-mini',
  tier: 'OAUTH_BRIDGE',
  raw_metrics: {
    intelligence_base: 88, context_length: 128000,
    prompt_cost: 0.0, completion_cost: 0.0, average_cost: 0.0,
  },
  metrics: {
    intelligence: 88, speed: 35, stability: 92, availability: 94, cost_efficiency: 100,
  },
  task_metadata: {
    quality_by_task: { coding: 100, reasoning: 88, vision: 18 },
    primary: ['coding'],
  },
  self_hosting: {
    self_hostable: false, open_weight: false,
    hosting_modes: ['oauth_bridge'], preferred_runtimes: [],
    parameter_scale_billions: null, hardware_profile_hint: null, self_hosting_notes: null,
  },
};

const m = (over: Partial<CatalogModel>): CatalogModel => ({
  id: 'x/y', provider: 'X', displayName: 'x/y', tier: 'HEAVY_HITTER',
  intelligence: 50, speed: 50, stability: 50, availability: 50, costEfficiency: 50,
  averageCost: 0.000001, promptCost: 0, completionCost: 0, contextLength: 8000,
  taskScores: {}, primaryTasks: [], isFree: false, selfHostable: false, openWeight: false,
  hostingModes: [], preferredRuntimes: [], parameterScaleB: null, hardwareHint: null,
  selfHostingNotes: null, ...over,
});

describe('parseCatalogEntry', () => {
  it('parses a real-shaped routing_hierarchy entry', () => {
    const model = parseCatalogEntry(RAW_ENTRY)!;
    expect(model.id).toBe('openai/codex-mini');
    expect(model.tier).toBe('OAUTH_BRIDGE');
    expect(model.intelligence).toBe(88);
    expect(model.contextLength).toBe(128000);
    expect(model.taskScores.coding).toBe(100);
    expect(model.isFree).toBe(true); // average_cost 0
  });

  it('flags FREE_FRONTIER and :free models as free', () => {
    expect(parseCatalogEntry({ ...RAW_ENTRY, tier: 'FREE_FRONTIER', raw_metrics: { average_cost: 0.5 } })!.isFree).toBe(true);
    expect(parseCatalogEntry({ ...RAW_ENTRY, model: 'meta/llama:free', raw_metrics: { average_cost: 0.5 } })!.isFree).toBe(true);
  });

  it('rejects malformed entries instead of crashing', () => {
    expect(parseCatalogEntry(null)).toBeNull();
    expect(parseCatalogEntry({})).toBeNull();
    const minimal = parseCatalogEntry({ model: 'a/b' })!;
    expect(minimal.taskScores).toEqual({});
    expect(minimal.contextLength).toBe(0);
  });
});

describe('parseCatalog', () => {
  it('extracts models and skips bad rows', () => {
    const snap = parseCatalog({ routing_hierarchy: [RAW_ENTRY, null, {}, RAW_ENTRY] });
    expect(snap.models).toHaveLength(2);
  });
  it('returns empty for unexpected payloads', () => {
    expect(parseCatalog({}).models).toHaveLength(0);
    expect(parseCatalog(null).models).toHaveLength(0);
  });
});

describe('filterModels', () => {
  const models = [
    m({ id: 'a/free', isFree: true, tier: 'FREE_FRONTIER', taskScores: { coding: 90 } }),
    m({ id: 'b/paid', tier: 'HEAVY_HITTER', openWeight: true, taskScores: { coding: 40 } }),
    m({ id: 'c/bridge', tier: 'OAUTH_BRIDGE', provider: 'OpenAI' }),
  ];
  it('filters by free flag, tier, open weight, and search', () => {
    expect(filterModels(models, { freeOnly: true })).toHaveLength(1);
    expect(filterModels(models, { tier: 'OAUTH_BRIDGE' })[0].id).toBe('c/bridge');
    expect(filterModels(models, { openWeightOnly: true })[0].id).toBe('b/paid');
    expect(filterModels(models, { search: 'openai' })[0].id).toBe('c/bridge');
  });
  it('filters by per-task minimum score', () => {
    expect(filterModels(models, { task: 'coding', minTaskScore: 80 })).toHaveLength(1);
    expect(filterModels(models, { task: 'coding', minTaskScore: 30 })).toHaveLength(2);
  });
});

describe('sortModels', () => {
  const models = [
    m({ id: 'a', displayName: 'a', intelligence: 10, averageCost: 0.5 }),
    m({ id: 'b', displayName: 'b', intelligence: 90, averageCost: 0.1 }),
  ];
  it('sorts numerically in both directions', () => {
    expect(sortModels(models, 'intelligence', 'desc')[0].id).toBe('b');
    expect(sortModels(models, 'averageCost', 'asc')[0].id).toBe('b');
  });
  it('sorts by name', () => {
    expect(sortModels(models, 'displayName', 'asc')[0].id).toBe('a');
  });
});

describe('formatters', () => {
  it('formats per-token cost as $/M tokens', () => {
    expect(formatCost(0)).toBe('Free');
    expect(formatCost(0.000005)).toBe('$5.00/M');
    expect(formatCost(0.000000001)).toBe('<$0.01/M');
  });
  it('formats context lengths', () => {
    expect(formatContext(128000)).toBe('128K');
    expect(formatContext(1048576)).toBe('1.0M');
    expect(formatContext(0)).toBe('—');
  });
});

describe('loadCatalog', () => {
  afterEach(() => { vi.restoreAllMocks(); __resetCatalogCache(); });

  it('fetches, parses, and memoizes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ routing_hierarchy: [RAW_ENTRY] }),
    } as any);
    const snap1 = await loadCatalog();
    const snap2 = await loadCatalog();
    expect(snap1.models).toHaveLength(1);
    expect(snap2).toBe(snap1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws a helpful error on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, status: 503 } as any);
    await expect(loadCatalog(true)).rejects.toThrow(/503/);
  });

  it('rejects empty catalogs', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true, json: async () => ({ routing_hierarchy: [] }),
    } as any);
    await expect(loadCatalog(true)).rejects.toThrow(/empty/i);
  });
});
