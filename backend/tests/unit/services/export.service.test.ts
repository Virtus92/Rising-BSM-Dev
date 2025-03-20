import { generateExport } from '../../../services/export.service';
import Excel from 'exceljs';
import PDFDocument from 'pdfkit';
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
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data'))
      }
    }))
  };
});

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        // Call the end callback with a mock buffer
        setTimeout(() => callback(), 0);
      }
      return this;
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
  }));
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
      expect(result.data).toContain('1,"Test 1",$100');
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
      expect(Excel.Workbook).toHaveBeenCalled();
    });
    
    test('should generate PDF export', async () => {
      const result = await generateExport(testData, 'pdf', {
        filename: 'test-export',
        title: 'Test Export',
        columns
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('test-export.pdf');
      expect(PDFDocument).toHaveBeenCalled();
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
  });
});