import React, { useState, useMemo } from 'react';
import { ModelWithProvider } from '../types';
import { getModelCapabilities, sortModelsForDisplay } from '../services/modelService';

interface ModelSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    models: ModelWithProvider[];
    currentModelIndex: number;
    onSelectModel: (index: number) => void;
}

const ModelCapabilities: React.FC<{ model: ModelWithProvider }> = ({ model }) => {
    const { isMultimodal, hasLargeContext, isTopTier } = getModelCapabilities(model);
    return (
        <div className="flex items-center gap-3 text-base text-[--text-secondary-color]">
            {model.isFree && <i className="fa-solid fa-dollar-sign text-green-400" title="Free to use"></i>}
            {isTopTier && <>
                <i className="fa-solid fa-brain text-purple-400" title="Advanced Reasoning"></i>
                <i className="fa-solid fa-screwdriver-wrench text-blue-400" title="Tool Use / Function Calling"></i>
            </>}
            {isMultimodal && <i className="fa-solid fa-eye text-yellow-400" title="Image Support (Vision)"></i>}
            {hasLargeContext && <i className="fa-solid fa-file-lines text-gray-400" title="Large Context Window"></i>}
        </div>
    );
};

const ModelOption: React.FC<{ model: ModelWithProvider, isActive: boolean, onClick: () => void }> = ({ model, isActive, onClick }) => {
    const isFreeAndInactive = model.isFree && !isActive;
    
    const baseClasses = 'flex justify-between items-center p-4 border rounded-lg cursor-pointer transition-all';
    
    let stateClasses = 'bg-[--bg-color] border-[--border-color] hover:bg-[--surface-color] hover:border-[--primary-color]';

    if (isActive) {
        stateClasses = 'bg-[--primary-color] border-[--primary-color] text-white';
    }

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${stateClasses}`}
        >
            <div className="flex-grow min-w-0">
                <span className={`font-semibold break-words ${isFreeAndInactive ? 'text-green-400' : ''}`}>{model.id}</span>
                <span className={`block text-xs ${isActive ? 'text-white/80' : 'text-[--text-secondary-color]'}`}>{model.provider}</span>
            </div>
            <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                <ModelCapabilities model={model} />
                {isActive && <i className="fa-solid fa-check text-lg text-white"></i>}
            </div>
        </div>
    );
};

export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({ isOpen, onClose, models, currentModelIndex, onSelectModel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'hierarchy' | 'provider'>('hierarchy');

    const filteredModels = useMemo(() =>
        models.filter(m => m.id.toLowerCase().includes(searchTerm.toLowerCase())),
        [models, searchTerm]
    );

    const modelsByProvider = useMemo(() => {
        return filteredModels.reduce((acc, model, index) => {
            const originalIndex = models.findIndex(m => m.id === model.id);
            if (!acc[model.provider]) acc[model.provider] = [];
            acc[model.provider].push({ ...model, originalIndex });
            return acc;
        }, {} as Record<string, (ModelWithProvider & { originalIndex: number })[]>);
    }, [filteredModels, models]);

    const sortedHierarchyModels = useMemo(() => {
        const modelsWithOriginalIndex = filteredModels.map(model => ({
            ...model,
            originalIndex: models.findIndex(m => m.id === model.id)
        }));
        return sortModelsForDisplay(modelsWithOriginalIndex);
    }, [filteredModels, models]);

    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2500] flex justify-center items-center p-4">
            <div onClick={e => e.stopPropagation()} className="bg-[--surface-color] w-full max-w-4xl h-[90vh] rounded-xl border border-[--border-color] shadow-2xl flex flex-col overflow-hidden">
                <header className="p-4 border-b border-[--border-color] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">Select a Model</h2>
                    <button onClick={onClose} className="text-2xl text-[--text-secondary-color] hover:text-[--text-color]">&times;</button>
                </header>
                <div className="p-4 border-b border-[--border-color] flex gap-4 items-center flex-shrink-0">
                    <div className="relative flex-grow max-w-sm">
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[--text-secondary-color]"></i>
                        <input type="search" placeholder="Search models..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[--bg-color] border border-[--border-color] rounded-full focus:outline-none focus:border-[--primary-color]" />
                    </div>
                    <div className="flex bg-[--bg-color] rounded-lg p-1">
                        <button onClick={() => setView('hierarchy')} title="View by Power" className={`px-3 py-1 rounded ${view === 'hierarchy' ? 'bg-[--primary-color]' : ''}`}><i className="fa-solid fa-ranking-star"></i></button>
                        <button onClick={() => setView('provider')} title="View by Provider" className={`px-3 py-1 rounded ${view === 'provider' ? 'bg-[--primary-color]' : ''}`}><i className="fa-solid fa-layer-group"></i></button>
                    </div>
                </div>
                <main className="flex-grow overflow-y-auto p-4 space-y-2">
                    {models.length === 0 ? (
                        <p className="text-center text-[--text-secondary-color] p-8">No models available. Please configure your API keys first.</p>
                    ) : view === 'hierarchy' ? (
                        <div className="space-y-2">
                            {sortedHierarchyModels.map(model => (
                                <ModelOption key={model.originalIndex} model={model} isActive={model.originalIndex === currentModelIndex} onClick={() => onSelectModel(model.originalIndex)} />
                            ))}
                        </div>
                    ) : (
                        Object.entries(modelsByProvider).map(([provider, providerModels]: [string, (ModelWithProvider & { originalIndex: number; })[]]) => (
                            <div key={provider}>
                                <h3 className="text-[--primary-color] font-bold mb-2 mt-4">{provider}</h3>
                                <div className="space-y-2">
                                    {providerModels.map(model => (
                                        <ModelOption key={model.originalIndex} model={model} isActive={model.originalIndex === currentModelIndex} onClick={() => onSelectModel(model.originalIndex)} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>
        </div>
    );
};
