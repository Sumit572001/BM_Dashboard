import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { LayoutDashboard, FileSpreadsheet, Layers, BarChart3, UploadCloud, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { fileName, resetData } = useData();

  const links = [
    { name: 'Sales & Collection', path: '/', icon: LayoutDashboard },
    { name: 'Outstanding & Cost', path: '/outstanding', icon: BarChart3 },
    { name: 'Project Portfolio', path: '/portfolio', icon: Layers },
  ];

  const sidebarVariants = {
    open: { x: 0, width: '260px' },
    closed: { x: -300, width: '0px' },
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-nyati-navy text-white flex flex-col justify-between transition-all duration-300 shadow-2xl lg:shadow-none w-[260px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-nyati-navy font-black text-xl rounded-xl flex items-center justify-center border-b-4 border-nyati-orange">
                N
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-wider block">NYATI GROUP</span>
                <span className="text-[10px] text-slate-300 font-semibold tracking-widest block uppercase">MIS Dashboard</span>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-white/10 text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          {fileName && (
            <nav className="p-4 space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={({ isActive }) => `
                      flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-nyati-orange text-white shadow-md' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{link.name}</span>
                    
                    {/* Hover indicator animation */}
                    <motion.div 
                      className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"
                      initial={{ scaleY: 0 }}
                      whileHover={{ scaleY: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* Footer info & File details */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          {fileName ? (
            <div className="space-y-3">
              <div className="flex flex-col text-xs text-slate-400 gap-0.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Active Database</span>
                <span className="text-white truncate font-medium text-xs flex items-center gap-1.5 mt-0.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-nyati-orange shrink-0" />
                  {fileName}
                </span>
              </div>
              
              <button
                onClick={() => {
                  resetData();
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/20 hover:border-nyati-orange hover:bg-nyati-orange text-white transition-all duration-200 text-xs font-bold"
              >
                <UploadCloud className="w-4 h-4" />
                Upload New Report
              </button>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-400 font-medium">
              Awaiting CSV/Excel upload
            </div>
          )}
          
          <div className="text-[10px] text-slate-500 mt-4 text-center">
            Nyati MIS © {new Date().getFullYear()}
          </div>
        </div>
      </aside>
    </>
  );
}
