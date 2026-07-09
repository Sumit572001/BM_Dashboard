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

  // Column visibility states & helper
  const [salesTab, setSalesTab] = useState('all'); // 'all' | 'unit' | 'value' | 'collection'

  const showUnits = salesTab === 'all' || salesTab === 'unit';
  const showRate = salesTab === 'all' || salesTab === 'value';
  const showArea = salesTab === 'all' || salesTab === 'value';
  const showValue = salesTab === 'all' || salesTab === 'value';
  const showCollection = salesTab === 'all' || salesTab === 'collection';

  const periodColSpan = (showUnits ? 2 : 0) + (showRate ? 2 : 0) + (showArea ? 2 : 0) + (showValue ? 2 : 0) + (showCollection ? 2 : 0);

  const getCellStyle = (visible) => ({
    width: visible ? '' : '0px',
    minWidth: visible ? '' : '0px',
    maxWidth: visible ? '' : '0px',
    paddingLeft: visible ? '' : '0px',
    paddingRight: visible ? '' : '0px',
    paddingTop: visible ? '' : '0px',
    paddingBottom: visible ? '' : '0px',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRightWidth: visible ? '' : '0px',
    borderLeftWidth: visible ? '' : '0px',
    borderTopWidth: visible ? '' : '0px',
    borderBottomWidth: visible ? '' : '0px',
  });

  const isMetricVisible = (key) => {
    if (!key) return true;
    const cleanKey = key.toLowerCase();
    if (cleanKey.includes('unit') || cleanKey.includes('soldtodate')) return showUnits;
    if (cleanKey.includes('rate')) return showRate;
    if (cleanKey.includes('area')) return showArea;
    if (cleanKey.includes('val') || cleanKey.includes('value')) return showValue;
    if (cleanKey.includes('collection')) return showCollection;
    return true;
  };

  const getTabMetricConfig = (tab) => {
    switch (tab) {
      case 'unit':
        return {
          label: 'Units',
          format: 'number',
          getCumulativeTarget: (p) => p.budgetUnits,
          getCumulativeActual: (p) => p.soldToDate,
          periodTargetKey: 'unitsTarget',
          periodActualKey: 'unitsActual',
          bgHeader: 'bg-[#ffff00]',
          textHeader: 'text-black font-extrabold',
          colName: 'UNITS'
        };
      case 'value':
        return {
          label: 'Sales Value',
          format: 'currency',
          getCumulativeTarget: (p) => p.budgetValCr,
          getCumulativeActual: (p) => p.actualValCr,
          periodTargetKey: 'salesValueTarget',
          periodActualKey: 'salesValueActual',
          bgHeader: 'bg-[#fabf8f]',
          textHeader: 'text-black font-extrabold',
          colName: 'VALUE-WISE'
        };
      case 'collection':
        return {
          label: 'Collection',
          format: 'currency',
          getCumulativeTarget: (p) => p.budgetCollection || 0,
          getCumulativeActual: (p) => p.actualCollection || 0,
          periodTargetKey: 'collectionTarget',
          periodActualKey: 'collectionActual',
          bgHeader: 'bg-[#ccc1ff]',
          textHeader: 'text-black font-extrabold',
          colName: 'COLLECTION'
        };
      default:
        return null;
    }
  };

  const getVarianceVal = (achieved, target) => {
    return achieved - target;
  };

  const formatVarianceVal = (val, format) => {
    if (format === 'currency') {
      const scaledVal = val / 10000000;
      return `${scaledVal >= 0 ? '+' : ''}₹${scaledVal.toFixed(2)} Cr`;
    }
    return `${val >= 0 ? '+' : ''}${val.toLocaleString('en-IN')}`;
  };

  const formatVarianceValCr = (val, format) => {
    if (format === 'currency') {
      return `${val >= 0 ? '+' : ''}₹${val.toFixed(2)} Cr`;
    }
    return `${val >= 0 ? '+' : ''}${Math.round(val).toLocaleString('en-IN')}`;
  };

  const getPercentageVal = (achieved, target) => {
    if (target === 0) {
      return achieved > 0 ? 100 : 0;
    }
    return Math.round((achieved / target) * 100);
  };

  const getFullMonthName = (monthStr) => {
    if (!monthStr) return '';
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
    if (selectedPeriod && !selectedPeriod.startsWith('Q') && selectedPeriod !== 'All') {
      return getFullMonthName(selectedPeriod);
    }

    const activeQs = filters?.selectedQuarters || [];
    if (activeQs.length > 0 && activeQs.length < 4) {
      return [...activeQs].sort().join(' + ');
    }

    if (selectedPeriod && selectedPeriod.startsWith('Q')) {
      return selectedPeriod;
    }

    return 'All Quarters';
  };

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
    const qMonths = {
      'Q1': ['Apr-26', 'May-26', 'Jun-26'],
      'Q2': ['Jul-26', 'Aug-26', 'Sep-26'],
      'Q3': ['Oct-26', 'Nov-26', 'Dec-26'],
      'Q4': ['Jan-27', 'Feb-27', 'Mar-27']
    };

    if (period && !period.startsWith('Q') && period !== 'Selected' && period !== 'All') {
      return [period];
    } else if (period && period.startsWith('Q') && period !== 'Selected') {
      return qMonths[period] || [];
    } else {
      const activeQs = filters?.selectedQuarters && filters.selectedQuarters.length > 0
        ? filters.selectedQuarters
        : ['Q1', 'Q2', 'Q3', 'Q4'];
      let months = [];
      activeQs.forEach(q => {
        if (qMonths[q]) {
          months = [...months, ...qMonths[q]];
        }
      });
      return months;
    }
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
    { key: 'salesValueActual', label: 'Value Actual', format: 'currency' },
    { key: 'collectionTarget', label: 'Collection Target', format: 'currency' },
    { key: 'collectionActual', label: 'Collection Actual', format: 'currency' }
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
          "NYATI PLAZA",
          "NYATI ENTHRAL I",
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
    if (sortField.includes('_cum') || sortField.includes('_period')) {
      const parts = sortField.split('_');
      const tab = parts[0];
      const type = parts[1];
      const config = getTabMetricConfig(tab);
      if (config) {
        if (type.startsWith('cum')) {
          const getterT = config.getCumulativeTarget;
          const getterA = config.getCumulativeActual;
          if (type === 'cumTarget') {
            valA = getterT(a) || 0;
            valB = getterT(b) || 0;
          } else if (type === 'cumAchieved') {
            valA = getterA(a) || 0;
            valB = getterA(b) || 0;
          } else if (type === 'cumVariance') {
            valA = getVarianceVal(getterA(a) || 0, getterT(a) || 0);
            valB = getVarianceVal(getterA(b) || 0, getterT(b) || 0);
          } else if (type === 'cumPercentage') {
            valA = getPercentageVal(getterA(a) || 0, getterT(a) || 0);
            valB = getPercentageVal(getterA(b) || 0, getterT(b) || 0);
          }
        } else {
          const pT = getPeriodVal(a, selectedPeriod, config.periodTargetKey, config.format);
          const pA = getPeriodVal(a, selectedPeriod, config.periodActualKey, config.format);
          const pT_b = getPeriodVal(b, selectedPeriod, config.periodTargetKey, config.format);
          const pA_b = getPeriodVal(b, selectedPeriod, config.periodActualKey, config.format);
          if (type === 'periodTarget') {
            valA = pT;
            valB = pT_b;
          } else if (type === 'periodAchieved') {
            valA = pA;
            valB = pA_b;
          } else if (type === 'periodVariance') {
            valA = getVarianceVal(pA, pT);
            valB = getVarianceVal(pA_b, pT_b);
          } else if (type === 'periodPercentage') {
            valA = getPercentageVal(pA, pT);
            valB = getPercentageVal(pA_b, pT_b);
          }
        }
      }
    } else if (sortField.startsWith('periodTotal')) {
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
      } else if (metricKey.startsWith('collection')) {
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

  // Color actual column based on % achievement vs target
  // 0-50% → red, 51-79% → yellow/warning, 80%+ → green
  const getActualColor = (actual, target) => {
    const pct = target > 0 ? (actual / target) * 100 : (actual > 0 ? 100 : 0);
    if (pct <= 50) return 'text-red-600 font-extrabold bg-red-50 border border-red-200';
    if (pct <= 79) return 'text-amber-600 font-bold bg-amber-50 border border-amber-200';
    return 'text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200';
  };

  // Keep alias for sales value
  const getSalesValueColor = getActualColor;

  // Color percentage column based on value
  // 0-50% → red, 51-79% → yellow/warning, 80%+ → green
  const getPercentColor = (pct) => {
    const num = parseFloat(pct);
    if (isNaN(num)) return 'text-black';
    if (num <= 50) return 'text-red-600 font-extrabold bg-red-50 border border-red-200';
    if (num <= 79) return 'text-amber-600 font-bold bg-amber-50 border border-amber-200';
    return 'text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200';
  };

  const activeQ = getActiveQuarter();

  const visibleProjects = React.useMemo(() => {
    return sortedProjects.filter(p => !p.name.trim().toUpperCase().includes('OLD PROJECT'));
  }, [sortedProjects]);

  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100">

      {/* Card Header */}
      <div className="bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-nyati-navy text-lg">Project-Wise Sales Summary</h3>
          </div>
          
          {/* Section view switcher: All, Unit, Value, Collection */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold select-none shrink-0 shadow-inner">
            {[
              { id: 'all', label: 'All' },
              { id: 'unit', label: 'Unit' },
              { id: 'value', label: 'Value' },
              { id: 'collection', label: 'Collection' }
            ].map(tab => {
              const isActive = salesTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSalesTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${isActive
                    ? 'bg-nyati-navy text-white shadow-sm font-black'
                    : 'text-black/60 hover:text-black hover:bg-white/30'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {showMonthlyColumns && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-black text-sm font-extrabold select-none">Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-1.5 text-sm font-black text-nyati-navy focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="Selected">
                    {filters?.selectedQuarters?.length === 4 || filters?.selectedQuarters?.length === 0
                      ? 'All Quarters'
                      : `Selected (${[...(filters?.selectedQuarters || [])].sort().join(' + ')})`}
                  </option>
                  {(filters?.selectedQuarters || ['Q1', 'Q2', 'Q3', 'Q4']).includes('Q1') && (
                    <optgroup label="Q1">
                      <option value="Q1">Q1 (Apr - Jun)</option>
                      <option value="Apr-26">Apr-26</option>
                      <option value="May-26">May-26</option>
                      <option value="Jun-26">Jun-26</option>
                    </optgroup>
                  )}
                  {(filters?.selectedQuarters || ['Q1', 'Q2', 'Q3', 'Q4']).includes('Q2') && (
                    <optgroup label="Q2">
                      <option value="Q2">Q2 (Jul - Sep)</option>
                      <option value="Jul-26">Jul-26</option>
                      <option value="Aug-26">Aug-26</option>
                      <option value="Sep-26">Sep-26</option>
                    </optgroup>
                  )}
                  {(filters?.selectedQuarters || ['Q1', 'Q2', 'Q3', 'Q4']).includes('Q3') && (
                    <optgroup label="Q3">
                      <option value="Q3">Q3 (Oct - Dec)</option>
                      <option value="Oct-26">Oct-26</option>
                      <option value="Nov-26">Nov-26</option>
                      <option value="Dec-26">Dec-26</option>
                    </optgroup>
                  )}
                  {(filters?.selectedQuarters || ['Q1', 'Q2', 'Q3', 'Q4']).includes('Q4') && (
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
        <table ref={tableRef} className="w-full text-left text-[15px] text-black border-collapse">
          <thead>
            {salesTab === 'all' ? (
              !showMonthlyColumns ? (
                // Original Summary View Headers (Grouped like Excel)
                <>
                  <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                    <th
                      rowSpan={3}
                      className="bg-nyati-navy text-white px-3 py-3 w-[260px] min-w-[260px] max-w-[260px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-white/20 text-center text-[15px]"
                    >
                      <div className="flex items-center justify-center h-full text-white font-black text-[15px]">
                        Project Name
                      </div>
                    </th>
                    <th colSpan={2} rowSpan={2} className="bg-[#ffff00] text-black text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(showUnits)}>
                      Units
                    </th>
                    <th colSpan={2} rowSpan={2} className="bg-[#8db4e2] text-black text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(showRate)}>
                      Rate
                    </th>
                    <th colSpan={2} rowSpan={2} className="bg-[#c4d79b] text-black text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(showArea)}>
                      Area
                    </th>
                    <th colSpan={2} rowSpan={2} className="bg-[#fabf8f] text-black text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(showValue)}>
                      Sales Value
                    </th>
                    <th colSpan={2} rowSpan={2} className="bg-[#ccc1ff] text-black text-center font-black border-r-2 border-slate-300 py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(showCollection)}>
                      Collection
                    </th>
                    <th colSpan={periodColSpan} className="bg-nyati-navy text-white text-center font-black py-2 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(periodColSpan > 0)}>
                      Total{getQuarterText()}
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                    <th colSpan={2} className="bg-[#ffff00] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showUnits)}>
                      Units
                    </th>
                    <th colSpan={2} className="bg-[#8db4e2] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showRate)}>
                      Rate
                    </th>
                    <th colSpan={2} className="bg-[#c4d79b] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showArea)}>
                      Area
                    </th>
                    <th colSpan={2} className="bg-[#fabf8f] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showValue)}>
                      Sales Value
                    </th>
                    <th colSpan={2} className="bg-[#ccc1ff] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showCollection)}>
                      Collection
                    </th>
                  </tr>
                  <tr className="bg-nyati-navy text-white uppercase tracking-wider font-black border-b border-white/20 select-none text-[14px]">
                    <th onClick={() => requestSort('budgetUnits')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r border-white/20 sticky top-[64px] z-20" style={getCellStyle(showUnits)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('soldToDate')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r-2 border-white/30 sticky top-[64px] z-20" style={getCellStyle(showUnits)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('budgetRate')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[90px] border-r border-white/20 sticky top-[64px] z-20" style={getCellStyle(showRate)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('actualRate')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[90px] border-r-2 border-white/30 sticky top-[64px] z-20" style={getCellStyle(showRate)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('budgetArea')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[80px] border-r border-white/20 sticky top-[64px] z-20" style={getCellStyle(showArea)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('actualArea')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[80px] border-r-2 border-white/30 sticky top-[64px] z-20" style={getCellStyle(showArea)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('budgetValCr')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[85px] border-r border-white/20 sticky top-[64px] z-20" style={getCellStyle(showValue)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('actualValCr')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[85px] border-r-2 border-white/30 sticky top-[64px] z-20" style={getCellStyle(showValue)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('budgetCollection')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[85px] border-r border-white/20 sticky top-[64px] z-20" style={getCellStyle(showCollection)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('actualCollection')} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[85px] border-r-2 border-white/30 sticky top-[64px] z-20" style={getCellStyle(showCollection)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalUnitsTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[64px] z-20" style={getCellStyle(showUnits)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalUnitsActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r-2 border-slate-200 sticky top-[64px] z-20" style={getCellStyle(showUnits)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalRateTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r border-slate-100 sticky top-[64px] z-20" style={getCellStyle(showRate)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalRateActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[90px] border-r-2 border-slate-200 sticky top-[64px] z-20" style={getCellStyle(showRate)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalAreaTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r border-slate-100 sticky top-[64px] z-20" style={getCellStyle(showArea)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalAreaActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[80px] border-r-2 border-slate-200 sticky top-[64px] z-20" style={getCellStyle(showArea)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalValueTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r border-slate-100 sticky top-[64px] z-20" style={getCellStyle(showValue)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalValueActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r-2 border-slate-200 sticky top-[64px] z-20" style={getCellStyle(showValue)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalCollectionTarget')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] border-r border-slate-100 sticky top-[64px] z-20" style={getCellStyle(showCollection)}>
                      <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                    <th onClick={() => requestSort('periodTotalCollectionActual')} className="bg-slate-50 px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[85px] sticky top-[64px] z-20" style={getCellStyle(showCollection)}>
                      <div className="flex items-center justify-center gap-0.5">Actual <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                    </th>
                  </tr>
                </>
              ) : (
                // Original Month Group Headers
                <>
                  <tr className="bg-nyati-navy text-white uppercase font-black border-b border-white/20 select-none text-[15px]">
                    <th
                      rowSpan={3}
                      className="bg-nyati-navy text-white px-3 py-3 w-[260px] min-w-[260px] max-w-[260px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-white/20 text-center text-[15px]"
                    >
                      <div className="flex items-center justify-center h-full text-white font-black text-[15px]">
                        Project Name
                      </div>
                    </th>
                    <th colSpan={periodColSpan} className="bg-nyati-navy text-white text-center font-black py-2 border-b border-white/20 text-[15px] tracking-wider sticky top-0 z-20" style={getCellStyle(periodColSpan > 0)}>
                      TOTAL - {getLabel().toUpperCase()}
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                    <th colSpan={2} className="bg-[#ffff00] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showUnits)}>
                      Units
                    </th>
                    <th colSpan={2} className="bg-[#8db4e2] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showRate)}>
                      Rate
                    </th>
                    <th colSpan={2} className="bg-[#c4d79b] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showArea)}>
                      Area
                    </th>
                    <th colSpan={2} className="bg-[#fabf8f] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showValue)}>
                      Sales Value
                    </th>
                    <th colSpan={2} className="bg-[#ccc1ff] text-black text-center font-black border-r-2 border-slate-300 py-1.5 text-[15px] sticky top-[36px] z-20" style={getCellStyle(showCollection)}>
                      Collection
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-black uppercase tracking-wider font-black border-b border-slate-200 select-none text-[14px]">
                    {(() => {
                      const totalMetrics = [
                        { key: 'unitsTarget', label: 'Target', minW: 'min-w-[70px]', sortKey: 'periodTotalUnitsTarget' },
                        { key: 'unitsActual', label: 'Actual', minW: 'min-w-[70px]', sortKey: 'periodTotalUnitsActual' },
                        { key: 'rateTarget', label: 'Target', minW: 'min-w-[90px]', sortKey: 'periodTotalRateTarget' },
                        { key: 'rateActual', label: 'Actual', minW: 'min-w-[90px]', sortKey: 'periodTotalRateActual' },
                        { key: 'areaTarget', label: 'Target', minW: 'min-w-[80px]', sortKey: 'periodTotalAreaTarget' },
                        { key: 'areaActual', label: 'Actual', minW: 'min-w-[80px]', sortKey: 'periodTotalAreaActual' },
                        { key: 'salesValueTarget', label: 'Target', minW: 'min-w-[85px]', sortKey: 'periodTotalValueTarget' },
                        { key: 'salesValueActual', label: 'Actual', minW: 'min-w-[85px]', sortKey: 'periodTotalValueActual' },
                        { key: 'collectionTarget', label: 'Target', minW: 'min-w-[85px]', sortKey: 'periodTotalCollectionTarget' },
                        { key: 'collectionActual', label: 'Actual', minW: 'min-w-[85px]', sortKey: 'periodTotalCollectionActual' }
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
                                className={`bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors ${metric.minW} ${isLastMetric ? 'border-r-2 border-white/30' : isGroupEnd ? 'border-r-2 border-white/30' : 'border-r border-white/20'} sticky top-[64px] z-20 text-[14px]`}
                                style={getCellStyle(isMetricVisible(metric.key))}
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
              )
            ) : (() => {
              const config = getTabMetricConfig(salesTab);
              if (!config) return null;
              if (!showMonthlyColumns) {
                // Summary columns view detailed layout
                return (
                  <>
                    <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                      <th
                        rowSpan={3}
                        className="bg-nyati-navy text-white px-3 py-3 w-[260px] min-w-[260px] max-w-[260px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-white/20 text-center text-[15px]"
                      >
                        <div className="flex items-center justify-center h-full text-white font-black text-[15px]">
                          Project Name
                        </div>
                      </th>
                      <th colSpan={4} rowSpan={2} className={`${config.bgHeader} ${config.textHeader} text-center py-2 text-[15px] tracking-wider sticky top-0 z-20 border-r-2 border-slate-300`}>
                        {config.colName} - CUMULATIVE
                      </th>
                      <th colSpan={4} className="bg-nyati-navy text-white text-center font-black py-2 text-[15px] tracking-wider sticky top-0 z-20">
                        TOTAL - {getLabel().toUpperCase()}
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                      <th colSpan={4} className={`${config.bgHeader} ${config.textHeader} text-center py-1.5 text-[15px] sticky top-[36px] z-20 border-r-2 border-slate-300`}>
                        {config.colName} - PERIODIC
                      </th>
                    </tr>
                    <tr className="bg-nyati-navy text-white uppercase tracking-wider font-black border-b border-white/20 select-none text-[14px]">
                      {/* Cumulative Subheaders */}
                      <th onClick={() => requestSort(`${salesTab}_cumTarget`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_cumAchieved`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Achieved <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_cumVariance`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[75px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Variance <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_cumPercentage`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[65px] border-r-2 border-white/30 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">% <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      {/* Periodic Subheaders */}
                      <th onClick={() => requestSort(`${salesTab}_periodTarget`)} className="bg-slate-50 text-black px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodAchieved`)} className="bg-slate-50 text-black px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[70px] border-r border-slate-100 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Achieved <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodVariance`)} className="bg-slate-50 text-black px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[75px] border-r border-slate-100 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Variance <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodPercentage`)} className="bg-slate-50 text-black px-2 py-2.5 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[65px] sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">% <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                    </tr>
                  </>
                );
              } else {
                // Monthly columns view detailed layout
                return (
                  <>
                    <tr className="bg-nyati-navy text-white uppercase font-black border-b border-white/20 select-none text-[15px]">
                      <th
                        rowSpan={3}
                        className="bg-nyati-navy text-white px-3 py-3 w-[260px] min-w-[260px] max-w-[260px] sticky left-0 top-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-white/20 text-center text-[15px]"
                      >
                        <div className="flex items-center justify-center h-full text-white font-black text-[15px]">
                          Project Name
                        </div>
                      </th>
                      <th colSpan={4} className="bg-nyati-navy text-white text-center font-black py-2 border-b border-white/20 text-[15px] tracking-wider sticky top-0 z-20">
                        TOTAL - {getLabel().toUpperCase()}
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-black uppercase font-black border-b border-slate-100 select-none text-[15px]">
                      <th colSpan={4} className={`${config.bgHeader} ${config.textHeader} text-center py-1.5 text-[15px] sticky top-[36px] z-20 border-r-2 border-slate-300`}>
                        {config.colName}
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-black uppercase tracking-wider font-black border-b border-slate-200 select-none text-[14px]">
                      <th onClick={() => requestSort(`${salesTab}_periodTarget`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Target <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodAchieved`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[70px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Achieved <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodVariance`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[75px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">Variance <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                      <th onClick={() => requestSort(`${salesTab}_periodPercentage`)} className="bg-nyati-navy text-white px-2 py-2.5 text-center cursor-pointer hover:bg-nyati-navy/80 transition-colors min-w-[65px] border-r border-white/20 sticky top-[64px] z-20">
                        <div className="flex items-center justify-center gap-0.5">% <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
                      </th>
                    </tr>
                  </>
                );
              }
            })()}
          </thead>

          <tbody className="divide-y divide-slate-100 text-black font-semibold text-[15px]">
            {sortedProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={showMonthlyColumns ? (1 + periodColSpan) : (1 + periodColSpan * 2)}
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
                  salesTab === 'all' ? (
                    // Original 10 Columns Row Rendering
                    visibleProjects.map((p, index) => (
                      <motion.tr
                        key={p.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px]"
                      >
                        <td className="px-3 py-1.5 font-normal text-black w-[260px] min-w-[260px] max-w-[260px] text-[14px]">
                          <div className="flex flex-row items-center gap-2 justify-start text-left">
                            <span className="text-black text-[14px] font-semibold whitespace-normal break-words">{p.name}</span>
                            {renderTypeBadge(p.type)}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-center font-semibold text-black text-[15px]" style={getCellStyle(showUnits)}>
                          {p.budgetUnits.toLocaleString('en-IN')}
                        </td>
                        <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showUnits)}>
                          <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(p.soldToDate, p.budgetUnits)}`}>
                            {p.soldToDate.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-black text-[15px]" style={getCellStyle(showRate)}>
                          {p.budgetRate > 0 ? `₹${Math.round(p.budgetRate).toLocaleString('en-IN')}/sf` : '0'}
                        </td>
                        <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showRate)}>
                          <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(p.actualRate, p.budgetRate)}`}>
                            {p.actualRate > 0 ? `₹${Math.round(p.actualRate).toLocaleString('en-IN')}/sf` : '0'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-black text-[15px]" style={getCellStyle(showArea)}>
                          {Math.round(p.budgetArea).toLocaleString('en-IN')}
                        </td>
                        <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showArea)}>
                          <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(p.actualArea, p.budgetArea)}`}>
                            {Math.round(p.actualArea).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold text-black text-[15px]" style={getCellStyle(showValue)}>
                          ₹{p.budgetValCr.toFixed(2)} Cr
                        </td>
                        <td className="px-2 py-1.5 text-center font-bold border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showValue)}>
                          <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getSalesValueColor(p.actualValCr, p.budgetValCr)}`}>
                            ₹{p.actualValCr.toFixed(2)} Cr
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold text-black text-[15px]" style={getCellStyle(showCollection)}>
                          ₹{(p.budgetCollection || 0).toFixed(2)} Cr
                        </td>
                        <td className="px-2 py-1.5 text-center font-bold border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showCollection)}>
                          <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(p.actualCollection, p.budgetCollection)}`}>
                            ₹{(p.actualCollection || 0).toFixed(2)} Cr
                          </span>
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
                          const totalCollectionTarget = getPeriodVal(p, selectedPeriod, 'collectionTarget', 'number');
                          const totalCollectionActual = getPeriodVal(p, selectedPeriod, 'collectionActual', 'number');
                          return (
                            <>
                              <td className="px-2 py-2 text-center font-semibold text-black border-r border-slate-100 bg-slate-50/5 text-[15px]" style={getCellStyle(showUnits)}>
                                {totalUnitsTarget.toLocaleString('en-IN')}
                              </td>
                              <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-200 bg-slate-50/5 text-[15px]" style={getCellStyle(showUnits)}>
                                <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(totalUnitsActual, totalUnitsTarget)}`}>
                                  {totalUnitsActual.toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-black border-r border-slate-100 bg-slate-50/5 text-[15px]" style={getCellStyle(showRate)}>
                                {formatCellVal(totalRateTarget, 'rate')}
                              </td>
                              <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-200 bg-slate-50/5 text-[15px]" style={getCellStyle(showRate)}>
                                <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(totalRateActual, totalRateTarget)}`}>
                                  {formatCellVal(totalRateActual, 'rate')}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-black border-r border-slate-100 bg-slate-50/5 text-[15px]" style={getCellStyle(showArea)}>
                                {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                              </td>
                              <td className="px-2 py-2 text-center font-bold border-r-2 border-slate-200 bg-slate-50/5 text-[15px]" style={getCellStyle(showArea)}>
                                <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(totalAreaActual, totalAreaTarget)}`}>
                                  {Math.round(totalAreaActual).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-right font-semibold text-black border-r border-slate-100 bg-slate-50/5 text-[15px]" style={getCellStyle(showValue)}>
                                ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                              </td>
                              <td className="px-2.5 py-1.5 text-center font-bold bg-slate-50/5 border-r-2 border-slate-200 text-[15px]" style={getCellStyle(showValue)}>
                                <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getSalesValueColor(totalValueActual / 10000000, totalValueTarget / 10000000)}`}>
                                  ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-black border-r border-slate-100 bg-slate-50/5 text-[15px]" style={getCellStyle(showCollection)}>
                                {formatCellVal(totalCollectionTarget, 'currency')}
                              </td>
                              <td className="px-2.5 py-1.5 text-center font-bold bg-slate-50/5 text-[15px]" style={getCellStyle(showCollection)}>
                                <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(totalCollectionActual, totalCollectionTarget)}`}>
                                  {formatCellVal(totalCollectionActual, 'currency')}
                                </span>
                              </td>
                            </>
                          );
                        })()}
                      </motion.tr>
                    ))
                  ) : (
                    // Detailed Tab Row Rendering
                    visibleProjects.map((p, index) => {
                      const config = getTabMetricConfig(salesTab);
                      if (!config) return null;

                      const cumTarget = config.getCumulativeTarget(p);
                      const cumAchieved = config.getCumulativeActual(p);
                      const cumVariance = getVarianceVal(cumAchieved, cumTarget);
                      const cumPercent = getPercentageVal(cumAchieved, cumTarget);

                      const periodTarget = getPeriodVal(p, selectedPeriod, config.periodTargetKey, config.format);
                      const periodAchieved = getPeriodVal(p, selectedPeriod, config.periodActualKey, config.format);
                      const periodVariance = getVarianceVal(periodAchieved, periodTarget);
                      const periodPercent = getPercentageVal(periodAchieved, periodTarget);

                      return (
                        <motion.tr
                          key={p.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px]"
                        >
                          <td className="px-3 py-1.5 font-normal text-black w-[260px] min-w-[260px] max-w-[260px] text-[14px]">
                            <div className="flex flex-row items-center gap-2 justify-start text-left">
                              <span className="text-black text-[14px] font-semibold whitespace-normal break-words">{p.name}</span>
                              {renderTypeBadge(p.type)}
                            </div>
                          </td>

                          {/* Cumulative Section */}
                          <td className="px-2 py-1.5 text-center font-semibold text-black text-[15px]">
                            {config.format === 'currency' ? `₹${cumTarget.toFixed(2)} Cr` : cumTarget.toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-[15px]">
                            <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(cumAchieved, cumTarget)}`}>
                              {config.format === 'currency' ? `₹${cumAchieved.toFixed(2)} Cr` : cumAchieved.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className={`px-2 py-1.5 text-center font-semibold text-[15px] ${cumVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatVarianceValCr(cumVariance, config.format)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-[15px] border-r-2 border-slate-300">
                            <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getPercentColor(cumPercent)}`}>
                              {cumPercent}%
                            </span>
                          </td>

                          {/* Periodic Section */}
                          <td className="px-2 py-1.5 text-center font-semibold text-black text-[15px] bg-slate-50/5">
                            {formatCellVal(periodTarget, config.format)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold bg-slate-50/5 text-[15px]">
                            <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(
                              config.format === 'currency' ? periodAchieved / 10000000 : periodAchieved,
                              config.format === 'currency' ? periodTarget / 10000000 : periodTarget
                            )}`}>
                              {formatCellVal(periodAchieved, config.format)}
                            </span>
                          </td>
                          <td className={`px-2 py-1.5 text-center font-semibold bg-slate-50/5 text-[15px] ${periodVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatVarianceVal(periodVariance, config.format)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold bg-slate-50/5 text-[15px]">
                            <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getPercentColor(periodPercent)}`}>
                              {periodPercent}%
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )
                ) : (
                  salesTab === 'all' ? (
                    // Excel-aligned Month Group Row Rendering
                    visibleProjects.map((p, index) => (
                      <tr
                        key={p.name}
                        className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px] border-b border-slate-100"
                      >
                        <td
                          className="px-3 py-1.5 font-normal text-black sticky left-0 bg-white group-hover:bg-sky-50 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 w-[260px] min-w-[260px] max-w-[260px] transition-colors text-[14px]"
                        >
                          <div className="flex flex-row items-center gap-2 justify-start text-left">
                            <span className="text-black text-[14px] font-semibold whitespace-normal break-words">{p.name}</span>
                            {renderTypeBadge(p.type)}
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
                                const isCurrency = metric.format === 'currency';
                                // For any actual column, get corresponding target
                                const targetKey = metric.key.replace('Actual', 'Target').replace('actual', 'target');
                                const targetVal = isActual ? getPeriodVal(p, selectedPeriod, targetKey, metric.format) : null;
                                return (
                                  <td
                                    key={`total_${selectedPeriod}_${metric.key}`}
                                    className={`px-2 py-2 text-center text-[15px] ${isActual ? '' : 'font-semibold text-black'} ${isLastMetric ? 'border-r-2 border-slate-300 bg-slate-50/5' : isGroupEnd ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'}`}
                                    style={getCellStyle(isMetricVisible(metric.key))}
                                  >
                                    {isActual ? (
                                      <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(
                                        isCurrency ? val / 10000000 : val,
                                        isCurrency ? targetVal / 10000000 : targetVal
                                      )}`}>
                                        {formatCellVal(val, metric.format)}
                                      </span>
                                    ) : (
                                      formatCellVal(val, metric.format)
                                    )}
                                  </td>
                                );
                              })}
                            </>
                          );
                        })()}
                      </tr>
                    ))
                  ) : (
                    // Detailed Tab Month Group Row Rendering
                    visibleProjects.map((p, index) => {
                      const config = getTabMetricConfig(salesTab);
                      if (!config) return null;

                      const periodTarget = getPeriodVal(p, selectedPeriod, config.periodTargetKey, config.format);
                      const periodAchieved = getPeriodVal(p, selectedPeriod, config.periodActualKey, config.format);
                      const periodVariance = getVarianceVal(periodAchieved, periodTarget);
                      const periodPercent = getPercentageVal(periodAchieved, periodTarget);

                      return (
                        <tr
                          key={p.name}
                          className="hover:bg-sky-50/40 group transition-all duration-150 select-none text-[15px] border-b border-slate-100"
                        >
                          <td
                            className="px-3 py-1.5 font-normal text-black sticky left-0 bg-white group-hover:bg-sky-50 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 w-[260px] min-w-[260px] max-w-[260px] transition-colors text-[14px]"
                          >
                            <div className="flex flex-row items-center gap-2 justify-start text-left">
                              <span className="text-black text-[14px] font-semibold whitespace-normal break-words">{p.name}</span>
                              {renderTypeBadge(p.type)}
                            </div>
                          </td>

                          {/* Periodic columns only */}
                          <td className="px-2 py-1.5 text-center font-semibold text-black text-[15px] bg-slate-50/5">
                            {formatCellVal(periodTarget, config.format)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold bg-slate-50/5 text-[15px]">
                            <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getActualColor(
                              config.format === 'currency' ? periodAchieved / 10000000 : periodAchieved,
                              config.format === 'currency' ? periodTarget / 10000000 : periodTarget
                            )}`}>
                              {formatCellVal(periodAchieved, config.format)}
                            </span>
                          </td>
                          <td className={`px-2 py-1.5 text-center font-semibold bg-slate-50/5 text-[15px] ${periodVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatVarianceVal(periodVariance, config.format)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold bg-slate-50/5 text-[15px]">
                             <span className={`px-2 py-0.5 rounded-lg text-[13px] ${getPercentColor(periodPercent)}`}>
                               {periodPercent}%
                             </span>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}

                {/* Grand Total Row */}
                {!showMonthlyColumns ? (
                  salesTab === 'all' ? (
                    <tr className="bg-slate-50 font-bold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-10 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                      <td className="px-3 py-3 bg-slate-50 w-[260px] min-w-[260px] max-w-[260px] text-[15px]">GRAND TOTAL</td>
                      <td className="px-2 py-3 text-center bg-slate-50 text-[15px]" style={getCellStyle(showUnits)}>
                        {totals.budgetUnits.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showUnits)}>
                        {totals.soldToDate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right text-black bg-slate-50 text-[15px]" style={getCellStyle(showRate)}>
                        {totals.budgetRate > 0 ? `₹${Math.round(totals.budgetRate).toLocaleString('en-IN')}/sf` : '0'}
                      </td>
                      <td className="px-2 py-3 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showRate)}>
                        {totals.actualRate > 0 ? `₹${Math.round(totals.actualRate).toLocaleString('en-IN')}/sf` : '0'}
                      </td>
                      <td className="px-2 py-3 text-right text-black bg-slate-50 text-[15px]" style={getCellStyle(showArea)}>
                        {Math.round(totals.budgetArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right text-black bg-slate-50 border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showArea)}>
                        {Math.round(totals.actualArea).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-3 text-right text-black bg-slate-50 text-[15px]" style={getCellStyle(showValue)}>
                        ₹{totals.budgetValCr.toFixed(2)} Cr
                      </td>
                      <td className="px-2 py-3 text-right text-black font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showValue)}>
                        ₹{totals.actualValCr.toFixed(2)} Cr
                      </td>
                      <td className="px-2 py-3 text-right text-black bg-slate-50 text-[15px]" style={getCellStyle(showCollection)}>
                        ₹{(totals.budgetCollection || 0).toFixed(2)} Cr
                      </td>
                      <td className="px-2 py-3 text-right text-black font-extrabold bg-slate-50 border-r-2 border-slate-300 text-[15px]" style={getCellStyle(showCollection)}>
                        ₹{(totals.actualCollection || 0).toFixed(2)} Cr
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
                        const totalCollectionTarget = getPeriodTotalVal(selectedPeriod, 'collectionTarget', 'number');
                        const totalCollectionActual = getPeriodTotalVal(selectedPeriod, 'collectionActual', 'number');
                        return (
                          <>
                            <td className="px-2 py-3 text-center text-black bg-slate-50 border-r border-slate-100 text-[15px]" style={getCellStyle(showUnits)}>
                              {totalUnitsTarget.toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]" style={getCellStyle(showUnits)}>
                              {totalUnitsActual.toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right text-black bg-slate-50 border-r border-slate-100 text-[15px]" style={getCellStyle(showRate)}>
                              {formatCellVal(totalRateTarget, 'rate')}
                            </td>
                            <td className="px-2 py-3 text-right text-nyati-navy font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]" style={getCellStyle(showRate)}>
                              {formatCellVal(totalRateActual, 'rate')}
                            </td>
                            <td className="px-2 py-3 text-right text-black bg-slate-50 border-r border-slate-100 text-[15px]" style={getCellStyle(showArea)}>
                              {Math.round(totalAreaTarget).toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right text-black font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]" style={getCellStyle(showArea)}>
                              {Math.round(totalAreaActual).toLocaleString('en-IN')}
                            </td>
                            <td className="px-2 py-3 text-right text-black bg-slate-50 border-r border-slate-100 text-[15px]" style={getCellStyle(showValue)}>
                              ₹{(totalValueTarget / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-2.5 py-3 text-right text-black font-extrabold bg-slate-50 border-r-2 border-slate-200 text-[15px]" style={getCellStyle(showValue)}>
                              ₹{(totalValueActual / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-2 py-3 text-right text-black bg-slate-50 border-r border-slate-100 text-[15px]" style={getCellStyle(showCollection)}>
                              {formatCellVal(totalCollectionTarget, 'currency')}
                            </td>
                            <td className="px-2.5 py-3 text-right text-black font-extrabold bg-slate-50 text-[15px]" style={getCellStyle(showCollection)}>
                              {formatCellVal(totalCollectionActual, 'currency')}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ) : (() => {
                    const config = getTabMetricConfig(salesTab);
                    if (!config) return null;

                    const cumTarget = config.getCumulativeTarget(totals);
                    const cumAchieved = config.getCumulativeActual(totals);
                    const cumVariance = getVarianceVal(cumAchieved, cumTarget);
                    const cumPercent = getPercentageVal(cumAchieved, cumTarget);

                    const periodTarget = getPeriodTotalVal(selectedPeriod, config.periodTargetKey, config.format);
                    const periodAchieved = getPeriodTotalVal(selectedPeriod, config.periodActualKey, config.format);
                    const periodVariance = getVarianceVal(periodAchieved, periodTarget);
                    const periodPercent = getPercentageVal(periodAchieved, periodTarget);

                    return (
                      <tr className="bg-slate-50 font-bold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-10 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                        <td className="px-3 py-3 bg-slate-50 w-[260px] min-w-[260px] max-w-[260px] text-[15px]">GRAND TOTAL</td>
                        
                        {/* Cumulative Grand Totals */}
                        <td className="px-2 py-3 text-center bg-slate-50 text-[15px]">
                          {config.format === 'currency' ? `₹${cumTarget.toFixed(2)} Cr` : cumTarget.toLocaleString('en-IN')}
                        </td>
                        <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 text-[15px]">
                          {config.format === 'currency' ? `₹${cumAchieved.toFixed(2)} Cr` : cumAchieved.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-2 py-3 text-center font-bold bg-slate-50 text-[15px] ${cumVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatVarianceValCr(cumVariance, config.format)}
                        </td>
                        <td className="px-2 py-3 text-center font-extrabold text-black bg-slate-50 border-r-2 border-slate-300 text-[15px]">
                          {cumPercent}%
                        </td>

                        {/* Periodic Grand Totals */}
                        <td className="px-2 py-3 text-center bg-slate-50 text-[15px]">
                          {formatCellVal(periodTarget, config.format)}
                        </td>
                        <td className="px-2 py-3 text-center text-nyati-navy font-extrabold bg-slate-50 text-[15px]">
                          {formatCellVal(periodAchieved, config.format)}
                        </td>
                        <td className={`px-2 py-3 text-center font-bold bg-slate-50 text-[15px] ${periodVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatVarianceVal(periodVariance, config.format)}
                        </td>
                        <td className="px-2 py-3 text-center font-extrabold text-black bg-slate-50 text-[15px]">
                          {periodPercent}%
                        </td>
                      </tr>
                    );
                  })()
                ) : (
                  salesTab === 'all' ? (
                    <tr className="bg-slate-100 font-extrabold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-20 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                      <td className="px-3 py-3 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 w-[260px] min-w-[260px] max-w-[260px] text-[15px]">
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
                                  style={getCellStyle(isMetricVisible(metric.key))}
                                >
                                  {formatCellVal(totalVal, metric.format)}
                                </td>
                              );
                            })}
                          </>
                        );
                      })()}
                    </tr>
                  ) : (() => {
                    const config = getTabMetricConfig(salesTab);
                    if (!config) return null;

                    const periodTarget = getPeriodTotalVal(selectedPeriod, config.periodTargetKey, config.format);
                    const periodAchieved = getPeriodTotalVal(selectedPeriod, config.periodActualKey, config.format);
                    const periodVariance = getVarianceVal(periodAchieved, periodTarget);
                    const periodPercent = getPercentageVal(periodAchieved, periodTarget);

                    return (
                      <tr className="bg-slate-100 font-extrabold text-nyati-navy border-t-2 border-slate-200 text-[15px] sticky bottom-0 z-20 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                        <td className="px-3 py-3 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-200 w-[260px] min-w-[260px] max-w-[260px] text-[15px]">
                          GRAND TOTAL
                        </td>
                        
                        <td className="px-2 py-3 text-center text-black text-[15px]">
                          {formatCellVal(periodTarget, config.format)}
                        </td>
                        <td className="px-2 py-3 text-center text-nyati-navy font-extrabold text-[15px]">
                          {formatCellVal(periodAchieved, config.format)}
                        </td>
                        <td className={`px-2 py-3 text-center font-bold text-[15px] ${periodVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatVarianceVal(periodVariance, config.format)}
                        </td>
                        <td className="px-2 py-3 text-center font-extrabold text-black text-[15px]">
                          {periodPercent}%
                        </td>
                      </tr>
                    );
                  })()
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
