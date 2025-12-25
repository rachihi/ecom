export function formatCurrency(value: number | string | undefined | null, locale = 'vi-VN', currency = 'VND') {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n}`;
  }
}

