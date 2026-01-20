import React from 'react';

interface AppHeaderProps {
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onLogoClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar, onOpenSettings, onLogoClick }) => {
    return (
        <header className="flex justify-between items-center p-3 bg-[--surface-color] border-b border-[--border-color] z-10 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={onToggleSidebar} className="control-button" title="History">
                    <i className="fa-solid fa-bars"></i>
                </button>
                <div onClick={onLogoClick} className="flex items-center gap-3 cursor-pointer text-[--primary-color]">
                    <i className="fa-solid fa-link text-2xl"></i>
                    <h1 className="text-xl font-bold text-[--text-color]">AI Chain</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Language control can be added here if needed */}
                <button onClick={onOpenSettings} className="control-button" title="Settings">
                    <i className="fa-solid fa-sliders text-lg"></i>
                </button>
            </div>
            {/* FIX: Removed non-standard `jsx` prop from style tag. */}
            <style>{`
                .control-button {
                    background: none;
                    border: none;
                    color: var(--text-secondary-color);
                    padding: 0.5rem;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background-color 0.2s, color 0.2s;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .control-button:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: var(--text-color);
                }
            `}</style>
        </header>
    );
};
