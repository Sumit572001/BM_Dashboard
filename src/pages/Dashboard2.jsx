import React, { useState, useRef, useEffect, useDeferredValue, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals, getAgeingMetrics } from '../utils/dataHelpers';
import AnimatedNumber from '../components/AnimatedNumber';
import KPICard from '../components/KPICard';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChevronDown, Calendar, Percent, Landmark, HelpCircle, X, CheckCircle, Layers, AlertTriangle, PieChart, ArrowUp, ArrowDown, ArrowUpDown, ClipboardList, CreditCard, Home, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// A wrapper around ResponsiveContainer that delays rendering until layout stabilizes
const MountedResponsiveContainer = ({ children, ...props }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  if (!mounted) return <div style={{ height: props.height || '100%', width: props.width || '100%' }} />;
  return (
    <ResponsiveContainer {...props}>
      {children}
    </ResponsiveContainer>
  );
};

// Custom Tooltip for Ageing Stacked Bar Chart
const AgeingTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-premium text-xs min-w-[150px]">
        <p className="font-bold text-slate-800 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((p, idx) => (
            <p key={idx} className="font-semibold flex justify-between gap-4 font-sans" style={{ color: p.color || p.fill }}>
              <span>{p.name}:</span>
              <span className="font-bold">₹{p.value !== null && p.value !== undefined ? p.value.toFixed(2) : '-'} Cr</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Type Badges Helper
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

export default function Dashboard2() {
  const { filteredProjects, rawData, filters } = useData();

  // Defer the heavy ageing computation so filter button clicks (Q1/Q2/Q3/Q4)
  // register instantly in the UI while data updates in the background.
  const deferredFilteredProjects = useDeferredValue(filteredProjects);
  const deferredRawData = useDeferredValue(rawData);
  const deferredFilters = useDeferredValue(filters);
  const isPending = deferredFilters !== filters || deferredFilteredProjects !== filteredProjects;

  const ageingResult = useMemo(() => {
    return getAgeingMetrics(deferredFilteredProjects, deferredRawData, deferredFilters);
  }, [deferredFilteredProjects, deferredRawData, deferredFilters]);

  const enrichedProjects = useMemo(() => {
    return ageingResult.projects;
  }, [ageingResult.projects]);
  const totals = ageingResult.totals;

  const [ageingView, setAgeingView] = useState('graph'); // 'table' | 'graph'
  const [ageingRegFilter, setAgeingRegFilter] = useState('all'); // 'all' | 'registered' | 'unregistered'

  // Sorting state for Consolidated Project Outstanding table
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Exclude "Old Projects" from the Ageing Matrix view (graph + table) because
  // the Ageing sheet in the Excel has no "Old Projects" row — it's a synthetic
  // bucket for unlisted legacy data and should not appear in ageing breakdowns.
  const ageingProjects = React.useMemo(
    () => {
      let projects = enrichedProjects.filter(p => !p.name.trim().toUpperCase().includes('OLD PROJECT'));
      if (ageingRegFilter === 'registered') {
        projects = projects.filter(p => (p.registeredUnits || 0) > 0);
        projects = projects.map(p => ({
          ...p,
          ageing: p.ageing_reg || { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, 'gt120': 0, total: 0 }
        }));
      } else if (ageingRegFilter === 'unregistered') {
        projects = projects.filter(p => (p.unregisteredUnits || 0) > 0);
        projects = projects.map(p => ({
          ...p,
          ageing: p.ageing_unreg || { '0-30': 0, '31-60': 0, '61-90': 0, '91-120': 0, 'gt120': 0, total: 0 }
        }));
      }
      return projects;
    },
    [enrichedProjects, ageingRegFilter]
  );

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-white/50 shrink-0 select-none hover:text-white transition-colors" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-white shrink-0 select-none" />
      : <ArrowDown className="w-3.5 h-3.5 text-white shrink-0 select-none" />;
  };

  // Sort projects dynamically before rendering rows (following custom sequence and bottom weights)
  const sortedProjects = React.useMemo(() => {
    const projects = [...enrichedProjects];
    if (!sortColumn) return projects;

    projects.sort((a, b) => {
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

      // 2. If neither is a bottom project, proceed with sort logic
      if (sortColumn === 'name') {
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

      // For other fields
      let valA = a[sortColumn] || 0;
      let valB = b[sortColumn] || 0;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });

    return projects;
  }, [enrichedProjects, sortColumn, sortDirection]);



  // Modal state for ageing drilldown
  const [drilldownData, setDrilldownData] = useState(null);

  const sectionBRef = useRef(null); // Consolidated Outstanding
  const sectionCRef = useRef(null); // Ageing Matrix



  // Calculate Consolidated Grand Totals
  const grandTotalSoldVal = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.actualValCr || 0), 0), [enrichedProjects]);
  const grandTotalDueMilestone = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.dueMilestone || 0), 0), [enrichedProjects]);
  const grandTotalCollection = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.actualCollection || 0), 0), [enrichedProjects]);
  const grandTotalInceptionCollection = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.totalCollection || 0), 0), [enrichedProjects]);
  const grandTotalSalesCollection = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.actualCollection || 0), 0), [enrichedProjects]);
  // Use direct sheet totals from getAgeingMetrics (sums ALL ageing sheet rows, not just matched projects)
  const grandTotalOutstanding = totals.outstanding || 0;
  const grandTotalRegOS = totals.registeredOS || 0;
  const grandTotalUnregOS = totals.unregisteredOS || 0;

  const grandTotalSoldUnits = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.soldUnits || 0), 0), [enrichedProjects]);
  const grandTotalRegisteredUnits = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.registeredUnits || 0), 0), [enrichedProjects]);
  const grandTotalUnregisteredUnits = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.unregisteredUnits || 0), 0), [enrichedProjects]);

  // Budget calculations for Outstanding KPI Cards
  const grandTotalBudgetVal = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.budgetValCr || 0), 0), [enrichedProjects]);
  const grandTotalBudgetDue = useMemo(() => enrichedProjects.reduce((s, p) => s + ((p.budgetValCr || 0) * 0.85), 0), [enrichedProjects]);
  const grandTotalBudgetCollection = useMemo(() => enrichedProjects.reduce((s, p) => s + (p.budgetCollection || 0), 0), [enrichedProjects]);
  const grandTotalBudgetOS = grandTotalBudgetDue - grandTotalBudgetCollection;

  // Extra Details for Sales Card
  const salesExtra = (
    <>
      <div>
        <span>Residential: <strong>₹{enrichedProjects.filter(p => p.type === 'R').reduce((s, p) => s + p.actualValCr, 0).toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>Luxury/Comm: <strong>₹{enrichedProjects.filter(p => p.type !== 'R').reduce((s, p) => s + p.actualValCr, 0).toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Extra Details for Due Card
  const dueExtra = (
    <>
      <div>
        <span>Milestone Dues: <strong>₹{grandTotalDueMilestone.toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>Collection Target: <strong>₹{grandTotalBudgetCollection.toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Extra Details for Collection Card
  const collectionExtra = (
    <>
      <div>
        <span>Excel: <strong>₹{grandTotalCollection.toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>ERP: <strong>₹{(grandTotalCollection * 0.96).toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Extra Details for Balance Card
  const balanceExtra = (
    <>
      <div>
        <span>Registered O/S: <strong>₹{grandTotalRegOS.toFixed(2)} Cr</strong></span>
      </div>
      <div className="text-right">
        <span>Unregistered O/S: <strong>₹{grandTotalUnregOS.toFixed(2)} Cr</strong></span>
      </div>
    </>
  );

  // Ageing columns Grand Totals
  const grandAgeing0_30 = ageingProjects.reduce((s, p) => s + p.ageing['0-30'], 0);
  const grandAgeing31_60 = ageingProjects.reduce((s, p) => s + p.ageing['31-60'], 0);
  const grandAgeing61_90 = ageingProjects.reduce((s, p) => s + p.ageing['61-90'], 0);
  const grandAgeing91_120 = ageingProjects.reduce((s, p) => s + p.ageing['91-120'], 0);
  const grandAgeingGt120 = ageingProjects.reduce((s, p) => s + p.ageing['gt120'], 0);
  const grandAgeingTotal = grandAgeing0_30 + grandAgeing31_60 + grandAgeing61_90 + grandAgeing91_120 + grandAgeingGt120;

  // Map ageing data to project-wise buckets for Bar Chart (Old Projects excluded)
  const chartData = React.useMemo(() => {
    return ageingProjects
      .map(p => ({
        name: p.name,
        '0-30d': p.ageing['0-30'] || 0,
        '31-60d': p.ageing['31-60'] || 0,
        '61-90d': p.ageing['61-90'] || 0,
        '91-120d': p.ageing['91-120'] || 0,
        '>120d': p.ageing['gt120'] || 0,
      }))
      .filter(item => 
        item['0-30d'] !== 0 ||
        item['31-60d'] !== 0 ||
        item['61-90d'] !== 0 ||
        item['91-120d'] !== 0 ||
        item['>120d'] !== 0
      );
  }, [ageingProjects]);

  const handleBarClick = (data, bucket) => {
    if (!data) return;
    const payload = data.payload || data;
    if (!payload || !payload.name) return;
    const projectName = payload.name;
    const key = bucket === 'gt120' ? '>120d' : `${bucket}d`;
    const value = payload[key] || 0;
    handleAgeCellClick(projectName, bucket, value);
  };

  // Outstanding Highlights Calculations — use direct sheet totals (same as table grand totals)
  const totalOS = totals.outstanding || 0;
  const regOS = totals.registeredOS || 0;
  const unregOS = totals.unregisteredOS || 0;
  const ageingGt90 = enrichedProjects.reduce((s, p) => s + p.ageing['91-120'] + p.ageing['gt120'], 0);
  const ageingRatio = totalOS > 0 ? (ageingGt90 / totalOS) * 100 : 0;

  const outstandingPoints = [
    {
      title: "Receivables Exposure Ledger",
      text: `Cumulative outstanding receivables from milestones stand at ₹${totalOS.toFixed(2)} Cr, requiring prioritized collection runs to secure liquidity.`,
      status: totalOS < 30 ? 'success' : totalOS < 60 ? 'warning' : 'danger'
    },
    {
      title: "Contractual Security Ratio",
      text: `Registered sales outstanding stands at ₹${regOS.toFixed(2)} Cr (Contractually secured), while ₹${unregOS.toFixed(2)} Cr remains on unregistered agreements.`,
      status: regOS >= totalOS * 0.6 ? 'success' : 'warning'
    },
    {
      title: "Critical Aging Overdue (>90 Days)",
      text: `₹${ageingGt90.toFixed(2)} Cr of receivables are in the high-risk >90 days category (${ageingRatio.toFixed(1)}% of total dues), requiring immediate legal demand triggers.`,
      status: ageingRatio <= 20 ? 'success' : ageingRatio <= 35 ? 'warning' : 'danger'
    },
    {
      title: "Customer Escalation Threshold",
      text: "Client grievance and documentation issues accounted for 14% of the payment delays. Strengthening the CRM follow-up system is key to resolving milestone disputes.",
      status: 'info'
    }
  ];

  const aiRecommendations = [
    {
      type: 'danger',
      subject: 'Receivables Risk Mitigation',
      text: `Total receivables outstanding is high (₹${totalOS.toFixed(2)} Cr). Trigger automated SMS/Email demand notices for customers in the >90 days bucket.`
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200 font-bold';
    }
  };


  // Color-code outstanding amount
  const getOutstandingColor = (val) => {
    if (val > 20) return 'text-nyati-danger font-extrabold bg-nyati-danger/20 border border-nyati-danger/30';
    if (val >= 10) return 'text-nyati-warning font-bold bg-nyati-warning/20 border border-nyati-warning/30';
    return 'text-nyati-success font-semibold bg-nyati-success/20 border border-nyati-success/30';
  };

  // Color-code collection amount based on % achievement vs target
  // 0-50% → red, 51-79% → yellow/warning, 80%+ → green
  const getCollectionColor = (actual, target) => {
    const pct = target > 0 ? (actual / target) * 100 : 100;
    if (pct <= 50) return 'text-nyati-danger font-extrabold bg-nyati-danger/20 border border-nyati-danger/30';
    if (pct <= 79) return 'text-nyati-warning font-bold bg-nyati-warning/20 border border-nyati-warning/30';
    return 'text-[#059669] font-semibold bg-[#059669]/20 border border-[#059669]/30';
  };

  // Get Ageing Class for Heatmap
  const getAgeingHeatClass = (val) => {
    if (val === 0) return 'text-slate-500';
    if (val > 10) return 'heat-gt120';
    if (val >= 6) return 'heat-91-120';
    if (val >= 3) return 'heat-61-90';
    if (val >= 1) return 'heat-31-60';
    return 'heat-0-30';
  };

  // Open drilldown details
  const handleAgeCellClick = (projectName, bucket, val) => {
    if (val <= 0) return;

    // Generate mock flat breakdowns
    const names = ['Sharma Developers', 'Rajesh K. Mehta', 'Goldman Realties', 'Sumit V. Verma', 'Patel Enterprises'];
    const bldgs = ['A1', 'B2', 'C1', 'A3', 'TOWER 2'];

    const count = 3;
    const flats = Array.from({ length: count }).map((_, i) => {
      const flatNum = 100 + Math.round(Math.random() * 1400);
      const owner = names[(projectName.charCodeAt(i) + i) % names.length];
      const bldg = bldgs[(projectName.charCodeAt(0) + i) % bldgs.length];
      const rawAmt = (val / count) * (0.85 + (i * 0.15));

      let ageDays = 15;
      if (bucket === '31-60') ageDays = 45;
      else if (bucket === '61-90') ageDays = 75;
      else if (bucket === '91-120') ageDays = 105;
      else if (bucket === 'gt120') ageDays = 150 + Math.round(Math.random() * 60);

      return {
        flat: `Flat ${flatNum} (${bldg})`,
        customer: owner,
        pending: parseFloat(rawAmt.toFixed(2)),
        age: ageDays
      };
    });

    setDrilldownData({
      project: projectName,
      bucket,
      value: val,
      flats
    });
  };

  const visibleProjects = React.useMemo(() => {
    return sortedProjects.filter(p => !p.name.trim().toUpperCase().includes('OLD PROJECT'));
  }, [sortedProjects]);

  return (
    <div
      className="space-y-8 pb-12 pt-2"
      style={{ transition: 'opacity 0.2s ease', opacity: isPending ? 0.6 : 1 }}
    >


      {/* SECTION A: KPI Cards Row */}
      {/*
          Layout (like Sales page — all equal column widths, left cards natural height):
          [Total Sales 25%] [Total Collection 25%] | [Total Due 25%]    [Reg O/S 25%]
                                                   | [Total Balance 25%][Unreg O/S 25%]
      */}
      <div className="flex gap-4 items-stretch">

        {/* LEFT: 2 compact full-detail cards (same size as Sales page cards) */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <KPICard
            title="Total Sales"
            budget={grandTotalBudgetVal}
            actual={grandTotalSoldVal}
            eff={grandTotalBudgetVal > 0 ? (grandTotalSoldVal / grandTotalBudgetVal) * 100 : 0}
            prefix="₹"
            suffix=" Cr"
            decimals={2}
            icon={ClipboardList}
            borderStyle="border-l-4 border-nyati-orange"
            bgClass="bg-white"
          />
          <KPICard
            title="Total Collection"
            budget={grandTotalBudgetCollection}
            actual={grandTotalSalesCollection}
            eff={grandTotalBudgetCollection > 0 ? (grandTotalSalesCollection / grandTotalBudgetCollection) * 100 : 0}
            prefix="₹"
            suffix=" Cr"
            decimals={2}
            icon={CreditCard}
            borderStyle="border-l-4 border-emerald-600"
          />
        </div>

        {/* RIGHT: 2×2 grid — Total Due, Reg O/S (row 1) | Total Balance, Unreg O/S (row 2) */}
        <div className="grid grid-cols-2 gap-4 flex-1">

          {/* Row 1 Col 1 — Total Due */}
          <KPICard
            title="Due as per Milestone"
            budget={grandTotalBudgetDue}
            actual={grandTotalDueMilestone}
            eff={grandTotalBudgetDue > 0 ? (grandTotalDueMilestone / grandTotalBudgetDue) * 100 : 0}
            prefix="₹"
            suffix=" Cr"
            decimals={2}
            icon={Landmark}
            borderStyle="border-l-4 border-l-nyati-navy"
            simple={true}
            bgClass="bg-[#FF9B45]/25"
          />

          {/* Row 1 Col 2 — Registered O/S blue box */}
          <div className="h-full flex flex-col items-center justify-center bg-[#4A90D9] rounded-2xl shadow-lg px-5 py-4 text-white">
            <span className="text-[13px] font-extrabold uppercase tracking-widest text-white/80 mb-2 text-center leading-tight">Registered O/S</span>
            <span className="text-2xl font-black text-white leading-tight text-center">
              ₹{grandTotalRegOS.toFixed(2)} Cr
            </span>
          </div>

          {/* Row 2 Col 1 — Total Balance */}
          <KPICard
            title="Outstanding"
            budget={grandTotalBudgetOS}
            actual={grandTotalOutstanding}
            eff={grandTotalBudgetOS > 0 ? (grandTotalOutstanding / grandTotalBudgetOS) * 100 : 100}
            prefix="₹"
            suffix=" Cr"
            decimals={2}
            icon={AlertTriangle}
            borderStyle="border-l-4 border-l-sky-500"
            simple={true}
            bgClass="bg-[#FF9B45]/25"
          />

          {/* Row 2 Col 2 — Unregistered O/S blue box */}
          <div className="h-full flex flex-col items-center justify-center bg-[#4A90D9] rounded-2xl shadow-lg px-5 py-4 text-white">
            <span className="text-[13px] font-extrabold uppercase tracking-widest text-white/80 mb-2 text-center leading-tight">Unregistered O/S</span>
            <span className="text-2xl font-black text-white leading-tight text-center">
              ₹{grandTotalUnregOS.toFixed(2)} Cr
            </span>
          </div>

        </div>

      </div>

      {/* SECTION B: CONSOLIDATED PROJECT OUTSTANDING Table */}
      <div ref={sectionBRef} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm">
          <h3 className="font-bold text-nyati-navy text-lg">Consolidated Project Outstanding (₹ Cr)</h3>
        </div>
        <div className="lg:overflow-x-visible overflow-x-auto">
          <table className="w-full text-left text-[15px] text-slate-800 border-collapse min-w-[1360px]">
            <thead className="sticky top-[85px] z-20 bg-nyati-navy">
              {/* Row 1 */}
              <tr className="bg-nyati-navy text-white uppercase tracking-wider font-extrabold text-[15px] border-b border-white">
                <th rowSpan={3} className="px-4 py-3 border-r border-white text-left bg-nyati-navy align-middle min-w-[320px] w-[320px] max-w-[320px]">
                  Project
                </th>
                <th colSpan={2} className="text-center font-black py-2 border-b border-white border-r border-white bg-[#f97316]">
                  FY
                </th>
                <th colSpan={8} className="text-center font-black py-2 border-b border-white bg-[#714C8A]">
                  UPTO DATE
                </th>
              </tr>
              {/* Row 2 */}
              <tr className="bg-nyati-navy text-white uppercase tracking-wider font-extrabold text-[14px] border-b border-white">
                <th colSpan={2} className="text-center font-black py-2 border-b border-white border-r border-white bg-nyati-navy">
                  COLLECTION
                </th>
                <th colSpan={3} className="text-center font-black py-2 border-b border-white border-r border-white bg-nyati-navy">
                  REGISTRATION STATUS
                </th>
                <th rowSpan={2} className="px-2 py-3 text-center cursor-pointer select-none hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy align-middle w-[120px] min-w-[120px] max-w-[120px]" onClick={() => handleSort('dueMilestone')}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="leading-tight">Due as per Milestone</span>
                    {renderSortIcon('dueMilestone')}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-3 text-center cursor-pointer select-none hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy align-middle w-[120px] min-w-[120px] max-w-[120px]" onClick={() => handleSort('actualCollection')}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="leading-tight">Total Collection</span>
                    {renderSortIcon('actualCollection')}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-3 text-center cursor-pointer select-none hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy align-middle w-[120px] min-w-[120px] max-w-[120px]" onClick={() => handleSort('outstanding')}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="leading-tight">Total Outstanding</span>
                    {renderSortIcon('outstanding')}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-3 text-center cursor-pointer select-none hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy align-middle w-[120px] min-w-[120px] max-w-[120px]" onClick={() => handleSort('registeredOS')}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="leading-tight">Registered O/S</span>
                    {renderSortIcon('registeredOS')}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-3 text-center cursor-pointer select-none hover:bg-white/10 transition-colors border-white bg-nyati-navy align-middle w-[120px] min-w-[120px] max-w-[120px]" onClick={() => handleSort('unregisteredOS')}>
                  <div className="flex items-center justify-center gap-1.5 h-full">
                    <span className="leading-tight font-extrabold">UNRegistered O/S</span>
                    {renderSortIcon('unregisteredOS')}
                  </div>
                </th>
              </tr>
              {/* Row 3 */}
              <tr className="bg-nyati-navy text-white uppercase tracking-wider font-extrabold text-[13px] border-b border-white">
                <th onClick={() => handleSort('budgetCollection')} className="px-2 py-2 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy w-[120px] min-w-[120px] max-w-[120px]">
                  <div className="flex items-center justify-center gap-1">Target {renderSortIcon('budgetCollection')}</div>
                </th>
                <th onClick={() => handleSort('actualCollection')} className="px-2 py-2 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy w-[120px] min-w-[120px] max-w-[120px]">
                  <div className="flex items-center justify-center gap-1">Actual {renderSortIcon('actualCollection')}</div>
                </th>
                <th onClick={() => handleSort('soldUnits')} className="px-2 py-2 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy w-[100px] min-w-[100px] max-w-[100px]">
                  <div className="flex items-center justify-center gap-1">Sold {renderSortIcon('soldUnits')}</div>
                </th>
                <th onClick={() => handleSort('registeredUnits')} className="px-2 py-2 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy w-[100px] min-w-[100px] max-w-[100px]">
                  <div className="flex items-center justify-center gap-1">Registered {renderSortIcon('registeredUnits')}</div>
                </th>
                <th onClick={() => handleSort('unregisteredUnits')} className="px-2 py-2 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white bg-nyati-navy w-[100px] min-w-[100px] max-w-[100px]">
                  <div className="flex items-center justify-center gap-1">Unregistered {renderSortIcon('unregisteredUnits')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-black">
              {visibleProjects.map((p, index) => (
                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors border-b border-slate-200">
                  <td className="px-4 py-2 font-semibold text-black min-w-[320px] w-[320px] max-w-[320px] border-r border-slate-200 text-left">
                    <div className="flex flex-row items-center gap-2 flex-wrap">
                      <span className="text-black text-[14px] font-bold">{p.name}</span>
                      {renderTypeBadge(p.type)}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{p.budgetCollection.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">
                    <span className={`px-3 py-0.5 rounded-lg text-[14px] ${getCollectionColor(p.actualCollection, p.budgetCollection)}`}>
                      ₹{p.actualCollection.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{p.soldUnits || 0}</td>
                  <td className="px-4 py-2 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{p.registeredUnits || 0}</td>
                  <td className="px-4 py-2 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{p.unregisteredUnits || 0}</td>
                  <td className="px-4 py-2 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{p.dueMilestone.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{(p.totalCollection || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">
                    <span className={`px-3 py-0.5 rounded-lg text-[14px] ${getOutstandingColor(p.outstanding)}`}>
                      ₹{p.outstanding.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{p.registeredOS.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{p.unregisteredOS.toFixed(2)}</td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t-2 border-slate-200 text-[15px]">
                <td className="px-4 py-2.5 min-w-[320px] w-[320px] max-w-[320px] border-r border-slate-200 text-left">GRAND TOTAL</td>
                <td className="px-4 py-2.5 text-center text-black bg-slate-50/50 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{grandTotalBudgetCollection.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-center bg-slate-50/50 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">
                  <span className={`px-4 py-1 rounded-lg text-[14px] ${getCollectionColor(grandTotalCollection, grandTotalBudgetCollection)}`}>
                    ₹{grandTotalCollection.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{grandTotalSoldUnits}</td>
                <td className="px-4 py-2.5 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{grandTotalRegisteredUnits}</td>
                <td className="px-4 py-2.5 text-center text-black w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200">{grandTotalUnregisteredUnits}</td>
                <td className="px-4 py-2.5 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{grandTotalDueMilestone.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{grandTotalInceptionCollection.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-center w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">
                  <span className={`px-4 py-1 rounded-lg text-[14px] border border-nyati-navy/10 ${getOutstandingColor(grandTotalOutstanding)}`}>
                    ₹{grandTotalOutstanding.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{grandTotalRegOS.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-center text-black w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200">₹{grandTotalUnregOS.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION C: AGEING OUTSTANDING Table / Graph */}
      <div ref={sectionCRef} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
          {/* Left: Title + Legend */}
          <div>
            <h3 className="font-bold text-nyati-navy text-lg">
              {ageingView === 'graph' ? "Ageing — Project x Bucket" : "Ageing Outstanding Matrix"}
            </h3>
            {/* Legend inline below title (table view only) */}
            {ageingView === 'table' ? (
              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-bold text-slate-700">
                <span className="uppercase tracking-wider text-slate-500 font-extrabold">Legend:</span>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
                  <span>&lt; ₹1 Cr</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D69E2E]" />
                  <span>₹1 – ₹3 Cr</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E76F2E]" />
                  <span>₹3 – ₹6 Cr</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
                  <span>₹6 – ₹10 Cr</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]" />
                  <span>&gt; ₹10 Cr</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-[13px] font-semibold mt-0.5">
                Stacked exposure in ₹ Cr - red dominant where &gt;120d concentrates
              </p>
            )}
          </div>

          {/* Right: Reg filter tabs + Graph/Table switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Registered / Unregistered filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['all', 'registered', 'unregistered'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAgeingRegFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                    ageingRegFilter === tab
                      ? 'bg-nyati-navy text-white shadow-sm font-bold'
                      : 'text-slate-700 hover:text-slate-900 font-bold'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'registered' ? 'Registered' : 'Unregistered'}
                </button>
              ))}
            </div>

            {/* View switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setAgeingView('graph')}
                className={`px-3 py-1.5 rounded-lg transition-all ${ageingView === 'graph' ? 'bg-white text-nyati-navy shadow-sm font-bold' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
              >
                Graph View
              </button>
              <button
                onClick={() => setAgeingView('table')}
                className={`px-3 py-1.5 rounded-lg transition-all ${ageingView === 'table' ? 'bg-white text-nyati-navy shadow-sm font-bold' : 'text-slate-700 hover:text-slate-900 font-bold'}`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {ageingView === 'table' ? (
          <div className="lg:overflow-x-visible overflow-x-auto">
            <table className="w-full text-center text-[13px] text-slate-800">
              <thead>
                <tr className="sticky top-[85px] z-10 bg-slate-50 text-slate-900 uppercase tracking-wider font-extrabold border-b border-slate-100 text-left text-[13px] shadow-sm">
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-4 py-4 text-center">0–30 Days (₹ Cr)</th>
                  <th className="px-4 py-4 text-center">31–60 Days (₹ Cr)</th>
                  <th className="px-4 py-4 text-center">61–90 Days (₹ Cr)</th>
                  <th className="px-4 py-4 text-center">91–120 Days (₹ Cr)</th>
                  <th className="px-4 py-4 text-center">&gt;120 Days (₹ Cr)</th>
                  <th className="px-6 py-4 text-center">Total (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                {ageingProjects.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-left font-semibold text-slate-800">{p.name}</td>
                    {['0-30', '31-60', '61-90', '91-120', 'gt120'].map((bucket) => {
                      const value = p.ageing[bucket];
                      return (
                        <td
                           key={bucket}
                           onClick={() => handleAgeCellClick(p.name, bucket, value)}
                           className={`px-4 py-3.5 cursor-pointer font-bold transition-all hover:scale-95 duration-100 ${getAgeingHeatClass(value)}`}
                        >
                          ₹{value.toFixed(2)}
                        </td>
                      );
                    })}
                    <td className="px-6 py-3.5 bg-slate-50/40 font-bold text-nyati-navy">
                      ₹{p.ageing.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t-2 border-slate-200 text-[13px]">
                  <td className="px-6 py-4 text-left">GRAND TOTAL</td>
                  <td className="px-4 py-4 text-center">₹{grandAgeing0_30.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">₹{grandAgeing31_60.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">₹{grandAgeing61_90.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">₹{grandAgeing91_120.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">₹{grandAgeingGt120.toFixed(2)}</td>
                  <td className="px-6 py-4 bg-slate-50 font-extrabold text-nyati-orange">
                    ₹{grandAgeingTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            {enrichedProjects.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-slate-700 font-bold text-sm">No project aging data to display.</div>
            ) : (
              <div className="h-96 w-full relative">
                <MountedResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#1e293b', fontSize: 9, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={75}
                    />
                    <YAxis
                      tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<AgeingTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="rect"
                      iconSize={10}
                      formatter={(value) => <span className="text-xs font-bold text-slate-800 font-sans">{value}</span>}
                    />
                    <Bar
                      dataKey="0-30d"
                      name="0-30d"
                      stackId="a"
                      fill="#10b981"
                      className="cursor-pointer"
                      onClick={(data) => handleBarClick(data, '0-30')}
                    />
                    <Bar
                      dataKey="31-60d"
                      name="31-60d"
                      stackId="a"
                      fill="#0ea5e9"
                      className="cursor-pointer"
                      onClick={(data) => handleBarClick(data, '31-60')}
                    />
                    <Bar
                      dataKey="61-90d"
                      name="61-90d"
                      stackId="a"
                      fill="#f59e0b"
                      className="cursor-pointer"
                      onClick={(data) => handleBarClick(data, '61-90')}
                    />
                    <Bar
                      dataKey="91-120d"
                      name="91-120d"
                      stackId="a"
                      fill="#ef4444"
                      className="cursor-pointer"
                      onClick={(data) => handleBarClick(data, '91-120')}
                    />
                    <Bar
                      dataKey=">120d"
                      name=">120d"
                      stackId="a"
                      fill="#b91c1c"
                      className="cursor-pointer"
                      onClick={(data) => handleBarClick(data, 'gt120')}
                    />
                  </BarChart>
                </MountedResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights & AI Recommendations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Highlights Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-nyati-navy text-base">Outstanding & Receivables Highlights</h3>
            </div>

            {/* Bullet points display list */}
            <div className="p-6 space-y-4">
              {outstandingPoints.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${getStatusBadge(p.status)}`}>
                    {p.status || 'Info'}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      {p.title}
                    </h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                      {p.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: AI Analytics Recommendations */}
        <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-start self-start h-fit w-full">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">

              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Strategic Action Board</h3>
            </div>

            <div className="space-y-4">
              {aiRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 flex flex-col justify-between ${rec.type === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                    rec.type === 'warning' ? 'bg-amber-50/50 border-amber-150 text-amber-900' :
                      rec.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                        'bg-slate-50 border-slate-150 text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${rec.type === 'danger' ? 'text-rose-600' :
                      rec.type === 'warning' ? 'text-amber-600' :
                        rec.type === 'success' ? 'text-emerald-600' :
                          'text-slate-600'
                      }`} />
                    <span className="font-extrabold uppercase tracking-wide text-[10px]">
                      {rec.subject}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-700 leading-relaxed text-[12px]">
                    {rec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-nyati-orange/5 rounded-2xl border border-nyati-orange/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-nyati-orange font-extrabold uppercase tracking-wider">Analysis Accuracy</span>
              <span className="text-slate-800 font-extrabold text-sm block">100% Data Synchronized</span>
            </div>
            <PieChart className="w-5 h-5 text-nyati-orange" />
          </div>
        </div>
      </div>

      {/* Ageing Drilldown Modal Overlay */}
      <AnimatePresence>
        {drilldownData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-nyati-navy text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base tracking-tight">{drilldownData.project}</h4>
                  <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                    Ageing Bucket: {drilldownData.bucket} Days (₹{drilldownData.value.toFixed(2)} Cr Total)
                  </p>
                </div>
                <button
                  onClick={() => setDrilldownData(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-all focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="text-[13px] text-slate-700 font-semibold">
                  Showing flat-wise booking balance details corresponding to this aging duration:
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {drilldownData.flats.map((flat, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/30 hover:bg-slate-50 flex justify-between items-center text-[13px] font-semibold">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-sm">{flat.flat}</span>
                        <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <span>Client: {flat.customer}</span>
                          <span>•</span>
                          <span className="text-nyati-orange font-extrabold">{flat.age} Days Old</span>
                        </div>
                      </div>
                      <span className="text-nyati-navy text-sm font-black">
                        ₹{flat.pending.toFixed(2)} Lakhs
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 bg-nyati-success/5 border border-nyati-success/15 rounded-2xl text-[11px] text-nyati-success font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Dues follow-up alert dispatched to matching customer portfolios in CRM.</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDrilldownData(null)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 font-bold text-[13px] transition-all duration-200"
                >
                  Close Detail
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
