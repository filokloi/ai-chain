import React from 'react';
import { ModelWithProvider } from '../types';

interface StatusBarProps {
    intelligence: number;
    onIntelligenceChange: (value: number) => void;
    currentModel: ModelWithProvider | undefined;
    fallbackModels: ModelWithProvider[];
    onOpenModelSelection: () => void;
    onForceSwitch: (direction: 'next' | 'prev') => void;
    isThinking: boolean;
    modelCount: number;
    currentModelIdx: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    intelligence, onIntelligenceChange, currentModel, fallbackModels,
    onOpenModelSelection, onForceSwitch, isThinking, modelCount, currentModelIdx
}) => {
    return (
        <footer className="p-4 border-t border-[--border-color] flex-shrink-0 mt-auto bg-[#1a1a1a]">
            <div className="mb-4">
                <div className="flex justify-between text-xs text-[--text-secondary-color] px-1 mb-2">
                    <span>Economy</span>
                    <span>Balanced</span>
                    <span>Max. Power</span>
                </div>
                <div className="relative h-5">
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}></div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={intelligence}
                        onChange={(e) => onIntelligenceChange(parseInt(e.target.value, 10))}
                        className="w-full h-5 bg-transparent outline-none appearance-none relative z-10 slider"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 text-xs text-[--text-secondary-color] text-center">
                <div className="flex items-center justify-center md:justify-start gap-2 truncate">
                    <span>Current:</span>
                    <strong className="text-[--text-color] truncate">{currentModel ? `${currentModel.provider}/${currentModel.id}` : 'Not Configured'}</strong>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onForceSwitch('prev')} disabled={isThinking || currentModelIdx === 0} className="control-button"><i className="fa-solid fa-backward"></i></button>
                    <button onClick={onOpenModelSelection} className="footer-action-button">Select Model</button>
                    <button onClick={() => onForceSwitch('next')} disabled={isThinking || currentModelIdx >= modelCount - 1} className="control-button"><i className="fa-solid fa-forward"></i></button>
                </div>

                <div className="flex items-center justify-center md:justify-end gap-2 truncate">
                    <span>Fallback:</span>
                    <span className="truncate">{fallbackModels.length > 0 ? fallbackModels.map(m => m.id.split('/')[1] || m.id).join(', ') : 'None'}</span>
                </div>
            </div>
            {/* FIX: Removed non-standard `jsx` prop from style tag. */}
            <style>{`
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 12px; height: 24px;
                    background: white; border: 2px solid var(--bg-color);
                    border-radius: 3px; cursor: pointer;
                    margin-top: -2px;
                }
                .slider::-moz-range-thumb {
                    width: 12px; height: 24px;
                    background: white; border: 2px solid var(--bg-color);
                    border-radius: 3px; cursor: pointer;
                }
                .control-button {
                    background: var(--surface-color); color: var(--text-color);
                    border: 1px solid var(--border-color);
                    width: 36px; height: 36px;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    transition: background-color 0.2s;
                }
                .control-button:hover:not(:disabled) { background-color: var(--primary-color); }
                .control-button:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .footer-action-button {
                    background-color: var(--surface-color); color: var(--text-color);
                    border: 1px solid var(--border-color);
                    padding: 0.5rem 1rem;
                    font-size: 0.85rem; font-weight: 500;
                    border-radius: 20px; cursor: pointer;
                    transition: background-color 0.2s, border-color 0.2s;
                    white-space: nowrap;
                }
                .footer-action-button:hover {
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                }
            `}</style>
        </footer>
    );
};
