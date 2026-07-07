import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('Data MIS for Dashboard 07.07.2026 New.xlsx');
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

const fyKey = workbook.SheetNames.find(s => s.toLowerCase().includes('fy target'));
if (!fyKey) {
  console.log('No FY Target sheet!');
  process.exit();
}

console.log('Found sheet:', fyKey);
const ws = workbook.Sheets[fyKey];
const raw2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

raw2D.forEach((row, i) => {
  if (row && row[2]) {
    const val = String(row[2]).toLowerCase();
    if (val.includes('old') || val.includes('project')) {
      console.log(`Row ${i}:`, row.slice(0, 15));
    }
  }
});
