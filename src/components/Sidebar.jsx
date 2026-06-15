import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { LayoutDashboard, FileSpreadsheet, Layers, BarChart3, UploadCloud, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isOpen, toggleSidebar, onHoverChange }) {
  const { fileName, resetData } = useData();
  const [hovered, setHovered] = useState(false);

  const links = [
    { name: 'Overview', path: '/overview', icon: Home },
    { name: 'Sales & Collection', path: '/', icon: LayoutDashboard },
    { name: 'Outstanding & Cost', path: '/outstanding', icon: BarChart3 },
    { name: 'Project Portfolio', path: '/portfolio', icon: Layers },
  ];

  const expanded = hovered;

  const handleMouseEnter = () => {
    setHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    onHoverChange?.(false);
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
      <motion.aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ width: expanded ? 220 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 bg-nyati-navy text-white flex flex-col justify-between shadow-2xl lg:shadow-none overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Logo Section */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between min-h-[72px]">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* N Badge — always visible */}
              <div className="w-10 h-10 bg-white text-nyati-navy font-black text-xl rounded-xl flex items-center justify-center border-b-4 border-nyati-orange shrink-0">
                N
              </div>

              {/* Text — only visible when expanded */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    className="leading-tight whitespace-nowrap overflow-hidden"
                  >
                    <span className="font-extrabold text-sm tracking-wider block">NYATI GROUP</span>
                    <span className="text-[10px] text-slate-300 font-semibold tracking-widest block uppercase">MIS Dashboard</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-white/10 text-white lg:hidden shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          {fileName && (
            <nav className="p-2 space-y-1 mt-1">
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
                      flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-colors duration-150 group relative overflow-hidden
                      ${isActive
                        ? 'bg-nyati-orange text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {/* Icon — always visible, centered when collapsed */}
                    <Icon className="w-5 h-5 shrink-0" />

                    {/* Label — only visible when expanded */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.15 }}
                          className="truncate whitespace-nowrap"
                        >
                          {link.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* Footer info & File details */}
        <div className="p-2 border-t border-white/10 bg-black/10">
          {fileName ? (
            <div className="space-y-2">
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col text-xs text-slate-400 gap-0.5 px-1"
                  >
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Active Database</span>
                    <span className="text-white truncate font-medium text-xs flex items-center gap-1.5 mt-0.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-nyati-orange shrink-0" />
                      {fileName}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => {
                  resetData();
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border border-white/20 hover:border-nyati-orange hover:bg-nyati-orange text-white transition-all duration-200 text-xs font-bold overflow-hidden"
                title="Upload New Report"
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Upload New Report
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-2 text-xs text-slate-400 font-medium"
                >
                  Awaiting CSV/Excel upload
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-slate-500 mt-3 text-center"
              >
                Nyati MIS © {new Date().getFullYear()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}
