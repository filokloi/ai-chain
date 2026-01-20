
export interface ApiKeys {
    [provider: string]: string;
}

export interface LocalLlmConfig {
    serverUrl: string;
    apiKey: string;
}

export interface ImageFile {
    name: string;
    type: 'image';
    subtype: 'jpeg' | 'png' | 'gif' | 'webp';
    dataUrl: string; // base64 encoded data URL
    size: number;
}

export interface DocumentFile {
    name: string;
    type: 'document';
    subtype: 'pdf' | 'docx' | 'txt' | 'csv' | 'epub';
    content: string; // Extracted text content
    size: number;
}

export type AttachedFile = ImageFile | DocumentFile;


export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    fileInfo?: AttachedFile[] | null;
    model?: string;
    feedback?: 'like' | 'dislike';
    name?: string; // For tool responses
}

export interface Chat {
    id: number;
    title: string;
    lastUpdated: number;
    messages: ChatMessage[];
    isPinned: boolean;
}

// Represents a model fetched from an API like OpenRouter
export interface Model {
    id: string;
    name: string;
    description: string;
    context_length?: number;
    architecture?: {
        modality?: string;
    };
    popularity?: number;
    [key: string]: any;
}

// Internal representation of a model with its provider
export interface ModelWithProvider extends Model {
    provider: string;
    isFree?: boolean;
}