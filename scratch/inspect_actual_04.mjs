import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('Data MIS for Dashboard 04.07.2026.xlsx');
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

console.log('=== SHEET NAMES ===');
console.log(workbook.SheetNames.join(', '));

const sheet1 = workbook.SheetNames[0];
console.log('\n=== FIRST SHEET:', sheet1, '===');
const ws = workbook.Sheets[sheet1];
const raw2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

console.log('\nTotal rows:', raw2D.length);

// Print the first 6 rows (all cells) to see the header structure
console.log('\n--- FIRST 6 ROWS ---');
for (let i = 0; i < Math.min(raw2D.length, 6); i++) {
  const row = raw2D[i] || [];
  const cells = row.map((c, ci) => `[${ci}]=${c === null ? 'NULL' : JSON.stringify(c)}`);
  console.log(`Row ${i}:`, cells.join(' | '));
}

// Print some data rows
console.log('\n--- DATA ROWS SAMPLE ---');
let count = 0;
for (let i = 0; i < raw2D.length; i++) {
  const row = raw2D[i] || [];
  if (row[2] && String(row[2]).toLowerCase().includes('nyati')) {
    console.log(`Row ${i}: [2]=${row[2]} [3]=${row[3]} [4]=${row[4]} [5]=${row[5]} [6]=${row[6]} [7]=${row[7]} [8]=${row[8]} [9]=${row[9]} [10]=${row[10]}`);
    count++;
    if (count > 5) break;
  }
}
