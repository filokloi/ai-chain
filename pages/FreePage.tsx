import React, { useMemo } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import { formatContext, type CatalogModel } from '../services/catalogService';

export const FreePage: React.FC = () => {
    const { data, loading, error, refresh } = useCatalog();

    const groups = useMemo(() => {
        const models = data?.models.filter(m => m.isFree) ?? [];
        return {
            frontier: models.filter(m => m.tier === 'FREE_FRONTIER').sort((a, b) => b.intelligence - a.intelligence),
            bridge: models.filter(m => m.tier === 'OAUTH_BRIDGE').sort((a, b) => b.intelligence - a.intelligence),
            other: models.filter(m => m.tier !== 'FREE_FRONTIER' && m.tier !== 'OAUTH_BRIDGE').sort((a, b) => b.intelligence - a.intelligence),
        };
    }, [data]);

    if (loading) return <p className="flex-1 flex items-center justify-center text-[#a0a0a0]"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading…</p>;
    if (error) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><p className="text-red-400 mb-3">{error}</p>
            <button onClick={() => refresh(true)} className="px-4 py-2 bg-[#4a90e2] rounded-lg text-white">Retry</button></div>
        </div>
    );

    return (
        <div className="flex-1 overflow-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-white mb-1">Free AI Options</h1>
            <p className="text-sm text-[#a0a0a0] mb-6">
                Every zero-cost path in the AIchain catalog, refreshed every 12 hours. Combine them in the{' '}
                <a href="#/chat" className="text-[#4a90e2] hover:underline">Chat</a> tab with the Economy strategy to chain free models with automatic failover.
            </p>

            <HowTo />

            <Section
                title={`Free frontier models (${groups.frontier.length})`}
                subtitle="Genuinely free endpoints — mostly OpenRouter ':free' variants and provider free tiers. Rate-limited but $0."
                models={groups.frontier}
            />
            <Section
                title={`Subscription bridge models (${groups.bridge.length})`}
                subtitle="Included with subscriptions you may already have (e.g. the Codex sign-in window). No per-token billing, but plan quotas apply."
                models={groups.bridge}
            />
            {groups.other.length > 0 && (
                <Section title={`Other zero-cost entries (${groups.other.length})`} subtitle="" models={groups.other} />
            )}
        </div>
    );
};

const HowTo: React.FC = () => (
    <div className="grid md:grid-cols-3 gap-3 mb-8">
        {[
            { icon: 'fa-route', title: 'OpenRouter :free', text: 'One OpenRouter key unlocks every model below that ends in ":free" — no separate accounts needed.' },
            { icon: 'fa-flask', title: 'Google AI Studio', text: 'A free AI Studio key gives generous daily Gemini quotas — the strongest free multimodal option.' },
            { icon: 'fa-id-badge', title: 'Subscription bridges', text: 'Tools like the Codex window expose frontier models through a subscription you already pay for.' },
        ].map(card => (
            <div key={card.title} className="bg-[#2c2c2c] border border-[#333] rounded-xl p-4">
                <i className={`fa-solid ${card.icon} text-[#4a90e2] text-lg mb-2`} />
                <h3 className="text-white font-semibold mb-1">{card.title}</h3>
                <p className="text-xs text-[#a0a0a0] leading-relaxed">{card.text}</p>
            </div>
        ))}
    </div>
);

const Section: React.FC<{ title: string; subtitle: string; models: CatalogModel[] }> = ({ title, subtitle, models }) => (
    <section className="mb-8">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-[#a0a0a0] mb-3">{subtitle}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {models.map(m => (
                <div key={m.id} className="bg-[#222] border border-[#333] rounded-xl p-3 hover:border-[#4a90e2]/50 transition-colors">
                    <div className="text-white text-sm font-medium truncate" title={m.id}>{m.displayName}</div>
                    <div className="text-xs text-[#777] mb-2">{m.provider}</div>
                    <div className="flex gap-3 text-xs text-[#a0a0a0]">
                        <span title="Intelligence"><i className="fa-solid fa-brain mr-1 text-[#4a90e2]" />{m.intelligence}</span>
                        <span title="Context"><i className="fa-solid fa-maximize mr-1 text-[#4a90e2]" />{formatContext(m.contextLength)}</span>
                        {m.primaryTasks[0] && <span className="truncate" title="Best at"><i className="fa-solid fa-star mr-1 text-[#4a90e2]" />{m.primaryTasks[0].replace(/_/g, ' ')}</span>}
                    </div>
                </div>
            ))}
        </div>
    </section>
);
