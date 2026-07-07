import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as XLSX from 'xlsx'

try {
  const buf = fs.readFileSync('Data MIS for Dashboard 07.07.2026 New.xlsx');
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const sheet = workbook.Sheets['Ageing Jun'];
  const raw2D = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  let output = '=== AGEING JUN ROWS (0-5) ===\n';
  raw2D.slice(0, 5).forEach((row, idx) => {
    output += `Row ${idx}: ` + JSON.stringify(row) + '\n';
  });
  fs.writeFileSync('scratch/ageing_info.txt', output);
} catch (e) {
  fs.writeFileSync('scratch/ageing_info.txt', 'ERROR: ' + e.stack);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
})
