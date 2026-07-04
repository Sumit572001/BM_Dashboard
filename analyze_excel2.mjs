// Script to deeply analyze the new Excel file structure
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filename = 'Data MIS for Dashboard 03.07.2026.xlsx';
const buf = readFileSync(filename);
const workbook = XLSX.read(new Uint8Array(buf), { type: 'array' });

console.log('=== SHEET NAMES ===');
workbook.SheetNames.forEach((s, i) => console.log(`  [${i}] "${s}"`));

// === Analyze FY Target sheet ===
const fyKey = workbook.SheetNames.find(s => s.toLowerCase().includes('fy target') || s.toLowerCase().includes('target'));
console.log('\n=== FY TARGET SHEET: "' + fyKey + '" ===');
if (fyKey) {
  const ws = workbook.Sheets[fyKey];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log('Total rows:', raw.length, '  Max cols:', Math.max(...raw.map(r => (r||[]).length)));
  
  // Print first 5 rows with column indices
  console.log('\n--- First 5 rows (cols 0-100) ---');
  raw.slice(0, 5).forEach((row, ri) => {
    const cells = [];
    for (let c = 0; c < Math.min((row||[]).length, 100); c++) {
      if (row[c] !== null && row[c] !== undefined && row[c] !== '') {
        cells.push(`[${c}]=${JSON.stringify(row[c])}`);
      }
    }
    console.log(`Row ${ri}: ${cells.join('  ')}`);
  });
  
  // Find first actual data row (project row)
  let firstDataRow = null;
  let firstDataIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;
    const cell2 = row[2] ? String(row[2]).trim() : '';
    if (cell2 && !['projects','total','grand total','status','type',''].includes(cell2.toLowerCase())) {
      firstDataRow = row;
      firstDataIdx = i;
      break;
    }
  }
  
  if (firstDataRow) {
    console.log('\n--- First data row index:', firstDataIdx, '---');
    console.log('col[0]:', firstDataRow[0], '  col[1]:', firstDataRow[1], '  col[2]:', firstDataRow[2]);
    console.log('All non-null cells:');
    for (let c = 0; c < firstDataRow.length; c++) {
      if (firstDataRow[c] !== null && firstDataRow[c] !== undefined) {
        console.log(`  col[${c}] = ${JSON.stringify(firstDataRow[c])}`);
      }
    }
    
    // Also show second data row
    const secondDataRow = raw[firstDataIdx + 1];
    if (secondDataRow) {
      const c2name = secondDataRow[2] ? String(secondDataRow[2]).trim() : '';
      if (c2name && !['total','grand total'].includes(c2name.toLowerCase())) {
        console.log('\n--- Second data row (project: ' + c2name + ') ---');
        for (let c = 0; c < secondDataRow.length; c++) {
          if (secondDataRow[c] !== null && secondDataRow[c] !== undefined) {
            console.log(`  col[${c}] = ${JSON.stringify(secondDataRow[c])}`);
          }
        }
      }
    }
  }
  
  // Show header rows (look for month labels)
  console.log('\n--- Looking for month header rows (cols 0-90) ---');
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const row = raw[i] || [];
    const hasMonth = row.some(c => c && /apr|may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar/i.test(String(c)));
    if (hasMonth) {
      console.log(`Row ${i} has months:`);
      for (let c = 0; c < Math.min(row.length, 100); c++) {
        if (row[c] !== null && row[c] !== undefined && row[c] !== '') {
          console.log(`  [${c}] = ${JSON.stringify(row[c])}`);
        }
      }
    }
  }
}

// === Analyze Sales & Collection sheet ===
const salesKey = workbook.SheetNames.find(s => s.toLowerCase().includes('sales'));
if (salesKey && salesKey !== fyKey) {
  console.log('\n\n=== SALES & COLLECTION SHEET: "' + salesKey + '" ===');
  const ws = workbook.Sheets[salesKey];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log('Total rows:', raw.length);
  console.log('\n--- First 6 rows ---');
  raw.slice(0, 6).forEach((row, ri) => {
    const cells = [];
    for (let c = 0; c < Math.min((row||[]).length, 30); c++) {
      if (row[c] !== null && row[c] !== undefined && row[c] !== '') {
        cells.push(`[${c}]=${JSON.stringify(row[c])}`);
      }
    }
    if (cells.length) console.log(`Row ${ri}: ${cells.join('  ')}`);
  });
}
