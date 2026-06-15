import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals } from '../utils/dataHelpers';
import AnimatedNumber from '../components/AnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronDown, Calendar, Percent, Landmark, HelpCircle, X, CheckCircle, Layers, AlertTriangle, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard2() {
  const { filteredProjects } = useData();
  const [activeMonth, setActiveMonth] = useState('APR 26');
  const [activeMetric, setActiveMetric] = useState('value'); // 'unit' | 'value' | 'collection' | 'registration'

  // Modal state for ageing drilldown
  const [drilldownData, setDrilldownData] = useState(null);

  const sectionBRef = useRef(null); // Consolidated Outstanding
  const sectionCRef = useRef(null); // Ageing Matrix
  const sectionDRef = useRef(null); // Construction Cost

  // Derive grand totals
  const totals = calculateGrandTotals(filteredProjects);

  // Month multiplier simulation (modifies values when changing months)
  const getMonthMultiplier = () => {
    switch (activeMonth) {
      case 'MAY 26': return 1.05;
      case 'JUN 26': return 0.98;
      case 'JUL 26': return 1.12;
      default: return 1.0; // APR 26
    }
  };

  const multiplier = getMonthMultiplier();

  // Project chart data mapping
  const chartData = filteredProjects.map(p => {
    let budget = 0;
    let actual = 0;

    if (activeMetric === 'unit') {
      budget = p.budgetUnits;
      actual = p.soldToDate;
    } else if (activeMetric === 'value') {
      budget = p.budgetValCr;
      actual = p.actualValCr;
    } else if (activeMetric === 'collection') {
      budget = p.budgetCollection;
      actual = p.actualCollection;
    } else if (activeMetric === 'registration') {
      budget = Math.round(p.budgetUnits * 0.75);
      actual = p.registeredUnits;
    }

    // Apply month multiplier to actual data for visual interaction
    return {
      name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
      'Budget/Planned': parseFloat((budget * (activeMetric === 'unit' || activeMetric === 'registration' ? 1 : multiplier)).toFixed(1)),
      'Actual': parseFloat((actual * multiplier).toFixed(1))
    };
  });

  // Calculate Consolidated Grand Totals
  const grandTotalSoldVal = filteredProjects.reduce((s, p) => s + p.actualValCr, 0);
  const grandTotalDueMilestone = filteredProjects.reduce((s, p) => s + p.dueMilestone, 0);
  const grandTotalCollection = filteredProjects.reduce((s, p) => s + p.actualCollection, 0);
  const grandTotalOutstanding = grandTotalDueMilestone - grandTotalCollection;
  const grandTotalRegOS = filteredProjects.reduce((s, p) => s + p.registeredOS, 0);
  const grandTotalUnregOS = filteredProjects.reduce((s, p) => s + p.unregisteredOS, 0);

  // Ageing columns Grand Totals
  const grandAgeing0_30 = filteredProjects.reduce((s, p) => s + p.ageing['0-30'], 0);
  const grandAgeing31_60 = filteredProjects.reduce((s, p) => s + p.ageing['31-60'], 0);
  const grandAgeing61_90 = filteredProjects.reduce((s, p) => s + p.ageing['61-90'], 0);
  const grandAgeing91_120 = filteredProjects.reduce((s, p) => s + p.ageing['91-120'], 0);
  const grandAgeingGt120 = filteredProjects.reduce((s, p) => s + p.ageing['gt120'], 0);
  const grandAgeingTotal = grandAgeing0_30 + grandAgeing31_60 + grandAgeing61_90 + grandAgeing91_120 + grandAgeingGt120;

  // Construction Columns Grand Totals
  const grandConstTarget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const grandConstAchieved = filteredProjects.reduce((s, p) => s + p.construction.achieved, 0);
  const grandConstVariance = grandConstTarget - grandConstAchieved;
  const grandConstEff = grandConstTarget > 0 ? (grandConstAchieved / grandConstTarget) * 100 : 0;

  // Color-code outstanding amount
  const getOutstandingColor = (val) => {
    if (val > 20) return 'text-nyati-danger font-extrabold bg-nyati-danger/5 border border-nyati-danger/10';
    if (val >= 10) return 'text-nyati-warning font-bold bg-nyati-warning/5 border border-nyati-warning/10';
    return 'text-nyati-success font-semibold bg-nyati-success/5 border border-nyati-success/10';
  };

  // Get Ageing Class for Heatmap
  const getAgeingHeatClass = (val) => {
    if (val === 0) return 'text-slate-300';
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

  return (
    <div className="space-y-8 pb-12 pt-6">



      {/* SECTION A: Project Summary Bar Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-nyati-navy text-lg">Project Planned vs Actual Comparisons</h3>
            <p className="text-slate-400 text-xs mt-0.5">Visualize sales metrics side by side on project-level distributions.</p>
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { label: 'Units', value: 'unit' },
                { label: 'Value (Cr)', value: 'value' },
                { label: 'Collection (Cr)', value: 'collection' },
                { label: 'Registration', value: 'registration' }
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setActiveMetric(m.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeMetric === m.value ? 'bg-white text-nyati-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Month Tabs */}
            <div className="flex border border-slate-200 rounded-xl bg-white text-xs overflow-hidden">
              {['APR 26', 'MAY 26', 'JUN 26', 'JUL 26'].map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMonth(m)}
                  className={`px-3 py-2 border-r border-slate-100 last:border-r-0 font-semibold transition-all ${activeMonth === m ? 'bg-nyati-orange text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Window */}
        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">No project data to display.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Budget/Planned" fill="#004080" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="Actual" fill="#E76F2E" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SECTION B: CONSOLIDATED PROJECT OUTSTANDING Table */}
      <div ref={sectionBRef} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm">
          <h3 className="font-bold text-nyati-navy text-lg">Consolidated Project Outstanding</h3>
          <p className="text-slate-400 text-xs mt-0.5">Summary of dues and collections by project. Alerts trigger on total outstanding milestones.</p>
        </div>
        <div className="lg:overflow-x-visible overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="sticky top-[85px] z-10 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 shadow-sm">
                <th className="px-6 py-4">Project</th>
                <th className="px-4 py-4 text-right">Sold Value (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Due as per Milestone (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Total Collection (₹ Cr)</th>
                <th className="px-4 py-4 text-center">Total Outstanding (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Registered O/S</th>
                <th className="px-6 py-4 text-right">Unregistered O/S</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredProjects.map((p, index) => (
                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-700">{p.name}</td>
                  <td className="px-4 py-3.5 text-right">₹{p.actualValCr.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right">₹{p.dueMilestone.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right">₹{p.actualCollection.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs ${getOutstandingColor(p.outstanding)}`}>
                      ₹{p.outstanding.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500">₹{p.registeredOS.toFixed(2)}</td>
                  <td className="px-6 py-3.5 text-right text-slate-500">₹{p.unregisteredOS.toFixed(2)}</td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t-2 border-slate-200">
                <td className="px-6 py-4">GRAND TOTAL</td>
                <td className="px-4 py-4 text-right">₹{grandTotalSoldVal.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{grandTotalDueMilestone.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{grandTotalCollection.toFixed(2)}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-4 py-1.5 rounded-lg text-xs border border-nyati-navy/10 ${getOutstandingColor(grandTotalOutstanding)}`}>
                    ₹{grandTotalOutstanding.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">₹{grandTotalRegOS.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">₹{grandTotalUnregOS.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION C: AGEING OUTSTANDING Table */}
      <div ref={sectionCRef} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm">
          <h3 className="font-bold text-nyati-navy text-lg">Ageing Outstanding Matrix</h3>
          <p className="text-slate-400 text-xs mt-0.5">Click cells to drill down to flat details. Visualized heatmap displays critical delays (&gt;90 days).</p>
        </div>
        <div className="lg:overflow-x-visible overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="sticky top-[85px] z-10 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 text-left shadow-sm">
                <th className="px-6 py-4 text-left">Project</th>
                <th className="px-4 py-4 text-center">0–30 Days (₹ Cr)</th>
                <th className="px-4 py-4 text-center">31–60 Days (₹ Cr)</th>
                <th className="px-4 py-4 text-center">61–90 Days (₹ Cr)</th>
                <th className="px-4 py-4 text-center">91–120 Days (₹ Cr)</th>
                <th className="px-4 py-4 text-center">&gt;120 Days (₹ Cr)</th>
                <th className="px-6 py-4 text-center">Total (₹ Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredProjects.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-left font-bold text-slate-700">{p.name}</td>
                  {['0-30', '31-60', '61-90', '91-120', 'gt120'].map((bucket) => {
                    const value = p.ageing[bucket];
                    return (
                      <td
                        key={bucket}
                        onClick={() => handleAgeCellClick(p.name, bucket, value)}
                        className={`px-4 py-3.5 cursor-pointer font-bold transition-all hover:scale-95 duration-100 ${getAgeingHeatClass(value)}`}
                      >
                        <AnimatedNumber value={value} prefix="₹" decimals={2} />
                      </td>
                    );
                  })}
                  <td className="px-6 py-3.5 bg-slate-50/40 font-bold text-nyati-navy">
                    ₹{p.ageing.total.toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t border-slate-200">
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
      </div>

      {/* SECTION D: CONSTRUCTION BUDGET Table */}
      <div ref={sectionDRef} className="bg-white rounded-3xl shadow-premium border border-slate-100">
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm">
          <h3 className="font-bold text-nyati-navy text-lg">Construction Cost Budget Summary</h3>
          <p className="text-slate-400 text-xs mt-0.5">Budget targets vs construction expenses achieved, with inline efficiency tracking indicators.</p>
        </div>
        <div className="lg:overflow-x-visible overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="sticky top-[85px] z-10 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 shadow-sm">
                <th className="px-6 py-4">Project</th>
                <th className="px-4 py-4 text-right">Target / Planned (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Achieved (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Variance (₹ Cr)</th>
                <th className="px-6 py-4 min-w-[200px]">EFF % / Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredProjects.map((p) => {
                const target = p.construction.target;
                const achieved = p.construction.achieved;
                const variance = target - achieved;
                const eff = p.construction.eff;

                return (
                  <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-700">{p.name}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">₹{target.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-nyati-navy">₹{achieved.toFixed(2)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${variance >= 0 ? 'text-nyati-success' : 'text-nyati-danger'}`}>
                      {variance >= 0 ? '+' : ''}₹{variance.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 w-10 shrink-0 text-right">{eff.toFixed(0)}%</span>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${eff >= 100 ? 'bg-nyati-success' : eff >= 85 ? 'bg-nyati-warning' : 'bg-nyati-danger'}`}
                            style={{ width: `${Math.min(100, eff)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t border-slate-200">
                <td className="px-6 py-4">GRAND TOTAL</td>
                <td className="px-4 py-4 text-right">₹{grandConstTarget.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">₹{grandConstAchieved.toFixed(2)}</td>
                <td className={`px-4 py-4 text-right ${grandConstVariance >= 0 ? 'text-nyati-success' : 'text-nyati-danger'}`}>
                  {grandConstVariance >= 0 ? '+' : ''}₹{grandConstVariance.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold w-10 text-right">{grandConstEff.toFixed(0)}%</span>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-nyati-navy rounded-full"
                        style={{ width: `${Math.min(100, grandConstEff)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
                <div className="text-xs text-slate-500 font-medium">
                  Showing flat-wise booking balance details corresponding to this aging duration:
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {drilldownData.flats.map((flat, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/30 hover:bg-slate-50 flex justify-between items-center text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-sm">{flat.flat}</span>
                        <div className="text-slate-400 font-medium flex items-center gap-1.5">
                          <span>Client: {flat.customer}</span>
                          <span>•</span>
                          <span className="text-nyati-orange font-bold">{flat.age} Days Old</span>
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
                  className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-bold text-xs transition-all duration-200"
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
