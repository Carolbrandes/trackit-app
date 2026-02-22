import { useEffect, useState, useCallback } from 'react';
import {
  fetchTransactions,
  fetchAllTransactionsForSummary,
  type ApiTransaction,
  type TransactionFilters,
} from '../services/api';

export type Transaction = ApiTransaction;

export function useTransactions(
  userId: string | undefined,
  page: number = 1,
  limit: number = 10,
  filters: TransactionFilters = {}
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(() => {
    if (!userId) return;
    setError(null);
    setIsLoading(true);
    fetchTransactions(userId, page, limit, filters)
      .then((res) => {
        setTransactions(res.data);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setIsLoading(false));
  }, [userId, page, limit, JSON.stringify(filters)]);

  const loadAllForSummary = useCallback(() => {
    if (!userId) return;
    fetchAllTransactionsForSummary(userId, filters)
      .then((res) => setAllTransactions(res.data))
      .catch(() => setAllTransactions([]));
  }, [userId, JSON.stringify(filters)]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    loadAllForSummary();
  }, [loadAllForSummary]);

  const refetch = useCallback(() => {
    loadPage();
    loadAllForSummary();
  }, [loadPage, loadAllForSummary]);

  return {
    transactions,
    allTransactions,
    totalCount,
    totalPages,
    isLoading,
    error,
    refetch,
  };
}
