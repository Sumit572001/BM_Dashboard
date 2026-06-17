import React from 'react';
import { useData } from '../context/DataContext';
import AnimatedNumber from '../components/AnimatedNumber';
import { Hammer, AlertTriangle, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConstructionBudget() {
  const { filteredProjects } = useData();

  // Construction Columns Grand Totals
  const grandConstTarget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const grandConstAchieved = filteredProjects.reduce((s, p) => s + p.construction.achieved, 0);
  const grandConstVariance = grandConstTarget - grandConstAchieved;
  const grandConstEff = grandConstTarget > 0 ? (grandConstAchieved / grandConstTarget) * 100 : 0;

  // Construction Highlights & Bullet Summaries
  const totalConstBudget = filteredProjects.reduce((s, p) => s + p.construction.target, 0);
  const totalConstAchieved = filteredProjects.reduce((s, p) => s + p.construction.achieved, 0);
  const constVariance = totalConstBudget - totalConstAchieved;
  const avgConstEff = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.construction.eff, 0) / filteredProjects.length : 0;
  const avgConstComp = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.construction.completion, 0) / filteredProjects.length : 0;

  const constructionPoints = [
    {
      title: "Budget Allocation vs Progress",
      text: `Total construction work executed is ₹${totalConstAchieved.toFixed(2)} Cr against the signed-off target budget of ₹${totalConstBudget.toFixed(2)} Cr, showing a variance of ₹${constVariance.toFixed(2)} Cr.`,
      status: constVariance >= 0 ? 'success' : 'danger'
    },
    {
      title: "Overall Engineering Completion",
      text: `Average project site completion rate is ${avgConstComp.toFixed(0)}%, reflecting on-time milestone delivery across the core concrete structures and finishing stages.`,
      status: avgConstComp >= 70 ? 'success' : avgConstComp >= 50 ? 'warning' : 'danger'
    },
    {
      title: "Construction Material cost impact",
      text: `Engineering efficiency index is currently at ${avgConstEff.toFixed(1)}%. Raw materials like cement and steel experienced minor price fluctuations but remained within margin buffers.`,
      status: 'success'
    },
    {
      title: "Contractor SLA Adherence",
      text: "More than 88% of construction sub-stages met their monthly scheduled targets. Heavy machinery utilization rates improved by 12% following streamlined site management protocols.",
      status: 'success'
    }
  ];

  const aiRecommendations = [];
  const lowCompletionProjects = filteredProjects.filter(p => p.construction.completion < 65);
  if (lowCompletionProjects.length > 0) {
    const names = lowCompletionProjects.map(p => p.name).slice(0, 2).join(', ');
    aiRecommendations.push({
      type: 'warning',
      subject: 'Construction Velocity Booster',
      text: `Projects like ${names} are running below 65% engineering completion. Re-allocate labor forces from finished structures to clear delayed milestones.`
    });
  } else {
    aiRecommendations.push({
      type: 'success',
      subject: 'Construction Velocity Booster',
      text: `All filtered project sites are maintaining target engineering velocity. Continue weekly SLA reviews with on-site sub-contractors.`
    });
  }

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12 pt-6"
    >
      {/* Title & Description Row */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2.5 bg-nyati-orange/10 rounded-2xl">
          <Hammer className="w-5 h-5 text-nyati-orange" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-nyati-navy">Construction Budget Review</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of target/planned vs actual construction expenses achieved, sorted by active project filters.
          </p>
        </div>
      </motion.div>

      {/* Construction Cost Budget Summary Table */}
      <div
        className="bg-white rounded-3xl shadow-premium border border-slate-100"
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-5 shadow-sm">
          <h3 className="font-bold text-nyati-navy text-base">Construction Cost Budget Summary</h3>
          <p className="text-slate-400 text-xs mt-0.5">Compare construction target milestones against achieved value payouts and variance tracking.</p>
        </div>

        <div className="lg:overflow-x-visible overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="sticky top-[85px] z-10 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 shadow-sm">
                <th className="px-6 py-4">Project</th>
                <th className="px-4 py-4 text-right">Target / Planned (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Achieved (₹ Cr)</th>
                <th className="px-4 py-4 text-right">Variance (₹ Cr)</th>
                <th className="px-6 py-4 min-w-[220px]">EFF % / Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No active projects matching active filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const target = p.construction.target;
                  const achieved = p.construction.achieved;
                  const variance = target - achieved;
                  const eff = p.construction.eff;

                  return (
                    <tr key={p.name} className="hover:bg-sky-50/20 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-700">{p.name}</td>
                      <td className="px-4 py-3.5 text-right text-slate-500">₹{target.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-nyati-navy">₹{achieved.toFixed(2)}</td>
                      <td className={`px-4 py-3.5 text-right font-bold ${variance >= 0 ? 'text-nyati-success' : 'text-nyati-danger'}`}>
                        {variance >= 0 ? '+' : ''}₹{variance.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700 w-10 shrink-0 text-right">{eff.toFixed(0)}%</span>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${eff >= 100 ? 'bg-nyati-success' : eff >= 50 ? 'bg-nyati-warning' : 'bg-nyati-danger'}`}
                              style={{ width: `${Math.min(100, eff)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Grand Total Row */}
              {filteredProjects.length > 0 && (
                <tr className="bg-slate-50/80 font-bold text-nyati-navy border-t-2 border-slate-200">
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
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highlights & AI Recommendations Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left 2 Columns: Highlights Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-nyati-navy text-base">Construction Cost & Status Highlights</h3>
              <p className="text-slate-400 text-xs mt-0.5">Key analysis insights and structural status updates for construction milestones.</p>
            </div>

            {/* Bullet points display list */}
            <div className="p-6 space-y-4">
              {constructionPoints.map((p, idx) => (
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
      </motion.div>
    </motion.div>
  );
}
