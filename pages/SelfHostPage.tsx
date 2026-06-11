import React, { useMemo } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import { formatContext, type CatalogModel } from '../services/catalogService';

type HardwareClass = 'consumer' | 'workstation' | 'server' | 'unknown';

function hardwareClass(m: CatalogModel): HardwareClass {
    const hint = (m.hardwareHint || '').toLowerCase();
    if (hint.includes('consumer') || hint.includes('laptop')) return 'consumer';
    if (hint.includes('workstation')) return 'workstation';
    if (hint.includes('server') || hint.includes('multi_gpu') || hint.includes('80gb')) return 'server';
    if (m.parameterScaleB !== null) {
        if (m.parameterScaleB <= 15) return 'consumer';
        if (m.parameterScaleB <= 80) return 'workstation';
        return 'server';
    }
    return 'unknown';
}

const CLASS_META: Record<HardwareClass, { title: string; icon: string; blurb: string }> = {
    consumer: { title: 'Consumer hardware', icon: 'fa-laptop', blurb: 'Runs on a gaming laptop or desktop GPU (≤16 GB VRAM) with quantization. Start here.' },
    workstation: { title: 'Workstation class', icon: 'fa-desktop', blurb: 'Needs a 24–48 GB GPU (or Apple Silicon with lots of unified memory).' },
    server: { title: 'Server class', icon: 'fa-server', blurb: '80 GB+ or multi-GPU rigs. Frontier open-weight quality, datacenter budget.' },
    unknown: { title: 'Unclassified', icon: 'fa-circle-question', blurb: 'Open-weight models without a hardware profile yet.' },
};

export const SelfHostPage: React.FC = () => {
    const { data, loading, error, refresh } = useCatalog();

    const grouped = useMemo(() => {
        const open = (data?.models ?? []).filter(m => m.openWeight)
            .sort((a, b) => b.intelligence - a.intelligence);
        const g: Record<HardwareClass, CatalogModel[]> = { consumer: [], workstation: [], server: [], unknown: [] };
        open.forEach(m => g[hardwareClass(m)].push(m));
        return { groups: g, total: open.length };
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
            <h1 className="text-2xl font-bold text-white mb-1">Self-hosting Guide</h1>
            <p className="text-sm text-[#a0a0a0] mb-6">
                {grouped.total} open-weight models in the catalog can run on your own hardware — full privacy, zero per-token cost.
                Point the <a href="#/chat" className="text-[#4a90e2] hover:underline">Chat</a> tab's Local LLM URL at your server and they join the failover chain.
            </p>

            <div className="grid md:grid-cols-3 gap-3 mb-8">
                {[
                    { name: 'Ollama', cmd: 'ollama run llama3', text: 'Easiest start: one command per model, OpenAI-compatible API on port 11434.' },
                    { name: 'LM Studio', cmd: 'GUI → Start server', text: 'Desktop app with model browser, quantization picker, and a local server toggle.' },
                    { name: 'vLLM', cmd: 'vllm serve <model>', text: 'Production-grade throughput for serious GPUs; the choice for server-class models.' },
                ].map(rt => (
                    <div key={rt.name} className="bg-[#2c2c2c] border border-[#333] rounded-xl p-4">
                        <h3 className="text-white font-semibold">{rt.name}</h3>
                        <code className="block text-xs text-[#4a90e2] bg-black/40 rounded px-2 py-1 my-2">{rt.cmd}</code>
                        <p className="text-xs text-[#a0a0a0]">{rt.text}</p>
                    </div>
                ))}
            </div>

            {(['consumer', 'workstation', 'server', 'unknown'] as HardwareClass[]).map(cls => {
                const models = grouped.groups[cls];
                if (models.length === 0) return null;
                const meta = CLASS_META[cls];
                return (
                    <section key={cls} className="mb-8">
                        <h2 className="text-lg font-semibold text-white"><i className={`fa-solid ${meta.icon} text-[#4a90e2] mr-2`} />{meta.title} ({models.length})</h2>
                        <p className="text-xs text-[#a0a0a0] mb-3">{meta.blurb}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {models.map(m => (
                                <div key={m.id} className="bg-[#222] border border-[#333] rounded-xl p-3">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-white text-sm font-medium truncate" title={m.id}>{m.displayName}</span>
                                        {m.parameterScaleB !== null && <span className="text-xs text-purple-400 whitespace-nowrap">{m.parameterScaleB}B</span>}
                                    </div>
                                    <div className="text-xs text-[#777] mb-2">{m.provider}</div>
                                    <div className="flex flex-wrap gap-2 text-xs text-[#a0a0a0]">
                                        <span><i className="fa-solid fa-brain mr-1 text-[#4a90e2]" />{m.intelligence}</span>
                                        <span><i className="fa-solid fa-maximize mr-1 text-[#4a90e2]" />{formatContext(m.contextLength)}</span>
                                        {m.preferredRuntimes.length > 0 && <span><i className="fa-solid fa-gears mr-1 text-[#4a90e2]" />{m.preferredRuntimes.slice(0, 2).join(', ')}</span>}
                                    </div>
                                    {m.selfHostingNotes && <p className="text-[10px] text-[#666] mt-2 leading-snug">{m.selfHostingNotes}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
