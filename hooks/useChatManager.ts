
import { useState, useEffect, useCallback } from 'react';
import { Chat } from '../types';

export const useChatManager = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<number | null>(null);

    // Load chats from localStorage on initial mount
    useEffect(() => {
        try {
            const savedChats = localStorage.getItem('ai-chain-all-chats');
            if (savedChats) {
                const parsedChats: Chat[] = JSON.parse(savedChats);
                if (parsedChats.length > 0) {
                    setChats(parsedChats);
                    // Select the most recently updated chat on load
                    const lastChat = [...parsedChats].sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
                    setCurrentChatId(lastChat.id);
                } else {
                    startNewChat(); 
                }
            } else {
                startNewChat(); 
            }
        } catch (error) {
            console.error("Failed to load chats from localStorage", error);
            localStorage.removeItem('ai-chain-all-chats');
            startNewChat();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist chats to localStorage whenever the chats state changes.
    useEffect(() => {
        if (chats.length > 0) {
            localStorage.setItem('ai-chain-all-chats', JSON.stringify(chats));
        }
    }, [chats]);
    
    const startNewChat = useCallback(() => {
        const newChat: Chat = {
            id: Date.now(),
            title: "New Chat",
            lastUpdated: Date.now(),
            messages: [],
            isPinned: false
        };
        setChats(prevChats => [newChat, ...prevChats]);
        setCurrentChatId(newChat.id);
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
            // 1. Explicitly remove from storage immediately
            localStorage.removeItem('ai-chain-all-chats');
            
            // 2. Create a fresh state
            const newChat: Chat = {
                id: Date.now(),
                title: "New Chat",
                lastUpdated: Date.now(),
                messages: [],
                isPinned: false
            };
            
            // 3. Update state (this will trigger the useEffect, which will save the single new chat)
            setChats([newChat]);
            setCurrentChatId(newChat.id);
        }
    }, []);

    const deleteChat = useCallback((id: number) => {
        setChats(prevChats => {
            const chatsAfterDeletion = prevChats.filter(c => c.id !== id);
            
            // If all chats deleted, create a new one
            if (chatsAfterDeletion.length === 0) {
                const newChat = { id: Date.now(), title: "New Chat", lastUpdated: Date.now(), messages: [], isPinned: false };
                setCurrentChatId(newChat.id);
                return [newChat];
            }
            
            // If we are deleting the currently active chat
            if (id === currentChatId) {
                // Find the index of the chat being deleted in the *original* list to find a neighbor
                const indexOriginal = prevChats.findIndex(c => c.id === id);
                // Logic: try to stay at the same visual index, or go to the one before it
                // Since chatsAfterDeletion has shifted, we just need a safe fallback.
                // Simple safe fallback: use the first one in the new list.
                // Better UX: Try to select the previous one in the list (which is at the same index now, or index-1).
                const nextChat = chatsAfterDeletion[0]; 
                if (nextChat) setCurrentChatId(nextChat.id);
            }
            
            return chatsAfterDeletion;
        });
    }, [currentChatId]);

    const deleteMessage = useCallback((chatId: number, messageId: string) => {
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id !== chatId) return chat;
            return { 
                ...chat, 
                messages: chat.messages.filter(m => m.id !== messageId),
                // Update lastUpdated so it syncs, but maybe we don't want to bump it to top just for deleting a message?
                // Let's keep it neutral or update it. Updating it is safer for consistency.
                lastUpdated: Date.now() 
            };
        }));
    }, []);

    const loadChat = useCallback((id: number) => {
        setCurrentChatId(id);
    }, []);

    const updateCurrentChat = useCallback((updates: Partial<Chat> | ((prev: Chat) => Partial<Chat>)) => {
        if (currentChatId === null) return;
        setChats(prevChats => 
            prevChats.map(chat => {
                if (chat.id === currentChatId) {
                    const newValues = typeof updates === 'function' ? updates(chat) : updates;
                    return { ...chat, ...newValues };
                }
                return chat;
            })
        );
    }, [currentChatId]);

    const pinChat = useCallback((id: number) => {
        setChats(prevChats => prevChats.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    }, []);

    const renameChat = useCallback((id: number, newTitle: string) => {
        setChats(prevChats => prevChats.map(c => c.id === id ? { ...c, title: newTitle } : c));
    }, []);

    const currentChat = chats.find(c => c.id === currentChatId);

    return {
        chats,
        currentChat,
        currentChatId,
        loadChat,
        startNewChat,
        updateCurrentChat,
        saveChats: () => {}, // No-op, handled by useEffect
        clearHistory,
        pinChat,
        renameChat,
        deleteChat,
        deleteMessage
    };
};
