import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, LayoutDashboard, MapPin, Activity, Settings, Bell, Search, Menu, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_SITES = [
  { id: 'NCR-001', name: 'Makati CBD Alpha', tasks: [90, 50, 20, 0, 0, 0] },
  { id: 'NCR-002', name: 'BGC Tower Delta', tasks: [100, 100, 80, 60, 40, 10] },
  { id: 'PROV-104', name: 'Bulacan Hub', tasks: [100, 90, 50, 20, 0, 0] },
];

const TASK_NAMES = ['Assemble', 'RBS Cabinet', 'Antenna', 'Radio', 'Power Cabling', 'Termination'];
const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

export default function TelecomDashboard() {
  const [siteData, setSiteData] = useState(INITIAL_SITES);
  const [activeSiteIndex, setActiveSiteIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '' });

  const activeSite = siteData[activeSiteIndex] || siteData[0];

  const chartData = TASK_NAMES.map((name, index) => ({
    name,
    progress: activeSite ? activeSite.tasks[index] : 0
  }));

  const overallProgress = activeSite ? Math.round(
    activeSite.tasks.reduce((sum, val) => sum + val, 0) / TASK_NAMES.length
  ) : 0;

  // --- CRUD FUNCTIONS ---
  const handleProgressChange = (taskIndex, newValue) => {
    const updatedSites = [...siteData];
    updatedSites[activeSiteIndex].tasks[taskIndex] = Math.min(100, Math.max(0, Number(newValue)));
    setSiteData(updatedSites);
  };

  const handleAddSite = () => {
    if (!formData.id.trim() || !formData.name.trim()) return;
    const newSite = { id: formData.id, name: formData.name, tasks: [0, 0, 0, 0, 0, 0] };
    setSiteData([...siteData, newSite]);
    setActiveSiteIndex(siteData.length);
    setIsAddingMode(false);
    setFormData({ id: '', name: '' });
  };

  const handleEditSite = () => {
    if (!formData.id.trim() || !formData.name.trim()) return;
    const updatedSites = [...siteData];
    updatedSites[activeSiteIndex].id = formData.id;
    updatedSites[activeSiteIndex].name = formData.name;
    setSiteData(updatedSites);
    setIsEditingMode(false);
  };

  const handleDeleteSite = () => {
    if (siteData.length === 1) return alert("Cannot delete the last site.");
    if (window.confirm(`Delete ${activeSite.id}?`)) {
      setSiteData(siteData.filter((_, index) => index !== activeSiteIndex));
      setActiveSiteIndex(0);
    }
  };

  const startEditing = () => {
    setFormData({ id: activeSite.id, name: activeSite.name });
    setIsEditingMode(true);
  };

  // --- EXPORT ---
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${activeSite.id}_Install_Report.pdf`);
    } catch (error) {
      console.error("PDF Export Failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-blue-200">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 text-white font-bold text-xl border-b border-slate-800 tracking-tight">
          <Activity className="text-blue-500 animate-pulse" /> OmniCell Inc.
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02]">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group">
            <MapPin size={20} className="group-hover:text-blue-400 transition-colors" /> Site Locator
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group">
            <Settings size={20} className="group-hover:text-blue-400 transition-colors" /> System Config
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        
        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search site ID..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none w-64 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-blue-600 transition-colors relative hover:scale-110 active:scale-95 duration-200">
              <Bell size={22} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
              LE
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6"
        >
          {/* ACTION BAR */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-full md:w-1/2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Active Site</label>
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none w-full cursor-pointer transition-all hover:bg-slate-100"
                value={activeSiteIndex}
                onChange={(e) => setActiveSiteIndex(Number(e.target.value))}
                disabled={isAddingMode || isEditingMode}
              >
                {siteData.map((site, index) => (
                  <option key={index} value={index}>{site.id} - {site.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {!isAddingMode && !isEditingMode ? (
                <>
                  <button onClick={() => { setIsAddingMode(true); setFormData({ id: '', name: '' }); }} className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-sm hover:-translate-y-0.5 py-2.5 px-4 rounded-xl font-semibold transition-all active:scale-95">
                    <Plus size={18} /> New Site
                  </button>
                  <button onClick={startEditing} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm hover:-translate-y-0.5 py-2.5 px-4 rounded-xl font-semibold transition-all active:scale-95">
                    <Edit2 size={18} /> Edit
                  </button>
                  <button onClick={handleDeleteSite} className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-sm hover:-translate-y-0.5 py-2.5 px-4 rounded-xl font-semibold transition-all active:scale-95">
                    <Trash2 size={18} /> Delete
                  </button>
                  <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
                  <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 text-white py-2.5 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 active:scale-95">
                    <Download size={18} /> {isExporting ? 'Saving...' : 'Export PDF'}
                  </button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl w-full md:w-auto border border-blue-200 shadow-inner">
                  <input type="text" placeholder="Site ID" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none w-28 text-sm font-medium" />
                  <input type="text" placeholder="Site Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none w-40 text-sm font-medium" />
                  <button onClick={isAddingMode ? handleAddSite : handleEditSite} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"><Save size={18} /></button>
                  <button onClick={() => { setIsAddingMode(false); setIsEditingMode(false); }} className="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-lg transition-colors shadow-sm hover:-translate-y-0.5 active:scale-95"><X size={18} /></button>
                </motion.div>
              )}
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COL: Updaters */}
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 transition-all">
              <h3 className="font-extrabold text-slate-900 mb-6 flex items-center gap-2 tracking-tight"><Activity size={20} className="text-blue-500"/> Phase Controls</h3>
              <div className="space-y-6">
                <AnimatePresence>
                  {TASK_NAMES.map((name, index) => (
                    <motion.div key={name} layout className="group">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{name}</span>
                        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{activeSite ? activeSite.tasks[index] : 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeSite ? activeSite.tasks[index] : 0}
                        onChange={(e) => handleProgressChange(index, e.target.value)}
                        disabled={isAddingMode || isEditingMode}
                        className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-all disabled:opacity-50 shadow-inner"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* RIGHT COL: Charts */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={reportRef}>
                
                {/* Header for PDF */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 col-span-1 md:col-span-3 pb-8 border-b-0 rounded-b-none mb-[-24px]">
                  <div className="w-full flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeSite?.name || 'No Site Selected'} Analysis</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">ID: {activeSite?.id || 'N/A'} • Live Telemetry</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-green-700 tracking-wide">ONLINE</span>
                    </div>
                  </div>
                </div>
                
                {/* KPI Cards */}
                <motion.div whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 rounded-t-none border-t-0 transition-all z-10 relative">
                  <div className="p-3.5 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl shadow-inner"><Activity size={24} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Site Health</p>
                    <p className="text-xl font-black text-slate-800">{overallProgress > 50 ? 'Optimal' : 'Pending Action'}</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 rounded-t-none border-t-0 transition-all z-10 relative">
                  <div className="h-14 w-14 rounded-full relative flex items-center justify-center bg-slate-50 shadow-inner">
                    <PieChart width={56} height={56}>
                      <Pie data={[{value: overallProgress}, {value: 100 - overallProgress}]} innerRadius={20} outerRadius={28} dataKey="value" stroke="none">
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                    </PieChart>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Completion</p>
                    <p className="text-2xl font-black text-blue-600">{overallProgress}%</p>
                  </div>
                </motion.div>

                {/* Chart Area */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm rounded-t-none border-t-0 col-span-1 md:col-span-3">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} domain={[0, 100]} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc', radius: 8 }} 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                        />
                        <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}