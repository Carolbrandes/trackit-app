import { useEffect, useState } from 'react';
import { useUserData } from './useUserData';
import { fetchCurrencies, type CurrencyItem } from '../services/api';

export function useCurrency() {
  const { user } = useUserData();
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');

  useEffect(() => {
    fetchCurrencies().then((list) => {
      setCurrencies(list.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  useEffect(() => {
    if (user?.currencyId && currencies.length > 0) {
      const c = currencies.find((x) => x._id === user.currencyId);
      if (c) setSelectedCurrencyCode(c.code);
    }
  }, [user?.currencyId, currencies]);

  return { currencies, selectedCurrencyCode };
}
