import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowUpDown, ArrowRight, Home, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectTable() {
  const { filteredProjects, setActiveProjectName } = useData();
  const navigate = useNavigate();

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

  // Sort logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Handle string fields
    if (typeof valA === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    // Default numeric sort
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const handleRowClick = (projName) => {
    setActiveProjectName(projName);
    navigate('/portfolio');
  };

  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">

      {/* Table Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 bg-white rounded-t-3xl shadow-sm">
        <div>
          <h3 className="font-bold text-nyati-navy text-lg">Project-Wise Sales Summary</h3>
          <p className="text-slate-400 text-xs mt-0.5">Click headers to sort. Hover on rows and click to view portfolio breakdowns.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-1.5">
          Showing <span className="text-nyati-navy font-bold">{filteredProjects.length}</span> active projects
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="lg:overflow-x-visible overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 select-none sticky top-[85px] z-10 shadow-sm">
              <th onClick={() => requestSort('name')} className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[200px]">
                <div className="flex items-center gap-1.5">
                  Project Name
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('budgetUnits')} className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-center gap-1.5">
                  Budget Units
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('soldToDate')} className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-center gap-1.5">
                  Actual Units
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('varianceUnits')} className="px-4 py-4 text-center cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-center gap-1.5">
                  Variance
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('salesEff')} className="px-4 py-4 text-left cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  EFF %
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('actualValCr')} className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-end gap-1.5">
                  Agg Amount
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('actualArea')} className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-end gap-1.5">
                  Agg Area (sq.ft)
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
              <th onClick={() => requestSort('actualRate')} className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/50 hover:text-nyati-navy transition-colors">
                <div className="flex items-center justify-end gap-1.5">
                  Cum Value
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
            {sortedProjects.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300" />
                    <span>No projects matching active filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedProjects.map((p, index) => {
                const variance = p.soldToDate - p.budgetUnits; // actual - budget

                return (
                  <motion.tr
                    key={p.name}
                    onClick={() => handleRowClick(p.name)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-sky-50/40 cursor-pointer group transition-all duration-150 select-none"
                  >
                    {/* Project Name & Category Tag */}
                    <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-nyati-navy flex items-center justify-between min-w-[200px]">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="truncate">{p.name}</span>
                        {renderTypeBadge(p.type)}
                      </div>
                      <ArrowRight className="w-4 h-4 text-nyati-orange opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0 ml-2" />
                    </td>

                    {/* Budget Units */}
                    <td className="px-4 py-4 text-center font-semibold text-slate-500">
                      {p.budgetUnits.toLocaleString('en-IN')}
                    </td>

                    {/* Actual Units */}
                    <td className="px-4 py-4 text-center font-bold text-nyati-navy">
                      {p.soldToDate.toLocaleString('en-IN')}
                    </td>

                    {/* Variance (Actual - Budget) */}
                    <td className={`px-4 py-4 text-center font-semibold ${variance < 0 ? 'text-nyati-danger' : 'text-nyati-success'}`}>
                      {variance > 0 ? '+' : ''}{variance.toLocaleString('en-IN')}
                    </td>

                    {/* Efficiency Progress mini-bar */}
                    <td className="px-4 py-4 text-left min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={p.salesEff >= 100 ? 'text-nyati-success' : p.salesEff >= 50 ? 'text-nyati-warning' : 'text-nyati-danger'}>
                            {p.salesEff.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.salesEff >= 100 ? 'bg-nyati-success' : p.salesEff >= 50 ? 'bg-nyati-warning' : 'bg-nyati-danger'}`}
                            style={{ width: `${Math.min(100, p.salesEff)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Agg Amount (₹ Cr) */}
                    <td className="px-4 py-4 text-right font-bold text-slate-700">
                      ₹{p.actualValCr.toFixed(2)} Cr
                    </td>

                    {/* Agg Area (sq.ft) */}
                    <td className="px-4 py-4 text-right font-semibold text-slate-500">
                      {Math.round(p.actualArea).toLocaleString('en-IN')}
                    </td>

                    {/* Cum Value (₹/sq.ft) */}
                    <td className="px-6 py-4 text-right font-extrabold text-nyati-navy">
                      ₹{Math.round(p.actualRate).toLocaleString('en-IN')}/sf
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}
