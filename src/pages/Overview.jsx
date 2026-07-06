import React from 'react';
import { useData } from '../context/DataContext';
import { calculateGrandTotals, getAgeingMetrics, cleanProjName, getQuarterFromMonth } from '../utils/dataHelpers';
import { useNavigate } from 'react-router-dom';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  LayoutDashboard, BarChart3, Layers,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  IndianRupee, ClipboardList, Maximize, CreditCard,
  ArrowRight, Activity, Landmark, Hammer,
  Zap, Clock, Target, Play, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis, ReferenceLine, LineChart, Line, CartesianGrid, AreaChart, Area, Legend, ComposedChart } from 'recharts';

// Reusable component for stacked vertical KPI strips
const OverviewMetricRow = ({ label, actual, budget, prefix = '', suffix = '', decimals = 0, status, icon: Icon, horizontal = false }) => {
  const isAchieved = status === 'On Target';
  const isProgressing = status === 'Progressing';
  
  if (horizontal) {
    return (
      <div className="flex items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50/80 rounded-xl border border-slate-200 transition-all duration-200">
        <div className="flex items-center justify-between w-full min-w-0 gap-4">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-4 h-4 text-slate-700 shrink-0" />}
            <span className="text-[14px] font-extrabold uppercase tracking-wider text-slate-800 select-none whitespace-nowrap">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-[#5996FF] whitespace-nowrap">
              {prefix}<AnimatedNumber value={actual} decimals={decimals} />{suffix}
            </span>
            {budget !== undefined && (
              <span className="text-[13px] text-slate-800 font-extrabold whitespace-nowrap select-none">
                Tgt: {prefix}{budget.toLocaleString('en-IN', { maximumFractionDigits: decimals })}{suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-1.5 px-3.5 bg-slate-50/50 hover:bg-slate-50/80 rounded-xl border border-slate-200 transition-all duration-200 gap-0.5">
      <div className="flex items-center justify-between min-w-0 gap-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-700 shrink-0" />}
          <span className="text-[14px] font-black uppercase tracking-wider text-slate-800 select-none whitespace-nowrap">
            {label}
          </span>
        </div>
        <span className="text-[17px] font-black text-[#5996FF] whitespace-nowrap">
          {prefix}<AnimatedNumber value={actual} decimals={decimals} />{suffix}
        </span>
      </div>
      {budget !== undefined && (
        <div className={Icon ? 'pl-6' : 'pl-0'} style={{ marginTop: '-2px' }}>
          <span className="text-[12px] text-slate-800 font-extrabold whitespace-nowrap select-none">
            Tgt: {prefix}{budget.toLocaleString('en-IN', { maximumFractionDigits: decimals })}{suffix}
          </span>
        </div>
      )}
    </div>
  );
};

// Reusable component for the donut charts in Outstanding section
const OverviewDonutChart = ({ data, centerValue, centerLabel }) => {
  return (
    <div className="relative w-full h-20 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={25}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-black text-slate-800 leading-none">
          {centerValue}
        </span>
        <span className="text-[5.5px] font-extrabold text-slate-600 uppercase tracking-wider leading-none mt-0.5">
          {centerLabel}
        </span>
      </div>
    </div>
  );
};

// A wrapper around ResponsiveContainer that delays rendering until layout stabilizes,
// preventing width-calculation bugs during browser mount and CSS animations.
const MountedResponsiveContainer = ({ children, ...props }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Delay of 100ms ensures Framer Motion or block-level reflows are complete
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full min-h-[192px] bg-slate-50/30 rounded-2xl animate-pulse" />;
  }

  return (
    <ResponsiveContainer {...props}>
      {children}
    </ResponsiveContainer>
  );
};

// Sales cumulative progress line graph displaying Units (Green) & Rate (Blue)
const SalesLineChart = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState('Unit'); // 'Unit' or 'Collection'

  const hideUnits = activeTab === 'Collection';
  const hideCollection = activeTab === 'Unit';

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Custom toggle button & chart legend */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-3 px-2">
        <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200/50 rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('Unit')}
            className={`${
              activeTab === 'Unit'
                ? 'bg-white text-nyati-navy font-bold shadow-sm'
                : 'text-slate-600 font-semibold hover:text-nyati-navy'
            } rounded-xl px-4 py-1.5 transition-all text-xs cursor-pointer`}
          >
            Unit
          </button>
          <button
            onClick={() => setActiveTab('Collection')}
            className={`${
              activeTab === 'Collection'
                ? 'bg-white text-nyati-navy font-bold shadow-sm'
                : 'text-slate-600 font-semibold hover:text-nyati-navy'
            } rounded-xl px-4 py-1.5 transition-all text-xs cursor-pointer`}
          >
            Collection
          </button>
        </div>

        {/* Color Legend indicator */}
        <div className="flex items-center gap-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100/50 px-3.5 py-1.5 rounded-2xl border border-slate-200/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block shadow-sm"></span>
            <span>Target</span>
          </div>
          <div className="h-3 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shadow-sm"></span>
            <span>Actual</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <MountedResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: hideCollection ? 15 : 30, left: hideUnits ? 30 : 15, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={45}
              tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }}
              tickFormatter={(val) => `${val}`}
              hide={hideUnits}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }}
              tickFormatter={(val) => `₹${val.toFixed(1)}`}
              hide={hideCollection}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const unitsActual = payload.find(p => p.dataKey === "UnitsActual")?.value;
                  const unitsTarget = payload.find(p => p.dataKey === "UnitsTarget")?.value;
                  const collectionActual = payload.find(p => p.dataKey === "CollectionActual")?.value;
                  const collectionTarget = payload.find(p => p.dataKey === "CollectionTarget")?.value;
                  
                  return (
                    <div className="bg-slate-900/95 text-white px-2.5 py-2 rounded-xl text-[10px] shadow-xl border border-slate-800 space-y-1 font-sans">
                      <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px]">{payload[0].payload.name}</p>
                      
                      {!hideUnits && (
                        <div className="space-y-0.5 pb-0.5">
                          <p className="font-extrabold text-[#10b981] tracking-wide text-[9px]">UNIT</p>
                          <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                            <span>Actual:</span>
                            <span className="font-black text-white">{unitsActual !== undefined && unitsActual !== null ? `${unitsActual} units` : '-'}</span>
                          </p>
                          <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                            <span>Target:</span>
                            <span className="font-black text-slate-300">{unitsTarget} units</span>
                          </p>
                        </div>
                      )}
                      
                      {!hideCollection && (
                        <div className="space-y-0.5 pt-0.5">
                          <p className="font-extrabold text-[#3b82f6] tracking-wide text-[9px]">COLLECTION</p>
                          <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                            <span>Actual:</span>
                            <span className="font-black text-white">{collectionActual !== undefined && collectionActual !== null ? `₹${collectionActual.toFixed(2)} Cr` : '-'}</span>
                          </p>
                          <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                            <span>Target:</span>
                            <span className="font-black text-slate-300">₹{collectionTarget.toFixed(2)} Cr</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Units Sold lines */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="UnitsTarget" 
              name="Units Target" 
              stroke="#3b82f6" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={{ r: 2 }} 
              activeDot={false}
              legendType="none"
              hide={hideUnits}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="UnitsActual" 
              name="Units Sold" 
              stroke="#10b981" 
              strokeWidth={2.5} 
              dot={{ r: 4, strokeWidth: 1, fill: '#ffffff', stroke: '#10b981' }} 
              activeDot={{ r: 5 }} 
              hide={hideUnits}
            />
            {/* Collection lines */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="CollectionTarget" 
              name="Collection Target" 
              stroke="#3b82f6" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={{ r: 2 }} 
              activeDot={false}
              legendType="none"
              hide={hideCollection}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="CollectionActual" 
              name="Total Collection" 
              stroke="#10b981" 
              strokeWidth={2.5} 
              dot={{ r: 4, strokeWidth: 1, fill: '#ffffff', stroke: '#10b981' }} 
              activeDot={{ r: 5 }} 
              connectNulls={false} 
              hide={hideCollection}
            />
          </LineChart>
        </MountedResponsiveContainer>
      </div>
    </div>
  );
};

// Outstanding line graph representing monthly trend of Total Outstanding
const OutstandingLineChart = ({ data }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="mb-2">
        <h4 className="font-extrabold text-nyati-navy text-sm">Outstanding</h4>
      </div>
      <div className="w-full flex-1 min-h-[220px]">
        <MountedResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="outstandingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={45}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} 
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }}
              tickFormatter={(val) => `₹${val.toFixed(0)}Cr`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-premium text-[11px]">
                      <p className="font-bold text-slate-800 mb-1">{label}</p>
                      <p className="font-semibold py-0.5 text-[#6366f1]">
                        Outstanding: ₹{val !== null && val !== undefined ? val.toFixed(2) : '-'} Cr
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="Outstanding" 
              name="Outstanding" 
              stroke="#6366f1" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#outstandingAreaGrad)" 
              dot={{ r: 3, strokeWidth: 1, fill: '#ffffff', stroke: '#6366f1' }}
              activeDot={{ r: 5 }} 
              connectNulls={false} 
            />
          </AreaChart>
        </MountedResponsiveContainer>
      </div>
    </div>
  );
};

// Collection line graph representing monthly trend of collection targets vs actuals
const CollectionLineChart = ({ data }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2 px-2">
        <h4 className="font-extrabold text-nyati-navy text-sm">Collection Trend (₹ Cr)</h4>
        {/* Color Legend indicator */}
        <div className="flex items-center gap-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100/50 px-3 py-1.5 rounded-2xl border border-slate-200/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] inline-block shadow-sm"></span>
            <span>Target</span>
          </div>
          <div className="h-2.5 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block shadow-sm"></span>
            <span>Actual</span>
          </div>
        </div>
      </div>
      <div className="w-full flex-1 min-h-[220px]">
        <MountedResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={45}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} 
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }}
              tickFormatter={(val) => `₹${val.toFixed(0)}Cr`}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const collectionActual = payload.find(p => p.dataKey === "CollectionActual")?.value;
                  const collectionTarget = payload.find(p => p.dataKey === "CollectionTarget")?.value;
                  return (
                    <div className="bg-slate-900/95 text-white px-2.5 py-2 rounded-xl text-[10px] shadow-xl border border-slate-800 space-y-1 font-sans">
                      <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px]">{payload[0].payload.name}</p>
                      <div className="space-y-0.5">
                        <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                          <span>Actual:</span>
                          <span className="font-black text-white">{collectionActual !== undefined && collectionActual !== null ? `₹${collectionActual.toFixed(2)} Cr` : '-'}</span>
                        </p>
                        <p className="font-bold flex items-center justify-between gap-4 text-slate-200">
                          <span>Target:</span>
                          <span className="font-black text-slate-300">₹{collectionTarget.toFixed(2)} Cr</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="CollectionTarget" 
              name="Collection Target" 
              stroke="#3b82f6" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={{ r: 2 }} 
              activeDot={false}
            />
            <Line 
              type="monotone" 
              dataKey="CollectionActual" 
              name="Total Collection" 
              stroke="#10b981" 
              strokeWidth={2.5} 
              dot={{ r: 4, strokeWidth: 1, fill: '#ffffff', stroke: '#10b981' }} 
              activeDot={{ r: 5 }} 
              connectNulls={false} 
            />
          </LineChart>
        </MountedResponsiveContainer>
      </div>
    </div>
  );
};

// Construction cumulative progress line chart (matching the styling in Construction Budget section)
const ConstructionLineChart = () => {
  const { filteredProjects, constructionMonthly } = useData();

  const months = React.useMemo(() => [
    'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26',
    'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
  ], []);

  const latestMonthWithActual = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.projects) return 'May-26';
    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      const hasActual = constructionMonthly.projects.some(p => {
        const val = p.actual?.[m];
        return val !== null && val !== undefined && val !== 0;
      });
      if (hasActual) return m;
    }
    return 'May-26';
  }, [constructionMonthly, months]);

  const chartData = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.months || filteredProjects.length === 0) return [];
    
    // Helper to clean project names
    const clean = name => name.trim().toLowerCase().replace(/\s+/g, ' ');
    const activeCleanNames = new Set(filteredProjects.map(p => clean(p.name)));
    const activeProjects = constructionMonthly.projects.filter(p => activeCleanNames.has(clean(p.name)));

    if (activeProjects.length === 0) return [];

    const data = [];
    let cumPlanned = 0;
    let cumActual = 0;
    const reportingIndex = months.indexOf(latestMonthWithActual);

    months.forEach((m, idx) => {
      const mPlan = activeProjects.reduce((sum, p) => sum + (p.planned?.[m] || 0), 0);
      const mAct = activeProjects.reduce((sum, p) => sum + (p.actual?.[m] || 0), 0);
      cumPlanned += mPlan;

      let actualValForChart = null;
      let cumActualValForChart = null;

      if (idx <= reportingIndex) {
        actualValForChart = mAct;
        cumActual += mAct;
        cumActualValForChart = cumActual;
      }

      data.push({
        name: m,
        Planned: parseFloat(mPlan.toFixed(2)),
        Actual: actualValForChart !== null ? parseFloat(actualValForChart.toFixed(2)) : null,
        "Cumulative Planned": parseFloat(cumPlanned.toFixed(2)),
        "Cumulative Actual": cumActualValForChart !== null ? parseFloat(cumActualValForChart.toFixed(2)) : null
      });
    });

    return data;
  }, [constructionMonthly, filteredProjects, latestMonthWithActual, months]);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="mb-2">
        <h4 className="font-extrabold text-nyati-navy text-sm">Cumulative Progress — Plan vs Actual (₹ Cr)</h4>
      </div>
      <div className="w-full flex-1 min-h-[220px]">
        <MountedResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={45}
              tick={{ fill: '#1e293b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#1e293b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-premium text-[11px]">
                      <p className="font-bold text-slate-800 mb-1">{label}</p>
                      {payload.map((p, idx) => (
                        <p key={idx} className="font-semibold py-0.5" style={{ color: p.color || p.stroke }}>
                          {p.name}: ₹{p.value !== null && p.value !== undefined ? p.value.toFixed(2) : '-'} Cr
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="rect" 
              iconSize={12} 
              formatter={(value) => <span className="text-[11px] font-bold text-slate-800">{value}</span>}
              payload={[
                { value: 'Cumulative Planned', type: 'rect', id: 'ID_Planned', color: '#3b82f6' },
                { value: 'Cumulative Actual', type: 'rect', id: 'ID_Actual', color: '#10b981' }
              ]}
            />
            <Line type="monotone" dataKey="Cumulative Planned" name="Cumulative Planned" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Cumulative Actual" name="Cumulative Actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} connectNulls={false} />
          </ComposedChart>
        </MountedResponsiveContainer>
      </div>
    </div>
  );
};

// Project Portfolio Pie chart — now shows project status breakdown (Newly Started / In Process / Nearing Completion)
const PortfolioPieChart = ({ activeProjects, newlyStarted, inProcess, nearingCompletion, totalInventory, totalUnsold, avgCompletion }) => {
  // Show project status breakdown in the pie chart
  const statusData = [
    { name: 'Newly Started', value: newlyStarted, display: `${newlyStarted} Projects`, fill: '#6366f1' },
    { name: 'In Process', value: inProcess, display: `${inProcess} Projects`, fill: '#f97316' },
    { name: 'Nearing Completion', value: nearingCompletion, display: `${nearingCompletion} Projects`, fill: '#14b8a6' },
  ];
  const data = statusData.filter(d => d.value > 0);
  // If no projects have status, fall back to showing activeProjects as a single segment
  if (data.length === 0 && activeProjects > 0) {
    data.push({ name: 'Active Projects', value: activeProjects, display: `${activeProjects} Projects`, fill: '#1f77b4' });
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={10} 
        fontWeight="black"
        className="font-sans select-none"
      >
        {percent > 0.03 ? `${(percent * 100).toFixed(1)}%` : ''}
      </text>
    );
  };

  return (
    <div className="w-full h-full relative">
      <MountedResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
          <Pie
            data={data}
            cx="48%"
            cy="50%"
            outerRadius="75%"
            dataKey="value"
            label={renderCustomizedLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const entry = payload[0].payload;
                return (
                  <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-slate-800 space-y-0.5">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider block">{entry.name}</span>
                    <span className="font-black text-[12px] text-white">{entry.display}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle" 
            iconType="square"
            iconSize={11}
            wrapperStyle={{ 
              fontSize: '14px', 
              fontWeight: 800, 
              color: '#1e293b',
              paddingLeft: '15px'
            }}
          />
        </PieChart>
      </MountedResponsiveContainer>
    </div>
  );
};

export default function Overview() {
  const { filteredProjects, portfolioKpiOverrides, updateFilters, constructionMonthly, rawData, filters } = useData();
  const navigate = useNavigate();

  const handleResetFilters = () => {
    updateFilters({
      selectedProjects: [],
      dateFrom: '',
      dateTo: '',
      selectedQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
      selectedType: 'All'
    });
  };
  const totals = calculateGrandTotals(filteredProjects);

  const ageingResult = React.useMemo(() => {
    return getAgeingMetrics(filteredProjects, rawData, filters);
  }, [filteredProjects, rawData, filters]);
  const ageingTotals = ageingResult.totals;

  // --- Sales & Collection derived ---
  const unitsEff = totals.budgetUnits > 0 ? (totals.soldToDate / totals.budgetUnits) * 100 : 0;
  const rateEff = totals.rateEff;
  const collectionEff = totals.collectionEff;
  const areaEff = totals.areaEff;

  // --- Outstanding & Cost derived ---
  const grandTotalOutstanding = ageingTotals.outstanding || 0;
  const grandTotalDueMilestone = ageingTotals.dueMilestone || 0;
  const grandTotalCollection = ageingTotals.actualCollection || 0;
  const grandAgeingGt120 = ageingTotals.ageing?.gt120 || 0;
  const grandTotalRegOS = ageingTotals.registeredOS || 0;
  const grandTotalUnregOS = ageingTotals.unregisteredOS || 0;
  const grandConstTarget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const grandConstAchieved = React.useMemo(() => {
    if (!constructionMonthly || !constructionMonthly.projects) return 0;
    const activeCleanNames = new Set(filteredProjects.map(p => cleanProjName(p.name)));
    const activeConstProjects = constructionMonthly.projects.filter(p => activeCleanNames.has(cleanProjName(p.name)));
    
    const months = constructionMonthly.months || [
      'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26',
      'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
    ];
    
    // Get active months based on filters (matching the helper in ConstructionBudget)
    let activeMs = months;
    if (filters) {
      const startLimit = filters.dateFrom ? new Date(filters.dateFrom) : new Date('2000-01-01');
      const endLimit = filters.dateTo ? new Date(filters.dateTo) : new Date('2099-12-31');
      const monthsMap = {
        'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8,
        'Oct': 9, 'Nov': 10, 'Dec': 11, 'Jan': 0, 'Feb': 1, 'Mar': 2
      };
      activeMs = months.filter(mStr => {
        const [mon, yrStr] = mStr.split('-');
        const yr = 2000 + parseInt(yrStr, 10);
        const monthIdx = monthsMap[mon];
        const monthStart = new Date(yr, monthIdx, 1);
        const monthEnd = new Date(yr, monthIdx + 1, 0, 23, 59, 59, 999);
        const inDateRange = monthStart <= endLimit && monthEnd >= startLimit;
        if (!inDateRange) return false;
        if (filters.selectedQuarters && filters.selectedQuarters.length > 0) {
          const q = getQuarterFromMonth(mStr);
          if (q && !filters.selectedQuarters.includes(q)) return false;
        }
        return true;
      });
      if (activeMs.length === 0) activeMs = months;
    }
    
    let sum = 0;
    activeConstProjects.forEach(p => {
      activeMs.forEach(m => {
        sum += p.actual[m] || 0;
      });
    });
    return sum;
  }, [constructionMonthly, filteredProjects, filters]);
  const constEff = grandConstTarget > 0 ? (grandConstAchieved / grandConstTarget) * 100 : 0;

  // --- Portfolio derived ---
  const totalInventory = filteredProjects.reduce((s, p) => s + p.totalUnits, 0);
  const totalSold = filteredProjects.reduce((s, p) => s + p.soldToDate, 0);
  const totalUnsold = totalInventory - totalSold;
  const avgCompletion = filteredProjects.length > 0
    ? filteredProjects.reduce((s, p) => s + (p.construction.completion || 0), 0) / filteredProjects.length
    : 0;

  // --- Project status breakdown ---
  // Compute from spreadsheet status column labels
  const newlyStartedCount_computed  = filteredProjects.filter(p => p.status && p.status.trim().toLowerCase() === 'new').length;
  const inProcessCount_computed     = filteredProjects.filter(p => p.status && (p.status.trim().toLowerCase() === 'on going' || p.status.trim().toLowerCase() === 'ongoing')).length;
  const nearingCompletionCount_computed = filteredProjects.filter(p => p.status && (p.status.trim().toLowerCase() === 'near completion' || p.status.trim().toLowerCase() === 'near complection')).length;

  // If the uploaded Excel "Overview" sheet has explicit values, prefer those (they reflect what the user entered)
  const inProcessCount        = portfolioKpiOverrides?.inProcess        != null ? portfolioKpiOverrides.inProcess        : inProcessCount_computed;
  const nearingCompletionCount = portfolioKpiOverrides?.nearingCompletion != null ? portfolioKpiOverrides.nearingCompletion : nearingCompletionCount_computed;
  const newlyStartedCount     = portfolioKpiOverrides?.newlyStarted      != null ? portfolioKpiOverrides.newlyStarted      : newlyStartedCount_computed;
  // Active Projects: sum of active statuses (Ongoing + New + Near Completion) if no override
  const activeProjectsCount   = portfolioKpiOverrides?.activeProjects     != null ? portfolioKpiOverrides.activeProjects     : (inProcessCount + nearingCompletionCount + newlyStartedCount);

  // --- Sales Cumulative chart data ---
  const months = React.useMemo(() => [
    'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 'Aug-26', 'Sep-26',
    'Oct-26', 'Nov-26', 'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
  ], []);

  const latestMonthWithActual = React.useMemo(() => {
    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      const hasActual = filteredProjects.some(p => {
        const val = p.monthlyData?.[m]?.salesValueActual;
        return val !== null && val !== undefined && val !== 0;
      });
      if (hasActual) return m;
    }
    return 'May-26';
  }, [filteredProjects, months]);

  const salesLineChartData = React.useMemo(() => {
    const data = [];
    const reportingIndex = months.indexOf(latestMonthWithActual);

    // Helper: clamp unit values — units should be small integers (< 10,000 per month
    // across all projects). Values >= 10,000 indicate a rupee amount got misclassified.
    const safeUnits = (val) => (val > 0 && val < 10000 ? val : 0);

    months.forEach((m, idx) => {
      // Target/Planned units sold in that month
      const mUnitsTarget = filteredProjects.reduce(
        (sum, p) => sum + safeUnits(p.monthlyData?.[m]?.unitsTarget || 0), 0
      );
      // Actual units sold in that month
      const mUnitsActual = filteredProjects.reduce(
        (sum, p) => sum + safeUnits(p.monthlyData?.[m]?.unitsActual || 0), 0
      );

      // Target/Planned collection in that month (in Rupees) → convert to Cr
      const mCollectionTarget = filteredProjects.reduce(
        (sum, p) => sum + (p.monthlyData?.[m]?.collectionTarget || 0), 0
      );
      // Actual collection in that month (in Rupees) → convert to Cr
      const mCollectionActual = filteredProjects.reduce(
        (sum, p) => sum + (p.monthlyData?.[m]?.collectionActual || 0), 0
      );

      data.push({
        name: m,
        UnitsTarget: mUnitsTarget,
        UnitsActual: idx <= reportingIndex ? mUnitsActual : null,
        CollectionTarget: mCollectionTarget / 10000000,
        CollectionActual: idx <= reportingIndex ? (mCollectionActual / 10000000) : null,
      });
    });

    return data;
  }, [filteredProjects, latestMonthWithActual, months]);

  const outstandingLineChartData = React.useMemo(() => {
    const data = [];
    const reportingIndex = months.indexOf(latestMonthWithActual);
    let cumSalesActual = 0;
    let cumCollectionActual = 0;

    months.forEach((m, idx) => {
      const mSalesActual = filteredProjects.reduce((sum, p) => sum + (p.monthlyData?.[m]?.salesValueActual || 0), 0) / 10000000;
      const mCollectionActual = filteredProjects.reduce((sum, p) => sum + (p.monthlyData?.[m]?.collectionActual || 0), 0) / 10000000;

      cumSalesActual += mSalesActual;
      cumCollectionActual += mCollectionActual;

      const cumDueMilestone = cumSalesActual * 0.85;
      const cumOutstanding = cumDueMilestone - cumCollectionActual;

      data.push({
        name: m,
        Outstanding: idx <= reportingIndex ? parseFloat(cumOutstanding.toFixed(2)) : null
      });
    });

    return data;
  }, [filteredProjects, latestMonthWithActual, months]);

  const getEffColor = (eff) => {
    if (eff >= 100) return 'text-emerald-600';
    if (eff >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getEffBg = (eff) => {
    if (eff >= 100) return 'bg-emerald-500';
    if (eff >= 50) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const getEffBadge = (eff) => {
    if (eff >= 100) return { text: 'On Target', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (eff >= 50) return { text: 'Progressing', cls: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { text: 'Critical', cls: 'bg-red-50 text-red-700 border-red-100' };
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex flex-col h-[calc(100vh-110px)] gap-4 pb-4 overflow-hidden select-none"
    >

      {/* Page Title */}
      <motion.div variants={item} className="flex-shrink-0 flex items-center justify-between">
        <h2 className="text-3xl font-black text-nyati-navy">OVERVIEW</h2>
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-nyati-orange py-2 px-3 hover:bg-nyati-orange/5 rounded-xl transition-all duration-200 border border-transparent hover:border-nyati-orange/10 focus:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          Reset Filters
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">

        {/* ── SECTION 1: SALES & COLLECTION ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-nyati-orange/10 rounded-xl">
                <LayoutDashboard className="w-4 h-4 text-nyati-orange" />
              </div>
              <div>
                <h3 className="font-extrabold text-nyati-navy text-lg">SALES</h3>
                <p className="text-slate-700 text-sm font-semibold mt-0.5">FY Actuals vs Targets</p>
              </div>
            </div>

          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[340px] xl:w-[390px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Units Sold" 
                actual={totals.soldToDate} 
                budget={totals.budgetUnits} 
                decimals={0} 
                status={unitsEff >= 100 ? 'On Target' : unitsEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={ClipboardList} 
              />
              <OverviewMetricRow 
                label="Avg Rate" 
                actual={totals.actualRate} 
                budget={totals.budgetRate} 
                prefix="₹" 
                suffix="/sf" 
                decimals={0} 
                status={rateEff >= 100 ? 'On Target' : rateEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={IndianRupee} 
              />
              <OverviewMetricRow 
                label="Saleable Area" 
                actual={totals.actualArea} 
                budget={totals.budgetArea} 
                suffix=" sf" 
                decimals={0} 
                status={areaEff >= 100 ? 'On Target' : areaEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={Maximize} 
              />
              <OverviewMetricRow 
                label="Total Collection" 
                actual={totals.actualCollection} 
                budget={totals.budgetCollection} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                status={collectionEff >= 100 ? 'On Target' : collectionEff >= 70 ? 'Progressing' : 'Critical'} 
                icon={CreditCard} 
              />
            </div>

            {/* Right Side: Sales Line Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <SalesLineChart data={salesLineChartData} />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 2: OUTSTANDING ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-sky-500/10 rounded-xl">
                <BarChart3 className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-nyati-navy text-lg">Outstanding & Collection</h3>
                <p className="text-slate-700 text-sm font-semibold mt-0.5">Consolidated dues, collections, and ageing matrix</p>
              </div>
            </div>

          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[340px] xl:w-[390px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Total Outstanding" 
                actual={grandTotalOutstanding} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={Landmark} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Total Collection" 
                actual={grandTotalCollection} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={CreditCard} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Registered O/S" 
                actual={grandTotalRegOS} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={Activity} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Ageing >120 Days" 
                actual={grandAgeingGt120} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={AlertTriangle} 
                horizontal={true}
              />
            </div>

            {/* Right Side: Collection Line Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <CollectionLineChart data={salesLineChartData} />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 3: CONSTRUCTION BUDGET ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-nyati-orange/10 rounded-xl">
                <Hammer className="w-4 h-4 text-nyati-orange" />
              </div>
              <div>
                <h3 className="font-extrabold text-nyati-navy text-lg">Construction Budget</h3>
                <p className="text-slate-700 text-sm font-semibold mt-0.5">Target planned vs achieved construction costs and progress</p>
              </div>
            </div>

          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of 4 metric rows */}
            <div className="w-full md:w-[340px] xl:w-[390px] flex-shrink-0 flex flex-col gap-1.5 justify-center">
              <OverviewMetricRow 
                label="Target Planned" 
                actual={grandConstTarget} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={ClipboardList} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Achieved Value" 
                actual={grandConstAchieved} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={Landmark} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Variance" 
                actual={Math.abs(grandConstTarget - grandConstAchieved)} 
                prefix="₹" 
                suffix=" Cr" 
                decimals={2} 
                icon={TrendingDown} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Efficiency" 
                actual={constEff} 
                suffix="%" 
                decimals={1} 
                icon={Hammer} 
                horizontal={true}
              />
            </div>

            {/* Right Side: Construction Cumulative Line Chart */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <ConstructionLineChart />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 4: PROJECT PORTFOLIO ────────────────────────── */}
        <motion.div 
          variants={item}
          className="bg-white rounded-3xl shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-gradient-to-r from-nyati-navy/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-xl">
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-nyati-navy text-lg">Project Portfolio</h3>
                <p className="text-slate-700 text-sm font-semibold mt-0.5">Inventory funnel & construction completion</p>
              </div>
            </div>

          </div>

          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 gap-4 min-h-0 items-center justify-between">
            {/* Left Side: Stacking list of metric rows — core KPIs + status breakdown */}
            <div className="w-full md:w-[340px] xl:w-[390px] flex-shrink-0 flex flex-col gap-1 justify-center">
              {/* Core KPIs */}
              <OverviewMetricRow 
                label="Active Projects" 
                actual={activeProjectsCount} 
                decimals={0} 
                icon={Activity} 
                horizontal={true}
              />
              {/* Project Status Breakdown */}
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 pt-0.5 select-none"></p>
              <OverviewMetricRow 
                label="In Process" 
                actual={inProcessCount} 
                suffix=" projects" 
                decimals={0} 
                icon={Clock} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Nearing Completion" 
                actual={nearingCompletionCount} 
                suffix=" projects" 
                decimals={0} 
                icon={Target} 
                horizontal={true}
              />
              <OverviewMetricRow 
                label="Newly Started" 
                actual={newlyStartedCount} 
                suffix=" projects" 
                decimals={0} 
                icon={Play} 
                horizontal={true}
              />
            </div>

            {/* Right Side: Portfolio Pie Chart — project status breakdown */}
            <div className="flex-1 w-full h-full min-h-0 md:pl-4">
              <PortfolioPieChart 
                activeProjects={activeProjectsCount} 
                newlyStarted={newlyStartedCount}
                inProcess={inProcessCount}
                nearingCompletion={nearingCompletionCount}
                totalInventory={totalInventory} 
                totalUnsold={totalUnsold} 
                avgCompletion={avgCompletion} 
              />
            </div>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}