import { useEffect, useState } from 'react';
import type { GateId } from './state/types';

export type Route =
  | { name: 'desk' }
  | { name: 'new' }
  | { name: 'check' }
  | { name: 'case'; id: string }
  | { name: 'sealed'; id: string }
  | { name: 'reopen'; id: string }
  | { name: 'ledger' }
  | { name: 'gate'; gate: GateId }
  | { name: 'me'; tab?: 'predictions' | 'results' | 'history' | 'data' }
  | { name: 'about' };

export function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const p = raw.split('/').filter(Boolean);
  if (p.length === 0) return { name: 'desk' };
  switch (p[0]) {
    case 'new': return { name: 'new' };
    case 'check': return { name: 'check' };
    case 'ledger': return p[1] && ['quoting','accept','pricing','product','hiring','partner','channel','priceup'].includes(p[1]) ? { name: 'gate', gate: p[1] as GateId } : { name: 'ledger' };
    case 'me': return { name: 'me', tab: ['predictions', 'results', 'history', 'data'].includes(p[1]) ? p[1] as 'predictions' | 'results' | 'history' | 'data' : undefined };
    case 'about': return { name: 'about' };
    case 'case': {
      const id = p[1] ?? '';
      if (p[2] === 'sealed') return { name: 'sealed', id };
      if (p[2] === 'reopen') return { name: 'reopen', id };
      return { name: 'case', id };
    }
    default: return { name: 'desk' };
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'desk': return '#/';
    case 'new': return '#/new';
    case 'check': return '#/check';
    case 'case': return `#/case/${r.id}`;
    case 'sealed': return `#/case/${r.id}/sealed`;
    case 'reopen': return `#/case/${r.id}/reopen`;
    case 'ledger': return '#/ledger';
    case 'gate': return `#/ledger/${r.gate}`;
    case 'me': return r.tab ? `#/me/${r.tab}` : '#/me';
    case 'about': return '#/about';
  }
}

export function go(r: Route | string): void {
  window.location.hash = typeof r === 'string' ? r : href(r);
}

export function useRoute(): Route {
  const [r, setR] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => { setR(parse(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
