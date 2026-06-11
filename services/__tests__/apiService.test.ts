import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAiResponse, formatMessagesForApi } from '../apiService';
import type { ChatMessage, ModelWithProvider } from '../../types';

const noKeyConfig = { serverUrl: '', apiKey: '' };
const msgs: ChatMessage[] = [{ id: '1', role: 'user', content: 'hello' }];

const model = (over: Partial<ModelWithProvider>): ModelWithProvider => ({
  id: 'x/y', name: 'y', description: '', provider: 'openrouter', ...over,
});

describe('formatMessagesForApi', () => {
  it('passes plain text user messages straight through', () => {
    const out = formatMessagesForApi(msgs, null, model({ provider: 'openai', id: 'openai/gpt-4o' }));
    expect(out[0]).toEqual({ role: 'user', content: 'hello' });
  });

  it('prepends document context to the last user message', () => {
    const out = formatMessagesForApi(msgs, [{ name: 'a.txt', type: 'document', subtype: 'txt', content: 'DOC', size: 3 }], model({ provider: 'openai' }));
    expect(String(out[0].content)).toContain('DOC');
    expect(String(out[0].content)).toContain('hello');
  });
});

describe('getAiResponse', () => {
  const ctrl = new AbortController();
  afterEach(() => vi.restoreAllMocks());

  it('throws a clear error when no key and no OpenRouter fallback', async () => {
    await expect(
      getAiResponse(model({ provider: 'cohere' }), {}, noKeyConfig, msgs, null, ctrl.signal)
    ).rejects.toThrow(/No API key/);
  });

  it('rejects an empty conversation', async () => {
    await expect(
      getAiResponse(model({ provider: 'openai' }), { openai: 'k' }, noKeyConfig, [], null, ctrl.signal)
    ).rejects.toThrow(/empty conversation/i);
  });

  it('parses an OpenAI-style response', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi there' } }] }),
    } as any);
    const res = await getAiResponse(model({ provider: 'openai', id: 'openai/gpt-4o' }), { openai: 'k' }, noKeyConfig, msgs, null, ctrl.signal);
    expect(res.text).toBe('hi there');
  });

  it('parses an Anthropic Messages response and uses the correct endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'claude says hi' }] }),
    } as any);
    const res = await getAiResponse(model({ provider: 'anthropic', id: 'anthropic/claude-3.5-sonnet' }), { anthropic: 'k' }, noKeyConfig, msgs, null, ctrl.signal);
    expect(res.text).toBe('claude says hi');
    expect(String(fetchSpy.mock.calls[0][0])).toContain('api.anthropic.com');
  });

  it('surfaces HTTP error bodies with status code', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: false, status: 429,
      text: async () => JSON.stringify({ error: { message: 'rate limited' } }),
    } as any);
    await expect(
      getAiResponse(model({ provider: 'openai', id: 'openai/gpt-4o' }), { openai: 'k' }, noKeyConfig, msgs, null, ctrl.signal)
    ).rejects.toThrow(/429.*rate limited/);
  });
});
