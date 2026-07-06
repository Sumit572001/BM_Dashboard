const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const filePath = path.resolve(__dirname, '../Data MIS for Dashboard 04.07.2026.xlsx');
console.log('Reading:', filePath);

const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: 'array' });

console.log('Sheet names:', workbook.SheetNames);

// Find Ageing Jun
const ageingSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('ageing'));
console.log('Ageing sheet found:', ageingSheetName);

const ws = workbook.Sheets[ageingSheetName];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

console.log('Total rows:', rows.length);
if (rows.length > 0) {
  console.log('Keys:', Object.keys(rows[0]));
  console.log('Row 0:', JSON.stringify(rows[0]));
  console.log('Row 1:', JSON.stringify(rows[1]));
  console.log('Row 2:', JSON.stringify(rows[2]));
}

const statusMap = {};
let totalOS = 0;

rows.forEach(row => {
  const statusKey = Object.keys(row).find(k =>
    ['status', 'regis status', 'registration status', 'regis. status'].includes(k.trim().replace(/\s+/g, ' ').toLowerCase())
  );
  const statusVal = statusKey ? String(row[statusKey]).trim() : '(none)';

  const osKey = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === 'total outstanding');
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

console.log('\nSTATUS BREAKDOWN:');
Object.entries(statusMap).forEach(([s, d]) => {
  console.log(`"${s}": count=${d.count}, sum=${d.sum} (${(d.sum/10000000).toFixed(4)} Cr)`);
});
console.log('\nTotal OS:', totalOS, '=', (totalOS/10000000).toFixed(4), 'Cr');

const regTotal = (statusMap['Registered'] || statusMap['registered'] || {sum:0}).sum + 
                 (statusMap['REGISTERED'] || {sum:0}).sum;
const unregTotal = totalOS - regTotal;
console.log('Registered:', regTotal, '=', (regTotal/10000000).toFixed(4), 'Cr');
console.log('Unregistered:', unregTotal, '=', (unregTotal/10000000).toFixed(4), 'Cr');
