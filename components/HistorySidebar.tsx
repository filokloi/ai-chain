
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Chat } from '../types';

interface HistorySidebarProps {
    isOpen: boolean;
    chats: Chat[];
    currentChatId: number | null;
    onSelectChat: (id: number) => void;
    onNewChat: () => void;
    onClearHistory: () => void;
    onPinChat: (id: number) => void;
    onRenameChat: (id: number, newTitle: string) => void;
    onDeleteChat: (id: number) => void;
}

const HistoryItem: React.FC<{
    chat: Chat;
    isActive: boolean;
    onSelect: () => void;
    onMenuClick: (e: React.MouseEvent, id: number) => void;
}> = ({ chat, isActive, onSelect, onMenuClick }) => (
    <li
        onClick={onSelect}
        className={`flex justify-between items-center p-3 cursor-pointer transition-colors rounded-md mx-2 my-1 text-sm relative group ${isActive ? 'bg-[--primary-color] text-white' : 'hover:bg-[--surface-color]'}`}
    >
        <span className={`truncate pr-8 ${chat.isPinned ? 'pl-5' : ''} w-full`}>
            {chat.isPinned && <i className="fa-solid fa-thumbtack text-xs absolute left-3 top-1/2 -translate-y-1/2 text-[--text-color] opacity-70"></i>}
            {chat.title}
        </span>
        <button
            onClick={(e) => onMenuClick(e, chat.id)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-[--text-secondary-color] group-hover:text-[--text-color] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white/10 z-10"
        >
            <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
    </li>
);

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen, chats, currentChatId, onSelectChat, onNewChat, onClearHistory, onPinChat, onRenameChat, onDeleteChat
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpen, setMenuOpen] = useState<{ x: number; y: number; chatId: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredChats = useMemo(() =>
        chats.filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase())),
        [chats, searchTerm]
    );

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = { pinned: [], today: [], yesterday: [], last7Days: [], older: [] };
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today); last7Days.setDate(last7Days.getDate() - 7);

        // 1. Extract Pinned Chats First (Sorted by last updated)
        groups.pinned = filteredChats.filter(c => c.isPinned).sort((a, b) => b.lastUpdated - a.lastUpdated);

        // 2. Process Unpinned Chats
        const unpinned = filteredChats.filter(c => !c.isPinned);
        
        unpinned.forEach(chat => {
            const chatDate = new Date(chat.lastUpdated);
            const compareDate = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
            
            if (compareDate.getTime() === today.getTime()) groups.today.push(chat);
            else if (compareDate.getTime() === yesterday.getTime()) groups.yesterday.push(chat);
            else if (compareDate >= last7Days) groups.last7Days.push(chat);
            else groups.older.push(chat);
        });

        // Sort unpinned groups by date (newest first)
        ['today', 'yesterday', 'last7Days', 'older'].forEach(key => {
            groups[key].sort((a, b) => b.lastUpdated - a.lastUpdated);
        });
        
        return groups;
    }, [filteredChats]);

    const handleMenuClick = (e: React.MouseEvent, chatId: number) => {
        e.stopPropagation();
        e.preventDefault();
        // Get position relative to viewport
        const rect = e.currentTarget.getBoundingClientRect();
        // Position menu slightly to the right and below the button
        setMenuOpen({ x: rect.right - 10, y: rect.bottom - 10, chatId });
    };

    const handleRename = () => {
        if (!menuOpen) return;
        const chat = chats.find(c => c.id === menuOpen.chatId);
        const newTitle = prompt("Rename chat:", chat?.title);
        if (newTitle && newTitle.trim() !== '') {
            onRenameChat(menuOpen.chatId, newTitle.trim());
        }
        setMenuOpen(null);
    };

    const handleDelete = () => {
        if (!menuOpen) return;
        if (confirm("Delete this chat? This cannot be undone.")) {
            onDeleteChat(menuOpen.chatId);
        }
        setMenuOpen(null);
    };

    const handlePin = () => {
        if (!menuOpen) return;
        onPinChat(menuOpen.chatId);
        setMenuOpen(null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <aside className={`w-72 h-screen bg-[#161616] border-r border-[--border-color] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'ml-0' : '-ml-72'}`}>
            <div className="px-3 h-16 flex items-center border-b border-[--border-color] flex-shrink-0">
                <button onClick={onNewChat} title="New Chat" className="w-full flex items-center justify-center gap-2 p-2 rounded-md border border-green-600 text-white hover:bg-green-600 transition-colors font-bold">
                    <i className="fa-solid fa-square-plus text-lg"></i> New Chat
                </button>
            </div>
            <div className="p-3 border-b border-[--border-color] relative flex-shrink-0">
                <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-[--text-secondary-color]"></i>
                <input type="text" placeholder="Search history..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-4 py-2 bg-[--surface-color] border border-[--border-color] rounded-full focus:outline-none focus:border-[--primary-color]" />
            </div>
            
            <div className="flex-grow overflow-y-auto py-2 custom-scrollbar relative">
                {/* Pinned Section - Always at top */}
                {groupedChats.pinned.length > 0 && (
                    <div className="mb-2">
                         <h3 className="px-4 py-2 text-xs text-[--text-secondary-color] uppercase font-semibold flex items-center gap-2 sticky top-0 bg-[#161616] z-10">
                            <i className="fa-solid fa-thumbtack"></i> Pinned
                        </h3>
                        <ul>
                            {groupedChats.pinned.map(chat => (
                                <HistoryItem key={chat.id} chat={chat} isActive={chat.id === currentChatId} onSelect={() => onSelectChat(chat.id)} onMenuClick={handleMenuClick} />
                            ))}
                        </ul>
                        <div className="h-[1px] bg-[--border-color] mx-4 my-2 opacity-50"></div>
                    </div>
                )}

                {/* Chronological Sections */}
                {Object.entries(groupedChats).map(([key, groupChats]: [string, Chat[]]) => (
                    key !== 'pinned' && groupChats.length > 0 && (
                        <div key={key} className="mb-2">
                            <h3 className="px-4 py-2 text-xs text-[--text-secondary-color] uppercase font-semibold sticky top-0 bg-[#161616] z-10">
                                {key.replace(/([A-Z])/g, ' $1').replace('last7', 'Previous 7')}
                            </h3>
                            <ul>
                                {groupChats.map(chat => (
                                    <HistoryItem key={chat.id} chat={chat} isActive={chat.id === currentChatId} onSelect={() => onSelectChat(chat.id)} onMenuClick={handleMenuClick} />
                                ))}
                            </ul>
                        </div>
                    )
                ))}
            </div>
            
            <div className="p-3 border-t border-[--border-color] flex-shrink-0">
                <button onClick={onClearHistory} title="Clear All History" className="w-full flex items-center justify-center gap-2 p-2 rounded-md hover:bg-red-900/30 border border-red-900/50 text-red-400 hover:text-red-200 transition-colors font-bold">
                    <i className="fa-solid fa-trash-can"></i> Clear History
                </button>
            </div>

            {/* Context Menu */}
            {menuOpen && (
                <div 
                    ref={menuRef} 
                    style={{ top: `${Math.min(menuOpen.y, window.innerHeight - 140)}px`, left: `${Math.min(menuOpen.x, window.innerWidth - 150)}px` }} 
                    className="fixed bg-[--surface-color] border border-[--border-color] rounded-lg shadow-2xl z-[9999] flex flex-col text-sm w-36 overflow-hidden"
                >
                    <button onClick={handlePin} className="px-4 py-3 text-left hover:bg-[--primary-color] flex items-center gap-3 transition-colors">
                        <i className="fa-solid fa-thumbtack w-4 text-center"></i> {chats.find(c => c.id === menuOpen.chatId)?.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={handleRename} className="px-4 py-3 text-left hover:bg-[--primary-color] flex items-center gap-3 transition-colors">
                        <i className="fa-solid fa-pen-to-square w-4 text-center"></i> Rename
                    </button>
                    <button onClick={handleDelete} className="px-4 py-3 text-left hover:bg-red-600 flex items-center gap-3 border-t border-[--border-color] transition-colors">
                        <i className="fa-solid fa-trash-can w-4 text-center"></i> Delete
                    </button>
                </div>
            )}
        </aside>
    );
};
