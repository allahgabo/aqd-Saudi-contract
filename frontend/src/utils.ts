import { useState, useEffect, useCallback, useRef } from 'react';

/** Persist state in localStorage */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);

  return [value, set];
}

/** Async data fetcher with loading/error state */
export function useFetch<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d => { if (mountedRef.current) { setData(d); setLoading(false); } })
      .catch(e => { if (mountedRef.current) { setError(e.message); setLoading(false); } });
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d => { if (mountedRef.current) { setData(d); setLoading(false); } })
      .catch(e => { if (mountedRef.current) { setError(e.message); setLoading(false); } });
  }, [fetchFn]);

  return { data, loading, error, refetch };
}

/** Format file size */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format relative date */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Export contracts array to CSV and trigger download */
export function exportContractsCSV(contracts: any[]): void {
  const headers = ['File Name','Employer','Job Title','Compliance Score','Risk Level','Language','Analyzed Date'];
  const rows = contracts.map(c => [
    `"${(c.file_name||'').replace(/"/g,'""')}"`,
    `"${(c.employer_name||'').replace(/"/g,'""')}"`,
    `"${(c.job_title||'').replace(/"/g,'""')}"`,
    c.compliance_score ?? '',
    c.overall_risk || '',
    c.language === 'ar' ? 'Arabic' : 'English',
    c.analyzed_at ? new Date(c.analyzed_at).toLocaleDateString() : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `aqd_contracts_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
