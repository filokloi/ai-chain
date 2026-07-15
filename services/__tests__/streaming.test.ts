import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamAiResponse } from '../apiService';
import type { ModelWithProvider } from '../../types';

const MODEL: ModelWithProvider = { id: 'local/aichain-auto', name: 'AIchain', provider: 'local', description: '' } as any;

function sseStream(frames: string[]): ReadableStream<Uint8Array> {
    const enc = new TextEncoder();
    return new ReadableStream({
        start(c) { frames.forEach(f => c.enqueue(enc.encode(f))); c.close(); }
    });
}

afterEach(() => vi.unstubAllGlobals());

describe('streamAiResponse (SSE)', () => {
    it('accumulates deltas, captures _aichaind metadata, reports progress', async () => {
        const frames = [
            'data: {"choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"index":0,"delta":{"content":"Zdra"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"index":0,"delta":{"content":"vo!"},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"index":0,"delta":{},"finish_reason":null}],"_aichaind":{"routed_model":"deepseek/deepseek-v4-flash","estimated_cost_usd":0.000077,"failover_used":true,"fallback_chain":["google/gemini-2.5-pro"]}}\n\n',
            'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n',
        ];
        vi.stubGlobal('fetch', vi.fn(async () => new Response(sseStream(frames), {
            status: 200, headers: { 'Content-Type': 'text/event-stream' } })));

        const progress: string[] = [];
        const res = await streamAiResponse(MODEL, {} as any, { serverUrl: 'http://127.0.0.1:8080' } as any,
            [{ id: '1', role: 'user', content: 'zdravo' }] as any, null,
            new AbortController().signal, (t) => progress.push(t));

        expect(res.text).toBe('Zdravo!');
        expect(progress).toEqual(['Zdra', 'Zdravo!']);
        expect(res.aichain?.routed_model).toBe('deepseek/deepseek-v4-flash');
        expect(res.aichain?.failover_used).toBe(true);
        expect(res.aichain?.fallback_chain).toEqual(['google/gemini-2.5-pro']);
    });

    it('falls back to plain JSON when server ignores stream:true', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            choices: [{ message: { content: 'ceo odgovor' } }],
            _aichaind: { routed_model: 'x/y' },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

        const progress: string[] = [];
        const res = await streamAiResponse(MODEL, {} as any, { serverUrl: 'http://127.0.0.1:8080' } as any,
            [{ id: '1', role: 'user', content: 'zdravo' }] as any, null,
            new AbortController().signal, (t) => progress.push(t));
        expect(res.text).toBe('ceo odgovor');
        expect(progress).toEqual(['ceo odgovor']);
        expect(res.aichain?.routed_model).toBe('x/y');
    });

    it('accumulates streamed tool calls', async () => {
        const frames = [
            'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"c1","function":{"name":"get_w","arguments":""}}]},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"name":"eather","arguments":"{\\"city\\":"}}]},"finish_reason":null}]}\n\n',
            'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"Nis\\"}"}}]},"finish_reason":null}]}\n\n',
            'data: [DONE]\n\n',
        ];
        vi.stubGlobal('fetch', vi.fn(async () => new Response(sseStream(frames), {
            status: 200, headers: { 'Content-Type': 'text/event-stream' } })));

        const res = await streamAiResponse(MODEL, {} as any, { serverUrl: 'http://127.0.0.1:8080' } as any,
            [{ id: '1', role: 'user', content: 'vreme u Nišu' }] as any, null,
            new AbortController().signal, () => {});
        expect(res.tool_calls).toHaveLength(1);
        expect(res.tool_calls![0].function.name).toBe('get_weather');
        expect(res.tool_calls![0].function.arguments).toBe('{"city":"Nis"}');
    });
});
