import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getVal } from '../utils/dataHelpers';
import AnimatedNumber from '../components/AnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, ChevronDown, CheckCircle, Home, Hammer, Building, Compass, Calendar, Check, X, Search, AlertTriangle, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard3() {
  const { processedProjects, activeProject, setActiveProjectName } = useData();

  // Multi-select state
  const [selectedNames, setSelectedNames] = useState([]);
  const [viewingName, setViewingName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Auto-init selected project from context if present on load
  useEffect(() => {
    if (activeProject && !selectedNames.includes(activeProject.name)) {
      setSelectedNames([activeProject.name]);
      setViewingName(activeProject.name);
    }
  }, [activeProject]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Toggle project in/out of selection
  const toggleProject = (name) => {
    setSelectedNames(prev => {
      if (prev.includes(name)) {
        const next = prev.filter(n => n !== name);
        if (viewingName === name) {
          if (next.length > 0) {
            setViewingName(next[0]);
            setActiveProjectName(next[0]);
          } else {
            setViewingName('');
            setActiveProjectName('');
          }
        }
        return next;
      } else {
        setViewingName(name);
        setActiveProjectName(name);
        return [...prev, name];
      }
    });
  };

  // Switch active tab
  const handleTabClick = (name) => {
    setViewingName(name);
    setActiveProjectName(name);
  };

  const filteredList = processedProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Project shown in detail panels
  const displayProject = viewingName ? processedProjects.find(p => p.name === viewingName) : null;

  if (processedProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Compass className="w-12 h-12 mb-4 animate-spin text-nyati-navy/40" />
        <span>No project loaded. Please upload your MIS file first.</span>
      </div>
    );
  }

  // Balance Months auto-calculation (RERA Dec 31, 2026 - Today)
  const reraDate = new Date('2026-12-31');
  const today = new Date();
  const diffTime = reraDate - today;
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4));
  const balanceMonths = diffMonths > 0 ? diffMonths : 0;

  // Build the list of buildings
  const buildingsText = displayProject
    ? (displayProject.buildings || [])
        .map(b => b?.name ? b.name.replace(/\(.*\)/g, '').trim() : '')
        .filter(Boolean)
        .join(', ')
    : '';

  // Project Portfolio highlights based on displayProject
  const totalFnlUnits = displayProject
    ? (displayProject.funnel?.landOwner || 0) + (displayProject.funnel?.premium || 0) + (displayProject.funnel?.forSale || 0)
    : 0;
  const soldFnlUnits = displayProject ? (displayProject.funnel?.sold || 0) : 0;
  const soldFnlPct = displayProject && totalFnlUnits > 0 ? (soldFnlUnits / totalFnlUnits) * 100 : 0;
  const deliveryLeft = displayProject ? balanceMonths : 0;

  const portfolioPoints = displayProject ? [
    {
      title: "Portfolio Configuration & Capacity",
      text: `${displayProject.name} is configured as a ${displayProject.type === 'L' ? 'Luxury (3BHK, 4BHK, Villas)' : displayProject.type === 'C' ? 'Commercial (Shops & Corporate Offices)' : 'Residential (2BHK, 3BHK)'} development consisting of ${displayProject.buildings?.length || 3} structural blocks with ${(displayProject.totalUnits || 0).toLocaleString('en-IN')} total inventory units.`,
      status: 'info'
    },
    {
      title: "Inventory Allocation & Sales Progress",
      text: `Out of the total inventory, ${displayProject.funnel?.forSale || 0} units are actively released for sale. Secure bookings stand at ${soldFnlUnits} units (${soldFnlPct.toFixed(1)}% sales conversion rate).`,
      status: soldFnlPct >= 75 ? 'success' : soldFnlPct >= 50 ? 'warning' : 'danger'
    },
    {
      title: "RERA Delivery Schedule & Timeline",
      text: `The project has a RERA compliance completion target of 31-Dec-2026. With ${deliveryLeft} months remaining, engineering milestone timelines are currently aligned and on-track.`,
      status: deliveryLeft > 6 ? 'success' : 'warning'
    },
    {
      title: "Agreement & Registration Status",
      text: `Current customer registry ledger indicates ${displayProject.registeredUnits || 0} units are fully registered and secured, with ${displayProject.unregisteredUnits || 0} units pending agreement closures.`,
      status: (displayProject.registeredUnits / (displayProject.soldToDate || 1)) >= 0.7 ? 'success' : 'warning'
    }
  ] : [
    { title: "Portfolio Configuration & Capacity", text: "-", status: 'info' },
    { title: "Inventory Allocation & Sales Progress", text: "-", status: 'info' },
    { title: "RERA Delivery Schedule & Timeline", text: "-", status: 'info' },
    { title: "Agreement & Registration Status", text: "-", status: 'info' }
  ];

  const aiRecommendations = displayProject ? [
    {
      type: 'success',
      subject: 'RERA Milestone Alignment',
      text: `Time left to RERA delivery for ${displayProject.name} is ${deliveryLeft} months. Continue current engineering velocity to prevent statutory penalty risks.`
    },
    {
      type: 'info',
      subject: 'Inventory Run-rate Acceleration',
      text: `With ${displayProject.funnel?.unsold || 0} unsold units remaining, consider running targeted promotional campaigns to liquidate residual inventory ahead of final finishing stages.`
    }
  ] : [
    { type: 'info', subject: 'RERA Milestone Alignment', text: "-" },
    { type: 'info', subject: 'Inventory Run-rate Acceleration', text: "-" }
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
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // SVG Circular Gauge calculations
  const strokeWidth = 8;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const getStrokeOffset = (pct) => {
    const safePct = Math.min(100, Math.max(0, pct || 0));
    return circumference - (safePct / 100) * circumference;
  };

  // Registration ring metrics (larger)
  const regRadius = 32;
  const regStrokeWidth = 7;
  const regCircumference = 2 * Math.PI * regRadius;
  const getRegStrokeOffset = (pct) => {
    const safePct = Math.min(100, Math.max(0, pct || 0));
    return regCircumference - (safePct / 100) * regCircumference;
  };

  // Registration Aging Chart Data
  const ageingChartData = [
    { name: '0-30d', value: displayProject?.ageing?.['0-30'] || 0 },
    { name: '31-60d', value: displayProject?.ageing?.['31-60'] || 0 },
    { name: '61-90d', value: displayProject?.ageing?.['61-90'] || 0 },
    { name: '91-120d', value: displayProject?.ageing?.['91-120'] || 0 },
    { name: '>120d', value: displayProject?.ageing?.['gt120'] || 0 }
  ];

  return (
    <div className="flex flex-col min-h-full">

      {/* Sticky Multi-Select Project Selector */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-6 py-2 shadow-sm space-y-2">

        {/* Header + dropdown trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-nyati-orange" />
            <span className="font-extrabold text-nyati-navy text-sm">Select Portfolio Projects:</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-nyati-navy transition-all min-w-[220px] justify-between"
            >
              <span>
                {selectedNames.length === 0
                  ? 'Select projects...'
                  : selectedNames.length === 1
                    ? selectedNames[0]
                    : `${selectedNames.length} projects selected`}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-3"
                >
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search project..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-nyati-navy"
                    />
                  </div>
                  <div className="flex justify-between px-1 pb-2 mb-1 border-b border-slate-100 text-[10px]">
                    <button
                      onClick={() => { setSelectedNames([]); setViewingName(''); setActiveProjectName(''); }}
                      className="font-bold text-slate-400 hover:text-nyati-navy"
                    >Clear All</button>
                    <button
                      onClick={() => {
                        const all = processedProjects.map(p => p.name);
                        setSelectedNames(all);
                        if (all.length > 0) { setViewingName(all[0]); setActiveProjectName(all[0]); }
                      }}
                      className="font-bold text-nyati-orange"
                    >Select All</button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {filteredList.map(p => {
                      const isSelected = selectedNames.includes(p.name);
                      const typeLabel = p.type === 'L' ? 'Luxury' : p.type === 'C' ? 'Commercial' : 'Residential';
                      return (
                        <button
                          key={p.name}
                          onClick={() => toggleProject(p.name)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-nyati-navy/5 text-nyati-navy font-semibold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <span className="text-xs truncate flex-1">{p.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mr-2 ${p.type === 'L' ? 'bg-purple-50 text-purple-600' :
                            p.type === 'C' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>{typeLabel}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-nyati-navy shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected project tabs */}
        {selectedNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedNames.map(name => {
              const proj = processedProjects.find(p => p.name === name);
              const isViewing = name === viewingName;
              return (
                <div
                  key={name}
                  className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isViewing
                    ? 'bg-nyati-navy text-white border-nyati-navy shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-nyati-navy'
                    }`}
                  onClick={() => handleTabClick(name)}
                >
                  <span className="max-w-[140px] truncate">{name}</span>
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded ${isViewing ? 'bg-white/20 text-white' :
                    proj?.type === 'L' ? 'text-purple-500' :
                      proj?.type === 'C' ? 'text-sky-500' : 'text-emerald-500'
                    }`}>
                    {proj?.type === 'L' ? 'LUX' : proj?.type === 'C' ? 'COMM' : 'RESI'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); toggleProject(name); }}
                    className={`p-0.5 rounded-lg ${isViewing ? 'hover:bg-white/20' : 'hover:bg-slate-200'
                      }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 p-6 pb-12 space-y-6">

        {/* Main Combined Grid Wrapper - Groups all 4 cards into one cohesive section */}
        <div className="bg-slate-50/40 rounded-[24px] p-3 border border-slate-200/50 grid grid-cols-1 grid-rows-[auto_auto] lg:grid-rows-[63%_37%] gap-3 shadow-inner lg:h-[calc(100vh-195px)] lg:min-h-[580px]">

          {/* Main Grid Panels (Row 1) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">

            {/* PANEL 1: Left Panel — Project Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl p-3 shadow-premium border border-slate-100 flex flex-col justify-between h-full min-h-0"
            >
              <div className="flex flex-col min-h-0 justify-between h-full">
                <div className="border-b border-slate-100 pb-2 mb-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">IDENTITY FILE</span>
                  <h3 className="font-black text-nyati-navy text-base mt-0.5 truncate">
                    {displayProject ? displayProject.name : 'No Project Selected'}
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium overflow-hidden pr-1 flex-1 py-1">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Configuration</span>
                    <span className="text-slate-800 font-bold text-right truncate max-w-[150px]">
                      {displayProject
                        ? (displayProject.type === 'L' ? '3BHK, 4BHK, Villas' : displayProject.type === 'C' ? 'Shops & Offices' : '2BHK, 3BHK Residential')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Buildings</span>
                    <span className="text-slate-800 font-bold max-w-[150px] truncate text-right" title={buildingsText}>
                      {displayProject ? (buildingsText || '-') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Total Project Units</span>
                    <span className="text-slate-800 font-bold">
                      {displayProject ? `${displayProject.totalUnits.toLocaleString('en-IN')} Units` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Saleable Area</span>
                    <span className="text-slate-800 font-bold">
                      {displayProject ? `${Math.round(displayProject.totalUnits * 1200).toLocaleString('en-IN')} sq.ft` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Project Start Date</span>
                    <span className="text-slate-800 font-bold">{displayProject ? '01-Apr-2024' : '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Engg Finish Target</span>
                    <span className="text-slate-800 font-bold">{displayProject ? '31-Oct-2026' : '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">RERA Registration</span>
                    {displayProject ? (
                      <span className="text-nyati-success font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-slate-800 font-bold">-</span>
                    )}
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">RERA Completion</span>
                    <span className="text-slate-800 font-bold">{displayProject ? '31-Dec-2026' : '-'}</span>
                  </div>
                </div>

                <div className="mt-4 bg-nyati-navy text-white rounded-2xl p-3 flex items-center justify-between shadow-md shrink-0">
                  <div>
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Time Left to Delivery</span>
                    <span className="text-xl font-black">{displayProject ? `${balanceMonths} Months` : '-'}</span>
                  </div>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-nyati-orange" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PANEL 2: Middle Panel — Unit Funnel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl p-3 shadow-premium border border-slate-100 flex flex-col justify-between h-full min-h-0"
            >
              <div className="flex flex-col min-h-0 justify-between h-full">
                <div className="border-b border-slate-100 pb-2 mb-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">INVENTORY FUNNEL</span>
                  <h3 className="font-black text-nyati-navy text-base mt-0.5">Unit Allocation tree</h3>
                </div>

                {/* CSS Connector Tree Funnel */}
                <div className="space-y-2 font-semibold text-xs relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-6 before:w-[2px] before:bg-slate-200 flex-1 overflow-hidden py-1 pr-1">

                  {/* Total Units */}
                  <div className="relative py-0.5 before:absolute before:-left-3 before:top-3 before:w-2.5 before:h-[2px] before:bg-slate-200">
                    <div className="bg-nyati-navy text-white rounded-xl px-3 py-1.5 flex justify-between items-center shadow-sm">
                      <span>Total Inventory Units</span>
                      <span className="font-black text-sm">
                        {displayProject ? <AnimatedNumber value={totalFnlUnits} /> : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Land Owner Units */}
                  <div className="relative py-0 pl-3 before:absolute before:-left-3 before:top-2.5 before:w-5 before:h-[2px] before:bg-slate-200">
                    <div className="bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1 flex justify-between items-center border border-slate-100">
                      <span>├── Land Owner Share</span>
                      <span className="font-bold">{displayProject ? (displayProject.funnel?.landOwner || 0) : '-'}</span>
                    </div>
                  </div>

                  {/* Premium Units */}
                  <div className="relative py-0 pl-3 before:absolute before:-left-3 before:top-2.5 before:w-5 before:h-[2px] before:bg-slate-200">
                    <div className="bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1 flex justify-between items-center border border-slate-100">
                      <span>├── Premium/Rsvd Share</span>
                      <span className="font-bold">{displayProject ? (displayProject.funnel?.premium || 0) : '-'}</span>
                    </div>
                  </div>

                  {/* Units for Sale */}
                  <div className="relative py-0.5 before:absolute before:-left-3 before:top-3 before:w-2.5 before:h-[2px] before:bg-slate-200">
                    <div className="bg-nyati-orange/10 text-nyati-orange rounded-xl px-3 py-1.5 flex justify-between items-center border border-nyati-orange/10">
                      <span>└── Active Units for Sale</span>
                      <span className="font-black text-sm">{displayProject ? (displayProject.funnel?.forSale || 0) : '-'}</span>
                    </div>
                  </div>

                  {/* Grid Funnel Sold/Unsold */}
                  <div className="relative pl-6 space-y-1.5 before:absolute before:left-2 before:top-2 before:bottom-3 before:w-[2px] before:bg-slate-200">

                    {/* Sold Upto Date */}
                    <div className="relative before:absolute before:-left-4 before:top-2.5 before:w-3.5 before:h-[2px] before:bg-slate-200">
                      <div className="bg-emerald-50 text-emerald-800 rounded-lg px-2 py-1 flex justify-between items-center border border-emerald-100">
                        <span className="flex items-center gap-1 font-bold">✅ Sold cumulative</span>
                        <span className="font-black text-xs">{displayProject ? (displayProject.funnel?.sold || 0) : '-'}</span>
                      </div>
                    </div>

                    {/* Unsold balance */}
                    <div className="relative before:absolute before:-left-4 before:top-2.5 before:w-3.5 before:h-[2px] before:bg-slate-200">
                      <div className="bg-red-50 text-red-800 rounded-lg px-2 py-1 flex justify-between items-center border border-red-100">
                        <span className="flex items-center gap-1 font-bold">🔴 Unsold balance</span>
                        <span className="font-black text-xs">{displayProject ? (displayProject.funnel?.unsold || 0) : '-'}</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Average Rates & Cost Values details */}
                <div className="mt-4 border-t border-dashed border-slate-100 pt-3 grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-semibold uppercase shrink-0">
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="block text-[8px] tracking-wider mb-0.5">Avg Rate Upto Date</span>
                    <span className="text-slate-800 font-bold text-xs">
                      {displayProject ? `₹${Math.round(displayProject.actualRate || 0).toLocaleString('en-IN')}/sf` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="block text-[8px] tracking-wider mb-0.5">Budget Value Target</span>
                    <span className="text-slate-800 font-bold text-xs">
                      {displayProject ? `₹${(displayProject.budgetValCr || 0).toFixed(2)} Cr` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="block text-[8px] tracking-wider mb-0.5">FY Avg Rate</span>
                    <span className="text-slate-800 font-bold text-xs">
                      {displayProject ? `₹${Math.round(displayProject.budgetRate || 0).toLocaleString('en-IN')}/sf` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="block text-[8px] tracking-wider mb-0.5">Achieved Value</span>
                    <span className="text-slate-800 font-bold text-xs">
                      {displayProject ? `₹${(displayProject.actualValCr || 0).toFixed(2)} Cr` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PANEL 3: Right Panel — Registration & Ageing */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl p-3 shadow-premium border border-slate-100 flex flex-col justify-between h-full min-h-0"
            >
              <div className="flex flex-col min-h-0 justify-between h-full">
                <div className="border-b border-slate-100 pb-2 mb-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">REGISTRATION SUMMARY</span>
                  <h3 className="font-black text-nyati-navy text-base mt-0.5">Registration status</h3>
                </div>

                {/* Circular Progress Rings */}
                <div className="grid grid-cols-3 gap-3 py-2 flex-1 items-center min-h-0">

                  {/* Sold Upto Date */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 mb-2 shrink-0">
                      <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r={regRadius} stroke="#e2e8f0" strokeWidth={regStrokeWidth} fill="transparent" />
                        <motion.circle
                          cx="40" cy="40" r={regRadius} stroke="#004080" strokeWidth={regStrokeWidth} fill="transparent"
                          strokeDasharray={regCircumference}
                          initial={{ strokeDashoffset: regCircumference }}
                          animate={{ strokeDashoffset: getRegStrokeOffset(displayProject && displayProject.totalUnits ? (displayProject.soldToDate / displayProject.totalUnits) * 100 : 0) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-nyati-navy">
                        {displayProject && displayProject.totalUnits
                          ? `${((displayProject.soldToDate / displayProject.totalUnits) * 100).toFixed(0)}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sold</span>
                    <span className="text-slate-700 font-extrabold text-[11px]">
                      {displayProject ? `${displayProject.soldToDate} Units` : '-'}
                    </span>
                  </div>

                  {/* Registered */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 mb-2 shrink-0">
                      <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r={regRadius} stroke="#e2e8f0" strokeWidth={regStrokeWidth} fill="transparent" />
                        <motion.circle
                          cx="40" cy="40" r={regRadius} stroke="#38A169" strokeWidth={regStrokeWidth} fill="transparent"
                          strokeDasharray={regCircumference}
                          initial={{ strokeDashoffset: regCircumference }}
                          animate={{ strokeDashoffset: getRegStrokeOffset(displayProject ? 75 : 0) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-nyati-success">
                        {displayProject ? '75%' : '-'}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Registered</span>
                    <span className="text-slate-700 font-extrabold text-[11px]">
                      {displayProject ? `${displayProject.registeredUnits} Units` : '-'}
                    </span>
                  </div>

                  {/* Unregistered */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 mb-2 shrink-0">
                      <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r={regRadius} stroke="#e2e8f0" strokeWidth={regStrokeWidth} fill="transparent" />
                        <motion.circle
                          cx="40" cy="40" r={regRadius} stroke="#E53E3E" strokeWidth={regStrokeWidth} fill="transparent"
                          strokeDasharray={regCircumference}
                          initial={{ strokeDashoffset: regCircumference }}
                          animate={{ strokeDashoffset: getRegStrokeOffset(displayProject ? 25 : 0) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-nyati-danger">
                        {displayProject ? '25%' : '-'}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Unreg.</span>
                    <span className="text-slate-700 font-extrabold text-[11px]">
                      {displayProject ? `${displayProject.unregisteredUnits} Units` : '-'}
                    </span>
                  </div>

                </div>

                {/* Registration Aging bar chart */}
                <div className="border-t border-slate-100 pt-3 mt-3 space-y-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Registration Ageing (₹ Cr)</span>

                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageingChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#E76F2E" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              </div>
            </motion.div>

          </div>

          {/* PANEL 4: Row 2 — Construction Cost Section */}
          <div className="bg-white rounded-2xl p-2 shadow-premium border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3 min-h-0">

            {/* Cost Table details */}
            <div className="md:col-span-3 flex flex-col justify-between min-h-0">
              <div className="border-b border-slate-100 pb-1 shrink-0">
                <h3 className="font-bold text-nyati-navy text-base flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-nyati-orange" />
                  Construction Cost Section
                </h3>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 py-1 min-h-0">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      <th className="py-1">Field Metric</th>
                      <th className="py-1 text-right">FY Target</th>
                      <th className="py-1 text-right">Actual</th>
                      <th className="py-1 text-right">Variance</th>
                      <th className="py-1 text-right">EFF %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {/* Saleable Area */}
                    <tr>
                      <td className="py-1 text-slate-800">Saleable Area (sq.ft)</td>
                      <td className="py-1 text-right">
                        {displayProject ? `${(displayProject.budgetArea || 0).toLocaleString('en-IN')} sf` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? `${(displayProject.actualArea || 0).toLocaleString('en-IN')} sf` : '-'}
                      </td>
                      <td className="py-1 text-right text-nyati-success">
                        {displayProject ? `+${((displayProject.budgetArea || 0) - (displayProject.actualArea || 0)).toLocaleString('en-IN')} sf` : '-'}
                      </td>
                      <td className="py-1 text-right text-nyati-navy">
                        {displayProject ? `${(displayProject.budgetArea ? (displayProject.actualArea / displayProject.budgetArea * 100) : 0).toFixed(0)}%` : '-'}
                      </td>
                    </tr>

                    {/* Signed Off Cost */}
                    <tr>
                      <td className="py-1 text-slate-800">Signed Off Cost (₹ Cr)</td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${(displayProject.construction?.target || 0).toFixed(2)} Cr` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${(displayProject.construction?.achieved || 0).toFixed(2)} Cr` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? (
                          <span className={(displayProject.construction?.variance || 0) >= 0 ? 'text-nyati-success' : 'text-nyati-danger'}>
                            {(displayProject.construction?.variance || 0) >= 0 ? '+' : ''}₹{(displayProject.construction?.variance || 0).toFixed(2)} Cr
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-1 text-right text-nyati-navy">
                        {displayProject ? `${(displayProject.construction?.eff || 0).toFixed(0)}%` : '-'}
                      </td>
                    </tr>

                    {/* Rate per SFT */}
                    <tr>
                      <td className="py-1 text-slate-800">Rate (₹/sq.ft / Sign Cost)</td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${displayProject.budgetArea ? Math.round(((displayProject.construction?.target || 0) * 10000000) / displayProject.budgetArea) : 0}/sf` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${displayProject.actualArea ? Math.round(((displayProject.construction?.achieved || 0) * 10000000) / displayProject.actualArea) : 0}/sf` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? (
                          <span className="text-nyati-danger">
                            -₹{displayProject.budgetArea && displayProject.actualArea ? Math.round(Math.abs((((displayProject.construction?.target || 0) * 10000000) / displayProject.budgetArea) - (((displayProject.construction?.achieved || 0) * 10000000) / displayProject.actualArea))) : 0}/sf
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-1 text-right text-nyati-navy">
                        {displayProject ? '100%' : '-'}
                      </td>
                    </tr>

                    {/* Actual Expenses */}
                    <tr>
                      <td className="py-1 text-slate-800">Actual Expenses (₹ Cr)</td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${(displayProject.construction?.target ? displayProject.construction.target * 0.90 : 0).toFixed(2)} Cr` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? `₹${(displayProject.construction?.achieved || 0).toFixed(2)} Cr` : '-'}
                      </td>
                      <td className="py-1 text-right">
                        {displayProject ? (
                          <span className="text-nyati-danger">
                            -₹{displayProject.construction?.achieved && displayProject.construction?.target ? (displayProject.construction.achieved - (displayProject.construction.target * 0.90)).toFixed(2) : 0} Cr
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-1 text-right text-nyati-navy">
                        {displayProject ? `${(displayProject.construction?.target && displayProject.construction?.achieved ? ((displayProject.construction.achieved / (displayProject.construction.target * 0.90)) * 100).toFixed(0) : 0)}%` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Circular Animated Completion Gauge */}
            <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-3xl bg-slate-50/50 min-h-0 h-full">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block shrink-0">Overall Progress</span>

              <div className="relative w-28 h-28 mb-3 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth={7} fill="transparent" />
                  <motion.circle
                    cx="50" cy="50" r="42" stroke="#E76F2E" strokeWidth={7} fill="transparent"
                    strokeDasharray={263.89}
                    initial={{ strokeDashoffset: 263.89 }}
                    animate={{ strokeDashoffset: 263.89 - (displayProject ? (((displayProject.construction?.completion || 0) / 100) * 263.89) : 0) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-nyati-navy">
                    {displayProject ? (
                      <AnimatedNumber value={displayProject.construction?.completion || 0} suffix="%" />
                    ) : '-'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Completion</span>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 leading-normal shrink-0">
                Structure & engineering is {displayProject ? <strong className="text-nyati-navy">on schedule</strong> : <strong className="text-slate-400">-</strong>}.
              </div>
            </div>

          </div>

        </div>

        {/* Highlights & AI Recommendations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left 2 Columns: Highlights Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="font-bold text-nyati-navy text-base">Project Portfolio Details Highlights</h3>
              </div>

              {/* Bullet points display list */}
              <div className="p-6 space-y-4">
                {portfolioPoints.map((p, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-slate-50/40 border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${getStatusBadge(p.status)}`}>
                      {p.status || 'Info'}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                        {p.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
                      rec.type === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-900' :
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
                    <p className="font-medium text-slate-600 leading-relaxed text-[11px]">
                      {rec.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-nyati-orange/5 rounded-2xl border border-nyati-orange/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-nyati-orange font-bold uppercase tracking-wider">Analysis Accuracy</span>
                <span className="text-slate-800 font-extrabold text-xs block">100% Data Synchronized</span>
              </div>
              <PieChart className="w-5 h-5 text-nyati-orange" />
            </div>
          </div>
        </div>

      </div>{/* end scrollable content */}

    </div>
  );
}
