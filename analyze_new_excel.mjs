import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const buf = readFileSync('Data MIS for Dashboard 03.07.2026.xlsx');
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

console.log('=== SHEET NAMES ===');
console.log(workbook.SheetNames.join(', '));

// Find FY Target sheet
const fyKey = workbook.SheetNames.find(s => s.toLowerCase().includes('fy target'));
if (!fyKey) { console.log('No FY Target sheet!'); process.exit(); }

console.log('\n=== FY TARGET SHEET KEY:', fyKey, '===');
const ws = workbook.Sheets[fyKey];
const raw2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

console.log('\nTotal rows:', raw2D.length);
console.log('\n--- FIRST 10 ROWS (first 100 cols) ---');
raw2D.slice(0, 10).forEach((row, i) => {
  const cells = (row || []).slice(0, 100).map((c, ci) => `[${ci}]=${c === null ? 'NULL' : JSON.stringify(c)}`);
  console.log(`Row ${i}:`, cells.join(' '));
});

// Find the header rows to understand structure
console.log('\n\n--- ROW LENGTHS ---');
raw2D.slice(0, 10).forEach((row, i) => {
  console.log(`Row ${i} length: ${(row || []).length}`);
});

// Look for rows with "Projects" or "Status" label to identify column structure
let headerRow = -1;
for (let i = 0; i < raw2D.length; i++) {
  const row = raw2D[i] || [];
  const firstCells = row.slice(0, 5).map(c => c ? String(c).toLowerCase() : '');
  if (firstCells.some(c => c.includes('status') || c.includes('projects') || c.includes('type'))) {
    console.log(`\nPossible header row at index ${i}:`, row.slice(0, 10));
    headerRow = i;
  }
}

// Show the first actual data row
console.log('\n--- FIRST DATA ROW (after headers) ---');
for (let i = 0; i < Math.min(raw2D.length, 15); i++) {
  const row = raw2D[i] || [];
  if (row[2] && String(row[2]).toLowerCase().includes('nyati')) {
    console.log(`\nFirst project row at index ${i}:`);
    console.log('  Row[0] (status):', row[0]);
    console.log('  Row[1] (type):', row[1]);
    console.log('  Row[2] (name):', row[2]);
    console.log('  Row[3-20]:', row.slice(3, 21));
    console.log('  Row length:', row.length);
    break;
  }
}

// Check offsets: current code uses [3, 15, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81]
// Let's see what's at these offsets for first data project row
console.log('\n--- CHECKING OFFSETS for first project row ---');
const offsets = [3, 15, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81];
const months = ['Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'];

for (let i = 0; i < raw2D.length; i++) {
  const row = raw2D[i] || [];
  if (row[2] && String(row[2]).toLowerCase().includes('nyati')) {
    console.log(`\nProject: ${row[2]} (row ${i})`);
    offsets.forEach((start, idx) => {
      console.log(`  ${months[idx]} (start=${start}): [${start}]=${JSON.stringify(row[start])}, [${start+1}]=${JSON.stringify(row[start+1])}, [${start+2}]=${JSON.stringify(row[start+2])}, [${start+3}]=${JSON.stringify(row[start+3])}, [${start+4}]=${JSON.stringify(row[start+4])}, [${start+5}]=${JSON.stringify(row[start+5])}, [${start+6}]=${JSON.stringify(row[start+6])}, [${start+7}]=${JSON.stringify(row[start+7])}, [${start+8}]=${JSON.stringify(row[start+8])}, [${start+9}]=${JSON.stringify(row[start+9])}, [${start+10}]=${JSON.stringify(row[start+10])}, [${start+11}]=${JSON.stringify(row[start+11])}`);
    });
    break;
  }
}

// Show full header row to understand column labels
console.log('\n--- HEADER ROWS (0-5), ALL COLUMNS ---');
for (let i = 0; i < Math.min(raw2D.length, 6); i++) {
  const row = raw2D[i] || [];
  const nonNull = [];
  row.forEach((c, ci) => {
    if (c !== null && c !== undefined && c !== '') {
      nonNull.push(`[${ci}]=${JSON.stringify(c)}`);
    }
  });
  console.log(`Row ${i}:`, nonNull.join(' | '));
}

// Show ALL rows to understand project structure
console.log('\n--- ALL PROJECT ROWS (column 2) ---');
raw2D.forEach((row, i) => {
  if (row && row[2]) {
    console.log(`Row ${i}: [0]=${JSON.stringify(row[0])} [1]=${JSON.stringify(row[1])} [2]=${JSON.stringify(row[2])}`);
  }
});
