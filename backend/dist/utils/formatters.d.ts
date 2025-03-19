/**
 * Format a date safely to a specific format
 * @param date The date to format
 * @param formatString Format string for date-fns
 * @param defaultValue Value to return if date is invalid
 * @returns Formatted date or default value
 */
export declare const formatDateSafely: (date: string | Date | null | undefined, formatString: string, defaultValue?: string) => string;
/**
 * Format a date as a relative time string
 * @param date The date to format
 * @param options Options for formatDistanceToNow
 * @returns Relative time string
 */
export declare const formatRelativeTime: (date: string | Date | null | undefined, options?: Record<string, any>) => string;
/**
 * Format a date with a special label for today/tomorrow
 * @param date The date to format
 * @returns Date information with label and class
 */
export declare const formatDateWithLabel: (date: string | Date | null | undefined) => {
    label: string;
    fullDate?: string;
    class: string;
};
/**
 * Format a currency amount
 * @param amount The amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export declare const formatCurrency: (amount: number | null | undefined, currency?: string) => string;
/**
 * Format a number with thousand separators
 * @param number The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number
 */
export declare const formatNumber: (number: number | null | undefined, decimals?: number) => string;
/**
 * Format a percentage
 * @param value Value to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage
 */
export declare const formatPercentage: (value: number | null | undefined, decimals?: number) => string;
/**
 * Format a file size
 * @param bytes Size in bytes
 * @returns Formatted file size
 */
export declare const formatFileSize: (bytes: number | null | undefined) => string;
/**
 * Format a phone number
 * @param number Phone number to format
 * @returns Formatted phone number
 */
export declare const formatPhone: (number: string | null | undefined) => string;
