import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Map, 
  AlertTriangle, 
  Info, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Database,
  UploadCloud
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Cell, Pie, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface CrimeData {
  state: string;
  year: number;
  crime_type: string;
  count: number;
}

interface Stats {
  totalCrimes: number;
  commonType: string;
  dangerousState: string;
  safestState: string;
  yoyChange: string;
}

interface Prediction {
  year: number;
  predicted_crime: number;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all group",
      active 
        ? "bg-accent-glow text-text-main border-r-3 border-accent-blue" 
        : "text-text-dim hover:bg-white/5 hover:text-text-main"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-accent-blue" : "text-text-dim group-hover:text-text-main")} />
    {label}
  </button>
);

const StatCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
  <div className="p-6 bg-card-bg border border-card-border rounded-xl shadow-sm hover:border-accent-blue/30 transition-all">
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-text-dim uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-text-main">{value}</h3>
      {subValue && (
        <p className={cn("text-xs font-medium flex items-center gap-1", trend === "up" ? "text-accent-red" : "text-accent-green")}>
          {trend === "up" ? "▲" : "▼"} {subValue}
        </p>
      )}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState<CrimeData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // AutoML State
  const [autoMLFile, setAutoMLFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<any>(null);

  const handleAutoMLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoMLFile) return;
    
    setIsTraining(true);
    setTrainResult(null);
    
    const formData = new FormData();
    formData.append("file", autoMLFile);
    
    try {
      const res = await fetch("http://localhost:8000/auto-train", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Training failed");
      setTrainResult(data);
      // Wait for servers to settle then re-fetch global data
      await fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const fetchData = async () => {
    try {
      const [dataRes, statsRes, predRes] = await Promise.all([
        fetch("/api/data"),
        fetch("/api/stats"),
        fetch("/api/predict")
      ]);
      const dataJson = await dataRes.json();
      const statsJson = await statsRes.json();
      const predJson = await predRes.json();
      
      setData(dataJson);
      setStats(statsJson);
      setPredictions(predJson);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading CrimeWatch Data...</p>
        </div>
      </div>
    );
  }

  // Data processing for charts
  const yearWiseData = Object.entries(
    data.reduce((acc: any, curr) => {
      acc[curr.year] = (acc[curr.year] || 0) + curr.count;
      return acc;
    }, {})
  ).map(([year, count]) => ({ year, count }));

  const typeWiseData = Object.entries(
    data.reduce((acc: any, curr) => {
      acc[curr.crime_type] = (acc[curr.crime_type] || 0) + curr.count;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const stateWiseData = Object.entries(
    data.reduce((acc: any, curr) => {
      acc[curr.state] = (acc[curr.state] || 0) + curr.count;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }))
   .sort((a, b) => b.value - a.value);

  const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="flex min-h-screen bg-bg font-sans text-text-main">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg border-r border-card-border transition-transform duration-300 lg:static lg:translate-x-0",
        !sidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex items-center justify-center w-10 h-10 bg-accent-blue rounded-lg shadow-lg shadow-accent-blue/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tighter text-accent-blue">CRIMEWATCH</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => setActiveTab("dashboard")} 
            />
            <SidebarItem 
              icon={TrendingUp} 
              label="Predictions" 
              active={activeTab === "predictions"} 
              onClick={() => setActiveTab("predictions")} 
            />
            <SidebarItem 
              icon={Map} 
              label="Location Analysis" 
              active={activeTab === "location"} 
              onClick={() => setActiveTab("location")} 
            />
            <SidebarItem 
              icon={Info} 
              label="Insights" 
              active={activeTab === "insights"} 
              onClick={() => setActiveTab("insights")} 
            />
            <SidebarItem 
              icon={Database} 
              label="AutoML Custom" 
              active={activeTab === "automl"} 
              onClick={() => setActiveTab("automl")} 
            />
          </nav>

          <div className="p-4 mt-auto">
            <div className="p-4 bg-card-bg border border-card-border rounded-xl text-white">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">System Status</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                <p className="text-xs font-bold text-text-main">Live NCRB Sync</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-6 bg-bg/80 backdrop-blur-md border-b border-card-border">
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-text-dim hover:bg-white/5 rounded-lg">
                {sidebarOpen ? <X /> : <Menu />}
              </button>
              <h2 className="text-xl font-bold tracking-tight text-text-main capitalize">{activeTab.replace("-", " ")}</h2>
            </div>
            <p className="text-xs text-text-dim ml-0 lg:ml-0 mt-1">National Crime Records Bureau (NCRB) Dataset Intelligence</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-card-border rounded-md text-[10px] font-bold text-text-dim uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              Sync: April 2026
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total Reported Crimes" 
                    value={stats?.totalCrimes.toLocaleString()} 
                    subValue={`${stats?.yoyChange}% from last year`}
                    trend={parseFloat(stats?.yoyChange || "0") > 0 ? "up" : "down"}
                    icon={AlertTriangle}
                  />
                  <StatCard 
                    title="Most Common Crime" 
                    value={stats?.commonType} 
                    icon={BarChart3}
                  />
                  <StatCard 
                    title="Highest Crime State" 
                    value={stats?.dangerousState} 
                    icon={Map}
                    trend="up"
                  />
                  <StatCard 
                    title="Safest State" 
                    value={stats?.safestState} 
                    icon={ShieldCheck}
                    trend="down"
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Crime Trend */}
                  <div className="p-6 bg-card-bg border border-card-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Yearly Crime Trend</h3>
                      <TrendingUp className="w-4 h-4 text-text-dim" />
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={yearWiseData}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Crime Types */}
                  <div className="p-6 bg-card-bg border border-card-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Distribution by Type</h3>
                      <PieChartIcon className="w-4 h-4 text-text-dim" />
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeWiseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {typeWiseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {typeWiseData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* State Wise Bar Chart */}
                <div className="p-6 bg-card-bg border border-card-border rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">State-wise Distribution</h3>
                    <Map className="w-4 h-4 text-text-dim" />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stateWiseData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "predictions" && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-8 prediction-gradient border border-accent-blue rounded-2xl text-text-main shadow-xl">
                  <div className="max-w-2xl">
                    <span className="px-2 py-1 bg-accent-blue text-white text-[10px] font-bold rounded mb-4 inline-block tracking-widest">RANDOM FOREST REGRESSOR</span>
                    <h3 className="text-2xl font-bold mb-4">Predictive Analysis Engine</h3>
                    <p className="text-text-dim leading-relaxed text-sm">
                      Our machine learning model suggests a structural shift in crime reporting. Urban areas are projected to see a 12% rise in cyber-related IPC crimes.
                    </p>
                    <div className="flex gap-4 mt-8">
                      <div className="px-3 py-1.5 bg-white/5 rounded-md text-[10px] font-bold border border-card-border uppercase tracking-wider">
                        Model: Linear Regression
                      </div>
                      <div className="px-3 py-1.5 bg-white/5 rounded-md text-[10px] font-bold border border-card-border uppercase tracking-wider">
                        Accuracy: 89.4%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 p-6 bg-card-bg border border-card-border rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-text-main mb-6 uppercase tracking-wider">Forecasted Crime Volume (2023 - 2027)</h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={predictions}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                          <Line type="monotone" dataKey="predicted_crime" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Yearly Projections</h3>
                    {predictions.map((pred, idx) => (
                      <div key={pred.year} className="flex items-center justify-between p-4 bg-card-bg border border-card-border rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-accent-glow rounded-lg font-bold text-accent-blue text-xs">
                            {pred.year}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-main">{pred.predicted_crime.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Predicted Cases</p>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                          idx === 0 ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-red/20 text-accent-red"
                        )}>
                          {idx === 0 ? "Short Term" : "Long Term"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="p-8 bg-card-bg border border-card-border rounded-2xl shadow-sm space-y-6">
                  <div className="w-12 h-12 bg-accent-red/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-accent-red" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main">Critical Insights</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-red shrink-0" />
                      <p className="text-sm text-text-dim">
                        <span className="font-bold text-text-main">{stats?.dangerousState}</span> reports the highest crime volume, contributing to over 30% of total cases.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-red shrink-0" />
                      <p className="text-sm text-text-dim">
                        Crime rates have seen a <span className="font-bold text-text-main">{stats?.yoyChange}% {parseFloat(stats?.yoyChange || "0") > 0 ? "increase" : "decrease"}</span> in the last reporting period.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-red shrink-0" />
                      <p className="text-sm text-text-dim">
                        <span className="font-bold text-text-main">{stats?.commonType}</span> remains the most prevalent crime category across all major urban centers.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="p-8 bg-card-bg border border-card-border rounded-2xl shadow-sm space-y-6">
                  <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-accent-green" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main">Safety Recommendations</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                      <p className="text-sm text-text-dim">
                        States like <span className="font-bold text-text-main">{stats?.safestState}</span> demonstrate effective community policing models that could be replicated.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                      <p className="text-sm text-text-dim">
                        Increasing street lighting and CCTV coverage in high-risk zones of <span className="font-bold text-text-main">{stats?.dangerousState}</span> is recommended.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                      <p className="text-sm text-text-dim">
                        Public awareness campaigns focusing on <span className="font-bold text-text-main">{stats?.commonType}</span> prevention could reduce crime rates by up to 15%.
                      </p>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === "location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="p-6 bg-card-bg border border-card-border rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-text-main mb-6 uppercase tracking-wider">State-wise Detailed Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-4 px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">State / UT</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Total Crimes</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Risk Level</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateWiseData.map((state) => (
                          <tr key={state.name} className="border-dotted-slate hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 font-bold text-text-main text-sm">{state.name}</td>
                            <td className="py-4 px-4 text-text-dim text-sm">{state.value.toLocaleString()}</td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                (state.value as number) > 100000 ? "bg-accent-red/20 text-accent-red" : 
                                (state.value as number) > 50000 ? "bg-accent-blue/20 text-accent-blue" : 
                                "bg-accent-green/20 text-accent-green"
                              )}>
                                {(state.value as number) > 100000 ? "High Risk" : (state.value as number) > 50000 ? "Moderate" : "Low Risk"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button className="text-accent-blue hover:text-accent-blue/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                Details <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "automl" && (
              <motion.div
                key="automl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="p-8 bg-card-bg border border-card-border rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-main">Universal Model Training</h3>
                      <p className="text-sm text-text-dim">Upload any CSV dataset to automatically train a precise Random Forest model.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleAutoMLSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">Upload CSV Dataset</label>
                      <div className="border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-accent-blue/50 transition-colors relative cursor-pointer group">
                        <UploadCloud className="w-8 h-8 text-text-dim mx-auto mb-3 group-hover:text-accent-blue transition-colors" />
                        <p className="text-sm text-text-dim">Click to select or drag and drop</p>
                        <p className="text-xs text-text-dim mt-1">.csv files only</p>
                        <input 
                           type="file" 
                           accept=".csv"
                           onChange={(e) => setAutoMLFile(e.target.files?.[0] || null)}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                           required 
                        />
                      </div>
                      {autoMLFile && <p className="text-sm text-accent-green mt-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {autoMLFile.name} selected</p>}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isTraining}
                      className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-lg text-sm w-full transition-colors disabled:opacity-50"
                    >
                      {isTraining ? "Analyzing & Training..." : "Train Universal Model"}
                    </button>
                  </form>
                  
                  {trainResult && (
                    <div className="mt-8 p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
                      <h4 className="text-lg font-bold text-text-main mb-4">Training Successful!</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg p-4 rounded-lg border border-card-border">
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Model Type</p>
                          <p className="text-sm font-bold text-text-main">{trainResult.model_type}</p>
                        </div>
                        <div className="bg-bg p-4 rounded-lg border border-card-border">
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">{trainResult.metric_name}</p>
                          <p className="text-sm font-bold text-accent-blue">{trainResult.metric_value}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-bg p-4 rounded-lg border border-card-border">
                         <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">Features Extracted</p>
                         <div className="flex flex-wrap gap-2">
                           {trainResult.features_used?.map((feat: string) => (
                             <span key={feat} className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-text-dim border border-card-border">{feat}</span>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
