import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Settings, Bot, User, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { calculateGrandTotals } from '../utils/dataHelpers';

const agentTools = [
  {
    functionDeclarations: [
      {
        name: 'updateFilters',
        description: 'Updates the filters on the dashboard based on the user request. Use this tool when the user wants to filter by a specific project name, project type, or quarters.',
        parameters: {
          type: 'OBJECT',
          properties: {
            selectedType: {
              type: 'STRING',
              enum: ['All', 'R', 'L', 'C'],
              description: "Filter by project type: 'All' for all, 'R' for Residential, 'L' for Luxe, or 'C' for Commercial."
            },
            selectedProjects: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Array of specific project names to select.'
            },
            selectedQuarters: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Array of quarters to select, e.g. ["Q1", "Q2"].'
            }
          }
        }
      },
      {
        name: 'setActiveProject',
        description: 'Sets a single project as active. Call this when the user asks for details or breakdown of a specific project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectName: {
              type: 'STRING',
              description: 'The exact name of the project.'
            }
          },
          required: ['projectName']
        }
      },
      {
        name: 'navigateToPage',
        description: 'Navigates the user to a different page/tab in the dashboard application.',
        parameters: {
          type: 'OBJECT',
          properties: {
            pageName: {
              type: 'STRING',
              enum: ['/', '/sales-collection', '/outstanding', '/construction-budget', '/portfolio'],
              description: "The path of the page to navigate to: '/' for Overview, '/sales-collection' for Sales & Collection, '/outstanding' for Outstanding, '/construction-budget' for Construction Budget, or '/portfolio' for Project Portfolio/Details."
            }
          },
          required: ['pageName']
        }
      },
      {
        name: 'resetAllFilters',
        description: 'Resets all filters to their default values (all projects, all types, default quarter).'
      }
    ]
  }
];

export default function AIFloatingAgent() {
  const { filteredProjects, filters, portfolioKpiOverrides, constructionMonthly, updateFilters, setActiveProjectName, resetData } = useData();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am Enzo, your AI Co-pilot. I analyze your dashboard data in real-time. Ask me anything about the project sales, rates, variance, or collections!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiError, setApiError] = useState('');
  const messagesEndRef = useRef(null);

  // Load API key from localStorage or Vite environment variables on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    setApiKey(savedKey || envKey);
  }, []);

  // Scroll to bottom of chat whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key.trim());
    setApiKey(key.trim());
    setShowSettings(false);
    setApiError('');
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. How can I help you analyze the dashboard data now?'
      }
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!apiKey) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: '⚠️ Please set your Gemini API key first by clicking the settings gear in the top header.' }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);
    setApiError('');

    try {
      // Calculate totals to provide rich summary overview metrics to the model prompt
      const grandTotals = calculateGrandTotals(filteredProjects);
      
      const dashboardStateSummary = {
        filters: {
          selectedProjects: filters.selectedProjects,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          selectedQuarters: filters.selectedQuarters,
          selectedType: filters.selectedType
        },
        activeProjectsCount: filteredProjects.length,
        grandTotalsSummary: {
          budgetUnits: grandTotals.budgetUnits,
          soldUnitsToDate: grandTotals.soldToDate,
          unitsVariance: grandTotals.soldToDate - grandTotals.budgetUnits,
          budgetRateAvg: grandTotals.budgetRate,
          actualRateAvg: grandTotals.actualRate,
          budgetAreaSqFt: grandTotals.budgetArea,
          actualAreaSqFt: grandTotals.actualArea,
          budgetSalesValueCr: grandTotals.budgetValCr,
          actualSalesValueCr: grandTotals.actualValCr,
          salesValueVarianceCr: grandTotals.actualValCr - grandTotals.budgetValCr,
          budgetCollectionCr: grandTotals.budgetCollection || 0,
          actualCollectionCr: grandTotals.actualCollection || 0,
          collectionVarianceCr: (grandTotals.actualCollection || 0) - (grandTotals.budgetCollection || 0)
        },
        projectsList: filteredProjects.map(p => ({
          name: p.name,
          type: p.type === 'L' ? 'Luxe' : p.type === 'C' ? 'Commercial' : 'Residential',
          targetUnits: p.budgetUnits,
          soldUnits: p.soldUnits || 0,
          registeredUnits: p.registeredUnits || 0,
          unregisteredUnits: p.unregisteredUnits || 0,
          targetValueCr: p.budgetValCr,
          actualValueCr: p.actualValCr,
          dueAsPerMilestoneCr: p.dueMilestone || 0,
          actualCollectionCr: p.actualCollection || 0,
          outstandingCr: p.outstanding || 0,
          registeredOSCr: p.registeredOS || 0,
          unregisteredOSCr: p.unregisteredOS || 0
        }))
      };

      const systemInstruction = `You are Enzo, a professional AI Data Analyst Agent for the BM Sales and Collection Dashboard.
You analyze the provided real-time dashboard data summary to answer questions precisely.
You can also take actions to control the dashboard UI (filtering, selecting projects, resetting, navigating pages) using the tools provided.
Always explain the action you took in your response.
Keep answers concise, professional, and directly linked to dashboard figures.
Format responses using markdown, bold text, and clean tables or bullets where helpful.
If queried in Hindi or Hinglish, respond in Hindi/Hinglish but keep formatting neat and numerical values clear.

Current Active Dashboard Data State:
${JSON.stringify(dashboardStateSummary, null, 2)}`;

      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\nUser Question: ${userMessage}`
                }
              ]
            }
          ],
          tools: agentTools,
          generationConfig: {
            temperature: 0.2,
            topP: 0.95
          }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'API request failed');
      }

      const part = data.candidates?.[0]?.content?.parts?.[0];
      
      if (part?.functionCall) {
        const { name, args } = part.functionCall;
        let actionResult = { success: true, message: 'Action executed successfully.' };
        
        try {
          if (name === 'updateFilters') {
            const updatedFilters = {};
            if (args.selectedType !== undefined) updatedFilters.selectedType = args.selectedType;
            if (args.selectedProjects !== undefined) {
              updatedFilters.selectedProjects = Array.isArray(args.selectedProjects)
                ? args.selectedProjects
                : [args.selectedProjects];
            }
            if (args.selectedQuarters !== undefined) {
              updatedFilters.selectedQuarters = Array.isArray(args.selectedQuarters)
                ? args.selectedQuarters
                : [args.selectedQuarters];
            }
            
            updateFilters(updatedFilters);
            actionResult.message = `Dashboard filters updated successfully. Applied: ${JSON.stringify(updatedFilters)}`;
          } else if (name === 'setActiveProject') {
            setActiveProjectName(args.projectName);
            actionResult.message = `Active project details set to "${args.projectName}".`;
          } else if (name === 'navigateToPage') {
            navigate(args.pageName);
            actionResult.message = `Successfully navigated to page "${args.pageName}".`;
          } else if (name === 'resetAllFilters') {
            resetData();
            actionResult.message = `All filters reset to defaults.`;
          }
        } catch (err) {
          console.error('Error executing action:', err);
          actionResult = { success: false, error: err.message };
        }

        // Call Gemini again with the tool's result to generate the conversational response
        const secondResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemInstruction}\n\nUser Question: ${userMessage}`
                  }
                ]
              },
              {
                role: 'model',
                parts: [part]
              },
              {
                role: 'tool',
                parts: [
                  {
                    functionResponse: {
                      name: name,
                      response: {
                        content: actionResult
                      }
                    }
                  }
                ]
              }
            ],
            tools: agentTools,
            generationConfig: {
              temperature: 0.2,
              topP: 0.95
            }
          })
        });

        const secondData = await secondResponse.json();
        if (secondData.error) {
          throw new Error(secondData.error.message || 'Secondary API request failed');
        }

        const generatedText = secondData.candidates?.[0]?.content?.parts?.[0]?.text || 'I have completed the action successfully.';
        setMessages(prev => [...prev, { role: 'assistant', content: generatedText }]);

      } else {
        const generatedText = part?.text || 'No response generated. Please try again.';
        setMessages(prev => [...prev, { role: 'assistant', content: generatedText }]);
      }

    } catch (err) {
      console.error('Gemini API Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error: ${err.message || 'Unable to connect to the Gemini API. Please check your network connection or API key.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-[380px] h-[520px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden mb-4 mr-1"
          >
            
            {/* Header */}
            <div className="bg-nyati-navy px-5 py-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/10 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] leading-tight">Enzo</h4>
                  <span className="text-[11px] opacity-75">AI Co-pilot • {filteredProjects.length} projects</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  className="hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configure Gemini API Key"
                  className={`hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer text-white/85 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* API Settings Overlay */}
            {showSettings && (
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Key className="w-4 h-4 text-nyati-navy" />
                  <span className="text-xs font-bold uppercase tracking-wider">Gemini API Key</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-nyati-navy"
                  />
                  <button
                    onClick={() => saveApiKey(apiKey)}
                    className="px-3.5 py-1.5 bg-nyati-navy text-white text-xs font-bold rounded-xl hover:bg-nyati-navy/95 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Your key is securely saved locally in your browser's localStorage. You can get a free key from Google AI Studio.
                </p>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex gap-2.5 max-w-[85%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm text-white ${isAI ? 'bg-nyati-navy' : 'bg-slate-500'}`}>
                      {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${isAI ? 'bg-white text-slate-800 border border-slate-100' : 'bg-nyati-navy text-white'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              
              {loading && (
                <div className="flex gap-2.5 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm bg-nyati-navy text-white">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200/80 flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything about the data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-nyati-navy/80 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 shrink-0 bg-nyati-navy text-white rounded-2xl flex items-center justify-center hover:bg-nyati-navy/95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-nyati-navy text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-nyati-navy/95 cursor-pointer border border-white/10"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="sparkles"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-amber-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
