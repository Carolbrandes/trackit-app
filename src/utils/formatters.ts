const localeMap: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es-ES',
};

function getIntlLocale(locale?: string): string {
  return localeMap[locale ?? 'en'] ?? 'en-US';
}

export function formatDate(isoDate: string, locale?: string): string {
  const date = new Date(isoDate);
  const intlLocale = getIntlLocale(locale);
  return date.toLocaleDateString(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale?: string
): string {
  const intlLocale = getIntlLocale(locale);
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
