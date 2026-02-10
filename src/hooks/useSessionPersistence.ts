import { useState, useEffect, useCallback } from 'react';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';

const STORAGE_KEY = 'vax-session';

export interface VaxSession {
  tab: number;
  batches: Batch[];
  logs: SafetyLog[];
  savedAt: string;
  name: string;
}

interface SessionList {
  current: VaxSession | null;
  saved: VaxSession[];
}

export function useSessionPersistence() {
  const [sessions, setSessions] = useState<SessionList>({ current: null, saved: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((data: SessionList) => {
    setSessions(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const saveSession = useCallback((name: string, state: Omit<VaxSession, 'savedAt' | 'name'>) => {
    const session: VaxSession = { ...state, name, savedAt: new Date().toISOString() };
    const updated = { ...sessions, saved: [...sessions.saved.filter(s => s.name !== name), session] };
    persist(updated);
  }, [sessions, persist]);

  const deleteSession = useCallback((name: string) => {
    persist({ ...sessions, saved: sessions.saved.filter(s => s.name !== name) });
  }, [sessions, persist]);

  const autoSave = useCallback((state: Omit<VaxSession, 'savedAt' | 'name'>) => {
    const current: VaxSession = { ...state, name: '__autosave__', savedAt: new Date().toISOString() };
    persist({ ...sessions, current });
  }, [sessions, persist]);

  return { sessions, saveSession, deleteSession, autoSave, loadSession: (name: string) => sessions.saved.find(s => s.name === name) };
}
