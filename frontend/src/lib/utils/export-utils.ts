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
   * Note: This is a simplified implementation. In a production environment,
   * you would likely use a more robust Excel library like exceljs or xlsx.
   */
  static async generateExcel(data: any[], sheetName: string = 'Data'): Promise<Buffer> {
    try {
      // Basic Excel XML format
      const xmlHeader = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      const ssHeader = '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
      const ssFooter = '</Workbook>';
      
      // Start worksheet
      let content = `${xmlHeader}${ssHeader}<Worksheet ss:Name="${sheetName}"><Table>`;
      
      // Add header row
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        content += '<Row>';
        for (const header of headers) {
          content += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
        }
        content += '</Row>';
        
        // Add data rows
        for (const row of data) {
          content += '<Row>';
          for (const header of headers) {
            const cellValue = row[header];
            if (typeof cellValue === 'number') {
              content += `<Cell><Data ss:Type="Number">${cellValue}</Data></Cell>`;
            } else if (cellValue instanceof Date) {
              content += `<Cell><Data ss:Type="DateTime">${cellValue.toISOString()}</Data></Cell>`;
            } else {
              content += `<Cell><Data ss:Type="String">${cellValue !== null && cellValue !== undefined ? String(cellValue).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</Data></Cell>`;
            }
          }
          content += '</Row>';
        }
      }
      
      // Close tags
      content += '</Table></Worksheet>' + ssFooter;
      
      return Buffer.from(content, 'utf-8');
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