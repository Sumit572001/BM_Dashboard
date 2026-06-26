import XLSX from 'xlsx';

const workbook = XLSX.readFile('MIS 24-25 - Mar25_Export (2) - sales section updated.xlsx');

const getNames = (sheetName, is2D = false, nameColIdx = 1) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: is2D ? 1 : undefined });
  const names = new Set();
  if (is2D) {
    let headerFound = false;
    rows.forEach(row => {
      if (row && row[nameColIdx]) {
        const val = row[nameColIdx].toString().trim();
        if (val.toLowerCase().startsWith('project')) {
          headerFound = true;
          return;
        }
        if (headerFound && val && !val.toLowerCase().includes('total') && !val.toLowerCase().includes('grand')) {
          names.add(val);
        }
      }
    });
  } else {
    rows.forEach(row => {
      const candidates = ['project name', 'project', 'projects'];
      for (const k of Object.keys(row)) {
        if (candidates.some(c => k.toLowerCase().trim() === c)) {
          const val = row[k]?.toString().trim();
          if (val && !val.toLowerCase().includes('total') && !val.toLowerCase().includes('grand')) {
            names.add(val);
          }
        }
      }
    });
  }
  return Array.from(names);
};

const sales = getNames('Sales', true, 1);
const outstanding = getNames('Outstanding & Collection', false);
const portfolio = getNames('Project Portfolio Details', false);

// Construction Budget 2D parsing
const construction = [];
const constSheet = workbook.Sheets['Construction Budget'];
if (constSheet) {
  const rows = XLSX.utils.sheet_to_json(constSheet, { header: 1 });
  let headerFound = false;
  rows.forEach(row => {
    if (row && row[0]) {
      const val = row[0].toString().trim();
      if (val.toLowerCase().startsWith('project')) {
        headerFound = true;
        return;
      }
      if (headerFound && val && !val.toLowerCase().includes('total') && !val.toLowerCase().includes('grand') && !val.toLowerCase().includes('real estate')) {
        construction.push(val);
      }
    }
  });
}

console.log('=== SALES NAMES ===');
console.log(sales.sort());

console.log('\n=== OUTSTANDING NAMES ===');
console.log(outstanding.sort());

console.log('\n=== PORTFOLIO NAMES ===');
console.log(portfolio.sort());

console.log('\n=== CONSTRUCTION NAMES ===');
console.log(construction.sort());
