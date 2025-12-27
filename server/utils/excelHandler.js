const ExcelJS = require('exceljs');

/**
 * Generates an Excel file buffer from data
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions { header: 'Name', key: 'name', width: 20 }
 * @param {String} sheetName - Name of the worksheet
 * @returns {Promise<Buffer>}
 */
exports.generateExcel = async (data, columns, sheetName = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    // Add rows
    worksheet.addRows(data);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    return await workbook.xlsx.writeBuffer();
};

/**
 * Parses an Excel file buffer into an array of objects
 * @param {Buffer} buffer - File buffer
 * @param {Object} columnMapping - Mapping from Excel header to object key { 'Name En': 'name_en' }
 * @returns {Promise<Array>}
 */
exports.parseExcel = async (buffer, columnMapping) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return [];

    const records = [];
    const headers = {};

    // Read header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        const headerText = cell.value ? cell.value.toString().trim() : '';
        // Find matching key in mapping (case-insensitive if needed, but direct map here)
        // We reverse map: if Excel header is "Product Name" and mapping has "Product Name": "pName", we store colNumber -> "pName"
        if (columnMapping[headerText]) {
            headers[colNumber] = columnMapping[headerText];
        }
    });

    // Read data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const record = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
            const key = headers[colNumber];
            if (key) {
                let cellValue = cell.value;
                // Handle Hyperlink object { text, hyperlink }
                if (cellValue && typeof cellValue === 'object' && cellValue.text) {
                    cellValue = cellValue.text;
                }
                record[key] = cellValue;
                hasData = true;
            }
        });

        if (hasData) {
            records.push(record);
        }
    });

    return records;
};
