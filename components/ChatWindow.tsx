
import React, { useState, useRef, useEffect } from 'react';
import { Chat, AttachedFile, ModelWithProvider, ChatMessage, ToolCall, ImageFile, DocumentFile } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Add global declarations for libraries loaded via CDN
declare global {
    interface Window {
        pdfjsLib: any;
        mammoth: any;
        ePub: any;
    }
}

// Custom Code Block Renderer
const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : 'text';
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return !inline ? (
        <div className="bg-black/80 rounded-lg my-4 border border-gray-700">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-t-lg">
                <span className="text-xs font-sans text-gray-400">{lang}</span>
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white flex items-center gap-2">
                    {isCopied ? <><i className="fa-solid fa-check"></i> Copied!</> : <><i className="fa-solid fa-copy"></i> Copy code</>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto" {...props}>
                <code>{children}</code>
            </pre>
        </div>
    ) : (
        <code className="bg-gray-700 text-red-300 rounded px-1 py-0.5" {...props}>
            {children}
        </code>
    );
};

const MessageActionsToolbar: React.FC<{
    message: ChatMessage;
    onRegenerate: (id: string) => void;
    onFeedback: (id: string, feedback: 'like' | 'dislike') => void;
    onDelete: (id: string) => void;
}> = ({ message, onRegenerate, onFeedback, onDelete }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const contentToCopy = message.content || (message.tool_calls ? JSON.stringify(message.tool_calls, null, 2) : '');
        navigator.clipboard.writeText(contentToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleShare = () => {
        const contentToCopy = message.content || '';
        navigator.clipboard.writeText(contentToCopy).then(() => {
            alert("Message content copied to clipboard!");
        });
    };

    const iconClasses = "w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors";
    const activeIconClasses = "text-[--primary-color]";

    return (
        <div className="flex items-center gap-1 text-gray-400 mt-2">
            <button onClick={() => onFeedback(message.id, 'like')} className={`${iconClasses} ${message.feedback === 'like' ? activeIconClasses : ''}`} title="Like"><i className="fa-regular fa-thumbs-up"></i></button>
            <button onClick={() => onFeedback(message.id, 'dislike')} className={`${iconClasses} ${message.feedback === 'dislike' ? activeIconClasses : ''}`} title="Dislike"><i className="fa-regular fa-thumbs-down"></i></button>
            <button onClick={() => onRegenerate(message.id)} className={iconClasses} title="Regenerate response"><i className="fa-solid fa-rotate-right"></i></button>
            <button onClick={handleShare} className={iconClasses} title="Share"><i className="fa-solid fa-share-nodes"></i></button>
            <button onClick={handleCopy} className={iconClasses} title="Copy">{isCopied ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-copy"></i>}</button>
            <button onClick={() => onDelete(message.id)} className={`${iconClasses} hover:text-red-400`} title="Delete Message"><i className="fa-solid fa-trash-can"></i></button>
        </div>
    );
};

const ToolCallMessage: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 my-2 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500/30">
                <i className="fa-solid fa-screwdriver-wrench text-xs text-blue-300"></i>
            </div>
            <span>Using tool: <strong>{toolCall.function.name}</strong></span>
        </div>
    </div>
);


const Message: React.FC<{
    message: ChatMessage;
    onRegenerate: (id: string) => void;
    onFeedback: (id: string, feedback: 'like' | 'dislike') => void;
    onDelete: (id: string) => void;
}> = ({ message, onRegenerate, onFeedback, onDelete }) => {
    const { role, content, fileInfo, model, tool_calls } = message;

    return (
        <div className={`w-full flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="group relative max-w-[85%] lg:max-w-[75%]">
                <div className={`p-3 rounded-2xl mb-1 ${role === 'user' ? 'bg-[--primary-color] text-white rounded-br-lg' : 'bg-[--surface-color] text-[--text-color] rounded-bl-lg'}`}>
                    {fileInfo && fileInfo.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                            {fileInfo.map((file, index) => (
                                file.type === 'image' ? (
                                    <img key={index} src={(file as ImageFile).dataUrl} alt={file.name} className="rounded-lg object-cover w-full h-auto" />
                                ) : (
                                    <div key={index} className="bg-black/20 p-2 rounded-lg text-sm border border-white/20 flex items-center gap-2">
                                        <i className="fa-solid fa-file-lines"></i>
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                    {content && <div className="prose prose-invert max-w-none prose-p:my-2 prose-pre:my-2 ai-message">
                        <Markdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{content}</Markdown>
                    </div>}
                    {tool_calls && tool_calls.map((tc, index) => <ToolCallMessage key={index} toolCall={tc} />)}
                </div>

                <div className={`pl-2 mb-4 ${role === 'user' ? 'flex justify-end' : ''}`}>
                    {role === 'assistant' ? (
                        <>
                            {model && <p className="text-xs text-gray-500/80 italic mb-2 mr-2">answered by {model.split('/').pop()}</p>}
                            <MessageActionsToolbar message={message} onRegenerate={onRegenerate} onFeedback={onFeedback} onDelete={onDelete} />
                        </>
                    ) : (
                        <button
                            onClick={() => onDelete(message.id)}
                            className="text-gray-500 hover:text-red-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                            title="Delete Message"
                        >
                            <i className="fa-solid fa-trash-can"></i> Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TypingIndicator: React.FC<{ model: ModelWithProvider | null }> = ({ model }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="w-full flex justify-start">
            <div onClick={() => setIsExpanded(!isExpanded)} className="p-3 rounded-2xl mb-4 bg-[--surface-color] flex items-center gap-2 cursor-pointer">
                <div className="w-6 h-6 border-2 border-[--border-color] border-t-[--primary-color] rounded-full animate-spin"></div>
                <span className="text-sm text-[--text-secondary-color]">
                    {isExpanded && model ? `AI is thinking... (Attempting with ${model.id})` : 'AI is thinking...'}
                </span>
            </div>
        </div>
    );
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FilePreview: React.FC<{ file: AttachedFile, onRemove: () => void }> = ({ file, onRemove }) => (
    <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-2 flex items-center gap-2 max-w-xs text-sm relative">
        {file.type === 'image' ? (
            <img src={(file as ImageFile).dataUrl} alt={file.name} className="w-10 h-10 object-cover rounded" />
        ) : (
            <i className="fa-solid fa-file-lines text-[--text-secondary-color] text-2xl w-10 text-center"></i>
        )}
        <div className="flex flex-col truncate min-w-0">
            <span className="text-[--text-secondary-color] truncate">{file.name}</span>
            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
        </div>
        <button onClick={onRemove} className="ml-auto text-gray-500 hover:text-white absolute -top-1 -right-1 bg-black/50 rounded-full w-5 h-5 flex items-center justify-center">&times;</button>
    </div>
);


export const ChatWindow: React.FC<{
    chat: Chat | undefined;
    thinkingModel: ModelWithProvider | null;
    onSendMessage: (text: string, files: AttachedFile[] | null) => void;
    currentModel: ModelWithProvider | undefined;
    onStopGeneration: () => void;
    onRegenerate: (messageId: string) => void;
    onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
    onDeleteMessage: (messageId: string) => void;
}> = ({ chat, thinkingModel, onSendMessage, currentModel, onStopGeneration, onRegenerate, onFeedback, onDeleteMessage }) => {
    const [text, setText] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const attachButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat?.messages, thinkingModel]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 24 * 6;
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [text]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachButtonRef.current && !attachButtonRef.current.contains(event.target as Node)) {
                setIsAttachMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFormSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if ((!text.trim() && attachedFiles.length === 0) || thinkingModel) return;
        onSendMessage(text, attachedFiles);
        setText('');
        setAttachedFiles([]);
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: AttachedFile[] = [...attachedFiles];
        const allowedFiles: File[] = Array.from(files).slice(0, 5 - newFiles.length);

        for (const file of allowedFiles) {
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            const arrayBuffer = await file.arrayBuffer();

            try {
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        newFiles.push({ name: file.name, type: 'image', subtype: extension as ImageFile['subtype'], dataUrl, size: file.size });
                        setAttachedFiles([...newFiles]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    let content = '';
                    let subtype: DocumentFile['subtype'] | null = null;

                    if (extension === 'pdf' && window.pdfjsLib) {
                        subtype = 'pdf';
                        const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            content += textContent.items.map((item: any) => item.str).join(' ');
                        }
                    } else if (extension === 'docx' && window.mammoth) {
                        subtype = 'docx';
                        const result = await window.mammoth.extractRawText({ arrayBuffer });
                        content = result.value;
                    } else if (extension === 'epub' && window.ePub) {
                        subtype = 'epub';
                        const book = window.ePub(arrayBuffer);
                        const allSections = await Promise.all(
                            book.spine.items.map((item: any) => item.load(book.load.bind(book)))
                        );
                        const parser = new DOMParser();
                        allSections.forEach((section: any) => {
                            const doc = parser.parseFromString(section, 'application/xhtml+xml');
                            content += doc.body.textContent || '';
                        });
                    } else if (['txt', 'csv'].includes(extension)) {
                        subtype = extension as 'txt' | 'csv';
                        content = await file.text();
                    } else {
                        alert(`File type .${extension} is not supported yet.`);
                        continue;
                    }

                    if (subtype) {
                        newFiles.push({ name: file.name, type: 'document', subtype, content, size: file.size });
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                alert(`Failed to read file: ${file.name}. It might be corrupted or in an unsupported format.`);
            }
        }

        setAttachedFiles([...newFiles]);
        e.target.value = ''; // Reset input
        setIsAttachMenuOpen(false);
    };

    const placeholderText = currentModel ? `Message ${currentModel.name || currentModel.id}...` : "Enter a message...";

    return (
        <main className="flex-grow flex flex-col overflow-hidden min-h-0 relative">
            <section
                className="flex-grow overflow-y-auto p-4 space-y-4"
                onScroll={(e) => {
                    const target = e.currentTarget;
                    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                    const btn = document.getElementById('scroll-to-bottom');
                    if (btn) {
                        // Show button if NOT near bottom
                        btn.style.opacity = isNearBottom ? '0' : '1';
                        btn.style.pointerEvents = isNearBottom ? 'none' : 'auto';
                    }
                }}
            >
                {chat?.messages.length === 0 && (
                    <div className="text-center text-[--text-secondary-color] h-full flex items-center justify-center">Welcome! Start the conversation...</div>
                )}
                {chat?.messages.map((msg) => (
                    msg.role === 'tool' ? null : <Message key={msg.id} message={msg} onRegenerate={onRegenerate} onFeedback={onFeedback} onDelete={onDeleteMessage} />
                ))}
                {thinkingModel && <TypingIndicator model={thinkingModel} />}
                <div ref={messagesEndRef} />
            </section>
            {/* Scroll to Bottom Button (Visible when scrolled up) */}
            <button
                id="scroll-to-bottom"
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="absolute bottom-24 right-6 w-10 h-10 bg-[--surface-color] border border-[--border-color] text-[--primary-color] rounded-full shadow-lg flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 z-10"
                style={{ opacity: '0' }}
            >
                <i className="fa-solid fa-arrow-down"></i>
            </button>
            <div className="p-4 flex-shrink-0 bg-[--bg-color] border-t border-[--border-color]">
                {attachedFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-2">
                        {attachedFiles.map((file, i) =>
                            <FilePreview key={i} file={file} onRemove={() => setAttachedFiles(files => files.filter((_, idx) => idx !== i))} />
                        )}
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="flex gap-2 bg-[--surface-color] rounded-2xl p-2 border border-[--border-color] focus-within:border-[--primary-color] transition-colors">
                    <div ref={attachButtonRef} className="relative self-end">
                        <button type="button" onClick={() => setIsAttachMenuOpen(prev => !prev)} title="Attach files" className={`p-3 rounded-full hover:bg-white/10 ${attachedFiles.length > 0 ? 'text-[--primary-color]' : 'text-[--text-secondary-color]'}`}>
                            <i className="fa-solid fa-paperclip"></i>
                        </button>
                        {isAttachMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 bg-[#3a3a3a] rounded-lg border border-[--border-color] p-2 flex gap-2 shadow-lg">
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-3 rounded-lg hover:bg-white/10" title="Upload Image"><i className="fa-solid fa-image"></i></button>
                                <button type="button" onClick={() => docInputRef.current?.click()} className="p-3 rounded-lg hover:bg-white/10" title="Upload Document"><i className="fa-solid fa-file-lines"></i></button>
                            </div>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                handleFormSubmit(e);
                            }
                        }}
                        placeholder={text ? '' : placeholderText}
                        rows={1}
                        className="flex-grow bg-transparent border-none outline-none text-[--text-color] resize-none py-3"
                    />
                    <button
                        type={thinkingModel ? "button" : "submit"}
                        onClick={thinkingModel ? onStopGeneration : undefined}
                        disabled={!thinkingModel && !text.trim() && attachedFiles.length === 0}
                        className="w-10 h-10 bg-[--primary-color] text-white rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:bg-blue-400 transition-colors self-end"
                    >
                        {thinkingModel ? <i className="fa-solid fa-square"></i> : <i className="fa-solid fa-arrow-up"></i>}
                    </button>
                    <input type="file" ref={imageInputRef} onChange={handleFileSelect} accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" multiple />
                    <input type="file" ref={docInputRef} onChange={handleFileSelect} accept=".txt,.csv,.pdf,.docx,.epub" className="hidden" multiple />
                </form>
            </div>
        </main>
    );
};
