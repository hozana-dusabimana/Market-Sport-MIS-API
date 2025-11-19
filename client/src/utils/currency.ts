/**
 * Currency formatting utility
 * All amounts are in RWF (Rwandan Francs)
 */

export const CURRENCY_SYMBOL = 'RWF'
export const CURRENCY_CODE = 'RWF'

/**
 * Format a number as currency with RWF symbol
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "RWF 1,000.00")
 */
export function formatCurrency(amount: number | string | null | undefined, decimals: number = 2): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0)
    if (isNaN(numAmount)) return `${CURRENCY_SYMBOL} 0.00`

    return `${CURRENCY_SYMBOL} ${numAmount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * Format a number as currency with RWF symbol (compact version)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "RWF 1,000.00")
 */
export function formatCurrencyCompact(amount: number | string | null | undefined, decimals: number = 2): string {
    return formatCurrency(amount, decimals)
}

