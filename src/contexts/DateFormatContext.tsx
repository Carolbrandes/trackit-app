import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type DateFormatPreference = 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'long';

const STORAGE_KEY = 'dateFormatPreference';

const localeToIntl: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es-ES',
};

interface DateFormatContextType {
  dateFormat: DateFormatPreference;
  setDateFormat: (format: DateFormatPreference) => void;
  formatDate: (isoDate: string, locale?: string) => string;
}

const DateFormatContext = createContext<DateFormatContextType>({
  dateFormat: 'dd/mm/yyyy',
  setDateFormat: () => {},
  formatDate: (d) => new Date(d).toLocaleDateString(),
});

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormatPreference>('dd/mm/yyyy');

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored && ['mm/dd/yyyy', 'dd/mm/yyyy', 'long'].includes(stored)) {
        setDateFormatState(stored as DateFormatPreference);
      }
    }).catch(() => {});
  }, []);

  const setDateFormat = useCallback((format: DateFormatPreference) => {
    setDateFormatState(format);
    SecureStore.setItemAsync(STORAGE_KEY, format).catch(() => {});
  }, []);

  const formatDate = useCallback(
    (isoDate: string, locale: string = 'en') => {
      const date = new Date(isoDate);
      const intlLocale = localeToIntl[locale] ?? 'en-US';

      if (dateFormat === 'long') {
        return date.toLocaleDateString(intlLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        });
      }
      if (dateFormat === 'dd/mm/yyyy') {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC',
        });
      }
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      });
    },
    [dateFormat]
  );

  const value = useMemo(
    () => ({ dateFormat, setDateFormat, formatDate }),
    [dateFormat, setDateFormat, formatDate]
  );

  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormat() {
  return useContext(DateFormatContext);
}
