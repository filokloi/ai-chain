import { useState, useEffect } from 'react';

export type Route = 'chat' | 'models' | 'free' | 'selfhost' | 'ideas';

const VALID: Route[] = ['chat', 'models', 'free', 'selfhost', 'ideas'];

export function parseHash(hash: string): Route {
    const clean = hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
    return (VALID as string[]).includes(clean) ? (clean as Route) : 'chat';
}

/** Minimal hash-based router: works on GitHub Pages with zero dependencies. */
export function useHashRoute(): [Route, (r: Route) => void] {
    const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

    useEffect(() => {
        const onChange = () => setRoute(parseHash(window.location.hash));
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);

    const navigate = (r: Route) => {
        window.location.hash = `/${r}`;
    };

    return [route, navigate];
}
