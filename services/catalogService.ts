/**
 * Catalog service — bridges the AI Chain site with the AIchain data plane.
 *
 * The AIchain repository (github.com/filokloi/AIchain) publishes a ranked
 * catalog of AI models to GitHub Pages every 12 hours via GitHub Actions.
 * Because both projects are served from the same origin (filokloi.github.io),
 * we can fetch it directly with no CORS concerns.
 */

export const CATALOG_URL = 'https://filokloi.github.io/AIchain/ai_routing_table.json';
export const DASHBOARD_URL = 'https://filokloi.github.io/AIchain/';
const CACHE_KEY = 'ai-chain-catalog-cache-v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // matches the upstream refresh cadence

export type CatalogTier = 'FREE_FRONTIER' | 'OAUTH_BRIDGE' | 'HEAVY_HITTER';

export interface CatalogModel {
    id: string;
    provider: string;
    displayName: string;
    tier: CatalogTier;
    /** 0-100 composite scores from the AIchain arbitrator. */
    intelligence: number;
    speed: number;
    stability: number;
    availability: number;
    costEfficiency: number;
    /** USD per token (averaged prompt/completion). 0 = free. */
    averageCost: number;
    promptCost: number;
    completionCost: number;
    contextLength: number;
    /** 0-100 per-task quality scores (coding, reasoning, vision, ...). */
    taskScores: Record<string, number>;
    primaryTasks: string[];
    isFree: boolean;
    selfHostable: boolean;
    openWeight: boolean;
    hostingModes: string[];
    preferredRuntimes: string[];
    parameterScaleB: number | null;
    hardwareHint: string | null;
    selfHostingNotes: string | null;
}

export interface CatalogSnapshot {
    generatedAt: string | null;
    models: CatalogModel[];
}

/** Parse one raw routing_hierarchy entry into the trimmed site model. */
export function parseCatalogEntry(raw: any): CatalogModel | null {
    if (!raw || typeof raw.model !== 'string') return null;
    const metrics = raw.metrics || {};
    const rawMetrics = raw.raw_metrics || {};
    const task = raw.task_metadata || {};
    const hosting = raw.self_hosting || {};
    const averageCost = Number(rawMetrics.average_cost ?? 0);
    return {
        id: raw.model,
        provider: String(raw.provider || raw.model.split('/')[0] || 'unknown'),
        displayName: String(raw.display_name || raw.model),
        tier: (raw.tier as CatalogTier) || 'HEAVY_HITTER',
        intelligence: Number(metrics.intelligence ?? rawMetrics.intelligence_base ?? 0),
        speed: Number(metrics.speed ?? 0),
        stability: Number(metrics.stability ?? 0),
        availability: Number(metrics.availability ?? 0),
        costEfficiency: Number(metrics.cost_efficiency ?? 0),
        averageCost,
        promptCost: Number(rawMetrics.prompt_cost ?? 0),
        completionCost: Number(rawMetrics.completion_cost ?? 0),
        contextLength: Number(rawMetrics.context_length ?? 0),
        taskScores: (task.quality_by_task && typeof task.quality_by_task === 'object') ? task.quality_by_task : {},
        primaryTasks: Array.isArray(task.primary) ? task.primary : [],
        isFree: averageCost === 0 || raw.tier === 'FREE_FRONTIER' || raw.model.endsWith(':free'),
        selfHostable: Boolean(hosting.self_hostable),
        openWeight: Boolean(hosting.open_weight),
        hostingModes: Array.isArray(hosting.hosting_modes) ? hosting.hosting_modes : [],
        preferredRuntimes: Array.isArray(hosting.preferred_runtimes) ? hosting.preferred_runtimes : [],
        parameterScaleB: hosting.parameter_scale_billions ?? null,
        hardwareHint: hosting.hardware_profile_hint ?? null,
        selfHostingNotes: hosting.self_hosting_notes ?? null,
    };
}

export function parseCatalog(data: any): CatalogSnapshot {
    const list = Array.isArray(data?.routing_hierarchy) ? data.routing_hierarchy : [];
    const models = list
        .map(parseCatalogEntry)
        .filter((m: CatalogModel | null): m is CatalogModel => m !== null);
    return { generatedAt: data?.last_synopsis?.generated_at ?? data?.generated_at ?? null, models };
}

function readCache(): CatalogSnapshot | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { savedAt, snapshot } = JSON.parse(raw);
        if (typeof savedAt !== 'number' || Date.now() - savedAt > CACHE_TTL_MS) return null;
        if (!snapshot || !Array.isArray(snapshot.models)) return null;
        return snapshot;
    } catch {
        return null;
    }
}

function writeCache(snapshot: CatalogSnapshot) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), snapshot }));
    } catch {
        // Quota exceeded is non-fatal; we simply skip caching.
    }
}

let inMemory: CatalogSnapshot | null = null;

/** For tests. */
export function __resetCatalogCache() {
    inMemory = null;
    try { localStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}

/**
 * Load the catalog: in-memory -> localStorage (12h TTL) -> network.
 */
export async function loadCatalog(force = false): Promise<CatalogSnapshot> {
    if (!force) {
        if (inMemory) return inMemory;
        const cached = readCache();
        if (cached) {
            inMemory = cached;
            return cached;
        }
    }
    const response = await fetch(CATALOG_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error(`Catalog fetch failed (HTTP ${response.status}). The AIchain data plane may be redeploying — try again shortly.`);
    }
    const snapshot = parseCatalog(await response.json());
    if (snapshot.models.length === 0) {
        throw new Error('Catalog is empty or has an unexpected format.');
    }
    inMemory = snapshot;
    writeCache(snapshot);
    return snapshot;
}

// ---------------------------------------------------------------------------
// Pure helpers for the comparison UI (kept here so they are unit-testable).
// ---------------------------------------------------------------------------

export type SortKey = 'intelligence' | 'speed' | 'averageCost' | 'contextLength' | 'costEfficiency' | 'displayName';

export interface CatalogFilters {
    search?: string;
    tier?: CatalogTier | 'ALL';
    freeOnly?: boolean;
    openWeightOnly?: boolean;
    task?: string;       // e.g. 'coding' — requires taskScores[task] >= minTaskScore
    minTaskScore?: number;
}

export function filterModels(models: CatalogModel[], f: CatalogFilters): CatalogModel[] {
    const search = (f.search || '').trim().toLowerCase();
    return models.filter(m => {
        if (search && !(`${m.id} ${m.provider} ${m.displayName}`.toLowerCase().includes(search))) return false;
        if (f.tier && f.tier !== 'ALL' && m.tier !== f.tier) return false;
        if (f.freeOnly && !m.isFree) return false;
        if (f.openWeightOnly && !m.openWeight) return false;
        if (f.task) {
            const score = m.taskScores[f.task] ?? 0;
            if (score < (f.minTaskScore ?? 1)) return false;
        }
        return true;
    });
}

export function sortModels(models: CatalogModel[], key: SortKey, direction: 'asc' | 'desc'): CatalogModel[] {
    const dir = direction === 'asc' ? 1 : -1;
    return [...models].sort((a, b) => {
        if (key === 'displayName') return a.displayName.localeCompare(b.displayName) * dir;
        const va = a[key] as number;
        const vb = b[key] as number;
        if (va !== vb) return (va - vb) * dir;
        return a.displayName.localeCompare(b.displayName);
    });
}

export function formatCost(perToken: number): string {
    if (perToken === 0) return 'Free';
    const perMillion = perToken * 1_000_000;
    if (perMillion < 0.01) return `<$0.01/M`;
    return `$${perMillion.toFixed(2)}/M`;
}

export function formatContext(tokens: number): string {
    if (!tokens) return '—';
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
    return String(tokens);
}
