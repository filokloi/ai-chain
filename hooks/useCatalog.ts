import { useState, useEffect, useCallback } from 'react';
import { loadCatalog, type CatalogSnapshot } from '../services/catalogService';

interface CatalogState {
    data: CatalogSnapshot | null;
    loading: boolean;
    error: string | null;
}

export function useCatalog() {
    const [state, setState] = useState<CatalogState>({ data: null, loading: true, error: null });

    const refresh = useCallback(async (force = false) => {
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const data = await loadCatalog(force);
            setState({ data, loading: false, error: null });
        } catch (err) {
            setState({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return { ...state, refresh };
}
