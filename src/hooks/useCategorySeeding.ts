import { useEffect, useRef } from 'react';
import { fetchCategories, createCategory } from '../services/api';

const DEFAULT_CATEGORIES = [
  'Mercado',
  'Contas',
  'Lazer',
  'Saúde',
  'Transporte',
  'Educação',
  'Restaurante',
  'Outros',
];

/**
 * Automatically seeds default categories for new users.
 * Runs once per session when userId becomes available.
 * Safe to call multiple times — only creates categories that don't exist yet.
 * @param userId  The authenticated user's ID (seeding is skipped while undefined)
 * @param onDone  Optional callback called after seeding completes (re-fetch categories)
 */
export function useCategorySeeding(
  userId: string | undefined,
  onDone?: () => void
): void {
  const seeded = useRef(false);

  useEffect(() => {
    if (!userId || seeded.current) return;
    seeded.current = true;

    (async () => {
      try {
        const existing = await fetchCategories();
        const existingNormalized = new Set(
          existing.map((c) => c.name.toLowerCase().trim())
        );

        const toCreate = DEFAULT_CATEGORIES.filter(
          (name) => !existingNormalized.has(name.toLowerCase().trim())
        );

        if (toCreate.length === 0) return;

        await Promise.allSettled(toCreate.map((name) => createCategory(name)));
        onDone?.();
      } catch {
        // seeding is best-effort — do not surface errors to the user
      }
    })();
  }, [userId]);
}
