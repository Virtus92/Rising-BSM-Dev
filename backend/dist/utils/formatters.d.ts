export declare const formatDateSafely: (date: string | Date | null | undefined, formatString: string, defaultValue?: string) => string;
export declare const formatRelativeTime: (date: string | Date | null | undefined, options?: Record<string, any>) => string;
export declare const formatDateWithLabel: (date: string | Date | null | undefined) => {
    label: string;
    fullDate?: string;
    class: string;
};
export declare const formatCurrency: (amount: number | null | undefined, currency?: string) => string;
export declare const formatNumber: (number: number | null | undefined, decimals?: number) => string;
export declare const formatPercentage: (value: number | null | undefined, decimals?: number) => string;
export declare const formatFileSize: (bytes: number | null | undefined) => string;
export declare const formatPhone: (number: string | null | undefined) => string;
