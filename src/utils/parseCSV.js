import Papa from 'papaparse';

/**
 * Parses CSV file or raw string content into JSON object array
 * @param {File|string} input - File object or raw CSV string
 * @returns {Promise<Array>}
 */
export function parseCSV(input) {
  return new Promise((resolve, reject) => {
    const config = {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        resolve(results.data);
      },
      error: (err) => {
        reject(err);
      }
    };

    if (input instanceof File) {
      Papa.parse(input, config);
    } else if (typeof input === 'string') {
      Papa.parse(input, config);
    } else {
      reject(new Error('Invalid input type for CSV parsing.'));
    }
  });
}
