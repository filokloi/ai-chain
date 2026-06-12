import React from 'react';
import type { Route } from '../hooks/useHashRoute';
import { DASHBOARD_URL } from '../services/catalogService';

interface SiteNavProps {
    route: Route;
    onNavigate: (r: Route) => void;
}

const TABS: { route: Route; label: string; icon: string }[] = [
    { route: 'chat', label: 'Chat', icon: 'fa-comments' },
    { route: 'models', label: 'Models', icon: 'fa-table-list' },
    { route: 'free', label: 'Free', icon: 'fa-gift' },
    { route: 'selfhost', label: 'Self-host', icon: 'fa-server' },
    { route: 'ideas', label: 'Ideas', icon: 'fa-lightbulb' },
];

export const SiteNav: React.FC<SiteNavProps> = ({ route, onNavigate }) => (
    <nav className="flex items-center gap-1 px-3 py-2 bg-[#111] border-b border-[#333] overflow-x-auto shrink-0">
        <span className="font-bold text-white mr-3 whitespace-nowrap select-none">
            <i className="fa-solid fa-link text-[#4a90e2] mr-2" />AI Chain
        </span>
        {TABS.map(tab => (
            <button
                key={tab.route}
                onClick={() => onNavigate(tab.route)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    route === tab.route
                        ? 'bg-[#4a90e2] text-white'
                        : 'text-[#a0a0a0] hover:text-white hover:bg-[#2c2c2c]'
                }`}
            >
                <i className={`fa-solid ${tab.icon} mr-1.5`} />{tab.label}
            </button>
        ))}
        <button
            onClick={() => {
                sessionStorage.setItem('ai-chain-open-settings', '1');
                window.dispatchEvent(new CustomEvent('ai-chain:open-settings'));
                onNavigate('chat');
            }}
            className="ml-auto px-3 py-1.5 rounded-lg text-sm whitespace-nowrap bg-[#4a90e2]/15 text-[#7eb3ec] hover:bg-[#4a90e2] hover:text-white transition-colors border border-[#4a90e2]/40"
            title="Enter API keys or sign in with OpenRouter"
        >
            <i className="fa-solid fa-key mr-1.5" />API Keys
        </button>
        <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap text-[#a0a0a0] hover:text-white hover:bg-[#2c2c2c]"
            title="AIchain live dashboard (data plane)"
        >
            <i className="fa-solid fa-satellite-dish mr-1.5" />Dashboard
        </a>
    </nav>
);
