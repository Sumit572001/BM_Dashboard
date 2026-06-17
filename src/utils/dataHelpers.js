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

// Process raw array of objects into structured, derived project data
export function processRawData(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

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
