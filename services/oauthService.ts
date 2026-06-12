/**
 * OpenRouter OAuth (PKCE) — one-click sign-in that provisions an API key
 * without the user ever copy-pasting anything.
 *
 * Flow: https://openrouter.ai/docs/oauth
 *  1. We generate a code_verifier, store it locally, and redirect the user to
 *     openrouter.ai/auth with its SHA-256 challenge.
 *  2. OpenRouter redirects back to this site with ?code=...
 *  3. We exchange the code (+ verifier) for a runtime API key and save it
 *     into the same localStorage slot the Settings page uses.
 */

const VERIFIER_STORAGE_KEY = 'ai-chain-or-verifier';
const API_KEYS_STORAGE_KEY = 'apiKeys';

function base64UrlEncode(bytes: Uint8Array): string {
    let str = '';
    bytes.forEach(b => { str += String.fromCharCode(b); });
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
}

export async function computeCodeChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64UrlEncode(new Uint8Array(digest));
}

export async function buildAuthUrl(callbackUrl: string, verifier: string): Promise<string> {
    const challenge = await computeCodeChallenge(verifier);
    const params = new URLSearchParams({
        callback_url: callbackUrl,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    });
    return `https://openrouter.ai/auth?${params.toString()}`;
}

/** The page OpenRouter should send the user back to (origin + path, no hash). */
export function getCallbackUrl(): string {
    return window.location.origin + window.location.pathname;
}

/** Kick off the sign-in: stores the verifier and redirects to OpenRouter. */
export async function startOpenRouterLogin(): Promise<void> {
    const verifier = generateCodeVerifier();
    localStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
    window.location.href = await buildAuthUrl(getCallbackUrl(), verifier);
}

/** Exchange the one-time code for a permanent OpenRouter API key. */
export async function exchangeCodeForKey(code: string): Promise<string> {
    const verifier = localStorage.getItem(VERIFIER_STORAGE_KEY) || '';
    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
    });
    if (!response.ok) {
        throw new Error(`OpenRouter sign-in failed (HTTP ${response.status}). Please try again.`);
    }
    const data = await response.json();
    if (!data?.key) throw new Error('OpenRouter sign-in returned no key.');
    localStorage.removeItem(VERIFIER_STORAGE_KEY);
    return data.key;
}

/** Merge a freshly issued key into the saved API keys (Settings storage). */
export function saveOpenRouterKey(key: string): void {
    let keys: Record<string, string> = {};
    try {
        keys = JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || '{}');
    } catch { /* corrupted -> start clean */ }
    keys.openrouter = key;
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

/**
 * If the current URL carries an OAuth callback (?code=...), complete the flow:
 * strip the query immediately (codes are single-use), exchange, persist.
 * Returns the key on success, null when there is no callback to handle.
 */
export async function handleOAuthCallback(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return null;
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    const key = await exchangeCodeForKey(code);
    saveOpenRouterKey(key);
    return key;
}
