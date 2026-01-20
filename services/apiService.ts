
import { ApiKeys, ChatMessage, ModelWithProvider, AttachedFile, LocalLlmConfig, ToolCall, ImageFile, DocumentFile } from '../types';
import { getModelCapabilities } from './modelService';

interface ApiResponse {
    text: string;
    tool_calls?: ToolCall[];
}

const dataUrlToGeminiPart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return { inlineData: { mimeType: match[1], data: match[2] } };
};

async function generateZhipuToken(apiKey: string): Promise<string> {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) throw new Error('Invalid Zhipu API Key format. Expected ID.SECRET');
    const header = { alg: 'HS256', sign_type: 'SIGN', typ: 'JWT' };
    const payload = { api_key: id, exp: Date.now() + 2 * 60 * 1000, timestamp: Date.now() };
    const toBase64Url = (data: object) => btoa(JSON.stringify(data)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedHeader = toBase64Url(header);
    const encodedPayload = toBase64Url(payload);
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(dataToSign));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${dataToSign}.${encodedSignature}`;
}

function formatMessagesForApi(
    allMessages: ChatMessage[],
    files: AttachedFile[] | null,
    modelInfo: ModelWithProvider
): any[] {
    const { isMultimodal } = getModelCapabilities(modelInfo);
    const imageFiles = files?.filter(f => f.type === 'image') as ImageFile[] || [];
    const documentFiles = files?.filter(f => f.type === 'document') as DocumentFile[] || [];

    const formattedMessages = allMessages.map((msg, index) => {
        const isLastMessage = index === allMessages.length - 1;
        
        if (msg.role === 'user') {
            const contentParts: any[] = [];
            let promptText = msg.content || '';

            // Attach document context and images ONLY to the last user message
            if (isLastMessage) {
                if (documentFiles.length > 0) {
                    const docContext = documentFiles.map(f => `--- Document: ${f.name} ---\n${f.content}`).join('\n\n');
                    promptText = `Based on the following document(s):\n${docContext}\n\nMy question: ${promptText}`;
                }
                contentParts.push({ type: 'text', text: promptText });
                
                if (isMultimodal && imageFiles.length > 0) {
                    imageFiles.forEach(file => {
                        contentParts.push({ type: 'image_url', image_url: { url: file.dataUrl } });
                    });
                }
            } else {
                 contentParts.push({ type: 'text', text: promptText });
            }

            // Return content based on how complex it is
            return {
                role: 'user',
                content: contentParts.length === 1 && contentParts[0].type === 'text' ? contentParts[0].text : contentParts
            };
        }
        
        if (msg.role === 'assistant') {
            return {
                role: 'assistant',
                content: msg.content,
                tool_calls: msg.tool_calls
            };
        }

        if (msg.role === 'tool') {
             return {
                role: 'tool',
                tool_call_id: msg.tool_call_id,
                name: msg.name,
                content: msg.content
            };
        }

        return msg;
    });

    return formattedMessages;
}


export async function getAiResponse(
    modelInfo: ModelWithProvider,
    apiKeys: ApiKeys,
    localConfig: LocalLlmConfig,
    messages: ChatMessage[],
    files: AttachedFile[] | null,
    signal: AbortSignal
): Promise<ApiResponse> {
    const { id: fullModelId, provider } = modelInfo;
    const directApiKey = apiKeys[provider];
    const openRouterApiKey = apiKeys.openrouter;
    
    let endpoint = '';
    let headers: Record<string, string> = {};
    let body: Record<string, any> = {};

    const useDirectCall = (['openai', 'google', 'zhipu'].includes(provider) && directApiKey) || (provider === 'local' && localConfig.serverUrl);
    
    if (useDirectCall) {
        const modelIdWithoutProvider = fullModelId.split('/').pop() || fullModelId;
        switch (provider) {
            case 'local':
                endpoint = new URL('/v1/chat/completions', localConfig.serverUrl).toString();
                headers = { 'Authorization': `Bearer ${localConfig.apiKey || 'no-key'}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
                break;
            case 'google':
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelIdWithoutProvider}:generateContent?key=${directApiKey}`;
                headers = { 'Content-Type': 'application/json' };
                const geminiMessages = formatMessagesForApi(messages, files, modelInfo).map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : msg.role,
                    parts: Array.isArray(msg.content) ? msg.content.map(part => part.type === 'text' ? { text: part.text } : dataUrlToGeminiPart(part.image_url.url)) : [{ text: msg.content || '' }]
                }));
                body = { contents: geminiMessages };
                break;
            case 'openai':
                endpoint = 'https://api.openai.com/v1/chat/completions';
                headers = { 'Authorization': `Bearer ${directApiKey}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
                break;
            case 'zhipu':
                const token = await generateZhipuToken(directApiKey as string);
                endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, null, modelInfo) };
                break;
        }
    } else if (openRouterApiKey) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${openRouterApiKey}`, 'Content-Type': 'application/json' };
        body = { model: fullModelId, messages: formatMessagesForApi(messages, files, modelInfo) };
    } else {
        throw new Error(`No API key for '${provider}' and no OpenRouter fallback key.`);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || errorData.error?.message || JSON.stringify(errorData));
        } catch(e) {
            throw new Error(errorText || "An unknown network error occurred.");
        }
    }

    const data = await response.json();

    let aiMessageContent: string | null = "No response.";
    let tool_calls: ToolCall[] | undefined = undefined;

    if (data.choices && data.choices[0] && data.choices[0].message) {
        const message = data.choices[0].message;
        aiMessageContent = message.content;
        tool_calls = message.tool_calls;
    } else if (provider === 'google' && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiMessageContent = data.candidates[0].content.parts[0].text;
    }

    if (aiMessageContent === null && tool_calls && tool_calls.length > 0) {
        // This is valid, it's just a tool call
    } else if (!aiMessageContent && !tool_calls) {
        console.warn("Invalid response structure from provider:", data);
        throw new Error("Empty or invalid response from provider.");
    }
    
    return { text: aiMessageContent || '', tool_calls };
}
