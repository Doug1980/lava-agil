'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lavaagil:codes';

function readCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function writeCodes(codes: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Storage indisponível (modo privado/cota). O código na tela ainda cobre o caso.
  }
}

/**
 * Lembra, no navegador, os códigos dos agendamentos que este visitante fez.
 * É o que permite uma área "Meus agendamentos" sem exigir cadastro.
 */
export function useMyBookings() {
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    setCodes(readCodes());
  }, []);

  const addCode = useCallback((raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setCodes((current) => {
      if (current.includes(code)) return current;
      const next = [code, ...current];
      writeCodes(next);
      return next;
    });
  }, []);

  const removeCode = useCallback((raw: string) => {
    setCodes((current) => {
      const next = current.filter((c) => c !== raw);
      writeCodes(next);
      return next;
    });
  }, []);

  return { codes, addCode, removeCode };
}
