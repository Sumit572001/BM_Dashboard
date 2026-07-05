import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('Data MIS for Dashboard 03.07.2026.xlsx');
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

console.log('Sheet Names:', workbook.SheetNames);

const ageingKeys = workbook.SheetNames.filter(s => s.toLowerCase().includes('ageing'));
console.log('Ageing Sheets:', ageingKeys);

for (const key of ageingKeys) {
  console.log(`\n=== SHEET: ${key} ===`);
  const ws = workbook.Sheets[key];
  const raw2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log('Total Rows:', raw2D.length);
  if (raw2D.length > 0) {
    console.log('Row 0:', raw2D[0].slice(0, 15));
    if (raw2D.length > 1) console.log('Row 1:', raw2D[1].slice(0, 15));
    if (raw2D.length > 2) console.log('Row 2:', raw2D[2].slice(0, 15));
    if (raw2D.length > 3) console.log('Row 3:', raw2D[3].slice(0, 15));
    
    // Find unique values of column index 0, 1, 2 etc. to understand what columns represent
    const colSet = {};
    raw2D.slice(1).forEach(row => {
      if (!row) return;
      for (let i = 0; i < Math.min(row.length, 12); i++) {
        if (!colSet[i]) colSet[i] = new Set();
        colSet[i].add(row[i]);
      }
    });

    console.log('Unique values/types in columns:');
    Object.keys(colSet).forEach(colIdx => {
      const vals = [...colSet[colIdx]].filter(v => v !== null && v !== undefined && v !== '');
      console.log(`  Col ${colIdx}: count=${vals.length}, sample=${JSON.stringify(vals.slice(0, 5))}`);
    });
  }
}
