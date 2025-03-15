const { generateExport } = require('../../services/export.service');
const Excel = require('exceljs');
const PDFDocument = require('pdfkit');

// Mock dependencies
jest.mock('exceljs', () => {
  const mockWorksheet = {
    columns: [],
    mergeCells: jest.fn(),
    getCell: jest.fn().mockReturnValue({
      value: '',
      font: {},
      alignment: {},
      fill: {}
    }),
    getRow: jest.fn().mockReturnValue({
      font: {},
      fill: {}
    }),
    addRow: jest.fn()
  };

  const mockWorkbook = {
    addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data'))
    }
  };

  return {
    Workbook: jest.fn().mockReturnValue(mockWorkbook)
  };
});

jest.mock('pdfkit', () => {
  const mockDocument = {
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        setTimeout(() => callback(), 0); // Simulate async completion
      }
      return mockDocument;
    }),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fillOpacity: jest.fn().mockReturnThis(),
    fillAndStroke: jest.fn().mockReturnThis(),
    end: jest.fn()
  };
  
  return jest.fn().mockReturnValue(mockDocument);
});

describe('Export Service', () => {
  const mockData = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 }
  ];

  const mockColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'value', header: 'Value', format: (val) => `${val}€` }
  ];

  const mockOptions = {
    filename: 'test-export',
    title: 'Test Export',
    columns: mockColumns,
    filters: { status: 'active', date: '2023-01-01' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateExport', () => {
    test('should generate CSV export', async () => {
      // Act
      const result = await generateExport(mockData, 'csv', mockOptions);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toBe('test-export.csv');
      expect(result.data).toContain('ID,Name,Value');
      expect(result.data).toContain('1,"Test 1",100€');
      expect(result.data).toContain('2,"Test 2",200€');
    });

    test('should generate Excel export', async () => {
      // Act
      const result = await generateExport(mockData, 'excel', mockOptions);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.filename).toBe('test-export.xlsx');
      
      // Verify Excel generation
      expect(Excel.Workbook).toHaveBeenCalled();
      const workbook = Excel.Workbook.mock.results[0].value;
      expect(workbook.addWorksheet).toHaveBeenCalledWith('Data');
      expect(workbook.xlsx.writeBuffer).toHaveBeenCalled();
    });

    test('should generate PDF export', async () => {
      // Act
      const result = await generateExport(mockData, 'pdf', mockOptions);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('test-export.pdf');
      
      // Verify PDF generation
      expect(PDFDocument).toHaveBeenCalled();
      const pdfDoc = PDFDocument.mock.results[0].value;
      expect(pdfDoc.text).toHaveBeenCalledWith('Test Export', { align: 'center' });
      expect(pdfDoc.end).toHaveBeenCalled();
    });

    test('should handle unsupported format', async () => {
      // Act
      const result = await generateExport(mockData, 'unknown', mockOptions);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('application/json');
      expect(result.data).toEqual({
        success: true,
        message: 'Export format not supported',
        format: 'unknown',
        count: 2
      });
    });

    test('should apply format functions to column values', async () => {
      // Arrange
      const customColumns = [
        { key: 'id', header: 'ID' },
        { 
          key: 'value', 
          header: 'Formatted Value',
          format: (val) => `€${val.toFixed(2)}`
        }
      ];

      const options = {
        ...mockOptions,
        columns: customColumns
      };

      // Act
      const result = await generateExport(mockData, 'csv', options);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('text/csv');
      expect(result.data).toContain('ID,Formatted Value');
      expect(result.data).toContain('1,€100.00');
      expect(result.data).toContain('2,€200.00');
    });
    
    test('should handle null and undefined values with format functions', async () => {
      // Arrange
      const dataWithNull = [
        { id: 1, value: null },
        { id: 2, value: undefined }
      ];
      
      const columnsWithFormat = [
        { key: 'id', header: 'ID' },
        { 
          key: 'value', 
          header: 'Value',
          format: (val) => val ? `${val}€` : 'N/A'
        }
      ];

      const options = {
        ...mockOptions,
        columns: columnsWithFormat
      };

      // Act
      const result = await generateExport(dataWithNull, 'csv', options);

      // Assert
      expect(result.data).toContain('1,"N/A"');
      expect(result.data).toContain('2,"N/A"');
    });
  });
});
