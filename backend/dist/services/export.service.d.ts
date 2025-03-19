/**
 * Format types supported for export
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';
/**
 * Column definition for export
 */
export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
    hidden?: boolean;
    format?: (value: any, row?: any) => any;
    default?: any;
}
/**
 * Options for export generation
 */
export interface ExportOptions {
    filename: string;
    title?: string;
    columns: ExportColumn[];
    filters?: Record<string, any>;
}
/**
 * Result of export generation
 */
export interface ExportResult {
    data: any;
    contentType: string;
    filename: string;
    format?: ExportFormat;
    buffer?: Buffer;
}
/**
 * Generate an export file in the specified format
 * @param data Array of objects to export
 * @param formatType Export format (csv, excel, pdf)
 * @param options Export options
 * @returns Export result with data, content type, and filename
 */
export declare const generateExport: (data: Record<string, any>[], formatType: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
export declare const exportService: {
    generateExport: (data: Record<string, any>[], formatType: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
};
export default exportService;
