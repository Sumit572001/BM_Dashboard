import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('Data MIS for Dashboard 01.07.2026.xlsx');
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

console.log('=== SHEET NAMES ===');
console.log(workbook.SheetNames.join(', '));

// Find sales sheet
const salesKey = workbook.SheetNames.find(s => s.toLowerCase().includes('sales'));
if (!salesKey) { console.log('No sales sheet!'); process.exit(); }

console.log('\n=== SALES SHEET KEY:', salesKey, '===');
const ws = workbook.Sheets[salesKey];
const raw2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

console.log('\nTotal rows:', raw2D.length);
console.log('\n--- FIRST 8 ROWS ---');
raw2D.slice(0, 8).forEach((row, i) => {
  const cells = (row || []).slice(0, 30).map((c, ci) => `[${ci}]=${c === null ? 'NULL' : JSON.stringify(c)}`);
  console.log(`Row ${i}:`, cells.join(' '));
});

// Find header row (row with "Project")
let headerRowIndex = -1;
for (let i = 0; i < raw2D.length; i++) {
  const row = raw2D[i];
  if (row && row[1] && String(row[1]).trim().toLowerCase().startsWith('project')) {
    const nextRow = raw2D[i + 1];
    const hasUnitsTarget = nextRow && nextRow.some(cell => cell && String(cell).toLowerCase().includes('units target'));
    headerRowIndex = hasUnitsTarget ? i + 1 : i;
    console.log('\n=== HEADER ROW INDEX:', headerRowIndex, '===');
    console.log('Month row (headerRowIndex-1):', (raw2D[headerRowIndex - 1] || []).slice(0, 40).map((c,ci) => `[${ci}]=${c === null ? 'NULL' : JSON.stringify(c)}`).join(' '));
    console.log('Type row (headerRowIndex):', (raw2D[headerRowIndex] || []).slice(0, 40).map((c,ci) => `[${ci}]=${c === null ? 'NULL' : JSON.stringify(c)}`).join(' '));
    break;
  }
}

if (headerRowIndex !== -1) {
  const monthRow = raw2D[headerRowIndex - 1] || [];
  const typeRow = raw2D[headerRowIndex] || [];
  
  // Build colMapping (same logic as dataHelpers)
  let currentMonth = '';
  const colMapping = [];
  for (let c = 2; c < typeRow.length; c++) {
    if (monthRow[c] !== null && monthRow[c] !== undefined && monthRow[c] !== '') {
      // Simulate formatExcelHeader
      const val = monthRow[c];
      if (typeof val === 'number') {
        const jsDate = new Date((val - 25569) * 86400 * 1000);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = monthNames[jsDate.getUTCMonth()];
        const y = String(jsDate.getUTCFullYear()).slice(-2);
        currentMonth = `${m}-${y}`;
      } else {
        currentMonth = String(val).trim();
      }
    }
    if (typeRow[c] !== null && typeRow[c] !== undefined && typeRow[c] !== '') {
      colMapping[c] = { month: currentMonth, type: String(typeRow[c]).trim().toLowerCase().replace(/\s+/g, ' ') };
    }
  }
  
  // Show col mapping for Jul columns
  console.log('\n=== COL MAPPING (Jul-26 columns) ===');
  colMapping.forEach((m, c) => {
    if (m && m.month && m.month.toLowerCase().includes('jul')) {
      console.log(`Col ${c}: month=${m.month} type=${m.type}`);
    }
  });
  
  console.log('\n=== ALL UNIQUE MONTHS IN COL MAPPING ===');
  const months = [...new Set(colMapping.filter(Boolean).map(m => m.month))];
  console.log(months.join(', '));
  
  // Show first data row
  const firstDataRow = raw2D[headerRowIndex + 1];
  if (firstDataRow) {
    console.log('\n=== FIRST DATA ROW ===');
    console.log('Project:', firstDataRow[1]);
    colMapping.forEach((m, c) => {
      if (m && m.month && m.month.toLowerCase().includes('jul')) {
        console.log(`  Jul col ${c} (${m.type}): value=${firstDataRow[c]}`);
      }
    });
  }
}
