import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { calculateGrandTotals, getQuarterFromMonth, parseMonthYearToDate } from '../utils/dataHelpers';
import { ArrowUpDown, ArrowRight, Home, ShieldAlert, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectTable() {
  const { filteredProjects, setActiveProjectName, filters } = useData();
  const totals = calculateGrandTotals(filteredProjects);
  const navigate = useNavigate();
  const tableRef = React.useRef(null);

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

      // Distance from top of the table to top of the scrolling viewport (<main>)
      const tableTopInMain = rect.top - parentRect.top;

      let translateY = 0;
      if (tableTopInMain < 0) {
        translateY = -tableTopInMain;
        
        // Clamp translateY so headers don't scroll past the bottom of the table content
        // Leave room for the headers and the Grand Total row (approx 80px)
        const maxTranslate = rect.height - headerHeight - 80;
        if (translateY > maxTranslate) {
          translateY = maxTranslate;
        }
      }

      // Apply transform directly to each cell (th) inside thead
      const cells = thead.querySelectorAll('th');
      cells.forEach(cell => {
        cell.style.transform = `translateY(${translateY}px)`;
        cell.style.transition = 'none';
      });
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Re-align whenever container size changes
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
            <Award className="w-3 h-3 text-amber-600" />
            Luxe
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
            <Home className="w-3 h-3 text-indigo-600" />
            Comm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
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
      // 1. Date range filter
      if (filters) {
        const startLimit = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const endLimit = filters.dateTo ? new Date(filters.dateTo) : null;
        const mDate = parseMonthYearToDate(mStr);
        if (mDate) {
          if (startLimit && mDate < startLimit) return false;
          if (endLimit && mDate > endLimit) return false;
        }
      }

      // 2. Quarter filter
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

  const periodGrandTotals = React.useMemo(() => {
    let unitsTarget = 0;
    let unitsActual = 0;
    let areaTarget = 0;
    let areaActual = 0;
    let valueTarget = 0;
    let valueActual = 0;
    filteredProjects.forEach(p => {
      salesMonths.forEach(m => {
        unitsTarget += p.monthlyData?.[m]?.unitsTarget || 0;
        unitsActual += p.monthlyData?.[m]?.unitsActual || 0;
        areaTarget += p.monthlyData?.[m]?.areaTarget || 0;
        areaActual += p.monthlyData?.[m]?.areaActual || 0;
        valueTarget += p.monthlyData?.[m]?.salesValueTarget || 0;
        valueActual += p.monthlyData?.[m]?.salesValueActual || 0;
      });
    });
    const rateTarget = areaTarget > 0 ? valueTarget / areaTarget : 0;
    const rateActual = areaActual > 0 ? valueActual / areaActual : 0;
    return {
      unitsTarget,
      unitsActual,
      rateTarget,
      rateActual,
      areaTarget,
      areaActual,
      valueTarget,
      valueActual
    };
  }, [filteredProjects, salesMonths]);

  const showMonthlyColumns = salesMonths.length > 0;

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  React.useEffect(() => {
    if (selectedMonthIndex >= salesMonths.length) {
      setSelectedMonthIndex(0);
    }
  }, [salesMonths, selectedMonthIndex]);

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
    // 1. Identify bottom projects and assign relative weights
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

    // If both are bottom projects, keep them at the bottom in their relative weight order
    if (bottomWeightA !== null && bottomWeightB !== null) {
      return bottomWeightA - bottomWeightB;
    }
    // If only A is a bottom project, A goes to the bottom
    if (bottomWeightA !== null) return 1;
    // If only B is a bottom project, B goes to the bottom
    if (bottomWeightB !== null) return -1;

    // 2. If neither is a bottom project, proceed with standard sort logic
    if (sortField === 'name') {
      const getProjectWeight = (name) => {
        const uName = name.trim().toUpperCase();
        // Check in the main sequence list
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

        // Find match in sequence
        const idx = sequence.findIndex(s => uName.includes(s) || s.includes(uName));
        if (idx !== -1) return idx;

        // Fallback for any other projects (in the middle)
        return 500;
      };

      const weightA = getProjectWeight(a.name);
      const weightB = getProjectWeight(b.name);

      if (weightA !== weightB) {
        return sortDirection === 'asc' ? weightA - weightB : weightB - weightA;
      }
      
      // Secondary fallback (alphabetical)
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }

    // For other fields, keep the original sort logic
    let valA, valB;
    if (sortField === 'periodTotalUnitsTarget') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.unitsTarget || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.unitsTarget || 0), 0);
    } else if (sortField === 'periodTotalUnitsActual') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.unitsActual || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.unitsActual || 0), 0);
    } else if (sortField === 'periodTotalRateTarget') {
      const valAVal = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.salesValueTarget || 0), 0);
      const valAArea = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.areaTarget || 0), 0);
      valA = valAArea > 0 ? valAVal / valAArea : 0;

      const valBVal = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.salesValueTarget || 0), 0);
      const valBArea = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.areaTarget || 0), 0);
      valB = valBArea > 0 ? valBVal / valBArea : 0;
    } else if (sortField === 'periodTotalRateActual') {
      const valAVal = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.salesValueActual || 0), 0);
      const valAArea = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.areaActual || 0), 0);
      valA = valAArea > 0 ? valAVal / valAArea : 0;

      const valBVal = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.salesValueActual || 0), 0);
      const valBArea = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.areaActual || 0), 0);
      valB = valBArea > 0 ? valBVal / valBArea : 0;
    } else if (sortField === 'periodTotalAreaTarget') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.areaTarget || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.areaTarget || 0), 0);
    } else if (sortField === 'periodTotalAreaActual') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.areaActual || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.areaActual || 0), 0);
    } else if (sortField === 'periodTotalValueTarget') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.salesValueTarget || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.salesValueTarget || 0), 0);
    } else if (sortField === 'periodTotalValueActual') {
      valA = salesMonths.reduce((sum, m) => sum + (a.monthlyData?.[m]?.salesValueActual || 0), 0);
      valB = salesMonths.reduce((sum, m) => sum + (b.monthlyData?.[m]?.salesValueActual || 0), 0);
    } else if (sortField.includes('_')) {
      const [m, metricKey] = sortField.split('_');
      valA = a.monthlyData?.[m]?.[metricKey] || 0;
      valB = b.monthlyData?.[m]?.[metricKey] || 0;
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

  const handleRowClick = (projName) => {
    setActiveProjectName(projName);
    navigate('/portfolio');
  };

  const formatCellVal = (val, format) => {
    if (val === undefined || val === null) return '-';
    switch (format) {
      case 'number':
        return Math.round(val).toLocaleString('en-IN');
      case 'rate':
        return val > 0 ? `₹${Math.round(val).toLocaleString('en-IN')}/sf` : '-';
      case 'currency':
        return val > 0 ? `₹${(val / 10000000).toFixed(2)} Cr` : '₹0.00 Cr';
      default:
        return val;
    }
  };

  const getMonthlyTotal = (month, field) => {
    return filteredProjects.reduce((sum, p) => {
      return sum + (p.monthlyData?.[month]?.[field] || 0);
    }, 0);
  };

  const getMonthlyRateTotal = (month, type) => {
    const valueField = type === 'Target' ? 'salesValueTarget' : 'salesValueActual';
    const areaField = type === 'Target' ? 'areaTarget' : 'areaActual';
    const valSum = getMonthlyTotal(month, valueField);
    const areaSum = getMonthlyTotal(month, areaField);
    return areaSum > 0 ? valSum / areaSum : 0;
  };

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
            {showMonthlyColumns && salesMonths.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1 shrink-0">
                <button
                  onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
                  disabled={selectedMonthIndex === 0}
                  className="p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 text-sm font-black uppercase text-nyati-navy select-none min-w-[85px] text-center">
                  {salesMonths[selectedMonthIndex]}
                </span>
                <button
                  onClick={() => setSelectedMonthIndex(prev => Math.min(salesMonths.length - 1, prev + 1))}
                  disabled={selectedMonthIndex === salesMonths.length - 1}
                  className="p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Wrapper with horizontal scrolling */}
      <div className="overflow-x-auto w-full max-w-full rounded-b-3xl">
        <table ref={tableRef} className="w-full text-left text-[11px] text-slate-800 border-collapse min-w-[1080px]">
          <thead>
            {!showMonthlyColumns ? (
              // Original Summary View Headers (Grouped like Excel)
              <>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[11px]">
                  <th
                    rowSpan={3}
                    onClick={() => requestSort('name')}
                    className="bg-slate-50 px-2.5 py-2 cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[140px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 h-full">
                      Project Name
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                    </div>
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#ffff00] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[11px] tracking-wider sticky top-0 z-20">
                    Units
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#8db4e2] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[11px] tracking-wider sticky top-0 z-20">
                    Rate
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#c4d79b] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[11px] tracking-wider sticky top-0 z-20">
                    Area
                  </th>
                  <th colSpan={2} rowSpan={2} className="bg-[#fabf8f] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1.5 text-[11px] tracking-wider sticky top-0 z-20">
                    Sales Value
                  </th>
                  <th colSpan={8} className="bg-slate-200 text-slate-900 text-center font-black py-1.5 text-[11px] tracking-wider sticky top-0 z-20">
                    Total
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[11px]">
                  {/* Under Total in Row 2 */}
                  <th colSpan={2} className="bg-[#ffff00]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                    Units
                  </th>
                  <th colSpan={2} className="bg-[#8db4e2]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                    Rate
                  </th>
                  <th colSpan={2} className="bg-[#c4d79b]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                    Area
                  </th>
                  <th colSpan={2} className="bg-[#fabf8f]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                    Sales Value
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase tracking-wider font-black border-b border-slate-200 select-none text-[10px]">
                  {/* Row 3 - Target/Actual columns */}
                  {/* Units */}
                  <th onClick={() => requestSort('budgetUnits')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[50px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('soldToDate')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[50px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  {/* Rate */}
                  <th onClick={() => requestSort('budgetRate')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualRate')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  {/* Area */}
                  <th onClick={() => requestSort('budgetArea')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[60px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualArea')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[60px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  {/* Sales Value */}
                  <th onClick={() => requestSort('budgetValCr')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[65px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('actualValCr')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[65px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  {/* Total Period Columns */}
                  <th onClick={() => requestSort('periodTotalUnitsTarget')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[50px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalUnitsActual')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[50px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalRateTarget')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalRateActual')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalAreaTarget')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[60px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalAreaActual')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[60px] border-r-2 border-slate-300 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalValueTarget')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[65px] border-r border-slate-100 sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                  <th onClick={() => requestSort('periodTotalValueActual')} className="bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[65px] sticky top-[56px] z-20">
                    <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-2.5 h-2.5 opacity-60" /></div>
                  </th>
                </tr>
              </>
            ) : (
              // Excel-aligned Month Group Headers
              <>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[11px]">
                  <th
                    rowSpan={3}
                    onClick={() => requestSort('name')}
                    className="bg-slate-50 px-2.5 py-2 cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[140px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 h-full">
                      Project Name
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                    </div>
                  </th>
                  {salesMonths.length > 0 && (() => {
                    const month = salesMonths[selectedMonthIndex];
                    return (
                      <>
                        <th
                          key={month}
                          colSpan={8}
                          className="bg-slate-100 text-nyati-navy text-center font-black border-r-2 border-slate-200 py-1.5 border-b border-slate-200 text-[11px] tracking-wider sticky top-0 z-20"
                        >
                          {month}
                        </th>
                        <th colSpan={8} className="bg-slate-200 text-slate-900 text-center font-black py-1.5 border-b border-slate-200 text-[11px] tracking-wider sticky top-0 z-20">
                          Total
                        </th>
                      </>
                    );
                  })()}
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase font-black border-b border-slate-100 select-none text-[11px]">
                  {salesMonths.length > 0 && (() => {
                    const month = salesMonths[selectedMonthIndex];
                    return (
                      <React.Fragment key={`groups_${month}`}>
                        {/* Month columns */}
                        <th colSpan={2} className="bg-[#ffff00] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Units
                        </th>
                        <th colSpan={2} className="bg-[#8db4e2] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Rate
                        </th>
                        <th colSpan={2} className="bg-[#c4d79b] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Area
                        </th>
                        <th colSpan={2} className="bg-[#fabf8f] text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Sales Value
                        </th>
                        {/* Total columns */}
                        <th colSpan={2} className="bg-[#ffff00]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Units
                        </th>
                        <th colSpan={2} className="bg-[#8db4e2]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Rate
                        </th>
                        <th colSpan={2} className="bg-[#c4d79b]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Area
                        </th>
                        <th colSpan={2} className="bg-[#fabf8f]/30 text-slate-900 text-center font-black border-r-2 border-slate-300 py-1 text-[11px] sticky top-[32px] z-20">
                          Sales Value
                        </th>
                      </React.Fragment>
                    );
                  })()}
                </tr>
                <tr className="bg-slate-50 text-slate-900 uppercase tracking-wider font-black border-b border-slate-200 select-none text-[10px]">
                  {salesMonths.length > 0 && (() => {
                    const month = salesMonths[selectedMonthIndex];
                    const groupMetrics = [
                      { key: 'unitsTarget', label: 'Target', minW: 'min-w-[50px]' },
                      { key: 'unitsActual', label: 'Actual', minW: 'min-w-[50px]' },
                      { key: 'rateTarget', label: 'Target', minW: 'min-w-[70px]' },
                      { key: 'rateActual', label: 'Actual', minW: 'min-w-[70px]' },
                      { key: 'areaTarget', label: 'Target', minW: 'min-w-[60px]' },
                      { key: 'areaActual', label: 'Actual', minW: 'min-w-[60px]' },
                      { key: 'salesValueTarget', label: 'Target', minW: 'min-w-[65px]' },
                      { key: 'salesValueActual', label: 'Actual', minW: 'min-w-[65px]' }
                    ];
                    const totalMetrics = [
                      { key: 'periodTotalUnitsTarget', label: 'Target', minW: 'min-w-[50px]' },
                      { key: 'periodTotalUnitsActual', label: 'Actual', minW: 'min-w-[50px]' },
                      { key: 'periodTotalRateTarget', label: 'Target', minW: 'min-w-[70px]' },
                      { key: 'periodTotalRateActual', label: 'Actual', minW: 'min-w-[70px]' },
                      { key: 'periodTotalAreaTarget', label: 'Target', minW: 'min-w-[60px]' },
                      { key: 'periodTotalAreaActual', label: 'Actual', minW: 'min-w-[60px]' },
                      { key: 'periodTotalValueTarget', label: 'Target', minW: 'min-w-[65px]' },
                      { key: 'periodTotalValueActual', label: 'Actual', minW: 'min-w-[65px]' }
                    ];
                    return (
                      <>
                        {groupMetrics.map((metric, mIdx) => {
                          const fieldKey = `${month}_${metric.key}`;
                          const isGroupEnd = mIdx % 2 === 1;
                          const isLastMetric = mIdx === groupMetrics.length - 1;
                          return (
                            <th
                              key={fieldKey}
                              onClick={() => requestSort(fieldKey)}
                              className={`bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors ${metric.minW} ${isLastMetric ? 'border-r-2 border-slate-300' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'} sticky top-[56px] z-20 text-[10px]`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                {metric.label}
                                <ArrowUpDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                              </div>
                            </th>
                          );
                        })}
                        {totalMetrics.map((metric, mIdx) => {
                          const isGroupEnd = mIdx % 2 === 1;
                          const isLastMetric = mIdx === totalMetrics.length - 1;
                          return (
                            <th
                              key={metric.key}
                              onClick={() => requestSort(metric.key)}
                              className={`bg-slate-50 px-1 py-1.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors ${metric.minW} ${isLastMetric ? 'border-r-2 border-slate-300' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'} sticky top-[56px] z-20 text-[10px]`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                {metric.label}
                                <ArrowUpDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
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

          <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold text-[11px]">
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
                      className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[11px]"
                    >
                      <td
                        onClick={() => handleRowClick(p.name)}
                        className="px-2 py-2 font-bold text-slate-700 group-hover:text-nyati-navy min-w-[140px] cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                           <span className="truncate">{p.name}</span>
                          {renderTypeBadge(p.type)}
                        </div>
                      </td>
                      <td className="px-1 py-2 text-center font-semibold text-slate-700">
                        {p.budgetUnits.toLocaleString('en-IN')}
                      </td>
                      <td className="px-1 py-2 text-center font-bold text-nyati-navy border-r-2 border-slate-300">
                        {p.soldToDate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-1 py-2 text-right font-semibold text-slate-700">
                        ₹{Math.round(p.budgetRate).toLocaleString('en-IN')}/sf
                      </td>
                      <td className="px-1 py-2 text-right font-bold text-nyati-navy border-r-2 border-slate-300">
                        {p.actualRate > 0 ? `₹${Math.round(p.actualRate).toLocaleString('en-IN')}/sf` : '-'}
                      </td>
                      <td className="px-1 py-2 text-right font-semibold text-slate-700">
                        {Math.round(p.budgetArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-1 py-2 text-right font-bold text-slate-700 border-r-2 border-slate-300">
                        {Math.round(p.actualArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-1 py-2 text-right font-semibold text-slate-700">
                        ₹{p.budgetValCr.toFixed(2)} Cr
                      </td>
                      <td className="px-1.5 py-2 text-right font-bold text-slate-700 border-r-2 border-slate-300">
                        ₹{p.actualValCr.toFixed(2)} Cr
                      </td>
                      {(() => {
                        const totalUnitsTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.unitsTarget || 0), 0);
                        const totalUnitsActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.unitsActual || 0), 0);

                        const totalValueTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.salesValueTarget || 0), 0);
                        const totalAreaTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.areaTarget || 0), 0);
                        const totalRateTarget = totalAreaTarget > 0 ? totalValueTarget / totalAreaTarget : 0;

                        const totalValueActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.salesValueActual || 0), 0);
                        const totalAreaActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.areaActual || 0), 0);
                        const totalRateActual = totalAreaActual > 0 ? totalValueActual / totalAreaActual : 0;

                        return (
                          <>
                            {/* Units */}
                            <td className="px-1 py-2 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                              {totalUnitsTarget.toLocaleString('en-IN')}
                            </td>
                            <td className="px-1 py-2 text-center font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5">
                              {totalUnitsActual.toLocaleString('en-IN')}
                            </td>
                            {/* Rate */}
                            <td className="px-1 py-2 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                              {formatCellVal(totalRateTarget, 'rate')}
                            </td>
                            <td className="px-1 py-2 text-right font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5">
                              {formatCellVal(totalRateActual, 'rate')}
                            </td>
                            {/* Area */}
                            <td className="px-1 py-2 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                              {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                            </td>
                            <td className="px-1 py-2 text-right font-bold text-slate-700 border-r-2 border-slate-200 bg-slate-50/5">
                              {Math.round(totalAreaActual).toLocaleString('en-IN')}
                            </td>
                            {/* Sales Value */}
                            <td className="px-1 py-2 text-right font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                              ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-1.5 py-2 text-right font-bold text-slate-700 bg-slate-50/5">
                              ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                            </td>
                          </>
                        );
                      })()}
                    </motion.tr>
                  ))
                ) : (
                  // Excel-aligned Month Group Row Rendering - Render Only Selected Month
                  sortedProjects.map((p, index) => (
                    <tr
                      key={p.name}
                      className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[11px] border-b border-slate-100"
                    >
                      <td
                        onClick={() => handleRowClick(p.name)}
                        className="px-2 py-2 font-bold text-slate-700 group-hover:text-nyati-navy sticky left-0 bg-white group-hover:bg-sky-50 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 min-w-[140px] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1.5 truncate">
                          <span className="truncate">{p.name}</span>
                          {renderTypeBadge(p.type)}
                        </div>
                      </td>
                      {salesMonths.length > 0 && (() => {
                        const month = salesMonths[selectedMonthIndex];
                        const mData = p.monthlyData?.[month] || {};
                        return (
                          <>
                            {metrics.map((metric, mIdx) => {
                              const val = mData[metric.key];
                              const isLastMetric = mIdx === metrics.length - 1;
                              const isGroupEnd = mIdx % 2 === 1;
                              const isActual = metric.key.toLowerCase().includes('actual');
                              return (
                                <td
                                  key={`${month}_${metric.key}`}
                                  className={`px-1 py-2 text-center ${isActual ? 'font-bold text-nyati-navy' : 'font-semibold text-slate-700'} ${isLastMetric ? 'border-r-2 border-slate-300 bg-slate-50/5' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'}`}
                                >
                                  {formatCellVal(val, metric.format)}
                                </td>
                              );
                            })}
                            {(() => {
                              const totalUnitsTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.unitsTarget || 0), 0);
                              const totalUnitsActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.unitsActual || 0), 0);

                              const totalValueTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.salesValueTarget || 0), 0);
                              const totalAreaTarget = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.areaTarget || 0), 0);
                              const totalRateTarget = totalAreaTarget > 0 ? totalValueTarget / totalAreaTarget : 0;

                              const totalValueActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.salesValueActual || 0), 0);
                              const totalAreaActual = salesMonths.reduce((sum, m) => sum + (p.monthlyData?.[m]?.areaActual || 0), 0);
                              const totalRateActual = totalAreaActual > 0 ? totalValueActual / totalAreaActual : 0;

                              return (
                                <>
                                  {/* Units */}
                                  <td className="px-1 py-2 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                                    {totalUnitsTarget.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-1 py-2 text-center font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5">
                                    {totalUnitsActual.toLocaleString('en-IN')}
                                  </td>
                                  {/* Rate */}
                                  <td className="px-1 py-2 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                                    {formatCellVal(totalRateTarget, 'rate')}
                                  </td>
                                  <td className="px-1 py-2 text-center font-bold text-nyati-navy border-r-2 border-slate-200 bg-slate-50/5">
                                    {formatCellVal(totalRateActual, 'rate')}
                                  </td>
                                  {/* Area */}
                                  <td className="px-1 py-2 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                                    {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-1 py-2 text-center font-bold text-slate-700 border-r-2 border-slate-200 bg-slate-50/5">
                                    {Math.round(totalAreaActual).toLocaleString('en-IN')}
                                  </td>
                                  {/* Sales Value */}
                                  <td className="px-1 py-2 text-center font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/5">
                                    ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                                  </td>
                                  <td className="px-1.5 py-2 text-center font-bold text-nyati-navy bg-slate-50/5">
                                    ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                                  </td>
                                </>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}

                {/* Grand Total Row */}
                {!showMonthlyColumns ? (
                  <tr className="bg-slate-50 font-bold text-nyati-navy border-t-2 border-slate-200 text-[11px] sticky bottom-0 z-10 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                    <td className="px-2 py-2 bg-slate-50">GRAND TOTAL</td>
                    <td className="px-1 py-2 text-center bg-slate-50">
                      {totals.budgetUnits.toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300">
                      {totals.soldToDate.toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50">
                      ₹{Math.round(totals.budgetRate).toLocaleString('en-IN')}/sf
                    </td>
                    <td className="px-1 py-2 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300">
                      ₹{Math.round(totals.actualRate).toLocaleString('en-IN')}/sf
                    </td>
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50">
                      {Math.round(totals.budgetArea).toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50 border-r-2 border-slate-300">
                      {Math.round(totals.actualArea).toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50">
                      ₹{totals.budgetValCr.toFixed(2)} Cr
                    </td>
                    <td className="px-1.5 py-2 text-right text-slate-700 font-extrabold bg-slate-50 border-r-2 border-slate-300">
                      ₹{totals.actualValCr.toFixed(2)} Cr
                    </td>
                    {/* Units */}
                    <td className="px-1 py-2 text-center text-slate-700 bg-slate-50 border-r border-slate-100">
                      {periodGrandTotals.unitsTarget.toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200">
                      {periodGrandTotals.unitsActual.toLocaleString('en-IN')}
                    </td>
                    {/* Rate */}
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50 border-r border-slate-100">
                      {formatCellVal(periodGrandTotals.rateTarget, 'rate')}
                    </td>
                    <td className="px-1 py-2 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200">
                      {formatCellVal(periodGrandTotals.rateActual, 'rate')}
                    </td>
                    {/* Area */}
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50 border-r border-slate-100">
                      {Math.round(periodGrandTotals.areaTarget).toLocaleString('en-IN')}
                    </td>
                    <td className="px-1 py-2 text-right text-slate-700 font-extrabold bg-slate-50 border-r-2 border-slate-200">
                      {Math.round(periodGrandTotals.areaActual).toLocaleString('en-IN')}
                    </td>
                    {/* Sales Value */}
                    <td className="px-1 py-2 text-right text-slate-700 bg-slate-50 border-r border-slate-100">
                      ₹{(periodGrandTotals.valueTarget / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="px-1.5 py-2 text-right text-slate-700 font-extrabold bg-slate-50">
                      ₹{(periodGrandTotals.valueActual / 10000000).toFixed(2)} Cr
                    </td>
                  </tr>
                ) : (
                  <tr className="bg-slate-100 font-extrabold text-nyati-navy border-t-2 border-slate-200 text-[11px] sticky bottom-0 z-20 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                    <td className="px-2 py-2 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200">
                      GRAND TOTAL
                    </td>
                    {salesMonths.length > 0 && (() => {
                      const month = salesMonths[selectedMonthIndex];
                      return (
                        <>
                          {metrics.map((metric, mIdx) => {
                            const isLastMetric = mIdx === metrics.length - 1;
                            const isGroupEnd = mIdx % 2 === 1;
                            let totalVal = 0;
                            if (metric.format === 'rate') {
                              const type = metric.key.toLowerCase().includes('target') ? 'Target' : 'Actual';
                              totalVal = getMonthlyRateTotal(month, type);
                            } else {
                              totalVal = getMonthlyTotal(month, metric.key);
                            }
                            return (
                              <td
                                key={`total_${month}_${metric.key}`}
                                className={`px-1 py-2 text-center font-black ${isLastMetric ? 'border-r-2 border-slate-300' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'}`}
                              >
                                {formatCellVal(totalVal, metric.format)}
                              </td>
                            );
                          })}
                          {/* Units */}
                          <td className="px-1 py-2 text-center font-black border-r border-slate-100 bg-slate-100">
                            {periodGrandTotals.unitsTarget.toLocaleString('en-IN')}
                          </td>
                          <td className="px-1 py-2 text-center font-black border-r-2 border-slate-200 bg-slate-100">
                            {periodGrandTotals.unitsActual.toLocaleString('en-IN')}
                          </td>
                          {/* Rate */}
                          <td className="px-1 py-2 text-center font-black border-r border-slate-100 bg-slate-100">
                            {formatCellVal(periodGrandTotals.rateTarget, 'rate')}
                          </td>
                          <td className="px-1 py-2 text-center font-black border-r-2 border-slate-200 bg-slate-100">
                            {formatCellVal(periodGrandTotals.rateActual, 'rate')}
                          </td>
                          {/* Area */}
                          <td className="px-1 py-2 text-center font-black border-r border-slate-100 bg-slate-100">
                            {Math.round(periodGrandTotals.areaTarget).toLocaleString('en-IN')}
                          </td>
                          <td className="px-1 py-2 text-center font-black border-r-2 border-slate-200 bg-slate-100">
                            {Math.round(periodGrandTotals.areaActual).toLocaleString('en-IN')}
                          </td>
                          {/* Sales Value */}
                          <td className="px-1 py-2 text-center font-black border-r border-slate-100 bg-slate-100">
                            ₹{(periodGrandTotals.valueTarget / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="px-1.5 py-2 text-center font-black bg-slate-100">
                            ₹{(periodGrandTotals.valueActual / 10000000).toFixed(2)} Cr
                          </td>
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
