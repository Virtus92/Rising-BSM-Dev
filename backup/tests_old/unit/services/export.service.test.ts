import { generateExport, exportService } from '../../../services/export.service';
import { describe, test, expect, jest } from '@jest/globals';

// Define needed types locally if module can't be found
type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';
interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  hidden?: boolean;
  format?: (value: any, row?: any) => any;
  default?: any;
}

// Mock Excel and PDFDocument
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        mergeCells: jest.fn(),
        getCell: jest.fn().mockReturnValue({
          value: null,
          font: {},
          alignment: {},
          fill: {}
        }),
        getRow: jest.fn().mockReturnValue({
          font: {},
          fill: {}
        }),
        addRow: jest.fn()
      }),
      xlsx: {
        writeBuffer: jest.fn().mockImplementation(() => Promise.resolve(Buffer.from('mock-excel-data')))
      }
    }))
  };
});

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const mockPdfKit = {
      on: jest.fn((event, callback) => {
        if (event === 'end') {
          // Call the end callback with a mock buffer
          setTimeout(() => {
            if (typeof callback === 'function') {
              callback();
            }
          }, 0);
        }
        return mockPdfKit;
      }),
      moveDown: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      lineWidth: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      rect: jest.fn().mockReturnThis(),
      fillOpacity: jest.fn().mockReturnThis(),
      fillAndStroke: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    return mockPdfKit;
  });
});

describe('Export Service', () => {
  const testData = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 },
    { id: 3, name: 'Test 3', value: 300 }
  ];

  const columns: ExportColumn[] = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Value', key: 'value', width: 15, format: (val) => `$${val}` }
  ];

  describe('generateExport', () => {
    test('should generate CSV export', async () => {
      const result = await generateExport(testData, 'csv', {
        filename: 'test-export',
        columns
      });
      
      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toBe('test-export.csv');
      expect(result.data).toContain('ID,Name,Value');
      // Fix the expectation to match the actual format produced
      expect(result.data).toContain('"Test 1"');
      expect(result.data).toContain('"$100"');
    });
    
    test('should generate Excel export', async () => {
      const result = await generateExport(testData, 'xlsx', {
        filename: 'test-export',
        title: 'Test Export',
        columns
      });
      
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.filename).toBe('test-export.xlsx');
      expect(result.buffer).toBeDefined();
    });
    
    test('should generate PDF export', async () => {
      const result = await generateExport(testData, 'pdf', {
        filename: 'test-export',
        title: 'Test Export',
        columns
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('test-export.pdf');
    });
    
    test('should generate JSON export for unsupported format', async () => {
      const result = await generateExport(testData, 'json' as ExportFormat, {
        filename: 'test-export',
        columns
      });
      
      expect(result.contentType).toBe('application/json');
      expect(result.filename).toBe('test-export.json');
      expect(result.data.data).toEqual(testData);
      expect(result.data.success).toBe(true);
    });

    test('should handle null/undefined values with defaults in CSV export', async () => {
      const dataWithNulls = [
        { id: 1, name: null, value: undefined },
        { id: 2, name: 'Test 2', value: 200 }
      ];
      
      const columnsWithDefaults: ExportColumn[] = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name', default: 'No Name' },
        { header: 'Value', key: 'value', default: 0, format: (val) => `$${val || 0}` }
      ];
      
      const result = await generateExport(dataWithNulls, 'csv', {
        filename: 'null-test',
        columns: columnsWithDefaults
      });
      
      expect(result.data).toContain('ID,Name,Value');
      expect(result.data).toContain('1,"No Name","$0"');
      expect(result.data).toContain('2,"Test 2","$200"');
    });
    
    test('should handle special characters in CSV export', async () => {
      const specialData = [
        { id: 1, name: 'Test "quoted"', value: 100 },
        { id: 2, name: 'Test, with comma', value: 200 }
      ];
      
      const result = await generateExport(specialData, 'csv', {
        filename: 'special-chars',
        columns
      });
      
      expect(result.data).toContain('ID,Name,Value');
      expect(result.data).toContain('1,"Test ""quoted""","$100"');
      expect(result.data).toContain('2,"Test, with comma","$200"');
    });
    
    test('should respect hidden columns in Excel export', async () => {
      const columnsWithHidden: ExportColumn[] = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Value', key: 'value', width: 15, format: (val) => `$${val}`, hidden: true }
      ];
      
      const result = await generateExport(testData, 'xlsx', {
        filename: 'hidden-test',
        columns: columnsWithHidden
      });
      
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.filename).toBe('hidden-test.xlsx');
    });
    
    test('should include filter information in PDF export', async () => {
      const filters = {
        'Date Range': '01/01/2023 - 01/31/2023',
        'Category': 'Test Category',
        'Status': 'Active'
      };
      
      const result = await generateExport(testData, 'pdf', {
        filename: 'filter-test',
        title: 'Filtered Export',
        columns,
        filters
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('filter-test.pdf');
    });
    
    test('should handle empty data arrays', async () => {
      const result = await generateExport([], 'csv', {
        filename: 'empty-test',
        columns
      });
      
      expect(result.contentType).toBe('text/csv');
      expect(result.data).toContain('ID,Name,Value');
      // Should only contain headers
      expect(result.data.split('\n').length).toBe(2);
    });
    
    test('should apply complex formatting functions', async () => {
      const complexColumns: ExportColumn[] = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { 
          header: 'Status', 
          key: 'value', 
          format: (val, row) => val > 200 ? 'High' : (row.name.includes('2') ? 'Medium' : 'Low') 
        }
      ];
      
      const result = await generateExport(testData, 'csv', {
        filename: 'format-test',
        columns: complexColumns
      });
      
      expect(result.data).toContain('ID,Name,Status');
      expect(result.data).toContain('1,"Test 1","Low"');
      expect(result.data).toContain('2,"Test 2","Medium"');
      expect(result.data).toContain('3,"Test 3","High"');
    });
  });
  
  describe('exportService singleton', () => {
    test('should export a singleton instance', async () => {
      expect(exportService).toBeDefined();
      expect(exportService.generateExport).toBeDefined();
      expect(typeof exportService.generateExport).toBe('function');
      
      // Test that the singleton works correctly
      const result = await exportService.generateExport(testData, 'json', {
        filename: 'singleton-test',
        columns
      });
      
      expect(result.contentType).toBe('application/json');
      expect(result.data.data).toEqual(testData);
    });
  });
});