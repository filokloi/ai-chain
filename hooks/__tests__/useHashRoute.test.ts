import { describe, it, expect } from 'vitest';
import { parseHash } from '../useHashRoute';

describe('parseHash', () => {
  it('maps known routes', () => {
    expect(parseHash('#/models')).toBe('models');
    expect(parseHash('#/free')).toBe('free');
    expect(parseHash('#/selfhost')).toBe('selfhost');
    expect(parseHash('#/ideas')).toBe('ideas');
    expect(parseHash('#/chat')).toBe('chat');
  });
  it('defaults to chat for empty or unknown hashes', () => {
    expect(parseHash('')).toBe('chat');
    expect(parseHash('#/')).toBe('chat');
    expect(parseHash('#/nope')).toBe('chat');
  });
  it('tolerates missing slash, query strings, and case', () => {
    expect(parseHash('#models')).toBe('models');
    expect(parseHash('#/Models?x=1')).toBe('models');
  });
});
