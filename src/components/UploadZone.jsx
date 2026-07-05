import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { parseCSV } from '../utils/parseCSV';
import { parseExcel } from '../utils/parseExcel';
import { sampleCSVData } from '../utils/sampleData';
import { Upload, FileSpreadsheet, Download, RefreshCw, AlertCircle } from 'lucide-react';

export default function UploadZone() {
  const { uploadData, isLoading, setIsLoading } = useData();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    const autoLoadFile = async () => {
      try {
        const response = await fetch('/Data MIS for Dashboard 04.07.2026.xlsx');
        if (!response.ok) return;
        const blob = await response.blob();
        const file = new File([blob], 'Data MIS for Dashboard 04.07.2026.xlsx', { type: blob.type });
        await processFile(file);
        console.log("=== AUTO LOADED EXCEL FILE ===");
      } catch (e) {
        console.error("Auto load error:", e);
      }
    };
    autoLoadFile();
  }, []);

  // File validator and processor
  const processFile = async (file) => {
    if (!file) return;
    
    const extension = file.name.split('.').pop().toLowerCase();
    setIsLoading(true);
    setError('');

    try {
      let parsedData = null;
      if (extension === 'csv') {
        parsedData = await parseCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        parsedData = await parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or Excel (.xlsx/.xls) file.');
      }

      if (!parsedData) {
        throw new Error('The file appears to be empty.');
      }

      const keys = !Array.isArray(parsedData) ? Object.keys(parsedData) : [];
      const hasNewFormat = keys.some(k => k.toLowerCase().includes('fy target'));
      const hasSalesSheet = keys.some(k => k.toLowerCase().includes('sales'));
      const hasOutstandingSheet = keys.some(k => k.toLowerCase().includes('outstanding'));
      const hasBudgetSheet = keys.some(k => k.toLowerCase().includes('budget') || k.toLowerCase().includes('construction'));
      const hasPortfolioSheet = keys.some(k => k.toLowerCase().includes('portfolio') || k.toLowerCase().includes('building'));

      const isMultiSheet = !Array.isArray(parsedData) && (
        hasSalesSheet || hasOutstandingSheet || hasBudgetSheet || hasPortfolioSheet || hasNewFormat
      );

      if (isMultiSheet) {
        if (hasNewFormat) {
          const targetKey = keys.find(k => k.toLowerCase().includes('fy target'));
          const checkSheet = parsedData[targetKey] || [];
          if (checkSheet.length === 0) {
            throw new Error('Target sheet appears to be empty.');
          }
          const hasProjectColumn = checkSheet.some(row => 
            Array.isArray(row) && row.some(cell => cell && String(cell).toLowerCase().includes('project'))
          );
          if (!hasProjectColumn) {
            throw new Error('File format does not contain expected projects column.');
          }
        } else {
          const salesKey = keys.find(k => k.toLowerCase().includes('sales'));
          const portfolioKey = keys.find(k => k.toLowerCase().includes('portfolio') || k.toLowerCase().includes('building'));
          const checkSheet = parsedData[salesKey] || parsedData[portfolioKey] || [];
          if (checkSheet.length === 0) {
            throw new Error('Multi-sheet file does not contain expected data.');
          }
          
          const firstRow = checkSheet[0] || {};
          let hasProjectColumn = false;
          if (Array.isArray(firstRow)) {
            hasProjectColumn = firstRow.some(cell => 
              cell && (String(cell).toLowerCase().includes('project') || String(cell).toLowerCase().includes('building') || String(cell).toLowerCase().includes('sr. no.'))
            );
            if (!hasProjectColumn && checkSheet[1] && Array.isArray(checkSheet[1])) {
              hasProjectColumn = checkSheet[1].some(cell => 
                cell && (String(cell).toLowerCase().includes('project') || String(cell).toLowerCase().includes('building') || String(cell).toLowerCase().includes('sr. no.'))
              );
            }
          } else {
            hasProjectColumn = Object.keys(firstRow).some(k => 
              k.toLowerCase().includes('project') || k.toLowerCase().includes('building')
            );
          }

          if (!hasProjectColumn) {
            throw new Error('File columns do not match expected Nyati MIS format.');
          }
        }
      } else {
        const rawArray = Array.isArray(parsedData) ? parsedData : [];
        if (rawArray.length === 0) {
          throw new Error('The file appears to be empty.');
        }
        const firstRow = rawArray[0];
        const hasProjectColumn = Object.keys(firstRow || {}).some(k => 
          k.toLowerCase().includes('project') || k.toLowerCase().includes('building')
        );
        if (!hasProjectColumn) {
          throw new Error('File columns do not match expected Nyati MIS format (must contain project or building name).');
        }
      }

      uploadData(parsedData, file.name);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while parsing the file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Load sample data
  const handleLoadSample = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await parseCSV(sampleCSVData);
      uploadData(data, 'nyati_sample_mis_internal.csv');
      navigate('/');
    } catch (err) {
      setError('Failed to load sample data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nyati_mis_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-premium border border-slate-100 flex flex-col items-center text-center">
        
        {/* Company Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-nyati-navy text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-md border-b-4 border-nyati-orange mb-4">
            N
          </div>
          <h1 className="text-2xl font-bold text-nyati-navy tracking-tight">
            Nyati Engineers & Consultants Pvt. Ltd.
          </h1>
          <p className="text-slate-400 text-sm mt-1">MANAGEMENT INFORMATION SYSTEM (MIS) Dashboard</p>
        </div>

        {/* Drag Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-10 cursor-pointer flex flex-col items-center justify-center transition-all duration-300 relative ${
            dragActive
              ? 'border-nyati-orange bg-nyati-orange/5 scale-[0.99]'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-nyati-navy/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="w-12 h-12 text-nyati-navy animate-spin" />
              <p className="text-slate-600 font-semibold">Processing spreadsheet data...</p>
              <p className="text-xs text-slate-400">Extracting building details and aggregates</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-nyati-navy/5 rounded-full text-nyati-navy">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-lg">
                  Drag and drop your MIS report here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 bg-nyati-navy text-white font-medium rounded-xl hover:bg-nyati-navy/90 hover:shadow-md transition-all duration-200 text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Browse File
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="w-full mt-4 p-3 bg-nyati-danger/10 border border-nyati-danger/20 rounded-xl text-nyati-danger text-xs font-semibold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="w-full grid grid-cols-2 gap-4 mt-8 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 hover:border-nyati-navy/20 hover:bg-slate-50 text-slate-600 hover:text-nyati-navy transition-all duration-200 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            Download Sample CSV
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-nyati-orange/10 hover:bg-nyati-orange/20 text-nyati-orange transition-all duration-200 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Explore Sample Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
