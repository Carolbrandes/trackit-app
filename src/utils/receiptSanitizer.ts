/**
 * Mirror of the web receiptSanitizer.ts logic.
 * Validates unitPrice × quantity consistency and normalizes values.
 * On mobile, the backend already sanitizes, so this is a defensive re-validation pass.
 */

import type { ParsedReceiptItem } from '../services/api';

/** Raw shape as returned directly from Gemini before sanitization */
export interface RawReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalLinePrice: number;
}

/**
 * Full sanitizer for raw Gemini output (unitPrice + totalLinePrice).
 * Ported exactly from web/src/app/lib/receiptSanitizer.ts.
 */
export function sanitizeRawReceiptItems(
  items: RawReceiptItem[],
  currency: string
): ParsedReceiptItem[] {
  return items.map((item) => {
    const quantity = Math.max(1, item.quantity || 1);

    let totalLinePrice = item.totalLinePrice;
    let unitPrice = item.unitPrice;

    if (
      (totalLinePrice === undefined || totalLinePrice === null || totalLinePrice === 0) &&
      unitPrice > 0
    ) {
      totalLinePrice = unitPrice * quantity;
    }

    if (
      (unitPrice === undefined || unitPrice === null || unitPrice === 0) &&
      totalLinePrice > 0
    ) {
      unitPrice = totalLinePrice / quantity;
    }

    const calculatedTotal = unitPrice * quantity;
    const epsilon = 0.01;

    if (Math.abs(calculatedTotal - totalLinePrice) > epsilon) {
      unitPrice = totalLinePrice / quantity;
    }

    if (currency === 'PYG') {
      unitPrice = Math.round(unitPrice);
    }

    return { description: item.description, amount: unitPrice, quantity };
  });
}

/**
 * Defensive re-validation pass for items already sanitized by the backend.
 * Ensures quantity ≥ 1, amount is a valid positive number, and applies
 * currency-specific rounding (PYG = integers, others = 2 decimal places).
 */
export function sanitizeReceiptItems(
  items: ParsedReceiptItem[],
  currency: string
): ParsedReceiptItem[] {
  return items.map((item) => {
    const quantity = Math.max(1, item.quantity || 1);
    let amount = item.amount ?? 0;

    if (Number.isNaN(amount) || !Number.isFinite(amount) || amount < 0) {
      amount = 0;
    }

    if (currency === 'PYG') {
      amount = Math.round(amount);
    } else {
      amount = Math.round(amount * 100) / 100;
    }

    return { description: item.description, amount, quantity };
  });
}
