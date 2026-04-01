/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  Thermometer, 
  Timer, 
  AlertTriangle, 
  Settings, 
  Cpu, 
  Info, 
  Play, 
  Square, 
  RefreshCw,
  Download,
  Layers,
  Zap,
  ChevronRight,
  Monitor,
  Upload,
  Crosshair,
  Target,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

// --- Constants & Types ---

const MAX_DATA_POINTS = 50;
const AMBIENT_TEMP = 37;  // Body temperature

type Modality = 'RFA' | 'MWA' | 'CRYO';
type Organ = 'Liver' | 'Lung' | 'Kidney' | 'Bone';

interface ModalityConfig {
  name: string;
  criticalTemp: number;
  targetTemp: number;
  description: string;
  color: string;
}

const MODALITY_CONFIGS: Record<Modality, ModalityConfig> = {
  RFA: { 
    name: 'Radiofrequency Ablation', 
    criticalTemp: 60, 
    targetTemp: 50, 
    description: 'Frictional heating via high-frequency alternating current.',
    color: 'rose'
  },
  MWA: { 
    name: 'Microwave Ablation', 
    criticalTemp: 65, 
    targetTemp: 55, 
    description: 'Dielectric heating via electromagnetic field oscillation.',
    color: 'orange'
  },
  CRYO: { 
    name: 'Cryoablation', 
    criticalTemp: -40, 
    targetTemp: -20, 
    description: 'Cellular destruction via extreme cold and ice crystal formation.',
    color: 'blue'
  }
};

const GUIDELINES: Record<Organ, string[]> = {
  Liver: [
    "CIRSE: 5-10mm safety margin required for HCC.",
    "SIR: Monitor for biliary duct injury in central lesions.",
    "ACR: Post-ablation contrast-enhanced CT/MRI at 1 month."
  ],
  Lung: [
    "CIRSE: Pneumothorax risk (30-50%). Monitor for air leak.",
    "SIR: Avoid ablation within 1cm of the hilum.",
    "ACR: Ground-glass opacity (GGO) expected post-procedure."
  ],
  Kidney: [
    "CIRSE: Hydrodissection recommended for bowel protection.",
    "SIR: Monitor for hematuria and collecting system injury.",
    "ACR: 4-6 week follow-up for residual enhancement."
  ],
  Bone: [
    "CIRSE: Thermoprotection of adjacent nerves is critical.",
    "SIR: Cementoplasty often performed concurrently.",
    "ACR: Pain relief is a primary endpoint for palliative cases."
  ]
};

interface TempReading {
  time: number;
  probe1: number;
  probe2: number;
  probe3: number;
  probe4: number;
}

interface HardwareSuggestion {
  item: string;
  purpose: string;
  approxPrice: string;
  link?: string;
}

const HARDWARE_SUGGESTIONS: HardwareSuggestion[] = [
  { item: "Raspberry Pi Pico W", purpose: "Main controller with Wi-Fi for data transmission", approxPrice: "$6" },
  { item: "MAX31855 Module", purpose: "Thermocouple-to-Digital converter (SPI interface)", approxPrice: "$5/ea" },
  { item: "Type K Thermocouples", purpose: "High-temperature sensing probes (0.5mm - 1mm diameter)", approxPrice: "$3/ea" },
  { item: "CD74HC4067 Multiplexer", purpose: "If using more than 2-3 analog sensors", approxPrice: "$2" },
  { item: "3D Printed Probe Guide", purpose: "Ensure precise spatial placement of probes", approxPrice: "Minimal" },
];

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-500 text-sm font-medium">{title}</span>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-slate-500 text-sm">{unit}</span>
    </div>
    {trend && (
      <div className={cn("text-xs mt-2 font-medium", trend > 0 ? "text-emerald-600" : "text-rose-600")}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from baseline
      </div>
    )}
  </div>
);

const HeatmapVisualizer = ({ data, modality, transparent = false }: { data: TempReading, modality: Modality, transparent?: boolean }) => {
  const config = MODALITY_CONFIGS[modality];
  const isCryo = modality === 'CRYO';
  
  // Simple 2D interpolation for visualization
  const probes = [
    { x: 50, y: 50, temp: isCryo 
      ? (data.probe1 + data.probe2 + data.probe3 + data.probe4) / 4 - 15 
      : (data.probe1 + data.probe2 + data.probe3 + data.probe4) / 4 + 10 
    },
    { x: 50, y: 20, temp: data.probe1 },
    { x: 80, y: 50, temp: data.probe2 },
    { x: 50, y: 80, temp: data.probe3 },
    { x: 20, y: 50, temp: data.probe4 },
  ];

  return (
    <div className={cn(
      "relative w-full aspect-square rounded-xl overflow-hidden border",
      transparent ? "bg-transparent border-transparent" : "bg-slate-900 border-slate-800"
    )}>
      {!transparent && (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }} />
        </div>
      )}
      
      {/* Simulated Heat/Cold Zones */}
      <AnimatePresence>
        {probes.map((p, i) => {
          const delta = isCryo ? (AMBIENT_TEMP - p.temp) : (p.temp - AMBIENT_TEMP);
          const targetDelta = isCryo ? (AMBIENT_TEMP - config.criticalTemp) : (config.criticalTemp - AMBIENT_TEMP);
          const intensity = Math.max(0, delta / targetDelta);
          const size = 40 + intensity * 140;
          
          let gradient = '';
          if (isCryo) {
            gradient = p.temp < config.criticalTemp 
              ? 'radial-gradient(circle, #f8fafc 0%, #3b82f6 40%, transparent 70%)' 
              : p.temp < config.targetTemp 
                ? 'radial-gradient(circle, #60a5fa 0%, transparent 70%)'
                : 'radial-gradient(circle, #93c5fd 0%, transparent 70%)';
          } else {
            gradient = p.temp > config.criticalTemp 
              ? `radial-gradient(circle, ${modality === 'MWA' ? '#f97316' : '#ef4444'} 0%, transparent 70%)` 
              : p.temp > config.targetTemp 
                ? 'radial-gradient(circle, #f59e0b 0%, transparent 70%)'
                : 'radial-gradient(circle, #3b82f6 0%, transparent 70%)';
          }

          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: 1 + intensity * 0.2,
                opacity: 0.3 + intensity * 0.6,
              }}
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                background: gradient,
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* Probe Markers */}
      {probes.map((p, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full border border-slate-900 shadow-lg z-10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-slate-800/80 px-1 rounded">
            {i === 0 ? 'Core' : `P${i}`}: {p.temp.toFixed(1)}°C
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="text-[10px] text-slate-400 font-mono">
          ESTIMATED {isCryo ? 'ICE BALL' : 'ABLATION ZONE'}<br/>
          RADIUS: ~{((isCryo ? AMBIENT_TEMP - Math.min(data.probe1, data.probe2, data.probe3, data.probe4) : Math.max(data.probe1, data.probe2, data.probe3, data.probe4) - AMBIENT_TEMP) * 0.5).toFixed(1)}mm
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isCryo ? "bg-white" : "bg-rose-500")} />
            <span className="text-[10px] text-slate-300">{isCryo ? 'Lethal Cold (<-40°C)' : 'Necrosis (>60°C)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-[10px] text-slate-300">Target Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [data, setData] = useState<TempReading[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'monitor' | 'hardware' | 'radiomics' | 'history'>('monitor');
  const [modality, setModality] = useState<Modality>('RFA');
  const [organ, setOrgan] = useState<Organ>('Liver');
  const [privacyMode, setPrivacyMode] = useState(true);
  const [radiomicsData, setRadiomicsData] = useState<any>(null);
  const [fusionEnabled, setFusionEnabled] = useState(false);
  const [images, setImages] = useState<{ pre?: string, intra?: string, post?: string }>({});
  const [activeImage, setActiveImage] = useState<'pre' | 'intra' | 'post'>('intra');
  
  const config = MODALITY_CONFIGS[modality];
  const isCryo = modality === 'CRYO';

  // Simulation Logic
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setData(prev => {
          // Simulate heating/cooling curve
          const t = elapsedTime / 60; // minutes
          const factor = Math.min(1, t * 2);
          
          const baseTemp = 37;
          let p1, p2, p3, p4;

          if (isCryo) {
            p1 = baseTemp - (Math.random() * 5 + 70) * factor;
            p2 = baseTemp - (Math.random() * 5 + 50) * factor;
            p3 = baseTemp - (Math.random() * 5 + 30) * factor;
            p4 = baseTemp - (Math.random() * 5 + 20) * factor;
          } else {
            const boost = modality === 'MWA' ? 1.2 : 1.0;
            p1 = baseTemp + (Math.random() * 2 + 25) * factor * boost;
            p2 = baseTemp + (Math.random() * 2 + 20) * factor * boost;
            p3 = baseTemp + (Math.random() * 2 + 15) * factor * boost;
            p4 = baseTemp + (Math.random() * 2 + 10) * factor * boost;
          }
          
          const newReading: TempReading = {
            time: elapsedTime,
            probe1: p1,
            probe2: p2,
            probe3: p3,
            probe4: p4,
          };

          const newData = [...prev, newReading];
          return newData.slice(-MAX_DATA_POINTS);
        });

        // Simulate Radiomics Analysis every 10 seconds
        if (elapsedTime % 10 === 0) {
          const hasImages = images.pre || images.intra || images.post;
          setRadiomicsData({
            heterogeneity: (Math.random() * 0.4 + 0.2).toFixed(2),
            sphericity: (Math.random() * 0.2 + 0.75).toFixed(2),
            entropy: (Math.random() * 1.5 + 4.5).toFixed(2),
            marginCoverage: hasImages ? (Math.random() * 10 + 90).toFixed(1) + "%" : "N/A",
            needleAccuracy: hasImages ? (Math.random() * 5 + 95).toFixed(1) + "%" : "N/A",
            completeness: hasImages ? (Math.random() * 8 + 92).toFixed(1) + "%" : "N/A",
            aiRecommendation: elapsedTime < 60 ? "Insufficient coverage" : "Optimal ablation achieved"
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, elapsedTime, modality, isCryo]);

  const currentReading = data[data.length - 1] || { probe1: 37, probe2: 37, probe3: 37, probe4: 37 };
  const extremeTemp = isCryo 
    ? Math.min(currentReading.probe1, currentReading.probe2, currentReading.probe3, currentReading.probe4)
    : Math.max(currentReading.probe1, currentReading.probe2, currentReading.probe3, currentReading.probe4);
  
  const isCritical = isCryo ? extremeTemp < config.criticalTemp : extremeTemp > config.criticalTemp;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsMonitoring(true);
    if (data.length === 0) {
      setData([{ time: 0, probe1: 37, probe2: 37, probe3: 37, probe4: 37 }]);
    }
  };

  const handleStop = () => {
    setIsMonitoring(false);
  };

  const handleReset = () => {
    setIsMonitoring(false);
    setData([]);
    setElapsedTime(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-rose-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ThermaZone</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Ablation Assessment System</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('monitor')}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === 'monitor' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Monitor
            </button>
            <button 
              onClick={() => setActiveTab('radiomics')}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === 'radiomics' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Radiomics AI
            </button>
            <button 
              onClick={() => setActiveTab('hardware')}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === 'hardware' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Hardware
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              privacyMode ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
            )}>
              {privacyMode ? "HIPAA Secure" : "Privacy Off"}
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Stats & Controls */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Procedure Setup</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Modality</label>
                    <select 
                      value={modality} 
                      onChange={(e) => setModality(e.target.value as Modality)}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                    >
                      <option value="RFA">RFA (Radiofrequency)</option>
                      <option value="MWA">MWA (Microwave)</option>
                      <option value="CRYO">CRYO (Cryoablation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Organ</label>
                    <select 
                      value={organ} 
                      onChange={(e) => setOrgan(e.target.value as Organ)}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                    >
                      <option value="Liver">Liver</option>
                      <option value="Lung">Lung</option>
                      <option value="Kidney">Kidney</option>
                      <option value="Bone">Bone</option>
                    </select>
                  </div>

                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-3xl font-mono font-bold text-slate-900">{formatTime(elapsedTime)}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Elapsed Time</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {!isMonitoring ? (
                      <button 
                        onClick={handleStart}
                        className="col-span-2 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-rose-200"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Start Monitoring
                      </button>
                    ) : (
                      <button 
                        onClick={handleStop}
                        className="col-span-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        Stop
                      </button>
                    )}
                    <button 
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-bold transition-all">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <StatCard 
                  title={isCryo ? "Minimum Temp" : "Peak Temperature"} 
                  value={extremeTemp.toFixed(1)} 
                  unit="°C" 
                  icon={Thermometer} 
                  color={isCryo ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}
                  trend={isMonitoring ? (isCryo ? -25 : 12) : 0}
                />
                <StatCard 
                  title={isCryo ? "Ice Ball Volume" : "Ablation Volume"} 
                  value={(Math.pow(Math.abs(extremeTemp - AMBIENT_TEMP) / 40, 3) * 0.5).toFixed(1)} 
                  unit="cm³" 
                  icon={Layers} 
                  color="bg-amber-50 text-amber-600"
                />
              </div>

              {isCritical && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 items-start"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Lethal Threshold</h4>
                    <p className="text-xs text-rose-700 mt-1">
                      {isCryo 
                        ? "Temperature below -40°C. Ice ball core reached lethal zone." 
                        : "Temperature exceeds 60°C. Immediate coagulation necrosis likely."}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Guidelines (CIRSE/SIR/ACR)</h3>
                <ul className="space-y-2">
                  {GUIDELINES[organ].map((g, i) => (
                    <li key={i} className="text-[10px] text-slate-600 leading-tight flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-1 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Middle Column: Visualization */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-rose-600" />
                    Spatial Assessment
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">VIEW: 2D AXIAL</span>
                  </div>
                </div>
                
                <HeatmapVisualizer data={currentReading} modality={modality} />
                
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Probe {i}</span>
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        isCryo 
                          ? ((currentReading as any)[`probe${i}`] < config.criticalTemp ? "text-blue-600" : (currentReading as any)[`probe${i}`] < config.targetTemp ? "text-sky-500" : "text-slate-600")
                          : ((currentReading as any)[`probe${i}`] > config.criticalTemp ? "text-rose-600" : (currentReading as any)[`probe${i}`] > config.targetTemp ? "text-amber-600" : "text-slate-600")
                      )}>
                        {(currentReading as any)[`probe${i}`].toFixed(1)}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Chart */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600" />
                    Thermal Kinetics
                  </h2>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="time" 
                        hide 
                      />
                      <YAxis 
                        domain={isCryo ? [-80, 40] : [30, 100]} 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickFormatter={(v) => `${v}°`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="probe1" name="P1 (Proximal)" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="probe2" name="P2 (Distal)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="probe3" name="P3 (Lateral L)" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="probe4" name="P4 (Lateral R)" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3 text-blue-500" />
                    Clinical Insight
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The current heating rate is <span className="font-bold text-slate-900">~0.8°C/sec</span>. 
                    Target zone coverage is estimated at <span className="font-bold text-slate-900">84%</span>. 
                    Maintain current power for 45 more seconds to ensure complete margin ablation.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'radiomics' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Radiomics & Image Fusion Engine</h2>
                    <p className="text-slate-500">Multi-phase CT fusion with real-time thermal monitoring and AI feature extraction.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setFusionEnabled(!fusionEnabled)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                      fusionEnabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {fusionEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    FUSION: {fusionEnabled ? "ON" : "OFF"}
                  </button>
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <RefreshCw className={cn("w-4 h-4", isMonitoring && "animate-spin")} />
                    ENGINE: ACTIVE
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Image Fusion Viewport */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-4 aspect-video relative overflow-hidden border border-slate-800 shadow-2xl">
                    {/* Background CT Image (Simulated) */}
                    <div className="absolute inset-0 opacity-40">
                      <img 
                        src={`https://picsum.photos/seed/ct-${activeImage}-${organ}/1200/800?grayscale`} 
                        alt="CT Scan"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Thermal Overlay (Only if fusion enabled) */}
                    {fusionEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-80 mix-blend-screen">
                        <div className="w-[60%] aspect-square">
                           <HeatmapVisualizer data={currentReading} modality={modality} transparent />
                        </div>
                      </div>
                    )}

                    {/* AI Annotation Layer */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Needle Path */}
                        <line x1="10" y1="10" x2="50" y2="50" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 1" />
                        <circle cx="50" cy="50" r="1" fill="#ef4444" />
                        
                        {/* Lesion Boundary */}
                        <ellipse cx="50" cy="50" rx="15" ry="12" fill="none" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="1 1" />
                        
                        {/* Labels */}
                        <text x="12" y="12" fill="#ef4444" fontSize="2" fontWeight="bold">NEEDLE TRAJECTORY</text>
                        <text x="35" y="38" fill="#3b82f6" fontSize="2" fontWeight="bold">TARGET LESION</text>
                      </svg>
                    </div>

                    {/* Viewport Controls */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {(['pre', 'intra', 'post'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setActiveImage(type)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                            activeImage === type ? "bg-indigo-600 text-white" : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
                          )}
                        >
                          {type} Procedure
                        </button>
                      ))}
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                       <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase">Registration Error</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">0.42mm</span>
                       </div>
                    </div>
                  </div>

                  {/* Image Import Section */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['pre', 'intra', 'post'] as const).map(type => (
                      <div 
                        key={type} 
                        onClick={() => setImages(prev => ({ ...prev, [type]: 'loaded' }))}
                        className={cn(
                          "p-4 rounded-2xl border transition-all group cursor-pointer text-center",
                          images[type] 
                            ? "bg-emerald-50 border-emerald-200" 
                            : "bg-slate-50 border-slate-200 border-dashed hover:border-indigo-300"
                        )}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {images[type] ? (
                            <div className="bg-emerald-500 p-1 rounded-full">
                              <RefreshCw className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          )}
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            images[type] ? "text-emerald-700" : "text-slate-500"
                          )}>
                            {images[type] ? `${type} CT Loaded` : `Import ${type} CT`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Analysis Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Ablation Efficacy
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { label: 'Margin Coverage', value: radiomicsData?.marginCoverage || 'N/A', icon: Crosshair },
                        { label: 'Needle Accuracy', value: radiomicsData?.needleAccuracy || 'N/A', icon: Target },
                        { label: 'Completeness', value: radiomicsData?.completeness || 'N/A', icon: FileText },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <m.icon className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">{m.label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Texture Features</h4>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-white rounded-lg border border-slate-100">
                             <span className="block text-[8px] text-slate-500 uppercase">Heterogeneity</span>
                             <span className="text-xs font-bold text-indigo-600">{radiomicsData?.heterogeneity || '0.00'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-100">
                             <span className="block text-[8px] text-slate-500 uppercase">Entropy</span>
                             <span className="text-xs font-bold text-indigo-600">{radiomicsData?.entropy || '0.00'}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-200">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI Recommendation
                    </h3>
                    <p className="text-indigo-100 text-xs leading-relaxed font-medium">
                      {radiomicsData?.aiRecommendation || "Awaiting data fusion for clinical recommendation..."}
                    </p>
                    <button className="w-full mt-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">
                      Generate Full Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">HIPAA Compliance:</span> Image fusion is performed on-device. The Python radiomics engine processes anonymized feature vectors only. No DICOM metadata containing PHI is transmitted.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hardware' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 p-3 rounded-2xl">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Open Source Hardware Guide</h2>
                  <p className="text-slate-500">Low-cost components for building a real-time thermal ablation interface.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                    Recommended Bill of Materials
                  </h3>
                  <div className="space-y-3">
                    {HARDWARE_SUGGESTIONS.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="block font-bold text-slate-900 text-sm">{item.item}</span>
                          <span className="text-xs text-slate-500">{item.purpose}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-blue-600">{item.approxPrice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Estimated Cost</span>
                    <span className="block text-2xl font-bold text-emerald-900 mt-1">~$35 - $50</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                    System Architecture
                  </h3>
                  <div className="relative p-6 bg-slate-900 rounded-2xl border border-slate-800 aspect-square flex items-center justify-center">
                    <div className="space-y-4 w-full max-w-[200px]">
                      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-[10px] font-bold text-slate-300">
                        THERMOCOUPLE PROBES (x4)
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0.5 h-4 bg-slate-700" />
                      </div>
                      <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-lg text-center text-[10px] font-bold text-blue-200">
                        MAX31855 AMPLIFIERS
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0.5 h-4 bg-slate-700" />
                      </div>
                      <div className="p-3 bg-rose-900/50 border border-rose-700 rounded-lg text-center text-[10px] font-bold text-rose-200">
                        RASPBERRY PI PICO W
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0.5 h-4 bg-slate-700" />
                      </div>
                      <div className="p-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-center text-[10px] font-bold text-emerald-200">
                        THIS WEB APP (via Wi-Fi/Serial)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Implementation Tips</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <p>Use <span className="font-bold text-slate-900">Micro-Python</span> on the Pico for rapid prototyping. It has excellent libraries for SPI communication with MAX31855.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                    <p>For data transmission, use <span className="font-bold text-slate-900">WebSockets</span> or a simple <span className="font-bold text-slate-900">HTTP POST</span> to a backend, or use the <span className="font-bold text-slate-900">Web Serial API</span> to connect directly via USB.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p>Shield your thermocouple wires. RFA and Microwave generators produce significant EMI that can interfere with low-voltage sensor readings.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No Procedure History</h2>
            <p className="text-slate-500 mt-2">Completed procedures will appear here for review and export.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-xs font-medium">
            © 2026 ThermaZone Open Source Project. For research use only.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">Documentation</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">Safety Protocols</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
