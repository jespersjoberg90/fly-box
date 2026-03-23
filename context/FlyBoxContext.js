import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadBox, saveBox } from '../storage/boxStorage';

function newEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const FlyBoxContext = createContext(null);

export function FlyBoxProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadBox();
      if (!cancelled) {
        setEntries(loaded);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addFromCatalog = useCallback((catalogId) => {
    setEntries((prev) => {
      if (prev.some((e) => e.catalogId === catalogId)) return prev;
      const next = [
        ...prev,
        { id: newEntryId(), catalogId, addedAt: new Date().toISOString() },
      ];
      saveBox(next).catch(() => {});
      return next;
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveBox(next).catch(() => {});
      return next;
    });
  }, []);

  const catalogIdsInBox = useMemo(
    () => new Set(entries.map((e) => e.catalogId)),
    [entries],
  );

  const hasInBox = useCallback(
    (catalogId) => catalogIdsInBox.has(catalogId),
    [catalogIdsInBox],
  );

  const value = useMemo(
    () => ({
      entries,
      ready,
      addFromCatalog,
      removeEntry,
      hasInBox,
      catalogIdsInBox,
    }),
    [entries, ready, addFromCatalog, removeEntry, hasInBox, catalogIdsInBox],
  );

  return <FlyBoxContext.Provider value={value}>{children}</FlyBoxContext.Provider>;
}

export function useFlyBox() {
  const ctx = useContext(FlyBoxContext);
  if (!ctx) throw new Error('useFlyBox must be used within FlyBoxProvider');
  return ctx;
}
