import XLSX from 'xlsx';

try {
  const workbook = XLSX.readFile('../Book2.xlsx');
  const sheet = workbook.Sheets['sheet1'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  let found = false;
  for (let r = 0; r < json.length; r++) {
    const row = json[r];
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val && String(val).toLowerCase().includes('portfolio total')) {
        console.log(`Found "Portfolio Total" at row=${r + 1}, col=${c + 1}: "${val}"`);
        found = true;
      }
    }
  }
  if (!found) console.log('String "Portfolio Total" not found in Book2.xlsx');
} catch (err) {
  console.error(err);
}


