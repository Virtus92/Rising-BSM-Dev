/**
 * Export Service
 * Handles exporting data in various formats (CSV, Excel, PDF)
 */
const { format } = require('date-fns');
const Excel = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Generate an export file in the specified format
 * @param {Array} data - Array of objects to export
 * @param {string} formatType - Export format (csv, excel, pdf)
 * @param {object} options - Export options
 * @returns {object} - Export result with data, content type, and filename
 */
exports.generateExport = async (data, formatType, options) => {
  const { filename, title, columns, filters } = options;
  
  switch (formatType) {
    case 'csv':
      return generateCsvExport(data, columns, filename);
    case 'excel':
      return await generateExcelExport(data, columns, filename, title, filters);
    case 'pdf':
      return await generatePdfExport(data, columns, filename, title, filters);
    default:
      return {
        data: { 
          success: true, 
          message: 'Export format not supported', 
          format: formatType,
          count: data.length
        },
        contentType: 'application/json',
        filename: `${filename}.json`
      };
  }
};

/**
 * Generate pure CSV content from data and columns
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @returns {string} - CSV content as string
 */
exports.generateCSV = (data, columns) => {
  // Create header row
  const headerRow = columns.map(col => col.header).join(',');
  
  // Process data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Apply format function if provided
      if (col.format && typeof col.format === 'function') {
        value = col.format(value, row);
      }
      
      // Use default value if undefined
      if (value === undefined && col.default !== undefined) {
        value = col.default;
      }
      
      // Format for CSV output - matching test expectations
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes - for CSV standard
        return `"${value.replace(/"/g, '""')}"`;
      } else {
        return value;
      }
    }).join(',');
  });
  
  // Join all rows with newlines
  return `${headerRow}\n${rows.join('\n')}`;
};

/**
 * Generate CSV export
 */
function generateCsvExport(data, columns, filename) {
  // Use the utility function for CSV generation
  const csvContent = exports.generateCSV(data, columns);
  
  return {
    data: csvContent,
    contentType: 'text/csv',
    filename: `${filename}.csv`
  };
}

/**
 * Generate Excel export
 */
async function generateExcelExport(data, columns, filename, title, filters) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  // Define columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15
  }));
  
  // Add title and filter information
  worksheet.mergeCells('A1:C1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title || filename;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  
  let currentRow = 2;
  
  // Add filter information if provided
  if (filters) {
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const exportDateCell = worksheet.getCell(`A${currentRow}`);
    exportDateCell.value = `Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`;
    currentRow++;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const filterCell = worksheet.getCell(`A${currentRow}`);
        filterCell.value = `${key}: ${value}`;
        currentRow++;
      }
    });
    
    currentRow++;
  }
  
  // Set the header row
  const headerRow = worksheet.getRow(currentRow);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add data rows
  data.forEach(item => {
    const row = {};
    
    columns.forEach(column => {
      let value = item[column.key];
      
      // Apply format function if provided
      if (column.format && typeof column.format === 'function') {
        value = column.format(value);
      } else if (value === null || value === undefined) {
        value = column.default || '';
      }
      
      row[column.key] = value;
    });
    
    worksheet.addRow(row);
  });
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return {
    data: buffer,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `${filename}.xlsx`
  };
}

/**
 * Generate PDF export
 */
async function generatePdfExport(data, columns, filename, title, filters) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      // Collect PDF content into a buffer
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          data: buffer,
          contentType: 'application/pdf',
          filename: `${filename}.pdf`
        });
      });
      
      // Add title
      doc.fontSize(16).text(title || filename, { align: 'center' });
      doc.moveDown();
      
      // Add export time and filters
      doc.fontSize(10);
      doc.text(`Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.text(`${key}: ${value}`);
          }
        });
      }
      
      doc.moveDown();
      
      // Prepare table
      const tableTop = doc.y;
      // Calculate column widths based on the available space
      const tableWidth = 500; // Available width on the page
      const visibleColumns = columns.filter(col => !col.hidden);
      
      // Distribute width proportionally based on column width settings
      const totalDefinedWidth = visibleColumns.reduce((sum, col) => sum + (col.width || 10), 0);
      const columnWidths = visibleColumns.map(col => {
        return (col.width || 10) / totalDefinedWidth * tableWidth;
      });
      
      // Draw table headers
      doc.font('Helvetica-Bold');
      
      let currentX = 50;
      visibleColumns.forEach((column, i) => {
        doc.text(column.header, currentX, tableTop, { 
          width: columnWidths[i], 
          align: 'left' 
        });
        currentX += columnWidths[i];
      });
      
      // Draw separator line
      doc.moveDown()
         .strokeColor('#ccc')
         .lineWidth(0.5)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      // Switch to regular font for data
      doc.font('Helvetica').fontSize(8);
      
      // Draw rows
      data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }
        
        currentX = 50;
        
        // Process each column
        visibleColumns.forEach((column, i) => {
          let value = row[column.key];
          
          // Apply format function if provided
          if (column.format && typeof column.format === 'function') {
            value = column.format(value);
          } else if (value === null || value === undefined) {
            value = column.default || '';
          }
          
          // Truncate long strings
          if (typeof value === 'string' && value.length > 100) {
            value = value.substring(0, 97) + '...';
          }
          
          doc.text(String(value), currentX, doc.y, { 
            width: columnWidths[i], 
            align: 'left' 
          });
          
          currentX += columnWidths[i];
        });
        
        doc.moveDown();
        
        // Add zebra striping
        if (rowIndex % 2 === 1) {
          const rowHeight = 12; // Approximate height of a row
          doc.rect(50, doc.y - rowHeight, tableWidth, rowHeight)
             .fillOpacity(0.1)
             .fillAndStroke("#ddd", "#fff");
        }
      });
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}