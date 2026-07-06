import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, '../public/Data MIS for Dashboard 04.07.2026.xlsx');

console.log('Reading file:', filePath);

const fileBuffer = readFileSync(filePath);
const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: 'array' });

console.log('\nSheet names:', workbook.SheetNames);

// Find Ageing Jun sheet
const ageingSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('ageing'));
if (!ageingSheetName) {
  console.log('No Ageing sheet found!');
  process.exit(1);
}

console.log('\nUsing sheet:', ageingSheetName);

const ws = workbook.Sheets[ageingSheetName];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

console.log('\nTotal rows:', rows.length);
if (rows.length > 0) {
  console.log('\nColumn names (keys of first row):');
  console.log(JSON.stringify(Object.keys(rows[0]), null, 2));
  console.log('\nSample Row 0:', JSON.stringify(rows[0], null, 2));
  console.log('\nSample Row 1:', JSON.stringify(rows[1], null, 2));
}

// Count unique status values and their outstanding sums
const statusMap = {};
let totalOS = 0;

rows.forEach((row, idx) => {
  // Find Status / Regis Status key
  const statusKey = Object.keys(row).find(k => 
    ['status', 'regis status', 'registration status', 'regis. status'].includes(
      k.trim().replace(/\s+/g, ' ').toLowerCase()
    )
  );
  const statusVal = statusKey ? String(row[statusKey]).trim() : '(none)';

  // Find Total Outstanding key
  const osKey = Object.keys(row).find(k =>
    k.trim().replace(/\s+/g, ' ').toLowerCase() === 'total outstanding'
  );
  let osVal = 0;
  if (osKey && row[osKey] !== '' && row[osKey] !== null) {
    const clean = row[osKey].toString().replace(/,/g, '').replace(/[₹%]/g, '').trim();
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) osVal = parsed;
  }

  if (!statusMap[statusVal]) statusMap[statusVal] = { count: 0, sum: 0 };
  statusMap[statusVal].count++;
  statusMap[statusVal].sum += osVal;
  totalOS += osVal;
});

console.log('\n=== STATUS BREAKDOWN ===');
Object.entries(statusMap).forEach(([status, data]) => {
  console.log(`"${status}": count=${data.count}, sum=${data.sum} (${(data.sum/10000000).toFixed(4)} Cr)`);
});

console.log('\n=== TOTALS ===');
console.log('Total Outstanding (Raw):', totalOS);
console.log('Total Outstanding (Cr):', (totalOS / 10000000).toFixed(4));

const regTotal = Object.entries(statusMap)
  .filter(([s]) => s.toLowerCase() === 'registered')
  .reduce((sum, [, d]) => sum + d.sum, 0);
const unregTotal = Object.entries(statusMap)
  .filter(([s]) => s.toLowerCase() !== 'registered' && s !== '(none)')
  .reduce((sum, [, d]) => sum + d.sum, 0);

console.log('Registered (Cr):', (regTotal / 10000000).toFixed(4));
console.log('Unregistered (Cr):', (unregTotal / 10000000).toFixed(4));
