import React, { useEffect, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { handleOAuthCallback } from './services/oauthService';
import { SiteNav } from './components/SiteNav';
import { ChatPage } from './pages/ChatPage';
import { ModelsPage } from './pages/ModelsPage';
import { FreePage } from './pages/FreePage';
import { SelfHostPage } from './pages/SelfHostPage';
import { IdeasPage } from './pages/IdeasPage';

const App: React.FC = () => {
    const [route, navigate] = useHashRoute();
    const [oauthNotice, setOauthNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const [chatEpoch, setChatEpoch] = useState(0);

    // Complete the OpenRouter OAuth round-trip if we just landed with ?code=...
    useEffect(() => {
        handleOAuthCallback()
            .then(key => {
                if (!key) return;
                setOauthNotice({ kind: 'ok', text: 'OpenRouter connected — free and paid models are now available.' });
                setChatEpoch(e => e + 1); // remount chat so it reloads the saved key
                window.location.hash = '/chat';
                setTimeout(() => setOauthNotice(null), 8000);
            })
            .catch(err => {
                setOauthNotice({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
                setTimeout(() => setOauthNotice(null), 10000);
            });
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-[#1a1a1a]">
            <SiteNav route={route} onNavigate={navigate} />
            {oauthNotice && (
                <div className={`px-4 py-2 text-sm text-center ${oauthNotice.kind === 'ok' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                    <i className={`fa-solid ${oauthNotice.kind === 'ok' ? 'fa-circle-check' : 'fa-triangle-exclamation'} mr-2`} />
                    {oauthNotice.text}
                </div>
            )}
            <div className="flex-1 min-h-0 flex flex-col">
                {route === 'chat' && <ChatPage key={chatEpoch} />}
                {route === 'models' && <ModelsPage />}
                {route === 'free' && <FreePage />}
                {route === 'selfhost' && <SelfHostPage />}
                {route === 'ideas' && <IdeasPage />}
            </div>
        </div>
    );
};

export default App;
