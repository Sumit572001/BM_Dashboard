import React from 'react';
import { useData } from '../context/DataContext';
import { getVal } from '../utils/dataHelpers';
import AnimatedNumber from '../components/AnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, ChevronDown, CheckCircle, Home, Hammer, Percent, Sparkles, Building, Landmark, Compass, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard3() {
  const { processedProjects, activeProject, setActiveProjectName } = useData();

  console.log("activeProject in Dashboard3:", activeProject);

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Compass className="w-12 h-12 mb-4 animate-spin text-nyati-navy/40" />
        <span>No project loaded. Please upload your MIS file first.</span>
      </div>
    );
  }

  // Handle project change from dropdown
  const handleProjectSelect = (e) => {
    setActiveProjectName(e.target.value);
  };

  // Balance Months auto-calculation (RERA Dec 31, 2026 - Today)
  const reraDate = new Date('2026-12-31');
  const today = new Date();
  const diffTime = reraDate - today;
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4));
  const balanceMonths = diffMonths > 0 ? diffMonths : 0;

  // Build the list of buildings
  const buildingsText = (activeProject?.buildings || [])
    .map(b => b?.name ? b.name.replace(/\(.*\)/g, '').trim() : '')
    .filter(Boolean)
    .join(', ');

  // SVG Circular Gauge calculations
  const strokeWidth = 8;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const getStrokeOffset = (pct) => {
    const safePct = Math.min(100, Math.max(0, pct || 0));
    return circumference - (safePct / 100) * circumference;
  };

  // Registration Aging Chart Data
  const ageingChartData = [
    { name: '0-30d', value: activeProject?.ageing?.['0-30'] || 0 },
    { name: '31-60d', value: activeProject?.ageing?.['31-60'] || 0 },
    { name: '61-90d', value: activeProject?.ageing?.['61-90'] || 0 },
    { name: '91-120d', value: activeProject?.ageing?.['91-120'] || 0 },
    { name: '>120d', value: activeProject?.ageing?.['gt120'] || 0 }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Project Selector */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-premium border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Building className="w-5 h-5 text-nyati-orange" />
          <span className="font-extrabold text-nyati-navy text-sm">Select Active Portfolio:</span>
        </div>
        <div className="relative min-w-[240px]">
          <select
            value={activeProject.name}
            onChange={handleProjectSelect}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-nyati-navy cursor-pointer"
          >
            {processedProjects.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.type === 'L' ? 'Luxury' : p.type === 'C' ? 'Commercial' : 'Residential'})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: Left Panel — Project Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">IDENTITY FILE</span>
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">{activeProject?.name}</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Configuration</span>
                <span className="text-slate-800 font-bold">{activeProject?.type === 'L' ? '3BHK, 4BHK, Villas' : activeProject?.type === 'C' ? 'Shops & Corporate Offices' : '2BHK, 3BHK Residential'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Buildings</span>
                <span className="text-slate-800 font-bold max-w-[150px] truncate text-right" title={buildingsText}>
                  {buildingsText || 'A1, A2, B1'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Total Project Units</span>
                <span className="text-slate-800 font-bold">{(activeProject?.totalUnits || 0).toLocaleString('en-IN')} Units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Saleable Area</span>
                <span className="text-slate-800 font-bold">{Math.round((activeProject?.totalUnits || 0) * 1200).toLocaleString('en-IN')} sq.ft</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Project Start Date</span>
                <span className="text-slate-800 font-bold">01-Apr-2024</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Engg Finish Target</span>
                <span className="text-slate-800 font-bold">31-Oct-2026</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">RERA Registration</span>
                <span className="text-nyati-success font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Approved
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">RERA Completion</span>
                <span className="text-slate-800 font-bold">31-Dec-2026</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-nyati-navy text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Time Left to Delivery</span>
              <span className="text-2xl font-black">{balanceMonths} Months</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Calendar className="w-6 h-6 text-nyati-orange" />
            </div>
          </div>
        </motion.div>

        {/* PANEL 2: Middle Panel — Unit Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">INVENTORY FUNNEL</span>
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Unit Allocation tree</h3>
            </div>

            {/* CSS Connector Tree Funnel */}
            <div className="space-y-3 font-semibold text-xs relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-6 before:w-[2px] before:bg-slate-200">
              
              {/* Total Units */}
              <div className="relative py-1 before:absolute before:-left-3 before:top-4 before:w-2.5 before:h-[2px] before:bg-slate-200">
                <div className="bg-nyati-navy text-white rounded-xl px-3 py-2 flex justify-between items-center shadow-sm">
                  <span>Total Inventory Units</span>
                  <span className="font-black text-sm"><AnimatedNumber value={(activeProject?.funnel?.landOwner || 0) + (activeProject?.funnel?.premium || 0) + (activeProject?.funnel?.forSale || 0)} /></span>
                </div>
              </div>

              {/* Land Owner Units */}
              <div className="relative py-0.5 pl-4 before:absolute before:-left-3 before:top-3.5 before:w-6 before:h-[2px] before:bg-slate-200">
                <div className="bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1.5 flex justify-between items-center border border-slate-100">
                  <span>├── Land Owner Share</span>
                  <span className="font-bold">{activeProject?.funnel?.landOwner || 0}</span>
                </div>
              </div>

              {/* Premium Units */}
              <div className="relative py-0.5 pl-4 before:absolute before:-left-3 before:top-3.5 before:w-6 before:h-[2px] before:bg-slate-200">
                <div className="bg-slate-50 text-slate-600 rounded-lg px-2.5 py-1.5 flex justify-between items-center border border-slate-100">
                  <span>├── Premium/Rsvd Share</span>
                  <span className="font-bold">{activeProject?.funnel?.premium || 0}</span>
                </div>
              </div>

              {/* Units for Sale */}
              <div className="relative py-1 before:absolute before:-left-3 before:top-4 before:w-2.5 before:h-[2px] before:bg-slate-200">
                <div className="bg-nyati-orange/10 text-nyati-orange rounded-xl px-3 py-2 flex justify-between items-center border border-nyati-orange/10">
                  <span>└── Active Units for Sale</span>
                  <span className="font-black text-sm">{activeProject?.funnel?.forSale || 0}</span>
                </div>
              </div>

              {/* Grid Funnel Sold/Unsold */}
              <div className="relative pl-8 space-y-2 before:absolute before:left-2 before:top-2 before:bottom-4 before:w-[2px] before:bg-slate-200">
                
                {/* Sold Upto Date */}
                <div className="relative before:absolute before:-left-5 before:top-3 before:w-4 before:h-[2px] before:bg-slate-200">
                  <div className="bg-emerald-50 text-emerald-800 rounded-lg px-2.5 py-1.5 flex justify-between items-center border border-emerald-100">
                    <span className="flex items-center gap-1.5 font-bold">✅ Sold cumulative</span>
                    <span className="font-black text-sm">{activeProject?.funnel?.sold || 0}</span>
                  </div>
                </div>

                {/* Unsold balance */}
                <div className="relative before:absolute before:-left-5 before:top-3 before:w-4 before:h-[2px] before:bg-slate-200">
                  <div className="bg-red-50 text-red-800 rounded-lg px-2.5 py-1.5 flex justify-between items-center border border-red-100">
                    <span className="flex items-center gap-1.5 font-bold">🔴 Unsold balance</span>
                    <span className="font-black text-sm">{activeProject?.funnel?.unsold || 0}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Average Rates & Cost Values details */}
          <div className="mt-6 border-t border-dashed border-slate-100 pt-4 grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-semibold uppercase">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="block text-[8px] tracking-wider mb-0.5">Avg Rate Upto Date</span>
              <span className="text-slate-800 font-bold text-xs">₹{Math.round(activeProject?.actualRate || 0).toLocaleString('en-IN')}/sf</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="block text-[8px] tracking-wider mb-0.5">Budget Value Target</span>
              <span className="text-slate-800 font-bold text-xs">₹{(activeProject?.budgetValCr || 0).toFixed(2)} Cr</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="block text-[8px] tracking-wider mb-0.5">FY Avg Rate</span>
              <span className="text-slate-800 font-bold text-xs">₹{Math.round(activeProject?.budgetRate || 0).toLocaleString('en-IN')}/sf</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="block text-[8px] tracking-wider mb-0.5">Achieved Value</span>
              <span className="text-slate-800 font-bold text-xs">₹{(activeProject?.actualValCr || 0).toFixed(2)} Cr</span>
            </div>
          </div>
        </motion.div>

        {/* PANEL 3: Right Panel — Registration & Ageing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">REGISTRATION SUMMARY</span>
              <h3 className="font-black text-nyati-navy text-lg mt-0.5">Registration status</h3>
            </div>

            {/* Circular Progress Rings */}
            <div className="grid grid-cols-3 gap-2 py-2">
              
              {/* Sold Upto Date */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                    <motion.circle
                      cx="32" cy="32" r={radius} stroke="#004080" strokeWidth={strokeWidth} fill="transparent"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: getStrokeOffset(activeProject?.totalUnits ? (activeProject.soldToDate / activeProject.totalUnits) * 100 : 0) }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-nyati-navy">
                    {(activeProject?.totalUnits ? (activeProject.soldToDate / activeProject.totalUnits) * 100 : 0).toFixed(0)}%
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sold</span>
                <span className="text-slate-700 font-bold text-[10px]">{activeProject?.soldToDate || 0} Units</span>
              </div>

              {/* Registered */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                    <motion.circle
                      cx="32" cy="32" r={radius} stroke="#38A169" strokeWidth={strokeWidth} fill="transparent"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: getStrokeOffset(75) }} // Mock 75% registration rate
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-nyati-success">
                    75%
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Registered</span>
                <span className="text-slate-700 font-bold text-[10px]">{activeProject?.registeredUnits || 0} Units</span>
              </div>

              {/* Unregistered */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                    <motion.circle
                      cx="32" cy="32" r={radius} stroke="#E53E3E" strokeWidth={strokeWidth} fill="transparent"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: getStrokeOffset(25) }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-nyati-danger">
                    25%
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Unregistered</span>
                <span className="text-slate-700 font-bold text-[10px]">{activeProject?.unregisteredUnits || 0} Units</span>
              </div>

            </div>

            {/* Registration Aging bar chart */}
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Registration Ageing (₹ Cr)</span>
              
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageingChartData} margin={{ top: 10, right: 0, left: -25, bottom: -10 }}>
                    <XAxis dataKey="name" fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#E76F2E" radius={[2, 2, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        </motion.div>

      </div>

      {/* BOTTOM ROW — Construction Cost Section */}
      <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Cost Table details */}
        <div className="md:col-span-3 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-nyati-navy text-lg flex items-center gap-2">
              <Hammer className="w-5 h-5 text-nyati-orange" />
              Construction Cost Section
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Budgeted construction targets, achieved metrics, and calculated efficiency rates.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-50">
                  <th className="py-2.5">Field Metric</th>
                  <th className="py-2.5 text-right">FY Target</th>
                  <th className="py-2.5 text-right">Actual</th>
                  <th className="py-2.5 text-right">Variance</th>
                  <th className="py-2.5 text-right">EFF %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {/* Saleable Area */}
                <tr>
                  <td className="py-3 text-slate-800">Saleable Area (sq.ft)</td>
                  <td className="py-3 text-right">{(activeProject?.budgetArea || 0).toLocaleString('en-IN')} sf</td>
                  <td className="py-3 text-right">{(activeProject?.actualArea || 0).toLocaleString('en-IN')} sf</td>
                  <td className="py-3 text-right text-nyati-success">+{( (activeProject?.budgetArea || 0) - (activeProject?.actualArea || 0) ).toLocaleString('en-IN')} sf</td>
                  <td className="py-3 text-right text-nyati-navy">{(activeProject?.budgetArea ? (activeProject.actualArea / activeProject.budgetArea * 100) : 0).toFixed(0)}%</td>
                </tr>

                {/* Signed Off Cost */}
                <tr>
                  <td className="py-3 text-slate-800">Signed Off Cost (₹ Cr)</td>
                  <td className="py-3 text-right">₹{(activeProject?.construction?.target || 0).toFixed(2)} Cr</td>
                  <td className="py-3 text-right">₹{(activeProject?.construction?.achieved || 0).toFixed(2)} Cr</td>
                  <td className="py-3 text-right text-nyati-success">+₹{((activeProject?.construction?.target || 0) - (activeProject?.construction?.achieved || 0)).toFixed(2)} Cr</td>
                  <td className="py-3 text-right text-nyati-navy">{(activeProject?.construction?.eff || 0).toFixed(0)}%</td>
                </tr>

                {/* Rate per SFT */}
                <tr>
                  <td className="py-3 text-slate-800">Rate (₹/sq.ft / Sign Cost)</td>
                  <td className="py-3 text-right">₹{activeProject?.budgetArea ? Math.round(((activeProject?.construction?.target || 0) * 10000000) / activeProject.budgetArea) : 0}/sf</td>
                  <td className="py-3 text-right">₹{activeProject?.actualArea ? Math.round(((activeProject?.construction?.achieved || 0) * 10000000) / activeProject.actualArea) : 0}/sf</td>
                  <td className="py-3 text-right text-nyati-danger">
                    -₹{activeProject?.budgetArea && activeProject?.actualArea ? Math.round(Math.abs((((activeProject?.construction?.target || 0) * 10000000) / activeProject.budgetArea) - (((activeProject?.construction?.achieved || 0) * 10000000) / activeProject.actualArea))) : 0}/sf
                  </td>
                  <td className="py-3 text-right text-nyati-navy">100%</td>
                </tr>

                {/* Actual Expenses */}
                <tr>
                  <td className="py-3 text-slate-800">Actual Expenses (₹ Cr)</td>
                  <td className="py-3 text-right">₹{(activeProject?.construction?.target ? activeProject.construction.target * 0.90 : 0).toFixed(2)} Cr</td>
                  <td className="py-3 text-right">₹{(activeProject?.construction?.achieved || 0).toFixed(2)} Cr</td>
                  <td className="py-3 text-right text-nyati-danger">-₹{activeProject?.construction?.achieved && activeProject?.construction?.target ? (activeProject.construction.achieved - (activeProject.construction.target * 0.90)).toFixed(2) : 0} Cr</td>
                  <td className="py-3 text-right text-nyati-navy">{(activeProject?.construction?.target && activeProject?.construction?.achieved ? ((activeProject.construction.achieved / (activeProject.construction.target * 0.90)) * 100).toFixed(0) : 0)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Circular Animated Completion Gauge */}
        <div className="flex flex-col items-center justify-center text-center p-4 border border-slate-100 rounded-3xl bg-slate-50/50">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 block">Overall Progress</span>
          
          <div className="relative w-28 h-28 mb-3">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
              <motion.circle
                cx="56" cy="56" r="48" stroke="#E76F2E" strokeWidth="8" fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 - ((activeProject?.construction?.completion || 0) / 100) * (2 * Math.PI * 48) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-nyati-navy">
                <AnimatedNumber value={activeProject?.construction?.completion || 0} suffix="%" />
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Completion</span>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-slate-500">
            Structure and engineering milestones are <strong className="text-nyati-navy">on schedule</strong>.
          </div>
        </div>

      </div>

    </div>
  );
}
