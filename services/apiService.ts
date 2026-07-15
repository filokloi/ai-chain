import { ApiKeys, ChatMessage, ModelWithProvider, AttachedFile, LocalLlmConfig, ToolCall, ImageFile, DocumentFile } from '../types';
import { getModelCapabilities } from './modelService';

interface ApiResponse {
    text: string;
    tool_calls?: ToolCall[];
    aichain?: import('../types').AichainRouteMeta;
}

const dataUrlToGeminiPart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return { inlineData: { mimeType: match[1], data: match[2] } };
};

const dataUrlToAnthropicPart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
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

export function formatMessagesForApi(
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

/**
 * Anthropic's Messages API keeps the system prompt separate and uses content blocks.
 * We convert the OpenAI-style intermediate format into that shape.
 */
function formatMessagesForAnthropic(openAiMessages: any[]): { system?: string; messages: any[] } {
    const systemParts: string[] = [];
    const messages: any[] = [];

    for (const msg of openAiMessages) {
        if (msg.role === 'system') {
            if (typeof msg.content === 'string') systemParts.push(msg.content);
            continue;
        }
        if (msg.role !== 'user' && msg.role !== 'assistant') continue; // skip tool roles

        if (typeof msg.content === 'string') {
            messages.push({ role: msg.role, content: msg.content });
        } else if (Array.isArray(msg.content)) {
            const blocks = msg.content.map((part: any) =>
                part.type === 'text'
                    ? { type: 'text', text: part.text }
                    : dataUrlToAnthropicPart(part.image_url.url)
            );
            messages.push({ role: msg.role, content: blocks });
        }
    }

    return { system: systemParts.join('\n\n') || undefined, messages };
}

export async function getAiResponse(
    modelInfo: ModelWithProvider,
    apiKeys: ApiKeys,
    localConfig: LocalLlmConfig,
    messages: ChatMessage[],
    files: AttachedFile[] | null,
    signal: AbortSignal
): Promise<ApiResponse> {
    if (!messages || messages.length === 0) {
        throw new Error("Cannot send an empty conversation.");
    }

    const { id: fullModelId, provider } = modelInfo;
    const directApiKey = apiKeys[provider];
    const openRouterApiKey = apiKeys.openrouter;

    let endpoint = '';
    let headers: Record<string, string> = {};
    let body: Record<string, any> = {};
    let isAnthropic = false;

    const directProviders = ['openai', 'google', 'zhipu', 'anthropic', 'groq'];
    const useDirectCall = (directProviders.includes(provider) && directApiKey) || (provider === 'local' && localConfig.serverUrl);

    if (useDirectCall) {
        const modelIdWithoutProvider = fullModelId.split('/').pop() || fullModelId;
        switch (provider) {
            case 'local':
                endpoint = new URL('/v1/chat/completions', localConfig.serverUrl).toString();
                headers = { 'Authorization': `Bearer ${localConfig.apiKey || 'no-key'}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
                break;
            case 'google': {
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelIdWithoutProvider}:generateContent?key=${directApiKey}`;
                headers = { 'Content-Type': 'application/json' };
                const geminiMessages = formatMessagesForApi(messages, files, modelInfo)
                    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                    .map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: Array.isArray(msg.content) ? msg.content.map((part: any) => part.type === 'text' ? { text: part.text } : dataUrlToGeminiPart(part.image_url.url)) : [{ text: msg.content || '' }]
                    }));
                body = { contents: geminiMessages };
                break;
            }
            case 'openai':
                endpoint = 'https://api.openai.com/v1/chat/completions';
                headers = { 'Authorization': `Bearer ${directApiKey}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
                break;
            case 'groq':
                endpoint = 'https://api.groq.com/openai/v1/chat/completions';
                headers = { 'Authorization': `Bearer ${directApiKey}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
                break;
            case 'anthropic': {
                isAnthropic = true;
                endpoint = 'https://api.anthropic.com/v1/messages';
                headers = {
                    'x-api-key': directApiKey as string,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                    'Content-Type': 'application/json',
                };
                const { system, messages: anthropicMessages } = formatMessagesForAnthropic(formatMessagesForApi(messages, files, modelInfo));
                body = { model: modelIdWithoutProvider, max_tokens: 4096, messages: anthropicMessages };
                if (system) body.system = system;
                break;
            }
            case 'zhipu': {
                const token = await generateZhipuToken(directApiKey as string);
                endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                body = { model: modelIdWithoutProvider, messages: formatMessagesForApi(messages, null, modelInfo) };
                break;
            }
        }
    } else if (openRouterApiKey) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${openRouterApiKey}`, 'Content-Type': 'application/json' };
        // Cap max_tokens: without it OpenRouter reserves a large default, which
        // fails with HTTP 402 on low-credit accounts even for cheap models.
        body = { model: fullModelId, messages: formatMessagesForApi(messages, files, modelInfo), max_tokens: 4096 };
    } else {
        throw new Error(`No API key configured for '${provider}' and no OpenRouter fallback key set. Add a key in Settings.`);
    }

    let response: Response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal,
        });
    } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        throw new Error(`Network error contacting ${provider}: ${err?.message || 'request failed'}`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        let message: string;
        try {
            const errorData = JSON.parse(errorText);
            message = errorData.message || errorData.error?.message || JSON.stringify(errorData);
        } catch {
            message = errorText || "An unknown network error occurred.";
        }
        throw new Error(`${provider} request failed (HTTP ${response.status}): ${message}`);
    }

    const data = await response.json();

    let aiMessageContent: string | null = null;
    let tool_calls: ToolCall[] | undefined = undefined;

    if (isAnthropic) {
        const textBlock = Array.isArray(data.content) ? data.content.find((b: any) => b.type === 'text') : null;
        aiMessageContent = textBlock?.text ?? null;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
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

    return { text: aiMessageContent || '', tool_calls, aichain: data._aichaind };
}

/**
 * Streaming variant (SSE) for OpenAI-compatible providers: OpenRouter,
 * OpenAI, Groq and any local OpenAI-compatible server — including the
 * aichaind sidecar, whose final frame carries `_aichaind` routing metadata
 * (which model actually answered, effective cost, failover chain).
 *
 * Google / Anthropic / Zhipu fall back to the non-streaming call and emit
 * the whole text through onDelta once, so callers use one code path.
 */
export async function streamAiResponse(
    modelInfo: ModelWithProvider,
    apiKeys: ApiKeys,
    localConfig: LocalLlmConfig,
    messages: ChatMessage[],
    files: AttachedFile[] | null,
    signal: AbortSignal,
    onDelta: (textSoFar: string) => void
): Promise<ApiResponse> {
    const { id: fullModelId, provider } = modelInfo;
    const directApiKey = apiKeys[provider];
    const openRouterApiKey = apiKeys.openrouter;

    const sseCapable = (provider === 'local' && localConfig.serverUrl)
        || (provider === 'openai' && directApiKey)
        || (provider === 'groq' && directApiKey)
        || (!['openai', 'google', 'zhipu', 'anthropic', 'groq', 'local'].includes(provider) && openRouterApiKey)
        || (['google', 'zhipu', 'anthropic'].includes(provider) && !directApiKey && openRouterApiKey);

    if (!sseCapable) {
        const full = await getAiResponse(modelInfo, apiKeys, localConfig, messages, files, signal);
        if (full.text) onDelta(full.text);
        return full;
    }

    let endpoint: string;
    let headers: Record<string, string>;
    const formatted = formatMessagesForApi(messages, files, modelInfo);
    const modelIdWithoutProvider = fullModelId.split('/').pop() || fullModelId;
    let body: Record<string, any>;

    if (provider === 'local' && localConfig.serverUrl) {
        endpoint = new URL('/v1/chat/completions', localConfig.serverUrl).toString();
        headers = { 'Authorization': `Bearer ${localConfig.apiKey || 'no-key'}`, 'Content-Type': 'application/json' };
        body = { model: modelIdWithoutProvider, messages: formatted, max_tokens: 4096, stream: true };
    } else if (provider === 'openai' && directApiKey) {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${directApiKey}`, 'Content-Type': 'application/json' };
        body = { model: modelIdWithoutProvider, messages: formatted, max_tokens: 4096, stream: true };
    } else if (provider === 'groq' && directApiKey) {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${directApiKey}`, 'Content-Type': 'application/json' };
        body = { model: modelIdWithoutProvider, messages: formatted, max_tokens: 4096, stream: true };
    } else {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${openRouterApiKey}`, 'Content-Type': 'application/json' };
        body = { model: fullModelId, messages: formatted, max_tokens: 4096, stream: true };
    }

    let response: Response;
    try {
        response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal });
    } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        throw new Error(`Network error contacting ${provider}: ${err?.message || 'request failed'}`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        let message: string;
        try {
            const errorData = JSON.parse(errorText);
            message = errorData.message || errorData.error?.message || JSON.stringify(errorData);
        } catch {
            message = errorText || 'An unknown network error occurred.';
        }
        throw new Error(`${provider} request failed (HTTP ${response.status}): ${message}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.body || !contentType.includes('text/event-stream')) {
        // Server ignored stream:true and answered with plain JSON.
        const data = await response.json();
        const msg = data.choices?.[0]?.message;
        const text = msg?.content || '';
        if (text) onDelta(text);
        return { text, tool_calls: msg?.tool_calls, aichain: data._aichaind };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let aichain: any = undefined;
    const toolCallAcc: Record<number, ToolCall> = {};

    const handleFrame = (jsonStr: string) => {
        let frame: any;
        try { frame = JSON.parse(jsonStr); } catch { return; }
        if (frame._aichaind) aichain = frame._aichaind;
        const choice = frame.choices?.[0];
        if (!choice) return;
        const delta = choice.delta || choice.message || {};
        if (typeof delta.content === 'string' && delta.content) {
            text += delta.content;
            onDelta(text);
        }
        if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallAcc[idx]) {
                    toolCallAcc[idx] = { id: tc.id || `call_${idx}`, type: 'function',
                        function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' } };
                } else {
                    if (tc.function?.name) toolCallAcc[idx].function.name += tc.function.name;
                    if (tc.function?.arguments) toolCallAcc[idx].function.arguments += tc.function.arguments;
                }
            }
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') { buffer = ''; break; }
            handleFrame(payload);
        }
    }

    const tool_calls = Object.values(toolCallAcc);
    if (!text && tool_calls.length === 0) {
        throw new Error('Empty or invalid streaming response from provider.');
    }
    return { text, tool_calls: tool_calls.length ? tool_calls : undefined, aichain };
}
