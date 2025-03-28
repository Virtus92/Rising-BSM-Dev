/**
 * Utility class for exporting data to different formats
 */
export class ExportUtils {
  /**
   * Generate CSV file from data
   */
  static async generateCsv(data: any[]): Promise<Buffer> {
    try {
      // Create CSV header row
      const headers = Object.keys(data[0] || {});
      const headerRow = headers.join(',');
      
      // Create CSV data rows
      const rows = data.map(item => {
        return headers.map(header => {
          const value = item[header];
          // Handle special cases like strings with commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value !== null && value !== undefined ? value : '';
        }).join(',');
      });
      
      // Combine all rows
      const csv = [headerRow, ...rows].join('\n');
      
      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to generate CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate Excel file from data
   * 
   * Note: This is a placeholder. In a real implementation,
   * you would use a library like xlsx to generate an Excel file.
   */
  static async generateExcel(data: any[], sheetName: string = 'Data'): Promise<Buffer> {
    try {
      // For now, return CSV as a placeholder
      // In a real implementation, use xlsx or similar library
      return this.generateCsv(data);
    } catch (error) {
      throw new Error(`Failed to generate Excel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format data for export
   */
  static formatDataForExport(data: any[], fieldMappings: Record<string, string>): any[] {
    return data.map(item => {
      const formattedItem: Record<string, any> = {};
      
      for (const [srcField, destField] of Object.entries(fieldMappings)) {
        formattedItem[destField] = item[srcField];
      }
      
      return formattedItem;
    });
  }
}