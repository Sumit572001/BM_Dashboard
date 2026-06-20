import * as XLSX from 'xlsx';

/**
 * Parses Excel file (.xlsx or .xls) into JSON object array
 * @param {File} file - Browser File object
 * @returns {Promise<Array>}
 */
export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // If there is only 1 sheet, just return it as a flat array or parsed structure
        if (workbook.SheetNames.length === 1) {
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          if (sheetName === 'Construction Budget' || sheetName === 'sheet1') {
            resolve({ [sheetName]: XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) });
          } else {
            resolve(XLSX.utils.sheet_to_json(worksheet, { defval: '' }));
          }
          return;
        }

        // Multiple sheets: return an object mapping sheet names to arrays
        const result = {};
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          if (sheetName === 'Construction Budget' || sheetName === 'sheet1') {
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          } else {
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          }
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
}
