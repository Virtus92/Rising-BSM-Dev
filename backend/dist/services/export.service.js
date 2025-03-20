"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = exports.generateExport = void 0;
const date_fns_1 = require("date-fns");
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateExport = async (data, formatType, options) => {
    const { filename, title, columns, filters } = options;
    switch (formatType) {
        case 'csv':
            return generateCsvExport(data, columns, filename);
        case 'xlsx':
            return await generateExcelExport(data, columns, filename, title, filters);
        case 'pdf':
            return await generatePdfExport(data, columns, filename, title, filters);
        case 'json':
        default:
            return {
                data: {
                    data,
                    success: true,
                    message: formatType === 'json' ? 'Export successful' : 'Export format not supported',
                    format: formatType,
                    count: data.length
                },
                contentType: 'application/json',
                filename: `${filename}.json`
            };
    }
};
exports.generateExport = generateExport;
function generateCsvExport(data, columns, filename) {
    const headers = columns.map(col => col.header);
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
        const values = columns.map(column => {
            let value = row[column.key];
            if (column.format && typeof column.format === 'function') {
                value = column.format(value, row);
            }
            else if (value === null || value === undefined) {
                value = column.default || '';
            }
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    return {
        data: csvContent,
        contentType: 'text/csv',
        filename: `${filename}.csv`
    };
}
async function generateExcelExport(data, columns, filename, title, filters) {
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 15
    }));
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title || filename;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    let currentRow = 2;
    if (filters) {
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const exportDateCell = worksheet.getCell(`A${currentRow}`);
        exportDateCell.value = `Exportiert am: ${(0, date_fns_1.format)(new Date(), 'dd.MM.yyyy HH:mm')}`;
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
    const headerRow = worksheet.getRow(currentRow);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    data.forEach(item => {
        const row = {};
        columns.forEach(column => {
            let value = item[column.key];
            if (column.format && typeof column.format === 'function') {
                value = column.format(value, item);
            }
            else if (value === null || value === undefined) {
                value = column.default || '';
            }
            row[column.key] = value;
        });
        worksheet.addRow(row);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return {
        data: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${filename}.xlsx`,
        buffer: buffer
    };
}
async function generatePdfExport(data, columns, filename, title, filters) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                size: 'A4'
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    data: buffer,
                    contentType: 'application/pdf',
                    filename: `${filename}.pdf`,
                    buffer
                });
            });
            doc.fontSize(16).text(title || filename, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10);
            doc.text(`Exportiert am: ${(0, date_fns_1.format)(new Date(), 'dd.MM.yyyy HH:mm')}`);
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) {
                        doc.text(`${key}: ${value}`);
                    }
                });
            }
            doc.moveDown();
            const tableTop = doc.y;
            const tableWidth = 500;
            const visibleColumns = columns.filter(col => !col.hidden);
            const totalDefinedWidth = visibleColumns.reduce((sum, col) => sum + (col.width || 10), 0);
            const columnWidths = visibleColumns.map(col => {
                return (col.width || 10) / totalDefinedWidth * tableWidth;
            });
            try {
                doc.font('Helvetica-Bold');
            }
            catch (error) {
                console.error("Error setting font:", error);
            }
            let currentX = 50;
            visibleColumns.forEach((column, i) => {
                doc.text(column.header, currentX, tableTop, {
                    width: columnWidths[i],
                    align: 'left'
                });
                currentX += columnWidths[i];
            });
            try {
                doc.moveDown()
                    .strokeColor('#ccc')
                    .lineWidth(0.5)
                    .moveTo(50, doc.y)
                    .lineTo(550, doc.y)
                    .stroke();
            }
            catch (error) {
                console.error("Error drawing separator line:", error);
            }
            doc.font('Helvetica').fontSize(8);
            data.forEach((row, rowIndex) => {
                if (doc.y > 700) {
                    doc.addPage();
                    doc.y = 50;
                }
                currentX = 50;
                visibleColumns.forEach((column, i) => {
                    let value = row[column.key];
                    if (column.format && typeof column.format === 'function') {
                        value = column.format(value, row);
                    }
                    else if (value === null || value === undefined) {
                        value = column.default || '';
                    }
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
                if (rowIndex % 2 === 1) {
                    const rowHeight = 12;
                    doc.rect(50, doc.y - rowHeight, tableWidth, rowHeight)
                        .fillOpacity(0.1)
                        .fillAndStroke("#ddd", "#fff");
                }
            });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.exportService = {
    generateExport: exports.generateExport
};
exports.default = exports.exportService;
//# sourceMappingURL=export.service.js.map