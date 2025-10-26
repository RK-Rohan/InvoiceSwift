
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  try {
    // Only format as currency if the code is valid (3 letters)
    if (currency && currency.length === 3) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    }
  } catch (e) {
    // If the currency code is invalid, fall through to basic number formatting
    console.warn(`Invalid currency code: ${currency}`);
  }
  
  // Fallback for invalid or missing currency codes
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
