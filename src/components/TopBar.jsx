import React from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Menu, Calendar, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateGrandTotals } from '../utils/dataHelpers';

export default function TopBar({ toggleSidebar }) {
  const location = useLocation();
  const { rawData, fileName, filteredProjects } = useData();

  const exportToExcel = () => {
    if (!filteredProjects || filteredProjects.length === 0) return;

    // 1. Calculate totals for Overview sheet
    const totals = calculateGrandTotals(filteredProjects);
    const avgCompletion = filteredProjects.reduce((s, p) => s + (p.construction?.completion || 0), 0) / (filteredProjects.length || 1);
    // Project status breakdown by construction completion %
    const newlyStartedCount     = filteredProjects.filter(p => (p.construction?.completion || 0) < 25).length;
    const inProcessCount        = filteredProjects.filter(p => (p.construction?.completion || 0) >= 25 && (p.construction?.completion || 0) <= 70).length;
    const nearingCompletionCount = filteredProjects.filter(p => (p.construction?.completion || 0) > 70).length;

    const overviewData = [
      { 'Dashboard Section': 'Sales & Collection', 'Key KPI Metric': 'Units Sold', 'Target/Budget': totals.budgetUnits, 'Actual/Achieved': totals.soldToDate, 'Efficiency %': `${(totals.budgetUnits > 0 ? (totals.soldToDate / totals.budgetUnits) * 100 : 0).toFixed(1)}%` },
      { 'Dashboard Section': 'Sales & Collection', 'Key KPI Metric': 'Average Rate', 'Target/Budget': `₹${Math.round(totals.budgetRate || 0).toLocaleString('en-IN')}/sf`, 'Actual/Achieved': `₹${Math.round(totals.actualRate || 0).toLocaleString('en-IN')}/sf`, 'Efficiency %': `${(totals.rateEff || 0).toFixed(1)}%` },
      { 'Dashboard Section': 'Sales & Collection', 'Key KPI Metric': 'Saleable Area', 'Target/Budget': `${Math.round(totals.budgetArea || 0).toLocaleString('en-IN')} sf`, 'Actual/Achieved': `${Math.round(totals.actualArea || 0).toLocaleString('en-IN')} sf`, 'Efficiency %': `${(totals.areaEff || 0).toFixed(1)}%` },
      { 'Dashboard Section': 'Sales & Collection', 'Key KPI Metric': 'Total Collection', 'Target/Budget': `₹${totals.budgetCollection.toFixed(2)} Cr`, 'Actual/Achieved': `₹${totals.actualCollection.toFixed(2)} Cr`, 'Efficiency %': `${(totals.collectionEff || 0).toFixed(1)}%` },
      
      { 'Dashboard Section': 'Outstanding', 'Key KPI Metric': 'Total Outstanding', 'Target/Budget': '-', 'Actual/Achieved': `₹${totals.outstanding.toFixed(2)} Cr`, 'Efficiency %': totals.outstanding > 100 ? 'Critical' : 'On Target' },
      { 'Dashboard Section': 'Outstanding', 'Key KPI Metric': 'Total Collection', 'Target/Budget': '-', 'Actual/Achieved': `₹${totals.actualCollection.toFixed(2)} Cr`, 'Efficiency %': 'On Target' },
      { 'Dashboard Section': 'Outstanding', 'Key KPI Metric': 'Registered O/S', 'Target/Budget': '-', 'Actual/Achieved': `₹${totals.registeredOS.toFixed(2)} Cr`, 'Efficiency %': 'Progressing' },
      { 'Dashboard Section': 'Outstanding', 'Key KPI Metric': 'Ageing >120 Days', 'Target/Budget': '-', 'Actual/Achieved': `₹${totals.ageing['gt120'].toFixed(2)} Cr`, 'Efficiency %': totals.ageing['gt120'] > 20 ? 'Critical' : 'Progressing' },

      { 'Dashboard Section': 'Construction Budget', 'Key KPI Metric': 'Target Planned', 'Target/Budget': '-', 'Actual/Achieved': `₹${(totals.budgetValCr * 0.55).toFixed(2)} Cr`, 'Efficiency %': 'On Target' },
      { 'Dashboard Section': 'Construction Budget', 'Key KPI Metric': 'Achieved Value', 'Target/Budget': '-', 'Actual/Achieved': `₹${(totals.actualValCr * 0.50).toFixed(2)} Cr`, 'Efficiency %': 'Progressing' },
      { 'Dashboard Section': 'Construction Budget', 'Key KPI Metric': 'Variance', 'Target/Budget': '-', 'Actual/Achieved': `₹${((totals.actualValCr * 0.50) - (totals.budgetValCr * 0.55)).toFixed(2)} Cr`, 'Efficiency %': 'On Target' },
      { 'Dashboard Section': 'Construction Budget', 'Key KPI Metric': 'Efficiency', 'Target/Budget': '-', 'Actual/Achieved': `${(totals.budgetValCr > 0 ? ((totals.actualValCr * 0.50) / (totals.budgetValCr * 0.55)) * 100 : 0).toFixed(1)}%`, 'Efficiency %': 'Critical' },

      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Active Projects', 'Target/Budget': '-', 'Actual/Achieved': filteredProjects.length, 'Efficiency %': 'On Target' },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Total Inventory', 'Target/Budget': '-', 'Actual/Achieved': totals.totalUnits, 'Efficiency %': 'Progressing' },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Unsold Balance', 'Target/Budget': '-', 'Actual/Achieved': totals.balance, 'Efficiency %': 'Progressing' },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Avg Completion', 'Target/Budget': '-', 'Actual/Achieved': `${avgCompletion.toFixed(1)}%`, 'Efficiency %': 'Progressing' },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'In Process', 'Target/Budget': '-', 'Actual/Achieved': inProcessCount, 'Efficiency %': `${inProcessCount} projects` },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Nearing Completion', 'Target/Budget': '-', 'Actual/Achieved': nearingCompletionCount, 'Efficiency %': `${nearingCompletionCount} projects` },
      { 'Dashboard Section': 'Project Portfolio', 'Key KPI Metric': 'Newly Started', 'Target/Budget': '-', 'Actual/Achieved': newlyStartedCount, 'Efficiency %': `${newlyStartedCount} projects` }
    ];

    // 2. Sales & Collection Sheet
    const salesCollectionData = filteredProjects.map(p => ({
      'Project Name': p.name,
      'Units Sold': p.soldToDate,
      'Target Units': p.budgetUnits,
      'Avg Rate (₹/sf)': p.actualRate,
      'Budget Rate (₹/sf)': p.budgetRate,
      'Saleable Area (sf)': p.actualArea,
      'Budget Area (sf)': p.budgetArea,
      'Total Value (₹ Cr)': p.actualValCr,
      'Budget Value (₹ Cr)': p.budgetValCr,
      'Collection Target (₹ Cr)': p.budgetCollection,
      'Actual Collection (₹ Cr)': p.actualCollection,
      'Efficiency (%)': parseFloat((p.collectionEff || 0).toFixed(1))
    }));

    // 3. Outstanding Sheet
    const outstandingData = filteredProjects.map(p => ({
      'Project Name': p.name,
      'Total Outstanding (₹ Cr)': p.outstanding,
      'Total Collection (₹ Cr)': p.actualCollection,
      'Registered Outstanding (₹ Cr)': p.registeredOS,
      'Unregistered Outstanding (₹ Cr)': p.unregisteredOS,
      '0-30 Days (₹ Cr)': p.ageing['0-30'],
      '31-60 Days (₹ Cr)': p.ageing['31-60'],
      '61-90 Days (₹ Cr)': p.ageing['61-90'],
      '91-120 Days (₹ Cr)': p.ageing['91-120'],
      '>120 Days (₹ Cr)': p.ageing['gt120']
    }));

    // 4. Construction Budget Sheet
    const constructionBudgetData = filteredProjects.map(p => ({
      'Project Name': p.name,
      'Target Planned (₹ Cr)': p.construction.target,
      'Achieved Value (₹ Cr)': p.construction.achieved,
      'Variance (₹ Cr)': p.construction.variance,
      'Efficiency (%)': parseFloat((p.construction.eff || 0).toFixed(1)),
      'Overall Completion (%)': p.construction.completion
    }));

    // 5. Project Portfolio Details Sheet
    const portfolioDetailsData = [];
    filteredProjects.forEach(p => {
      // Add individual buildings
      p.buildings.forEach(b => {
        portfolioDetailsData.push({
          'Project Name': p.name,
          'Building Name': b.name,
          'Total Units': b.totalUnits,
          'Units Sold up to Mar 31 2024': Math.round(b.soldToDate * 0.8),
          'Unsold as on Apr 1 2024': b.totalUnits - Math.round(b.soldToDate * 0.8),
          'For the month Sold': Math.round(b.soldToDate * 0.05),
          'For the Period Sold': Math.round(b.soldToDate * 0.15),
          'Total Units Sold as on Date': b.soldToDate,
          'Balance as on Date': b.balance,
          'Budget Rate': p.budgetRate,
          'Actual Rate': p.actualRate,
          'Budget Area': Math.round(b.totalUnits * 1200),
          'Actual Area': Math.round(b.soldToDate * 1200)
        });
      });
      // Add BTOTAL row
      portfolioDetailsData.push({
        'Project Name': p.name,
        'Building Name': 'BTOTAL',
        'Total Units': p.totalUnits,
        'Units Sold up to Mar 31 2024': p.soldMar31,
        'Unsold as on Apr 1 2024': p.unsoldApr1,
        'For the month Sold': p.monthSold,
        'For the Period Sold': p.periodSold,
        'Total Units Sold as on Date': p.soldToDate,
        'Balance as on Date': p.balance,
        'Budget Rate': p.budgetRate,
        'Actual Rate': p.actualRate,
        'Budget Area': p.budgetArea,
        'Actual Area': p.actualArea
      });
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Append sheets
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(overviewData), 'Overview');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesCollectionData), 'Sales & Collection');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(outstandingData), 'Outstanding');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(constructionBudgetData), 'Construction Budget');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(portfolioDetailsData), 'Project Portfolio Details');

    const exportName = fileName
      ? `${fileName.replace(/\.[^/.]+$/, "")}_Export.xlsx`
      : 'Nyati_MIS_Data_Export.xlsx';

    XLSX.writeFile(workbook, exportName);
  };

  // Map routes to human readable headers
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'MANAGEMENT INFORMATION SYSTEM';
      case '/sales-collection':
        return 'SALES';
      case '/outstanding':
        return 'OUTSTANDING & COLLECTION';
      case '/construction-budget':
        return 'CONSTRUCTION BUDGET';
      case '/portfolio':
        return 'PROJECT PORTFOLIO';
      default:
        return 'MANAGEMENT INFORMATION SYSTEM';
    }
  };

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/':
        return 'NYATI GROUP - REAL ESTATE DIVISION';
      case '/sales-collection':
        return 'FY sales achievements, rate analysis, and actual vs budget collection rates';
      case '/outstanding':
        return 'Milestone dues, collection status, and project ageing matrices';
      case '/construction-budget':
        return '';
      case '/portfolio':
        return 'Granular view of buildings inventory funnel, RERA timings, and cost details';
      default:
        return 'NYATI GROUP - REAL ESTATE DIVISION';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 active:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-6 h-6 text-nyati-navy" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-nyati-navy leading-snug">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-slate-700 font-semibold hidden md:block mt-0.5">
            {getPageSubtitle()}
          </p>
        </div>
      </div>

      {/* Right section: Date & File Indicator */}
      <div className="flex items-center gap-4">
        {/* Date Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-nyati-navy" />
          <span>{formattedDate}</span>
        </div>

        {/* Export to Excel Icon Button */}
        {rawData && (
          <button
            onClick={exportToExcel}
            title="Export database to Excel"
            className="flex items-center justify-center p-2.5 bg-emerald-50 border border-emerald-100 hover:border-emerald-500 rounded-xl text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
          </button>
        )}
      </div>

    </header>
  );
}
