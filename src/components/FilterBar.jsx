import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ChevronDown, Filter, Calendar, Check, Search, RotateCcw } from 'lucide-react';

export default function FilterBar() {
  const { projectList, filters, updateFilters } = useData();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter project names based on search query
  const filteredProjectNames = projectList.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle single project selection
  const handleToggleProject = (name) => {
    const isSelected = filters.selectedProjects.includes(name);
    let newSelection = [];
    if (isSelected) {
      newSelection = filters.selectedProjects.filter(p => p !== name);
    } else {
      newSelection = [...filters.selectedProjects, name];
    }
    updateFilters({ selectedProjects: newSelection });
  };

  // Toggle quarter selection
  const handleToggleQuarter = (q) => {
    const isSelected = filters.selectedQuarters.includes(q);
    let newSelection = [];
    if (isSelected) {
      // Don't allow empty selection
      if (filters.selectedQuarters.length > 1) {
        newSelection = filters.selectedQuarters.filter(quarter => quarter !== q);
      } else {
        newSelection = ['Q1', 'Q2', 'Q3', 'Q4'];
      }
    } else {
      newSelection = [...filters.selectedQuarters, q].sort();
    }
    updateFilters({ selectedQuarters: newSelection });
  };

  // Reset all filters
  const handleResetFilters = () => {
    updateFilters({
      selectedProjects: [],
      dateFrom: '',
      dateTo: '',
      selectedQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
      selectedType: 'All'
    });
    setSearchQuery('');
  };

  return (
    <div className="bg-white border-b border-slate-100 px-6 py-3 sticky top-[73px] z-20 shadow-sm flex flex-wrap gap-4 items-center justify-between">
      
      {/* Filters Form Container */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        
        {/* Project Multi-Select Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-xl font-medium transition-all duration-200 focus:outline-none ${
              filters.selectedProjects.length > 0
                ? 'border-nyati-orange bg-nyati-orange/5 text-nyati-orange'
                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {filters.selectedProjects.length === 0
                ? 'All Projects'
                : filters.selectedProjects.length === 1
                ? filters.selectedProjects[0]
                : `${filters.selectedProjects.length} Projects selected`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Project List Popover */}
          {projectDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2.5">
              {/* Search Box */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-nyati-navy"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-2 px-1 pb-2 border-b border-slate-50 text-[10px]">
                <button
                  onClick={() => updateFilters({ selectedProjects: [] })}
                  className="font-bold text-slate-400 hover:text-nyati-navy"
                >
                  Clear All
                </button>
                <button
                  onClick={() => updateFilters({ selectedProjects: [...projectList] })}
                  className="font-bold text-nyati-orange"
                >
                  Select All
                </button>
              </div>

              {/* Checklist Items */}
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredProjectNames.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-[11px]">No projects found</div>
                ) : (
                  filteredProjectNames.map((name) => {
                    const isSelected = filters.selectedProjects.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => handleToggleProject(name)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors ${
                          isSelected ? 'font-semibold text-nyati-navy bg-nyati-navy/5' : 'text-slate-600'
                        }`}
                      >
                        <span className="truncate">{name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-nyati-navy shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date Ranges */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
              className="bg-transparent border-0 py-1 text-slate-600 focus:ring-0 focus:outline-none w-28 text-[11px]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
              className="bg-transparent border-0 py-1 text-slate-600 focus:ring-0 focus:outline-none w-28 text-[11px]"
            />
          </div>
        </div>

        {/* FY Quarter Tabs */}
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
            const isSelected = filters.selectedQuarters.includes(q);
            return (
              <button
                key={q}
                onClick={() => handleToggleQuarter(q)}
                className={`px-3.5 py-2 font-semibold border-r border-slate-100 last:border-r-0 transition-all duration-200 ${
                  isSelected
                    ? 'bg-nyati-navy text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Type pills (All, Residential, Luxury, Commercial) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { label: 'All', value: 'All' },
            { label: 'Residential', value: 'R' },
            { label: 'Luxury', value: 'L' },
            { label: 'Commercial', value: 'C' }
          ].map((item) => {
            const isSelected = filters.selectedType === item.value;
            return (
              <button
                key={item.value}
                onClick={() => updateFilters({ selectedType: item.value })}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-white text-nyati-orange shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Reset Button */}
      <button
        onClick={handleResetFilters}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-nyati-orange py-2 px-3 hover:bg-nyati-orange/5 rounded-xl transition-all duration-200 border border-transparent hover:border-nyati-orange/10 focus:outline-none"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Filters
      </button>

    </div>
  );
}
