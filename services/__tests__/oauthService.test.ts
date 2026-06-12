import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCodeVerifier, computeCodeChallenge, buildAuthUrl,
  exchangeCodeForKey, saveOpenRouterKey,
} from '../oauthService';

// Minimal localStorage stub for the node test environment.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('generateCodeVerifier', () => {
  it('produces a URL-safe, sufficiently long, unique verifier', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(a).not.toBe(b);
  });
});

describe('computeCodeChallenge', () => {
  it('matches the official RFC 7636 test vector', async () => {
    // Appendix B of RFC 7636.
    const challenge = await computeCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('buildAuthUrl', () => {
  it('points at openrouter.ai with callback, challenge, and S256 method', async () => {
    const url = new URL(await buildAuthUrl('https://example.com/app/', 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'));
    expect(url.origin + url.pathname).toBe('https://openrouter.ai/auth');
    expect(url.searchParams.get('callback_url')).toBe('https://example.com/app/');
    expect(url.searchParams.get('code_challenge')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });
});

describe('exchangeCodeForKey', () => {
  it('posts code + stored verifier and returns the key', async () => {
    store.set('ai-chain-or-verifier', 'my-verifier');
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true, json: async () => ({ key: 'sk-or-v1-test' }),
    } as any);
    const key = await exchangeCodeForKey('the-code');
    expect(key).toBe('sk-or-v1-test');
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(body).toEqual({ code: 'the-code', code_verifier: 'my-verifier', code_challenge_method: 'S256' });
    expect(store.has('ai-chain-or-verifier')).toBe(false); // single-use
  });

  it('throws a readable error on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: false, status: 403 } as any);
    await expect(exchangeCodeForKey('bad')).rejects.toThrow(/403/);
  });

  it('throws when no key is returned', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    await expect(exchangeCodeForKey('x')).rejects.toThrow(/no key/i);
  });
});

describe('saveOpenRouterKey', () => {
  it('merges into existing apiKeys without clobbering other providers', () => {
    store.set('apiKeys', JSON.stringify({ openai: 'sk-keep' }));
    saveOpenRouterKey('sk-or-new');
    expect(JSON.parse(store.get('apiKeys')!)).toEqual({ openai: 'sk-keep', openrouter: 'sk-or-new' });
  });

  it('survives corrupted storage', () => {
    store.set('apiKeys', '{not json');
    saveOpenRouterKey('sk-or-new');
    expect(JSON.parse(store.get('apiKeys')!)).toEqual({ openrouter: 'sk-or-new' });
  });
});
