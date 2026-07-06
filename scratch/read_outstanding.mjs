import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filename = 'Data MIS for Dashboard 04.07.2026.xlsx';
const buf = readFileSync(filename);
const data = new Uint8Array(buf);
const workbook = XLSX.read(data, { type: 'array' });

console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('ageing jun'));
if (!sheetName) {
  console.error('Ageing Jun sheet not found!');
  process.exit(1);
}

console.log('Selected sheet:', sheetName);
const ws = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(ws, { defval: null });

console.log('Total records:', rawData.length);
if (rawData.length > 0) {
  console.log('Keys of first record:', Object.keys(rawData[0]));
  console.log('First record sample:', rawData[0]);
}

// Calculate totals
let totalOutstanding = 0;
let regOutstanding = 0;
let unregOutstanding = 0;

let numReg = 0;
let numUnreg = 0;
let numOther = 0;

const projectsMap = {};

rawData.forEach((row, i) => {
  // Try to find the values
  const getVal = (candidates) => {
    for (const c of candidates) {
      const key = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === c.trim().replace(/\s+/g, ' ').toLowerCase());
      if (key !== undefined && row[key] !== null && row[key] !== '') {
        const cleanVal = row[key].toString().replace(/,/g, '').replace(/[₹%]/g, '').trim();
        const parsed = parseFloat(cleanVal);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  };

  const getStringVal = (candidates) => {
    for (const c of candidates) {
      const key = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === c.trim().replace(/\s+/g, ' ').toLowerCase());
      if (key !== undefined && row[key] !== null) {
        return row[key].toString().trim();
      }
    }
    return '';
  };

  const outstanding = getVal(['Total Outstanding']);
  const status = getStringVal(['Status', 'Regis Status', 'Registration Status']).toLowerCase().trim();
  const project = getStringVal(['Project', 'Project Name']);

  totalOutstanding += outstanding;
  
  if (status === 'registered') {
    regOutstanding += outstanding;
    numReg++;
  } else if (status === 'unregistered' || status.includes('unregistered') || status.includes('un-registered')) {
    unregOutstanding += outstanding;
    numUnreg++;
  } else {
    // If not explicitly registered/unregistered, let's see what status is
    // Often empty status defaults to unregistered or something?
    unregOutstanding += outstanding; // Fallback
    numOther++;
    if (outstanding !== 0) {
      console.log(`Row ${i+2} status is "${status}" (neither registered/unregistered), outstanding: ${outstanding}, project: ${project}`);
    }
  }

  if (project) {
    if (!projectsMap[project]) {
      projectsMap[project] = { total: 0, reg: 0, unreg: 0 };
    }
    projectsMap[project].total += outstanding;
    if (status === 'registered') {
      projectsMap[project].reg += outstanding;
    } else {
      projectsMap[project].unreg += outstanding;
    }
  }
});

console.log('\n=== SUMS IN RUPEES ===');
console.log('Total Outstanding:', totalOutstanding);
console.log('Registered Outstanding:', regOutstanding);
console.log('Unregistered Outstanding:', unregOutstanding);

console.log('\n=== SUMS IN CRORES (Divide by 10,000,000) ===');
console.log('Total Outstanding (Cr):', totalOutstanding / 10000000);
console.log('Registered Outstanding (Cr):', regOutstanding / 10000000);
console.log('Unregistered Outstanding (Cr):', unregOutstanding / 10000000);

console.log('\n=== SUMS IN CRORES (Divide by 10,000,000, formatted to 2 decimals) ===');
console.log('Total Outstanding (Cr):', (totalOutstanding / 10000000).toFixed(2));
console.log('Registered Outstanding (Cr):', (regOutstanding / 10000000).toFixed(2));
console.log('Unregistered Outstanding (Cr):', (unregOutstanding / 10000000).toFixed(2));

console.log('\nRecord breakdown by status:');
console.log('Registered count:', numReg);
console.log('Unregistered count:', numUnreg);
console.log('Other count:', numOther);

console.log('\n=== PROJECT BREAKDOWN (Cr) ===');
Object.keys(projectsMap).sort().forEach(p => {
  const data = projectsMap[p];
  if (data.total !== 0) {
    console.log(`${p}: Total=${(data.total/10000000).toFixed(2)}, Reg=${(data.reg/10000000).toFixed(2)}, Unreg=${(data.unreg/10000000).toFixed(2)}`);
  }
});
