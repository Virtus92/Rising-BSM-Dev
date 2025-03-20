export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';
export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
    hidden?: boolean;
    format?: (value: any, row?: any) => any;
    default?: any;
}
export interface ExportOptions {
    filename: string;
    title?: string;
    columns: ExportColumn[];
    filters?: Record<string, any>;
}
export interface ExportResult {
    data: any;
    contentType: string;
    filename: string;
    format?: ExportFormat;
    buffer?: Buffer;
}
export declare const generateExport: (data: Record<string, any>[], formatType: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
export declare const exportService: {
    generateExport: (data: Record<string, any>[], formatType: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
};
export default exportService;
