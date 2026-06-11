import React from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { SiteNav } from './components/SiteNav';
import { ChatPage } from './pages/ChatPage';
import { ModelsPage } from './pages/ModelsPage';
import { FreePage } from './pages/FreePage';
import { SelfHostPage } from './pages/SelfHostPage';
import { IdeasPage } from './pages/IdeasPage';

const App: React.FC = () => {
    const [route, navigate] = useHashRoute();

    return (
        <div className="w-full h-full flex flex-col bg-[#1a1a1a]">
            <SiteNav route={route} onNavigate={navigate} />
            <div className="flex-1 min-h-0 flex flex-col">
                {route === 'chat' && <ChatPage />}
                {route === 'models' && <ModelsPage />}
                {route === 'free' && <FreePage />}
                {route === 'selfhost' && <SelfHostPage />}
                {route === 'ideas' && <IdeasPage />}
            </div>
        </div>
    );
};

export default App;
