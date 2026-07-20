import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrimaryCurrency(amount: number, currencySymbol: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // This is a placeholder, the symbol is what matters
    currencyDisplay: 'symbol',
  })
    .format(amount)
    .replace('$', currencySymbol);
}
