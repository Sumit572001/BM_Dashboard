import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals, getQuarterFromMonth, parseMonthYearToDate } from '../utils/dataHelpers';
import { ArrowUpDown, Award, Home, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectTable({ selectedPeriod = 'Q1', setSelectedPeriod }) {
  const { filteredProjects, filters } = useData();
  const totals = calculateGrandTotals(filteredProjects);
  const tableRef = React.useRef(null);

  const getQuarterText = () => {
    const sq = filters?.selectedQuarters || [];
    if (sq.length === 0 || sq.length === 4) {
      return '';
    }
    const sortedQuarters = [...sq].sort();
    return ` (${sortedQuarters.join(', ')})`;
  };

  React.useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      const table = tableRef.current;
      if (!table) return;

      const rect = table.getBoundingClientRect();
      const parentRect = mainEl.getBoundingClientRect();
      const thead = table.querySelector('thead');
      if (!thead) return;

      const theadRect = thead.getBoundingClientRect();
      const headerHeight = theadRect.height;

      const tableTopInMain = rect.top - parentRect.top;

      let translateY = 0;
      if (tableTopInMain < 0) {
        translateY = -tableTopInMain;
        
        const maxTranslate = rect.height - headerHeight - 80;
        if (translateY > maxTranslate) {
          translateY = maxTranslate;
        }
      }

      const cells = thead.querySelectorAll('th');
      cells.forEach(cell => {
        cell.style.transform = `translateY(${translateY}px)`;
        cell.style.transition = 'none';
      });
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [filteredProjects]);

  // Sort states
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle column header clicks
  const requestSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // Type Badges
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'L':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
            <Award className="w-3 h-3 text-amber-600" />
            Luxe
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
            <Home className="w-3 h-3 text-indigo-600" />
            Comm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
            <Home className="w-3 h-3 text-emerald-600" />
            Resi
          </span>
        );
    }
  };

  // Determine if we have monthly columns, filtered by selected quarters and date range
  const salesMonths = React.useMemo(() => {
    const monthsSet = new Set();
    filteredProjects.forEach(p => {
      if (p.monthlyData) {
        Object.keys(p.monthlyData).forEach(m => monthsSet.add(m));
      }
    });

    const allMonths = Array.from(monthsSet);

    // Filter months list based on date filters and quarter filters
    const activeMonths = allMonths.filter(mStr => {
      if (filters) {
        const startLimit = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const endLimit = filters.dateTo ? new Date(filters.dateTo) : null;
        const mDate = parseMonthYearToDate(mStr);
        if (mDate) {
          if (startLimit && mDate < startLimit) return false;
          if (endLimit && mDate > endLimit) return false;
        }
      }

      if (filters && filters.selectedQuarters && filters.selectedQuarters.length > 0) {
        const q = getQuarterFromMonth(mStr);
        if (q && !filters.selectedQuarters.includes(q)) {
          return false;
        }
      }

      return true;
    });

    const firstProjWithData = filteredProjects.find(p => p.monthlyData && Object.keys(p.monthlyData).length > 0);
    if (firstProjWithData) {
      return Object.keys(firstProjWithData.monthlyData).filter(m => activeMonths.includes(m));
    }
    return activeMonths;
  }, [filteredProjects, filters]);

  const showMonthlyColumns = salesMonths.length > 0;

  const getActiveMonthsForPeriod = (period) => {
    if (period === 'Q1') return ['Apr-26', 'May-26', 'Jun-26'];
    if (period === 'Q2') return ['Jul-26', 'Aug-26', 'Sep-26'];
    if (period === 'Q3') return ['Oct-26', 'Nov-26', 'Dec-26'];
    if (period === 'Q4') return ['Jan-27', 'Feb-27', 'Mar-27'];
    return [period];
  };

  const getPeriodVal = (p, period, metricKey, format) => {
    const months = getActiveMonthsForPeriod(period);
    let sum = 0;
    let areaSum = 0;
    let valSum = 0;

    if (format === 'rate') {
      const isTarget = metricKey.toLowerCase().includes('target');
      const valField = isTarget ? 'salesValueTarget' : 'salesValueActual';
      const areaField = isTarget ? 'areaTarget' : 'areaActual';
      const rateField = isTarget ? 'rateTarget' : 'rateActual';

      months.forEach(m => {
        const d = p.monthlyData?.[m] || {};
        valSum += d[valField] || 0;
        areaSum += d[areaField] || 0;
        sum += d[rateField] || 0;
      });

      if (areaSum > 0) {
        return valSum / areaSum;
      }
      return sum / (months.length || 1);
    } else {
      months.forEach(m => {
        const d = p.monthlyData?.[m] || {};
        sum += d[metricKey] || 0;
      });
      return sum;
    }
  };

  const getPeriodTotalVal = (period, metricKey, format) => {
    const months = getActiveMonthsForPeriod(period);
    let sum = 0;
    let areaSum = 0;
    let valSum = 0;

    if (format === 'rate') {
      const isTarget = metricKey.toLowerCase().includes('target');
      const valField = isTarget ? 'salesValueTarget' : 'salesValueActual';
      const areaField = isTarget ? 'areaTarget' : 'areaActual';

      filteredProjects.forEach(p => {
        months.forEach(m => {
          const d = p.monthlyData?.[m] || {};
          valSum += d[valField] || 0;
          areaSum += d[areaField] || 0;
        });
      });

      return areaSum > 0 ? valSum / areaSum : 0;
    } else {
      filteredProjects.forEach(p => {
        months.forEach(m => {
          const d = p.monthlyData?.[m] || {};
          sum += d[metricKey] || 0;
        });
      });
      return sum;
    }
  };

  const getActiveQuarter = () => {
    if (['Q1', 'Q2', 'Q3', 'Q4'].includes(selectedPeriod)) return selectedPeriod;
    if (['Apr-26', 'May-26', 'Jun-26'].includes(selectedPeriod)) return 'Q1';
    if (['Jul-26', 'Aug-26', 'Sep-26'].includes(selectedPeriod)) return 'Q2';
    if (['Oct-26', 'Nov-26', 'Dec-26'].includes(selectedPeriod)) return 'Q3';
    if (['Jan-27', 'Feb-27', 'Mar-27'].includes(selectedPeriod)) return 'Q4';
    return 'Q1';
  };

  const metrics = [
    { key: 'unitsTarget', label: 'Units Target', format: 'number' },
    { key: 'unitsActual', label: 'Units Actual', format: 'number' },
    { key: 'rateTarget', label: 'Rate Target', format: 'rate' },
    { key: 'rateActual', label: 'Rate Actual', format: 'rate' },
    { key: 'areaTarget', label: 'Area Target', format: 'number' },
    { key: 'areaActual', label: 'Area Actual', format: 'number' },
    { key: 'salesValueTarget', label: 'Value Target', format: 'currency' },
    { key: 'salesValueActual', label: 'Value Actual', format: 'currency' }
  ];

  // Sort logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const getBottomWeight = (name) => {
      const uName = name.trim().toUpperCase();
      if (uName.includes('OLD PROJECTS')) return 1000;
      if (uName.includes('EKATVA')) return 1001;
      if (uName.includes('ELARIS')) return 1002;
      if (uName.includes('PATRAKARNAGAR') || uName.includes('PATRAKARNAGR')) return 1003;
      if (uName.includes('ETHOS') || uName.includes('ETHOSE')) return 1004;
      return null;
    };

    const bottomWeightA = getBottomWeight(a.name);
    const bottomWeightB = getBottomWeight(b.name);

    if (bottomWeightA !== null && bottomWeightB !== null) {
      return bottomWeightA - bottomWeightB;
    }
    if (bottomWeightA !== null) return 1;
    if (bottomWeightB !== null) return -1;

    if (sortField === 'name') {
      const getProjectWeight = (name) => {
        const uName = name.trim().toUpperCase();
        const sequence = [
          "NYATI EMERALD I",
          "NYATI EMERALD II",
          "NYATI EMERALD III",
          "NYATI EQUINOX I",
          "NYATI EQUINOX II",
          "NYATI ERA II",
          "NYATI ERA III",
          "NYATI ERA IV",
          "NYATI EXUBERANCE I",
          "NYATI EXUBERANCE IV",
          "NYATI ESTEBAN II",
          "NYATI ESTEBAN III",
          "NYATI PLAZA & NYATI ENTHRAL I",
          "NYATI EMPRESS",
          "NYATI EVOQUE",
          "NYATI EVANIA",
          "NYATI ELENOR",
          "NYATI EMBLEM",
          "NYATI ELAN COMMERCIAL",
          "NYATI DEFENCE ENCLAVE III",
          "NYATI QUANTUM TOWERS",
          "NYATI UNITREE EXTENSION"
        ];

        const idx = sequence.findIndex(s => uName.includes(s) || s.includes(uName));
        if (idx !== -1) return idx;
        return 500;
      };

      const weightA = getProjectWeight(a.name);
      const weightB = getProjectWeight(b.name);

      if (weightA !== weightB) {
        return sortDirection === 'asc' ? weightA - weightB : weightB - weightA;
      }
      
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }

    let valA, valB;
    if (sortField.startsWith('periodTotal')) {
      const key = sortField.replace('periodTotal', '');
      const metricKey = key.charAt(0).toLowerCase() + key.slice(1);
      let mappedKey = metricKey;
      let format = 'number';
      if (metricKey.startsWith('units')) {
        format = 'number';
      } else if (metricKey.startsWith('rate')) {
        format = 'rate';
      } else if (metricKey.startsWith('area')) {
        format = 'number';
      } else if (metricKey.startsWith('value') || metricKey.startsWith('salesValue')) {
        mappedKey = 'salesValue' + metricKey.replace('value', '').replace('salesValue', '');
        format = 'currency';
      }
      valA = getPeriodVal(a, selectedPeriod, mappedKey, format);
      valB = getPeriodVal(b, selectedPeriod, mappedKey, format);
    } else {
      valA = a[sortField];
      valB = b[sortField];
    }

    if (typeof valA === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const formatCellVal = (val, format) => {
    if (val === undefined || val === null || val === '') {
      if (format === 'currency') return '₹0.00 Cr';
      return '0';
    }
    switch (format) {
      case 'number':
        return Math.round(val).toLocaleString('en-IN');
      case 'rate':
        return val > 0 ? `₹${Math.round(val).toLocaleString('en-IN')}/sf` : '0';
      case 'currency':
        return val > 0 ? `₹${(val / 10000000).toFixed(2)} Cr` : '₹0.00 Cr';
      default:
        return val;
    }
  };

  const activeQ = getActiveQuarter();

  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100">

      {/* Card Header */}
      <div className="bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-nyati-navy text-lg">Project-Wise Sales Summary</h3>
            <p className="text-slate-700 text-sm font-semibold mt-0.5">
              Click headers to sort.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {showMonthlyColumns && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-855 text-sm font-extrabold select-none">Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-1.5 text-sm font-black text-nyati-navy focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  {activeQ === 'Q1' && (
                    <optgroup label="Q1">
                      <option value="Q1">Q1 (Apr - Jun)</option>
                      <option value="Apr-26">Apr-26</option>
                      <option value="May-26">May-26</option>
                      <option value="Jun-26">Jun-26</option>
                    </optgroup>
                  )}
                  {activeQ === 'Q2' && (
                    <optgroup label="Q2">
                      <option value="Q2">Q2 (Jul - Sep)</option>
                      <option value="Jul-26">Jul-26</option>
                      <option value="Aug-26">Aug-26</option>
                      <option value="Sep-26">Sep-26</option>
                    </optgroup>
                  )}
                  {activeQ === 'Q3' && (
                    <optgroup label="Q3">
                      <option value="Q3">Q3 (Oct - Dec)</option>
                      <option value="Oct-26">Oct-26</option>
                      <option value="Nov-26">Nov-26</option>
                      <option value="Dec-26">Dec-26</option>
                    </optgroup>
                  )}
                  {activeQ === 'Q4' && (
                    <optgroup label="Q4">
                      <option value="Q4">Q4 (Jan - Mar)</option>
                      <option value="Jan-27">Jan-27</option>
                      <option value="Feb-27">Feb-27</option>
                      <option value="Mar-27">Mar-27</option>
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Wrapper with horizontal scrolling */}
      <div className="overflow-x-auto w-full max-w-full rounded-b-3xl">
        <table ref={tableRef} className="w-full text-left text-[15px] text-slate-800 border-collapse min-w-[1140px]">
          <thead>
            {!showMonthlyColumns ? (
              // Original Summary View Headers (Grouped like Excel)
              <>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[15px]">
                  <th
                    rowSpan={3}
                    className="bg-slate-50 px-3 py-3 min-w-[200px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 text-center text-[15px]"
                  >
                    <div className="flex items-center justify-center h-full text-slate-900 font-black text-[15px]">
                      Project Name
                    </div>
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#ffff00] text-slate-900 text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20">
                    Units
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#8db4e2] text-slate-900 text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20">
                    Rate
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#c4d79b] text-slate-900 text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20">
                    Area
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#fabf8f] text-slate-900 text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20">
                    Sales Value
                  </th>
                  <th colSpan={8} className="bg-slate-200 text-slate-900 text-center font-black py-2 text-[15px] tracking-wider sticky top-0 z-20">
                    Total{getQuarterText()}
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[15px]">
                  <th colSpan={2} className="bg-[#ffff00] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                    Units
                  </th>
                  <th colSpan={2} className="bg-[#8db4e2] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                    Rate
                  </th>
                  <th colSpan={2} className="bg-[#c4d79b] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                    Area
                  </th>
                  <th colSpan={2} className="bg-[#fabf8f] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                    Sales Value
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase tracking-wider font-black border-b border-slate-200 select-none text-[14px]">
                  <th onClick={() => requestSort('budgetUnits')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('soldToDate')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r-2 border-slate-300 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('budgetRate')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualRate')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r-2 border-slate-300 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('budgetArea')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualArea')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r-2 border-slate-300 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('budgetValCr')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualValCr')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r-2 border-slate-300 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalUnitsTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalUnitsActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r-2 border-slate-200 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalRateTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalRateActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r-2 border-slate-200 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalAreaTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalAreaActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r-2 border-slate-200 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalValueTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r border-slate-100 sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalValueActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] sticky top-[64px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                  </th>
                </tr>
              </>
            ) : (
              // Excel-aligned Month Group Headers (Show only Q1-Q4 Total columns)
              <>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[15px]">
                  <th
                    rowSpan={3}
                    className="bg-slate-50 px-3 py-3 min-w-[200px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 text-center text-[15px]"
                  >
                    <div className="flex items-center justify-center h-full text-slate-900 font-black text-[15px]">
                      Project Name
                    </div>
                  </th>
                  {showMonthlyColumns && (() => {
                    const getFullMonthName = (monthStr) => {
                      const [mon] = monthStr.split('-');
                      const mapping = {
                        'Apr': 'April',
                        'May': 'May',
                        'Jun': 'June',
                        'Jul': 'July',
                        'Aug': 'August',
                        'Sep': 'September',
                        'Oct': 'October',
                        'Nov': 'November',
                        'Dec': 'December',
                        'Jan': 'January',
                        'Feb': 'February',
                        'Mar': 'March'
                      };
                      return mapping[mon] || mon;
                    };

                    const getLabel = () => {
                      if (selectedPeriod === 'Q1') return 'April, May & June (Q1)';
                      if (selectedPeriod === 'Q2') return 'July, August & September (Q2)';
                      if (selectedPeriod === 'Q3') return 'October, November & December (Q3)';
                      if (selectedPeriod === 'Q4') return 'January, February & March (Q4)';

                      if (selectedPeriod && selectedPeriod !== 'All' && !selectedPeriod.startsWith('Q')) {
                        return getFullMonthName(selectedPeriod);
                      }

                      if (salesMonths && salesMonths.length > 0) {
                        if (salesMonths.length === 1) {
                          return getFullMonthName(salesMonths[0]);
                        }
                        const names = salesMonths.map(m => getFullMonthName(m));
                        let label = '';
                        if (names.length === 2) {
                          label = names.join(' & ');
                        } else {
                          label = names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
                        }
                        const q = getQuarterFromMonth(salesMonths[0]);
                        return q ? `${label} (${q})` : label;
                      }

                      return selectedPeriod;
                    };

                    return (
                      <th colSpan={8} className="bg-slate-200 text-slate-900 text-center font-black py-2 border-b border-slate-200 text-[15px] tracking-wider sticky top-0 z-20">
                        TOTAL - {getLabel().toUpperCase()}
                      </th>
                    );
                  })()}
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[15px]">
                  {showMonthlyColumns && (
                    <>
                      <th colSpan={2} className="bg-[#ffff00] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                        Units
                      </th>
                      <th colSpan={2} className="bg-[#8db4e2] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                        Rate
                      </th>
                      <th colSpan={2} className="bg-[#c4d79b] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                        Area
                      </th>
                      <th colSpan={2} className="bg-[#fabf8f] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20">
                        Sales Value
                      </th>
                    </>
                  )}
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase tracking-wider font-black border-b border-slate-200 select-none text-[14px]">
                  {showMonthlyColumns && (() => {
                    const totalMetrics = [
                      { key: 'unitsTarget', label: 'Target', minW: 'min-w-[70px]', sortKey: 'periodTotalUnitsTarget' },
                      { key: 'unitsActual', label: 'Actual', minW: 'min-w-[70px]', sortKey: 'periodTotalUnitsActual' },
                      { key: 'rateTarget', label: 'Target', minW: 'min-w-[90px]', sortKey: 'periodTotalRateTarget' },
                      { key: 'rateActual', label: 'Actual', minW: 'min-w-[90px]', sortKey: 'periodTotalRateActual' },
                      { key: 'areaTarget', label: 'Target', minW: 'min-w-[80px]', sortKey: 'periodTotalAreaTarget' },
                      { key: 'areaActual', label: 'Actual', minW: 'min-w-[80px]', sortKey: 'periodTotalAreaActual' },
                      { key: 'salesValueTarget', label: 'Target', minW: 'min-w-[85px]', sortKey: 'periodTotalValueTarget' },
                      { key: 'salesValueActual', label: 'Actual', minW: 'min-w-[85px]', sortKey: 'periodTotalValueActual' }
                    ];
                    return (
                      <>
                        {totalMetrics.map((metric, mIdx) => {
                          const isGroupEnd = mIdx % 2 === 1;
                          const isLastMetric = mIdx === totalMetrics.length - 1;
                          return (
                            <th
                              key={metric.sortKey}
                              onClick={() => requestSort(metric.sortKey)}
                              className={`bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors ${metric.minW} ${isLastMetric ? 'border-r-2 border-slate-300' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'} sticky top-[64px] z-20 text-[14px]`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                {metric.label}
                                <ArrowUpDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                              </div>
                            </th>
                          );
                        })}
                      </>
                    );
                  })()}
                </tr>
              </>
            )}
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold text-[15px]">
            {sortedProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300" />
                    <span>No projects matching active filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {!showMonthlyColumns ? (
                  // Original 10 Columns Row Rendering
                  sortedProjects.map((p, index) => (
                    <motion.tr
                      key={p.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px]"
                    >
                      <td
                        className="px-3 py-3 font-bold text-slate-700 min-w-[200px] text-[15px]"
                      >
                        <div className="flex flex-col gap-1 justify-start text-left">
                          <span className="text-slate-800 text-[15px] font-black whitespace-normal break-words">{p.name}</span>
                          <div className="flex justify-start">{renderTypeBadge(p.type)}</div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-700 text-[15px]">
                        {p.budgetUnits.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-nyati-navy border-r-2 border-slate-300 text-[15px]">
                        {p.soldToDate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-slate-700 text-[15px]">
                        {p.budgetRate > 0 ? `₹${Math.round(p.budgetRate).toLocaleString('en-IN')}/sf` : '0'}
                      </td>
                      <td className="px-2 py-3 text-right font-bold text-nyati-navy border-r-2 border-slate-300 text-[15px]">
                        {p.actualRate > 0 ? `₹${Math.round(p.actualRate).toLocaleString('en-IN')}/sf` : '0'}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-slate-700 text-[15px]">
                        {Math.round(p.budgetArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right font-bold text-slate-700 border-r-2 border-slate-300 text-[15px]">
                        {Math.round(p.actualArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-slate-700 text-[15px]">
                        ₹{p.budgetValCr.toFixed(2)} Cr
                      </td>
                      <td className="px-2 py-3 text-right font-bold text-slate-700 border-r-2 border-slate-300 text-[15px]">
                        ₹{p.actualValCr.toFixed(2)} Cr
                      </td>
                      {(() => {
                        const totalUnitsTarget = getPeriodVal(p, selectedPeriod, 'unitsTarget', 'number');
                        const totalUnitsActual = getPeriodVal(p, selectedPeriod, 'unitsActual', 'number');
                        const totalRateTarget = getPeriodVal(p, selectedPeriod, 'unitsTarget', 'rate');
                        const totalRateActual = getPeriodVal(p, selectedPeriod, 'unitsActual', 'rate');
                        const totalAreaTarget = getPeriodVal(p, selectedPeriod, 'areaTarget', 'number');
                        const totalAreaActual = getPeriodVal(p, selectedPeriod, 'areaActual', 'number');
                        const totalValueTarget = getPeriodVal(p, selectedPeriod, 'salesValueTarget', 'number');
                        const totalValueActual = getPeriodVal(p, selectedPeriod, 'salesValueActual', 'number');

                        return (
                          <>
                            <td className="px-2 py-3 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5 text-[15px]">
                              {totalUnitsTarget.toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-center font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5 text-[15px]">
                              {totalUnitsActual.toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5 text-[15px]">
                              {formatCellVal(totalRateTarget, 'rate')}
                            </td>
                            <td className="px-2 py-3 text-right font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5 text-[15px]">
                              {formatCellVal(totalRateActual, 'rate')}
                            </td>
                            <td className="px-2 py-3 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5 text-[15px]">
                              {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right font-bold text-slate-700 border-r-2 border-slate-200 bg-slate-50/5 text-[15px]">
                              {Math.round(totalAreaActual).toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5 text-[15px]">
                              ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-2.5 py-3 text-right font-bold text-slate-700 bg-slate-50/5 text-[15px]">
                              ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                            </td>
                          </>
                        );
                      })()}
                    </motion.tr>
                  ))
                ) : (
                  // Excel-aligned Month Group Row Rendering
                  sortedProjects.map((p, index) => (
                    <tr
                      key={p.name}
                      className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px] border-b border-slate-100"
                    >
                      <td
                        className="px-3 py-3 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-sky-50 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 min-w-[200px] transition-colors text-[15px]"
                      >
                        <div className="flex flex-col gap-1 justify-start text-left">
                          <span className="text-slate-800 text-[15px] font-black whitespace-normal break-words">{p.name}</span>
                          <div className="flex justify-start">{renderTypeBadge(p.type)}</div>
                        </div>
                      </td>
                      {showMonthlyColumns && (() => {
                        return (
                          <>
                            {/* Total Period Metrics (using selectedPeriod totals) */}
                            {metrics.map((metric, mIdx) => {
                              const val = getPeriodVal(p, selectedPeriod, metric.key, metric.format);
                              const isLastMetric = mIdx === metrics.length - 1;
                              const isGroupEnd = mIdx % 2 === 1;
                              const isActual = metric.key.toLowerCase().includes('actual');
                              return (
                                <td
                                  key={`total_${selectedPeriod}_${metric.key}`}
                                  className={`px-2 py-3 text-center text-[15px] ${isActual ? 'font-bold text-nyati-navy' : 'font-semibold text-slate-700'} ${isLastMetric ? 'border-r-2 border-slate-300 bg-slate-50/5' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'}`}
                                >
                                  {formatCellVal(val, metric.format)}
                                </td>
                              );
                            })}
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}

                {/* Grand Total Row */}
                {!showMonthlyColumns ? (
                  <tr className="bg-slate-50 font-bold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-10 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                    <td className="px-3 py-3 bg-slate-50 min-w-[200px] text-[15px]">GRAND TOTAL</td>
                    <td className="px-2 py-3 text-center bg-slate-50 text-[15px]">
                      {totals.budgetUnits.toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]">
                      {totals.soldToDate.toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 text-[15px]">
                      {totals.budgetRate > 0 ? `₹${Math.round(totals.budgetRate).toLocaleString('en-IN')}/sf` : '0'}
                    </td>
                    <td className="px-2 py-3 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]">
                      {totals.actualRate > 0 ? `₹${Math.round(totals.actualRate).toLocaleString('en-IN')}/sf` : '0'}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 text-[15px]">
                      {Math.round(totals.budgetArea).toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 border-r-2 border-slate-300 text-[15px]">
                      {Math.round(totals.actualArea).toLocaleString('en-IN')}
                    </td>
                    <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 text-[15px]">
                      ₹{totals.budgetValCr.toFixed(2)} Cr
                    </td>
                    <td className="px-2 py-3 text-right text-slate-700 font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]">
                      ₹{totals.actualValCr.toFixed(2)} Cr
                    </td>
                    {(() => {
                      const totalUnitsTarget = getPeriodTotalVal(selectedPeriod, 'unitsTarget', 'number');
                      const totalUnitsActual = getPeriodTotalVal(selectedPeriod, 'unitsActual', 'number');
                      const totalRateTarget = getPeriodTotalVal(selectedPeriod, 'unitsTarget', 'rate');
                      const totalRateActual = getPeriodTotalVal(selectedPeriod, 'unitsActual', 'rate');
                      const totalAreaTarget = getPeriodTotalVal(selectedPeriod, 'areaTarget', 'number');
                      const totalAreaActual = getPeriodTotalVal(selectedPeriod, 'areaActual', 'number');
                      const totalValueTarget = getPeriodTotalVal(selectedPeriod, 'salesValueTarget', 'number');
                      const totalValueActual = getPeriodTotalVal(selectedPeriod, 'salesValueActual', 'number');

                      return (
                        <>
                          <td className="px-2 py-3 text-center text-slate-700 bg-slate-50 border-r border-slate-100 text-[15px]">
                            {totalUnitsTarget.toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]">
                            {totalUnitsActual.toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 border-r border-slate-100 text-[15px]">
                            {formatCellVal(totalRateTarget, 'rate')}
                          </td>
                          <td className="px-2 py-3 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]">
                            {formatCellVal(totalRateActual, 'rate')}
                          </td>
                          <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 border-r border-slate-100 text-[15px]">
                            {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-3 text-right text-slate-700 font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]">
                            {Math.round(totalAreaActual).toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-3 text-right text-slate-700 bg-slate-50 border-r border-slate-100 text-[15px]">
                            ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="px-2.5 py-3 text-right text-slate-700 font-extrabold bg-slate-50 text-[15px]">
                            ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ) : (
                  <tr className="bg-slate-100 font-extrabold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-20 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                    <td className="px-3 py-3 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 min-w-[200px] text-[15px]">
                      GRAND TOTAL
                    </td>
                    {showMonthlyColumns && (() => {
                      return (
                        <>
                          {metrics.map((metric, mIdx) => {
                            const isLastMetric = mIdx === metrics.length - 1;
                            const isGroupEnd = mIdx % 2 === 1;
                            const totalVal = getPeriodTotalVal(selectedPeriod, metric.key, metric.format);
                            return (
                              <td
                                key={`total_grand_val_${selectedPeriod}_${metric.key}`}
                                className={`px-2 py-3 text-center text-[15px] font-black ${isLastMetric ? 'border-r-2 border-slate-300' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'}`}
                              >
                                {formatCellVal(totalVal, metric.format)}
                              </td>
                            );
                          })}
                        </>
                      );
                    })()}
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
