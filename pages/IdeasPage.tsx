import React from 'react';
import { DASHBOARD_URL } from '../services/catalogService';

interface Card { icon: string; title: string; body: React.ReactNode; }

export const IdeasPage: React.FC = () => (
    <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-1">Solutions & Ideas</h1>
        <p className="text-sm text-[#a0a0a0] mb-6">
            How the AI Chain ecosystem fits together, and recipes for getting frontier-level results on a hobby budget.
        </p>

        <div className="space-y-4">
            {CARDS.map(card => (
                <article key={card.title} className="bg-[#2c2c2c] border border-[#333] rounded-xl p-5">
                    <h2 className="text-white font-semibold mb-2"><i className={`fa-solid ${card.icon} text-[#4a90e2] mr-2`} />{card.title}</h2>
                    <div className="text-sm text-[#a0a0a0] leading-relaxed space-y-2">{card.body}</div>
                </article>
            ))}
        </div>
    </div>
);

const CARDS: Card[] = [
    {
        icon: 'fa-layer-group',
        title: 'The two-plane architecture',
        body: (
            <>
                <p>
                    This site is the <strong className="text-white">interface plane</strong>; the{' '}
                    <a className="text-[#4a90e2] hover:underline" href="https://github.com/filokloi/AIchain" target="_blank" rel="noreferrer">AIchain repository</a>{' '}
                    is the <strong className="text-white">data plane</strong>. Every 12 hours its arbitration pipeline re-scores ~336 models from
                    multiple sources (benchmarks, LMSYS, OpenRouter, Artificial Analysis) and publishes the ranked catalog that the
                    Models, Free, and Self-host pages render. The <a className="text-[#4a90e2] hover:underline" href={DASHBOARD_URL} target="_blank" rel="noreferrer">live dashboard</a>{' '}
                    shows the same data from the operator's point of view.
                </p>
                <p>
                    A third piece — the <code className="text-[#4a90e2]">aichaind</code> sidecar — runs locally and applies the same catalog to
                    real routing decisions: policy checks, PII redaction, cost optimization, and automatic failover between providers.
                </p>
            </>
        ),
    },
    {
        icon: 'fa-arrow-down-1-9',
        title: 'Why cascading beats picking "the best model"',
        body: (
            <p>
                Every provider rate-limits, has outages, and changes prices. Instead of betting on one model, the Chat tab builds an
                ordered chain from your keys and walks down it on failure: <em>maximum intelligence, maximum stability, minimum cost</em>.
                The Economy strategy starts at free models and only escalates when they fail; Power starts at the top. You stop thinking
                about providers entirely.
            </p>
        ),
    },
    {
        icon: 'fa-piggy-bank',
        title: 'Recipe: the $0 starter stack',
        body: (
            <ol className="list-decimal list-inside space-y-1">
                <li>Create a free <strong className="text-white">Google AI Studio</strong> key → strong multimodal baseline.</li>
                <li>Add a free <strong className="text-white">OpenRouter</strong> account → unlocks all <code className="text-green-400">:free</code> variants as fallbacks.</li>
                <li>Install <strong className="text-white">Ollama</strong> and pull one consumer-class model from the Self-host page → offline safety net.</li>
                <li>In Chat → Settings, add both keys + the local URL, set the slider to Economy. Done: a failover chain that costs nothing.</li>
            </ol>
        ),
    },
    {
        icon: 'fa-scale-balanced',
        title: 'Recipe: cheap but serious work',
        body: (
            <p>
                Use the Models page sorted by <strong className="text-white">Value</strong> (cost efficiency) with the task filter set to your workload —
                e.g. "Good at: coding". The sweet spot is usually an open-weight heavy hitter at &lt;$1/M tokens, with a free frontier
                model as fallback and a subscription bridge (like the Codex window) for the hardest queries.
            </p>
        ),
    },
    {
        icon: 'fa-road',
        title: 'Roadmap ideas',
        body: (
            <ul className="list-disc list-inside space-y-1">
                <li>Pick a model in the Models table and jump straight into Chat with it pinned.</li>
                <li>Per-task leaderboards (best free coder, best long-context summarizer…).</li>
                <li>Price-drop alerts when the 12-hour refresh detects cheaper tiers.</li>
                <li>One-click "import strategy" — turn a filtered table view into a Chat failover chain.</li>
            </ul>
        ),
    },
];
