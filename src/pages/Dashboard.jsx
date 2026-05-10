import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, LayoutDashboard, MapPin, Bell, Search, Activity, LogOut, Calendar, Plus, Trash2, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Firebase Integrations
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const getToday = () => new Date().toISOString().split('T')[0];
const TASK_NAMES = ['Assemble', 'RBS Cabinet', 'Antenna', 'Radio', 'Power Cabling', 'Termination'];
const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('omniCellUser') || 'Engineer';
  const reportRef = useRef(null);

  // --- DATABASE STATE ---
  const [siteData, setSiteData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI CONTROL STATE ---
  const [activeSiteIndex, setActiveSiteIndex] = useState(0);
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [isExporting, setIsExporting] = useState(false);

  // --- REAL-TIME DATA SYNC ---
  useEffect(() => {
    // This listens to Firestore. If you change data on your phone, it updates on your PC instantly.
    const unsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const sitesArray = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      setSiteData(sitesArray);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DERIVED DATA ---
  const filteredSites = siteData.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeSite = filteredSites[activeSiteIndex] || siteData[0];
  const safeDateIndex = activeSite ? Math.min(activeDateIndex, activeSite.history.length - 1) : 0;
  const activeRecord = activeSite ? activeSite.history[safeDateIndex] : null;

  const chartData = activeRecord ? TASK_NAMES.map((name, index) => ({ name, progress: activeRecord.tasks[index] })) : [];
  const overallProgress = activeRecord ? Math.round(activeRecord.tasks.reduce((sum, val) => sum + val, 0) / TASK_NAMES.length) : 0;

  // --- CORE FUNCTIONS ---
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('omniCellAuth');
    navigate('/login');
  };

  const handleProgressChange = async (taskIndex, newValue) => {
    const updatedHistory = [...activeSite.history];
    updatedHistory[safeDateIndex].tasks[taskIndex] = Number(newValue);
    
    const siteRef = doc(db, "sites", activeSite.firestoreId);
    await updateDoc(siteRef, { history: updatedHistory });
  };

  const createNewDailyLog = async () => {
    if (!activeSite) return;
    const lastLog = activeSite.history[activeSite.history.length - 1];
    const latestTasks = [...lastLog.tasks];
    
    // Carry over previous progress to the new day
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + activeSite.history.length);
    const newDateString = newDate.toISOString().split('T')[0];
    
    const updatedHistory = [...activeSite.history, { date: newDateString, tasks: latestTasks }];
    const siteRef = doc(db, "sites", activeSite.firestoreId);
    await updateDoc(siteRef, { history: updatedHistory });
    
    setActiveDateIndex(updatedHistory.length - 1);
  };

  const handleAddSite = async () => {
    if (!formData.id.trim() || !formData.name.trim()) return;
    const newSite = { 
      id: formData.id, 
      name: formData.name, 
      history: [{ date: getToday(), tasks: [0, 0, 0, 0, 0, 0] }] 
    };
    await addDoc(collection(db, "sites"), newSite);
    setIsAddingMode(false);
    setFormData({ id: '', name: '' });
  };

  const handleEditSite = async () => {
    if (!formData.id.trim() || !formData.name.trim()) return;
    const siteRef = doc(db, "sites", activeSite.firestoreId);
    await updateDoc(siteRef, { id: formData.id, name: formData.name });
    setIsEditingMode(false);
  };

  const handleDeleteSite = async () => {
    if (window.confirm(`Permanently delete Site ${activeSite.id} from JAHS Database?`)) {
      await deleteDoc(doc(db, "sites", activeSite.firestoreId));
      setActiveSiteIndex(0);
      setActiveDateIndex(0);
    }
  };

  // --- PROFESSIONAL PDF EXPORT ---
  const exportPDF = async () => {
    if (!reportRef.current || !activeSite) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFont("helvetica", "bold");
      pdf.text(`JAHS-SITE-TRACKER OFFICIAL REPORT`, 15, 15);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Site: ${activeSite.name} (${activeSite.id}) | Date: ${activeRecord.date}`, 15, 22);
      
      pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
      pdf.save(`JAHS_Report_${activeSite.id}_Day${safeDateIndex + 1}.pdf`);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-blue-500 font-bold text-xl animate-pulse tracking-[0.2em]">
      JAHS CLOUD SYNCING...
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 shadow-2xl flex-col z-20">
        <div className="p-6 flex items-center gap-3 text-white font-bold text-xl border-b border-slate-800 tracking-tight">
          <Activity className="text-blue-500 animate-pulse" /> JAHS-Tracker
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md shadow-blue-900/20"><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => navigate('/locator')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 transition-all group"><MapPin size={20} className="group-hover:text-blue-400" /> Map Locator</button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors w-full p-2 rounded-lg hover:bg-slate-800"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search site ID..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setActiveSiteIndex(0);}} className="pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none w-full transition-all" />
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 capitalize">{userName}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Lead Engineer</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200 capitalize">{userName.charAt(0)}</div>
            </div>
          </div>
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* ACTION CENTER */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-center">
            {siteData.length === 0 ? (
               <div className="w-full text-center py-4"><p className="text-slate-400 font-medium">No sites active. Initialize a new site to begin tracking.</p></div>
            ) : (
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-2/3">
              <div className="w-full md:w-1/2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">1. Deployment Site</label>
                <select className="bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full cursor-pointer" value={activeSiteIndex} onChange={(e) => { setActiveSiteIndex(Number(e.target.value)); setActiveDateIndex(filteredSites[Number(e.target.value)].history.length - 1); }} disabled={isAddingMode || isEditingMode}>
                  {filteredSites.map((site, index) => <option key={site.firestoreId} value={index}>{site.id} - {site.name}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">2. Log History</label>
                <select className="bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full cursor-pointer" value={safeDateIndex} onChange={(e) => setActiveDateIndex(Number(e.target.value))} disabled={isAddingMode || isEditingMode}>
                  {activeSite && activeSite.history.map((record, idx) => <option key={idx} value={idx}>Day {idx + 1}: {record.date}</option>)}
                </select>
              </div>
            </div>
            )}

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              {!isAddingMode && !isEditingMode ? (
                <>
                  <button onClick={() => { setIsAddingMode(true); setFormData({ id: '', name: '' }); }} className="p-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-all"><Plus size={20} /></button>
                  {siteData.length > 0 && (
                    <>
                      <button onClick={() => { setFormData({ id: activeSite.id, name: activeSite.name }); setIsEditingMode(true); }} className="p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all"><Edit2 size={20} /></button>
                      <button onClick={handleDeleteSite} className="p-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl transition-all"><Trash2 size={20} /></button>
                      <div className="w-px h-10 bg-slate-200 mx-2"></div>
                      <button onClick={createNewDailyLog} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"><Calendar size={18} /> Add Day</button>
                      <button onClick={exportPDF} disabled={isExporting} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-5 rounded-xl font-bold transition-all active:scale-95"><Download size={18} /> Export</button>
                    </>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 w-full bg-blue-50 p-2 rounded-xl">
                  <input type="text" placeholder="ID" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="px-3 py-2 border rounded-lg w-1/3 outline-none focus:border-blue-400" />
                  <input type="text" placeholder="Site Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-3 py-2 border rounded-lg w-1/2 outline-none focus:border-blue-400" />
                  <button onClick={isAddingMode ? handleAddSite : handleEditSite} className="bg-blue-600 text-white p-2 rounded-lg"><Save size={18} /></button>
                  <button onClick={() => { setIsAddingMode(false); setIsEditingMode(false); }} className="bg-white text-slate-400 p-2 rounded-lg"><X size={18} /></button>
                </motion.div>
              )}
            </div>
          </div>

          {siteData.length > 0 && activeRecord && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PROGRESS SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-900 flex items-center gap-2 tracking-tight"><Activity size={20} className="text-blue-500"/> Phase Controls</h3>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase">Day {safeDateIndex + 1}</div>
              </div>
              <div className="space-y-7">
                {TASK_NAMES.map((name, index) => (
                  <div key={name} className="group">
                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest group-hover:text-blue-500 transition-colors">
                      <span>{name}</span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{activeRecord.tasks[index]}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={activeRecord.tasks[index]} onChange={(e) => handleProgressChange(index, e.target.value)} disabled={isAddingMode || isEditingMode} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-inner" />
                  </div>
                ))}
              </div>
            </div>

            {/* ANALYTICS REPORT */}
            <div className="lg:col-span-2 space-y-6" ref={reportRef}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 col-span-1 md:col-span-3 pb-10 border-b-0 rounded-b-none mb-[-32px]">
                  <div className="w-full flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{activeSite.name}</h2>
                      <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em]">{activeSite.id} • Verified Telemetry Log • {activeRecord.date}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] font-black text-green-700 tracking-widest">CLOUD SYNCED</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 rounded-t-none border-t-0 z-10 relative">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-2xl shadow-inner"><Activity size={28} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Status</p>
                    <p className="text-lg font-black text-slate-800 uppercase italic">{overallProgress >= 100 ? 'Deployed' : overallProgress > 50 ? 'In Progress' : 'Initial Phase'}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 rounded-t-none border-t-0 z-10 relative">
                  <div className="h-16 w-16 rounded-full relative flex items-center justify-center bg-slate-50 shadow-inner">
                    <PieChart width={64} height={64}><Pie data={[{value: overallProgress}, {value: 100 - overallProgress}]} innerRadius={22} outerRadius={30} dataKey="value" stroke="none"><Cell fill="#3b82f6" /><Cell fill="#f1f5f9" /></Pie></PieChart>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Site Completion</p>
                    <p className="text-3xl font-black text-blue-600 tabular-nums">{overallProgress}%</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm rounded-t-none border-t-0 col-span-1 md:col-span-3">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} domain={[0, 100]} />
                        <Tooltip cursor={{ fill: '#f8fafc', radius: 10 }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }} />
                        <Bar dataKey="progress" radius={[8, 8, 0, 0]} maxBarSize={50}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}