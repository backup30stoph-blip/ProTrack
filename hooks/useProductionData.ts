
import { useState, useEffect, useCallback } from 'react';
import { ProductionEntry, ProductionOrder } from '../types';
import { STORAGE_KEY, DRAFT_KEY } from '../constants';
import { generateId } from '../utils/calculations';

export const useProductionData = () => {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [draft, setDraft] = useState<Partial<ProductionEntry> | null>(null);

  // Load entries on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  const saveEntries = useCallback((newEntries: ProductionEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  }, []);

  const addEntry = useCallback((entry: Omit<ProductionEntry, 'id' | 'submittedAt'>) => {
    const newEntry: ProductionEntry = {
      ...entry,
      id: generateId(),
      submittedAt: Date.now(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(updated);
    // Clear draft after successful submission
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  }, [entries, saveEntries]);

  const updateEntry = useCallback((updatedEntry: ProductionEntry) => {
    const updated = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    saveEntries(updated);
  }, [entries, saveEntries]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
  }, [entries, saveEntries]);

  const saveDraft = useCallback((draftData: Partial<ProductionEntry>) => {
    setDraft(draftData);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }, []);

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    draft,
    saveDraft
  };
};
