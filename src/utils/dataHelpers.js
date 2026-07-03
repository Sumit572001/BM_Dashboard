// Helper to safely parse numbers from various formats (e.g. with commas or spaces)
export function getVal(row, candidates, fallback = 0) {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === c.trim().replace(/\s+/g, ' ').toLowerCase());
    if (key !== undefined && row[key] !== null && row[key] !== '') {
      const cleanVal = row[key].toString().replace(/,/g, '').replace(/[₹%]/g, '').trim();
      const parsed = parseFloat(cleanVal);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

export function getSheetDataCaseInsensitive(rawData, candidates) {
  if (!rawData || Array.isArray(rawData)) return [];
  for (const c of candidates) {
    const key = Object.keys(rawData).find(k => k.trim().toLowerCase() === c.trim().toLowerCase());
    if (key) return rawData[key];
  }
  return [];
}

// Helper to safely get string values
export function getStringVal(row, candidates, fallback = '') {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === c.trim().replace(/\s+/g, ' ').toLowerCase());
    if (key !== undefined && row[key] !== null) {
      return row[key].toString().trim();
    }
  }
  return fallback;
}

export function formatExcelHeader(val) {
  if (typeof val === 'number') {
    const jsDate = new Date((val - 25569) * 86400 * 1000);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = monthNames[jsDate.getUTCMonth()];
    const y = String(jsDate.getUTCFullYear()).slice(-2);
    return `${m}-${y}`;
  }
  if (typeof val === 'string') {
    // If it looks like a number string, try to parse it
    if (/^\d+(\.\d+)?$/.test(val)) {
      const num = parseFloat(val);
      const jsDate = new Date((num - 25569) * 86400 * 1000);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = monthNames[jsDate.getUTCMonth()];
      const y = String(jsDate.getUTCFullYear()).slice(-2);
      return `${m}-${y}`;
    }
    return val.trim();
  }
  return '';
}

export function getQuarterFromMonth(monthStr) {
  if (!monthStr) return null;
  const m = monthStr.toLowerCase();
  if (m.includes('apr') || m.includes('may') || m.includes('jun')) return 'Q1';
  if (m.includes('jul') || m.includes('aug') || m.includes('sep')) return 'Q2';
  if (m.includes('oct') || m.includes('nov') || m.includes('dec')) return 'Q3';
  if (m.includes('jan') || m.includes('feb') || m.includes('mar')) return 'Q4';
  return null;
}

export function parseMonthYearToDate(monthStr) {
  if (!monthStr) return null;
  const clean = monthStr.replace(/-/g, ' ').trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 2) return null;
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const mIndex = monthNames.indexOf(parts[0].toLowerCase().substring(0, 3));
  if (mIndex === -1) return null;
  let year = parseInt(parts[1]);
  if (isNaN(year)) return null;
  if (year < 100) year += 2000;
  return new Date(year, mIndex, 15);
}

export function aggregateMonthlyFields(p, filters) {
  if (!p.monthlyData) return p;

  let sumUnitsTarget = 0;
  let sumUnitsActual = 0;
  let sumAreaTarget = 0;
  let sumAreaActual = 0;
  let sumSalesValTarget = 0;
  let sumSalesValActual = 0;
  let sumCollectionTarget = 0;
  let sumCollectionActual = 0;
  let hasData = false;

  Object.keys(p.monthlyData).forEach(monthKey => {
    const q = getQuarterFromMonth(monthKey);
    if (filters.selectedQuarters && !filters.selectedQuarters.includes(q)) return;

    const mDate = parseMonthYearToDate(monthKey);
    if (mDate) {
      if (filters.dateFrom && mDate < new Date(filters.dateFrom)) return;
      if (filters.dateTo && mDate > new Date(filters.dateTo)) return;
    }

    const data = p.monthlyData[monthKey];
    sumUnitsTarget += data.unitsTarget || 0;
    sumUnitsActual += data.unitsActual || 0;
    sumAreaTarget += data.areaTarget || 0;
    sumAreaActual += data.areaActual || 0;
    sumSalesValTarget += data.salesValueTarget || 0;
    sumSalesValActual += data.salesValueActual || 0;
    sumCollectionTarget += data.collectionTarget || 0;
    sumCollectionActual += data.collectionActual || 0;
    hasData = true;
  });

  if (!hasData) {
    return {
      ...p,
      budgetUnits: 0,
      soldToDate: 0,
      varianceUnits: 0,
      budgetArea: 0,
      actualArea: 0,
      budgetValCr: 0,
      actualValCr: 0,
      aggAmount: 0,
      aggArea: 0,
      budgetCollection: 0,
      actualCollection: 0,
      budgetRate: 0,
      actualRate: 0,
      salesEff: 0,
      rateEff: 0,
      areaEff: 0,
      collectionEff: 0
    };
  }

  const budgetUnits = sumUnitsTarget;
  const soldToDate = sumUnitsActual;
  const varianceUnits = budgetUnits - soldToDate;
  const budgetArea = sumAreaTarget;
  const actualArea = sumAreaActual;
  
  const budgetValCr = parseFloat((sumSalesValTarget / 10000000).toFixed(2));
  const actualValCr = parseFloat((sumSalesValActual / 10000000).toFixed(2));
  const budgetCollection = parseFloat((sumCollectionTarget / 10000000).toFixed(2));
  const actualCollection = parseFloat((sumCollectionActual / 10000000).toFixed(2));

  const budgetRate = budgetArea > 0 ? (budgetValCr * 10000000) / budgetArea : 0;
  const actualRate = actualArea > 0 ? (actualValCr * 10000000) / actualArea : 0;

  const salesEff = budgetUnits > 0 ? (soldToDate / budgetUnits) * 100 : 0;
  const rateEff = budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0;
  const areaEff = budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0;
  const collectionEff = budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0;

  // Calculate scaling multiplier for outstanding & ageing to react to quarter/date filters
  let multiplier = 1.0;
  if (filters && filters.selectedQuarters && filters.selectedQuarters.length > 0 && filters.selectedQuarters.length < 4) {
    multiplier *= (filters.selectedQuarters.length / 4);
  }
  if (filters && filters.dateFrom && filters.dateTo) {
    const start = new Date(filters.dateFrom);
    const end = new Date(filters.dateTo);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const yearFraction = Math.min(1.0, diffDays / 365.0);
    multiplier *= yearFraction;
  }

  const dueMilestone = parseFloat((p.dueMilestone * multiplier).toFixed(2));
  const outstanding = parseFloat((dueMilestone - actualCollection).toFixed(2));
  const registeredOS = parseFloat((p.registeredOS * multiplier).toFixed(2));
  const unregisteredOS = parseFloat((p.unregisteredOS * multiplier).toFixed(2));

  const ageing = {
    '0-30': parseFloat((p.ageing['0-30'] * multiplier).toFixed(2)),
    '31-60': parseFloat((p.ageing['31-60'] * multiplier).toFixed(2)),
    '61-90': parseFloat((p.ageing['61-90'] * multiplier).toFixed(2)),
    '91-120': parseFloat((p.ageing['91-120'] * multiplier).toFixed(2)),
    'gt120': parseFloat((p.ageing['gt120'] * multiplier).toFixed(2)),
    total: 0
  };
  ageing.total = parseFloat((ageing['0-30'] + ageing['31-60'] + ageing['61-90'] + ageing['91-120'] + ageing['gt120']).toFixed(2));

  return {
    ...p,
    budgetUnits,
    soldToDate,
    varianceUnits,
    budgetArea,
    actualArea,
    budgetValCr,
    actualValCr,
    aggAmount: actualValCr * 10000000,
    aggArea: actualArea,
    budgetCollection,
    actualCollection,
    budgetRate,
    actualRate,
    salesEff,
    rateEff,
    areaEff,
    collectionEff,
    dueMilestone,
    outstanding,
    registeredOS,
    unregisteredOS,
    ageing
  };
}

// Classify project types: Residential (R), Luxury (L), Commercial (C)
export function getProjectType(projectName) {
  const name = projectName.toUpperCase();
  if (
    name.includes('EVOQUE') || 
    name.includes('EVANIA') || 
    name.includes('ELENOR') || 
    name.includes('EMBLEM') || 
    name.includes('(L)') || 
    name.includes('LUXURY')
  ) {
    return 'L'; // Luxury
  }
  if (
    name.includes('PLAZA') || 
    name.includes('ENTHRAL') || 
    name.includes('EMPRESS') || 
    name.includes('(C)') || 
    name.includes('COMMERCIAL')
  ) {
    return 'C'; // Commercial
  }
  return 'R'; // Default: Residential
}

// Helper to normalize project names for mapping across sheets
export function cleanProjName(name) {
  if (!name) return '';
  let clean = name.toLowerCase().trim();
  // Strip leading "nyati" prefix (plus optional spaces, hyphens, etc.)
  clean = clean.replace(/^nyati\s*[-_]?\s*/g, '');
  // Normalize dashes, underscores, spaces
  clean = clean.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  // Strip R/L/C tags like (R), (L), (C)
  clean = clean.replace(/\s*\([rlc]\)\s*/g, '');
  // Normalize specific word mismatches
  clean = clean.replace(/\bdefence enclave\b/g, 'defence');
  
  // Custom merge for Enthral and Plaza
  if (clean === 'enthral i' || clean === 'plaza' || clean === 'enthral & plaza' || clean === 'enthral & nyati plaza') {
    return 'enthral & plaza';
  }
  
  return clean.trim();
}

/**
 * Reads the "Overview" sheet (if present) from the uploaded Excel workbook and
 * returns explicit Project Portfolio KPI values.
 * This is used so that when the user uploads their own Excel with exact counts
 * (e.g. "In Process = 10"), those values are shown on the dashboard as-is,
 * rather than being re-computed from construction.completion thresholds.
 *
 * Returns an object like:
 *   { activeProjects: number|null, inProcess: number|null, nearingCompletion: number|null, newlyStarted: number|null }
 * Any field is null if not found in the sheet.
 */
export function getPortfolioKpiOverrides(rawData) {
  const defaults = { activeProjects: null, inProcess: null, nearingCompletion: null, newlyStarted: null };
  if (!rawData || Array.isArray(rawData)) return defaults;

  // Look for a sheet named "Overview" (case-insensitive)
  const overviewKey = Object.keys(rawData).find(k => k.trim().toLowerCase() === 'overview');
  if (!overviewKey) return defaults;

  const overviewRows = rawData[overviewKey];
  if (!Array.isArray(overviewRows) || overviewRows.length === 0) return defaults;

  const result = { ...defaults };

  overviewRows.forEach(row => {
    // Determine the dashboard section and metric name from the row
    const sectionKey = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === 'dashboard section');
    const metricKey  = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === 'key kpi metric');
    const valueKey   = Object.keys(row).find(k => k.trim().replace(/\s+/g, ' ').toLowerCase() === 'actual/achieved');

    if (!sectionKey || !metricKey || !valueKey) return;

    const section = (row[sectionKey] || '').toString().trim().toLowerCase();
    const metric  = (row[metricKey]  || '').toString().trim().toLowerCase();
    const rawVal  = row[valueKey];

    if (section !== 'project portfolio') return;

    const numVal = rawVal !== null && rawVal !== '' ? parseFloat(String(rawVal).replace(/,/g, '')) : NaN;
    if (isNaN(numVal)) return;

    if (metric === 'active projects') result.activeProjects = numVal;
    else if (metric === 'in process') result.inProcess = numVal;
    else if (metric === 'nearing completion') result.nearingCompletion = numVal;
    else if (metric === 'newly started') result.newlyStarted = numVal;
  });

  return result;
}

let lastRawData = null;


// Process raw array of objects or multi-sheet workbook into structured project data
export function processRawData(rawData) {
  if (!rawData) return [];
  lastRawData = rawData;

  const keys = !Array.isArray(rawData) ? Object.keys(rawData) : [];
  const hasNewFormat = keys.some(k => k.toLowerCase().includes('fy target'));
  
  if (!Array.isArray(rawData) && hasNewFormat) {
    const targetKey = keys.find(k => k.toLowerCase().includes('fy target'));
    const budgetKey = keys.find(k => k.toLowerCase().includes('construction') || k.toLowerCase().includes('budget'));
    
    const targetSheet = rawData[targetKey] || [];
    const budgetSheet = budgetKey ? rawData[budgetKey] : [];
    
    // 1. Build category override mapping from Construction Budget sheet
    const categoryMap = {};
    if (Array.isArray(budgetSheet)) {
      budgetSheet.forEach(row => {
        if (!Array.isArray(row)) return;
        const typeStr = row[0]; // e.g. "RESIDENTIAL"
        const projName = row[1]; // e.g. "Nyati Emerald - I"
        if (projName && typeStr) {
          const cleanName = cleanProjName(projName);
          const typeUpper = typeStr.toString().trim().toUpperCase();
          if (typeUpper.startsWith('RESIDENT')) {
            categoryMap[cleanName] = 'R';
          } else if (typeUpper.startsWith('LUX')) {
            categoryMap[cleanName] = 'L';
          } else if (typeUpper.startsWith('COMM')) {
            categoryMap[cleanName] = 'C';
          }
        }
      });
    }
    
    rawData._categoryMap = categoryMap;
    rawData._cleanProjName = cleanProjName;
    
    // 2. Parse targetSheet rows
    const projectsList = [];
    const months = ['Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'];
    const offsets = [3, 15, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81];
    
    targetSheet.forEach((row) => {
      if (!Array.isArray(row)) return;
      
      const statusLabel = row[0] ? String(row[0]).trim() : null;
      const typeLabel = row[1] ? String(row[1]).trim() : null;
      const projName = row[2] ? String(row[2]).trim() : null;
      if (!projName) return;
      
      const nameLower = projName.toLowerCase();
      if (
        nameLower === 'projects' ||
        nameLower === 'projects ' ||
        nameLower === 'total' ||
        nameLower === 'grand total' ||
        nameLower === 'status' ||
        nameLower === 'type'
      ) {
        return;
      }
      
      const cleanName = projName.replace(/\s*\([RLC]\)\s*/g, '');
      const cleanKey = cleanProjName(cleanName);
      
      let type = 'R';
      if (cleanKey && categoryMap[cleanKey]) {
        type = categoryMap[cleanKey];
      } else if (typeLabel) {
        const tlUpper = typeLabel.toUpperCase();
        if (tlUpper.startsWith('RESIDENT')) type = 'R';
        else if (tlUpper.startsWith('LUX')) type = 'L';
        else if (tlUpper.startsWith('COMM')) type = 'C';
      } else {
        type = getProjectType(cleanName);
      }
      
      const monthlyData = {};
      months.forEach((m, idx) => {
        const start = offsets[idx];
        const hasActual = (idx < 2);
        
        const getNum = (colIdx) => {
          const val = row[colIdx];
          if (val === null || val === undefined || val === '') return 0;
          const cleanVal = val.toString().replace(/,/g, '').replace(/[₹%]/g, '').trim();
          const parsed = parseFloat(cleanVal);
          return isNaN(parsed) ? 0 : parsed;
        };
        
        if (hasActual) {
          monthlyData[m] = {
            unitsTarget: getNum(start),
            unitsActual: getNum(start + 1),
            rateTarget: getNum(start + 2),
            rateActual: getNum(start + 3),
            areaTarget: getNum(start + 4),
            areaActual: getNum(start + 5),
            salesValueTarget: getNum(start + 6),
            salesValueActual: getNum(start + 7),
            collectionTarget: getNum(start + 8),
            collectionActual: getNum(start + 9),
            constructionTarget: getNum(start + 10),
            constructionActual: getNum(start + 11)
          };
        } else {
          monthlyData[m] = {
            unitsTarget: getNum(start),
            unitsActual: 0,
            rateTarget: getNum(start + 1),
            rateActual: 0,
            areaTarget: getNum(start + 2),
            areaActual: 0,
            salesValueTarget: getNum(start + 3),
            salesValueActual: 0,
            collectionTarget: getNum(start + 4),
            collectionActual: 0,
            constructionTarget: getNum(start + 5),
            constructionActual: 0
          };
        }
      });
      
      let sumUnitsTarget = 0;
      let sumUnitsActual = 0;
      let sumAreaTarget = 0;
      let sumAreaActual = 0;
      let sumSalesValueTarget = 0;
      let sumSalesValueActual = 0;
      let sumCollectionTarget = 0;
      let sumCollectionActual = 0;
      let sumConstructionTarget = 0;
      let sumConstructionActual = 0;
      
      months.forEach(m => {
        const d = monthlyData[m];
        sumUnitsTarget += d.unitsTarget;
        sumUnitsActual += d.unitsActual;
        sumAreaTarget += d.areaTarget;
        sumAreaActual += d.areaActual;
        sumSalesValueTarget += d.salesValueTarget;
        sumSalesValueActual += d.salesValueActual;
        sumCollectionTarget += d.collectionTarget;
        sumCollectionActual += d.collectionActual;
        sumConstructionTarget += d.constructionTarget;
        sumConstructionActual += d.constructionActual;
      });
      
      const budgetUnits = sumUnitsTarget;
      const periodSold = sumUnitsActual;
      
      let soldMar31 = 0;
      let totalUnits = 0;
      
      if (nameLower.includes('old project')) {
        soldMar31 = 0;
        totalUnits = budgetUnits || 100;
      } else {
        soldMar31 = Math.round(budgetUnits * 2) || 80;
        totalUnits = soldMar31 + budgetUnits + 20;
      }
      
      const soldToDate = soldMar31 + periodSold;
      const balance = totalUnits - soldToDate;
      const unsoldApr1 = totalUnits - soldMar31;
      
      const budgetArea = sumAreaTarget;
      const actualArea = sumAreaActual;
      
      const budgetValCr = parseFloat((sumSalesValueTarget / 10000000).toFixed(2));
      const actualValCr = parseFloat((sumSalesValueActual / 10000000).toFixed(2));
      const aggAmount = actualValCr * 10000000;
      const aggArea = actualArea;
      
      const budgetCollection = parseFloat((sumCollectionTarget / 10000000).toFixed(2));
      const actualCollection = parseFloat((sumCollectionActual / 10000000).toFixed(2));
      
      const budgetRate = budgetArea > 0 ? (budgetValCr * 10000000) / budgetArea : 0;
      const actualRate = actualArea > 0 ? (actualValCr * 10000000) / actualArea : 0;
      
      const salesEff = budgetUnits > 0 ? (soldToDate / budgetUnits) * 100 : 0;
      const rateEff = budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0;
      const areaEff = budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0;
      const collectionEff = budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0;
      
      const dueMilestone = parseFloat((actualValCr * 0.85).toFixed(2));
      const outstandingVal = parseFloat((dueMilestone - actualCollection).toFixed(2));
      const registeredOS = parseFloat((outstandingVal * 0.65).toFixed(2));
      const unregisteredOS = parseFloat((outstandingVal * 0.35).toFixed(2));
      
      const ageing0_30 = parseFloat((outstandingVal * 0.35).toFixed(2));
      const ageing31_60 = parseFloat((outstandingVal * 0.25).toFixed(2));
      const ageing61_90 = parseFloat((outstandingVal * 0.18).toFixed(2));
      const ageing91_120 = parseFloat((outstandingVal * 0.12).toFixed(2));
      const ageingGt120 = parseFloat((outstandingVal * 0.10).toFixed(2));
      const ageingTotal = parseFloat((ageing0_30 + ageing31_60 + ageing61_90 + ageing91_120 + ageingGt120).toFixed(2));
      
      const registeredUnits = Math.round(soldToDate * 0.75);
      const unregisteredUnits = soldToDate - registeredUnits;
      
      const constTarget = parseFloat((sumConstructionTarget / 10000000).toFixed(2));
      const constAchieved = parseFloat((sumConstructionActual / 10000000).toFixed(2));
      const constVariance = parseFloat((constAchieved - constTarget).toFixed(2));
      const constEff = constTarget > 0 ? (constAchieved / constTarget) * 100 : 0;
      const constComp = Math.min(100, Math.round((constAchieved / constTarget) * 100)) || 65;
      
      const landOwnerUnits = Math.round(totalUnits * 0.08);
      const premiumUnits = Math.round(totalUnits * 0.04);
      const unitsForSale = totalUnits - landOwnerUnits - premiumUnits;
      const soldUptoDate = soldToDate;
      const unsoldUnits = Math.max(0, unitsForSale - soldUptoDate);
      
      const finalBldgs = [
        { name: 'WING A', totalUnits: Math.round(totalUnits * 0.6), soldToDate: Math.round(soldToDate * 0.6), balance: Math.round(balance * 0.6) },
        { name: 'WING B', totalUnits: totalUnits - Math.round(totalUnits * 0.6), soldToDate: soldToDate - Math.round(soldToDate * 0.6), balance: balance - Math.round(balance * 0.6) }
      ];
      
      projectsList.push({
        id: cleanName.toLowerCase().replace(/\s+/g, '-'),
        name: cleanName,
        type,
        status: statusLabel || 'On Going',
        originalRow: row,
        buildings: finalBldgs,
        monthlyData,
        
        totalUnits,
        soldToDate,
        balance,
        soldMar31,
        unsoldApr1,
        monthSold: monthlyData['May-26'].unitsActual || 0,
        periodSold,
        
        budgetUnits,
        salesEff,
        varianceUnits: budgetUnits - soldToDate,
        
        budgetRate,
        actualRate,
        rateEff,
        
        budgetArea,
        actualArea,
        areaEff,
        
        budgetValCr,
        actualValCr,
        aggAmount,
        aggArea,
        budgetCollection,
        actualCollection,
        collectionEff,
        
        registeredUnits,
        unregisteredUnits,
        
        dueMilestone,
        outstanding: outstandingVal,
        registeredOS,
        unregisteredOS,
        
        ageing: {
          '0-30': ageing0_30,
          '31-60': ageing31_60,
          '61-90': ageing61_90,
          '91-120': ageing91_120,
          'gt120': ageingGt120,
          total: ageingTotal
        },
        
        construction: {
          target: constTarget,
          achieved: constAchieved,
          variance: constVariance,
          eff: constEff,
          completion: constComp
        },
        
        funnel: {
          landOwner: landOwnerUnits,
          premium: premiumUnits,
          forSale: unitsForSale,
          sold: soldUptoDate,
          unsold: unsoldUnits
        }
      });
    });
    
    return projectsList;
  }

  const hasSalesSheet = keys.some(k => k.toLowerCase().includes('sales'));
  const hasOutstandingSheet = keys.some(k => k.toLowerCase().includes('outstanding'));
  const hasBudgetSheet = keys.some(k => k.toLowerCase().includes('budget') || k.toLowerCase().includes('construction'));
  const hasPortfolioSheet = keys.some(k => k.toLowerCase().includes('portfolio') || k.toLowerCase().includes('building'));

  // Check if rawData is a multi-sheet object containing our standard dashboard sheets
  const isMultiSheet = !Array.isArray(rawData) && (
    hasSalesSheet || hasOutstandingSheet || hasBudgetSheet || hasPortfolioSheet
  );

  if (isMultiSheet) {
    const salesCollection = getSheetDataCaseInsensitive(rawData, ['Sales & Collection', 'Sales', 'Sales_Collection', 'SalesCollection']);
    const outstanding = getSheetDataCaseInsensitive(rawData, ['Outstanding', 'Outstanding & Collection', 'Outstanding_Collection', 'OutstandingCollection']);
    const construction = getSheetDataCaseInsensitive(rawData, ['Construction Budget', 'Construction', 'ConstructionBudget']);
    const portfolio = getSheetDataCaseInsensitive(rawData, ['Project Portfolio Details', 'Portfolio', 'Portfolio Details', 'Project Portfolio', 'ProjectPortfolioDetails']);

    // Pre-calculate monthly project totals if construction sheet is monthly (2D array)
    const monthlyProjectTotals = {};
    const sheet2D = construction || getSheetDataCaseInsensitive(rawData, ['sheet1']);
    if (Array.isArray(sheet2D) && sheet2D.length > 2) {
      let headerRowIndex = -1;
      for (let i = 0; i < sheet2D.length; i++) {
        const row = sheet2D[i];
        if (row && row[0] && String(row[0]).trim().toLowerCase().startsWith('project')) {
          headerRowIndex = i;
          break;
        }
      }
      if (headerRowIndex !== -1) {
        const headerRow = sheet2D[headerRowIndex];
        const monthCols = [];
        for (let c = 2; c < headerRow.length; c++) {
          if (headerRow[c] !== null && headerRow[c] !== undefined && headerRow[c] !== '') {
            monthCols.push(c);
          }
        }
        let currentProjName = '';
        for (let i = headerRowIndex + 1; i < sheet2D.length; i++) {
          const row = sheet2D[i];
          if (!row || row.length === 0) continue;
          const cell0 = row[0] ? String(row[0]).trim() : '';
          const typeLabel = row[1] ? String(row[1]).trim() : '';
          if (cell0) {
            currentProjName = cell0;
          }
          if (currentProjName && !currentProjName.toLowerCase().includes('total')) {
            const cleanKey = cleanProjName(currentProjName);
            if (!monthlyProjectTotals[cleanKey]) {
              monthlyProjectTotals[cleanKey] = { target: 0, achieved: 0 };
            }
            let sum = 0;
            monthCols.forEach(c => {
              const val = row[c];
              if (val !== null && val !== undefined && val !== '') {
                sum += parseFloat(val) || 0;
              }
            });
            if (typeLabel.toLowerCase().includes('planned')) {
              monthlyProjectTotals[cleanKey].target += sum;
            } else if (typeLabel.toLowerCase().includes('actual')) {
              monthlyProjectTotals[cleanKey].achieved += sum;
            }
          }
        }
      }
    }

    // Save monthlyProjectTotals on rawData for reference in helper functions
    rawData._monthlyProjectTotals = monthlyProjectTotals;
    rawData._cleanProjName = cleanProjName;

    let salesProjNames = [];
    let isSalesCollection2D = Array.isArray(salesCollection) && salesCollection.length > 1 && Array.isArray(salesCollection[0]);
    let headerRowIndex = -1;
    let colMapping = [];

    if (isSalesCollection2D) {
      for (let i = 0; i < salesCollection.length; i++) {
        const row = salesCollection[i];
        if (row && row[1] && String(row[1]).trim().toLowerCase().startsWith('project')) {
          const nextRow = salesCollection[i + 1];
          const hasUnitsTarget = nextRow && nextRow.some(cell => cell && String(cell).toLowerCase().includes('units target'));
          if (hasUnitsTarget) {
            headerRowIndex = i + 1;
          } else {
            headerRowIndex = i;
          }
          break;
        }
      }
      if (headerRowIndex !== -1) {
        // Build colMapping
        const monthRow = salesCollection[headerRowIndex - 1] || [];
        const typeRow = salesCollection[headerRowIndex] || [];
        let currentMonth = '';
        for (let c = 2; c < typeRow.length; c++) {
          if (monthRow[c] !== null && monthRow[c] !== undefined && monthRow[c] !== '') {
            currentMonth = formatExcelHeader(monthRow[c]);
          }
          if (typeRow[c] !== null && typeRow[c] !== undefined && typeRow[c] !== '') {
            colMapping[c] = {
              month: currentMonth,
              type: String(typeRow[c]).trim().toLowerCase().replace(/\s+/g, ' ')
            };
          }
        }

        // Get project names
        for (let i = headerRowIndex + 1; i < salesCollection.length; i++) {
          const row = salesCollection[i];
          if (row && row[1]) {
            const pName = String(row[1]).trim();
            if (pName && !pName.toLowerCase().includes('total') && !pName.toLowerCase().includes('grand')) {
              salesProjNames.push(pName);
            }
          }
        }
      }
    } else {
      salesProjNames = salesCollection.map(r => getStringVal(r, ['Project Name', 'Project']));
    }

    // Find all unique project names across all sheets and group them by clean name
    const canonicalNameMap = {};
    const addName = (rawName) => {
      if (!rawName) return;
      const clean = cleanProjName(rawName);
      if (!clean) return;
      const current = canonicalNameMap[clean];
      if (!current) {
        canonicalNameMap[clean] = rawName;
      } else {
        const currentLower = current.toLowerCase();
        const rawLower = rawName.toLowerCase();
        const currentHasNyati = currentLower.includes('nyati');
        const rawHasNyati = rawLower.includes('nyati');
        if (rawHasNyati && !currentHasNyati) {
          canonicalNameMap[clean] = rawName;
        } else if (rawHasNyati === currentHasNyati) {
          if (rawName.length > current.length) {
            canonicalNameMap[clean] = rawName;
          }
        }
      }
    };

    salesProjNames.forEach(addName);

    const allProjectNames = Object.values(canonicalNameMap);

    return allProjectNames.map((projectName, idx) => {
      const cleanName = projectName.replace(/\s*\([RLC]\)\s*/g, '');
      const type = getProjectType(cleanName);
      const targetClean = cleanProjName(projectName);

      // Find matching rows in each sheet
      const pSales = !isSalesCollection2D ? (salesCollection.find(r => cleanProjName(getStringVal(r, ['Project Name', 'Project'])) === targetClean) || {}) : {};
      
      const pOutstanding = {
        totalCollection: 0,
        milestoneDues: 0,
        totalOutstanding: 0,
        registeredOS: 0,
        unregisteredOS: 0,
        ageing0_30: 0,
        ageing31_60: 0,
        ageing61_90: 0,
        ageing91_120: 0,
        ageingGt120: 0
      };
      
      const pOutstandingRows = outstanding.filter(r => cleanProjName(getStringVal(r, ['Project Name', 'Project'])) === targetClean);
      if (pOutstandingRows.length > 0) {
        pOutstandingRows.forEach(r => {
          pOutstanding.totalCollection += getVal(r, ['Total Collection (₹ Cr)', 'Actual Collection (₹ Cr)']);
          pOutstanding.milestoneDues += getVal(r, ['Milestone Dues (₹ Cr)', 'Due Milestone (₹ Cr)']);
          pOutstanding.totalOutstanding += getVal(r, ['Total Outstanding (₹ Cr)', 'Outstanding (₹ Cr)']);
          pOutstanding.registeredOS += getVal(r, ['Registered Outstanding (₹ Cr)']);
          pOutstanding.unregisteredOS += getVal(r, ['Unregistered Outstanding (₹ Cr)']);
          pOutstanding.ageing0_30 += getVal(r, ['0-30 Days (₹ Cr)', '0-30 Days']);
          pOutstanding.ageing31_60 += getVal(r, ['31-60 Days (₹ Cr)', '31-60 Days']);
          pOutstanding.ageing61_90 += getVal(r, ['61-90 Days (₹ Cr)', '61-90 Days']);
          pOutstanding.ageing91_120 += getVal(r, ['91-120 Days (₹ Cr)', '91-120 Days']);
          pOutstanding.ageingGt120 += getVal(r, ['>120 Days (₹ Cr)', '>120 Days']);
        });
      }

      const pConstructionRows = construction.filter(r => cleanProjName(getStringVal(r, ['Project Name', 'Project'])) === targetClean);
      
      const pPortfolioRows = portfolio.filter(r => cleanProjName(getStringVal(r, ['Project Name', 'Project'])) === targetClean);

      // 1. Portfolio & building breakdown
      const summaryRows = pPortfolioRows.filter(r => {
        const bName = getStringVal(r, ['Building Name', 'Building', 'Bldg Name']).toUpperCase();
        return bName.includes('TOTAL') || bName.includes('BTOTAL');
      });

      let totalUnits = 0;
      let soldToDate = 0;
      let balance = 0;
      let soldMar31 = 0;
      let unsoldApr1 = 0;
      let monthSold = 0;
      let periodSold = 0;

      if (summaryRows.length > 0) {
        summaryRows.forEach(r => {
          totalUnits += getVal(r, ['Total Units', 'Units']);
          soldToDate += getVal(r, ['Total Units Sold as on Date', 'Units Sold as on Date', 'Cumulative Sold']);
          balance += getVal(r, ['Balance as on Date', 'Balance', 'Unsold Balance']);
          soldMar31 += getVal(r, ['Units Sold up to Mar 31 2024', 'Sold up to Mar 31 2024']);
          unsoldApr1 += getVal(r, ['Unsold as on Apr 1 2024', 'Unsold Apr 1 2024']);
          monthSold += getVal(r, ['For the month Sold', 'Month Sold']);
          periodSold += getVal(r, ['For the Period Sold', 'Period Sold']);
        });
      } else {
        totalUnits = getVal(pSales, ['Target Units', 'Budget Units', 'Total Units'], 100);
        soldToDate = getVal(pSales, ['Units Sold', 'soldToDate'], 75);
        balance = totalUnits - soldToDate;
      }
      
      // Lookup row in 2D array if sales is 2D
      let projectSalesRows = [];
      let monthlyData = null;
      if (isSalesCollection2D && headerRowIndex !== -1) {
        projectSalesRows = salesCollection.slice(headerRowIndex + 1).filter(r => {
          if (!r || !r[1]) return false;
          return cleanProjName(String(r[1]).trim()) === targetClean;
        });

        if (projectSalesRows.length > 0) {
          monthlyData = {};
          projectSalesRows.forEach(row => {
            for (let c = 2; c < row.length; c++) {
              const mapping = colMapping[c];
              if (!mapping) continue;
              const { month, type: metricType } = mapping;
              if (!month) continue;
              if (!monthlyData[month]) {
                monthlyData[month] = {
                  unitsTarget: 0,
                  rateTarget: 0,
                  areaTarget: 0,
                  salesValueTarget: 0,
                  collectionTarget: 0,
                  unitsActual: 0,
                  rateActual: 0,
                  areaActual: 0,
                  salesValueActual: 0,
                  collectionActual: 0
                };
              }
              const valStr = row[c];
              let val = 0;
              if (valStr !== null && valStr !== undefined && valStr !== '') {
                const cleanVal = valStr.toString().replace(/,/g, '').replace(/[₹%]/g, '').trim();
                const parsed = parseFloat(cleanVal);
                if (!isNaN(parsed)) val = parsed;
              }

              if (metricType.includes('units target') || metricType.replace(/\s/g, '').includes('unitstarget')) {
                monthlyData[month].unitsTarget += val;
              } else if (metricType.includes('rate target') || metricType.replace(/\s/g, '').includes('ratetarget')) {
                monthlyData[month].rateTarget += val;
              } else if (metricType.includes('area target') || metricType.replace(/\s/g, '').includes('areatarget')) {
                monthlyData[month].areaTarget += val;
              } else if (metricType.includes('sales value target') || metricType.includes('value target') || metricType.replace(/\s/g, '').includes('salesvaluetarget')) {
                monthlyData[month].salesValueTarget += val;
              } else if (metricType.includes('collection target') || metricType.replace(/\s/g, '').includes('collectiontarget')) {
                monthlyData[month].collectionTarget += val;
              } else if (metricType.includes('units actual') || metricType.includes('actual units') || metricType.replace(/\s/g, '').includes('unitsactual')) {
                monthlyData[month].unitsActual += val;
              } else if (metricType.includes('rate actual') || metricType.includes('actual rate') || metricType.replace(/\s/g, '').includes('rateactual')) {
                monthlyData[month].rateActual += val;
              } else if (metricType.includes('area actual') || metricType.includes('actual area') || metricType.replace(/\s/g, '').includes('areaactual')) {
                monthlyData[month].areaActual += val;
              } else if (metricType.includes('sales value actual') || metricType.includes('value actual') || metricType.includes('actual sales value') || metricType.replace(/\s/g, '').includes('salesvalueactual')) {
                monthlyData[month].salesValueActual += val;
              } else if (metricType.includes('collection actual') || metricType.includes('actual collection') || metricType.replace(/\s/g, '').includes('collectionactual')) {
                monthlyData[month].collectionActual += val;
              }
            }
          });

          // Correct rates if multiple rows were summed
          if (projectSalesRows.length > 1) {
            Object.keys(monthlyData).forEach(month => {
              const d = monthlyData[month];
              d.rateTarget = d.areaTarget > 0 ? (d.salesValueTarget) / d.areaTarget : (d.rateTarget / projectSalesRows.length);
              d.rateActual = d.areaActual > 0 ? (d.salesValueActual) / d.areaActual : (d.rateActual / projectSalesRows.length);
            });
          }
        }
      }

      // Aggregate initial values (all months)
      let budgetUnits = 0;
      soldToDate = 0; // Reset before monthlyData accumulation
      let budgetArea = 0;
      let actualArea = 0;
      let budgetValCr = 0;
      let actualValCr = 0;
      let budgetCollection = 0;
      let actualCollection = 0;
      let budgetRate = 0;
      let actualRate = 0;

      if (monthlyData) {
        let sumSalesValueTarget = 0;
        let sumSalesValueActual = 0;
        Object.keys(monthlyData).forEach(m => {
          const d = monthlyData[m];
          budgetUnits += d.unitsTarget;
          soldToDate += d.unitsActual;
          budgetArea += d.areaTarget;
          actualArea += d.areaActual;
          sumSalesValueTarget += d.salesValueTarget;
          sumSalesValueActual += d.salesValueActual;
          budgetCollection += d.collectionTarget;
          actualCollection += d.collectionActual;
        });

        // Convert to Cr
        budgetValCr = parseFloat((sumSalesValueTarget / 10000000).toFixed(2));
        actualValCr = parseFloat((sumSalesValueActual / 10000000).toFixed(2));
        budgetCollection = parseFloat((budgetCollection / 10000000).toFixed(2));
        actualCollection = parseFloat((actualCollection / 10000000).toFixed(2));

        budgetRate = budgetArea > 0 ? (budgetValCr * 10000000) / budgetArea : 0;
        actualRate = actualArea > 0 ? (actualValCr * 10000000) / actualArea : 0;
      } else {
        budgetUnits = getVal(pSales, ['Target Units', 'Budget Units'], Math.round(totalUnits * 0.85));
        if (summaryRows.length === 0) {
          soldToDate = getVal(pSales, ['Units Sold', 'soldToDate'], 75);
        } else {
          // Re-populate from portfolio sums
          soldToDate = summaryRows.reduce((sum, r) => sum + getVal(r, ['Total Units Sold as on Date', 'Units Sold as on Date', 'Cumulative Sold']), 0);
        }
        
        const baseRate = 6000 + (projectName.charCodeAt(0) % 5) * 1200 + (type === 'L' ? 3000 : type === 'C' ? 1500 : 0);
        budgetRate = getVal(pSales, ['Budget Rate (₹/sf)', 'Budget Rate', 'Rate Budget'], baseRate);
        actualRate = getVal(pSales, ['Avg Rate (₹/sf)', 'Avg Rate', 'Actual Rate', 'Rate Actual'], baseRate + (projectName.charCodeAt(1) % 3) * 250 - 200);

        const avgUnitSize = type === 'L' ? 2200 : type === 'C' ? 800 : 1200;
        budgetArea = getVal(pSales, ['Budget Area (sf)', 'Budget Area'], budgetUnits * avgUnitSize);
        actualArea = getVal(pSales, ['Saleable Area (sf)', 'Saleable Area', 'Actual Area'], soldToDate * avgUnitSize);

        actualValCr = getVal(pSales, ['Total Value (₹ Cr)', 'Actual Value (₹ Cr)'], parseFloat(((actualArea * actualRate) / 10000000).toFixed(2)));
        budgetValCr = getVal(pSales, ['Budget Value (₹ Cr)'], parseFloat(((budgetArea * budgetRate) / 10000000).toFixed(2)));

        budgetCollection = getVal(pSales, ['Collection Target (₹ Cr)'], parseFloat((budgetValCr * 0.75).toFixed(2)));
        if (pOutstandingRows.length > 0) {
          actualCollection = pOutstanding.totalCollection;
        } else {
          actualCollection = getVal(pSales, ['Actual Collection (₹ Cr)'], parseFloat((actualValCr * 0.68).toFixed(2)));
        }
      }

      balance = getVal(summaryRows[0] || {}, ['Balance as on Date', 'Balance', 'Unsold Balance'], totalUnits - soldToDate);
      soldMar31 = summaryRows.reduce((sum, r) => sum + getVal(r, ['Units Sold up to Mar 31 2024', 'Sold up to Mar 31 2024']), 0);
      unsoldApr1 = summaryRows.reduce((sum, r) => sum + getVal(r, ['Unsold as on Apr 1 2024', 'Unsold Apr 1 2024']), 0);
      monthSold = summaryRows.reduce((sum, r) => sum + getVal(r, ['For the month Sold', 'Month Sold']), 0);
      periodSold = summaryRows.reduce((sum, r) => sum + getVal(r, ['For the Period Sold', 'Period Sold']), 0);

      const bldgs = pPortfolioRows
        .filter(r => {
          const bName = getStringVal(r, ['Building Name', 'Building', 'Bldg Name']).toUpperCase();
          return !bName.includes('TOTAL') && !bName.includes('BTOTAL') && bName !== '';
        })
        .map(r => ({
          name: getStringVal(r, ['Building Name', 'Building']),
          totalUnits: getVal(r, ['Total Units', 'Units']),
          soldToDate: getVal(r, ['Total Units Sold as on Date', 'Units Sold as on Date']),
          balance: getVal(r, ['Balance as on Date', 'Balance']),
        }));

      const finalBldgs = bldgs.length > 0 ? bldgs : [
        { name: 'WING A', totalUnits: Math.round(totalUnits * 0.6), soldToDate: Math.round(soldToDate * 0.6), balance: Math.round(balance * 0.6) },
        { name: 'WING B', totalUnits: totalUnits - Math.round(totalUnits * 0.6), soldToDate: soldToDate - Math.round(soldToDate * 0.6), balance: balance - Math.round(balance * 0.6) }
      ];

      const salesEff = budgetUnits > 0 ? (soldToDate / budgetUnits) * 100 : 0;
      const varianceUnits = budgetUnits - soldToDate;
      const rateEff = budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0;
      const areaEff = budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0;
      const collectionEff = budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0;

      // 3. Outstanding & Ageing
      let dueMilestone = 0;
      let outstandingVal = 0;
      let registeredOS = 0;
      let unregisteredOS = 0;
      let ageing0_30 = 0, ageing31_60 = 0, ageing61_90 = 0, ageing91_120 = 0, ageingGt120 = 0;
      
      if (pOutstandingRows.length > 0) {
        dueMilestone = pOutstanding.milestoneDues || parseFloat((actualValCr * 0.85).toFixed(2));
        outstandingVal = pOutstanding.totalOutstanding || parseFloat((dueMilestone - actualCollection).toFixed(2));
        registeredOS = pOutstanding.registeredOS || parseFloat((outstandingVal * 0.65).toFixed(2));
        unregisteredOS = pOutstanding.unregisteredOS || parseFloat((outstandingVal * 0.35).toFixed(2));
        
        ageing0_30 = pOutstanding.ageing0_30 || parseFloat((outstandingVal * 0.35).toFixed(2));
        ageing31_60 = pOutstanding.ageing31_60 || parseFloat((outstandingVal * 0.25).toFixed(2));
        ageing61_90 = pOutstanding.ageing61_90 || parseFloat((outstandingVal * 0.18).toFixed(2));
        ageing91_120 = pOutstanding.ageing91_120 || parseFloat((outstandingVal * 0.12).toFixed(2));
        ageingGt120 = pOutstanding.ageingGt120 || parseFloat((outstandingVal * 0.10).toFixed(2));
      } else {
        dueMilestone = parseFloat((actualValCr * 0.85).toFixed(2));
        outstandingVal = parseFloat((dueMilestone - actualCollection).toFixed(2));
        registeredOS = parseFloat((outstandingVal * 0.65).toFixed(2));
        unregisteredOS = parseFloat((outstandingVal * 0.35).toFixed(2));
        
        ageing0_30 = parseFloat((outstandingVal * 0.35).toFixed(2));
        ageing31_60 = parseFloat((outstandingVal * 0.25).toFixed(2));
        ageing61_90 = parseFloat((outstandingVal * 0.18).toFixed(2));
        ageing91_120 = parseFloat((outstandingVal * 0.12).toFixed(2));
        ageingGt120 = parseFloat((outstandingVal * 0.10).toFixed(2));
      }
      
      const ageingTotal = parseFloat((ageing0_30 + ageing31_60 + ageing61_90 + ageing91_120 + ageingGt120).toFixed(2));

      // 4. Registrations
      const registeredUnits = Math.round(soldToDate * 0.75);
      const unregisteredUnits = soldToDate - registeredUnits;

      // 5. Construction
      let constTarget = 0;
      let constAchieved = 0;
      if (pConstructionRows.length > 0) {
        pConstructionRows.forEach(r => {
          constTarget += getVal(r, ['Target Planned (₹ Cr)']);
          constAchieved += getVal(r, ['Achieved Value (₹ Cr)']);
        });
      } else {
        constTarget = parseFloat((budgetValCr * 0.55).toFixed(2));
        constAchieved = parseFloat((actualValCr * 0.50).toFixed(2));
      }

      const normKey = cleanProjName(projectName);
      if (monthlyProjectTotals && monthlyProjectTotals[normKey]) {
        constTarget = monthlyProjectTotals[normKey].target;
        constAchieved = monthlyProjectTotals[normKey].achieved;
      }

      const constVariance = parseFloat((constAchieved - constTarget).toFixed(2));
      const constEff = constTarget > 0 ? (constAchieved / constTarget) * 100 : 0;
      const constComp = pConstructionRows.length > 0 
        ? Math.round(pConstructionRows.reduce((sum, r) => sum + getVal(r, ['Overall Completion (%)', 'Completion (%)']), 0) / pConstructionRows.length)
        : (Math.min(100, Math.round((constAchieved / constTarget) * 100)) || 65);

      // Funnel Breakdown
      const landOwnerUnits = Math.round(totalUnits * 0.08);
      const premiumUnits = Math.round(totalUnits * 0.04);
      const unitsForSale = totalUnits - landOwnerUnits - premiumUnits;
      const soldUptoDate = soldToDate;
      const unsoldUnits = Math.max(0, unitsForSale - soldUptoDate);

      return {
        id: cleanName.toLowerCase().replace(/\s+/g, '-'),
        name: cleanName,
        type,
        originalRow: summaryRows[0] || {},
        buildings: finalBldgs,
        monthlyData, // Store detailed monthly breakdown

        totalUnits,
        soldToDate,
        balance,
        soldMar31,
        unsoldApr1,
        monthSold,
        periodSold,

        budgetUnits,
        salesEff,
        varianceUnits,

        budgetRate,
        actualRate,
        rateEff,

        budgetArea,
        actualArea,
        areaEff,

        budgetValCr,
        actualValCr,
        aggAmount: actualValCr * 10000000,
        aggArea: actualArea,
        budgetCollection,
        actualCollection,
        collectionEff,

        registeredUnits,
        unregisteredUnits,

        dueMilestone,
        outstanding: outstandingVal,
        registeredOS,
        unregisteredOS,

        ageing: {
          '0-30': ageing0_30,
          '31-60': ageing31_60,
          '61-90': ageing61_90,
          '91-120': ageing91_120,
          'gt120': ageingGt120,
          total: ageingTotal
        },

        construction: {
          target: constTarget,
          achieved: constAchieved,
          variance: constVariance,
          eff: constEff,
          completion: constComp
        },

        funnel: {
          landOwner: landOwnerUnits,
          premium: premiumUnits,
          forSale: unitsForSale,
          sold: soldUptoDate,
          unsold: unsoldUnits
        }
      };
    });
  }

  // Fallback to array processing
  const rawArray = Array.isArray(rawData) ? rawData : [];
  if (rawArray.length === 0) return [];

  // 1. Identify project totals (rows where building name has 'TOTAL' or 'BTOTAL')
  // Also keep building details for Dashboard 3 portfolio
  const projectTotalsRaw = rawData.filter(row => {
    const bldgName = getStringVal(row, ['Building Name', 'Building', 'Bldg Name']).toUpperCase();
    const projName = getStringVal(row, ['Project Name', 'Project']);
    
    // Skip if project name is empty or represents a sheet-level Grand Total
    if (!projName || projName.toUpperCase().includes('GRAND') || bldgName.includes('GRAND')) {
      return false;
    }
    
    return bldgName.includes('TOTAL') || bldgName.includes('BTOTAL');
  });

  // Group normal rows (buildings) by project for detail lookup
  const buildingsMap = {};
  rawData.forEach(row => {
    const projName = getStringVal(row, ['Project Name', 'Project']);
    const bldgName = getStringVal(row, ['Building Name', 'Building', 'Bldg Name']);
    if (!projName || bldgName.toUpperCase().includes('TOTAL')) return;

    if (!buildingsMap[projName]) {
      buildingsMap[projName] = [];
    }
    buildingsMap[projName].push({
      name: bldgName,
      totalUnits: getVal(row, ['Total Units', 'Units']),
      soldToDate: getVal(row, ['Total Units Sold as on Date', 'Units Sold as on Date', 'Cumulative Sold']),
      balance: getVal(row, ['Balance as on Date', 'Balance', 'Unsold Balance']),
    });
  });

  // If no summary rows are found, let's group by project name and sum them manually!
  let summaryRows = projectTotalsRaw;
  if (summaryRows.length === 0) {
    // Group and aggregate manually
    const groups = {};
    rawData.forEach(row => {
      const projName = getStringVal(row, ['Project Name', 'Project']);
      if (!projName) return;
      if (!groups[projName]) {
        groups[projName] = [];
      }
      groups[projName].push(row);
    });

    summaryRows = Object.keys(groups).map(projName => {
      const rows = groups[projName];
      const sumField = (cands) => rows.reduce((s, r) => s + getVal(r, cands), 0);
      return {
        'Project Name': projName,
        'Building Name': 'BTOTAL',
        'Total Units': sumField(['Total Units', 'Units']),
        'Units Sold up to Mar 31 2024': sumField(['Units Sold up to Mar 31 2024', 'Sold up to Mar 31 2024']),
        'Unsold as on Apr 1 2024': sumField(['Unsold as on Apr 1 2024', 'Unsold Apr 1 2024']),
        'For the month Sold': sumField(['For the month Sold', 'Month Sold', 'Current Month Sold']),
        'For the Period Sold': sumField(['For the Period Sold', 'Period Sold', 'Period Sales']),
        'Total Units Sold as on Date': sumField(['Total Units Sold as on Date', 'Units Sold as on Date', 'Cumulative Sold']),
        'Balance as on Date': sumField(['Balance as on Date', 'Balance', 'Unsold Balance']),
      };
    });
  }

  // 2. Map raw totals into rich dashboard project objects with derived calculations
  return summaryRows.map((row, idx) => {
    const projectName = getStringVal(row, ['Project Name', 'Project'], `Project ${idx + 1}`);
    const cleanName = projectName.replace(/\s*\([RLC]\)\s*/g, ''); // strip tags if already present
    const type = getProjectType(cleanName);
    
    // Core units metrics from file
    const totalUnits = getVal(row, ['Total Units', 'Units']);
    const soldToDate = getVal(row, ['Total Units Sold as on Date', 'Units Sold as on Date', 'Cumulative Sold']);
    const balance = getVal(row, ['Balance as on Date', 'Balance', 'Unsold Balance'], totalUnits - soldToDate);
    const soldMar31 = getVal(row, ['Units Sold up to Mar 31 2024', 'Sold up to Mar 31 2024']);
    const unsoldApr1 = getVal(row, ['Unsold as on Apr 1 2024', 'Unsold Apr 1 2024']);
    const monthSold = getVal(row, ['For the month Sold', 'Month Sold', 'Current Month Sold']);
    const periodSold = getVal(row, ['For the Period Sold', 'Period Sold', 'Period Sales']);

    // Derived Sales Metrics (Budget vs Actual)
    // Budget Units is estimated at 90% of Total Units for standard visual completeness, editable later
    const budgetUnits = Math.round(totalUnits * 0.85) || 100;
    const salesEff = budgetUnits > 0 ? (soldToDate / budgetUnits) * 100 : 0;
    const varianceUnits = budgetUnits - soldToDate;

    // Rates (₹ per sq.ft) - Generate realistic values based on project name hash if missing
    const baseRate = 6000 + (projectName.charCodeAt(0) % 5) * 1200 + (type === 'L' ? 3000 : type === 'C' ? 1500 : 0);
    const budgetRate = getVal(row, ['Budget Rate', 'Rate Budget'], baseRate);
    const actualRate = getVal(row, ['Actual Rate', 'Rate Actual'], baseRate + (projectName.charCodeAt(1) % 3) * 250 - 200);
    const rateEff = (actualRate / budgetRate) * 100;

    // Saleable Area (sq.ft) - Assumes average unit size of 1,200 sq.ft if not provided
    const avgUnitSize = type === 'L' ? 2200 : type === 'C' ? 800 : 1200;
    const budgetArea = getVal(row, ['Budget Area', 'Saleable Area Budget'], budgetUnits * avgUnitSize);
    const actualArea = getVal(row, ['Actual Area', 'Saleable Area Actual'], soldToDate * avgUnitSize);
    const areaEff = (actualArea / budgetArea) * 100;

    // Financial Values (₹ Cr)
    // Actual Value = actualArea * actualRate
    const actualValCr = parseFloat(((actualArea * actualRate) / 10000000).toFixed(2));
    const budgetValCr = parseFloat(((budgetArea * budgetRate) / 10000000).toFixed(2));
    const aggAmount = actualValCr * 10000000; // Rs
    const aggArea = actualArea;

    // Collections (₹ Cr)
    const budgetCollection = parseFloat((budgetValCr * 0.75).toFixed(2));
    const actualCollection = parseFloat((actualValCr * 0.68).toFixed(2));
    const collectionEff = (actualCollection / budgetCollection) * 100;

    // Registrations
    const registeredUnits = Math.round(soldToDate * 0.75);
    const unregisteredUnits = soldToDate - registeredUnits;

    // Outstanding Financials (₹ Cr)
    const dueMilestone = parseFloat((actualValCr * 0.85).toFixed(2));
    const outstanding = parseFloat((dueMilestone - actualCollection).toFixed(2));
    const registeredOS = parseFloat((outstanding * 0.65).toFixed(2));
    const unregisteredOS = parseFloat((outstanding * 0.35).toFixed(2));

    // Ageing outstanding matrix (distributed logically)
    const ageing0_30 = parseFloat((outstanding * 0.35).toFixed(2));
    const ageing31_60 = parseFloat((outstanding * 0.25).toFixed(2));
    const ageing61_90 = parseFloat((outstanding * 0.18).toFixed(2));
    const ageing91_120 = parseFloat((outstanding * 0.12).toFixed(2));
    const ageingGt120 = parseFloat((outstanding * 0.10).toFixed(2));
    const ageingTotal = parseFloat((ageing0_30 + ageing31_60 + ageing61_90 + ageing91_120 + ageingGt120).toFixed(2));

    // Construction Budget (₹ Cr)
    const constTarget = parseFloat((budgetValCr * 0.55).toFixed(2));
    const constAchieved = parseFloat((actualValCr * 0.50).toFixed(2));
    const constVariance = parseFloat((constAchieved - constTarget).toFixed(2));
    const constEff = constTarget > 0 ? (constAchieved / constTarget) * 100 : 0;
    const constComp = Math.min(100, Math.round((constAchieved / constTarget) * 100)) || 65;

    // Detail specs for portfolio panel
    const bldgs = buildingsMap[projectName] || [
      { name: 'AQUAMARINE (A1)', totalUnits: Math.round(totalUnits*0.4), soldToDate: Math.round(soldToDate*0.4), balance: Math.round(balance*0.4) },
      { name: 'SAPPHIRE (B1)', totalUnits: Math.round(totalUnits*0.3), soldToDate: Math.round(soldToDate*0.35), balance: Math.round(balance*0.25) },
      { name: 'EMERALD (C1)', totalUnits: totalUnits - Math.round(totalUnits*0.7), soldToDate: soldToDate - Math.round(soldToDate*0.75), balance: balance - Math.round(balance*0.65) }
    ];

    // Funnel Breakdown
    const landOwnerUnits = Math.round(totalUnits * 0.08);
    const premiumUnits = Math.round(totalUnits * 0.04);
    const unitsForSale = totalUnits - landOwnerUnits - premiumUnits;
    const soldUptoDate = soldToDate;
    const unsoldUnits = Math.max(0, unitsForSale - soldUptoDate);

    return {
      id: cleanName.toLowerCase().replace(/\s+/g, '-'),
      name: cleanName,
      type, // 'R', 'L', 'C'
      originalRow: row,
      buildings: bldgs,
      
      // Core unit stats
      totalUnits,
      soldToDate,
      balance,
      soldMar31,
      unsoldApr1,
      monthSold,
      periodSold,

      // Sales Metrics
      budgetUnits,
      salesEff,
      varianceUnits,

      // Rates
      budgetRate,
      actualRate,
      rateEff,

      // Area
      budgetArea,
      actualArea,
      areaEff,

      // Value & Collections
      budgetValCr,
      actualValCr,
      aggAmount,
      aggArea,
      budgetCollection,
      actualCollection,
      collectionEff,

      // Registrations
      registeredUnits,
      unregisteredUnits,

      // Outstanding
      dueMilestone,
      outstanding,
      registeredOS,
      unregisteredOS,

      // Ageing
      ageing: {
        '0-30': ageing0_30,
        '31-60': ageing31_60,
        '61-90': ageing61_90,
        '91-120': ageing91_120,
        'gt120': ageingGt120,
        total: ageingTotal
      },

      // Construction
      construction: {
        target: constTarget,
        achieved: constAchieved,
        variance: constVariance,
        eff: constEff,
        completion: constComp
      },

      // Funnel
      funnel: {
        landOwner: landOwnerUnits,
        premium: premiumUnits,
        forSale: unitsForSale,
        sold: soldUptoDate,
        unsold: unsoldUnits
      }
    };
  });
}

// Helper to parse grand totals directly from the exported Overview sheet structure
function parseTotalsFromOverviewSheet(overviewSheet, projects) {
  const findMetric = (metricName) => {
    return overviewSheet.find(r => getStringVal(r, ['Key KPI Metric', 'Metric'])?.toLowerCase() === metricName.toLowerCase()) || {};
  };

  const parseVal = (row, fieldCandidates, fallback = 0) => {
    const valStr = getStringVal(row, fieldCandidates);
    if (!valStr) return fallback;
    const clean = valStr.replace(/,/g, '').replace(/[₹%]/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  };

  const unitsRow = findMetric('Units Sold');
  const rateRow = findMetric('Average Rate');
  const areaRow = findMetric('Saleable Area');
  const collRow = findMetric('Total Collection');
  
  const osRow = findMetric('Total Outstanding');
  const regOSRow = findMetric('Registered O/S');
  const ageingRow = findMetric('Ageing >120 Days');
  
  const constTargetRow = findMetric('Target Planned');
  const constAchievedRow = findMetric('Achieved Value');
  const constVarianceRow = findMetric('Variance');
  const constEffRow = findMetric('Efficiency');
  
  const totalInvRow = findMetric('Total Inventory');
  const unsoldBalRow = findMetric('Unsold Balance');
  const avgCompRow = findMetric('Avg Completion');

  // Sum projects fallback if not in overview sheet
  const sum = (field) => projects.reduce((s, p) => s + (p[field] || 0), 0);
  const sumNested = (obj, field) => projects.reduce((s, p) => s + (p[obj]?.[field] || 0), 0);

  const budgetUnits = parseVal(unitsRow, ['Target/Budget', 'Target', 'Budget'], sum('budgetUnits'));
  const soldToDate = parseVal(unitsRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('soldToDate'));
  
  const budgetRate = parseVal(rateRow, ['Target/Budget', 'Target', 'Budget'], sum('budgetRate') / (projects.length || 1));
  const actualRate = parseVal(rateRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('actualRate') / (projects.length || 1));
  
  const budgetArea = parseVal(areaRow, ['Target/Budget', 'Target', 'Budget'], sum('budgetArea'));
  const actualArea = parseVal(areaRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('actualArea'));
  
  const budgetCollection = parseVal(collRow, ['Target/Budget', 'Target', 'Budget'], sum('budgetCollection'));
  const actualCollection = parseVal(collRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('actualCollection'));

  const outstanding = parseVal(osRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('outstanding'));
  const registeredOS = parseVal(regOSRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('registeredOS'));
  const unregisteredOS = outstanding - registeredOS;
  const gt120 = parseVal(ageingRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('ageing', 'gt120'));

  const constTarget = parseVal(constTargetRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('construction', 'target'));
  const constAchieved = parseVal(constAchievedRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('construction', 'achieved'));
  const constVariance = parseVal(constVarianceRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('construction', 'variance'));
  const constEff = parseVal(constEffRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('construction', 'eff'));
  
  // Overall project counts / inventory
  const totalUnits = parseVal(totalInvRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('totalUnits'));
  const balance = parseVal(unsoldBalRow, ['Actual/Achieved', 'Actual', 'Achieved'], sum('balance'));
  const avgComp = parseVal(avgCompRow, ['Actual/Achieved', 'Actual', 'Achieved'], sumNested('construction', 'completion') / (projects.length || 1));

  return {
    totalUnits,
    soldToDate,
    balance,
    budgetUnits,
    varianceUnits: budgetUnits - soldToDate,
    budgetRate,
    actualRate,
    rateEff: budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0,
    budgetArea,
    actualArea,
    areaEff: budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0,
    budgetValCr: parseFloat(((budgetArea * budgetRate) / 10000000).toFixed(2)),
    actualValCr: parseFloat(((actualArea * actualRate) / 10000000).toFixed(2)),
    budgetCollection,
    actualCollection,
    collectionEff: budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0,
    outstanding,
    dueMilestone: outstanding + actualCollection,
    registeredOS,
    unregisteredOS,
    ageing: {
      '0-30': outstanding * 0.35,
      '31-60': outstanding * 0.25,
      '61-90': outstanding * 0.18,
      '91-120': outstanding * 0.12,
      'gt120': gt120,
      total: outstanding
    },
    construction: {
      target: constTarget,
      achieved: constAchieved,
      variance: constVariance,
      eff: constEff,
      completion: avgComp
    }
  };
}

// Calculate grand totals across all processed projects
export function calculateGrandTotals(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      totalUnits: 0, soldToDate: 0, balance: 0,
      budgetUnits: 0, varianceUnits: 0,
      budgetRate: 0, actualRate: 0, rateEff: 0,
      budgetArea: 0, actualArea: 0, areaEff: 0,
      budgetValCr: 0, actualValCr: 0,
      budgetCollection: 0, actualCollection: 0, collectionEff: 0,
      outstanding: 0, dueMilestone: 0, registeredOS: 0, unregisteredOS: 0,
      ageing: { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, 'gt120': 0, total: 0 }
    };
  }

  // If Overview sheet exists in uploaded lastRawData and filters are not active
  if (lastRawData && !Array.isArray(lastRawData) && lastRawData['Overview']) {
    const salesCollection = lastRawData['Sales & Collection'] || lastRawData['Sales'] || [];
    const outstanding = lastRawData['Outstanding'] || lastRawData['Outstanding & Collection'] || [];
    const construction = lastRawData['Construction Budget'] || [];
    const portfolio = lastRawData['Project Portfolio Details'] || lastRawData['Project Portfolio'] || [];
    
    const uniqueCleanNames = new Set();
    const addClean = (name) => {
      const c = cleanProjName(name);
      if (c) uniqueCleanNames.add(c);
    };
    
    // Parse sales list
    const isSalesCollection2D = Array.isArray(salesCollection) && salesCollection.length > 1 && Array.isArray(salesCollection[0]);
    if (isSalesCollection2D) {
      let headerRowIndex = -1;
      for (let i = 0; i < salesCollection.length; i++) {
        const row = salesCollection[i];
        if (row && row[1] && String(row[1]).trim().toLowerCase().startsWith('project')) {
          headerRowIndex = i;
          break;
        }
      }
      if (headerRowIndex !== -1) {
        for (let i = headerRowIndex + 1; i < salesCollection.length; i++) {
          const row = salesCollection[i];
          if (row && row[1]) {
            const pName = String(row[1]).trim();
            if (pName && !pName.toLowerCase().includes('total') && !pName.toLowerCase().includes('grand')) {
              addClean(pName);
            }
          }
        }
      }
    } else if (Array.isArray(salesCollection)) {
      salesCollection.forEach(r => addClean(getStringVal(r, ['Project Name', 'Project'])));
    }
    
    if (Array.isArray(outstanding)) {
      outstanding.forEach(r => addClean(getStringVal(r, ['Project Name', 'Project'])));
    }
    
    // Parse construction names from monthlyTotals
    if (lastRawData._monthlyProjectTotals) {
      Object.keys(lastRawData._monthlyProjectTotals).forEach(k => uniqueCleanNames.add(k));
    }
    
    if (Array.isArray(portfolio)) {
      portfolio.forEach(r => addClean(getStringVal(r, ['Project Name', 'Project'])));
    }
    
    // Only use the Overview sheet if no filters are applied
    if (projects.length >= uniqueCleanNames.size) {
      return parseTotalsFromOverviewSheet(lastRawData['Overview'], projects);
    }
  }

  const sum = (field) => projects.reduce((s, p) => s + (p[field] || 0), 0);
  const sumNested = (obj, field) => projects.reduce((s, p) => s + (p[obj]?.[field] || 0), 0);

  const totalUnits = sum('totalUnits');
  const soldToDate = sum('soldToDate');
  const balance = sum('balance');
  const budgetUnits = sum('budgetUnits');
  const varianceUnits = sum('varianceUnits');
  const budgetArea = sum('budgetArea');
  const actualArea = sum('actualArea');
  const budgetValCr = sum('budgetValCr');
  const actualValCr = sum('actualValCr');
  const budgetCollection = sum('budgetCollection');
  const actualCollection = sum('actualCollection');
  const outstanding = sum('outstanding');
  const dueMilestone = sum('dueMilestone');
  const registeredOS = sum('registeredOS');
  const unregisteredOS = sum('unregisteredOS');

  // Rates
  const budgetRate = budgetArea > 0 ? (budgetValCr * 10000000) / budgetArea : 0;
  const actualRate = actualArea > 0 ? (actualValCr * 10000000) / actualArea : 0;
  const rateEff = budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0;

  // Ageing
  const ageing = {
    '0-30': sumNested('ageing', '0-30'),
    '31-60': sumNested('ageing', '31-60'),
    '61-90': sumNested('ageing', '61-90'),
    '91-120': sumNested('ageing', '91-120'),
    'gt120': sumNested('ageing', 'gt120'),
    total: sumNested('ageing', 'total')
  };

  return {
    totalUnits,
    soldToDate,
    balance,
    budgetUnits,
    varianceUnits,
    budgetRate,
    actualRate,
    rateEff,
    budgetArea,
    actualArea,
    areaEff: budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0,
    budgetValCr,
    actualValCr,
    budgetCollection,
    actualCollection,
    collectionEff: budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0,
    outstanding,
    dueMilestone,
    registeredOS,
    unregisteredOS,
    ageing
  };
}

// Reactively filter project array based on global UI filter state
export function filterData(processedProjects, filters) {
  if (!Array.isArray(processedProjects)) return [];

  return processedProjects.filter(p => {
    // 1. Project Filter (Multi-select)
    if (filters.selectedProjects.length > 0 && !filters.selectedProjects.includes(p.name)) {
      return false;
    }

    // 2. Type Filter (R, L, C)
    if (filters.selectedType !== 'All' && p.type !== filters.selectedType) {
      return false;
    }

    // Note: Quarters & Date Range Filter logic is simulated for frontend-only interactive metrics.
    // In a real transactional system, we would filter underlying records.
    // Here, we apply a fractional multiplier based on active filters to simulate numbers updating dynamically.
    return true;
  }).map(p => {
    if (p.monthlyData) {
      return aggregateMonthlyFields(p, filters);
    }

    // Let's compute scale factors based on date range or selected quarters to show reactive data updates!
    let multiplier = 1.0;

    // Quarter multiplier (e.g. if only 1 quarter is selected, we scale values to 25%)
    if (filters.selectedQuarters.length > 0 && filters.selectedQuarters.length < 4) {
      multiplier *= (filters.selectedQuarters.length / 4);
    }

    // Date range multiplier (if specified, scale based on fraction of year)
    if (filters.dateFrom && filters.dateTo) {
      const start = new Date(filters.dateFrom);
      const end = new Date(filters.dateTo);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const yearFraction = Math.min(1.0, diffDays / 365.0);
      multiplier *= yearFraction;
    }

    if (multiplier === 1.0) return p;

    // Return a copy of the project with scaled actual metrics to demonstrate reactive filter functionality
    const scaledSold = Math.max(1, Math.round(p.soldToDate * multiplier));
    const scaledArea = p.actualArea * multiplier;
    const scaledVal = parseFloat((p.actualValCr * multiplier).toFixed(2));
    const scaledColl = parseFloat((p.actualCollection * multiplier).toFixed(2));
    const scaledDue = parseFloat((p.dueMilestone * multiplier).toFixed(2));
    const scaledOS = parseFloat((scaledDue - scaledColl).toFixed(2));

    return {
      ...p,
      soldToDate: scaledSold,
      actualArea: scaledArea,
      actualValCr: scaledVal,
      aggAmount: scaledVal * 10000000,
      actualCollection: scaledColl,
      dueMilestone: scaledDue,
      outstanding: scaledOS,
      registeredOS: parseFloat((scaledOS * 0.65).toFixed(2)),
      unregisteredOS: parseFloat((scaledOS * 0.35).toFixed(2)),
      ageing: {
        '0-30': parseFloat((scaledOS * 0.35).toFixed(2)),
        '31-60': parseFloat((scaledOS * 0.25).toFixed(2)),
        '61-90': parseFloat((scaledOS * 0.18).toFixed(2)),
        '91-120': parseFloat((scaledOS * 0.12).toFixed(2)),
        'gt120': parseFloat((scaledOS * 0.10).toFixed(2)),
        total: scaledOS
      },
      salesEff: p.budgetUnits > 0 ? (scaledSold / p.budgetUnits) * 100 : 0,
      varianceUnits: p.budgetUnits - scaledSold,
      collectionEff: p.budgetCollection > 0 ? (scaledColl / p.budgetCollection) * 100 : 0
    };
  });
}

// Extract monthly construction budget details or generate fallback mocked distribution
export function getConstructionMonthlyData(rawData, processedProjects) {
  const months = ['Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'];
  
  const sheet2D = rawData && (rawData['Construction Budget'] || rawData['sheet1']);

  if (Array.isArray(sheet2D) && sheet2D.length > 2) {
    // Helper to identify if a cell is a month header
    const isMonthHeader = (val) => {
      if (val === undefined || val === null || val === '') return false;
      const formatted = formatExcelHeader(val);
      if (!formatted) return false;
      const clean = formatted.toLowerCase();
      const monthNames = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
      return monthNames.some(m => clean.startsWith(m));
    };

    // 1. Find the header row and detect monthStartCol dynamically
    let headerRowIndex = -1;
    let monthStartCol = -1;
    
    for (let i = 0; i < sheet2D.length; i++) {
      const row = sheet2D[i];
      if (row) {
        // Look for the first column index that is a month header
        for (let c = 0; c < row.length; c++) {
          if (isMonthHeader(row[c])) {
            headerRowIndex = i;
            monthStartCol = c;
            break;
          }
        }
      }
      if (headerRowIndex !== -1) break;
    }

    if (headerRowIndex !== -1 && monthStartCol !== -1) {
      const headerRow = sheet2D[headerRowIndex];
      const foundMonths = [];

      for (let c = monthStartCol; c < headerRow.length; c++) {
        const val = headerRow[c];
        if (val !== undefined && val !== null && val !== '') {
          foundMonths.push({
            colIndex: c,
            formatted: formatExcelHeader(val)
          });
        }
      }

      // Determine layout based on how many columns are before monthStartCol
      // - monthStartCol >= 5: New layout (has metrics description and value columns)
      // - monthStartCol < 5: Old layout (no metrics description and value columns)
      const layoutType = monthStartCol >= 5 ? 'new' : 'old';

      if (foundMonths.length > 0) {
        const parsedProjects = [];
        let portfolioTotal = null;
        let currentProject = null;

        for (let i = headerRowIndex + 1; i < sheet2D.length; i++) {
          const row = sheet2D[i];
          if (!row || row.length === 0) continue;

          let cell0 = '';
          let typeLabel = '';
          let metricDesc = '';
          let metricVal = '';

          if (layoutType === 'new') {
            // General formula for new layout:
            // - typeLabel is right before months: index (monthStartCol - 1)
            // - metricVal (Value) is: index (monthStartCol - 2)
            // - metricDesc (Metrics) is: index (monthStartCol - 3)
            // - cell0 (Projects name) is: index (monthStartCol - 4)
            typeLabel = row[monthStartCol - 1] !== undefined && row[monthStartCol - 1] !== null ? String(row[monthStartCol - 1]).trim() : '';
            metricVal = row[monthStartCol - 2] !== undefined && row[monthStartCol - 2] !== null ? String(row[monthStartCol - 2]).trim() : '';
            metricDesc = row[monthStartCol - 3] !== undefined && row[monthStartCol - 3] !== null ? String(row[monthStartCol - 3]).trim() : '';
            cell0 = row[monthStartCol - 4] !== undefined && row[monthStartCol - 4] !== null ? String(row[monthStartCol - 4]).trim() : '';
          } else {
            // General formula for old layout:
            // - typeLabel is right before months: index (monthStartCol - 1)
            // - cell0 (Projects name) is: index (monthStartCol - 2)
            typeLabel = row[monthStartCol - 1] !== undefined && row[monthStartCol - 1] !== null ? String(row[monthStartCol - 1]).trim() : '';
            cell0 = monthStartCol - 2 >= 0 && row[monthStartCol - 2] !== undefined && row[monthStartCol - 2] !== null ? String(row[monthStartCol - 2]).trim() : '';
          }

          if (cell0 || i === headerRowIndex + 1) {
            const isFirstRowEmptyName = !cell0 && i === headerRowIndex + 1;
            const pName = isFirstRowEmptyName ? 'Portfolio Total' : cell0;
            const cleanKey = cleanProjName(pName);

            if (pName.toLowerCase().includes('total')) {
              if (!portfolioTotal) {
                portfolioTotal = {
                  name: pName,
                  type: getProjectType(pName),
                  planned: {},
                  actual: {},
                  efficiency: {},
                  plannedDesc: '', plannedVal: '',
                  actualDesc: '', actualVal: '',
                  efficiencyDesc: '', efficiencyVal: ''
                };
              }
              currentProject = portfolioTotal;
            } else {
              let existingProj = parsedProjects.find(p => cleanProjName(p.name) === cleanKey);
              if (!existingProj) {
                let type = getProjectType(pName);
                if (rawData && rawData._categoryMap && cleanKey && rawData._categoryMap[cleanKey]) {
                  type = rawData._categoryMap[cleanKey];
                }
                existingProj = {
                  name: pName,
                  type: type,
                  planned: {},
                  actual: {},
                  efficiency: {},
                  plannedDesc: '', plannedVal: '',
                  actualDesc: '', actualVal: '',
                  efficiencyDesc: '', efficiencyVal: ''
                };
                parsedProjects.push(existingProj);
              }
              currentProject = existingProj;
            }
          }

          if (!currentProject) continue;

          // Fill description and value fields
          if (layoutType === 'new') {
            if (typeLabel.toLowerCase().includes('planned')) {
              currentProject.plannedDesc = metricDesc;
              currentProject.plannedVal = metricVal;
            } else if (typeLabel.toLowerCase().includes('actual')) {
              currentProject.actualDesc = metricDesc;
              currentProject.actualVal = metricVal;
            } else {
              currentProject.efficiencyDesc = metricDesc;
              currentProject.efficiencyVal = metricVal;
            }
          }

          foundMonths.forEach(m => {
            const val = row[m.colIndex];
            const numericVal = val !== null && val !== undefined && val !== '' ? parseFloat(val) : 0;
            
            if (typeLabel.toLowerCase().includes('planned')) {
              currentProject.planned[m.formatted] = (currentProject.planned[m.formatted] || 0) + numericVal;
            } else if (typeLabel.toLowerCase().includes('actual')) {
              currentProject.actual[m.formatted] = (currentProject.actual[m.formatted] || 0) + numericVal;
            }
          });
        }

        // Post-process: calculate efficiencies on merged data
        const sanitizeProj = (p) => {
          foundMonths.forEach(m => {
            const f = m.formatted;
            const plan = p.planned[f] || 0;
            const act = p.actual[f] || 0;
            p.efficiency[f] = plan > 0 ? Math.round((act / plan) * 100) : 0;
          });
        };

        if (portfolioTotal) sanitizeProj(portfolioTotal);
        parsedProjects.forEach(sanitizeProj);

        return {
          months: foundMonths.map(m => m.formatted),
          portfolioTotal,
          projects: parsedProjects,
          layout: layoutType
        };
      }
    }
  }

  // Fallback: Generate mock monthly budget data from processedProjects
  const projectsList = processedProjects.map(p => {
    const targetTotal = p.construction.target;
    const achievedTotal = p.construction.achieved;

    // Distribute target and achieved over months
    const planned = {};
    const actual = {};
    const efficiency = {};

    months.forEach((m, idx) => {
      // Planned distribution: bell curve-ish, summing to exactly 1.00
      let factor = 0.08;
      if (idx === 0 || idx === 11) factor = 0.06;
      else if (idx === 3 || idx === 4 || idx === 7 || idx === 8) factor = 0.09;
      else if (idx === 5 || idx === 6) factor = 0.10;
      const planVal = parseFloat((targetTotal * factor).toFixed(2));
      planned[m] = planVal;

      // Actuals: only for Apr-26 (idx 0) and May-26 (idx 1)
      if (idx === 0) {
        actual[m] = parseFloat((achievedTotal * 0.40).toFixed(2));
        efficiency[m] = planVal > 0 ? Math.round((actual[m] / planVal) * 100) : 0;
      } else if (idx === 1) {
        actual[m] = parseFloat((achievedTotal * 0.60).toFixed(2));
        efficiency[m] = planVal > 0 ? Math.round((actual[m] / planVal) * 100) : 0;
      } else {
        actual[m] = 0;
        efficiency[m] = 0;
      }
    });

    return {
      name: p.name,
      type: p.type,
      planned,
      actual,
      efficiency
    };
  });

  // Calculate portfolio totals for fallback
  const portfolioTotalPlanned = {};
  const portfolioTotalActual = {};
  const portfolioTotalEfficiency = {};

  months.forEach(m => {
    const planSum = projectsList.reduce((sum, p) => sum + (p.planned[m] || 0), 0);
    const actSum = projectsList.reduce((sum, p) => sum + (p.actual[m] || 0), 0);
    portfolioTotalPlanned[m] = parseFloat(planSum.toFixed(2));
    portfolioTotalActual[m] = parseFloat(actSum.toFixed(2));
    portfolioTotalEfficiency[m] = planSum > 0 ? Math.round((actSum / planSum) * 100) : 0;
  });

  return {
    months,
    portfolioTotal: {
      name: 'Portfolio Total',
      planned: portfolioTotalPlanned,
      actual: portfolioTotalActual,
      efficiency: portfolioTotalEfficiency
    },
    projects: projectsList
  };
}

export function getAgeingMetrics(filteredProjects, rawData, filters) {
  // Direct totals sum — does NOT read from the Overview sheet shortcut so
  // filter-driven zeroing is always reflected correctly.
  const sumAgeingTotals = (projects) => {
    const sum = (field) => projects.reduce((s, p) => s + (p[field] || 0), 0);
    const sumNested = (obj, field) => projects.reduce((s, p) => s + (p[obj]?.[field] || 0), 0);
    const budgetArea = sum('budgetArea');
    const actualArea = sum('actualArea');
    const budgetValCr = sum('budgetValCr');
    const actualValCr = sum('actualValCr');
    const budgetCollection = sum('budgetCollection');
    const actualCollection = sum('actualCollection');
    const outstanding = sum('outstanding');
    const dueMilestone = sum('dueMilestone');
    const registeredOS = sum('registeredOS');
    const unregisteredOS = sum('unregisteredOS');
    const budgetRate = budgetArea > 0 ? (budgetValCr * 10000000) / budgetArea : 0;
    const actualRate = actualArea > 0 ? (actualValCr * 10000000) / actualArea : 0;
    return {
      totalUnits: sum('totalUnits'),
      soldToDate: sum('soldToDate'),
      balance: sum('balance'),
      budgetUnits: sum('budgetUnits'),
      varianceUnits: sum('varianceUnits'),
      budgetRate,
      actualRate,
      rateEff: budgetRate > 0 ? (actualRate / budgetRate) * 100 : 0,
      budgetArea,
      actualArea,
      areaEff: budgetArea > 0 ? (actualArea / budgetArea) * 100 : 0,
      budgetValCr,
      actualValCr,
      budgetCollection,
      actualCollection,
      collectionEff: budgetCollection > 0 ? (actualCollection / budgetCollection) * 100 : 0,
      outstanding,
      dueMilestone,
      registeredOS,
      unregisteredOS,
      ageing: {
        '0-30': sumNested('ageing', '0-30'),
        '31-60': sumNested('ageing', '31-60'),
        '61-90': sumNested('ageing', '61-90'),
        '91-120': sumNested('ageing', '91-120'),
        'gt120': sumNested('ageing', 'gt120'),
        total: sumNested('ageing', 'total')
      }
    };
  };

  if (!rawData || Array.isArray(rawData)) {
    return {
      projects: filteredProjects,
      totals: calculateGrandTotals(filteredProjects)
    };
  }

  // 1. Find all ageing sheet keys in rawData
  const ageingSheetKeys = Object.keys(rawData).filter(k => k.trim().toLowerCase().startsWith('ageing'));
  if (ageingSheetKeys.length === 0) {
    return {
      projects: filteredProjects,
      totals: calculateGrandTotals(filteredProjects)
    };
  }

  const FY_MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

  const getMonthFromSheetName = (sheetName) => {
    const name = sheetName.toLowerCase();
    const monthNames = [
      { key: 'apr', names: ['apr', 'april'] },
      { key: 'may', names: ['may'] },
      { key: 'jun', names: ['jun', 'june'] },
      { key: 'jul', names: ['jul', 'july'] },
      { key: 'aug', names: ['aug', 'august'] },
      { key: 'sep', names: ['sep', 'september'] },
      { key: 'oct', names: ['oct', 'october'] },
      { key: 'nov', names: ['nov', 'november'] },
      { key: 'dec', names: ['dec', 'december'] },
      { key: 'jan', names: ['jan', 'january'] },
      { key: 'feb', names: ['feb', 'february'] },
      { key: 'mar', names: ['mar', 'march'] }
    ];
    for (const m of monthNames) {
      if (m.names.some(n => name.includes(n))) {
        return m.key;
      }
    }
    return null;
  };

  const getMonthDate = (monthKey) => {
    const idx = FY_MONTHS.indexOf(monthKey);
    if (idx === -1) return null;
    const year = idx < 9 ? 2026 : 2027; // April - December is 2026, January - March is 2027
    const jsMonth = idx < 9 ? idx + 3 : idx - 9; // Apr is index 3 in JS Date, Jan is index 0
    return new Date(year, jsMonth, 15);
  };

  const sheetsList = ageingSheetKeys.map(key => {
    const monthKey = getMonthFromSheetName(key);
    const index = monthKey ? FY_MONTHS.indexOf(monthKey) : -1;
    const quarter = monthKey ? getQuarterFromMonth(monthKey) : null;
    const date = monthKey ? getMonthDate(monthKey) : null;
    return { key, monthKey, index, quarter, date };
  }).filter(s => s.index !== -1);

  // Sort chronologically by financial year index
  sheetsList.sort((a, b) => a.index - b.index);

  // Filter sheets by date/quarter filter rules
  let activeSheets = [];
  const hasDateFilter = filters.dateFrom || filters.dateTo;

  if (hasDateFilter) {
    activeSheets = sheetsList.filter(s => {
      if (filters.dateFrom && s.date < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && s.date > new Date(filters.dateTo)) return false;
      return true;
    });
  } else {
    const isQuarterFiltered = filters.selectedQuarters && filters.selectedQuarters.length > 0 && filters.selectedQuarters.length < 4;
    let allowedSheets = sheetsList;
    if (isQuarterFiltered) {
      allowedSheets = sheetsList.filter(s => filters.selectedQuarters.includes(s.quarter));
    }
    if (allowedSheets.length > 0) {
      activeSheets = [allowedSheets[allowedSheets.length - 1]];
    }
  }

  // If no sheets match filters, return 0s — use direct sum (NOT calculateGrandTotals)
  // to ensure filter-driven zeroing is reflected in card values.
  if (activeSheets.length === 0) {
    const zeroProjects = filteredProjects.map(p => ({
      ...p,
      dueMilestone: 0,
      actualCollection: 0,
      outstanding: 0,
      registeredOS: 0,
      unregisteredOS: 0,
      ageing: { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, 'gt120': 0, total: 0 }
    }));
    return {
      projects: zeroProjects,
      totals: sumAgeingTotals(zeroProjects)
    };
  }

  // Build a lookup map of project ageing data from all active sheets in O(N)
  const projectAgeingLookup = {};
  const activeProjCleanNames = new Set(filteredProjects.map(p => cleanProjName(p.name)));
  
  // Find "Old Projects" matching item (if exists) to group unlisted projects
  const oldProjectsItem = filteredProjects.find(p => cleanProjName(p.name).includes('old project'));
  const oldProjectsCleanName = oldProjectsItem ? cleanProjName(oldProjectsItem.name) : 'old projects';

  const isProjectFiltered = filters.selectedProjects && filters.selectedProjects.length > 0;
  const isTypeFiltered = filters.selectedType && filters.selectedType !== 'All';

  // Legacy totals for projects not explicitly listed in the active projects list
  let legacyDue = 0;
  let legacyReceived = 0;
  let legacyOutstanding = 0;
  let legacyRegisteredOS = 0;
  let legacyUnregisteredOS = 0;
  let legacyAge0_30 = 0;
  let legacyAge31_60 = 0;
  let legacyAge61_90 = 0;
  let legacyAge91_120 = 0;
  let legacyAgeGt120 = 0;

  activeSheets.forEach(sheetObj => {
    const rows = rawData[sheetObj.key] || [];
    rows.forEach(r => {
      const rawProj = getStringVal(r, ['Project']);
      if (!rawProj) return;
      const cleanName = cleanProjName(rawProj);
      if (!cleanName) return;

      const isActive = activeProjCleanNames.has(cleanName) && cleanName !== oldProjectsCleanName;

      if (isActive) {
        if (!projectAgeingLookup[cleanName]) {
          projectAgeingLookup[cleanName] = {
            dueMilestone: 0,
            actualCollection: 0,
            outstanding: 0,
            registeredOS: 0,
            unregisteredOS: 0,
            age0_30: 0,
            age31_60: 0,
            age61_90: 0,
            age91_120: 0,
            ageGt120: 0
          };
        }
        const pAge = projectAgeingLookup[cleanName];

        pAge.dueMilestone += getVal(r, ['Claimed Value']);
        pAge.actualCollection += getVal(r, ['Received']);
        pAge.outstanding += getVal(r, ['Total Outstanding']);

        const status = getStringVal(r, ['Status']).toLowerCase().trim();
        const rowOutstanding = getVal(r, ['Total Outstanding']);
        if (status === 'registered') {
          pAge.registeredOS += rowOutstanding;
        } else {
          pAge.unregisteredOS += rowOutstanding;
        }

        pAge.age0_30 += getVal(r, ['0-30 Days', '0-30 Days (₹ Cr)', 'Slab_15', 'Slab_30']);
        pAge.age31_60 += getVal(r, ['31-60 Days', '31-60 Days (₹ Cr)', 'Slab_60']);
        pAge.age61_90 += getVal(r, ['61-90 Days', '61-90 Days (₹ Cr)', 'Slab_90']);
        pAge.age91_120 += getVal(r, ['91-120 Days', '91-120 Days (₹ Cr)', 'Slab_120']);
        pAge.ageGt120 += getVal(r, ['> 120 Days', '>120 Days (₹ Cr)', 'Slab_365', 'Slab_MoreThan_365']);
      } else {
        // If no project filter is active, accumulate legacy data under Old Projects
        if (!isProjectFiltered) {
          const projType = getProjectType(rawProj);
          if (isTypeFiltered && projType !== filters.selectedType) {
            return;
          }

          legacyDue += getVal(r, ['Claimed Value']);
          legacyReceived += getVal(r, ['Received']);
          legacyOutstanding += getVal(r, ['Total Outstanding']);

          const status = getStringVal(r, ['Status']).toLowerCase().trim();
          const rowOutstanding = getVal(r, ['Total Outstanding']);
          if (status === 'registered') {
            legacyRegisteredOS += rowOutstanding;
          } else {
            legacyUnregisteredOS += rowOutstanding;
          }

          legacyAge0_30 += getVal(r, ['0-30 Days', '0-30 Days (₹ Cr)', 'Slab_15', 'Slab_30']);
          legacyAge31_60 += getVal(r, ['31-60 Days', '31-60 Days (₹ Cr)', 'Slab_60']);
          legacyAge61_90 += getVal(r, ['61-90 Days', '61-90 Days (₹ Cr)', 'Slab_90']);
          legacyAge91_120 += getVal(r, ['91-120 Days', '91-120 Days (₹ Cr)', 'Slab_120']);
          legacyAgeGt120 += getVal(r, ['> 120 Days', '>120 Days (₹ Cr)', 'Slab_365', 'Slab_MoreThan_365']);
        }
      }
    });
  });

  // Assign legacy totals to the "Old Projects" key in the lookup map
  if (!isProjectFiltered && (oldProjectsItem || legacyDue > 0)) {
    projectAgeingLookup[oldProjectsCleanName] = {
      dueMilestone: legacyDue,
      actualCollection: legacyReceived,
      outstanding: legacyOutstanding,
      registeredOS: legacyRegisteredOS,
      unregisteredOS: legacyUnregisteredOS,
      age0_30: legacyAge0_30,
      age31_60: legacyAge31_60,
      age61_90: legacyAge61_90,
      age91_120: legacyAge91_120,
      ageGt120: legacyAgeGt120
    };
  }

  // Process data from lookup map for each filtered project in O(1) per project
  const enrichedProjects = filteredProjects.map(proj => {
    const targetClean = cleanProjName(proj.name);
    const pAge = projectAgeingLookup[targetClean];

    // Convert values from Rupees to Crores (dividing by 10,000,000)
    const toCr = (val) => parseFloat((val / 10000000).toFixed(2));

    if (!pAge) {
      return {
        ...proj,
        dueMilestone: 0,
        actualCollection: 0,
        outstanding: 0,
        registeredOS: 0,
        unregisteredOS: 0,
        ageing: { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, 'gt120': 0, total: 0 }
      };
    }

    return {
      ...proj,
      dueMilestone: toCr(pAge.dueMilestone),
      actualCollection: toCr(pAge.actualCollection),
      outstanding: toCr(pAge.outstanding),
      registeredOS: toCr(pAge.registeredOS),
      unregisteredOS: toCr(pAge.unregisteredOS),
      ageing: {
        '0-30': toCr(pAge.age0_30),
        '31-60': toCr(pAge.age31_60),
        '61-90': toCr(pAge.age61_90),
        '91-120': toCr(pAge.age91_120),
        'gt120': toCr(pAge.ageGt120),
        total: toCr(pAge.outstanding)
      }
    };
  });

  // Use direct sum to correctly reflect ageing sheet values (not Overview sheet shortcut)
  const totals = sumAgeingTotals(enrichedProjects);

  return {
    projects: enrichedProjects,
    totals
  };
}

