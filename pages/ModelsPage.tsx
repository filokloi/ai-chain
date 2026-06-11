import React, { useMemo, useState } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import {
    filterModels, sortModels, formatCost, formatContext,
    type CatalogFilters, type CatalogTier, type SortKey,
} from '../services/catalogService';

const TASKS = ['coding', 'reasoning', 'vision', 'long_context', 'extraction', 'structured_output', 'general_chat'];

const TIER_BADGE: Record<CatalogTier, { label: string; cls: string }> = {
    FREE_FRONTIER: { label: 'FREE', cls: 'bg-green-500/20 text-green-400' },
    OAUTH_BRIDGE: { label: 'BRIDGE', cls: 'bg-yellow-500/20 text-yellow-400' },
    HEAVY_HITTER: { label: 'PAID', cls: 'bg-blue-500/20 text-blue-400' },
};

export const ModelsPage: React.FC = () => {
    const { data, loading, error, refresh } = useCatalog();
    const [filters, setFilters] = useState<CatalogFilters>({ tier: 'ALL' });
    const [sortKey, setSortKey] = useState<SortKey>('intelligence');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const models = useMemo(() => {
        if (!data) return [];
        return sortModels(filterModels(data.models, filters), sortKey, sortDir);
    }, [data, filters, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir(key === 'displayName' ? 'asc' : 'desc'); }
    };

    const Th: React.FC<{ k: SortKey; children: React.ReactNode; align?: string }> = ({ k, children, align = 'text-right' }) => (
        <th
            onClick={() => toggleSort(k)}
            className={`px-3 py-2 ${align} cursor-pointer select-none hover:text-white whitespace-nowrap`}
        >
            {children}{sortKey === k && <i className={`fa-solid fa-caret-${sortDir === 'asc' ? 'up' : 'down'} ml-1`} />}
        </th>
    );

    if (loading) return <Centered><i className="fa-solid fa-spinner fa-spin mr-2" />Loading catalog…</Centered>;
    if (error) return (
        <Centered>
            <div className="text-center">
                <p className="text-red-400 mb-3">{error}</p>
                <button onClick={() => refresh(true)} className="px-4 py-2 bg-[#4a90e2] rounded-lg text-white">Retry</button>
            </div>
        </Centered>
    );

    return (
        <div className="flex-1 overflow-auto p-4 md:p-6">
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-white">Model Comparison</h1>
                <p className="text-sm text-[#a0a0a0]">
                    {data?.models.length} models ranked by the{' '}
                    <a className="text-[#4a90e2] hover:underline" href="https://github.com/filokloi/AIchain" target="_blank" rel="noreferrer">AIchain</a>{' '}
                    arbitration pipeline. Scores are 0–100 composites; cost is USD per million tokens.
                </p>
            </header>

            <div className="flex flex-wrap gap-2 mb-4 items-center">
                <input
                    value={filters.search || ''}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    placeholder="Search model or provider…"
                    className="bg-[#2c2c2c] border border-[#444] rounded-lg px-3 py-1.5 text-sm text-white w-56 outline-none focus:border-[#4a90e2]"
                />
                <select
                    value={filters.tier}
                    onChange={e => setFilters(f => ({ ...f, tier: e.target.value as CatalogFilters['tier'] }))}
                    className="bg-[#2c2c2c] border border-[#444] rounded-lg px-2 py-1.5 text-sm text-white"
                >
                    <option value="ALL">All tiers</option>
                    <option value="FREE_FRONTIER">Free frontier</option>
                    <option value="OAUTH_BRIDGE">OAuth bridge</option>
                    <option value="HEAVY_HITTER">Heavy hitter</option>
                </select>
                <select
                    value={filters.task || ''}
                    onChange={e => setFilters(f => ({ ...f, task: e.target.value || undefined, minTaskScore: 70 }))}
                    className="bg-[#2c2c2c] border border-[#444] rounded-lg px-2 py-1.5 text-sm text-white"
                >
                    <option value="">Any task</option>
                    {TASKS.map(t => <option key={t} value={t}>Good at: {t.replace('_', ' ')} (70+)</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-[#a0a0a0] cursor-pointer">
                    <input type="checkbox" checked={!!filters.freeOnly} onChange={e => setFilters(f => ({ ...f, freeOnly: e.target.checked }))} />
                    Free only
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[#a0a0a0] cursor-pointer">
                    <input type="checkbox" checked={!!filters.openWeightOnly} onChange={e => setFilters(f => ({ ...f, openWeightOnly: e.target.checked }))} />
                    Open weight
                </label>
                <span className="text-xs text-[#777] ml-auto">{models.length} shown</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#333]">
                <table className="w-full text-sm">
                    <thead className="bg-[#222] text-[#a0a0a0] sticky top-0">
                        <tr>
                            <Th k="displayName" align="text-left">Model</Th>
                            <th className="px-3 py-2 text-center">Tier</th>
                            <Th k="intelligence">Intel</Th>
                            <Th k="speed">Speed</Th>
                            <Th k="averageCost">Cost</Th>
                            <Th k="contextLength">Context</Th>
                            <Th k="costEfficiency">Value</Th>
                            <th className="px-3 py-2 text-left">Best at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map(model => {
                            const badge = TIER_BADGE[model.tier];
                            return (
                                <tr key={model.id} className="border-t border-[#2a2a2a] hover:bg-[#222]">
                                    <td className="px-3 py-2">
                                        <div className="text-white font-medium">{model.displayName}</div>
                                        <div className="text-xs text-[#777]">{model.provider}{model.openWeight && <span className="ml-2 text-purple-400">open-weight</span>}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                                    </td>
                                    <td className="px-3 py-2 text-right text-white">{model.intelligence}</td>
                                    <td className="px-3 py-2 text-right">{model.speed || '—'}</td>
                                    <td className={`px-3 py-2 text-right ${model.isFree ? 'text-green-400' : ''}`}>{formatCost(model.averageCost)}</td>
                                    <td className="px-3 py-2 text-right">{formatContext(model.contextLength)}</td>
                                    <td className="px-3 py-2 text-right">{model.costEfficiency || '—'}</td>
                                    <td className="px-3 py-2 text-xs text-[#a0a0a0]">{model.primaryTasks.slice(0, 3).join(', ').replace(/_/g, ' ') || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {models.length === 0 && <p className="text-center text-[#777] py-8">No models match the current filters.</p>}
            </div>
        </div>
    );
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex-1 flex items-center justify-center text-[#a0a0a0]">{children}</div>
);
