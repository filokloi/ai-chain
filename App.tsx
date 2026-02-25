
import React, { useState, useEffect, useCallback } from 'react';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { SettingsPage } from './components/SettingsPage';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatWindow } from './components/ChatWindow';
import { StatusBar } from './components/StatusBar';
import { ModelSelectionModal } from './components/ModelSelectionModal';
import { useChatManager } from './hooks/useChatManager';
import { fetchAndBuildModelStrategy } from './services/modelService';
import { getAiResponse } from './services/apiService';
import { ApiKeys, Chat as ChatType, AttachedFile, LocalLlmConfig, ModelWithProvider, ChatMessage } from './types';
import { AppHeader } from './components/AppHeader';

const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isModelSelectionOpen, setIsModelSelectionOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);

    const [apiKeys, setApiKeys] = useState<ApiKeys>({});
    const [localLlmConfig, setLocalLlmConfig] = useState<LocalLlmConfig>({ serverUrl: '', apiKey: '' });

    const { chats, currentChat, currentChatId, loadChat, startNewChat, updateCurrentChat, saveChats, clearHistory, pinChat, renameChat, deleteChat, deleteMessage } = useChatManager();

    const [intelligence, setIntelligence] = useState<number>(100);
    const [currentModelIndex, setCurrentModelIndex] = useState(0);
    const [thinkingModel, setThinkingModel] = useState<ModelWithProvider | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [modelStrategy, setModelStrategy] = useState<ModelWithProvider[]>([]);

    const updateStrategy = useCallback(async () => {
        const strategy = await fetchAndBuildModelStrategy(apiKeys, localLlmConfig);
        setModelStrategy(strategy);

        if (strategy.length > 0) {
            let strategyKey: 'economy' | 'balanced' | 'power' = 'balanced';
            if (intelligence <= 33) strategyKey = 'economy';
            else if (intelligence >= 67) strategyKey = 'power';

            let initialModelIndex = 0;
            if (strategyKey === 'power') {
                initialModelIndex = 0;
            } else if (strategyKey === 'economy') {
                const firstFreeIndex = strategy.findIndex(m => m.isFree);
                initialModelIndex = firstFreeIndex !== -1 ? firstFreeIndex : 0;
            } else {
                initialModelIndex = Math.floor(strategy.length / 4);
            }
            setCurrentModelIndex(initialModelIndex);
        } else {
            setCurrentModelIndex(0);
        }
    }, [apiKeys, localLlmConfig, intelligence]);

    useEffect(() => {
        const savedKeys = localStorage.getItem('apiKeys');
        const savedLlmConfig = localStorage.getItem('localLlmConfig');
        const savedIntelligence = localStorage.getItem('intelligenceSlider');
        const hasOnboarded = localStorage.getItem('hasOnboarded');

        if (savedKeys) setApiKeys(JSON.parse(savedKeys));
        if (savedLlmConfig) setLocalLlmConfig(JSON.parse(savedLlmConfig));
        if (savedIntelligence) setIntelligence(parseInt(savedIntelligence, 10));

        if (hasOnboarded) setIsWelcomeVisible(false);
    }, []);

    useEffect(() => {
        updateStrategy();
    }, [updateStrategy]);

    useEffect(() => {
        if (window.innerWidth >= 768) setIsSidebarOpen(true);
    }, []);

    const handleStartChatting = () => {
        setIsWelcomeVisible(false);
        localStorage.setItem('hasOnboarded', 'true');
        const anyKeyEntered = Object.values(apiKeys).some(key => key) || localLlmConfig.serverUrl;
        if (!anyKeyEntered && chats.length === 0) {
            setTimeout(() => setIsSettingsOpen(true), 100);
        } else if (chats.length === 0) {
            startNewChat();
        }
    };

    const handleSaveSettings = (newKeys: ApiKeys, newLlmConfig: LocalLlmConfig) => {
        setApiKeys(newKeys);
        setLocalLlmConfig(newLlmConfig);
        localStorage.setItem('apiKeys', JSON.stringify(newKeys));
        localStorage.setItem('localLlmConfig', JSON.stringify(newLlmConfig));
        localStorage.setItem('intelligenceSlider', intelligence.toString());
        setIsSettingsOpen(false);
        if (chats.length === 0) startNewChat();
    };

    const runAiConversation = useCallback(async (
        messages: ChatMessage[],
        files: AttachedFile[] | null,
        controller: AbortController
    ) => {
        if (!currentChat) return;

        let success = false;
        let modelAttemptIndex = currentModelIndex;

        while (!success) {
            const modelToTry = modelStrategy[modelAttemptIndex];
            if (!modelToTry) {
                const systemMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: "**All models failed.**" };
                updateCurrentChat(prev => ({ messages: [...prev.messages, systemMessage] }));
                break;
            }

            setThinkingModel(modelToTry);

            try {
                const { text: aiResponseText, tool_calls } = await getAiResponse(modelToTry, apiKeys, localLlmConfig, messages, files, controller.signal);

                if (tool_calls) {
                    const toolCallMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: null,
                        tool_calls: tool_calls,
                        model: `${modelToTry.provider}/${modelToTry.id}`
                    };
                    updateCurrentChat(prev => ({ messages: [...prev.messages, toolCallMessage] }));

                    const toolResponses = tool_calls.map(toolCall => ({
                        id: crypto.randomUUID(),
                        role: 'tool' as const,
                        tool_call_id: toolCall.id,
                        name: toolCall.function.name,
                        content: "Tool executed successfully. (Simulated)"
                    }));

                    // Add tool responses to history and continue conversation
                    const newMessages = [...messages, toolCallMessage, ...toolResponses];
                    updateCurrentChat(prev => ({ messages: newMessages }));
                    await runAiConversation(newMessages, files, controller); // Recursive call

                } else {
                    const aiMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: aiResponseText,
                        model: `${modelToTry.provider}/${modelToTry.id}`
                    };
                    updateCurrentChat(prev => ({ messages: [...prev.messages, aiMessage] }));
                }

                setCurrentModelIndex(modelAttemptIndex);
                success = true;

            } catch (error: any) {
                if (error.name === 'AbortError') return;

                console.error(`Error with ${modelToTry.id}:`, error);
                let errorToDisplay = `**${modelToTry.provider}/${modelToTry.id}** failed.\n> *${error.message || 'Unknown error'}*`;

                if (modelStrategy.length > modelAttemptIndex + 1) {
                    modelAttemptIndex++;
                    errorToDisplay += `\n\nSwitching to **${modelStrategy[modelAttemptIndex].id}**.`;
                } else {
                    errorToDisplay = "**All available models failed.**";
                }

                const systemMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: errorToDisplay };
                updateCurrentChat(prev => ({ messages: [...prev.messages, systemMessage] }));

                if (modelStrategy.length <= modelAttemptIndex + 1) break;
            }
        }
        setThinkingModel(null);
        setAbortController(null);
        saveChats();
    }, [currentChat, apiKeys, localLlmConfig, modelStrategy, currentModelIndex, updateCurrentChat, saveChats]);

    const sendMessage = async (text: string, files: AttachedFile[] | null) => {
        if (!currentChat) return;
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, fileInfo: files };
        const updatedMessages = [...currentChat.messages, userMessage];
        const newTitle = currentChat.messages.length === 0
            ? ((files?.[0] ? `[${files[0].name}] ` : '') + text).substring(0, 35) + (text.length > 35 ? '...' : '')
            : currentChat.title;

        updateCurrentChat({ messages: updatedMessages, title: newTitle, lastUpdated: Date.now() });

        const newAbortController = new AbortController();
        setAbortController(newAbortController);

        await runAiConversation(updatedMessages, files, newAbortController);
    };

    const handleSwitchModel = (direction: 'next' | 'prev') => {
        if (modelStrategy.length === 0) return;

        setCurrentModelIndex(prev => {
            if (direction === 'next') {
                return prev < modelStrategy.length - 1 ? prev + 1 : 0; // Loop to start
            } else {
                return prev > 0 ? prev - 1 : modelStrategy.length - 1; // Loop to end
            }
        });
    };

    const handleStopGeneration = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setThinkingModel(null);
            const systemMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: "Generation stopped by user." };
            updateCurrentChat(prev => ({ messages: [...prev.messages, systemMessage] }));
        }
    }, [abortController, updateCurrentChat]);

    const handleRegenerate = useCallback(async (messageId: string) => {
        if (!currentChat || thinkingModel) return;
        const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
        if (messageIndex < 1 || currentChat.messages[messageIndex - 1].role !== 'user') return;

        const lastUserMessage = currentChat.messages[messageIndex - 1];
        const prunedMessages = currentChat.messages.slice(0, messageIndex - 1);
        updateCurrentChat({ messages: prunedMessages });

        setTimeout(() => {
            sendMessage(lastUserMessage.content || '', lastUserMessage.fileInfo || null);
        }, 50);

    }, [currentChat, thinkingModel, updateCurrentChat, sendMessage]);

    const handleFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
        if (!currentChat) return;
        const updatedMessages = currentChat.messages.map(msg =>
            msg.id === messageId ? { ...msg, feedback: msg.feedback === feedback ? undefined : feedback } : msg
        );
        updateCurrentChat({ messages: updatedMessages });
        saveChats();
    }, [currentChat, updateCurrentChat, saveChats]);

    return (
        <div className="w-full h-full max-w-[1400px] mx-auto flex flex-row bg-[#1a1a1a] shadow-lg relative overflow-hidden">
            {isWelcomeVisible && <WelcomeOverlay onStart={handleStartChatting} />}
            {isSettingsOpen && <SettingsPage initialKeys={apiKeys} initialLlmConfig={localLlmConfig} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} />}
            {isModelSelectionOpen && (
                <ModelSelectionModal
                    isOpen={isModelSelectionOpen}
                    onClose={() => setIsModelSelectionOpen(false)}
                    models={modelStrategy}
                    currentModelIndex={currentModelIndex}
                    onSelectModel={(index) => {
                        setCurrentModelIndex(index);
                        setIsModelSelectionOpen(false);
                    }}
                />
            )}
            <HistorySidebar
                isOpen={isSidebarOpen}
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={(id) => { loadChat(id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                onNewChat={() => { startNewChat(); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                onClearHistory={clearHistory}
                onPinChat={pinChat}
                onRenameChat={renameChat}
                onDeleteChat={deleteChat}
            />
            <div className="flex-grow w-full h-full flex flex-col relative min-w-0">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="md:hidden fixed bottom-28 right-4 z-[100] bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg px-4 py-2 text-sm font-semibold"
                    title="Open API Settings"
                >
                    API Settings
                </button>
                <AppHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenSettings={() => setIsSettingsOpen(true)} onLogoClick={() => setIsWelcomeVisible(true)} />
                <ChatWindow
                    chat={currentChat}
                    thinkingModel={thinkingModel}
                    onSendMessage={sendMessage}
                    currentModel={modelStrategy[currentModelIndex]}
                    onStopGeneration={handleStopGeneration}
                    onRegenerate={handleRegenerate}
                    onFeedback={handleFeedback}
                    onDeleteMessage={(msgId) => currentChatId && deleteMessage(currentChatId, msgId)}
                />
                <StatusBar intelligence={intelligence} onIntelligenceChange={setIntelligence} currentModel={modelStrategy[currentModelIndex]} fallbackModels={modelStrategy.slice(currentModelIndex + 1, currentModelIndex + 3)} onOpenModelSelection={() => setIsModelSelectionOpen(true)} onForceSwitch={handleSwitchModel} isThinking={!!thinkingModel} modelCount={modelStrategy.length} currentModelIdx={currentModelIndex} />
            </div>
        </div>
    );
};

export default App;
